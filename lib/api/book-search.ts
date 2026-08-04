/**
 * 책 검색 API 클라이언트 (알라딘 주력 + Google Books 폴백)
 *
 * 2026-08-04: 네이버 책 검색 API가 종료되어(book.json·book_adv.json 모두 SE05
 * "존재하지 않는 검색 api", 같은 키로 encyc.json 은 정상) 소스를 교체했다.
 *
 * 우선순위:
 *   1. 알라딘 ItemSearch — 한국 도서 커버리지/표지 품질이 가장 좋다(일 5,000회)
 *   2. Google Books — 알라딘이 0건일 때만. 해외 도서를 메운다
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
  source: "aladin" | "google_books" | null;
}

export interface BookSearchParams {
  query: string;
  display?: number;
  start?: number;
}

/** 알라딘 MaxResults 상한 */
const ALADIN_MAX_RESULTS = 50;
/** Google Books maxResults 상한 */
const GOOGLE_MAX_RESULTS = 40;

interface AladinSearchResponse {
  totalResults?: number;
  startIndex?: number;
  itemsPerPage?: number;
  item?: Array<{
    title?: string;
    author?: string;
    publisher?: string;
    pubDate?: string;
    isbn?: string;
    isbn13?: string;
    cover?: string;
    description?: string;
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

/**
 * 알라딘 검색.
 * 네이버식 start(1-based 아이템 인덱스)를 알라딘의 페이지 번호로 환산한다.
 */
async function searchAladin(
  query: string,
  display: number,
  start: number,
): Promise<BookSearchResponse | null> {
  const ttbKey = process.env.ALADIN_TTB_KEY;
  if (!ttbKey) return null;

  const maxResults = Math.min(display, ALADIN_MAX_RESULTS);
  const page = Math.floor((start - 1) / maxResults) + 1;

  const url = new URL("https://www.aladin.co.kr/ttb/api/ItemSearch.aspx");
  url.searchParams.append("ttbkey", ttbKey);
  url.searchParams.append("Query", query);
  url.searchParams.append("QueryType", "Keyword");
  url.searchParams.append("MaxResults", maxResults.toString());
  url.searchParams.append("start", page.toString());
  url.searchParams.append("SearchTarget", "Book");
  url.searchParams.append("Cover", "Big");
  url.searchParams.append("output", "js");
  url.searchParams.append("Version", "20131101");

  const response = await withRetry(
    async () => {
      const res = await fetch(url.toString(), {
        next: { revalidate: 3600 }, // 1시간 캐시
      });
      if (!res.ok) throw new Error(`알라딘 API 호출 실패: ${res.status}`);
      return res;
    },
    { maxRetries: 2, initialDelay: 300 },
  );

  const data: AladinSearchResponse = await response.json();
  if (!Array.isArray(data.item)) return null;

  const items: BookSearchItem[] = data.item.map((it) => ({
    title: it.title ?? "",
    author: it.author ?? "",
    publisher: it.publisher ?? "",
    pubdate: it.pubDate ?? "",
    isbn: it.isbn13 || it.isbn || "",
    image: toHttps(it.cover),
    description: it.description ?? "",
  }));

  return {
    total: data.totalResults ?? items.length,
    start,
    display: items.length,
    items,
    source: "aladin",
  };
}

/** Google Books 검색 — 알라딘이 0건일 때만 호출한다(해외 도서 보강). */
async function searchGoogleBooks(
  query: string,
  display: number,
  start: number,
): Promise<BookSearchResponse | null> {
  const maxResults = Math.min(display, GOOGLE_MAX_RESULTS);

  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.append("q", query);
  url.searchParams.append("maxResults", maxResults.toString());
  url.searchParams.append("startIndex", Math.max(0, start - 1).toString());
  url.searchParams.append("country", "KR");
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (apiKey) url.searchParams.append("key", apiKey);

  const response = await withRetry(
    async () => {
      const res = await fetch(url.toString(), {
        next: { revalidate: 3600 },
      });
      if (!res.ok) throw new Error(`Google Books API 호출 실패: ${res.status}`);
      return res;
    },
    { maxRetries: 2, initialDelay: 300 },
  );

  const data: GoogleBooksSearchResponse = await response.json();
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
      image: toHttps(v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail),
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

/**
 * 책 검색 — 알라딘 우선, 결과가 없으면 Google Books.
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
  const empty: BookSearchResponse = {
    total: 0,
    start,
    display: 0,
    items: [],
    source: null,
  };

  let aladinFailed = false;
  try {
    const aladin = await searchAladin(trimmed, display, start);
    if (aladin && aladin.items.length > 0) return aladin;
  } catch (error) {
    aladinFailed = true;
    console.warn("[BookSearch] 알라딘 실패, Google Books 로 폴백:", error);
  }

  try {
    const google = await searchGoogleBooks(trimmed, display, start);
    if (google && google.items.length > 0) return google;
  } catch (error) {
    console.warn("[BookSearch] Google Books 실패:", error);
    // 두 소스 모두 장애면 "결과 없음"이 아니라 장애로 알린다.
    if (aladinFailed) {
      throw new Error("검색 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  }

  return empty;
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
 * 알라딘은 "2016-07-25", Google Books 는 "2016-07-25"/"2016-07"/"2016" 을 섞어 준다.
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
