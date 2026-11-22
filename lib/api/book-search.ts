/**
 * 책 검색 API 클라이언트 (카카오 → 국립중앙도서관 → Google Books)
 *
 * 2026-08-04: 네이버 책 검색 API 종료(SE05)로 알라딘+Google Books 로 교체.
 * 2026-11-18: 알라딘 OpenAPI 도 2026-11-01 종료(errorCode 999 "www.aladin.co.kr 도메인을
 *   통한 OpenAPI서비스는 종료"). 이후 모든 검색이 Google Books 로만 처리돼 한국 도서
 *   결과가 엉뚱하고 표지·출판사가 비는 문제가 생겨 소스를 다시 교체했다.
 *
 * 우선순위 (앞 소스가 0건이거나 장애일 때만 다음 소스로):
 *   1. 카카오 책 검색 — KAKAO_REST_API_KEY 가 있을 때만. 표지·메타데이터 품질 최상
 *   2. 국립중앙도서관 소장자료 검색 — NL_SEOJI_CERT_KEY. 한국 도서 정확도는 좋지만
 *      표지가 일부만 있어, 표지 없는 건은 Google Books 에서 ISBN 으로 보충한다.
 *      소장자료는 신간이 수개월 늦게 잡혀, 첫 페이지는 서지(ISBN 등록) API 로 신간을 보충한다
 *   3. Google Books — 해외 도서 보강
 *
 * 표지는 소스와 무관하게, 비어 있으면 Google Books → 교보문고 순으로 ISBN 보충한다.
 *
 * 반환 형태는 종전 네이버 클라이언트와 같은 모양을 유지해 호출부 변경을 최소화한다.
 */

import { withRetry } from "@/lib/utils/retry";

/** 검색 결과 한 건 (소스 무관 공통 형태) */
export interface BookSearchItem {
  title: string;
  author: string;
  publisher: string;
  /** 출간일 — 소스별 표기가 달라 원본 문자열 그대로 담고 변환은 transformBookItem 에서 한다 */
  pubdate: string;
  isbn: string;
  image: string;
  description: string;
}

export interface BookSearchResponse {
  total: number;
  start: number;
  display: number;
  items: BookSearchItem[];
  /** 결과를 채운 소스 — 로깅/디버깅용 */
  source: "kakao" | "nl" | "google_books" | null;
}

export interface BookSearchParams {
  query: string;
  display?: number;
  start?: number;
}

/** 카카오 size 상한 */
const KAKAO_MAX_RESULTS = 50;
/** 국중도 pageSize 상한 (문서상 제한은 없지만 응답 지연을 막기 위해) */
const NL_MAX_RESULTS = 50;
/** Google Books maxResults 상한 */
const GOOGLE_MAX_RESULTS = 40;
/** 서지 API 조회 건수 — 최신순 상위에서 제목 일치 건만 추려 쓰므로 UI 요청 건수와 분리한다 */
const NL_SEOJI_PAGE_SIZE = 50;
/** 서지 API 신간 보충 최대 건수 */
const NL_SEOJI_MAX_FRESH = 3;
/** 국중도 표지 이미지 호스트 (응답의 imageUrl 은 상대 경로) */
const NL_COVER_BASE = "https://cover.nl.go.kr/";

interface KakaoBookSearchResponse {
  meta?: { total_count?: number };
  documents?: Array<{
    title?: string;
    contents?: string;
    isbn?: string;
    datetime?: string;
    authors?: string[];
    publisher?: string;
    thumbnail?: string;
  }>;
}

interface NlSearchResponse {
  total?: number | string;
  result?: Array<{
    titleInfo?: string;
    authorInfo?: string;
    pubInfo?: string;
    pubYearInfo?: string;
    isbn?: string;
    imageUrl?: string;
  }>;
}

interface NlSeojiSearchResponse {
  docs?: Array<{
    TITLE?: string;
    AUTHOR?: string;
    PUBLISHER?: string;
    EA_ISBN?: string;
    FORM?: string;
    REAL_PUBLISH_DATE?: string;
    PUBLISH_PREDATE?: string;
    TITLE_URL?: string;
  }>;
}

