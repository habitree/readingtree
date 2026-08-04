"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/app/actions/auth";
import { revalidatePath } from "next/cache";
import { searchBooks, transformBookItem } from "@/lib/api/book-search";
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
    currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("로그인이 필요합니다.");
    }
  }

  // 사용자의 책인지 확인 + completed_dates 조회 (완독 누적용)
  const { data: userBook } = await supabase
    .from("user_books")
    .select("id, completed_dates")
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
    completed_dates?: string[];
  } = {
    status,
  };

  // 완독 시 completed_at + completed_dates 배열 누적
  if (status === "completed") {
    const now = new Date().toISOString();
    updateData.completed_at = now;

    // 기존 completed_dates 배열에 새 완독일 추가
    let existingDates: string[] = [];
    if (userBook.completed_dates) {
      if (Array.isArray(userBook.completed_dates)) {
        existingDates = userBook.completed_dates as string[];
      } else if (typeof userBook.completed_dates === "string") {
        try {
          existingDates = JSON.parse(userBook.completed_dates);
        } catch {
          existingDates = [];
        }
      }
    }
    updateData.completed_dates = [...existingDates, now];
  } else if (status === "rereading") {
    // 재독 상태는 이전 완독일을 유지 (이미 완독한 책을 다시 읽는 경우)
    // completed_at, completed_dates 변경하지 않음
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
 * 여러 책의 독서 상태를 한 번에 변경.
 * - RLS와 별개로 `.eq("user_id", user.id)` 2중 방어 적용.
 * - 완독 처리 시 completed_dates 누적은 단순화: 각 책에 completed_at만 설정.
 *   (상세 회독 누적은 단건 updateBookStatus에서만 처리)
 */
export async function bulkUpdateBookStatus(
  userBookIds: string[],
  status: ReadingStatus,
): Promise<{ success: boolean; updated: number; failed: number; error?: string }> {
  if (userBookIds.length === 0) {
    return { success: true, updated: 0, failed: 0 };
  }

  const supabase = await createServerSupabaseClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, updated: 0, failed: userBookIds.length, error: "로그인이 필요합니다." };
  }

  const updateData: {
    status: ReadingStatus;
    completed_at?: string | null;
  } = { status };

  if (status === "completed") {
    updateData.completed_at = new Date().toISOString();
  } else if (status !== "rereading") {
    updateData.completed_at = null;
  }

  const { data, error } = await supabase
    .from("user_books")
    .update(updateData)
    .eq("user_id", currentUser.id)
    .in("id", userBookIds)
    .select("id");

  if (error) {
    return { success: false, updated: 0, failed: userBookIds.length, error: error.message };
  }

  const updated = data?.length ?? 0;

  revalidatePath("/books");
  revalidatePath("/bookshelves");
  revalidatePath("/");

  return {
    success: true,
    updated,
    failed: userBookIds.length - updated,
  };
}

/**
 * 여러 책을 한 번에 특정 책장으로 이동.
 */
export async function bulkMoveBooksToBookshelf(
  userBookIds: string[],
  bookshelfId: string | null,
): Promise<{ success: boolean; updated: number; failed: number; error?: string }> {
  if (userBookIds.length === 0) {
    return { success: true, updated: 0, failed: 0 };
  }

  const supabase = await createServerSupabaseClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, updated: 0, failed: userBookIds.length, error: "로그인이 필요합니다." };
  }

  // bookshelf 소유권 확인 (null이면 책장 미지정)
  if (bookshelfId) {
    const { data: shelf } = await supabase
      .from("bookshelves")
      .select("id")
      .eq("id", bookshelfId)
      .eq("user_id", currentUser.id)
      .maybeSingle();
    if (!shelf) {
      return { success: false, updated: 0, failed: userBookIds.length, error: "책장 권한이 없어요." };
    }
  }

  const { data, error } = await supabase
    .from("user_books")
    .update({ bookshelf_id: bookshelfId })
    .eq("user_id", currentUser.id)
    .in("id", userBookIds)
    .select("id");

  if (error) {
    return { success: false, updated: 0, failed: userBookIds.length, error: error.message };
  }

  revalidatePath("/books");
  revalidatePath("/bookshelves");

  return {
    success: true,
    updated: data?.length ?? 0,
    failed: userBookIds.length - (data?.length ?? 0),
  };
}

/**
 * 여러 책을 한 번에 삭제.
 */
export async function bulkDeleteBooks(
  userBookIds: string[],
): Promise<{ success: boolean; deleted: number; failed: number; error?: string }> {
  if (userBookIds.length === 0) {
    return { success: true, deleted: 0, failed: 0 };
  }

  const supabase = await createServerSupabaseClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, deleted: 0, failed: userBookIds.length, error: "로그인이 필요합니다." };
  }

  const { data, error } = await supabase
    .from("user_books")
    .delete()
    .eq("user_id", currentUser.id)
    .in("id", userBookIds)
    .select("id");

  if (error) {
    return { success: false, deleted: 0, failed: userBookIds.length, error: error.message };
  }

  revalidatePath("/books");
  revalidatePath("/bookshelves");
  revalidatePath("/");

  return {
    success: true,
    deleted: data?.length ?? 0,
    failed: userBookIds.length - (data?.length ?? 0),
  };
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
    currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("로그인이 필요합니다.");
    }
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

  // 진행률 100% 도달 여부 확인 (자동 완독하지 않고 클라이언트에 알림)
  const reachedEnd = !!(totalPages && currentPage >= totalPages);
  const updateData: Record<string, unknown> = { current_page: currentPage };

  const { error } = await supabase
    .from("user_books")
    .update(updateData)
    .eq("id", userBookId);

  if (error) {
    throw new Error(`진행률 업데이트 실패: ${error.message}`);
  }

  revalidatePath("/books");
  revalidatePath(`/books/${userBookId}`);
  revalidatePath("/");

  return { success: true, reachedEnd };
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
  // 현재 사용자 확인
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const supabase = await createServerSupabaseClient();

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
 * ISBN으로 책표지 URL 조회 (책 검색 API -> Open Library 폴백)
 * 인기도서 카드에서 표지가 없거나 로드 실패 시 사용
 * @param isbn ISBN-13 또는 ISBN-10
 * @param title 책 제목 (검색 보조용)
 */
export async function getBookCoverByIsbn(
  isbn: string,
  title?: string
): Promise<{ coverUrl: string | null; source: string | null }> {
  if (!isbn) {
    return { coverUrl: null, source: null };
  }

  // 1. 책 검색 API(알라딘 → Google Books)로 시도
  try {
    const searchQuery = isbn || title || "";
    const searchResponse = await searchBooks({ query: searchQuery, display: 1 });

    if (searchResponse.items && searchResponse.items.length > 0) {
      const book = transformBookItem(searchResponse.items[0]);
      if (book.cover_image_url) {
        return { coverUrl: book.cover_image_url, source: searchResponse.source };
      }
    }
  } catch (error) {
    console.warn(`[getBookCoverByIsbn] 책 검색 API 실패 (ISBN: ${isbn}):`, error);
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
  // 현재 사용자 확인 (관리자 기능으로 제한 가능)
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const supabase = await createServerSupabaseClient();

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
