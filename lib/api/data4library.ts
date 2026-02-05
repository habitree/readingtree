/**
 * 도서관 정보나루(data4library) API 래퍼
 *
 * 공공도서관 대출 데이터 기반 인기 도서/추천 도서 조회
 * @see https://www.data4library.kr/apiDoc
 */

import { XMLParser } from "fast-xml-parser";
import { withRetry } from "@/lib/utils/retry";
import type {
  PopularBooksOptions,
  PopularBookItem,
  PopularBook,
  RecommendedBooksOptions,
  RecommendedBookItem,
  RecommendedBook,
} from "./data4library-types";

// ============================================
// 상수 및 설정
// ============================================

const API_BASE_URL = "https://data4library.kr/api";
const DEFAULT_TIMEOUT = 10000; // 10초
const CACHE_REVALIDATE = 3600; // 1시간 (초)

/** XML 파서 인스턴스 (설정 공유) */
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseTagValue: true,
  trimValues: true,
});

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 환경변수에서 API 키 가져오기
 */
function getAuthKey(providedKey?: string): string {
  const key = providedKey || process.env.DATA4LIBRARY_AUTH_KEY;
  if (!key) {
    throw new Error("[data4library] DATA4LIBRARY_AUTH_KEY 환경변수가 설정되지 않았습니다.");
  }
  return key;
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * n일 전 날짜 계산
 */
function getDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * 배열 또는 단일 항목을 배열로 변환
 */
function ensureArray<T>(item: T | T[] | undefined | null): T[] {
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

// ============================================
// 인기대출도서 API
// ============================================

/**
 * 인기대출도서 조회 (도서관 정보나루 API)
 *
 * @param options 조회 옵션
 * @returns 인기도서 목록
 *
 * @example
 * ```ts
 * // 최근 7일간 전국 인기도서 10권
 * const books = await fetchPopularBooks();
 *
 * // 서울 지역 문학 분야 인기도서
 * const books = await fetchPopularBooks({
 *   region: "11",
 *   kdc: "8",
 *   pageSize: 20
 * });
 * ```
 */
export async function fetchPopularBooks(
  options: PopularBooksOptions = {}
): Promise<PopularBook[]> {
  const authKey = getAuthKey(options.authKey);

  // 기본값: 최근 7일
  const endDt = options.endDt || formatDate(new Date());
  const startDt = options.startDt || formatDate(getDaysAgo(7));

  const params = new URLSearchParams({
    authKey,
    startDt,
    endDt,
    pageNo: String(options.pageNo ?? 1),
    pageSize: String(options.pageSize ?? 10),
    format: "xml",
  });

  // 선택적 파라미터 추가
  if (options.region) params.append("region", options.region);
  if (options.dtl_region) params.append("dtl_region", options.dtl_region);
  if (options.searchType) params.append("searchType", options.searchType);
  if (options.gender) params.append("gender", options.gender);
  if (options.age) params.append("age", options.age);
  if (options.kdc) params.append("kdc", options.kdc);

  const url = `${API_BASE_URL}/loanItemSrch?${params.toString()}`;

  try {
    const response = await withRetry(
      async () => {
        const res = await fetch(url, {
          headers: { Accept: "application/xml" },
          next: { revalidate: CACHE_REVALIDATE },
          signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
        });

        if (!res.ok) {
          throw new Error(`[data4library] API 오류: ${res.status} ${res.statusText}`);
        }

        return res;
      },
      { maxRetries: 2, initialDelay: 300 }
    );

    const xmlText = await response.text();
    const parsed = xmlParser.parse(xmlText);

    // 응답 구조 확인
    if (!parsed.response) {
      console.warn("[data4library] 응답에 response 필드가 없습니다:", xmlText.substring(0, 200));
      return [];
    }

    const docs = parsed.response.docs?.doc;
    if (!docs) {
      console.log("[data4library] 인기도서 결과 없음");
      return [];
    }

    const items = ensureArray<PopularBookItem>(docs);

    return items.map((item, index) => transformPopularBookItem(item, index + 1));
  } catch (error) {
    console.error("[data4library] 인기도서 조회 오류:", error);
    throw error;
  }
}

/**
 * 급상승 도서 조회 (주간 증감 기준)
 */
export async function fetchTrendingBooks(
  options: Omit<PopularBooksOptions, "searchType"> = {}
): Promise<PopularBook[]> {
  return fetchPopularBooks({
    ...options,
    searchType: "2", // 주간증감순
  });
}

/**
 * 연령대별 인기도서 조회
 */
export async function fetchPopularBooksByAge(
  age: string,
  options: Omit<PopularBooksOptions, "age"> = {}
): Promise<PopularBook[]> {
  return fetchPopularBooks({
    ...options,
    age,
  });
}

/**
 * 주제분류별 인기도서 조회
 */
export async function fetchPopularBooksByCategory(
  kdc: string,
  options: Omit<PopularBooksOptions, "kdc"> = {}
): Promise<PopularBook[]> {
  return fetchPopularBooks({
    ...options,
    kdc,
  });
}

// ============================================
// 추천도서 API
// ============================================

/**
 * ISBN 기반 추천도서 조회
 *
 * @param options 조회 옵션
 * @returns 추천도서 목록
 *
 * @example
 * ```ts
 * // 특정 ISBN과 관련된 추천도서 5권
 * const recommendations = await fetchRecommendedBooksByIsbn({
 *   isbn13: "9788936434120",
 *   count: 5
 * });
 * ```
 */
export async function fetchRecommendedBooksByIsbn(
  options: RecommendedBooksOptions
): Promise<RecommendedBook[]> {
  const authKey = getAuthKey(options.authKey);

  const params = new URLSearchParams({
    authKey,
    isbn13: options.isbn13,
    format: "xml",
  });

  // 추천 유형에 따른 API 엔드포인트
  const endpoint = options.type === "related" ? "recommandList" : "recommandList";
  const url = `${API_BASE_URL}/${endpoint}?${params.toString()}`;

  try {
    const response = await withRetry(
      async () => {
        const res = await fetch(url, {
          headers: { Accept: "application/xml" },
          next: { revalidate: CACHE_REVALIDATE },
          signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
        });

        if (!res.ok) {
          throw new Error(`[data4library] API 오류: ${res.status} ${res.statusText}`);
        }

        return res;
      },
      { maxRetries: 2, initialDelay: 300 }
    );

    const xmlText = await response.text();
    const parsed = xmlParser.parse(xmlText);

    if (!parsed.response) {
      console.warn("[data4library] 응답에 response 필드가 없습니다");
      return [];
    }

    const docs = parsed.response.docs?.doc;
    if (!docs) {
      console.log("[data4library] 추천도서 결과 없음");
      return [];
    }

    const items = ensureArray<RecommendedBookItem>(docs);
    const count = options.count ?? 5;

    return items.slice(0, count).map(transformRecommendedBookItem);
  } catch (error) {
    console.error("[data4library] 추천도서 조회 오류:", error);
    throw error;
  }
}

// ============================================
// 마니아 추천도서 API (인기도서 + 연령대 필터)
// ============================================

/**
 * 마니아(독서가) 추천도서 조회
 * 특정 연령대에서 인기 있지만 전체 순위가 높지 않은 도서를 "마니아 추천"으로 분류
 */
export async function fetchManiaBooks(
  options: Omit<PopularBooksOptions, "age"> = {}
): Promise<PopularBook[]> {
  // 30~40대 독자들의 인기도서 (주로 깊이 있는 독서 선호)
  const [thirties, forties] = await Promise.all([
    fetchPopularBooks({ ...options, age: "30", pageSize: 20 }),
    fetchPopularBooks({ ...options, age: "40", pageSize: 20 }),
  ]);

  // 두 그룹에서 공통으로 인기 있는 도서 우선
  const combinedMap = new Map<string, PopularBook & { score: number }>();

  thirties.forEach((book) => {
    combinedMap.set(book.isbn13, { ...book, score: 11 - book.ranking }); // 순위 역순 점수
  });

  forties.forEach((book) => {
    const existing = combinedMap.get(book.isbn13);
    if (existing) {
      existing.score += 11 - book.ranking; // 공통 도서는 점수 합산
    } else {
      combinedMap.set(book.isbn13, { ...book, score: 11 - book.ranking });
    }
  });

  // 점수순 정렬 후 상위 10개
  const sorted = Array.from(combinedMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, options.pageSize ?? 10);

  // ranking 재설정
  return sorted.map((book, index) => ({
    ranking: index + 1,
    isbn13: book.isbn13,
    title: book.title,
    author: book.author,
    publisher: book.publisher,
    publicationYear: book.publicationYear,
    coverImageUrl: book.coverImageUrl,
    loanCount: book.loanCount,
    category: book.category,
    source: "data4library" as const,
  }));
}

// ============================================
// 변환 함수
// ============================================

/**
 * API 응답을 프론트엔드용 인기도서 타입으로 변환
 */
function transformPopularBookItem(item: PopularBookItem, fallbackRanking: number): PopularBook {
  return {
    ranking: item.no || fallbackRanking,
    isbn13: String(item.isbn13 || ""),
    title: item.bookname || "",
    author: item.authors || "",
    publisher: item.publisher || "",
    publicationYear: item.publication_year || undefined,
    coverImageUrl: item.bookImageURL || undefined,
    loanCount: item.loan_count || 0,
    category: item.class_nm || undefined,
    source: "data4library",
  };
}

/**
 * API 응답을 프론트엔드용 추천도서 타입으로 변환
 */
function transformRecommendedBookItem(item: RecommendedBookItem): RecommendedBook {
  return {
    isbn13: String(item.isbn13 || ""),
    title: item.bookname || "",
    author: item.authors || "",
    publisher: item.publisher || "",
    publicationYear: item.publication_year || undefined,
    coverImageUrl: item.bookImageURL || undefined,
    recommendScore: item.recommendScore,
    source: "data4library",
  };
}

// ============================================
// 헬퍼: 표지 이미지 보강
// ============================================

/**
 * 표지 이미지가 없는 도서에 대해 네이버 API로 보강
 * (선택적 - 호출 시 추가 API 비용 발생)
 */
export async function enrichBooksWithCovers(
  books: PopularBook[],
  searchFn?: (isbn: string) => Promise<string | null>
): Promise<PopularBook[]> {
  if (!searchFn) return books;

  return Promise.all(
    books.map(async (book) => {
      if (book.coverImageUrl) return book;

      try {
        const coverUrl = await searchFn(book.isbn13);
        return coverUrl ? { ...book, coverImageUrl: coverUrl } : book;
      } catch {
        return book;
      }
    })
  );
}
