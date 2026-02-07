"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { NoteWithBook } from "@/types/note";
import type { User } from "@supabase/supabase-js";

export type TimelineSortBy = "latest" | "oldest" | "book";

/**
 * 샘플 사용자(관리자) ID를 동적으로 조회
 */
async function getSampleUserId(): Promise<string | null> {
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
    return null;
  }

  return data.id;
}

/**
 * 타임라인 조회
 * 게스트 사용자의 경우 샘플 데이터 반환
 * @param sortBy 정렬 방식 (latest: 최신순, oldest: 오래된순, book: 책별)
 * @param page 페이지 번호 (기본값: 1)
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function getTimeline(
  sortBy: TimelineSortBy = "latest",
  page: number = 1,
  user?: User | null
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

  const ITEMS_PER_PAGE = 20;
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  // 게스트 사용자인 경우 샘플 사용자(관리자) 데이터 반환
  if (authError || !currentUser) {
    const sampleUserId = await getSampleUserId();

    if (!sampleUserId) {
      // 샘플 사용자가 없으면 빈 결과 반환
      return {
        items: [],
        total: 0,
        page,
        totalPages: 0,
        itemsPerPage: ITEMS_PER_PAGE,
      };
    }

    // Admin Client로 RLS 우회하여 샘플 사용자 데이터 조회
    const adminSupabase = createAdminSupabaseClient();

    let query = adminSupabase
      .from("notes")
      .select(
        `
        *,
        books (
          id,
          title,
          author,
          cover_image_url
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", sampleUserId);

    // 정렬 적용
    if (sortBy === "latest") {
      query = query.order("created_at", { ascending: false });
    } else if (sortBy === "oldest") {
      query = query.order("created_at", { ascending: true });
    } else if (sortBy === "book") {
      query = query
        .order("book_id", { ascending: true })
        .order("created_at", { ascending: false });
    }

    // 페이지네이션
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("샘플 타임라인 조회 오류:", error);
      return {
        items: [],
        total: 0,
        page,
        totalPages: 0,
        itemsPerPage: ITEMS_PER_PAGE,
      };
    }

    const totalPages = count ? Math.ceil(count / ITEMS_PER_PAGE) : 0;

    // Supabase 조인 결과가 배열로 반환될 수 있으므로 객체로 변환
    const items = (data || []).map((note: any) => {
      const book = Array.isArray(note.books) ? note.books[0] : (note.books || note.book);
      const { books, ...restNote } = note;
      return {
        ...restNote,
        book: book || null,
      };
    }) as NoteWithBook[];

    return {
      items,
      total: count || 0,
      page,
      totalPages,
      itemsPerPage: ITEMS_PER_PAGE,
    };
  }

  // 인증된 사용자는 기존 로직 사용
  let query = supabase
    .from("notes")
    .select(
      `
      *,
      books (
        id,
        title,
        author,
        cover_image_url
      )
    `,
      { count: "exact" }
    )
    .eq("user_id", currentUser.id);

  // 정렬 적용
  if (sortBy === "latest") {
    query = query.order("created_at", { ascending: false });
  } else if (sortBy === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else if (sortBy === "book") {
    query = query
      .order("book_id", { ascending: true })
      .order("created_at", { ascending: false });
  }

  // 페이지네이션
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`타임라인 조회 실패: ${error.message}`);
  }

  const totalPages = count ? Math.ceil(count / ITEMS_PER_PAGE) : 0;

  // Supabase 조인 결과가 배열로 반환될 수 있으므로 객체로 변환
  // Supabase는 `books` 키로 반환하지만 타입은 `book` (단수)로 정의됨
  const items = (data || []).map((note: any) => {
    // books가 배열인 경우 첫 번째 요소 사용, 객체인 경우 그대로 사용
    const book = Array.isArray(note.books) ? note.books[0] : (note.books || note.book);
    const { books, ...restNote } = note; // books 키 제거
    return {
      ...restNote,
      book: book || null, // book (단수)로 변환
    };
  }) as NoteWithBook[];

  return {
    items,
    total: count || 0,
    page,
    totalPages,
    itemsPerPage: ITEMS_PER_PAGE,
  };
}

/**
 * 독서 통계 조회
 * 게스트 사용자의 경우 샘플 데이터 통계 반환
 * 이번 주, 올해 통계 및 인기 책 반환
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function getReadingStats(user?: User | null) {
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

  // 게스트 사용자인 경우 샘플 사용자(관리자) 통계 반환
  if (authError || !currentUser) {
    const sampleUserId = await getSampleUserId();

    if (!sampleUserId) {
      return {
        thisWeek: { notes: 0 },
        thisYear: { completedBooks: 0, notes: 0 },
        topBooks: [],
        recentBooks: [],
      };
    }

    const adminSupabase = createAdminSupabaseClient();
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // 샘플 사용자의 이번 주 기록 수
    const { count: thisWeekNotes } = await adminSupabase
      .from("notes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", sampleUserId)
      .gte("created_at", new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // 샘플 사용자의 올해 기록 수
    const { count: thisYearNotes } = await adminSupabase
      .from("notes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", sampleUserId)
      .gte("created_at", startOfYear.toISOString());

    // 샘플 사용자의 올해 완독 책 수
    const { count: completedBooks } = await adminSupabase
      .from("user_books")
      .select("*", { count: "exact", head: true })
      .eq("user_id", sampleUserId)
      .eq("status", "completed")
      .gte("completed_at", startOfYear.toISOString());

    // 샘플 사용자의 가장 많이 기록한 책 (상위 5개만 필요하므로 500건이면 충분)
    const { data: topBooksData } = await adminSupabase
      .from("notes")
      .select(
        `
        book_id,
        books (
          id,
          title,
          author,
          cover_image_url
        )
      `
      )
      .eq("user_id", sampleUserId)
      .limit(500);

    // 샘플 사용자의 최근 기록한 책 (최근 기록 기준 상위 5개)
    const { data: recentBooksData } = await adminSupabase
      .from("notes")
      .select(
        `
        book_id,
        created_at,
        books (
          id,
          title,
          author,
          cover_image_url
        )
      `
      )
      .eq("user_id", sampleUserId)
      .order("created_at", { ascending: false })
      .limit(100);

    // user_books ID 매핑
    const { data: userBooksData } = await adminSupabase
      .from("user_books")
      .select("id, book_id")
      .eq("user_id", sampleUserId);

    const userBookIdMap = new Map<string, string>();
    if (userBooksData) {
      userBooksData.forEach((ub) => userBookIdMap.set(ub.book_id, ub.id));
    }

    // 책별 기록 수 집계
    const bookCounts = new Map<string, { count: number; book: any; userBookId: string }>();
    if (topBooksData) {
      topBooksData.forEach((note) => {
        const bookId = note.book_id;
        const book = (note.books as any);
        if (book) {
          const userBookId = userBookIdMap.get(bookId) || bookId;
          const existing = bookCounts.get(bookId);
          if (existing) {
            existing.count++;
          } else {
            bookCounts.set(bookId, { count: 1, book: { ...book }, userBookId });
          }
        }
      });
    }

    const topBooks = Array.from(bookCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item) => ({
        book: { ...item.book, id: item.userBookId },
        noteCount: item.count,
      }));

    // 최근 기록한 책 (중복 제거, 최신순)
    const recentBooksMap = new Map<string, { book: any; latestDate: string; userBookId: string; bookId: string }>();
    if (recentBooksData) {
      recentBooksData.forEach((note) => {
        const bookId = note.book_id;
        const book = (note.books as any);
        if (book) {
          const userBookId = userBookIdMap.get(bookId) || bookId;
          const existing = recentBooksMap.get(bookId);

          if (!existing || new Date(note.created_at) > new Date(existing.latestDate)) {
            recentBooksMap.set(bookId, {
              book: { ...book },
              latestDate: note.created_at,
              userBookId,
              bookId,
            });
          }
        }
      });
    }

    const recentBooks = Array.from(recentBooksMap.values())
      .sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime())
      .slice(0, 5)
      .map((item) => ({
        book: { ...item.book, id: item.userBookId },
        noteCount: bookCounts.get(item.bookId)?.count || 1,
      }));

    return {
      thisWeek: {
        notes: thisWeekNotes || 0,
      },
      thisYear: {
        completedBooks: completedBooks || 0,
        notes: thisYearNotes || 0,
      },
      topBooks,
      recentBooks,
    };
  }

  // 인증된 사용자는 기존 로직 사용
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // 이번 주 기록 수 (데이터베이스 함수 활용)
  const { data: thisWeekNotesData, error: weekError } = await supabase.rpc(
    "get_user_notes_count_this_week",
    { p_user_id: currentUser.id }
  );
  const thisWeekNotes = weekError ? 0 : (thisWeekNotesData || 0);

  // 올해 완독한 책 수 (데이터베이스 함수 활용)
  const { data: thisYearCompletedData, error: yearError } = await supabase.rpc(
    "get_user_completed_books_count",
    { p_user_id: currentUser.id, p_year: now.getFullYear() }
  );
  const thisYearCompleted = yearError ? 0 : (thisYearCompletedData || 0);

  // 올해 작성한 기록 수
  const { count: thisYearNotes } = await supabase
    .from("notes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", currentUser.id)
    .gte("created_at", startOfYear.toISOString());

  // 가장 많이 기록한 책 (상위 5개만 필요하므로 50건이면 충분)
  const { data: topBooksData } = await supabase
    .from("notes")
    .select(
      `
      book_id,
      books (
        id,
        title,
        author,
        cover_image_url
      )
    `
    )
    .eq("user_id", currentUser.id)
    .limit(500);

  // 최근 기록한 책 (최근 기록 기준 상위 5개)
  const { data: recentBooksData } = await supabase
    .from("notes")
    .select(
      `
      book_id,
      created_at,
      books (
        id,
        title,
        author,
        cover_image_url
      )
    `
    )
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false })
    .limit(100);

  // 사용자의 user_books ID 가져오기 (매핑용)
  const { data: userBooksData } = await supabase
    .from("user_books")
    .select("id, book_id")
    .eq("user_id", currentUser.id);

  const userBookIdMap = new Map<string, string>();
  if (userBooksData) {
    userBooksData.forEach((ub) => userBookIdMap.set(ub.book_id, ub.id));
  }

  // 책별 기록 수 집계 (가장 많이 기록한 책용)
  const bookCounts = new Map<string, { count: number; book: any }>();
  if (topBooksData) {
    topBooksData.forEach((note) => {
      const bookId = note.book_id;
      const book = (note.books as any);
      if (book) {
        const existing = bookCounts.get(bookId);
        // user_books ID가 있는지 확인하여 교체 (상세 페이지 링크 호환성)
        const userBookId = userBookIdMap.get(bookId) || bookId;
        const bookWithUserBookId = { ...book, id: userBookId };

        if (existing) {
          existing.count++;
        } else {
          bookCounts.set(bookId, { count: 1, book: bookWithUserBookId });
        }
      }
    });
  }

  const topBooks = Array.from(bookCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((item) => ({
      book: item.book,
      noteCount: item.count,
    }));

  // 최근 기록한 책 (중복 제거, 최신순)
  const recentBooksMap = new Map<string, { book: any; latestDate: string }>();
  if (recentBooksData) {
    recentBooksData.forEach((note) => {
      const bookId = note.book_id;
      const book = (note.books as any);
      if (book) {
        const userBookId = userBookIdMap.get(bookId) || bookId;
        const bookWithUserBookId = { ...book, id: userBookId };
        const existing = recentBooksMap.get(bookId);
        
        if (!existing || new Date(note.created_at) > new Date(existing.latestDate)) {
          recentBooksMap.set(bookId, {
            book: bookWithUserBookId,
            latestDate: note.created_at,
          });
        }
      }
    });
  }

  // 최근 기록한 책을 최신순으로 정렬
  const recentBooks = Array.from(recentBooksMap.values())
    .sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime())
    .slice(0, 5)
    .map((item) => ({
      book: item.book,
      noteCount: bookCounts.get(item.book.id)?.count || 1, // 기록 수 표시용
    }));

  return {
    thisWeek: {
      notes: thisWeekNotes || 0,
    },
    thisYear: {
      completedBooks: thisYearCompleted || 0,
      notes: thisYearNotes || 0,
    },
    topBooks,
    recentBooks,
  };
}

/**
 * 목표 진행률 조회
 * 게스트 사용자의 경우 샘플 목표 데이터 반환
 * 올해 독서 목표 대비 완독한 책 수
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function getGoalProgress(user?: User | null) {
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

  // 게스트 사용자인 경우 샘플 사용자(관리자) 목표 데이터 반환
  if (authError || !currentUser) {
    const sampleUserId = await getSampleUserId();

    if (!sampleUserId) {
      return { goal: 0, completed: 0, progress: 0, remaining: 0 };
    }

    const adminSupabase = createAdminSupabaseClient();

    // 샘플 사용자의 목표 조회
    const { data: profile } = await adminSupabase
      .from("users")
      .select("reading_goal")
      .eq("id", sampleUserId)
      .single();

    const goal = profile?.reading_goal || 0;

    // 샘플 사용자의 올해 완독 책 수
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const { count: completedCount } = await adminSupabase
      .from("user_books")
      .select("*", { count: "exact", head: true })
      .eq("user_id", sampleUserId)
      .eq("status", "completed")
      .gte("completed_at", startOfYear.toISOString());

    const completed = completedCount || 0;
    const progress = goal > 0 ? Math.min((completed / goal) * 100, 100) : 0;

    return {
      goal,
      completed,
      progress: Math.round(progress),
      remaining: Math.max(goal - completed, 0),
    };
  }

  // 인증된 사용자는 기존 로직 사용
  // 사용자 목표 조회
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("reading_goal")
    .eq("id", currentUser.id)
    .single();

  // 프로필이 없거나 목표가 설정되지 않은 경우 기본값 반환
  if (profileError || !profile) {
    // 프로필이 없으면 기본값 반환 (온보딩으로 리다이렉트하지 않음 - 대시보드에서 처리)
    return {
      goal: 0,
      completed: 0,
      progress: 0,
      remaining: 0,
    };
  }

  const goal = profile.reading_goal || 0;

  // 올해 완독한 책 수 (데이터베이스 함수 활용)
  const currentYear = new Date().getFullYear();
  const { data: completedData, error: completedError } = await supabase.rpc(
    "get_user_completed_books_count",
    { p_user_id: currentUser.id, p_year: currentYear }
  );
  const completedCount = completedError ? 0 : (completedData || 0);
  const progress = goal > 0 ? Math.min((completedCount / goal) * 100, 100) : 0;

  return {
    goal,
    completed: completedCount,
    progress: Math.round(progress),
    remaining: Math.max(goal - completedCount, 0),
  };
}

/**
 * 월별 기록 통계 조회
 * 게스트 사용자의 경우 샘플 데이터 통계 반환
 * 최근 6개월간의 기록 수
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
/**
 * 달력용 일별 기록 데이터 조회
 * 지정된 기간 내의 날짜별 기록 수를 반환
 * @param user 사용자 정보
 * @param startDate 시작일
 * @param endDate 종료일
 * @returns { "2025-01-20": 3, "2025-01-21": 1, ... }
 */