interface GoogleBooksSearchResponse {
  totalItems?: number;
  items?: Array<{
    volumeInfo?: {
      title?: string;
      subtitle?: string;
      authors?: string[];
      publisher?: string;
      publishedDate?: string;
      description?: string;
      industryIdentifiers?: Array<{ type: string; identifier: string }>;
      imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    };
  }>;
}

/** http 표지 URL 을 https 로 (Mixed Content 방지) */
function toHttps(url: string | undefined): string {
  if (!url) return "";
  return url.startsWith("http://") ? url.replace("http://", "https://") : url;
}

/** Google 표지: https 로 바꾸고 책장 넘김 효과(edge=curl)를 제거한다 */
function normalizeGoogleCover(url: string | undefined): string {
  return toHttps(url).replace(/&edge=curl/g, "");
}

/** HTML 태그·주요 엔티티 제거 (국중도 titleInfo 는 검색어 하이라이트 span 을 포함) */
function stripHtml(text: string | undefined): string {
  if (!text) return "";
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * 국중도 저자 표기 정리.
 * "지은이: 한강" / "자청[1987-] 지은이" / "하워드 F. 리먼 지음;김이숙 옮김" → 대표 저자만.
 */
function cleanNlAuthor(raw: string | undefined): string {
  if (!raw) return "";
  const first = stripHtml(raw).split(";")[0];
  return first
    .replace(/\[[^\]]*\]/g, "")
    .replace(/^\s*((지은이|저자|글)\s*)?:\s*/, "")
    .replace(/\s+(지음|지은이|저|著|엮음|편저|편|글)\s*$/, "")
    .trim();
}

/**
 * 국중도 출판사 표기 정리.
 * "파주 : 창비, 2007" 처럼 발행지·연도가 붙은 서지 형식만 출판사명으로 줄인다.
 * "허밍버드 : 백도씨"(임프린트 : 출판사)는 그대로 둔다.
 */
function cleanNlPublisher(raw: string | undefined): string {
  if (!raw) return "";
  const text = stripHtml(raw);
  const m = text.match(/^[^:]+:\s*(.+?),\s*\d{4,8}$/);
  return (m ? m[1] : text).trim();
}

/** 카카오 ISBN "8936433598 9788936433598" → 13자리 우선 */
function pickKakaoIsbn(raw: string | undefined): string {
  const parts = (raw ?? "").split(/\s+/).filter(Boolean);
  return parts.find((p) => p.length === 13) ?? parts[0] ?? "";
}

/** 같은 책의 중복 서지(국중도는 소장 레코드별로 중복 반환) 제거 — ISBN 기준 */
function dedupeByIsbn(items: BookSearchItem[]): BookSearchItem[] {
  const seen = new Set<string>();
  return items.filter((it) => {
    if (!it.isbn) return true;
    if (seen.has(it.isbn)) return false;
    seen.add(it.isbn);
    return true;
  });
}

async function fetchJson<T>(url: string, init: RequestInit & { next?: { revalidate: number } }, label: string): Promise<T> {
  const response = await withRetry(
    async () => {
      const res = await fetch(url, init);
      if (!res.ok) throw new Error(`${label} API 호출 실패: ${res.status}`);
      return res;
    },
    { maxRetries: 2, initialDelay: 300 },
  );
  return (await response.json()) as T;
}

/** 카카오 책 검색 — 키가 없으면 건너뛴다(null). */
async function searchKakao(
  query: string,
  display: number,
  start: number,
): Promise<BookSearchResponse | null> {
  const restKey = process.env.KAKAO_REST_API_KEY;
  if (!restKey) return null;

  const size = Math.min(display, KAKAO_MAX_RESULTS);
  const page = Math.floor((start - 1) / size) + 1;

  const url = new URL("https://dapi.kakao.com/v3/search/book");
  url.searchParams.append("query", query);
  url.searchParams.append("size", size.toString());
  url.searchParams.append("page", page.toString());

  const data = await fetchJson<KakaoBookSearchResponse>(
    url.toString(),
    { headers: { Authorization: `KakaoAK ${restKey}` }, next: { revalidate: 3600 } },
    "카카오",
  );
  if (!Array.isArray(data.documents)) return null;

  const items: BookSearchItem[] = data.documents.map((d) => ({
    title: d.title ?? "",
    author: (d.authors ?? []).join(", "),
    publisher: d.publisher ?? "",
    pubdate: (d.datetime ?? "").slice(0, 10),
    isbn: pickKakaoIsbn(d.isbn),
    image: toHttps(d.thumbnail),
    description: d.contents ?? "",
  }));

  return {
    total: data.meta?.total_count ?? items.length,
    start,
    display: items.length,
    items,
    source: "kakao",
  };
}

