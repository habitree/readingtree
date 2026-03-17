"use server";

import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/app/actions/auth";
import { revalidatePath } from "next/cache";
import { fetchBookPageCount } from "@/lib/api/book-page-count";
import type { ReadingStatus } from "@/types/book";
import { isValidUUID, sanitizeErrorForLogging } from "@/lib/utils/validation";
import type { User } from "@supabase/supabase-js";
import { earnPoints, updateStreak } from "../points";
import { getBookDescriptionSummary as _getBookDescriptionSummary } from '../ai/summarization';
import { normalizePublishedDate } from "./_shared";
import type { AddBookInput } from "./_shared";

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
): Promise<{ success: true; bookId: string; userBookId: string } | { success: false; error: string }> {
  try {
    const supabase = await createServerSupabaseClient();

    // 현재 사용자 확인
    let currentUser = user;
    if (!currentUser) {
      currentUser = await getCurrentUser();
      if (!currentUser) {
        return { success: false, error: "로그인이 필요합니다." };
      }
    }

    // 사용자 프로필이 users 테이블에 존재하는지 확인
    const { data: userProfile } = await supabase
      .from("users")
      .select("id")
      .eq("id", currentUser.id)
      .maybeSingle();

    // 프로필이 없으면 생성 (Foreign Key Constraint 방지)
    if (!userProfile) {
      const rawAvatar = currentUser.user_metadata?.avatar_url || null;
      const safeAvatar = rawAvatar?.startsWith("http://") ? rawAvatar.replace("http://", "https://") : rawAvatar;
      const { error: insertProfileError } = await supabase.from("users").insert({
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.user_metadata?.name || currentUser.email?.split("@")[0] || "사용자",
        avatar_url: safeAvatar,
        reading_goal: 12,
      });

      if (insertProfileError) {
        return { success: false, error: `프로필 생성 실패: ${insertProfileError.message}` };
      }
    }

    let bookId: string;

    // ISBN이 있고 기존 책이 있는지 확인
    if (bookData.isbn) {
      const { data: existingBook, error: findError } = await supabase
        .from("books")
        .select("id")
        .eq("isbn", bookData.isbn)
        .maybeSingle();

      if (findError && findError.code !== "PGRST116") {
        return { success: false, error: `책 조회 실패: ${findError.message}` };
      }

      if (existingBook) {
        bookId = existingBook.id;
      } else {
        // 새 책 생성 - 페이지 수 자동 조회 (5초 타임아웃)
        let totalPages: number | null = null;

        try {
          const pageCountResult = await Promise.race([
            fetchBookPageCount(bookData.isbn),
            new Promise<{ pageCount: null; source: null; error: string }>((resolve) =>
              setTimeout(() => resolve({ pageCount: null, source: null, error: "timeout" }), 5000)
            ),
          ]);
          if (pageCountResult.pageCount) {
            totalPages = pageCountResult.pageCount;
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
          return { success: false, error: `책 추가 실패: ${insertError?.message || "알 수 없는 오류"}` };
        }

        bookId = newBook.id;
      }
    } else {
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
        return { success: false, error: `책 추가 실패: ${insertError?.message || "알 수 없는 오류"}` };
      }

      bookId = newBook.id;
    }

    // 사용자가 이미 이 책을 추가했는지 확인
    const { data: existingUserBook, error: checkError } = await supabase
      .from("user_books")
      .select("id")
      .eq("user_id", currentUser.id)
      .eq("book_id", bookId)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      return { success: false, error: `중복 체크 실패: ${checkError.message}` };
    }

    if (existingUserBook) {
      return { success: false, error: "이미 추가된 책입니다." };
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
        let newBookshelf = null;
        let createBookshelfError = null;

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
            createBookshelfError = regularError;
          }
        }

        if (!newBookshelf) {
          console.error("[addBook] 메인 서재 생성 실패:", createBookshelfError);
          return { success: false, error: "메인 서재 생성에 실패했습니다. 다시 시도해주세요." };
        }
        targetBookshelfId = newBookshelf.id;
      } else {
        targetBookshelfId = mainBookshelf.id;
      }
    } else {
      const { data: bookshelf } = await supabase
        .from("bookshelves")
        .select("id")
        .eq("id", targetBookshelfId)
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (!bookshelf) {
        return { success: false, error: "서재를 찾을 수 없거나 권한이 없습니다." };
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
      return { success: false, error: `책 추가 실패: ${userBookError.message}` };
    }

    if (!newUserBook) {
      return { success: false, error: "책 추가 후 데이터를 가져올 수 없습니다." };
    }

    // 포인트 적립 (실패해도 책 추가는 성공으로 처리)
    try {
      await updateStreak(currentUser);
      await earnPoints("book_add", {
        user: currentUser,
        referenceId: newUserBook.id,
        referenceType: "user_book",
        description: `${bookData.title} 추가`,
      });
    } catch (pointError) {
      console.error("포인트 적립 오류:", sanitizeErrorForLogging(pointError));
    }

    revalidatePath("/books");
    revalidatePath("/");

    return { success: true, bookId, userBookId: newUserBook.id };
  } catch (error) {
    console.error("[addBook] 예기치 않은 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "책 추가 중 오류가 발생했습니다.",
    };
  }
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

  return { bookId };
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
    currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("로그인이 필요합니다.");
    }
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
 * 책 삭제
 * @param userBookId UserBooks 테이블의 ID
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function deleteBook(userBookId: string, user?: User | null) {
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

  // 기록의 이미지 파일 삭제 (버킷별 일괄 삭제로 성능 최적화)
  if (notes && notes.length > 0) {
    // 버킷별로 파일 경로 수집
    const bucketPathsMap = new Map<string, string[]>();

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

              if (!bucketPathsMap.has(bucket)) {
                bucketPathsMap.set(bucket, []);
              }
              bucketPathsMap.get(bucket)!.push(filePath);
            }
          }
        } catch (error) {
          const safeError = sanitizeErrorForLogging(error);
          console.error("이미지 URL 파싱 오류:", safeError);
        }
      }
    }

    // 버킷별 일괄 삭제 실행
    const deletePromises = Array.from(bucketPathsMap.entries()).map(
      async ([bucket, paths]) => {
        try {
          const { error: removeError } = await supabase.storage
            .from(bucket)
            .remove(paths);

          if (removeError) {
            const safeError = sanitizeErrorForLogging(removeError);
            console.error(`[${bucket}] 이미지 일괄 삭제 오류:`, safeError);
          }
        } catch (error) {
          const safeError = sanitizeErrorForLogging(error);
          console.error(`[${bucket}] 이미지 삭제 오류:`, safeError);
        }
      }
    );

    // 모든 버킷 삭제 작업을 병렬로 실행 (실패해도 책 삭제는 진행)
    await Promise.all(deletePromises);
  }

  // 해당 사용자의 notes 레코드 명시적 삭제
  // (notes는 books.id를 참조하므로 user_books 삭제 시 CASCADE 되지 않음)
  const { error: deleteNotesError } = await supabase
    .from("notes")
    .delete()
    .eq("book_id", userBook.book_id)
    .eq("user_id", currentUser.id);

  if (deleteNotesError) {
    console.error("기록 삭제 오류:", deleteNotesError);
    // 기록 삭제 실패해도 책 삭제는 진행
  }

  // user_books에서 삭제
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
