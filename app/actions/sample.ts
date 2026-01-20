"use server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { ReadingStatus } from "@/types/book";
import type { BookWithNotes, BookStats } from "@/app/actions/books";

const SAMPLE_USER_ID = process.env.NEXT_PUBLIC_SAMPLE_USER_ID;

/**
 * 샘플 사용자의 메인 서재 조회
 */
export async function getSampleMainBookshelf() {
  if (!SAMPLE_USER_ID) {
    throw new Error("샘플 사용자 ID가 설정되지 않았습니다.");
  }

  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("bookshelves")
    .select("*")
    .eq("user_id", SAMPLE_USER_ID)
    .eq("is_main", true)
    .maybeSingle();

  if (error) {
    throw new Error(`샘플 서재 조회 실패: ${error.message}`);
  }

  return data;
}

/**
 * 샘플 사용자의 책 목록 + 통계 조회
 * Admin Client를 사용하여 RLS 우회 (비로그인 사용자 대응)
 */
export async function getSampleBooksWithNotes(
  status?: ReadingStatus,
  query?: string
): Promise<{
  books: BookWithNotes[];
  stats: BookStats;
}> {
  if (!SAMPLE_USER_ID) {
    throw new Error("샘플 사용자 ID가 설정되지 않았습니다.");
  }

  const supabase = createAdminSupabaseClient();

  // 상태별 통계 조회
  const { data: allUserBooks } = await supabase
    .from("user_books")
    .select("status")
    .eq("user_id", SAMPLE_USER_ID);

  const stats: BookStats = {
    total: allUserBooks?.length || 0,
    reading: allUserBooks?.filter((ub) => ub.status === "reading").length || 0,
    completed: allUserBooks?.filter((ub) => ub.status === "completed").length || 0,
    paused: allUserBooks?.filter((ub) => ub.status === "paused").length || 0,
    not_started: allUserBooks?.filter((ub) => ub.status === "not_started").length || 0,
    rereading: allUserBooks?.filter((ub) => ub.status === "rereading").length || 0,
  };

  // 책 목록 조회
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
        created_at,
        updated_at
      )
    `
    )
    .eq("user_id", SAMPLE_USER_ID)
    .order("created_at", { ascending: false });

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
    throw new Error(`샘플 책 목록 조회 실패: ${error.message}`);
  }

  if (!userBooks || userBooks.length === 0) {
    return {
      books: [],
      stats,
    };
  }

  // 배치 쿼리로 모든 책의 노트 정보를 한 번에 조회
  const bookIds = userBooks
    .map((ub: any) => ub.books?.id)
    .filter((id: string | undefined): id is string => !!id);

  // 모든 노트를 한 번에 조회
  let notesData: any[] = [];
  if (bookIds.length > 0) {
    const { data: allNotes } = await supabase
      .from("notes")
      .select("id, type, content, created_at, book_id")
      .eq("user_id", SAMPLE_USER_ID)
      .in("book_id", bookIds)
      .order("created_at", { ascending: false });
    notesData = allNotes || [];
  }

  // 메모리에서 book_id별로 그룹화하여 개수와 최근 노트 계산
  const noteCountMap: Record<string, number> = {};
  const latestNoteMap: Record<string, any> = {};

  for (const note of notesData) {
    const bookId = note.book_id;
    noteCountMap[bookId] = (noteCountMap[bookId] || 0) + 1;
    if (!latestNoteMap[bookId]) {
      latestNoteMap[bookId] = {
        id: note.id,
        type: note.type,
        content: note.content,
        created_at: note.created_at,
      };
    }
  }

  // 결과 매핑
  const booksWithNotes = userBooks.map((userBook: any) => {
    const bookId = userBook.books?.id;
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
        groupBooks: [],
      };
    }

    return {
      id: userBook.id,
      status: userBook.status as ReadingStatus,
      reading_reason: readingReason,
      completed_at: userBook.completed_at || null,
      completed_dates: userBook.completed_dates || null,
      started_at: userBook.started_at || null,
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
        created_at: userBook.books.created_at,
        updated_at: userBook.books.updated_at,
      },
      noteCount: noteCountMap[bookId] || 0,
      latestNote: latestNoteMap[bookId],
      groupBooks: [],
      created_at: userBook.created_at,
    };
  });

  // 정렬 적용
  const sortedBooks = booksWithNotes.sort((a, b) => {
    const aStatus = a.status;
    const bStatus = b.status;

    if ((aStatus === 'completed' || aStatus === 'rereading') &&
        (bStatus === 'completed' || bStatus === 'rereading')) {
      if (b.noteCount === a.noteCount) {
        const aDate = new Date(a.created_at || 0).getTime();
        const bDate = new Date(b.created_at || 0).getTime();
        return bDate - aDate;
      }
      return b.noteCount - a.noteCount;
    }

    if (aStatus === 'completed' || aStatus === 'rereading') {
      return -1;
    }
    if (bStatus === 'completed' || bStatus === 'rereading') {
      return 1;
    }

    const aDate = new Date(a.created_at || 0).getTime();
    const bDate = new Date(b.created_at || 0).getTime();
    return bDate - aDate;
  });

  return {
    books: sortedBooks,
    stats,
  };
}