/** 국립중앙도서관 소장자료 검색 (도서 카테고리) */
async function searchNl(
  query: string,
  display: number,
  start: number,
): Promise<BookSearchResponse | null> {
  const key = process.env.NL_SEOJI_CERT_KEY;
  if (!key) return null;

  const pageSize = Math.min(display, NL_MAX_RESULTS);
  const pageNum = Math.floor((start - 1) / pageSize) + 1;

  const url = new URL("https://www.nl.go.kr/NL/search/openApi/search.do");
  url.searchParams.append("key", key);
  url.searchParams.append("apiType", "json");
  url.searchParams.append("srchTarget", "total");
  url.searchParams.append("kwd", query);
  url.searchParams.append("category", "도서");
  url.searchParams.append("pageSize", pageSize.toString());
  url.searchParams.append("pageNum", pageNum.toString());

  // 첫 페이지에서만 서지(ISBN 등록) 정보로 신간을 보충한다 — 부가 기능이라 실패는 무시
  const [data, newBooks] = await Promise.all([
    fetchJson<NlSearchResponse>(url.toString(), { next: { revalidate: 3600 } }, "국립중앙도서관"),
    start === 1 ? searchNlSeojiNewBooks(key, query).catch(() => []) : Promise.resolve([]),
  ]);
  if (!Array.isArray(data.result) && newBooks.length === 0) return null;

  const holdings = dedupeByIsbn(
    (data.result ?? []).map((d) => ({
      title: stripHtml(d.titleInfo),
      author: cleanNlAuthor(d.authorInfo),
      publisher: cleanNlPublisher(d.pubInfo),
      pubdate: (d.pubYearInfo ?? "").trim(),
      isbn: (d.isbn ?? "").trim(),
      image: d.imageUrl ? NL_COVER_BASE + d.imageUrl.replace(/^\/+/, "") : "",
      description: "",
    })),
  );
  // 소장자료에 없는 신간만, 소장자료 결과를 밀어내지 않도록 상위 몇 건까지만 앞에 둔다
  const holdingIsbns = new Set(holdings.map((it) => it.isbn));
  const fresh = newBooks.filter((it) => !holdingIsbns.has(it.isbn)).slice(0, NL_SEOJI_MAX_FRESH);
  const items = dedupeByIsbn([...fresh, ...holdings]).slice(0, pageSize);

  await fillMissingCovers(items);

  return {
    total: Number(data.total) || items.length,
    start,
    display: items.length,
    items,
    source: "nl",
  };
}

/** 공백 제거·소문자 — 제목 일치 판정용 */
function compact(text: string): string {
  return text.replace(/\s+/g, "").toLowerCase();
}

/**
 * 국중도 서지(ISBN 등록) 검색으로 신간 보충.
 * 소장자료 검색은 납본·정리 후에야 잡혀 신간이 수개월 늦게 나온다(예: 2026-09-30 출간
 * "트렌드 코리아 2027"이 11월에도 0건). 서지는 출판사의 ISBN 등록 시점에 생겨 신간이 있다.
 * 대신 문제집·오디오북·전자책 노이즈가 많아, 종이책이면서 제목이 검색어로 시작하는 것만 쓴다.
 *
 * 2026-11-22: 정렬 없이 UI 요청 건수만큼만 받아, "트렌드 코리아" 같은 상위어로 검색하면
 * 2027 판이 응답 창 밖으로 밀려 끝내 0건이었다("트렌드 코리아 2027" 로 정확히 쳐야만 나왔다).
 * form 으로 서버에서 종이책만 받고, 출간일 역순으로 고정 건수를 받아 신간이 항상 창 안에 들어오게 한다.
 */