export async function getDailyRecordsForCalendar(
  user: User | null,
  startDate: Date,
  endDate: Date
): Promise<Record<string, number>> {
  if (!user) {
    return {};
  }

  const supabase = await createServerSupabaseClient();

  const { data: notes, error } = await supabase
    .from("notes")
    .select("created_at")
    .eq("user_id", user.id)
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  if (error || !notes) {
    console.error("일별 기록 조회 오류:", error);
    return {};
  }

  // 날짜별로 그룹화
  const dailyRecords: Record<string, number> = {};
  notes.forEach((note) => {
    const date = new Date(note.created_at);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    dailyRecords[dateKey] = (dailyRecords[dateKey] || 0) + 1;
  });

  return dailyRecords;
}

/**
 * 일별 기록 타입별 조회 (캘린더용)
 * 타입별 색상 구분: transcription(필사), photo(사진), memo/quote(기록)
 */
export interface DailyRecordByType {
  transcription: number;
  photo: number;
  memo: number;
  quote: number;
  progress: number;
  total: number;
}

export async function getDailyRecordsByType(
  user: User | null,
  startDate: Date,
  endDate: Date
): Promise<Record<string, DailyRecordByType>> {
  if (!user) {
    return {};
  }

  const supabase = await createServerSupabaseClient();

  const { data: notes, error } = await supabase
    .from("notes")
    .select("created_at, type")
    .eq("user_id", user.id)
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  if (error || !notes) {
    console.error("일별 타입별 기록 조회 오류:", error);
    return {};
  }

  // 날짜별, 타입별로 그룹화
  const dailyRecords: Record<string, DailyRecordByType> = {};

  notes.forEach((note) => {
    const date = new Date(note.created_at);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    if (!dailyRecords[dateKey]) {
      dailyRecords[dateKey] = {
        transcription: 0,
        photo: 0,
        memo: 0,
        quote: 0,
        progress: 0,
        total: 0,
      };
    }

    const type = note.type as string;
    if (type === "transcription") {
      dailyRecords[dateKey].transcription++;
    } else if (type === "photo") {
      dailyRecords[dateKey].photo++;
    } else if (type === "memo") {
      dailyRecords[dateKey].memo++;
    } else if (type === "quote") {
      dailyRecords[dateKey].quote++;
    } else if (type === "progress") {
      dailyRecords[dateKey].progress++;
    }
    dailyRecords[dateKey].total++;
  });

  return dailyRecords;
}

