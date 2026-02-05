"use server";

import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  fetchPopularBooks,
  fetchTrendingBooks,
  fetchManiaBooks,
  fetchRecommendedBooksByIsbn,
} from "@/lib/api/data4library";
import type { PopularBook, RecommendedBook, ExternalPopularBook } from "@/lib/api/data4library-types";
import { searchBooks, transformNaverBookItem } from "@/lib/api/naver";
import { getOpenLibraryCoverUrl } from "@/lib/api/open-library-covers";

// ============================================
// 타입 정의
// ============================================

export type PopularBookCategory = "popular" | "trending" | "mania";

export interface GetPopularBooksResult {
  books: PopularBook[];
  category: PopularBookCategory;
  fromCache: boolean;
  error?: string;
}

// ============================================
// 상수
// ============================================

/** 캐시 유효 시간 (6시간) */
const CACHE_TTL_HOURS = 6;

/** 기본 조회 개수 */
const DEFAULT_PAGE_SIZE = 10;

/** 표지 보강할 최대 도서 수 (성능 고려) */
const MAX_COVER_ENRICH_COUNT = 5;

// ============================================
// 메인 서버 액션
// ============================================

/**
 * 인기 도서 조회 (캐시 우선)
 *
 * L2 캐시(Supabase) 확인 후 만료시 API 재조회
 *
 * @param category 카테고리 (popular, trending, mania)
 * @param regionCode 지역 코드 (선택)
 * @param limit 조회 개수 (기본 10)
 */
export async function getPopularBooks(
  category: PopularBookCategory = "popular",
  regionCode?: string | null,
  limit: number = DEFAULT_PAGE_SIZE
): Promise<GetPopularBooksResult> {
  const supabase = await createServerSupabaseClient();

  try {
    // 1. L2 캐시(Supabase) 확인
    const cachedBooks = await getCachedBooks(supabase, category, regionCode, limit);

    if (cachedBooks.length > 0) {
      console.log(`[popular-books] 캐시 히트: ${category}, ${cachedBooks.length}권`);
      return {
        books: cachedBooks,
        category,
        fromCache: true,
      };
    }

    // 2. API 조회
    console.log(`[popular-books] 캐시 미스, API 조회: ${category}`);
    const freshBooks = await fetchBooksFromApi(category, regionCode, limit);

    // 2.5. 표지가 없는 도서 보강 (상위 N권만, 성능 고려)
    const enrichedBooks = await enrichBooksWithCoverImages(freshBooks);

    // 3. 캐시 저장 (비동기, 실패해도 결과 반환)
    if (enrichedBooks.length > 0) {
      saveBooksToCache(category, enrichedBooks, regionCode).catch((err) => {
        console.error("[popular-books] 캐시 저장 오류:", err);
      });
    }

    return {
      books: enrichedBooks,
      category,
      fromCache: false,
    };
  } catch (error) {
    console.error("[popular-books] 조회 오류:", error);

    // 에러 시 캐시 폴백 (만료된 것도 사용)
    const fallbackBooks = await getCachedBooks(supabase, category, regionCode, limit, true);

    if (fallbackBooks.length > 0) {
      console.log(`[popular-books] 에러 발생, 만료 캐시 폴백: ${fallbackBooks.length}권`);
      return {
        books: fallbackBooks,
        category,
        fromCache: true,
        error: "API 오류로 캐시된 데이터를 표시합니다.",
      };
    }

    return {
      books: [],
      category,
      fromCache: false,
      error: error instanceof Error ? error.message : "인기 도서를 불러올 수 없습니다.",
    };
  }
}

/**
 * 모든 카테고리 인기 도서 일괄 조회
 * 홈 대시보드에서 사용
 */
export async function getAllPopularBooks(
  regionCode?: string | null,
  limit: number = DEFAULT_PAGE_SIZE
): Promise<{
  popular: GetPopularBooksResult;
  trending: GetPopularBooksResult;
  mania: GetPopularBooksResult;
}> {
  const [popular, trending, mania] = await Promise.all([
    getPopularBooks("popular", regionCode, limit),
    getPopularBooks("trending", regionCode, limit),
    getPopularBooks("mania", regionCode, limit),
  ]);

  return { popular, trending, mania };
}

/**
 * ISBN 기반 추천 도서 조회
 * 독서모임 "다음 책 후보" 섹션에서 사용
 */
export async function getRecommendedBooks(
  isbn13: string,
  count: number = 5
): Promise<{
  books: RecommendedBook[];
  error?: string;
}> {
  try {
    const books = await fetchRecommendedBooksByIsbn({ isbn13, count });
    return { books };
  } catch (error) {
    console.error("[popular-books] 추천 도서 조회 오류:", error);
    return {
      books: [],
      error: error instanceof Error ? error.message : "추천 도서를 불러올 수 없습니다.",
    };
  }
}

