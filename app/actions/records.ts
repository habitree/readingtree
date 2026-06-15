"use server";

/**
 * 통합 기록 피드 액션 — 기록 기획 13 Phase 1
 *
 * 두 평행 세계(reading_logs / notes)를 읽기 레이어에서 머지해 하나의 시간순 피드로 반환.
 * - 저장 구조 변경 없음(마이그레이션 0).
 * - searchNotes는 확장하지 않음(notes-only 계약 오염 회피) → 본 액션으로 분리.
 * - created_at keyset(cursor) 페이지네이션 (offset 금지 — 머지에서 부정확).
 *
 * 중복 제거(3.3): notes 측은 `reading_log_id IS NULL`만 1차 카드로 조회.
 *   세션 연결 상세(reading_log_id != null)는 reading_log 카드 하위로 접힘 → 한 세션 = 카드 1개.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth";
import { sanitizeErrorMessage } from "@/lib/utils/validation";
import { isValidUUID } from "@/lib/utils/validation";
import {
  readingLogToUnified,
  noteToUnified,
  mergeAndSort,
  type UnifiedReadingLogRow,
  type UnifiedNoteRow,
} from "@/lib/reading/unified";
import type {
  GetUnifiedRecordsParams,
  UnifiedRecord,
  UnifiedRecordBook,
  UnifiedRecordsResult,
} from "@/types/unified-record";
import type { DetailKind, NoteType } from "@/types/note";
import type { User } from "@supabase/supabase-js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

interface BookJoin {
  id?: string;
  title?: string | null;
  author?: string | null;
  cover_image_url?: string | null;
  total_pages?: number | null;
}

function pickBook<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/**
 * 통합 기록 피드 조회.
 * @param params bookId = user_books.id (책 상세 스코프), 미지정 = 전체
 */