/**
 * 이번 주 진행 상황 조회
 * 주간 일별 기록 여부와 스트릭 정보 반환
 * @param user 사용자 정보
 * @returns { days: [{ date, hasRecord, count }], streak, streakStatus }
 */
export async function getWeeklyProgress(user: User | null): Promise<{
  days: Array<{
    date: string;
    dayOfWeek: number;
    dayLabel: string;
    hasRecord: boolean;
    count: number;
    isToday: boolean;
    isFuture: boolean;
  }>;
  recordedDays: number;
  totalDays: number;
  streak: number;
  streakStatus: "active" | "at_risk" | "none";
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 이번 주 시작일 (일요일)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  // 이번 주 종료일 (토요일)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

  // 기본 응답 (비로그인)
  if (!user) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      days.push({
        date: dateStr,
        dayOfWeek: i,
        dayLabel: dayLabels[i],
        hasRecord: false,
        count: 0,
        isToday: date.getTime() === today.getTime(),
        isFuture: date.getTime() > today.getTime(),
      });
    }
    return { days, recordedDays: 0, totalDays: 7, streak: 0, streakStatus: "none" };
  }

  const supabase = await createServerSupabaseClient();

  // 이번 주 기록 조회
  const { data: notes, error } = await supabase
    .from("notes")
    .select("created_at")
    .eq("user_id", user.id)
    .gte("created_at", startOfWeek.toISOString())
    .lte("created_at", endOfWeek.toISOString());

  // 날짜별 기록 수 계산
  const dailyCounts: Record<string, number> = {};
  if (notes && !error) {
    notes.forEach((note) => {
      const date = new Date(note.created_at);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
    });
  }

  // 주간 일별 데이터 생성
  const days = [];
  let recordedDays = 0;
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const count = dailyCounts[dateStr] || 0;
    const hasRecord = count > 0;
    if (hasRecord) recordedDays++;

    days.push({
      date: dateStr,
      dayOfWeek: i,
      dayLabel: dayLabels[i],
      hasRecord,
      count,
      isToday: date.getTime() === today.getTime(),
      isFuture: date.getTime() > today.getTime(),
    });
  }

  // 스트릭 계산 (최근 30일 기준)
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: streakNotes } = await supabase
    .from("notes")
    .select("created_at")
    .eq("user_id", user.id)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false });

  let streak = 0;
  if (streakNotes && streakNotes.length > 0) {
    const recordedDates = new Set<string>();
    streakNotes.forEach((note) => {
      const date = new Date(note.created_at);
      recordedDates.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
    });

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;

      if (recordedDates.has(dateKey)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
  }

  // 스트릭 상태 결정
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const todayRecorded = dailyCounts[days.find(d => d.isToday)?.date || ""] > 0;

  let streakStatus: "active" | "at_risk" | "none" = "none";
  if (streak >= 1) {
    streakStatus = todayRecorded ? "active" : "at_risk";
  }

  return {
    days,
    recordedDays,
    totalDays: 7,
    streak,
    streakStatus,
  };
}