/**
 * 독서모임용 추천 도서 조회
 * 현재 지정도서 ISBN 기반 추천
 */
export async function getRecommendedBooksForGroup(
  groupId: string,
  count: number = 5
): Promise<{
  books: RecommendedBook[];
  sourceBookTitle?: string;
  error?: string;
}> {
  const supabase = await createServerSupabaseClient();

  try {
    // 현재 지정도서 중 가장 최근 것 조회
    const { data: groupBooks, error: groupBooksError } = await supabase
      .from("group_books")
      .select(`
        book_id,
        books (
          isbn,
          title
        )
      `)
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (groupBooksError) {
      throw new Error(`지정도서 조회 실패: ${groupBooksError.message}`);
    }

    if (!groupBooks || groupBooks.length === 0) {
      return {
        books: [],
        error: "지정도서가 없어 추천을 표시할 수 없습니다.",
      };
    }

    const booksData = groupBooks[0].books;
    const bookInfo = (Array.isArray(booksData) ? booksData[0] : booksData) as { isbn: string | null; title: string } | null;

    if (!bookInfo?.isbn) {
      return {
        books: [],
        error: "지정도서에 ISBN 정보가 없어 추천을 표시할 수 없습니다.",
      };
    }

    const { books } = await getRecommendedBooks(bookInfo.isbn, count);

    return {
      books,
      sourceBookTitle: bookInfo.title,
    };
  } catch (error) {
    console.error("[popular-books] 모임 추천 도서 조회 오류:", error);
    return {
      books: [],
      error: error instanceof Error ? error.message : "추천 도서를 불러올 수 없습니다.",
    };
  }
}

/**
 * 캐시 강제 갱신
 * 관리자용 또는 수동 갱신 시 사용
 * RLS 정책으로 인해 service role (admin) 클라이언트 사용 필요
 */
export async function refreshPopularBooksCache(
  category?: PopularBookCategory,
  regionCode?: string | null
): Promise<{ success: boolean; message: string }> {
  const adminClient = createAdminSupabaseClient();

  try {
    const categories: PopularBookCategory[] = category
      ? [category]
      : ["popular", "trending", "mania"];

    for (const cat of categories) {
      // 기존 캐시 삭제 (admin 클라이언트 사용)
      const deleteQuery = adminClient
        .from("external_popular_books")
        .delete()
        .eq("source", "data4library")
        .eq("category", cat);

      if (regionCode) {
        deleteQuery.eq("region_code", regionCode);
      } else {
        deleteQuery.is("region_code", null);
      }

      await deleteQuery;

      // 새 데이터 조회 및 저장
      const freshBooks = await fetchBooksFromApi(cat, regionCode, 20);
      if (freshBooks.length > 0) {
        await saveBooksToCache(cat, freshBooks, regionCode);
      }
    }

    return {
      success: true,
      message: `${categories.join(", ")} 카테고리 캐시가 갱신되었습니다.`,
    };
  } catch (error) {
    console.error("[popular-books] 캐시 갱신 오류:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "캐시 갱신에 실패했습니다.",
    };
  }
}

// ============================================
// 내부 헬퍼 함수
// ============================================

/**
 * API에서 도서 데이터 조회
 */
async function fetchBooksFromApi(
  category: PopularBookCategory,
  regionCode?: string | null,
  limit: number = DEFAULT_PAGE_SIZE
): Promise<PopularBook[]> {
  const options = {
    region: regionCode || undefined,
    pageSize: limit,
  };

  switch (category) {
    case "popular":
      return fetchPopularBooks(options);
    case "trending":
      return fetchTrendingBooks(options);
    case "mania":
      return fetchManiaBooks(options);
    default:
      return fetchPopularBooks(options);
  }
}

/**
 * Supabase 캐시에서 도서 데이터 조회
 */