async function searchNlSeojiNewBooks(key: string, query: string): Promise<BookSearchItem[]> {
  const url = new URL("https://www.nl.go.kr/seoji/SearchApi.do");
  url.searchParams.append("cert_key", key);
  url.searchParams.append("result_style", "json");
  url.searchParams.append("page_no", "1");
  url.searchParams.append("page_size", NL_SEOJI_PAGE_SIZE.toString());
  url.searchParams.append("title", query);
  url.searchParams.append("form", "종이책");
  url.searchParams.append("sort", "PUBLISH_PREDATE");
  url.searchParams.append("order_by", "DESC");

  const data = await fetchJson<NlSeojiSearchResponse>(url.toString(), { next: { revalidate: 3600 } }, "국립중앙도서관 서지");
  const q = compact(query);
  // 출간일 역순이라 ISBN 만 선등록된 출간 예정작이 맨 위로 온다 — 아직 읽을 수 없는 책이라 뺀다 (KST 기준)
  const today = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, "");
  return (data.docs ?? [])
    .filter((d) => d.FORM === "종이책" && d.EA_ISBN && compact(stripHtml(d.TITLE)).startsWith(q))
    .filter((d) => (d.REAL_PUBLISH_DATE || d.PUBLISH_PREDATE || "").trim() <= today)
    .map((d) => ({
      title: stripHtml(d.TITLE),
      author: cleanNlAuthor(d.AUTHOR),
      publisher: cleanNlPublisher(d.PUBLISHER),
      pubdate: (d.REAL_PUBLISH_DATE || d.PUBLISH_PREDATE || "").trim(),
      isbn: (d.EA_ISBN ?? "").trim(),
      image: toHttps(d.TITLE_URL),
      description: "",
    }));
}

/** Google Books 요청 URL (country=KR 필수 — 없으면 지역 판별 실패로 결과가 빈다) */
function googleBooksUrl(q: string, maxResults: number, startIndex: number): string {
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.append("q", q);
  url.searchParams.append("maxResults", maxResults.toString());
  url.searchParams.append("startIndex", startIndex.toString());
  url.searchParams.append("country", "KR");
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (apiKey) url.searchParams.append("key", apiKey);
  return url.toString();
}

/** 교보문고 표지 원본 — 없는 ISBN 에는 404 를 주어 존재 확인에 쓸 수 있다 */
function kyoboCoverOrigin(isbn: string): string {
  return `https://contents.kyobobook.co.kr/pdt/${isbn}.jpg`;
}

/** 교보문고 표지 변환본 — 목록용 폭. 없는 ISBN 에도 대체 이미지를 200 으로 주므로 존재 확인에는 못 쓴다 */
function kyoboCoverThumb(isbn: string): string {
  return `https://contents.kyobobook.co.kr/sih/fit-in/458x0/pdt/${isbn}.jpg`;
}

/** 교보문고에 그 ISBN 표지가 있으면 목록용 URL, 없으면 빈 문자열 */
async function findKyoboCover(isbn: string): Promise<string> {
  const res = await fetch(kyoboCoverOrigin(isbn), { method: "HEAD", next: { revalidate: 86400 } });
  return res.ok ? kyoboCoverThumb(isbn) : "";
}

/**
 * 표지 없는 결과를 ISBN 으로 보충한다(제자리 수정). Google Books → 교보문고 순.
 * 국중도 서지로 끌어온 신간은 표지 URL 이 비어 있는데 Google Books 에도 한국 신간은
 * 없는 경우가 많아(예: "트렌드 코리아 2027") 교보문고를 뒤에 둔다.
 * 보충은 부가 기능이라 개별 실패는 무시한다. ISBN 단위로 하루 캐시해 쿼터를 아낀다.
 */
async function fillMissingCovers(items: BookSearchItem[]): Promise<void> {
  const targets = items.filter((it) => !it.image && it.isbn);
  await Promise.allSettled(
    targets.map(async (it) => {
      const res = await fetch(googleBooksUrl(`isbn:${it.isbn}`, 1, 0), { next: { revalidate: 86400 } });
      if (res.ok) {
        const data = (await res.json()) as GoogleBooksSearchResponse;
        const links = data.items?.[0]?.volumeInfo?.imageLinks;
        const cover = normalizeGoogleCover(links?.thumbnail ?? links?.smallThumbnail);
        if (cover) {
          it.image = cover;
          return;
        }
      }
      it.image = await findKyoboCover(it.isbn);
    }),
  );
}