export async function getMonthlyStats(user?: User | null) {
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

  const now = new Date();

  // 게스트 사용자인 경우 샘플 사용자(관리자) 데이터 사용
  let targetUserId: string | null = null;
  let useAdminClient = false;

  if (authError || !currentUser) {
    targetUserId = await getSampleUserId();
    useAdminClient = true;
  } else {
    targetUserId = currentUser.id;
  }

  if (!targetUserId) {
    return [];
  }

  const queryClient = useAdminClient ? createAdminSupabaseClient() : supabase;

  // 6개월 쿼리를 모두 준비
  const monthQueries: Array<{ month: string; query: any }> = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const query = queryClient
      .from("notes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", targetUserId)
      .gte("created_at", date.toISOString())
      .lt("created_at", nextMonth.toISOString());

    monthQueries.push({
      month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      query,
    });
  }

  // 모든 쿼리를 병렬 실행
  const results = await Promise.all(
    monthQueries.map(async ({ month, query }) => {
      try {
        const { count, error } = await query;
        if (error) {
          console.error(`월별 통계 조회 오류 (${month}):`, error);
          return { month, count: 0 };
        }
        return { month, count: count || 0 };
      } catch (error) {
        console.error(`월별 통계 조회 예외 (${month}):`, error);
        return { month, count: 0 };
      }
    })
  );

  return results;
}

