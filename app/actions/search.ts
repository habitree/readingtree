"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth";
import { sanitizeSearchQuery, sanitizeErrorMessage, sanitizeErrorForLogging } from "@/lib/utils/validation";
import type { Database } from "@/types/database";
import type { User } from "@supabase/supabase-js";

const ITEMS_PER_PAGE = 20;

export type SearchSortBy = "latest" | "oldest" | "book";

export interface SearchParams {
  query?: string;
  bookId?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  types?: string[];
  page?: number;
  sort?: SearchSortBy;
  status?: "draft" | "published";
}

export interface SearchResults {
  results: Database["public"]["Tables"]["notes"]["Row"][];
  total: number;
  page: number;
  totalPages: number;
  itemsPerPage: number;
}

/**
 * 기록 검색
 * Full-text Search 및 필터 기능 제공
 * 한글 검색 지원을 위해 ILIKE 패턴 매칭 사용
 * @param params 검색 파라미터
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function searchNotes(params: SearchParams, user?: User | null): Promise<SearchResults> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  let currentUser = user;
  if (!currentUser) {
    currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("로그인이 필요합니다.");
    }
  }

  // 검색어 필터 (한글 지원을 위해 ILIKE 사용)
  // review_issues.md Issue 6 참고: 한글 검색 지원을 위해 ILIKE 패턴 매칭 사용
  const sanitizedQuery = sanitizeSearchQuery(params.query || "");
  
  // bookId 변환과 books/user_books 검색을 병렬로 시작
  const [userBookResult, matchingBooksFromTitle, matchingBooksFromReason] = await Promise.all([
    // bookId가 user_books.id인 경우, books.id를 조회
    params.bookId
      ? supabase
          .from("user_books")
          .select("book_id")
          .eq("id", params.bookId)
          .eq("user_id", currentUser.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    // 검색어가 있으면 books 테이블에서 title, author로 직접 검색
    sanitizedQuery
      ? supabase
          .from("books")
          .select("id")
          .or(`title.ilike.%${sanitizedQuery}%,author.ilike.%${sanitizedQuery}%`)
          .limit(500)
      : Promise.resolve({ data: [], error: null }),
    // 검색어가 있으면 user_books에서 reading_reason으로 검색
    sanitizedQuery
      ? supabase
          .from("user_books")
          .select("book_id")
          .eq("user_id", currentUser.id)
          .ilike("reading_reason", `%${sanitizedQuery}%`)
          .limit(500)
      : Promise.resolve({ data: [], error: null }),
  ]);

  // userBook 결과에 따라 bookId 설정
  let actualBookId = params.bookId;
  if (userBookResult.data) {
    actualBookId = userBookResult.data.book_id;
  }

  // matchingBookIds 추출 (books 검색 + reading_reason 검색 결과 합산)
  const bookIdSet = new Set<string>();
  if (matchingBooksFromTitle.data) {
    for (const item of matchingBooksFromTitle.data) {
      if (item.id) bookIdSet.add(item.id);
    }
  }
  if (matchingBooksFromReason.data) {
    for (const item of matchingBooksFromReason.data) {
      if (item.book_id) bookIdSet.add(item.book_id);
    }
  }
  const matchingBookIds = [...bookIdSet];

  // notes 쿼리 구성
  let supabaseQuery = supabase
    .from("notes")
    .select(
      `
      *,
      books (
        id,
        title,
        author,
        cover_image_url
      ),
      transcriptions (
        status
      ),
      reading_logs (
        reading_duration_seconds
      )
    `,
      { count: "exact" }
    )
    .eq("user_id", currentUser.id);

  // 검색어 필터 적용
  if (sanitizedQuery) {
    // notes.content에서 검색하거나, books.title/author로 검색된 book_id를 가진 notes 검색
    if (matchingBookIds.length > 0) {
      // content에서 검색하거나 matchingBookIds에 포함된 book_id를 가진 notes
      supabaseQuery = supabaseQuery.or(
        `content.ilike.%${sanitizedQuery}%,book_id.in.(${matchingBookIds.join(",")})`
      );
    } else {
      // content에서만 검색 (books에서 매칭된 것이 없을 때)
      supabaseQuery = supabaseQuery.ilike("content", `%${sanitizedQuery}%`);
    }
  }

  // 책 필터
  if (actualBookId) {
    supabaseQuery = supabaseQuery.eq("book_id", actualBookId);
  }

  // 날짜 필터
  if (params.startDate) {
    supabaseQuery = supabaseQuery.gte("created_at", params.startDate);
  }
  if (params.endDate) {
    // 종료일은 KST 기준 하루 끝까지 포함
    const endDateTime = new Date(params.endDate + "T23:59:59+09:00");
    supabaseQuery = supabaseQuery.lte("created_at", endDateTime.toISOString());
  }

  // 태그 필터
  if (params.tags && params.tags.length > 0) {
    supabaseQuery = supabaseQuery.contains("tags", params.tags);
  }

  // 유형 필터
  if (params.types && params.types.length > 0) {
    supabaseQuery = supabaseQuery.in("type", params.types);
  }

  // 상태 필터 (draft/published)
  if (params.status) {
    supabaseQuery = supabaseQuery.eq("status", params.status);
  }

  // 페이지네이션
  const page = params.page || 1;
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;
  supabaseQuery = supabaseQuery.range(from, to);

  // 정렬
  const sort = params.sort || "latest";
  if (sort === "book") {
    supabaseQuery = supabaseQuery
      .order("book_id", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
  } else {
    supabaseQuery = supabaseQuery
      .order("created_at", { ascending: sort === "oldest" })
      .order("page_number", { ascending: true, nullsFirst: false });
  }

  const { data, error, count } = await supabaseQuery;

  if (error) {
    const safeError = sanitizeErrorForLogging(error);
    console.error("Search error:", safeError);
    throw new Error(sanitizeErrorMessage(error));
  }

  // notes 결과에 user_books 정보 추가 (reading_reason 표시용 — 검색어 있을 때만)
  const notes = data || [];
  const bookIds = [...new Set(notes.map((note: any) => note.book_id).filter(Boolean))];

  let userBooksMap = new Map<string, any>();
  if (sanitizedQuery && bookIds.length > 0) {
    const { data: userBooksData } = await supabase
      .from("user_books")
      .select("id, book_id, reading_reason, status")
      .eq("user_id", currentUser.id)
      .in("book_id", bookIds);
    
    if (userBooksData) {
      userBooksData.forEach((ub: any) => {
        userBooksMap.set(ub.book_id, ub);
      });
    }
  }

  // notes 결과에 user_books 정보 병합
  const resultsWithUserBooks = notes.map((note: any) => {
    const userBook = userBooksMap.get(note.book_id);
    // 세션 연결(reading_log_id) 시 독서시간 노출 (C6)
    const session = Array.isArray(note.reading_logs) ? note.reading_logs[0] : note.reading_logs;
    return {
      ...note,
      user_books: userBook ? [userBook] : undefined,
      reading_duration_seconds: session?.reading_duration_seconds ?? null,
    };
  });

  const totalPages = count ? Math.ceil(count / ITEMS_PER_PAGE) : 0;

  return {
    results: resultsWithUserBooks as Database["public"]["Tables"]["notes"]["Row"][],
    total: count || 0,
    page,
    totalPages,
    itemsPerPage: ITEMS_PER_PAGE,
  };
}

/**
 * 통합 검색 — 책, 기록, 모임을 병렬로 검색
 * Command Palette에서 사용
 */
