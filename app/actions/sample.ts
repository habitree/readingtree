"use server";

import { cache } from "react";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { ReadingStatus } from "@/types/book";
import type { BookWithNotes, BookStats } from "@/app/actions/books";
import type { BookshelfWithStats } from "@/types/bookshelf";
import type { NoteWithBook } from "@/types/note";
import type { UserPersona } from "@/types/persona";

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

  // 환경 변수가 없으면 is_admin = TRUE인 사용자 중 노트가 가장 많은 사용자 조회
  const supabase = createAdminSupabaseClient();
  const { data: admins, error } = await supabase
    .from("users")
    .select("id")
    .eq("is_admin", true);

  if (error || !admins || admins.length === 0) {
    throw new Error("샘플 사용자(관리자)를 찾을 수 없습니다.");
  }

  // 관리자가 1명이면 바로 반환
  if (admins.length === 1) {
    return admins[0].id;
  }

  // 여러 관리자 중 노트가 가장 많은 관리자 선택
  const adminIds = admins.map((a) => a.id);
  const { data: noteCounts } = await supabase
    .from("notes")
    .select("user_id")
    .in("user_id", adminIds);

  if (!noteCounts || noteCounts.length === 0) {
    return admins[0].id;
  }

  const countMap = new Map<string, number>();
  for (const n of noteCounts) {
    countMap.set(n.user_id, (countMap.get(n.user_id) || 0) + 1);
  }

  // 노트가 가장 많은 관리자 ID 반환
  let bestId = admins[0].id;
  let maxCount = 0;
  for (const [userId, count] of countMap) {
    if (count > maxCount) {
      maxCount = count;
      bestId = userId;
    }
  }

  return bestId;
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

  // 모든 노트를 한 번에 조회 (content 제외 - 내서재에서 미사용)
  let notesData: any[] = [];
  if (bookIds.length > 0) {
    const { data: allNotes } = await supabase
      .from("notes")
      .select("id, type, created_at, book_id")
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
        total_pages,
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

  // 샘플 사용자의 해당 책 노트 조회 (transcriptions JOIN 포함)
  const { data: notes, error: notesError } = await supabase
    .from("notes")
    .select(`
      *,
      books (
        id,
        title,
        author,
        cover_image_url
      ),
      transcriptions (
        extracted_text,
        raw_extracted_text,
        status
      )
    `)
    .eq("user_id", sampleUserId)
    .eq("book_id", userBook.book_id)
    .order("created_at", { ascending: false });

  if (notesError || !notes) {
    return [];
  }

  // NoteWithBook 형태로 변환 (transcription 포함)
  return notes.map((note: any) => {
    const book = Array.isArray(note.books) ? note.books[0] : note.books;
    const transcription = note.transcriptions || undefined;
    const { books, transcriptions, ...restNote } = note;
    return {
      ...restNote,
      book: book || undefined,
      transcription: transcription || undefined,
    };
  }) as NoteWithBook[];
}

/**
 * 샘플 사용자의 특정 노트 상세 조회 (게스트 기록 상세 페이지용)
 * 샘플 사용자의 노트만 조회 가능
 */
