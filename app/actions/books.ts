"use server";

import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { searchBooks, transformNaverBookItem } from "@/lib/api/naver";
import { fetchBookPageCount } from "@/lib/api/book-page-count";
import { resolveOpenLibraryCoverUrl } from "@/lib/api/open-library-covers";
import type { ReadingStatus } from "@/types/book";
import { isValidUUID, sanitizeErrorForLogging } from "@/lib/utils/validation";
import type { User } from "@supabase/supabase-js";
import { earnPoints, updateStreak } from "./points";

// AI 관련 함수 (wrapper로 re-export - "use server" 파일에서는 async 함수만 export 가능)
import { getBookDescriptionSummary as _getBookDescriptionSummary } from './ai/summarization';

/** Open Library Covers 폴백: 요청당 최대 건수 (레이트리밋 5분 100회 고려) */
const OPEN_LIBRARY_COVER_BATCH_LIMIT = 3;
/** 표지 확인 HEAD 요청 타임아웃(ms) — 응답 지연 방지 */
const OPEN_LIBRARY_COVER_TIMEOUT_MS = 1500;

/**
 * 날짜 문자열을 유효한 date 형식으로 정규화
 * "2014" -> "2014-01-01", "2014-05" -> "2014-05-01", "2014-05-20" -> "2014-05-20"
 */
function normalizePublishedDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;

  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // 년도만 있는 경우 (예: "2014")
  if (/^\d{4}$/.test(trimmed)) {
    return `${trimmed}-01-01`;
  }

  // 년-월 형식 (예: "2014-05")
  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    return `${trimmed}-01`;
  }

  // 이미 유효한 형식이면 그대로 반환
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // 그 외 형식은 null 반환 (파싱 실패 방지)
  return null;
}

/**
 * 책소개 가져오기 (wrapper)
 * @see app/actions/ai/summarization.ts
 */
export async function getBookDescriptionSummary(
  bookId: string,
  isbn?: string | null,
  title?: string | null
): Promise<string> {
  return _getBookDescriptionSummary(bookId, isbn, title);
}

/**
 * 책 정보 조회 (books 테이블에서 직접 조회)
 * @param bookId 책 ID
 */
export async function getBook(bookId: string) {
  const supabase = await createServerSupabaseClient();

  if (!isValidUUID(bookId)) {
    return null;
  }

  const { data: book, error } = await supabase
    .from("books")
    .select("id, title, author, publisher, cover_image_url, isbn, published_date, category, total_pages")
    .eq("id", bookId)
    .single();

  if (error || !book) {
    return null;
  }

  return book;
}

export interface AddBookInput {
  isbn?: string | null;
  title: string;
  author?: string | null;
  publisher?: string | null;
  published_date?: string | null;
  cover_image_url?: string | null;
}