/**
 * 최근 진행 체크 로그 조회
 * 진행 체크(progress) 타입의 최근 기록을 조회
 * @param user 사용자 정보
 * @param limit 조회할 개수 (기본값: 3)
 */
export interface ProgressLogItem {
  id: string;
  bookId: string;
  userBookId: string;
  bookTitle: string;
  bookAuthor: string | null;
  bookCoverUrl: string | null;
  pageNumber: string | null;
  content: string | null;
  createdAt: string;
}

export async function getRecentProgressLogs(
  user: User | null,
  limit: number = 3
): Promise<ProgressLogItem[]> {
  if (!user) {
    return [];
  }

  const supabase = await createServerSupabaseClient();

  // 진행 체크(progress) 타입의 최근 기록 조회
  const { data: notes, error } = await supabase
    .from("notes")
    .select(`
      id,
      book_id,
      page_number,
      content,
      created_at,
      books (
        id,
        title,
        author,
        cover_image_url
      )
    `)
    .eq("user_id", user.id)
    .eq("type", "progress")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !notes) {
    console.error("진행 로그 조회 오류:", error);
    return [];
  }

  // user_books ID 매핑 조회
  const bookIds = [...new Set(notes.map((n) => n.book_id))];
  const { data: userBooksData } = await supabase
    .from("user_books")
    .select("id, book_id")
    .eq("user_id", user.id)
    .in("book_id", bookIds);

  const userBookIdMap = new Map<string, string>();
  if (userBooksData) {
    userBooksData.forEach((ub) => userBookIdMap.set(ub.book_id, ub.id));
  }

  return notes.map((note: any) => {
    const book = Array.isArray(note.books) ? note.books[0] : note.books;
    return {
      id: note.id,
      bookId: note.book_id,
      userBookId: userBookIdMap.get(note.book_id) || note.book_id,
      bookTitle: book?.title || "알 수 없는 책",
      bookAuthor: book?.author || null,
      bookCoverUrl: book?.cover_image_url || null,
      pageNumber: note.page_number,
      content: note.content,
      createdAt: note.created_at,
    };
  });
}

