"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { searchBooks, transformNaverBookItem } from "@/lib/api/naver";
import { fetchBookPageCount } from "@/lib/api/book-page-count";
import { resolveOpenLibraryCoverUrl } from "@/lib/api/open-library-covers";
import type { ReadingStatus } from "@/types/book";
import { isValidUUID, sanitizeErrorForLogging } from "@/lib/utils/validation";
import type { User } from "@supabase/supabase-js";
import { earnPoints, updateStreak } from "../points";

/**
 * 독서 상태 변경
 * @param userBookId UserBooks 테이블의 ID
 * @param status 새로운 상태
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function updateBookStatus(
  userBookId: string,
  status: ReadingStatus,
  user?: User | null
) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !fetchedUser) {
      throw new Error("로그인이 필요합니다.");
    }
    currentUser = fetchedUser;
  }

  // 사용자의 책인지 확인
  const { data: userBook } = await supabase
    .from("user_books")
    .select("id")
    .eq("id", userBookId)
    .eq("user_id", currentUser.id)
    .single();

  if (!userBook) {
    throw new Error("권한이 없습니다.");
  }

  // 상태 변경 데이터 준비
  const updateData: {
    status: ReadingStatus;
    completed_at?: string | null;
  } = {
    status,
  };

  // 완독 시 completed_at 자동 기록
  if (status === "completed") {
    updateData.completed_at = new Date().toISOString();
  } else if (status === "rereading") {
    // 재독 상태는 이전 완독일을 유지 (이미 완독한 책을 다시 읽는 경우)
    // completed_at은 변경하지 않음 (기존 값 유지)
  } else {
    // 완독이 아닌 상태로 변경 시 completed_at 초기화
    updateData.completed_at = null;
  }

  const { error } = await supabase
    .from("user_books")
    .update(updateData)
    .eq("id", userBookId);

  if (error) {
    throw new Error(`상태 변경 실패: ${error.message}`);
  }

  // 완독 시 포인트 적립
  if (status === "completed") {
    try {
      // 스트릭 업데이트 (첫 활동 시 보너스)
      await updateStreak(currentUser);

      // 책 정보 조회하여 제목 가져오기
      const { data: bookInfo } = await supabase
        .from("user_books")
        .select("books(title)")
        .eq("id", userBookId)
        .single();

      const bookTitle = (bookInfo?.books as any)?.title || "책";

      // 책 완독 포인트 적립
      await earnPoints("book_complete", {
        user: currentUser,
        referenceId: userBookId,
        referenceType: "user_book",
        description: `${bookTitle} 완독`,
      });
    } catch (pointError) {
      // 포인트 적립 실패해도 상태 변경은 성공으로 처리
      console.error("포인트 적립 오류:", sanitizeErrorForLogging(pointError));
    }
  }

  revalidatePath("/books");
  revalidatePath(`/books/${userBookId}`);
  revalidatePath("/");

  return { success: true };
}

/**
 * 읽기 진행률 업데이트
 * @param userBookId UserBooks 테이블의 ID
 * @param currentPage 현재 읽은 페이지
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function updateBookProgress(
  userBookId: string,
  currentPage: number,
  user?: User | null
) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !fetchedUser) {
      throw new Error("로그인이 필요합니다.");
    }
    currentUser = fetchedUser;
  }

  // UUID 검증
  if (!isValidUUID(userBookId)) {
    throw new Error("유효하지 않은 책 ID입니다.");
  }

  // 페이지 수 검증
  if (currentPage < 0) {
    throw new Error("페이지 수는 0 이상이어야 합니다.");
  }

  // 사용자의 책인지 확인 (total_pages도 함께 조회)
  const { data: userBook } = await supabase
    .from("user_books")
    .select("id, books(total_pages)")
    .eq("id", userBookId)
    .eq("user_id", currentUser.id)
    .single();

  if (!userBook) {
    throw new Error("권한이 없습니다.");
  }

  // total_pages가 있으면 상한 체크
  const booksData = userBook.books as unknown as { total_pages: number | null } | null;
  const totalPages = booksData?.total_pages;
  if (totalPages && currentPage > totalPages) {
    throw new Error(`페이지 수는 전체 페이지(${totalPages})를 초과할 수 없습니다.`);
  }

  // 진행률 업데이트
  const { error } = await supabase
    .from("user_books")
    .update({ current_page: currentPage })
    .eq("id", userBookId);

  if (error) {
    throw new Error(`진행률 업데이트 실패: ${error.message}`);
  }

  revalidatePath("/books");
  revalidatePath(`/books/${userBookId}`);
  revalidatePath("/");

  return { success: true };
}

/**
 * 특정 책의 페이지 수 조회 및 업데이트
 * @param bookId Books 테이블의 ID
 * @param isbn 책의 ISBN (선택적, 없으면 DB에서 조회)
 */