/**
 * 책 추가
 * Books 테이블에 없으면 생성하고, UserBooks에 추가
 * ISBN이 있으면 기존 책을 재사용 (review_issues.md 5번 이슈 참고)
 * @param bookData 책 데이터
 * @param status 독서 상태
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function addBook(
  bookData: AddBookInput,
  status: ReadingStatus = "reading",
  user?: User | null,
  bookshelfId?: string | null
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

  // 사용자 프로필이 users 테이블에 존재하는지 확인
  const { data: userProfile, error: profileCheckError } = await supabase
    .from("users")
    .select("id")
    .eq("id", currentUser.id)
    .maybeSingle();

  // 프로필이 없으면 생성 (Foreign Key Constraint 방지)
  if (!userProfile) {
    const { error: insertProfileError } = await supabase.from("users").insert({
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.user_metadata?.name || currentUser.email?.split("@")[0] || "사용자",
      avatar_url: currentUser.user_metadata?.avatar_url || null,
      reading_goal: 12, // 기본값
    });

    if (insertProfileError) {
      throw new Error(`프로필 생성 실패: ${insertProfileError.message}`);
    }
  }

  let bookId: string;

  // ISBN이 있고 기존 책이 있는지 확인
  if (bookData.isbn) {
    const { data: existingBook, error: findError } = await supabase
      .from("books")
      .select("id")
      .eq("isbn", bookData.isbn)
      .maybeSingle(); // .single() 대신 .maybeSingle() 사용하여 에러 없이 null 반환

    if (findError && findError.code !== "PGRST116") {
      // PGRST116은 "결과가 없음" 에러이므로 무시
      throw new Error(`책 조회 실패: ${findError.message}`);
    }

    if (existingBook) {
      // 기존 책 재사용
      bookId = existingBook.id;
    } else {
      // 새 책 생성 - 페이지 수 자동 조회
      let totalPages: number | null = null;

      // ISBN이 있으면 페이지 수 조회 시도 (비동기, 실패해도 책 추가는 진행)
      try {
        const pageCountResult = await fetchBookPageCount(bookData.isbn);
        if (pageCountResult.pageCount) {
          totalPages = pageCountResult.pageCount;
          console.log(`[addBook] 페이지 수 조회 성공: ${bookData.isbn} -> ${totalPages}p (출처: ${pageCountResult.source})`);
        }
      } catch (error) {
        console.warn(`[addBook] 페이지 수 조회 실패 (무시하고 진행):`, error);
      }

      const { data: newBook, error: insertError } = await supabase
        .from("books")
        .insert({
          isbn: bookData.isbn,
          title: bookData.title,
          author: bookData.author,
          publisher: bookData.publisher,
          published_date: normalizePublishedDate(bookData.published_date),
          cover_image_url: bookData.cover_image_url,
          total_pages: totalPages,
        })
        .select("id")
        .single();

      if (insertError || !newBook) {
        throw new Error(`책 추가 실패: ${insertError?.message || "알 수 없는 오류"}`);
      }

      bookId = newBook.id;
    }
  } else {
    // ISBN이 없으면 새 책 생성
    const { data: newBook, error: insertError } = await supabase
      .from("books")
      .insert({
        title: bookData.title,
        author: bookData.author,
        publisher: bookData.publisher,
        published_date: normalizePublishedDate(bookData.published_date),
        cover_image_url: bookData.cover_image_url,
      })
      .select("id")
      .single();

    if (insertError || !newBook) {
      throw new Error(`책 추가 실패: ${insertError?.message || "알 수 없는 오류"}`);
    }

    bookId = newBook.id;
  }

  // 사용자가 이미 이 책을 추가했는지 확인 (UNIQUE 제약조건으로도 방지되지만 명시적 체크)
  const { data: existingUserBook, error: checkError } = await supabase
    .from("user_books")
    .select("id")
    .eq("user_id", currentUser.id)
    .eq("book_id", bookId)
    .maybeSingle(); // .single() 대신 .maybeSingle() 사용

  if (checkError && checkError.code !== "PGRST116") {
    // PGRST116은 "결과가 없음" 에러이므로 무시
    throw new Error(`중복 체크 실패: ${checkError.message}`);
  }

  if (existingUserBook) {
    throw new Error("이미 추가된 책입니다.");
  }

  // bookshelf_id 결정: 제공되지 않으면 메인 서재 사용
  let targetBookshelfId = bookshelfId;
  if (!targetBookshelfId) {
    const { data: mainBookshelf } = await supabase
      .from("bookshelves")
      .select("id")
      .eq("user_id", currentUser.id)
      .eq("is_main", true)
      .maybeSingle();

    if (!mainBookshelf) {
      // 메인 서재가 없으면 자동 생성
      // 먼저 일반 클라이언트로 시도, 실패 시 admin 클라이언트 사용
      let newBookshelf = null;
      let createBookshelfError = null;

      // 1차 시도: 일반 클라이언트 (RLS 정책이 허용하면 성공)
      const { data: regularResult, error: regularError } = await supabase
        .from("bookshelves")
        .insert({
          user_id: currentUser.id,
          name: "내 서재",
          is_main: true,
          order: 0,
        })
        .select("id")
        .single();

      if (regularResult) {
        newBookshelf = regularResult;
      } else {
        console.warn("[addBook] 일반 클라이언트로 서재 생성 실패, admin 클라이언트 시도:", regularError?.message);

        // 2차 시도: admin 클라이언트 (RLS 우회)
        try {
          const adminClient = createAdminSupabaseClient();
          const { data: adminResult, error: adminError } = await adminClient
            .from("bookshelves")
            .insert({
              user_id: currentUser.id,
              name: "내 서재",
              is_main: true,
              order: 0,
            })
            .select("id")
            .single();

          if (adminResult) {
            newBookshelf = adminResult;
          } else {
            createBookshelfError = adminError;
          }
        } catch (adminClientError) {
          console.error("[addBook] admin 클라이언트 생성 실패:", adminClientError);
          createBookshelfError = regularError; // 원래 에러 사용
        }
      }

      if (!newBookshelf) {
        console.error("[addBook] 메인 서재 생성 실패:", createBookshelfError);
        throw new Error("메인 서재 생성에 실패했습니다. 다시 시도해주세요.");
      }
      targetBookshelfId = newBookshelf.id;
    } else {
      targetBookshelfId = mainBookshelf.id;
    }
  } else {
    // 제공된 bookshelf_id가 사용자의 서재인지 확인
    const { data: bookshelf } = await supabase
      .from("bookshelves")
      .select("id")
      .eq("id", targetBookshelfId)
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (!bookshelf) {
      throw new Error("서재를 찾을 수 없거나 권한이 없습니다.");
    }
  }

  // UserBooks에 추가
  const { data: newUserBook, error: userBookError } = await supabase
    .from("user_books")
    .insert({
      user_id: currentUser.id,
      book_id: bookId,
      bookshelf_id: targetBookshelfId,
      status,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (userBookError) {
    throw new Error(`책 추가 실패: ${userBookError.message}`);
  }

  if (!newUserBook) {
    throw new Error("책 추가 후 user_books ID를 가져올 수 없습니다.");
  }

  // 포인트 적립 (비동기로 처리하여 메인 플로우 차단하지 않음)
  try {
    // 스트릭 업데이트 (첫 활동 시 보너스)
    await updateStreak(currentUser);

    // 책 추가 포인트 적립
    await earnPoints("book_add", {
      user: currentUser,
      referenceId: newUserBook.id,
      referenceType: "user_book",
      description: `${bookData.title} 추가`,
    });
  } catch (pointError) {
    // 포인트 적립 실패해도 책 추가는 성공으로 처리
    console.error("포인트 적립 오류:", sanitizeErrorForLogging(pointError));
  }

  revalidatePath("/books");
  revalidatePath("/");

  return { success: true, bookId, userBookId: newUserBook.id };
}

/**
 * 책이 books 테이블에 있는지 확인하고, 없으면 생성
 * 내 서재(user_books)에는 추가하지 않음 (지정도서 추가 등에 사용)
 * @param bookData 책 데이터
 */