async function getCachedBooks(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  category: PopularBookCategory,
  regionCode?: string | null,
  limit: number = DEFAULT_PAGE_SIZE,
  includeExpired: boolean = false
): Promise<PopularBook[]> {
  let query = supabase
    .from("external_popular_books")
    .select("*")
    .eq("source", "data4library")
    .eq("category", category)
    .order("ranking", { ascending: true })
    .limit(limit);

  if (regionCode) {
    query = query.eq("region_code", regionCode);
  } else {
    query = query.is("region_code", null);
  }

  // 만료되지 않은 것만 조회 (폴백 모드가 아닌 경우)
  if (!includeExpired) {
    query = query.gt("expires_at", new Date().toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error("[popular-books] 캐시 조회 오류:", error);
    return [];
  }

  return (data || []).map(transformCacheToPopularBook);
}

/**
 * 도서 데이터를 Supabase 캐시에 저장
 * RLS 정책으로 인해 service role (admin) 클라이언트 사용 필요
 */
async function saveBooksToCache(
  category: PopularBookCategory,
  books: PopularBook[],
  regionCode?: string | null
): Promise<void> {
  const adminClient = createAdminSupabaseClient();

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + CACHE_TTL_HOURS);

  const records: Omit<ExternalPopularBook, "id" | "fetched_at">[] = books.map((book) => ({
    source: "data4library" as const,
    category,
    isbn13: book.isbn13,
    title: book.title,
    author: book.author || null,
    publisher: book.publisher || null,
    loan_count: book.loanCount || null,
    ranking: book.ranking || null,
    region_code: regionCode || null,
    expires_at: expiresAt.toISOString(),
    metadata: {
      coverImageUrl: book.coverImageUrl,
      publicationYear: book.publicationYear,
      categoryName: book.category,
    },
  }));

  // upsert로 기존 데이터 갱신
  const { error } = await adminClient
    .from("external_popular_books")
    .upsert(records, {
      onConflict: "source,category,isbn13,region_code",
      ignoreDuplicates: false,
    });

  if (error) {
    throw new Error(`캐시 저장 실패: ${error.message}`);
  }

  console.log(`[popular-books] 캐시 저장 완료: ${category}, ${books.length}권`);
}

/**
 * 캐시 데이터를 PopularBook 타입으로 변환
 */
function transformCacheToPopularBook(cache: ExternalPopularBook): PopularBook {
  const metadata = cache.metadata || {};

  return {
    ranking: cache.ranking || 0,
    isbn13: cache.isbn13,
    title: cache.title,
    author: cache.author || "",
    publisher: cache.publisher || "",
    publicationYear: metadata.publicationYear as string | undefined,
    coverImageUrl: metadata.coverImageUrl as string | undefined,
    loanCount: cache.loan_count || 0,
    category: metadata.categoryName as string | undefined,
    source: "data4library",
  };
}

/**
 * 표지가 없는 도서에 대해 네이버 API / Open Library로 표지 보강
 * 성능을 위해 상위 N권만 처리
 */
async function enrichBooksWithCoverImages(books: PopularBook[]): Promise<PopularBook[]> {
  // 표지가 없는 도서 필터링 (상위 N권만)
  const booksWithoutCover = books.filter((book) => !book.coverImageUrl && book.isbn13);
  const toEnrich = booksWithoutCover.slice(0, MAX_COVER_ENRICH_COUNT);

  if (toEnrich.length === 0) {
    return books;
  }

  console.log(`[popular-books] 표지 보강 시작: ${toEnrich.length}권`);

  // 병렬로 표지 조회
  const coverResults = await Promise.allSettled(
    toEnrich.map(async (book) => {
      // 1. 네이버 API 시도
      try {
        const naverResponse = await searchBooks({ query: book.isbn13, display: 1 });
        if (naverResponse.items && naverResponse.items.length > 0) {
          const naverBook = transformNaverBookItem(naverResponse.items[0]);
          if (naverBook.cover_image_url) {
            return { isbn13: book.isbn13, coverUrl: naverBook.cover_image_url, source: "naver" };
          }
        }
      } catch (err) {
        // 네이버 API 실패 시 Open Library 폴백
      }

      // 2. Open Library 폴백 (HEAD 요청 없이 URL만 생성)
      const openLibraryCover = getOpenLibraryCoverUrl(book.isbn13, "M");
      if (openLibraryCover) {
        return { isbn13: book.isbn13, coverUrl: openLibraryCover, source: "openlibrary" };
      }

      return { isbn13: book.isbn13, coverUrl: null, source: null };
    })
  );

  // 결과를 Map으로 변환
  const coverMap = new Map<string, string>();
  coverResults.forEach((result) => {
    if (result.status === "fulfilled" && result.value.coverUrl) {
      coverMap.set(result.value.isbn13, result.value.coverUrl);
      console.log(`[popular-books] 표지 보강 성공: ${result.value.isbn13} (${result.value.source})`);
    }
  });

  // 도서 목록에 표지 URL 적용
  return books.map((book) => {
    if (!book.coverImageUrl && coverMap.has(book.isbn13)) {
      return { ...book, coverImageUrl: coverMap.get(book.isbn13) };
    }
    return book;
  });
}