export async function refreshBookPageCount(
  bookId: string,
  isbn?: string | null
): Promise<{ success: boolean; pageCount: number | null; source: string | null; error?: string }> {
  const supabase = await createServerSupabaseClient();

  // UUID 검증
  if (!isValidUUID(bookId)) {
    return { success: false, pageCount: null, source: null, error: "유효하지 않은 책 ID입니다." };
  }

  // ISBN이 없으면 DB에서 조회
  let targetIsbn = isbn;
  if (!targetIsbn) {
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("isbn")
      .eq("id", bookId)
      .single();

    if (bookError || !book) {
      return { success: false, pageCount: null, source: null, error: "책을 찾을 수 없습니다." };
    }

    targetIsbn = book.isbn;
  }

  if (!targetIsbn) {
    return { success: false, pageCount: null, source: null, error: "ISBN이 없어 페이지 수를 조회할 수 없습니다." };
  }

  // 페이지 수 조회
  try {
    const pageCountResult = await fetchBookPageCount(targetIsbn);

    if (pageCountResult.pageCount) {
      // DB 업데이트
      const { error: updateError } = await supabase
        .from("books")
        .update({ total_pages: pageCountResult.pageCount })
        .eq("id", bookId);

      if (updateError) {
        return { success: false, pageCount: null, source: null, error: `업데이트 실패: ${updateError.message}` };
      }

      revalidatePath("/books");
      revalidatePath(`/books/${bookId}`);

      return {
        success: true,
        pageCount: pageCountResult.pageCount,
        source: pageCountResult.source,
      };
    }

    return { success: false, pageCount: null, source: null, error: pageCountResult.error || "페이지 수를 찾을 수 없습니다." };
  } catch (error) {
    return { success: false, pageCount: null, source: null, error: "페이지 수 조회 중 오류가 발생했습니다." };
  }
}

/**
 * 페이지 수 수동 업데이트
 * @param bookId Books 테이블의 ID
 * @param totalPages 전체 페이지 수
 */
export async function updateBookTotalPages(
  bookId: string,
  totalPages: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // UUID 검증
  if (!isValidUUID(bookId)) {
    return { success: false, error: "유효하지 않은 책 ID입니다." };
  }

  // 페이지 수 유효성 검사
  if (totalPages < 1 || totalPages > 10000) {
    return { success: false, error: "페이지 수는 1~10,000 사이여야 합니다." };
  }

  // 사용자가 이 책을 소유하고 있는지 확인
  const { data: userBook } = await supabase
    .from("user_books")
    .select("id")
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .maybeSingle();

  if (!userBook) {
    return { success: false, error: "권한이 없습니다." };
  }

  // 페이지 수 업데이트
  const { error: updateError } = await supabase
    .from("books")
    .update({ total_pages: totalPages })
    .eq("id", bookId);

  if (updateError) {
    return { success: false, error: `업데이트 실패: ${updateError.message}` };
  }

  revalidatePath("/books");
  revalidatePath(`/books/${bookId}`);
  revalidatePath("/");

  return { success: true };
}

/**
 * 페이지 수가 없는 책 목록 조회 (일괄 업데이트용)
 * @param limit 조회할 최대 개수 (기본값: 50)
 */