export async function getUnifiedRecords(
  params: GetUnifiedRecordsParams = {},
  user?: User | null,
): Promise<UnifiedRecordsResult> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("로그인이 필요합니다.");
  }

  const limit = Math.min(Math.max(params.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const sort = params.sort === "oldest" ? "oldest" : "latest";
  const ascending = sort === "oldest";

  // bookId(=user_books.id) → books.id 변환 (notes 필터용). reading_logs는 user_book_id 직접 사용.
  let resolvedBookId: string | null = null;
  const userBookFilter =
    params.bookId && isValidUUID(params.bookId) ? params.bookId : null;
  if (userBookFilter) {
    const { data: ub } = await supabase
      .from("user_books")
      .select("book_id")
      .eq("id", userBookFilter)
      .eq("user_id", currentUser.id)
      .maybeSingle();
    resolvedBookId = ub?.book_id ?? null;
  }

  // 날짜 필터 (KST 하루 끝까지 포함 — searchNotes와 동일)
  const endDateIso = params.endDate
    ? new Date(params.endDate + "T23:59:59+09:00").toISOString()
    : null;

  // ── reading_logs 쿼리 ──
  let logQuery = supabase
    .from("reading_logs")
    .select(
      `
      id, user_book_id, created_at, start_page, end_page, page_number,
      reading_duration_seconds, memo, image_url, image_urls, promoted_at,
      bookmark_text, bookmark_page,
      user_books!inner ( id, books ( id, title, author, cover_image_url, total_pages ) )
    `,
    )
    .eq("user_id", currentUser.id)
    // 정상 세션만 (진행 중·취소 제외, 레거시 null 포함)
    .or("status.is.null,status.eq.completed")
    .order("created_at", { ascending })
    .limit(limit + 1);

  if (userBookFilter) logQuery = logQuery.eq("user_book_id", userBookFilter);
  if (params.startDate) logQuery = logQuery.gte("created_at", params.startDate);
  if (endDateIso) logQuery = logQuery.lte("created_at", endDateIso);
  if (params.cursor) {
    logQuery = ascending
      ? logQuery.gt("created_at", params.cursor)
      : logQuery.lt("created_at", params.cursor);
  }

  // ── notes 쿼리 (reading_log_id IS NULL = 1차 카드만) ──
  let noteQuery = supabase
    .from("notes")
    .select(
      `
      id, created_at, type, detail_kind, title, content, page_number, image_url,
      books ( id, title, author, cover_image_url, total_pages ),
      transcriptions ( extracted_text, status )
    `,
    )
    .eq("user_id", currentUser.id)
    .is("reading_log_id", null)
    .order("created_at", { ascending })
    .limit(limit + 1);

  if (userBookFilter) {
    // 변환 실패(소유 아님/없음) 시 매칭 0건이 되도록 불가능한 값으로 필터
    noteQuery = noteQuery.eq("book_id", resolvedBookId ?? "00000000-0000-0000-0000-000000000000");
  }
  if (params.startDate) noteQuery = noteQuery.gte("created_at", params.startDate);
  if (endDateIso) noteQuery = noteQuery.lte("created_at", endDateIso);
  if (params.cursor) {
    noteQuery = ascending
      ? noteQuery.gt("created_at", params.cursor)
      : noteQuery.lt("created_at", params.cursor);
  }

  const [{ data: logData, error: logError }, { data: noteData, error: noteError }] =
    await Promise.all([logQuery, noteQuery]);

  if (logError) throw new Error(sanitizeErrorMessage(logError));
  if (noteError) throw new Error(sanitizeErrorMessage(noteError));

  // ── reading_logs 평탄화 ──
  const logRows = (logData ?? []) as unknown as Array<Record<string, unknown>>;
  const logUnified: UnifiedRecord[] = logRows.map((row) => {
    const ub = pickBook(row.user_books as { books?: BookJoin | BookJoin[] } | { books?: BookJoin | BookJoin[] }[]);
    const book = pickBook((ub as { books?: BookJoin | BookJoin[] } | null)?.books);
    const normalizedBook: UnifiedRecordBook = {
      userBookId: (row.user_book_id as string | null) ?? null,
      bookId: book?.id ?? null,
      title: book?.title ?? null,
      author: book?.author ?? null,
      coverImageUrl: book?.cover_image_url ?? null,
      totalPages: book?.total_pages ?? null,
    };
    const logRow: UnifiedReadingLogRow = {
      id: row.id as string,
      user_book_id: (row.user_book_id as string | null) ?? null,
      created_at: row.created_at as string,
      start_page: (row.start_page as number | null) ?? null,
      end_page: (row.end_page as number | null) ?? null,
      page_number: (row.page_number as number | null) ?? null,
      reading_duration_seconds: (row.reading_duration_seconds as number | null) ?? null,
      memo: (row.memo as string | null) ?? null,
      image_url: (row.image_url as string | null) ?? null,
      image_urls: (row.image_urls as string[] | null) ?? null,
      promoted_at: (row.promoted_at as string | null) ?? null,
      bookmark_text: (row.bookmark_text as string | null) ?? null,
      bookmark_page: (row.bookmark_page as number | null) ?? null,
      book: normalizedBook,
    };
    return readingLogToUnified(logRow);
  });

  // ── notes 평탄화 (books.id → user_books.id 역매핑으로 reading_logs와 그룹 정합) ──
  const noteRows = (noteData ?? []) as unknown as Array<Record<string, unknown>>;
  const noteBookIds = [
    ...new Set(
      noteRows
        .map((r) => {
          const b = pickBook(r.books as BookJoin | BookJoin[] | null);
          return b?.id ?? null;
        })
        .filter((id): id is string => !!id),
    ),
  ];

  const bookToUserBook = new Map<string, string>();
  if (noteBookIds.length > 0) {
    const { data: ubRows } = await supabase
      .from("user_books")
      .select("id, book_id")
      .eq("user_id", currentUser.id)
      .in("book_id", noteBookIds);
    for (const ub of ubRows ?? []) {
      if (ub.book_id) bookToUserBook.set(ub.book_id, ub.id);
    }
  }

  const noteUnified: UnifiedRecord[] = noteRows.map((row) => {
    const book = pickBook(row.books as BookJoin | BookJoin[] | null);
    const transcription = pickBook(
      row.transcriptions as { extracted_text?: string | null } | { extracted_text?: string | null }[] | null,
    );
    const bookId = book?.id ?? null;
    const normalizedBook: UnifiedRecordBook = {
      userBookId: bookId ? bookToUserBook.get(bookId) ?? null : null,
      bookId,
      title: book?.title ?? null,
      author: book?.author ?? null,
      coverImageUrl: book?.cover_image_url ?? null,
      totalPages: book?.total_pages ?? null,
    };
    const noteRow: UnifiedNoteRow = {
      id: row.id as string,
      created_at: row.created_at as string,
      type: row.type as NoteType,
      detail_kind: (row.detail_kind as DetailKind | null) ?? null,
      title: (row.title as string | null) ?? null,
      content: (row.content as string | null) ?? null,
      page_number: (row.page_number as string | null) ?? null,
      image_url: (row.image_url as string | null) ?? null,
      reading_duration_seconds: null,
      transcription_text: transcription?.extracted_text ?? null,
      book: normalizedBook,
    };
    return noteToUnified(noteRow);
  });

  // ── 머지 + keyset 절단 ──
  // 페이지네이션(cursor)은 머지 원본 기준으로 산정해 안정성 보장.
  // kinds 필터는 현재 페이지에만 적용(페이지 크기는 가변, cursor는 불변).
  const merged = mergeAndSort([logUnified, noteUnified], sort);
  const hasMore = merged.length > limit;
  const sliced = hasMore ? merged.slice(0, limit) : merged;
  const nextCursor = hasMore ? sliced[sliced.length - 1].createdAt : null;

  let records = sliced;
  if (params.kinds && params.kinds.length > 0) {
    const allow = new Set(params.kinds);
    records = sliced.filter((r) => allow.has(r.kind));
  }

  return { records, nextCursor };
}