/**
 * 현재 읽고 있는 책의 진행률 조회
 * @param user 사용자 정보
 */
export interface CurrentBookProgress {
  userBookId: string;
  bookTitle: string;
  currentPage: number;
  totalPages: number | null;
  progressPercent: number;
}

/**
 * 월별 독서 활동 조회 (책 표지 포함)
 * 날짜별로 읽은 책들의 표지 이미지를 반환
 * @param user 사용자 정보
 * @param year 연도
 * @param month 월 (1-12)
 */
export interface DailyBookActivity {
  date: string;
  books: Array<{
    bookId: string;
    userBookId: string;
    title: string;
    coverImageUrl: string | null;
  }>;
}

export async function getMonthlyBookActivities(
  user: User | null,
  year: number,
  month: number
): Promise<Record<string, DailyBookActivity>> {
  if (!user) {
    return {};
  }

  const supabase = await createServerSupabaseClient();

  // 해당 월의 시작일과 종료일 계산
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  // 해당 월의 기록 조회 (책 정보 포함)
  const { data: notes, error } = await supabase
    .from("notes")
    .select(`
      id,
      book_id,
      created_at,
      books (
        id,
        title,
        cover_image_url
      )
    `)
    .eq("user_id", user.id)
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .order("created_at", { ascending: true });

  if (error || !notes) {
    console.error("월별 독서 활동 조회 오류:", error);
    return {};
  }

  // user_books ID 매핑 조회
  const bookIds = [...new Set(notes.map((n) => n.book_id))];
  const { data: userBooksData } = await supabase
    .from("user_books")
    .select("id, book_id")
    .eq("user_id", user.id)
    .in("book_id", bookIds);

  const userBookIdMap = new Map<string, string>();
  if (userBooksData) {
    userBooksData.forEach((ub) => userBookIdMap.set(ub.book_id, ub.id));
  }

  // 날짜별로 그룹화
  const dailyActivities: Record<string, DailyBookActivity> = {};

  notes.forEach((note: any) => {
    const date = new Date(note.created_at);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const book = Array.isArray(note.books) ? note.books[0] : note.books;

    if (!dailyActivities[dateKey]) {
      dailyActivities[dateKey] = {
        date: dateKey,
        books: [],
      };
    }

    // 같은 날짜에 같은 책이 중복되지 않도록
    const existingBook = dailyActivities[dateKey].books.find(
      (b) => b.bookId === note.book_id
    );

    if (!existingBook && book) {
      dailyActivities[dateKey].books.push({
        bookId: note.book_id,
        userBookId: userBookIdMap.get(note.book_id) || note.book_id,
        title: book.title || "알 수 없는 책",
        coverImageUrl: book.cover_image_url || null,
      });
    }
  });

  return dailyActivities;
}

export async function getCurrentBookProgress(
  user: User | null
): Promise<CurrentBookProgress | null> {
  if (!user) {
    return null;
  }

  const supabase = await createServerSupabaseClient();

  // 가장 최근에 활동한 '읽는 중' 상태의 책 조회
  const { data, error } = await supabase
    .from("user_books")
    .select(`
      id,
      current_page,
      books (
        title,
        total_pages
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "reading")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  const book = Array.isArray(data.books) ? data.books[0] : data.books;
  const currentPage = data.current_page || 0;
  const totalPages = (book as any)?.total_pages || null;
  const progressPercent = totalPages ? Math.round((currentPage / totalPages) * 100) : 0;

  return {
    userBookId: data.id,
    bookTitle: (book as any)?.title || "알 수 없는 책",
    currentPage,
    totalPages,
    progressPercent,
  };
}