export async function ensureBook(bookData: AddBookInput): Promise<{ bookId: string }> {
  const supabase = await createServerSupabaseClient();

  let bookId: string;

  // ISBN이 있고 기존 책이 있는지 확인
  if (bookData.isbn) {
    const { data: existingBook, error: findError } = await supabase
      .from("books")
      .select("id")
      .eq("isbn", bookData.isbn)
      .maybeSingle();

    if (findError && findError.code !== "PGRST116") {
      throw new Error(`책 조회 실패: ${findError.message}`);
    }

    if (existingBook) {
      // 기존 책 재사용
      bookId = existingBook.id;
    } else {
      // 새 책 생성 - 페이지 수 자동 조회
      let totalPages: number | null = null;

      // ISBN이 있으면 페이지 수 조회 시도 (비동기, 실패해도 책 추가는 진행)
      try {
        const pageCountResult = await fetchBookPageCount(bookData.isbn);
        if (pageCountResult.pageCount) {
          totalPages = pageCountResult.pageCount;
          console.log(`[ensureBook] 페이지 수 조회 성공: ${bookData.isbn} -> ${totalPages}p (출처: ${pageCountResult.source})`);
        }
      } catch (error) {
        console.warn(`[ensureBook] 페이지 수 조회 실패 (무시하고 진행):`, error);
      }

      const { data: newBook, error: insertError } = await supabase
        .from("books")
        .insert({
          isbn: bookData.isbn,
          title: bookData.title,
          author: bookData.author,
          publisher: bookData.publisher,
          published_date: bookData.published_date,
          cover_image_url: bookData.cover_image_url,
          total_pages: totalPages,
        })
        .select("id")
        .single();

      if (insertError || !newBook) {
        throw new Error(`책 추가 실패: ${insertError?.message || "알 수 없는 오류"}`);
      }

      bookId = newBook.id;
    }
  } else {
    // ISBN이 없으면 새 책 생성
    const { data: newBook, error: insertError } = await supabase
      .from("books")
      .insert({
        title: bookData.title,
        author: bookData.author,
        publisher: bookData.publisher,
        published_date: bookData.published_date,
        cover_image_url: bookData.cover_image_url,
      })
      .select("id")
      .single();

    if (insertError || !newBook) {
      throw new Error(`책 추가 실패: ${insertError?.message || "알 수 없는 오류"}`);
    }

    bookId = newBook.id;
  }

  return { bookId };
}

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
 * 책 정보 업데이트 (읽는 이유, 시작일, 완독일자)
 * @param userBookId UserBooks 테이블의 ID
 * @param readingReason 읽는 이유 (선택)
 * @param startedAt 시작일 (선택)
 * @param completedDates 완독일자 배열 (선택)
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function updateBookInfo(
  userBookId: string,
  readingReason?: string | null,
  startedAt?: string | null,
  completedDates?: string[] | null,
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

  // 업데이트 데이터 준비
  const updateData: {
    reading_reason?: string | null;
    started_at?: string | null;
    completed_dates?: any;
  } = {};

  if (readingReason !== undefined) {
    updateData.reading_reason = readingReason?.trim() || null;
  }

  if (startedAt !== undefined) {
    updateData.started_at = startedAt || null;
  }

  if (completedDates !== undefined) {
    // JSONB 배열로 저장 (Supabase가 자동으로 JSONB로 변환)
    // 빈 배열이면 null로 저장
    updateData.completed_dates = completedDates && completedDates.length > 0 
      ? completedDates 
      : null;
  }

  // 업데이트할 데이터가 없으면 에러
  if (Object.keys(updateData).length === 0) {
    throw new Error("업데이트할 데이터가 없습니다.");
  }

  const { error } = await supabase
    .from("user_books")
    .update(updateData)
    .eq("id", userBookId);

  if (error) {
    throw new Error(`책 정보 업데이트 실패: ${error.message}`);
  }

  revalidatePath("/books");
  revalidatePath(`/books/${userBookId}`);
  revalidatePath("/");

  return { success: true };
}