export async function getSampleNoteDetail(noteId: string) {
  const sampleUserId = await getSampleUserId();
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("notes")
    .select(`
      *,
      books (
        id,
        title,
        author,
        cover_image_url
      ),
      transcriptions (
        extracted_text,
        raw_extracted_text,
        status
      )
    `)
    .eq("id", noteId)
    .eq("user_id", sampleUserId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new Error(`샘플 노트 조회 실패: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  // user_books.id 조회 (책 상세 페이지 링크용)
  let userBookId = null;
  if (data.book_id) {
    const { data: userBook } = await supabase
      .from("user_books")
      .select("id")
      .eq("book_id", data.book_id)
      .eq("user_id", sampleUserId)
      .maybeSingle();

    if (userBook) {
      userBookId = userBook.id;
    }
  }

  // Supabase 조인 결과 정규화
  const { transcriptions, books, ...restData } = data as any;
  const book = Array.isArray(books) ? books[0] : books;

  return {
    ...restData,
    book: book || undefined,
    transcription: transcriptions || undefined,
    user_book_id: userBookId,
  };
}

/**
 * 샘플 사용자의 특정 user_book ID 목록으로 책 정보 조회 (게스트 연결된 책 표시용)
 */
export async function getSampleUserBooksByIds(userBookIds: string[]) {
  if (!userBookIds || userBookIds.length === 0) return [];

  const sampleUserId = await getSampleUserId();
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("user_books")
    .select(`
      id,
      books (
        id,
        title,
        author,
        cover_image_url
      )
    `)
    .eq("user_id", sampleUserId)
    .in("id", userBookIds);

  if (error || !data) return [];
  return data;
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

// =============================================================================
// 대시보드 샘플 데이터 (게스트 사용자용)
// =============================================================================

/**
 * 샘플 사용자의 대시보드 통계 조회 (게스트 대시보드용)
 * - 연속 기록 일수 (streak)
 * - 오늘 기록 수
 * - 이번 주 기록 수
 */
export async function getSampleDashboardStats(): Promise<{
  streak: number;
  todayNotes: number;
  weeklyNotes: number;
}> {
  try {
    const sampleUserId = await getSampleUserId();
    const supabase = createAdminSupabaseClient();

    // KST 기준 오늘
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const kstToday = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - 9 * 60 * 60 * 1000);
    const kstTodayKey = `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, "0")}-${String(kst.getUTCDate()).padStart(2, "0")}`;

    // 최근 30일 기록 조회
    const thirtyDaysAgo = new Date(kstToday.getTime() - 30 * 24 * 60 * 60 * 1000);

    const { data: notes } = await supabase
      .from("notes")
      .select("created_at")
      .eq("user_id", sampleUserId)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (!notes || notes.length === 0) {
      return { streak: 0, todayNotes: 0, weeklyNotes: 0 };
    }

    // 날짜별 그룹화
    const dateCountMap = new Map<string, number>();
    let todayNotes = 0;

    for (const note of notes) {
      const noteKst = new Date(new Date(note.created_at).getTime() + 9 * 60 * 60 * 1000);
      const dateKey = `${noteKst.getUTCFullYear()}-${String(noteKst.getUTCMonth() + 1).padStart(2, "0")}-${String(noteKst.getUTCDate()).padStart(2, "0")}`;

      if (dateKey === kstTodayKey) {
        todayNotes++;
      }
      dateCountMap.set(dateKey, (dateCountMap.get(dateKey) || 0) + 1);
    }

    // 연속 일수 계산
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const checkTime = kstToday.getTime() - i * 24 * 60 * 60 * 1000;
      const checkKst = new Date(checkTime + 9 * 60 * 60 * 1000);
      const dateKey = `${checkKst.getUTCFullYear()}-${String(checkKst.getUTCMonth() + 1).padStart(2, "0")}-${String(checkKst.getUTCDate()).padStart(2, "0")}`;

      if (dateCountMap.has(dateKey)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // 이번 주 기록 수 (KST 기준 월요일~오늘)
    const dayOfWeek = kst.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(kstToday.getTime() - mondayOffset * 24 * 60 * 60 * 1000);

    let weeklyNotes = 0;
    for (const note of notes) {
      if (new Date(note.created_at) >= weekStart) {
        weeklyNotes++;
      }
    }

    return { streak, todayNotes, weeklyNotes };
  } catch {
    return { streak: 0, todayNotes: 0, weeklyNotes: 0 };
  }
}

/**
 * 샘플 사용자의 "계속 읽기" 책 목록 (게스트 대시보드용)
 */
export async function getSampleContinueReadingBooks(maxCount: number = 6): Promise<Array<{
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
  try {
    const sampleUserId = await getSampleUserId();
    const supabase = createAdminSupabaseClient();

    // 읽는 중인 책 조회
    const { data: readingBooks } = await supabase
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
      .eq("user_id", sampleUserId)
      .in("status", ["reading", "rereading"])
      .order("updated_at", { ascending: false })
      .limit(10);

    if (!readingBooks || readingBooks.length === 0) {
      return [];
    }

    // 각 책의 최근 노트 작성일 조회
    const bookIds = readingBooks.map((rb: any) => rb.book_id).filter(Boolean);

    const { data: recentNotes } = await supabase
      .from("notes")
      .select("book_id, created_at")
      .eq("user_id", sampleUserId)
      .in("book_id", bookIds)
      .order("created_at", { ascending: false });

    const noteActivityMap: Record<string, string> = {};
    for (const note of recentNotes || []) {
      if (!noteActivityMap[note.book_id]) {
        noteActivityMap[note.book_id] = note.created_at;
      }
    }

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

    return booksWithActivity
      .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime())
      .slice(0, maxCount);
  } catch {
    return [];
  }
}

/**
 * 샘플 사용자의 월별 독서 활동 조회 (게스트 Tertiary Zone용)
 * DailyBookActivity 형식으로 반환하여 MonthlyBookCalendar와 호환
 */
export async function getSampleMonthlyActivities(
  year: number,
  month: number
): Promise<Record<string, any>> {
  try {
    const sampleUserId = await getSampleUserId();
    const supabase = createAdminSupabaseClient();

    // 월 시작/끝 계산 (KST 기준)
    const startDate = new Date(Date.UTC(year, month - 1, 1) - 9 * 60 * 60 * 1000);
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59) - 9 * 60 * 60 * 1000);

    // 해당 월의 노트 조회 (표지 이미지 포함)
    const { data: notes, error: notesError } = await supabase
      .from("notes")
      .select("created_at, type, book_id, books(id, title, cover_image_url)")
      .eq("user_id", sampleUserId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: true });

    if (notesError) {
      console.error("[getSampleMonthlyActivities] notes 조회 오류:", notesError.message, { sampleUserId, start: startDate.toISOString(), end: endDate.toISOString() });
      return {};
    }

    if (!notes || notes.length === 0) {
      console.warn("[getSampleMonthlyActivities] 해당 월에 노트 없음:", { sampleUserId, year, month });
      return {};
    }

    // user_books ID 매핑 조회 (null book_id 제외)
    const bookIds = [...new Set(notes.map((n) => n.book_id).filter((id): id is string => id != null))];
    const { data: userBooksData } = bookIds.length > 0
      ? await supabase
          .from("user_books")
          .select("id, book_id")
          .eq("user_id", sampleUserId)
          .in("book_id", bookIds)
      : { data: [] };

    const userBookIdMap = new Map<string, string>();
    if (userBooksData) {
      userBooksData.forEach((ub) => userBookIdMap.set(ub.book_id, ub.id));
    }

    // DailyBookActivity 형식으로 날짜별 그룹화
    const dailyActivities: Record<string, any> = {};

    for (const note of notes) {
      const noteKst = new Date(new Date(note.created_at).getTime() + 9 * 60 * 60 * 1000);
      const dateKey = `${noteKst.getUTCFullYear()}-${String(noteKst.getUTCMonth() + 1).padStart(2, "0")}-${String(noteKst.getUTCDate()).padStart(2, "0")}`;

      if (!dailyActivities[dateKey]) {
        dailyActivities[dateKey] = {
          date: dateKey,
          books: [],
          noteTypes: {
            transcription: 0,
            photo: 0,
            memo: 0,
            quote: 0,
            progress: 0,
            total: 0,
          },
        };
      }

      // 기록 타입별 카운트
      const noteType = note.type as string;
      if (noteType in dailyActivities[dateKey].noteTypes && noteType !== "total") {
        dailyActivities[dateKey].noteTypes[noteType]++;
      }
      dailyActivities[dateKey].noteTypes.total++;

      // 같은 날짜에 같은 책 중복 방지
      const book = Array.isArray(note.books) ? note.books[0] : note.books;
      const existingBook = dailyActivities[dateKey].books.find(
        (b: any) => b.bookId === note.book_id
      );

      if (!existingBook && book) {
        dailyActivities[dateKey].books.push({
          bookId: note.book_id,
          userBookId: userBookIdMap.get(note.book_id) || note.book_id,
          title: (book as any)?.title || "알 수 없는 책",
          coverImageUrl: (book as any)?.cover_image_url || null,
        });
      }
    }

    return dailyActivities;
  } catch (error) {
    console.error("[getSampleMonthlyActivities] 예외 발생:", error instanceof Error ? error.message : error);
    return {};
  }
}

/**
 * 샘플 사용자의 페르소나 대시보드 데이터 (게스트 독서 성향 페이지용)
 */
export const getSamplePersonaDashboardData = cache(async (): Promise<{
  persona: UserPersona | null;
  needsAnalysis: boolean;
  analysisAge: number | null;
}> => {
  try {
    const sampleUserId = await getSampleUserId();
    const supabase = createAdminSupabaseClient();

    const { data: persona } = await supabase
      .from("user_personas")
      .select("*")
      .eq("user_id", sampleUserId)
      .maybeSingle();

    return {
      persona: persona as UserPersona | null,
      needsAnalysis: false,
      analysisAge: null,
    };
  } catch {
    return {
      persona: null,
      needsAnalysis: false,
      analysisAge: null,
    };
  }
});

/**
 * 샘플 사용자(관리자)의 포인트 대시보드 데이터 조회 (게스트 대시보드용)
 * Admin Client를 사용하여 RLS 우회
 */
export async function getSamplePointsDashboardData(): Promise<{
  userLevel: number;
  levelTitle: string | undefined;
  totalPoints: number;
}> {
  try {
    const sampleUserId = await getSampleUserId();
    const supabase = createAdminSupabaseClient();

    // 병렬로 포인트 + 레벨 조회
    const [userPointsResult, levelsResult] = await Promise.all([
      supabase
        .from("user_points")
        .select("total_points, current_level, lifetime_points")
        .eq("user_id", sampleUserId)
        .maybeSingle(),
      supabase
        .from("point_levels")
        .select("level, title, required_points")
        .order("required_points", { ascending: true }),
    ]);

    const userPoints = userPointsResult.data;
    const levels = levelsResult.data || [];

    if (!userPoints) {
      return { userLevel: 1, levelTitle: undefined, totalPoints: 0 };
    }

    const currentLevel = levels.find(
      (l) => l.level === (userPoints.current_level || 1)
    );

    return {
      userLevel: userPoints.current_level || 1,
      levelTitle: currentLevel?.title ?? undefined,
      totalPoints: userPoints.total_points || 0,
    };
  } catch {
    return { userLevel: 1, levelTitle: undefined, totalPoints: 0 };
  }
}
