"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { NoteWithBook } from "@/types/note";
import type { User } from "@supabase/supabase-js";

export type TimelineSortBy = "latest" | "oldest" | "book";

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

  // 게스트 사용자인 경우 샘플 데이터 반환
  if (authError || !currentUser) {
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
      .eq("is_sample", true);

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
      // 샘플 데이터가 없어도 빈 결과 반환
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

  // 게스트 사용자인 경우 샘플 데이터 통계 반환
  if (authError || !currentUser) {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // 샘플 데이터에서 이번 주 기록 수
    const { count: thisWeekNotes } = await supabase
      .from("notes")
      .select("*", { count: "exact", head: true })
      .eq("is_sample", true)
      .gte("created_at", new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // 샘플 데이터에서 올해 기록 수
    const { count: thisYearNotes } = await supabase
      .from("notes")
      .select("*", { count: "exact", head: true })
      .eq("is_sample", true)
      .gte("created_at", startOfYear.toISOString());

    // 샘플 데이터에서 가장 많이 기록한 책 (상위 5개)
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
      .eq("is_sample", true);

    // 책별 기록 수 집계
    const bookCounts = new Map<string, { count: number; book: any }>();
    if (topBooksData) {
      topBooksData.forEach((note) => {
        const bookId = note.book_id;
        const book = (note.books as any);
        if (book) {
          const existing = bookCounts.get(bookId);
          if (existing) {
            existing.count++;
          } else {
            bookCounts.set(bookId, { count: 1, book });
          }
        }
      });
    }

    const topBooks = Array.from(bookCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item) => ({
        book: {
          ...item.book,
          id: `sample-${item.book.id}`, // 샘플 데이터 ID 형식 통일
        },
        noteCount: item.count,
      }));

    return {
      thisWeek: {
        notes: thisWeekNotes || 0,
      },
      thisYear: {
        completedBooks: 0, // 샘플 데이터에는 완독 책 개념이 없음
        notes: thisYearNotes || 0,
      },
      topBooks,
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

  // 가장 많이 기록한 책 (상위 5개)
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
    .eq("user_id", currentUser.id);

  // 사용자의 user_books ID 가져오기 (매핑용)
  const { data: userBooksData } = await supabase
    .from("user_books")
    .select("id, book_id")
    .eq("user_id", currentUser.id);

  const userBookIdMap = new Map<string, string>();
  if (userBooksData) {
    userBooksData.forEach((ub) => userBookIdMap.set(ub.book_id, ub.id));
  }

  // 책별 기록 수 집계
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

  return {
    thisWeek: {
      notes: thisWeekNotes || 0,
    },
    thisYear: {
      completedBooks: thisYearCompleted || 0,
      notes: thisYearNotes || 0,
    },
    topBooks,
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

  // 게스트 사용자인 경우 샘플 목표 데이터 반환
  if (authError || !currentUser) {
    // 샘플 목표: 12권, 완독: 8권 (예시)
    const sampleGoal = 12;
    const sampleCompleted = 8;
    const sampleProgress = Math.min((sampleCompleted / sampleGoal) * 100, 100);

    return {
      goal: sampleGoal,
      completed: sampleCompleted,
      progress: Math.round(sampleProgress),
      remaining: Math.max(sampleGoal - sampleCompleted, 0),
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

  // 6개월 쿼리를 모두 준비
  const monthQueries: Array<{ month: string; query: any }> = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    let query = supabase
      .from("notes")
      .select("*", { count: "exact", head: true })
      .gte("created_at", date.toISOString())
      .lt("created_at", nextMonth.toISOString());

    if (authError || !currentUser) {
      // 게스트: 샘플 데이터
      query = query.eq("is_sample", true);
    } else {
      // 인증된 사용자: 자신의 데이터
      query = query.eq("user_id", currentUser.id);
    }

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

