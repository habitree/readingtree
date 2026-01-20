"use server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { ReadingStatus } from "@/types/book";
import type { BookWithNotes, BookStats } from "@/app/actions/books";
import type { BookshelfWithStats } from "@/types/bookshelf";
import type { NoteWithBook } from "@/types/note";

/**
 * 관리자(샘플 사용자) ID를 동적으로 조회
 * is_admin = TRUE인 첫 번째 사용자를 샘플 사용자로 사용
 */
export async function getSampleUserId(): Promise<string> {
  // 환경 변수가 설정되어 있으면 우선 사용
  const envSampleUserId = process.env.NEXT_PUBLIC_SAMPLE_USER_ID;
  if (envSampleUserId) {
    return envSampleUserId;
  }

  // 환경 변수가 없으면 is_admin = TRUE인 사용자 조회
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("is_admin", true)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    throw new Error("샘플 사용자(관리자)를 찾을 수 없습니다.");
  }

  return data.id;
}

/**
 * 샘플 사용자의 메인 서재 조회
 */
export async function getSampleMainBookshelf() {
  const sampleUserId = await getSampleUserId();
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("bookshelves")
    .select("*")
    .eq("user_id", sampleUserId)
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
 * 관리자(is_admin = TRUE)의 공개 데이터를 샘플로 표시
 */
export async function getSampleBooksWithNotes(
  status?: ReadingStatus,
  query?: string
): Promise<{
  books: BookWithNotes[];
  stats: BookStats;
}> {
  const sampleUserId = await getSampleUserId();
  const supabase = createAdminSupabaseClient();

  // 상태별 통계 조회
  const { data: allUserBooks } = await supabase
    .from("user_books")
    .select("status")
    .eq("user_id", sampleUserId);

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
    .eq("user_id", sampleUserId)
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
      .eq("user_id", sampleUserId)
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

/**
 * 샘플 사용자의 책 상세 조회
 * Admin Client를 사용하여 RLS 우회
 */
export async function getSampleBookDetail(userBookId: string) {
  const sampleUserId = await getSampleUserId();
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("user_books")
    .select(
      `
      *,
      completed_dates,
      books (
        id,
        isbn,
        title,
        author,
        publisher,
        published_date,
        cover_image_url,
        description_summary,
        summary
      )
    `
    )
    .eq("id", userBookId)
    .eq("user_id", sampleUserId)
    .single();

  if (error || !data) {
    throw new Error("샘플 책을 찾을 수 없습니다.");
  }

  return data;
}

/**
 * 샘플 사용자의 서재 목록 조회 (통계 포함)
 */
export async function getSampleBookshelves(): Promise<BookshelfWithStats[]> {
  const sampleUserId = await getSampleUserId();
  const supabase = createAdminSupabaseClient();

  // 모든 서재 조회
  const { data: bookshelves, error } = await supabase
    .from("bookshelves")
    .select("*")
    .eq("user_id", sampleUserId)
    .order("order", { ascending: true });

  if (error) {
    throw new Error(`샘플 서재 목록 조회 실패: ${error.message}`);
  }

  if (!bookshelves || bookshelves.length === 0) {
    return [];
  }

  // 각 서재의 통계 계산
  const bookshelvesWithStats: BookshelfWithStats[] = await Promise.all(
    bookshelves.map(async (bookshelf) => {
      const { data: userBooks } = await supabase
        .from("user_books")
        .select("status")
        .eq("bookshelf_id", bookshelf.id);

      const statusCounts = {
        reading: 0,
        completed: 0,
        paused: 0,
        not_started: 0,
        rereading: 0,
      };

      if (userBooks) {
        userBooks.forEach((ub) => {
          if (ub.status in statusCounts) {
            statusCounts[ub.status as keyof typeof statusCounts]++;
          }
        });
      }

      return {
        ...bookshelf,
        book_count: userBooks?.length || 0,
        reading_count: statusCounts.reading,
        completed_count: statusCounts.completed,
        paused_count: statusCounts.paused,
        not_started_count: statusCounts.not_started,
        rereading_count: statusCounts.rereading,
      };
    })
  );

  // 메인 서재를 맨 앞으로 정렬
  return bookshelvesWithStats.sort((a, b) => {
    if (a.is_main) return -1;
    if (b.is_main) return 1;
    return a.order - b.order;
  });
}

/**
 * 샘플 사용자의 특정 서재 조회 (통계 포함)
 */
export async function getSampleBookshelfWithStats(bookshelfId: string): Promise<BookshelfWithStats | null> {
  const sampleUserId = await getSampleUserId();
  const supabase = createAdminSupabaseClient();

  // 서재 조회
  const { data: bookshelf, error } = await supabase
    .from("bookshelves")
    .select("*")
    .eq("id", bookshelfId)
    .eq("user_id", sampleUserId)
    .single();

  if (error || !bookshelf) {
    return null;
  }

  // 서재의 책 목록 조회
  const { data: userBooks } = await supabase
    .from("user_books")
    .select("status")
    .eq("bookshelf_id", bookshelfId);

  const statusCounts = {
    reading: 0,
    completed: 0,
    paused: 0,
    not_started: 0,
    rereading: 0,
  };

  if (userBooks) {
    userBooks.forEach((ub) => {
      if (ub.status in statusCounts) {
        statusCounts[ub.status as keyof typeof statusCounts]++;
      }
    });
  }

  return {
    ...bookshelf,
    book_count: userBooks?.length || 0,
    reading_count: statusCounts.reading,
    completed_count: statusCounts.completed,
    paused_count: statusCounts.paused,
    not_started_count: statusCounts.not_started,
    rereading_count: statusCounts.rereading,
  };
}

/**
 * 샘플 서재의 책 목록 조회 + 통계
 */
export async function getSampleBookshelfBooks(
  bookshelfId: string,
  status?: ReadingStatus,
  query?: string
): Promise<{
  books: BookWithNotes[];
  stats: BookStats;
}> {
  const sampleUserId = await getSampleUserId();
  const supabase = createAdminSupabaseClient();

  // 상태별 통계 조회
  const { data: allUserBooks } = await supabase
    .from("user_books")
    .select("status")
    .eq("user_id", sampleUserId)
    .eq("bookshelf_id", bookshelfId);

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
    .eq("user_id", sampleUserId)
    .eq("bookshelf_id", bookshelfId)
    .order("created_at", { ascending: false });

  // 상태 필터 적용
  if (status) {
    booksQuery = booksQuery.eq("status", status);
  }

  // 검색어 필터 적용
  if (query && query.trim()) {
    const sanitizedQuery = query.trim();
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
      return { books: [], stats };
    }
  }

  const { data: userBooks, error } = await booksQuery;

  if (error) {
    throw new Error(`샘플 서재 책 목록 조회 실패: ${error.message}`);
  }

  if (!userBooks || userBooks.length === 0) {
    return { books: [], stats };
  }

  // 결과 매핑
  const books = userBooks.map((userBook: any) => ({
    id: userBook.id,
    status: userBook.status as ReadingStatus,
    reading_reason: userBook.reading_reason || null,
    completed_at: userBook.completed_at || null,
    completed_dates: userBook.completed_dates || null,
    started_at: userBook.started_at || null,
    books: {
      id: userBook.books?.id || "",
      title: userBook.books?.title || "제목 없음",
      author: userBook.books?.author || null,
      publisher: userBook.books?.publisher || null,
      isbn: userBook.books?.isbn || null,
      published_date: userBook.books?.published_date || null,
      cover_image_url: userBook.books?.cover_image_url || null,
      description_summary: userBook.books?.description_summary || null,
      summary: userBook.books?.summary || null,
      created_at: userBook.books?.created_at,
      updated_at: userBook.books?.updated_at,
    },
    noteCount: 0,
    groupBooks: [],
    created_at: userBook.created_at,
  }));

  return { books, stats };
}

/**
 * 샘플 사용자의 특정 책 노트 목록 조회
 * userBookId(샘플 사용자의 user_books.id)를 받아서 해당 책의 노트 반환
 */
export async function getSampleNotes(userBookId: string): Promise<NoteWithBook[]> {
  const sampleUserId = await getSampleUserId();
  const supabase = createAdminSupabaseClient();

  // userBookId로 book_id(books.id) 조회
  const { data: userBook, error: userBookError } = await supabase
    .from("user_books")
    .select("book_id")
    .eq("id", userBookId)
    .eq("user_id", sampleUserId)
    .single();

  if (userBookError || !userBook) {
    return [];
  }

  // 샘플 사용자의 해당 책 노트 조회
  const { data: notes, error: notesError } = await supabase
    .from("notes")
    .select(`
      *,
      books (
        id,
        title,
        author,
        cover_image_url
      )
    `)
    .eq("user_id", sampleUserId)
    .eq("book_id", userBook.book_id)
    .order("created_at", { ascending: false });

  if (notesError || !notes) {
    return [];
  }

  // NoteWithBook 형태로 변환
  return notes.map((note: any) => {
    const book = Array.isArray(note.books) ? note.books[0] : note.books;
    const { books, ...restNote } = note;
    return {
      ...restNote,
      book: book || undefined,
    };
  }) as NoteWithBook[];
}

/**
 * 샘플 사용자의 전체 노트 목록 조회 (기록 페이지용)
 */
export async function getSampleAllNotes(): Promise<NoteWithBook[]> {
  const sampleUserId = await getSampleUserId();
  const supabase = createAdminSupabaseClient();

  const { data: notes, error } = await supabase
    .from("notes")
    .select(`
      *,
      books (
        id,
        title,
        author,
        cover_image_url
      )
    `)
    .eq("user_id", sampleUserId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !notes) {
    return [];
  }

  return notes.map((note: any) => {
    const book = Array.isArray(note.books) ? note.books[0] : note.books;
    const { books, ...restNote } = note;
    return {
      ...restNote,
      book: book || undefined,
    };
  }) as NoteWithBook[];
}