/** Google Books 검색 — 앞선 소스가 모두 0건일 때만 호출한다(해외 도서 보강). */
async function searchGoogleBooks(
  query: string,
  display: number,
  start: number,
): Promise<BookSearchResponse | null> {
  const maxResults = Math.min(display, GOOGLE_MAX_RESULTS);
  const data = await fetchJson<GoogleBooksSearchResponse>(
    googleBooksUrl(query, maxResults, Math.max(0, start - 1)),
    { next: { revalidate: 3600 } },
    "Google Books",
  );
  if (!Array.isArray(data.items)) return null;

  const items: BookSearchItem[] = data.items.map((it) => {
    const v = it.volumeInfo ?? {};
    const ids = v.industryIdentifiers ?? [];
    const isbn =
      ids.find((i) => i.type === "ISBN_13")?.identifier ??
      ids.find((i) => i.type === "ISBN_10")?.identifier ??
      "";
    return {
      title: [v.title, v.subtitle].filter(Boolean).join(" - "),
      author: (v.authors ?? []).join(", "),
      publisher: v.publisher ?? "",
      pubdate: v.publishedDate ?? "",
      isbn,
      image: normalizeGoogleCover(v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail),
      description: v.description ?? "",
    };
  });

  return {
    total: data.totalItems ?? items.length,
    start,
    display: items.length,
    items,
    source: "google_books",
  };
}

const SOURCES = [
  { name: "카카오", search: searchKakao },
  { name: "국립중앙도서관", search: searchNl },
  { name: "Google Books", search: searchGoogleBooks },
] as const;

/**
 * 책 검색 — 카카오(키 있을 때) → 국립중앙도서관 → Google Books.
 * @param params 검색 파라미터
 */
export async function searchBooks(
  params: BookSearchParams,
): Promise<BookSearchResponse> {
  const { query, display = 10, start = 1 } = params;

  if (!query || query.trim().length === 0) {
    throw new Error("검색어를 입력해주세요.");
  }

  const trimmed = query.trim();
  let attempted = 0;
  let failed = 0;

  for (const source of SOURCES) {
    try {
      const result = await source.search(trimmed, display, start);
      if (result === null) continue; // 키 미설정 등 — 시도로 세지 않음
      attempted++;
      if (result && result.items.length > 0) return result;
    } catch (error) {
      attempted++;
      failed++;
      console.warn(`[BookSearch] ${source.name} 실패, 다음 소스로 폴백:`, error);
    }
  }

  // 시도한 소스가 모두 장애면 "결과 없음"이 아니라 장애로 알린다.
  if (attempted > 0 && failed === attempted) {
    throw new Error("검색 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
  }

  return { total: 0, start, display: 0, items: [], source: null };
}

/**
 * 검색 결과를 앱 내부 형식으로 변환
 */
export function transformBookItem(item: BookSearchItem) {
  const normalizedIsbn = item.isbn
    ? item.isbn.replace(/[-\s]/g, "").trim() || null
    : null;

  return {
    isbn: normalizedIsbn,
    title: item.title ? item.title.replace(/<[^>]*>/g, "").trim() : "",
    author: item.author ? item.author.trim() : null,
    publisher: item.publisher ? item.publisher.trim() : null,
    published_date: formatPubDate(item.pubdate),
    cover_image_url: item.image ? item.image.trim() : null,
  };
}

/**
 * 출간일 정규화 → YYYY-MM-DD.
 * 카카오는 ISO 일시(앞 10자 사용), 국중도는 "2007"/"20220331", Google Books 는
 * "2016-07-25"/"2016-07"/"2016" 을 섞어 준다.
 * 일 단위까지 확정된 값만 통과시킨다(부분 날짜를 임의로 1일로 채우지 않는다).
 */
function formatPubDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{8}$/.test(trimmed)) {
    return `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}`;
  }
  return null;
}