/**
 * 사용자 책 목록 조회
 * 게스트 사용자의 경우 샘플 데이터 반환
 * @param status 필터링할 상태 (선택)
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function getUserBooks(
  status?: ReadingStatus,
  user?: User | null,
  bookshelfId?: string | null
) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  let currentUser = user;
  let authError = null;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: fetchedError,
    } = await supabase.auth.getUser();
    currentUser = fetchedUser;
    authError = fetchedError;
  }

  // 게스트 사용자인 경우 샘플 데이터 반환
  if (authError || !currentUser) {
    // 샘플 책 데이터 조회
    let query = supabase
      .from("books")
      .select(
        `
        id,
        isbn,
        title,
        author,
        publisher,
        published_date,
        cover_image_url,
        is_sample,
        created_at,
        updated_at
      `
      )
      .eq("is_sample", true)
      .order("created_at", { ascending: false })
      .limit(20); // 샘플 데이터는 최대 20개만

    const { data: sampleBooks, error: sampleError } = await query;

    if (sampleError) {
      // 샘플 데이터가 없어도 빈 배열 반환 (에러 발생하지 않음)
      return [];
    }

    // 샘플 데이터의 이미지가 없으면 네이버 API를 통해 가져오기
    // 이미지가 없는 책만 필터링하여 처리 (성능 최적화)
    const booksWithoutImages = (sampleBooks || []).filter(
      (book) => !book.cover_image_url && book.isbn
    );

    // 이미지가 없는 책들만 네이버 API로 검색 (배치 처리)
    if (booksWithoutImages.length > 0) {
      await Promise.all(
        booksWithoutImages.map(async (book) => {
          try {
            const searchQuery = `${book.title} ${book.author || ""}`.trim();
            const naverResponse = await searchBooks({ query: searchQuery, display: 1 });
            
            if (naverResponse.items && naverResponse.items.length > 0) {
              const naverBook = transformNaverBookItem(naverResponse.items[0]);
              
              // 네이버 API에서 가져온 이미지 URL로 업데이트
              if (naverBook.cover_image_url) {
                await supabase
                  .from("books")
                  .update({ cover_image_url: naverBook.cover_image_url })
                  .eq("id", book.id);
                
                // 메모리상의 book 객체도 업데이트
                book.cover_image_url = naverBook.cover_image_url;
              }
            }
          } catch (error) {
            // 네이버 API 호출 실패 시 무시 (기존 이미지 없음 상태 유지)
            // 에러 로깅은 개발 환경에서만
            if (process.env.NODE_ENV === "development") {
              console.error(`네이버 API 이미지 검색 실패 (${book.title}):`, error);
            }
          }
        })
      );
    }

    // 네이버에서도 표지를 못 찾은 책만 Open Library Covers로 보강 (배치 수 제한으로 병목/레이트리밋 방지)
    const stillWithoutCover = (sampleBooks || []).filter(
      (b) => !b.cover_image_url && b.isbn
    );
    const toBackfill = stillWithoutCover.slice(0, OPEN_LIBRARY_COVER_BATCH_LIMIT);
    for (const book of toBackfill) {
      try {
        const coverUrl = await resolveOpenLibraryCoverUrl(book.isbn!, {
          timeoutMs: OPEN_LIBRARY_COVER_TIMEOUT_MS,
        });
        if (coverUrl) {
          await supabase
            .from("books")
            .update({ cover_image_url: coverUrl })
            .eq("id", book.id);
          book.cover_image_url = coverUrl;
        }
      } catch {
        // 타임아웃/네트워크 실패 시 무시
      }
    }

    // 모든 책 반환 (이미지가 업데이트된 책 포함)
    const booksWithImages = sampleBooks || [];

    // 샘플 데이터를 user_books 형식으로 변환
    // 샘플 데이터는 상세 페이지 접근이 불가능하도록 특별한 ID 형식 사용
    return booksWithImages.map((book) => ({
      id: `sample-${book.id}`, // 샘플 데이터임을 표시하는 접두사 추가
      user_id: null, // 게스트는 user_id가 없음
      book_id: book.id,
      status: "reading" as ReadingStatus, // 기본값
      started_at: book.created_at || new Date().toISOString(),
      completed_at: null,
      created_at: book.created_at || new Date().toISOString(),
      updated_at: book.updated_at || new Date().toISOString(),
      books: book,
    }));
  }

  // 인증된 사용자는 기존 로직 사용
  let query = supabase
    .from("user_books")
    .select(
      `
      *,
      books (
        id,
        isbn,
        title,
        author,
        publisher,
        published_date,
        cover_image_url
      )
    `
    )
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  // bookshelfId 필터링
  // null이거나 제공되지 않으면 모든 서재의 책 조회 (메인 서재 뷰)
  // 특정 서재 ID가 제공되면 해당 서재의 책만 조회
  if (bookshelfId) {
    // 메인 서재인지 확인
    const { data: bookshelf } = await supabase
      .from("bookshelves")
      .select("is_main")
      .eq("id", bookshelfId)
      .eq("user_id", currentUser.id)
      .maybeSingle();

    // 메인 서재가 아니면 해당 서재의 책만 조회
    if (bookshelf && !bookshelf.is_main) {
      query = query.eq("bookshelf_id", bookshelfId);
    }
    // 메인 서재면 필터링하지 않음 (모든 서재의 책 조회)
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`책 목록 조회 실패: ${error.message}`);
  }

  const list = data || [];
  // 표지가 없는 책만 Open Library Covers로 보강 (요청당 최대 건수 제한)
  const withoutCover = list.filter(
    (ub) => ub.books && !(ub.books as { cover_image_url?: string | null }).cover_image_url && (ub.books as { isbn?: string | null }).isbn
  );
  const toBackfill = withoutCover.slice(0, OPEN_LIBRARY_COVER_BATCH_LIMIT);
  for (const ub of toBackfill) {
    const b = ub.books as { id: string; isbn: string | null; cover_image_url: string | null };
    try {
      const coverUrl = await resolveOpenLibraryCoverUrl(b.isbn!, {
        timeoutMs: OPEN_LIBRARY_COVER_TIMEOUT_MS,
      });
      if (coverUrl) {
        await supabase.from("books").update({ cover_image_url: coverUrl }).eq("id", b.id);
        b.cover_image_url = coverUrl;
      }
    } catch {
      // 무시
    }
  }

  return list;
}

export interface RelatedBookPreview {
  userBookId: string;
  coverImageUrl: string | null;
  title: string;
}

export interface BookWithNotes {
  id: string; // user_books.id
  status: ReadingStatus;
  reading_reason: string | null;
  completed_at: string | null;
  completed_dates?: any; // JSONB 배열
  started_at?: string;
  bookshelf_id?: string | null;
  current_page?: number; // 현재 읽은 페이지
  books: {
    id: string;
    title: string;
    author: string | null;
    publisher: string | null;
    isbn: string | null;
    published_date: string | null;
    cover_image_url: string | null;
    description_summary: string | null;
    summary: string | null;
    total_pages?: number | null; // 전체 페이지 수 (진행률 계산용)
    created_at?: string;
    updated_at?: string;
  };
  noteCount: number;
  latestNote?: {
    id: string;
    type: string;
    content: string | null;
    created_at: string;
  };
  groupBooks?: Array<{
    group_id: string;
    group_name: string;
    group_leader_id: string;
  }>; // 이 책이 지정도서로 등록된 모임 정보
  relatedBooks?: RelatedBookPreview[]; // 연결된 책 미리보기 (최대 3개)
}

export interface BookStats {
  total: number;
  reading: number;
  completed: number;
  paused: number;
  not_started: number;
  rereading: number;
}

/**
 * 책 목록 조회 (기록 개수 및 최근 기록 포함)
 * @param status 독서 상태 필터
 * @param query 검색어 (책 제목, 저자, ISBN)
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function getUserBooksWithNotes(
  status?: ReadingStatus,
  query?: string,
  user?: User | null,
  bookshelfId?: string | null
): Promise<{
  books: BookWithNotes[];
  stats: BookStats;
}> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  let currentUser = user;
  let authError = null;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: fetchedError,
    } = await supabase.auth.getUser();
    currentUser = fetchedUser;
    authError = fetchedError;
  }

  // 게스트 사용자인 경우 빈 결과 반환 (통계는 0)
  if (authError || !currentUser) {
    return {
      books: [],
      stats: {
        total: 0,
        reading: 0,
        completed: 0,
        paused: 0,
        not_started: 0,
        rereading: 0,
      },
    };
  }

  // bookshelf 정보를 한 번만 조회하여 캐싱 (중복 쿼리 방지)
  let cachedBookshelf: { is_main: boolean } | null = null;
  if (bookshelfId) {
    const { data: bookshelf } = await supabase
      .from("bookshelves")
      .select("is_main")
      .eq("id", bookshelfId)
      .eq("user_id", currentUser.id)
      .maybeSingle();
    cachedBookshelf = bookshelf;
  }

  // 상태별 통계 조회 (서재별 또는 전체)
  let statsQuery = supabase
    .from("user_books")
    .select("status")
    .eq("user_id", currentUser.id);

  // bookshelfId가 제공되면 해당 서재의 책만으로 통계 계산
  if (bookshelfId && cachedBookshelf && !cachedBookshelf.is_main) {
    // 메인 서재가 아니면 해당 서재의 책만 조회
    statsQuery = statsQuery.eq("bookshelf_id", bookshelfId);
  }
  // 메인 서재면 필터링하지 않음 (모든 서재의 책 조회)

  const { data: allUserBooks } = await statsQuery;

  const stats: BookStats = {
    total: allUserBooks?.length || 0,
    reading: allUserBooks?.filter((ub) => ub.status === "reading").length || 0,
    completed: allUserBooks?.filter((ub) => ub.status === "completed").length || 0,
    paused: allUserBooks?.filter((ub) => ub.status === "paused").length || 0,
    not_started: allUserBooks?.filter((ub) => ub.status === "not_started").length || 0,
    rereading: allUserBooks?.filter((ub) => ub.status === "rereading").length || 0,
  };

  // 책 목록 조회
  // reading_reason 컬럼이 아직 없을 수 있으므로 선택적으로 처리
  let booksQuery = supabase
    .from("user_books")
    .select(
      `
      id,
      status,
      completed_at,
      completed_dates,
      started_at,
      reading_reason,
      bookshelf_id,
      current_page,
      created_at,
      books (
        id,
        title,
        author,
        publisher,
        isbn,
        published_date,
        cover_image_url,
        description_summary,
        summary,
        total_pages,
        created_at,
        updated_at
      )
    `
    )
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  // bookshelfId 필터링 (캐싱된 bookshelf 정보 재사용)
  // null이거나 제공되지 않으면 모든 서재의 책 조회 (메인 서재 뷰)
  // 특정 서재 ID가 제공되면 해당 서재의 책만 조회
  if (bookshelfId && cachedBookshelf && !cachedBookshelf.is_main) {
    // 메인 서재가 아니면 해당 서재의 책만 조회
    booksQuery = booksQuery.eq("bookshelf_id", bookshelfId);
  }
  // 메인 서재면 필터링하지 않음 (모든 서재의 책 조회)

  // 상태 필터 적용
  if (status) {
    booksQuery = booksQuery.eq("status", status);
  }

  // 검색어 필터 적용
  if (query && query.trim()) {
    const sanitizedQuery = query.trim();
    // books 테이블에서 제목, 저자, ISBN으로 검색
    const { data: matchingBooks } = await supabase
      .from("books")
      .select("id")
      .or(
        `title.ilike.%${sanitizedQuery}%,author.ilike.%${sanitizedQuery}%,isbn.ilike.%${sanitizedQuery}%`
      );

    const matchingBookIds = matchingBooks?.map((b) => b.id) || [];

    if (matchingBookIds.length > 0) {
      booksQuery = booksQuery.in("book_id", matchingBookIds);
    } else {
      // 매칭되는 책이 없으면 빈 결과 반환
      return {
        books: [],
        stats,
      };
    }
  }

  const { data: userBooks, error } = await booksQuery;

  if (error) {
    throw new Error(`책 목록 조회 실패: ${error.message}`);
  }

  if (!userBooks || userBooks.length === 0) {
    return {
      books: [],
      stats,
    };
  }

  // 사용자가 멤버인 모임의 지정도서 정보 조회
  const { data: userMemberships } = await supabase
    .from("group_members")
    .select("group_id, groups!inner(id, name, leader_id)")
    .eq("user_id", currentUser.id)
    .eq("status", "approved");

  const userGroupIds = (userMemberships || []).map((m: any) => m.group_id);
  let groupBooksMap: Record<string, any[]> = {};

  if (userGroupIds.length > 0) {
    const bookIds = userBooks
      .map((ub: any) => ub.books?.id)
      .filter((id: string) => id);
    
    if (bookIds.length > 0) {
      const { data: groupBooks } = await supabase
        .from("group_books")
        .select(
          `
          book_id,
          group_id,
          groups (
            id,
            name,
            leader_id
          )
        `
        )
        .in("group_id", userGroupIds)
        .in("book_id", bookIds);

      // book_id별로 그룹 정보 그룹화
      groupBooksMap = (groupBooks || []).reduce((acc: any, gb: any) => {
        const bookId = gb.book_id;
        if (!acc[bookId]) {
          acc[bookId] = [];
        }
        if (gb.groups) {
          acc[bookId].push({
            group_id: gb.group_id,
            group_name: gb.groups.name,
            group_leader_id: gb.groups.leader_id,
          });
        }
        return acc;
      }, {});
    }
  }

  // 배치 쿼리로 모든 책의 노트 정보를 한 번에 조회 (N+1 문제 해결)
  const bookIds = userBooks
    .map((ub: any) => ub.books?.id)
    .filter((id: string | undefined): id is string => !!id);

  // 1. 모든 노트를 한 번에 조회 (노트 개수 및 최근 노트용)
  let notesData: any[] = [];
  if (bookIds.length > 0) {
    const { data: allNotes } = await supabase
      .from("notes")
      .select("id, type, content, created_at, book_id")
      .eq("user_id", currentUser.id)
      .in("book_id", bookIds)
      .order("created_at", { ascending: false });
    notesData = allNotes || [];
  }

  // 2. 메모리에서 book_id별로 그룹화하여 개수와 최근 노트 계산
  const noteCountMap: Record<string, number> = {};
  const latestNoteMap: Record<string, any> = {};

  for (const note of notesData) {
    const bookId = note.book_id;
    // 개수 집계
    noteCountMap[bookId] = (noteCountMap[bookId] || 0) + 1;
    // 최근 노트 (이미 created_at 내림차순 정렬되어 있음)
    if (!latestNoteMap[bookId]) {
      latestNoteMap[bookId] = {
        id: note.id,
        type: note.type,
        content: note.content,
        created_at: note.created_at,
      };
    }
  }

  // 2.5. 연결된 책 정보 조회 (user_book_relations)
  const userBookIds = userBooks.map((ub: any) => ub.id);
  let relatedBooksMap: Record<string, RelatedBookPreview[]> = {};

  if (userBookIds.length > 0) {
    const { data: relations } = await supabase
      .from("user_book_relations")
      .select(`
        source_user_book_id,
        target_user_book_id,
        target_book:user_books!user_book_relations_target_user_book_id_fkey (
          id,
          books (
            title,
            cover_image_url
          )
        )
      `)
      .eq("user_id", currentUser.id)
      .in("source_user_book_id", userBookIds)
      .order("created_at", { ascending: false });

    // source_user_book_id별로 연결된 책 그룹화 (최대 3개)
    for (const relation of relations || []) {
      const sourceId = relation.source_user_book_id;
      const targetBook = relation.target_book as any;

      if (!relatedBooksMap[sourceId]) {
        relatedBooksMap[sourceId] = [];
      }

      // 최대 3개만 저장
      if (relatedBooksMap[sourceId].length < 3 && targetBook?.books) {
        relatedBooksMap[sourceId].push({
          userBookId: relation.target_user_book_id,
          coverImageUrl: targetBook.books.cover_image_url || null,
          title: targetBook.books.title || "알 수 없는 책",
        });
      }
    }
  }

  // 3. 결과 매핑 (추가 쿼리 없이 메모리에서 처리)
  const booksWithNotes = userBooks.map((userBook: any) => {
    const bookId = userBook.books?.id;
    // reading_reason은 이미 user_books 조회 시 포함되어 있을 수 있음
    const readingReason = userBook.reading_reason || null;

    if (!bookId || !userBook.books) {
      return {
        id: userBook.id,
        status: userBook.status as ReadingStatus,
        reading_reason: readingReason,
        completed_at: userBook.completed_at || null,
        completed_dates: userBook.completed_dates || null,
        started_at: userBook.started_at || null,
        books: userBook.books || {
          id: "",
          title: "알 수 없는 책",
          author: null,
          publisher: null,
          isbn: null,
          published_date: null,
          cover_image_url: null,
          description_summary: null,
          summary: null,
        },
        noteCount: 0,
        groupBooks: groupBooksMap[bookId] || [],
      };
    }

    return {
      id: userBook.id,
      status: userBook.status as ReadingStatus,
      reading_reason: readingReason,
      completed_at: userBook.completed_at || null,
      completed_dates: userBook.completed_dates || null,
      started_at: userBook.started_at || null,
      current_page: userBook.current_page || 0,
      bookshelf_id: userBook.bookshelf_id || null,
      books: {
        id: userBook.books.id || "",
        title: userBook.books.title || "제목 없음",
        author: userBook.books.author || null,
        publisher: userBook.books.publisher || null,
        isbn: userBook.books.isbn || null,
        published_date: userBook.books.published_date || null,
        cover_image_url: userBook.books.cover_image_url || null,
        description_summary: userBook.books.description_summary || null,
        summary: userBook.books.summary || null,
        total_pages: userBook.books.total_pages || null,
        created_at: userBook.books.created_at,
        updated_at: userBook.books.updated_at,
      },
      noteCount: noteCountMap[bookId] || 0,
      latestNote: latestNoteMap[bookId],
      groupBooks: groupBooksMap[bookId] || [],
      relatedBooks: relatedBooksMap[userBook.id] || [],
      // 정렬을 위해 created_at 추가 (user_books의 created_at)
      created_at: userBook.created_at,
    };
  });

  // 4. 정렬 적용
  // - 완독/재독: 기록 개수(noteCount) 기준 내림차순
  // - 나머지: 등록일자(created_at) 기준 내림차순
  const sortedBooks = booksWithNotes.sort((a, b) => {
    const aStatus = a.status;
    const bStatus = b.status;
    
    // 완독 또는 재독인 경우 기록 개수 기준 정렬
    if ((aStatus === 'completed' || aStatus === 'rereading') && 
        (bStatus === 'completed' || bStatus === 'rereading')) {
      // 기록 개수가 같으면 등록일자 기준 (최근 등록이 위)
      if (b.noteCount === a.noteCount) {
        const aDate = new Date(a.created_at || 0).getTime();
        const bDate = new Date(b.created_at || 0).getTime();
        return bDate - aDate;
      }
      // 기록 개수 기준 내림차순
      return b.noteCount - a.noteCount;
    }
    
    // 한쪽만 완독/재독인 경우: 완독/재독이 위로
    if (aStatus === 'completed' || aStatus === 'rereading') {
      return -1;
    }
    if (bStatus === 'completed' || bStatus === 'rereading') {
      return 1;
    }
    
    // 둘 다 완독/재독이 아닌 경우: 등록일자 기준 내림차순
    const aDate = new Date(a.created_at || 0).getTime();
    const bDate = new Date(b.created_at || 0).getTime();
    return bDate - aDate;
  });

  return {
    books: sortedBooks,
    stats,
  };
}

/**
 * 책 상세 조회
 * @param userBookId UserBooks 테이블의 ID
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function getBookDetail(userBookId: string, user?: User | null) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();
    currentUser = fetchedUser;
  }

  // 게스트 사용자가 샘플 책 상세 페이지에 접근 시도
  if (!currentUser) {
    if (userBookId.startsWith("sample-")) {
      const bookId = userBookId.replace("sample-", "");
      const { data: sampleBook, error: sampleError } = await supabase
        .from("books")
        .select("*")
        .eq("id", bookId)
        .eq("is_sample", true)
        .single();

      if (sampleError || !sampleBook) {
        throw new Error("샘플 책을 찾을 수 없습니다.");
      }

      // 이미지 URL이 없으면 네이버 API로 동적 검색
      let finalCoverImageUrl = sampleBook.cover_image_url;
      if (!finalCoverImageUrl && sampleBook.isbn) {
        try {
          const { searchBooks: searchNaver } = await import("@/lib/api/naver");
          const naverResponse = await searchNaver({ query: sampleBook.isbn, display: 1 });
          if (naverResponse.items && naverResponse.items.length > 0) {
            finalCoverImageUrl = naverResponse.items[0].image;
            await supabase
              .from("books")
              .update({ cover_image_url: finalCoverImageUrl })
              .eq("id", sampleBook.id);
          }
        } catch (naverApiError) {
          if (process.env.NODE_ENV === "development") {
            console.warn(`네이버 API 이미지 검색 실패 (ISBN: ${sampleBook.isbn}):`, naverApiError);
          }
        }
        // 네이버에서도 없으면 Open Library Covers 폴백 (타임아웃으로 응답 지연 제한)
        if (!finalCoverImageUrl && sampleBook.isbn) {
          try {
            const openLibUrl = await resolveOpenLibraryCoverUrl(sampleBook.isbn, {
              timeoutMs: OPEN_LIBRARY_COVER_TIMEOUT_MS,
            });
            if (openLibUrl) {
              await supabase
                .from("books")
                .update({ cover_image_url: openLibUrl })
                .eq("id", sampleBook.id);
              finalCoverImageUrl = openLibUrl;
            }
          } catch {
            // 무시
          }
        }
      }

      return {
        id: userBookId,
        user_id: null,
        book_id: sampleBook.id,
        status: "reading" as ReadingStatus,
        started_at: sampleBook.created_at || new Date().toISOString(),
        completed_at: null,
        created_at: sampleBook.created_at || new Date().toISOString(),
        updated_at: sampleBook.updated_at || new Date().toISOString(),
        books: { ...sampleBook, cover_image_url: finalCoverImageUrl },
      };
    } else {
      throw new Error("로그인이 필요합니다.");
    }
  }

  console.log("getBookDetail: 책 상세 조회 시작", { userBookId, userId: currentUser.id });

  const { data, error } = await supabase
    .from("user_books")
    .select(
      `
      *,
      completed_dates,
      current_page,
      books (
        id,
        isbn,
        title,
        author,
        publisher,
        published_date,
        cover_image_url,
        total_pages
      )
    `
    )
    .eq("id", userBookId)
    .eq("user_id", currentUser.id)
    .single();

  if (error) {
    console.error("getBookDetail: Supabase 쿼리 오류", {
      userBookId,
      userId: currentUser.id,
      error: error.message,
      errorCode: error.code,
      errorDetails: error.details,
      errorHint: error.hint,
    });
    throw new Error(`책 상세 조회 실패: ${error.message || "책을 찾을 수 없습니다."}`);
  }

  if (!data) {
    console.error("getBookDetail: 데이터가 없습니다", {
      userBookId,
      userId: currentUser.id,
    });
    throw new Error("책을 찾을 수 없습니다.");
  }

  // 표지가 없고 ISBN이 있으면 Open Library Covers 폴백 1회 (타임아웃으로 병목 방지)
  const bookRow = data.books as { id: string; isbn: string | null; cover_image_url: string | null } | null;
  if (bookRow && !bookRow.cover_image_url && bookRow.isbn) {
    try {
      const openLibUrl = await resolveOpenLibraryCoverUrl(bookRow.isbn, {
        timeoutMs: OPEN_LIBRARY_COVER_TIMEOUT_MS,
      });
      if (openLibUrl) {
        await supabase
          .from("books")
          .update({ cover_image_url: openLibUrl })
          .eq("id", bookRow.id);
        Object.assign(bookRow, { cover_image_url: openLibUrl });
      }
    } catch {
      // 무시
    }
  }

  console.log("getBookDetail: 책 상세 조회 성공", {
    userBookId,
    bookId: data.book_id,
    bookTitle: data.books?.title,
    completed_at: data.completed_at,
    completed_dates: data.completed_dates,
    completed_dates_type: typeof data.completed_dates,
  });

  return data;
}

/**
 * 책 삭제
 * @param userBookId UserBooks 테이블의 ID
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function deleteBook(userBookId: string, user?: User | null) {
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

  // 사용자의 책인지 확인 및 book_id 조회
  const { data: userBook, error: bookCheckError } = await supabase
    .from("user_books")
    .select("id, book_id")
    .eq("id", userBookId)
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (bookCheckError && bookCheckError.code !== "PGRST116") {
    throw new Error("책 조회에 실패했습니다.");
  }

  if (!userBook) {
    throw new Error("권한이 없습니다. 해당 책을 삭제할 권한이 없습니다.");
  }

  // 해당 책의 모든 기록 조회 (이미지 파일 삭제를 위해)
  const { data: notes, error: notesError } = await supabase
    .from("notes")
    .select("id, image_url")
    .eq("book_id", userBook.book_id)
    .eq("user_id", currentUser.id);

  if (notesError) {
    console.error("기록 조회 오류:", notesError);
    // 기록 조회 실패해도 책 삭제는 진행
  }

  // 기록의 이미지 파일 삭제
  if (notes && notes.length > 0) {
    for (const note of notes) {
      if (note.image_url) {
        try {
          const url = new URL(note.image_url);
          const pathParts = url.pathname.split("/storage/v1/object/public/");
          
          if (pathParts.length === 2) {
            const fullPath = pathParts[1];
            const pathSegments = fullPath.split("/");
            
            if (pathSegments.length >= 2) {
              const bucket = pathSegments[0];
              const filePath = pathSegments.slice(1).join("/");

              const { error: removeError } = await supabase.storage
                .from(bucket)
                .remove([filePath]);

              if (removeError) {
                const safeError = sanitizeErrorForLogging(removeError);
                console.error("이미지 삭제 오류:", safeError);
                // 이미지 삭제 실패해도 책 삭제는 진행
              }
            }
          }
        } catch (error) {
          const safeError = sanitizeErrorForLogging(error);
          console.error("이미지 삭제 오류:", safeError);
          // 이미지 삭제 실패해도 책 삭제는 진행
        }
      }
    }
  }

  // user_books에서 삭제 (CASCADE로 notes도 자동 삭제됨)
  const { error } = await supabase
    .from("user_books")
    .delete()
    .eq("id", userBookId);

  if (error) {
    throw new Error(`책 삭제 실패: ${error.message}`);
  }

  revalidatePath("/books");
  revalidatePath("/");
  revalidatePath(`/books/${userBookId}`);

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
 * 마지막 읽던 책 (계속 읽기) 조회
 * 가장 최근에 활동(노트 작성 또는 진행률 업데이트)한 읽는 중인 책을 반환
 * @param user 선택적 사용자 정보
 */
