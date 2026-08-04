/**
 * AI 추천 책 자동 등록 유틸리티
 *
 * AI 응답에서 [[recommend:「제목」:저자명]] 패턴을 파싱하여
 * 책 검색 API → books + user_books 등록 → [[book:userBookId:「제목」]] 치환
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { searchBooks, transformBookItem } from "@/lib/api/book-search";

const RECOMMEND_PATTERN = /\[\[recommend:「([^」]+)」:([^\]]+)\]\]/g;

/**
 * AI 응답 내 [[recommend:...]] 패턴을 처리하여 책을 자동 등록하고 링크로 치환
 * @param content AI 응답 원본 텍스트
 * @param userId 사용자 ID
 * @returns 치환된 텍스트 (recommend → book 링크 또는 평문 fallback)
 */
export async function processRecommendedBooks(
  content: string,
  userId: string
): Promise<string> {
  // 패턴 매칭 수집
  const matches: { full: string; title: string; author: string }[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(RECOMMEND_PATTERN.source, "g");

  while ((match = regex.exec(content)) !== null) {
    matches.push({
      full: match[0],
      title: match[1],
      author: match[2],
    });
  }

  if (matches.length === 0) {
    return content;
  }

  const supabase = await createServerSupabaseClient();
  let result = content;

  // 사용자의 메인 서재 ID 조회 (한 번만)
  let mainBookshelfId: string | null = null;
  const { data: mainBookshelf } = await supabase
    .from("bookshelves")
    .select("id")
    .eq("user_id", userId)
    .eq("is_main", true)
    .maybeSingle();

  if (mainBookshelf) {
    mainBookshelfId = mainBookshelf.id;
  } else {
    // 메인 서재가 없으면 생성
    const { data: newBookshelf } = await supabase
      .from("bookshelves")
      .insert({
        user_id: userId,
        name: "내 서재",
        is_main: true,
        order: 0,
      })
      .select("id")
      .single();

    if (newBookshelf) {
      mainBookshelfId = newBookshelf.id;
    }
  }

  for (const { full, title, author } of matches) {
    try {
      // 1. 책 검색 API 조회
      const searchResult = await searchBooks({
        query: `${title} ${author}`,
        display: 1,
      });

      if (!searchResult.items || searchResult.items.length === 0) {
        // 검색 결과 없음 → 평문 fallback
        result = result.replace(full, `「${title}」 (${author})`);
        continue;
      }

      const bookData = transformBookItem(searchResult.items[0]);

      // 2. books 테이블에 등록 (ISBN 중복 체크)
      let bookId: string;

      if (bookData.isbn) {
        const { data: existingBook } = await supabase
          .from("books")
          .select("id")
          .eq("isbn", bookData.isbn)
          .maybeSingle();

        if (existingBook) {
          bookId = existingBook.id;
        } else {
          const { data: newBook, error: insertError } = await supabase
            .from("books")
            .insert({
              isbn: bookData.isbn,
              title: bookData.title,
              author: bookData.author,
              publisher: bookData.publisher,
              published_date: bookData.published_date,
              cover_image_url: bookData.cover_image_url,
            })
            .select("id")
            .single();

          if (insertError || !newBook) {
            result = result.replace(full, `「${title}」 (${author})`);
            continue;
          }
          bookId = newBook.id;
        }
      } else {
        // ISBN 없는 경우 제목+저자로 중복 체크
        const { data: existingBook } = await supabase
          .from("books")
          .select("id")
          .eq("title", bookData.title)
          .eq("author", bookData.author)
          .maybeSingle();

        if (existingBook) {
          bookId = existingBook.id;
        } else {
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
            result = result.replace(full, `「${title}」 (${author})`);
            continue;
          }
          bookId = newBook.id;
        }
      }

      // 3. user_books에 추가 (이미 있으면 기존 ID 사용)
      let userBookId: string;

      const { data: existingUserBook } = await supabase
        .from("user_books")
        .select("id")
        .eq("user_id", userId)
        .eq("book_id", bookId)
        .maybeSingle();

      if (existingUserBook) {
        userBookId = existingUserBook.id;
      } else if (mainBookshelfId) {
        const { data: newUserBook, error: userBookError } = await supabase
          .from("user_books")
          .insert({
            user_id: userId,
            book_id: bookId,
            bookshelf_id: mainBookshelfId,
            status: "not_started",
          })
          .select("id")
          .single();

        if (userBookError || !newUserBook) {
          result = result.replace(full, `「${title}」 (${author})`);
          continue;
        }
        userBookId = newUserBook.id;
      } else {
        // 서재가 없으면 평문 fallback
        result = result.replace(full, `「${title}」 (${author})`);
        continue;
      }

      // 4. [[recommend:...]] → [[book:userBookId:「제목」]] 치환
      result = result.replace(full, `[[book:${userBookId}:「${bookData.title}」]]`);
    } catch (error) {
      console.error(`[processRecommendedBooks] 책 등록 실패 (${title}):`, error);
      // graceful fallback
      result = result.replace(full, `「${title}」 (${author})`);
    }
  }

  return result;
}
