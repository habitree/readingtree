"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/app/actions/auth";
import { searchBooks, transformNaverBookItem } from "@/lib/api/naver";
import { resolveOpenLibraryCoverUrl } from "@/lib/api/open-library-covers";
import type { ReadingStatus } from "@/types/book";
import type { User } from "@supabase/supabase-js";
import { OPEN_LIBRARY_COVER_BATCH_LIMIT, OPEN_LIBRARY_COVER_TIMEOUT_MS } from "./_shared";
import { READTREE_BOOK_ID } from "@/lib/constants/readtree";
import { sanitizeSearchQuery } from "@/lib/utils/validation";

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

export interface PopularBook {
  bookId: string;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  isbn: string | null;
  readerCount: number;
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
  if (!currentUser) {
    currentUser = await getCurrentUser();
  }

  // 게스트 사용자인 경우 샘플 데이터 반환
  if (!currentUser) {
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

    // 표지 없는 책 조회를 백그라운드로 분리 (fire-and-forget)
    // 리스트 로딩을 블로킹하지 않고, 다음 접근 시 DB에서 업데이트된 표지 URL을 가져옴
    const booksWithoutImages = (sampleBooks || []).filter(
      (book) => !book.cover_image_url && book.isbn
    );

    if (booksWithoutImages.length > 0) {
      // fire-and-forget: 응답을 기다리지 않음
      Promise.all(
        booksWithoutImages.slice(0, OPEN_LIBRARY_COVER_BATCH_LIMIT).map(async (book) => {
          try {
            // 네이버 API 시도
            const searchQuery = `${book.title} ${book.author || ""}`.trim();
            const naverResponse = await searchBooks({ query: searchQuery, display: 1 });
            if (naverResponse.items && naverResponse.items.length > 0) {
              const naverBook = transformNaverBookItem(naverResponse.items[0]);
              if (naverBook.cover_image_url) {
                await supabase
                  .from("books")
                  .update({ cover_image_url: naverBook.cover_image_url })
                  .eq("id", book.id);
                return;
              }
            }
            // 네이버 실패 시 Open Library 폴백
            const coverUrl = await resolveOpenLibraryCoverUrl(book.isbn!, {
              timeoutMs: OPEN_LIBRARY_COVER_TIMEOUT_MS,
            });
            if (coverUrl) {
              await supabase
                .from("books")
                .update({ cover_image_url: coverUrl })
                .eq("id", book.id);
            }
          } catch {
            // 무시 - 백그라운드 처리
          }
        })
      ).catch(() => {});
    }

    // 즉시 반환 (표지 없는 책은 플레이스홀더로 표시)
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

  // 표지 없는 책의 Open Library Covers 보강을 백그라운드로 분리 (fire-and-forget)
  // 리스트 로딩을 블로킹하지 않고, 다음 접근 시 DB에서 업데이트된 표지 URL을 가져옴
  const withoutCover = list.filter(
    (ub) => ub.books && !(ub.books as { cover_image_url?: string | null }).cover_image_url && (ub.books as { isbn?: string | null }).isbn
  );
  const toBackfill = withoutCover.slice(0, OPEN_LIBRARY_COVER_BATCH_LIMIT);

  if (toBackfill.length > 0) {
    // fire-and-forget: 응답을 기다리지 않음
    Promise.all(
      toBackfill.map(async (ub) => {
        const b = ub.books as { id: string; isbn: string | null; cover_image_url: string | null };
        try {
          const coverUrl = await resolveOpenLibraryCoverUrl(b.isbn!, {
            timeoutMs: OPEN_LIBRARY_COVER_TIMEOUT_MS,
          });
          if (coverUrl) {
            await supabase.from("books").update({ cover_image_url: coverUrl }).eq("id", b.id);
          }
        } catch {
          // 무시 - 백그라운드 처리
        }
      })
    ).catch(() => {});
  }

  return list;
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
  if (!currentUser) {
    currentUser = await getCurrentUser();
  }

  // 게스트 사용자인 경우 빈 결과 반환 (통계는 0)
  if (!currentUser) {
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

  // 검색어가 있으면 먼저 매칭 책 ID 조회 (성능 최적화: 상위 500개 제한)
  let matchingBookIds: string[] | null = null;
  if (query && query.trim()) {
    const sanitizedQuery = sanitizeSearchQuery(query);
    if (!sanitizedQuery) {
      return {
        books: [],
        stats: {
          total: 0, reading: 0, completed: 0, paused: 0, not_started: 0, rereading: 0,
        },
      };
    }
    const { data: matchingBooks } = await supabase
      .from("books")
      .select("id")
      .or(
        `title.ilike.%${sanitizedQuery}%,author.ilike.%${sanitizedQuery}%,isbn.ilike.%${sanitizedQuery}%`
      )
      .limit(500); // 검색 결과 제한으로 쿼리 성능 향상

    matchingBookIds = matchingBooks?.map((b) => b.id) || [];

    // 매칭되는 책이 없으면 빈 결과 반환 (early return)
    if (matchingBookIds.length === 0) {
      // 통계만 조회해서 반환
      let statsQuery = supabase
        .from("user_books")
        .select("status")
        .eq("user_id", currentUser.id);

      if (bookshelfId && cachedBookshelf && !cachedBookshelf.is_main) {
        statsQuery = statsQuery.eq("bookshelf_id", bookshelfId);
      }

      const { data: allUserBooks } = await statsQuery;

      return {
        books: [],
        stats: {
          total: allUserBooks?.length || 0,
          reading: allUserBooks?.filter((ub) => ub.status === "reading").length || 0,
          completed: allUserBooks?.filter((ub) => ub.status === "completed").length || 0,
          paused: allUserBooks?.filter((ub) => ub.status === "paused").length || 0,
          not_started: allUserBooks?.filter((ub) => ub.status === "not_started").length || 0,
          rereading: allUserBooks?.filter((ub) => ub.status === "rereading").length || 0,
        },
      };
    }
  }

  // === 병렬 쿼리 실행 시작 ===
  // 상태별 통계 조회 쿼리 준비
  let statsQueryBuilder = supabase
    .from("user_books")
    .select("status")
    .eq("user_id", currentUser.id);

  if (bookshelfId && cachedBookshelf && !cachedBookshelf.is_main) {
    statsQueryBuilder = statsQueryBuilder.eq("bookshelf_id", bookshelfId);
  }

  // 책 목록 조회 쿼리 준비
  let booksQueryBuilder = supabase
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

  // bookshelfId 필터링
  if (bookshelfId && cachedBookshelf && !cachedBookshelf.is_main) {
    booksQueryBuilder = booksQueryBuilder.eq("bookshelf_id", bookshelfId);
  }

  // 상태 필터 적용
  if (status) {
    booksQueryBuilder = booksQueryBuilder.eq("status", status);
  }

  // 검색어 필터 적용
  if (matchingBookIds && matchingBookIds.length > 0) {
    booksQueryBuilder = booksQueryBuilder.in("book_id", matchingBookIds);
  }

  // 사용자 멤버십 조회 쿼리 준비
  const membershipQueryBuilder = supabase
    .from("group_members")
    .select("group_id, groups!inner(id, name, leader_id)")
    .eq("user_id", currentUser.id)
    .eq("status", "approved");

  // 3개 쿼리 병렬 실행
  const [statsResult, booksResult, membershipResult] = await Promise.all([
    statsQueryBuilder,
    booksQueryBuilder,
    membershipQueryBuilder,
  ]);

  const allUserBooks = statsResult.data;
  const stats: BookStats = {
    total: allUserBooks?.length || 0,
    reading: allUserBooks?.filter((ub) => ub.status === "reading").length || 0,
    completed: allUserBooks?.filter((ub) => ub.status === "completed").length || 0,
    paused: allUserBooks?.filter((ub) => ub.status === "paused").length || 0,
    not_started: allUserBooks?.filter((ub) => ub.status === "not_started").length || 0,
    rereading: allUserBooks?.filter((ub) => ub.status === "rereading").length || 0,
  };

  const { data: userBooks, error } = booksResult;

  if (error) {
    throw new Error(`책 목록 조회 실패: ${error.message}`);
  }

  if (!userBooks || userBooks.length === 0) {
    return {
      books: [],
      stats,
    };
  }

  const { data: userMemberships } = membershipResult;

  // === 두 번째 병렬 쿼리 세트 준비 ===
  const bookIds = userBooks
    .map((ub: any) => ub.books?.id)
    .filter((id: string | undefined): id is string => !!id);
  const userBookIds = userBooks.map((ub: any) => ub.id);
  const userGroupIds = (userMemberships || []).map((m: any) => m.group_id);

  // === 병렬 쿼리 실행 (그룹도서, 노트, 연결책) ===
  const hasGroupsAndBooks = userGroupIds.length > 0 && bookIds.length > 0;

  // 쿼리 준비 (조건부로 실행)
  const groupBooksPromise = hasGroupsAndBooks
    ? supabase
        .from("group_books")
        .select(`
          book_id,
          group_id,
          groups (
            id,
            name,
            leader_id
          )
        `)
        .in("group_id", userGroupIds)
        .in("book_id", bookIds)
    : Promise.resolve({ data: [] as any[] });

  // 노트 조회 최적화: content 제외 (내서재에서 미사용), 최근 노트 우선
  const notesPromise = bookIds.length > 0
    ? supabase
        .from("notes")
        .select("id, type, created_at, book_id")
        .eq("user_id", currentUser.id)
        .in("book_id", bookIds)
        .order("created_at", { ascending: false })
    : Promise.resolve({ data: [] as any[] });

  const relationsPromise = userBookIds.length > 0
    ? supabase
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
        .order("created_at", { ascending: false })
    : Promise.resolve({ data: [] as any[] });

  // 병렬 쿼리 실행
  const [groupBooksResult, notesResult, relationsResult] = await Promise.all([
    groupBooksPromise,
    notesPromise,
    relationsPromise,
  ]);

  // 결과 처리: 그룹 도서
  let groupBooksMap: Record<string, any[]> = {};
  const groupBooks = groupBooksResult?.data || [];
  groupBooksMap = groupBooks.reduce((acc: any, gb: any) => {
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

  // 결과 처리: 노트
  const notesData = notesResult?.data || [];
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

  // 결과 처리: 연결된 책
  let relatedBooksMap: Record<string, RelatedBookPreview[]> = {};
  const relations = relationsResult?.data || [];
  for (const relation of relations) {
    const sourceId = relation.source_user_book_id;
    const targetBook = relation.target_book as any;

    if (!relatedBooksMap[sourceId]) {
      relatedBooksMap[sourceId] = [];
    }

    if (relatedBooksMap[sourceId].length < 3 && targetBook?.books) {
      relatedBooksMap[sourceId].push({
        userBookId: relation.target_user_book_id,
        coverImageUrl: targetBook.books.cover_image_url || null,
        title: targetBook.books.title || "알 수 없는 책",
      });
    }
  }

  // 결과 매핑 (추가 쿼리 없이 메모리에서 처리)
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
    currentUser = await getCurrentUser();
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

  if (error || !data) {
    // user_books.id로 찾지 못한 경우, books.id(book_id)로 fallback 조회
    const { data: fallbackData, error: fallbackError } = await supabase
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
      .eq("book_id", userBookId)
      .eq("user_id", currentUser.id)
      .single();

    if (fallbackError || !fallbackData) {
      console.error("getBookDetail: 조회 실패 (id/book_id 모두)", {
        userBookId,
        userId: currentUser.id,
        primaryError: error?.message,
        fallbackError: fallbackError?.message,
      });
      throw new Error("책을 찾을 수 없습니다.");
    }

    // fallback 성공 시 올바른 URL로 리다이렉트하기 위해 데이터에 힌트 추가
    (fallbackData as any)._resolvedFromBookId = true;
    return fallbackData;
  }

  // 표지가 없고 ISBN이 있으면 Open Library Covers 폴백을 비동기(논블로킹)로 실행
  // 페이지 렌더링을 블로킹하지 않고, 다음 접근 시 DB에서 커버 URL을 가져옴
  const bookRow = data.books as { id: string; isbn: string | null; cover_image_url: string | null } | null;
  if (bookRow && !bookRow.cover_image_url && bookRow.isbn) {
    const isbnForCover = bookRow.isbn;
    const bookIdForCover = bookRow.id;
    resolveOpenLibraryCoverUrl(isbnForCover, {
      timeoutMs: OPEN_LIBRARY_COVER_TIMEOUT_MS,
    })
      .then(async (openLibUrl) => {
        if (openLibUrl) {
          const bgSupabase = await createServerSupabaseClient();
          await bgSupabase
            .from("books")
            .update({ cover_image_url: openLibUrl })
            .eq("id", bookIdForCover);
        }
      })
      .catch(() => {
        // 무시 - 백그라운드 처리이므로 실패해도 영향 없음
      });
  }

  return data;
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
    currentUser = await getCurrentUser();
    if (!currentUser) {
      return null;
    }
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
    currentUser = await getCurrentUser();
    if (!currentUser) {
      return [];
    }
  }

  // 읽는 중인 책 목록 조회 (최근 업데이트순, 자유 기록 제외)
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
    .neq("book_id", READTREE_BOOK_ID)
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
 * 인기 도서 조회 (user_books 기준 가장 많이 등록된 책)
 * Cold Start 사용자에게 책 발견 경험을 제공
 * @param limit 조회할 최대 개수 (기본값: 10)
 */
export async function getPopularBooks(limit: number = 10): Promise<PopularBook[]> {
  const supabase = await createServerSupabaseClient();

  // user_books에서 book_id별 사용자 수 집계 (RPC 없이 단순 쿼리)
  const { data: userBooks, error } = await supabase
    .from("user_books")
    .select("book_id")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error || !userBooks) {
    return [];
  }

  // book_id별 카운트 집계
  const bookCountMap = new Map<string, number>();
  for (const ub of userBooks) {
    bookCountMap.set(ub.book_id, (bookCountMap.get(ub.book_id) || 0) + 1);
  }

  // 상위 N개 book_id 추출 (2명 이상 읽는 책만)
  const topBookIds = [...bookCountMap.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([bookId]) => bookId);

  if (topBookIds.length === 0) {
    return [];
  }

  // 책 정보 조회
  const { data: books, error: booksError } = await supabase
    .from("books")
    .select("id, title, author, cover_image_url, isbn")
    .in("id", topBookIds);

  if (booksError || !books) {
    return [];
  }

  // 결과 매핑 및 정렬
  const bookMap = new Map(books.map((b) => [b.id, b]));
  return topBookIds
    .map((bookId) => {
      const book = bookMap.get(bookId);
      if (!book) return null;
      return {
        bookId: book.id,
        title: book.title,
        author: book.author,
        coverImageUrl: book.cover_image_url,
        isbn: book.isbn,
        readerCount: bookCountMap.get(bookId) || 0,
      };
    })
    .filter((item): item is PopularBook => item !== null);
}