export async function getContinueReadingBook(user?: User | null): Promise<{
  userBookId: string;
  bookId: string;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  currentPage: number;
  totalPages: number | null;
  progressPercent: number;
  lastActivityAt: string;
} | null> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !fetchedUser) {
      return null;
    }
    currentUser = fetchedUser;
  }

  // 읽는 중인 책 목록 조회 (최근 업데이트순)
  const { data: readingBooks, error: booksError } = await supabase
    .from("user_books")
    .select(`
      id,
      book_id,
      current_page,
      updated_at,
      books (
        id,
        title,
        author,
        cover_image_url,
        total_pages
      )
    `)
    .eq("user_id", currentUser.id)
    .in("status", ["reading", "rereading"])
    .order("updated_at", { ascending: false })
    .limit(5);

  if (booksError || !readingBooks || readingBooks.length === 0) {
    return null;
  }

  // 각 책의 최근 노트 작성일 조회
  const bookIds = readingBooks.map((rb: any) => rb.book_id).filter(Boolean);

  const { data: recentNotes } = await supabase
    .from("notes")
    .select("book_id, created_at")
    .eq("user_id", currentUser.id)
    .in("book_id", bookIds)
    .order("created_at", { ascending: false });

  // book_id별 최근 노트 날짜 맵 생성
  const noteActivityMap: Record<string, string> = {};
  for (const note of recentNotes || []) {
    if (!noteActivityMap[note.book_id]) {
      noteActivityMap[note.book_id] = note.created_at;
    }
  }

  // 가장 최근 활동한 책 찾기
  let mostRecentBook = readingBooks[0];
  let mostRecentActivity = mostRecentBook.updated_at;

  for (const book of readingBooks) {
    const noteActivity = noteActivityMap[book.book_id];
    const bookActivity = book.updated_at;
    const latestActivity = noteActivity && noteActivity > bookActivity ? noteActivity : bookActivity;

    if (latestActivity > mostRecentActivity) {
      mostRecentActivity = latestActivity;
      mostRecentBook = book;
    }
  }

  const bookData = mostRecentBook.books as any;
  if (!bookData) return null;

  const currentPage = mostRecentBook.current_page || 0;
  const totalPages = bookData.total_pages || null;
  const progressPercent = totalPages && totalPages > 0
    ? Math.min(Math.round((currentPage / totalPages) * 100), 100)
    : 0;

  return {
    userBookId: mostRecentBook.id,
    bookId: mostRecentBook.book_id,
    title: bookData.title,
    author: bookData.author,
    coverImageUrl: bookData.cover_image_url,
    currentPage,
    totalPages,
    progressPercent,
    lastActivityAt: mostRecentActivity,
  };
}