export async function searchAll(rawQuery: string) {
  const user = await getCurrentUser();
  if (!user) return { books: [], notes: [], groups: [] };

  const query = sanitizeSearchQuery(rawQuery);
  if (!query || query.length < 1) return { books: [], notes: [], groups: [] };

  const supabase = await createServerSupabaseClient();
  const pattern = `%${query}%`;

  const [booksResult, notesResult, groupsResult] = await Promise.all([
    // 내 서재의 책 검색 (제목/저자)
    supabase
      .from("user_books")
      .select("id, book_id, status, books!inner(id, title, author, cover_image_url)")
      .eq("user_id", user.id)
      .or(`title.ilike.${pattern},author.ilike.${pattern}`, { referencedTable: "books" })
      .limit(5),
    // 내 기록 검색 (내용/제목)
    supabase
      .from("notes")
      .select("id, type, title, quote_content, memo_content, created_at")
      .eq("user_id", user.id)
      .or(`title.ilike.${pattern},quote_content.ilike.${pattern},memo_content.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(5),
    // 내가 속한 모임 검색 (모임명)
    supabase
      .from("groups")
      .select("id, name, description, cover_image_url")
      .ilike("name", pattern)
      .limit(5),
  ]);

  return {
    books: (booksResult.data ?? []).map((ub) => {
      const book = ub.books as unknown as { id: string; title: string; author: string | null; cover_image_url: string | null };
      return {
        userBookId: ub.id,
        bookId: ub.book_id,
        status: ub.status,
        title: book.title,
        author: book.author,
        cover_image_url: book.cover_image_url,
      };
    }),
    notes: (notesResult.data ?? []).map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      preview: n.quote_content?.slice(0, 60) || n.memo_content?.slice(0, 60) || "",
      createdAt: n.created_at,
    })),
    groups: (groupsResult.data ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      coverImageUrl: g.cover_image_url,
    })),
  };
}

