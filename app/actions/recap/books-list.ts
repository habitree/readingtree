"use server";

/**
 * 월간 "읽은 책" 대시보드 데이터 (라이브 쿼리, 스냅샷 미저장).
 *
 * getMonthlyBooksList(year, month):
 *   그 달에 활동(기록·세션·완독 중 하나라도)한 모든 책을 dedupe해 per-book 집계로 반환.
 *   - 인증 사용자: 본인 RLS(server client)
 *   - 게스트: 샘플 사용자(admin client) 데모
 *
 * KST 월 경계는 compute.ts / getMonthlyBookActivities와 동일 공식.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/app/actions/auth";
import { getSampleUserId } from "@/app/actions/sample";
import { extractQuoteText } from "@/lib/recap/text";
import {
  kstMonthStart,
  kstMonthEnd,
  isFutureKSTMonth as isFutureMonth,
} from "@/lib/utils/timezone";
import { computeProgressPercent } from "@/lib/reading/progress";
import type { MonthlyBookItem, MonthlyBooksResult } from "./types";

interface NoteRow {
  book_id: string;
  type: string;
  content: string | null;
  created_at: string;
}
interface LogRow {
  user_book_id: string;
  reading_duration_seconds: number | null;
  start_page: number | null;
  end_page: number | null;
  started_at: string | null;
}
interface UserBookRow {
  id: string;
  book_id: string;
  status: string;
  completed_at: string | null;
  current_page: number | null;
}
interface BookRow {
  id: string;
  title: string | null;
  author: string | null;
  cover_image_url: string | null;
  total_pages: number | null;
}

export async function getMonthlyBooksList(
  year: number,
  month: number,
): Promise<MonthlyBooksResult | null> {
  if (isFutureMonth(year, month)) return null;

  const user = await getCurrentUser();
  let userId: string;
  let supabase: SupabaseClient;
  let isGuest = false;
  if (user) {
    userId = user.id;
    supabase = await createServerSupabaseClient();
  } else {
    const sampleId = await getSampleUserId();
    if (!sampleId) return null;
    userId = sampleId;
    supabase = createAdminSupabaseClient();
    isGuest = true;
  }

  const start = kstMonthStart(year, month);
  const end = kstMonthEnd(year, month);

  const [notesRes, logsRes, userBooksRes] = await Promise.all([
    supabase
      .from("notes")
      .select("book_id, type, content, created_at")
      .eq("user_id", userId)
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString()),
    supabase
      .from("reading_logs")
      .select("user_book_id, reading_duration_seconds, start_page, end_page, started_at")
      .eq("user_id", userId)
      .gte("started_at", start.toISOString())
      .lte("started_at", end.toISOString()),
    supabase
      .from("user_books")
      .select("id, book_id, status, completed_at, current_page")
      .eq("user_id", userId),
  ]);

  const notes = (notesRes.data ?? []) as unknown as NoteRow[];
  const logs = (logsRes.data ?? []) as unknown as LogRow[];
  const userBooks = (userBooksRes.data ?? []) as unknown as UserBookRow[];

  // user_books 매핑
  const ubByBookId = new Map<string, UserBookRow>();
  const bookIdByUserBookId = new Map<string, string>();
  for (const ub of userBooks) {
    ubByBookId.set(ub.book_id, ub);
    bookIdByUserBookId.set(ub.id, ub.book_id);
  }

  const startMs = start.getTime();
  const endMs = end.getTime();
  const completedInMonth = (ub: UserBookRow | undefined): boolean => {
    if (!ub?.completed_at || ub.status !== "completed") return false;
    const t = new Date(ub.completed_at).getTime();
    return t >= startMs && t <= endMs;
  };

  // per-book 누적기
  interface Acc {
    bookId: string;
    noteCount: number;
    readingSeconds: number;
    pagesRead: number;
    lastActiveMs: number;
    excerpt: string | null;
    excerptLen: number;
  }
  const acc = new Map<string, Acc>();
  const ensure = (bookId: string): Acc => {
    let a = acc.get(bookId);
    if (!a) {
      a = { bookId, noteCount: 0, readingSeconds: 0, pagesRead: 0, lastActiveMs: 0, excerpt: null, excerptLen: 0 };
      acc.set(bookId, a);
    }
    return a;
  };

  for (const note of notes) {
    const a = ensure(note.book_id);
    a.noteCount += 1;
    const ms = new Date(note.created_at).getTime();
    if (ms > a.lastActiveMs) a.lastActiveMs = ms;
    if ((note.type === "quote" || note.type === "memo") && note.content) {
      const text = extractQuoteText(note.content);
      if (text && text.length > a.excerptLen) {
        a.excerptLen = text.length;
        a.excerpt = text.slice(0, 140);
      }
    }
  }

  for (const log of logs) {
    const bookId = bookIdByUserBookId.get(log.user_book_id);
    if (!bookId) continue;
    const a = ensure(bookId);
    a.readingSeconds += log.reading_duration_seconds ?? 0;
    if (log.start_page != null && log.end_page != null) {
      a.pagesRead += Math.max(0, log.end_page - log.start_page);
    }
    if (log.started_at) {
      const ms = new Date(log.started_at).getTime();
      if (ms > a.lastActiveMs) a.lastActiveMs = ms;
    }
  }

  // 그 달 완독 책도 활동에 포함 (기록·세션이 없어도)
  for (const ub of userBooks) {
    if (completedInMonth(ub)) {
      const a = ensure(ub.book_id);
      const ms = new Date(ub.completed_at as string).getTime();
      if (ms > a.lastActiveMs) a.lastActiveMs = ms;
    }
  }

  if (acc.size === 0) {
    return { year, month, totalBooks: 0, completedCount: 0, totalReadingSeconds: 0, books: [], isGuest };
  }

  // 책 메타 일괄 조회
  const bookIds = [...acc.keys()];
  const { data: booksData } = await supabase
    .from("books")
    .select("id, title, author, cover_image_url, total_pages")
    .in("id", bookIds);
  const bookMeta = new Map<string, BookRow>();
  for (const b of (booksData ?? []) as unknown as BookRow[]) bookMeta.set(b.id, b);

  let totalReadingSeconds = 0;
  let completedCount = 0;
  const items: MonthlyBookItem[] = [];

  for (const a of acc.values()) {
    const ub = ubByBookId.get(a.bookId);
    const meta = bookMeta.get(a.bookId);
    const isCompleted = completedInMonth(ub);
    if (isCompleted) completedCount += 1;
    totalReadingSeconds += a.readingSeconds;

    const totalPages = meta?.total_pages ?? null;
    const currentPage = ub?.current_page ?? null;
    const progressPercent =
      currentPage != null ? computeProgressPercent(currentPage, totalPages) : null;

    items.push({
      userBookId: ub?.id ?? a.bookId,
      bookId: a.bookId,
      title: meta?.title ?? "제목 미상",
      author: meta?.author ?? null,
      coverImageUrl: meta?.cover_image_url ?? null,
      totalPages,
      currentPage,
      status: ub?.status ?? "reading",
      completedInMonth: isCompleted,
      noteCount: a.noteCount,
      readingSeconds: a.readingSeconds,
      pagesRead: a.pagesRead,
      lastActiveAt: new Date(a.lastActiveMs || startMs).toISOString(),
      excerpt: a.excerpt,
      progressPercent,
    });
  }

  // 완독 우선 → 최근 활동 내림차순
  items.sort((x, y) => {
    if (x.completedInMonth !== y.completedInMonth) return x.completedInMonth ? -1 : 1;
    return new Date(y.lastActiveAt).getTime() - new Date(x.lastActiveAt).getTime();
  });

  return {
    year,
    month,
    totalBooks: items.length,
    completedCount,
    totalReadingSeconds,
    books: items,
    isGuest,
  };
}
