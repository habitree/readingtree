"use server";

/**
 * 연간 독서결산 집계용 조회 (DB 쓰기 없음).
 *
 * computeYearlyRecapForUser(supabase, userId, year):
 *   - 호출자가 클라이언트와 userId를 명시 → 인앱(본인 RLS), 게스트 데모(admin+샘플) 공용.
 *   - 계산은 순수 함수 buildYearlyRecap(lib/recap/yearly.ts)에 맡긴다.
 *
 * 월간(compute.ts)과 다른 점:
 *   - 1년치는 PostgREST 기본 행 제한(1000)을 넘을 수 있어 PAGE_SIZE 단위로 끝까지 읽는다.
 *   - 세션은 status='completed' 만 집계한다.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { kstMonthStart, kstMonthEnd } from "@/lib/utils/timezone";
import { isProgressInLogsEnabled } from "@/lib/feature-flags";
import {
  buildYearlyRecap,
  type YearlyRecapComputed,
  type YearlyNoteInput,
  type YearlyLogInput,
  type YearlyCompletedInput,
} from "@/lib/recap/yearly";

const PAGE_SIZE = 1000;

interface BookMini {
  id: string;
  title: string | null;
  author: string | null;
  cover_image_url: string | null;
}
interface NoteRow {
  type: string;
  content: string | null;
  created_at: string;
  books: BookMini | BookMini[] | null;
}
interface LogRow {
  reading_duration_seconds: number | null;
  start_page: number | null;
  end_page: number | null;
  started_at: string | null;
  user_books: { books: { title: string | null } | { title: string | null }[] | null } | null;
}
interface CompletedRow {
  completed_at: string | null;
  books: { title: string | null; cover_image_url: string | null } | { title: string | null; cover_image_url: string | null }[] | null;
}

function firstRelation<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

/** range(from, to) 를 받아 한 페이지를 돌려주는 쿼리를 끝까지 반복한다. */
async function fetchAllPages<T>(
  page: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw new Error("연간 결산 조회에 실패했어요.");
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) return rows;
  }
}

export async function computeYearlyRecapForUser(
  supabase: SupabaseClient,
  userId: string,
  year: number,
): Promise<YearlyRecapComputed> {
  const start = kstMonthStart(year, 1).toISOString();
  const end = kstMonthEnd(year, 12).toISOString();
  const prevStart = kstMonthStart(year - 1, 1).toISOString();
  const prevEnd = kstMonthEnd(year - 1, 12).toISOString();

  const [noteRows, logRows, completedRows, logActivityRows, prevLogRows, prevNotesRes, prevCompletedRes] =
    await Promise.all([
      fetchAllPages<NoteRow>((from, to) =>
        supabase
          .from("notes")
          .select("type, content, created_at, books(id, title, author, cover_image_url)")
          .eq("user_id", userId)
          .gte("created_at", start)
          .lte("created_at", end)
          .order("created_at")
          .order("id")
          .range(from, to),
      ),
      fetchAllPages<LogRow>((from, to) =>
        supabase
          .from("reading_logs")
          .select("reading_duration_seconds, start_page, end_page, started_at, user_books(books(title))")
          .eq("user_id", userId)
          .eq("status", "completed")
          .gte("started_at", start)
          .lte("started_at", end)
          .order("started_at")
          .order("id")
          .range(from, to),
      ),
      fetchAllPages<CompletedRow>((from, to) =>
        supabase
          .from("user_books")
          .select("completed_at, books(title, cover_image_url)")
          .eq("user_id", userId)
          .eq("status", "completed")
          .gte("completed_at", start)
          .lte("completed_at", end)
          .order("completed_at")
          .order("id")
          .range(from, to),
      ),
      // 활동일·연속일용: 페이지만 기록한 진행은 started_at 이 NULL 이라 created_at 기준으로 따로 읽는다.
      isProgressInLogsEnabled()
        ? fetchAllPages<{ created_at: string }>((from, to) =>
            supabase
              .from("reading_logs")
              .select("created_at")
              .eq("user_id", userId)
              .eq("status", "completed")
              .gte("created_at", start)
              .lte("created_at", end)
              .order("created_at")
              .order("id")
              .range(from, to),
          )
        : Promise.resolve([]),
      fetchAllPages<{ reading_duration_seconds: number | null }>((from, to) =>
        supabase
          .from("reading_logs")
          .select("reading_duration_seconds")
          .eq("user_id", userId)
          .eq("status", "completed")
          .gte("started_at", prevStart)
          .lte("started_at", prevEnd)
          .order("started_at")
          .order("id")
          .range(from, to),
      ),
      supabase
        .from("notes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", prevStart)
        .lte("created_at", prevEnd),
      supabase
        .from("user_books")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("completed_at", prevStart)
        .lte("completed_at", prevEnd),
    ]);

  const notes: YearlyNoteInput[] = noteRows.map((n) => {
    const book = firstRelation(n.books);
    return {
      created_at: n.created_at,
      type: n.type,
      content: n.content,
      book: book
        ? { id: book.id, title: book.title, author: book.author, coverImageUrl: book.cover_image_url }
        : null,
    };
  });
  const logs: YearlyLogInput[] = logRows.map((l) => ({
    reading_duration_seconds: l.reading_duration_seconds,
    start_page: l.start_page,
    end_page: l.end_page,
    started_at: l.started_at,
    bookTitle: firstRelation(l.user_books?.books ?? null)?.title ?? null,
  }));
  const completed: YearlyCompletedInput[] = completedRows.map((c) => {
    const book = firstRelation(c.books);
    return { completed_at: c.completed_at, title: book?.title ?? null, coverImageUrl: book?.cover_image_url ?? null };
  });

  const prevSeconds = prevLogRows.reduce((sum, r) => sum + (r.reading_duration_seconds ?? 0), 0);
  const prevNotes = prevNotesRes.count ?? 0;
  const prevCompleted = prevCompletedRes.count ?? 0;
  const hasPrev = prevSeconds > 0 || prevNotes > 0 || prevCompleted > 0;

  return buildYearlyRecap({
    year,
    notes,
    logs,
    completed,
    logActivityCreatedAts: logActivityRows.map((r) => r.created_at),
    prev: hasPrev ? { seconds: prevSeconds, completedBooks: prevCompleted, notes: prevNotes } : null,
  });
}