export async function getBooksWithoutPageCount(
  limit: number = 50
): Promise<{ books: Array<{ id: string; isbn: string; title: string }> }> {
  const supabase = await createServerSupabaseClient();

  const { data: books, error } = await supabase
    .from("books")
    .select("id, isbn, title")
    .is("total_pages", null)
    .not("isbn", "is", null)
    .limit(limit);

  if (error) {
    throw new Error(`조회 실패: ${error.message}`);
  }

  return { books: books || [] };
}

/**
 * ISBN으로 책표지 URL 조회 (네이버 API -> Open Library 폴백)
 * 인기도서 카드에서 표지가 없거나 로드 실패 시 사용
 * @param isbn ISBN-13 또는 ISBN-10
 * @param title 책 제목 (네이버 검색 보조용)
 */
export async function getBookCoverByIsbn(
  isbn: string,
  title?: string
): Promise<{ coverUrl: string | null; source: string | null }> {
  if (!isbn) {
    return { coverUrl: null, source: null };
  }

  // 1. 네이버 API로 시도
  try {
    const searchQuery = isbn || title || "";
    const naverResponse = await searchBooks({ query: searchQuery, display: 1 });

    if (naverResponse.items && naverResponse.items.length > 0) {
      const naverBook = transformNaverBookItem(naverResponse.items[0]);
      if (naverBook.cover_image_url) {
        return { coverUrl: naverBook.cover_image_url, source: "naver" };
      }
    }
  } catch (error) {
    console.warn(`[getBookCoverByIsbn] 네이버 API 실패 (ISBN: ${isbn}):`, error);
  }

  // 2. Open Library Covers 폴백
  try {
    const coverUrl = await resolveOpenLibraryCoverUrl(isbn, {
      timeoutMs: 2000,
    });
    if (coverUrl) {
      return { coverUrl, source: "openlibrary" };
    }
  } catch (error) {
    console.warn(`[getBookCoverByIsbn] Open Library 실패 (ISBN: ${isbn}):`, error);
  }

  return { coverUrl: null, source: null };
}

/**
 * 페이지 수가 없는 책들의 페이지 수 일괄 업데이트
 * @param limit 업데이트할 최대 개수 (기본값: 20)
 */
export async function batchUpdatePageCounts(
  limit: number = 20
): Promise<{ updated: number; failed: number; results: Array<{ isbn: string; success: boolean; pageCount?: number; source?: string; error?: string }> }> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인 (관리자 기능으로 제한 가능)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 페이지 수가 없는 책 조회
  const { data: books, error: selectError } = await supabase
    .from("books")
    .select("id, isbn, title")
    .is("total_pages", null)
    .not("isbn", "is", null)
    .limit(limit);

  if (selectError || !books) {
    throw new Error(`조회 실패: ${selectError?.message || "알 수 없는 오류"}`);
  }

  const results: Array<{ isbn: string; success: boolean; pageCount?: number; source?: string; error?: string }> = [];
  let updated = 0;
  let failed = 0;

  // 순차적으로 처리 (API Rate Limit 방지)
  for (const book of books) {
    if (!book.isbn) continue;

    try {
      const pageCountResult = await fetchBookPageCount(book.isbn);

      if (pageCountResult.pageCount) {
        const { error: updateError } = await supabase
          .from("books")
          .update({ total_pages: pageCountResult.pageCount })
          .eq("id", book.id);

        if (updateError) {
          results.push({ isbn: book.isbn, success: false, error: updateError.message });
          failed++;
        } else {
          results.push({
            isbn: book.isbn,
            success: true,
            pageCount: pageCountResult.pageCount,
            source: pageCountResult.source || undefined,
          });
          updated++;
        }
      } else {
        results.push({ isbn: book.isbn, success: false, error: pageCountResult.error });
        failed++;
      }

      // Rate limiting: 각 요청 사이에 딜레이
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      results.push({ isbn: book.isbn, success: false, error: "조회 중 오류 발생" });
      failed++;
    }
  }

  revalidatePath("/books");

  return { updated, failed, results };
}