/**
 * 계속 읽기 책 목록 조회 (최대 3개)
 * 읽는 중 또는 다시 읽는 중인 책들을 최근 활동 순으로 반환
 */
export async function getContinueReadingBooks(user?: User | null, maxCount: number = 3): Promise<Array<{
  userBookId: string;
  bookId: string;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  currentPage: number;
  totalPages: number | null;
  progressPercent: number;
  lastActivityAt: string;
}>> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !fetchedUser) {
      return [];
    }
    currentUser = fetchedUser;
  }

  // 읽는 중인 책 목록 조회 (최근 업데이트순)
  const { data: readingBooks, error: booksError } = await supabase
    .from("user_books")
    .select(`
      id,
      book_id,
      current_page,
      updated_at,
      books (
        id,
        title,
        author,
        cover_image_url,
        total_pages
      )
    `)
    .eq("user_id", currentUser.id)
    .in("status", ["reading", "rereading"])
    .order("updated_at", { ascending: false })
    .limit(10);

  if (booksError || !readingBooks || readingBooks.length === 0) {
    return [];
  }

  // 각 책의 최근 노트 작성일 조회
  const bookIds = readingBooks.map((rb: any) => rb.book_id).filter(Boolean);

  const { data: recentNotes } = await supabase
    .from("notes")
    .select("book_id, created_at")
    .eq("user_id", currentUser.id)
    .in("book_id", bookIds)
    .order("created_at", { ascending: false });

  // book_id별 최근 노트 날짜 맵 생성
  const noteActivityMap: Record<string, string> = {};
  for (const note of recentNotes || []) {
    if (!noteActivityMap[note.book_id]) {
      noteActivityMap[note.book_id] = note.created_at;
    }
  }

  // 각 책의 최근 활동일 기준으로 정렬
  const booksWithActivity = readingBooks.map((book: any) => {
    const bookData = book.books as any;
    if (!bookData) return null;

    const noteActivity = noteActivityMap[book.book_id];
    const bookActivity = book.updated_at;
    const latestActivity = noteActivity && noteActivity > bookActivity ? noteActivity : bookActivity;

    const currentPage = book.current_page || 0;
    const totalPages = bookData.total_pages || null;
    const progressPercent = totalPages && totalPages > 0
      ? Math.min(Math.round((currentPage / totalPages) * 100), 100)
      : 0;

    return {
      userBookId: book.id,
      bookId: book.book_id,
      title: bookData.title,
      author: bookData.author,
      coverImageUrl: bookData.cover_image_url,
      currentPage,
      totalPages,
      progressPercent,
      lastActivityAt: latestActivity,
    };
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  // 최근 활동일 기준 정렬 후 최대 maxCount개 반환
  return booksWithActivity
    .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime())
    .slice(0, maxCount);
}

/**
 * ISBN으로 책표지 URL 조회 (네이버 API → Open Library 폴백)
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

