/**
 * 책 페이지 수 조회 API 통합 모듈
 *
 * 복합 전략으로 여러 API를 순차적으로 조회하여 페이지 수를 가져옵니다.
 * 우선순위:
 * 1. 국립중앙도서관 ISBN서지정보 API (한국 도서 최고 커버리지)
 * 2. 알라딘 상품조회 API (한국 최대 온라인 서점)
 * 3. Google Books API (글로벌 폴백)
 */

import { withRetry } from "@/lib/utils/retry";

// ============================================
// 타입 정의
// ============================================

export interface PageCountResult {
  pageCount: number | null;
  source: "nl_seoji" | "aladin" | "google_books" | "manual" | null;
  error?: string;
}

interface NLSeojiResponse {
  docs?: Array<{
    EA_ISBN?: string;
    PAGE?: string;
    TITLE?: string;
    AUTHOR?: string;
  }>;
  TOTAL_COUNT?: string;
}

interface AladinItemResponse {
  item?: Array<{
    itemId?: number;
    title?: string;
    subInfo?: {
      itemPage?: number;
      packing?: {
        sizeDepth?: number;
      };
    };
  }>;
}

interface GoogleBooksResponse {
  items?: Array<{
    volumeInfo?: {
      title?: string;
      pageCount?: number;
      industryIdentifiers?: Array<{
        type: string;
        identifier: string;
      }>;
    };
  }>;
}

// ============================================
// ISBN 유틸리티
// ============================================

/**
 * ISBN 정규화 (하이픈, 공백 제거)
 */
export function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[-\s]/g, "").trim();
}

/**
 * ISBN-10을 ISBN-13으로 변환
 */
export function isbn10To13(isbn10: string): string | null {
  const normalized = normalizeIsbn(isbn10);
  if (normalized.length !== 10) return null;

  const prefix = "978" + normalized.slice(0, 9);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(prefix[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return prefix + checkDigit;
}

/**
 * ISBN-13을 ISBN-10으로 변환 (978 prefix만 지원)
 */
export function isbn13To10(isbn13: string): string | null {
  const normalized = normalizeIsbn(isbn13);
  if (normalized.length !== 13 || !normalized.startsWith("978")) return null;

  const base = normalized.slice(3, 12);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(base[i]) * (10 - i);
  }
  const checkDigit = (11 - (sum % 11)) % 11;
  return base + (checkDigit === 10 ? "X" : checkDigit.toString());
}

/**
 * ISBN 유효성 검사
 */
export function isValidIsbn(isbn: string): boolean {
  const normalized = normalizeIsbn(isbn);
  return normalized.length === 10 || normalized.length === 13;
}

// ============================================
// 국립중앙도서관 ISBN서지정보 API
// ============================================

/**
 * 국립중앙도서관 ISBN서지정보 API로 페이지 수 조회
 * @see https://www.nl.go.kr/NL/contents/N31101030500.do
 */
async function fetchFromNLSeoji(isbn: string): Promise<number | null> {
  const certKey = process.env.NL_SEOJI_CERT_KEY;
  if (!certKey) {
    console.warn("[PageCount] 국립중앙도서관 API 키가 설정되지 않았습니다.");
    return null;
  }

  const normalized = normalizeIsbn(isbn);

  // ISBN-10이면 ISBN-13으로 변환
  const isbn13 = normalized.length === 10 ? isbn10To13(normalized) : normalized;
  if (!isbn13) return null;

  const url = new URL("https://www.nl.go.kr/seoji/SearchApi.do");
  url.searchParams.append("cert_key", certKey);
  url.searchParams.append("result_style", "json");
  url.searchParams.append("page_no", "1");
  url.searchParams.append("page_size", "1");
  url.searchParams.append("isbn", isbn13);

  try {
    const response = await withRetry(
      async () => {
        const res = await fetch(url.toString(), {
          headers: { Accept: "application/json" },
          next: { revalidate: 86400 }, // 24시간 캐시
        });
        if (!res.ok) throw new Error(`NL Seoji API 오류: ${res.status}`);
        return res;
      },
      { maxRetries: 2, initialDelay: 300 }
    );

    const data: NLSeojiResponse = await response.json();

    if (data.docs && data.docs.length > 0) {
      const pageStr = data.docs[0].PAGE;
      if (pageStr) {
        // "320p", "320쪽", "320" 등 다양한 형식 처리
        const pageMatch = pageStr.match(/(\d+)/);
        if (pageMatch) {
          const pageCount = parseInt(pageMatch[1], 10);
          if (isValidPageCount(pageCount)) {
            console.log(`[PageCount] NL Seoji: ${isbn} -> ${pageCount}p`);
            return pageCount;
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.warn(`[PageCount] NL Seoji API 오류:`, error);
    return null;
  }
}

// ============================================
// 알라딘 상품조회 API
// ============================================

/**
 * 알라딘 상품조회 API로 페이지 수 조회
 * @see https://blog.aladin.co.kr/openapi/5353294
 */
async function fetchFromAladin(isbn: string): Promise<number | null> {
  const ttbKey = process.env.ALADIN_TTB_KEY;
  if (!ttbKey) {
    console.warn("[PageCount] 알라딘 API 키가 설정되지 않았습니다.");
    return null;
  }

  const normalized = normalizeIsbn(isbn);
  const itemIdType = normalized.length === 13 ? "ISBN13" : "ISBN";

  const url = new URL("http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx");
  url.searchParams.append("ttbkey", ttbKey);
  url.searchParams.append("itemIdType", itemIdType);
  url.searchParams.append("ItemId", normalized);
  url.searchParams.append("output", "js");
  url.searchParams.append("Version", "20131101");
  // subInfo 포함하여 페이지 수 정보 요청
  url.searchParams.append("OptResult", "packing");

  try {
    const response = await withRetry(
      async () => {
        const res = await fetch(url.toString(), {
          next: { revalidate: 86400 }, // 24시간 캐시
        });
        if (!res.ok) throw new Error(`알라딘 API 오류: ${res.status}`);
        return res;
      },
      { maxRetries: 2, initialDelay: 300 }
    );

    const data: AladinItemResponse = await response.json();

    if (data.item && data.item.length > 0) {
      const item = data.item[0];

      // subInfo.itemPage에서 페이지 수 확인
      if (item.subInfo?.itemPage) {
        const pageCount = item.subInfo.itemPage;
        if (isValidPageCount(pageCount)) {
          console.log(`[PageCount] Aladin: ${isbn} -> ${pageCount}p`);
          return pageCount;
        }
      }
    }

    return null;
  } catch (error) {
    console.warn(`[PageCount] 알라딘 API 오류:`, error);
    return null;
  }
}

// ============================================
// Google Books API
// ============================================

/**
 * Google Books API로 페이지 수 조회
 * @see https://developers.google.com/books/docs/v1/using
 */
async function fetchFromGoogleBooks(isbn: string): Promise<number | null> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

  const normalized = normalizeIsbn(isbn);

  // API 키가 있으면 사용, 없으면 키 없이 요청 (제한적)
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.append("q", `isbn:${normalized}`);
  if (apiKey) {
    url.searchParams.append("key", apiKey);
  }

  try {
    const response = await withRetry(
      async () => {
        const res = await fetch(url.toString(), {
          next: { revalidate: 86400 }, // 24시간 캐시
        });
        if (!res.ok) throw new Error(`Google Books API 오류: ${res.status}`);
        return res;
      },
      { maxRetries: 2, initialDelay: 300 }
    );

    const data: GoogleBooksResponse = await response.json();

    if (data.items && data.items.length > 0) {
      const volumeInfo = data.items[0].volumeInfo;
      if (volumeInfo?.pageCount) {
        const pageCount = volumeInfo.pageCount;
        if (isValidPageCount(pageCount)) {
          console.log(`[PageCount] Google Books: ${isbn} -> ${pageCount}p`);
          return pageCount;
        }
      }
    }

    return null;
  } catch (error) {
    console.warn(`[PageCount] Google Books API 오류:`, error);
    return null;
  }
}

// ============================================
// 유효성 검사
// ============================================

/**
 * 페이지 수 유효성 검사
 * 비정상적인 값(0, 음수, 너무 큰 값) 필터링
 */
function isValidPageCount(pageCount: number): boolean {
  return (
    typeof pageCount === "number" &&
    Number.isFinite(pageCount) &&
    pageCount >= 1 &&
    pageCount <= 10000 // 10,000페이지 이상은 비정상으로 간주
  );
}

// ============================================
// 메인 함수
// ============================================

/**
 * 복합 전략으로 책 페이지 수 조회
 *
 * 우선순위:
 * 1. 국립중앙도서관 ISBN서지정보 API
 * 2. 알라딘 상품조회 API
 * 3. Google Books API
 *
 * @param isbn ISBN (10자리 또는 13자리)
 * @returns 페이지 수와 출처 정보
 */
export async function fetchBookPageCount(isbn: string): Promise<PageCountResult> {
  if (!isbn || !isValidIsbn(isbn)) {
    return { pageCount: null, source: null, error: "유효하지 않은 ISBN입니다." };
  }

  const normalized = normalizeIsbn(isbn);

  // 1. 국립중앙도서관 API 시도
  try {
    const nlResult = await fetchFromNLSeoji(normalized);
    if (nlResult !== null) {
      return { pageCount: nlResult, source: "nl_seoji" };
    }
  } catch (error) {
    console.warn("[PageCount] NL Seoji 실패, 다음 API로 폴백");
  }

  // 2. 알라딘 API 시도
  try {
    const aladinResult = await fetchFromAladin(normalized);
    if (aladinResult !== null) {
      return { pageCount: aladinResult, source: "aladin" };
    }
  } catch (error) {
    console.warn("[PageCount] 알라딘 실패, 다음 API로 폴백");
  }

  // 3. Google Books API 시도
  try {
    const googleResult = await fetchFromGoogleBooks(normalized);
    if (googleResult !== null) {
      return { pageCount: googleResult, source: "google_books" };
    }
  } catch (error) {
    console.warn("[PageCount] Google Books 실패");
  }

  // 모든 API에서 페이지 수를 찾지 못함
  return {
    pageCount: null,
    source: null,
    error: "페이지 수를 찾을 수 없습니다."
  };
}

/**
 * 병렬로 여러 API 조회 (더 빠르지만 API 호출 비용 증가)
 * 가장 먼저 성공한 결과 반환
 */
export async function fetchBookPageCountParallel(isbn: string): Promise<PageCountResult> {
  if (!isbn || !isValidIsbn(isbn)) {
    return { pageCount: null, source: null, error: "유효하지 않은 ISBN입니다." };
  }

  const normalized = normalizeIsbn(isbn);

  // 모든 API를 병렬로 호출
  const results = await Promise.allSettled([
    fetchFromNLSeoji(normalized),
    fetchFromAladin(normalized),
    fetchFromGoogleBooks(normalized),
  ]);

  const sources: Array<PageCountResult["source"]> = ["nl_seoji", "aladin", "google_books"];

  // 우선순위대로 성공한 결과 반환
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled" && result.value !== null) {
      return { pageCount: result.value, source: sources[i] };
    }
  }

  return {
    pageCount: null,
    source: null,
    error: "페이지 수를 찾을 수 없습니다."
  };
}

/**
 * 여러 ISBN에 대해 일괄 조회 (배치 처리)
 * @param isbns ISBN 배열
 * @param concurrency 동시 처리 수 (기본값: 3)
 */
export async function fetchBookPageCountBatch(
  isbns: string[],
  concurrency: number = 3
): Promise<Map<string, PageCountResult>> {
  const results = new Map<string, PageCountResult>();

  // 청크로 나누어 처리
  for (let i = 0; i < isbns.length; i += concurrency) {
    const chunk = isbns.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map(async (isbn) => {
        const result = await fetchBookPageCount(isbn);
        return { isbn: normalizeIsbn(isbn), result };
      })
    );

    for (const { isbn, result } of chunkResults) {
      results.set(isbn, result);
    }

    // Rate limiting: 청크 사이에 짧은 딜레이
    if (i + concurrency < isbns.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}
