"use server";

/**
 * 월간 독서결산 집계 (순수 계산, DB 쓰기 없음).
 *
 * computeRecapForUser(supabase, userId, year, month):
 *   - 호출자가 클라이언트와 userId를 명시 → 인앱(본인 RLS), 게스트 데모(admin+샘플),
 *     크론(admin+임의 유저) 모두 동일 함수로 처리 가능.
 *
 * KST(UTC+9) 월 경계는 stats.ts getMonthlyBookActivities와 동일한 공식을 사용한다.
 * 로컬타임(new Date(year, month-1, 1)) 사용 금지 — 월말 off-by-one 방지.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  RecapComputed,
  RecapNotesByType,
  RecapBadge,
  RecapTopBook,
  RecapHighlights,
} from "./types";

// ── KST 헬퍼 (stats.ts와 동일 공식) ──────────────────────────────────────
function kstMonthStart(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1) - 9 * 60 * 60 * 1000);
}
function kstMonthEnd(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999) - 9 * 60 * 60 * 1000);
}
function toKSTDateKey(date: Date): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, "0")}-${String(kst.getUTCDate()).padStart(2, "0")}`;
}
function kstHour(date: Date): number {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).getUTCHours();
}

// ── 쿼리 결과 행 타입 ────────────────────────────────────────────────────
interface BookMini {
  id: string;
  title: string | null;
  author: string | null;
  cover_image_url: string | null;
}
interface NoteRow {
  id: string;
  type: string;
  content: string | null;
  page_number: number | null;
  book_id: string;
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

const EMPTY_NOTES_BY_TYPE: RecapNotesByType = {
  transcription: 0,
  photo: 0,
  memo: 0,
  quote: 0,
  progress: 0,
};

export async function computeRecapForUser(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  month: number,
): Promise<RecapComputed> {
  const start = kstMonthStart(year, month);
  const end = kstMonthEnd(year, month);
  const prevStart = kstMonthStart(year, month - 1);
  const prevEnd = kstMonthEnd(year, month - 1);
  const yearStart = new Date(Date.UTC(year, 0, 1) - 9 * 60 * 60 * 1000);
  const streakSince = new Date(start.getTime() - 35 * 24 * 60 * 60 * 1000);

  const [
    notesRes,
    logsRes,
    completedRes,
    prevNotesRes,
    prevLogsRes,
    prevCompletedRes,
    goalRowRes,
    completedYTDRes,
    streakNotesRes,
  ] = await Promise.all([
    supabase
      .from("notes")
      .select("id, type, content, page_number, book_id, created_at, books(id, title, author, cover_image_url)")
      .eq("user_id", userId)
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString()),
    supabase
      .from("reading_logs")
      .select("reading_duration_seconds, start_page, end_page, started_at, user_books(books(title))")
      .eq("user_id", userId)
      .gte("started_at", start.toISOString())
      .lte("started_at", end.toISOString()),
    supabase
      .from("user_books")
      .select("completed_at, books(title, cover_image_url)")
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("completed_at", start.toISOString())
      .lte("completed_at", end.toISOString()),
    supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", prevStart.toISOString())
      .lte("created_at", prevEnd.toISOString()),
    supabase
      .from("reading_logs")
      .select("reading_duration_seconds")
      .eq("user_id", userId)
      .gte("started_at", prevStart.toISOString())
      .lte("started_at", prevEnd.toISOString()),
    supabase
      .from("user_books")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("completed_at", prevStart.toISOString())
      .lte("completed_at", prevEnd.toISOString()),
    supabase.from("users").select("reading_goal").eq("id", userId).maybeSingle(),
    supabase
      .from("user_books")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("completed_at", yearStart.toISOString()),
    supabase
      .from("notes")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", streakSince.toISOString()),
  ]);

  const notes = (notesRes.data ?? []) as unknown as NoteRow[];
  const logs = (logsRes.data ?? []) as unknown as LogRow[];
  const completed = (completedRes.data ?? []) as unknown as CompletedRow[];

  // ── notes 집계 ──────────────────────────────────────────────
  const notesByType: RecapNotesByType = { ...EMPTY_NOTES_BY_TYPE };
  const dayCounts = new Map<string, number>();
  const bookNoteCounts = new Map<string, { book: BookMini; count: number }>();
  const authorCounts = new Map<string, number>();
  const timeBuckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  let memorableQuote: RecapHighlights["memorableQuote"] = null;
  let memorableLen = 0;

  for (const note of notes) {
    const t = note.type as keyof RecapNotesByType;
    if (t in notesByType) notesByType[t] += 1;

    const dateKey = toKSTDateKey(new Date(note.created_at));
    dayCounts.set(dateKey, (dayCounts.get(dateKey) ?? 0) + 1);

    const h = kstHour(new Date(note.created_at));
    if (h >= 6 && h < 12) timeBuckets.morning += 1;
    else if (h >= 12 && h < 18) timeBuckets.afternoon += 1;
    else if (h >= 18 && h < 22) timeBuckets.evening += 1;
    else timeBuckets.night += 1;

    const book = firstRelation(note.books);
    if (book) {
      const cur = bookNoteCounts.get(note.book_id);
      if (cur) cur.count += 1;
      else bookNoteCounts.set(note.book_id, { book, count: 1 });
      if (book.author) authorCounts.set(book.author, (authorCounts.get(book.author) ?? 0) + 1);
    }

    // 베스트 인용: quote/memo 중 가장 긴 텍스트
    if ((note.type === "quote" || note.type === "memo") && note.content) {
      const text = extractQuoteText(note.content);
      if (text && text.length > memorableLen) {
        memorableLen = text.length;
        memorableQuote = { text: text.slice(0, 140), bookTitle: book?.title ?? "" };
      }
    }
  }

  const totalNotes = notes.length;
  const activeDays = dayCounts.size;
  const booksTouched = bookNoteCounts.size;

  let busiestDay: RecapHighlights["busiestDay"] = null;
  for (const [dateKey, count] of dayCounts) {
    if (!busiestDay || count > busiestDay.count) busiestDay = { dateKey, count };
  }

  const maxStreakInMonth = computeMaxStreak([...dayCounts.keys()]);

  let topBook: RecapTopBook | null = null;
  for (const { book, count } of bookNoteCounts.values()) {
    if (!topBook || count > topBook.noteCount) {
      topBook = {
        bookId: book.id,
        title: book.title ?? "제목 미상",
        author: book.author,
        coverImageUrl: book.cover_image_url,
        noteCount: count,
      };
    }
  }
  let mostReadAuthor: RecapHighlights["mostReadAuthor"] = null;
  for (const [name, count] of authorCounts) {
    if (!mostReadAuthor || count > mostReadAuthor.noteCount) mostReadAuthor = { name, noteCount: count };
  }

  // ── reading_logs 집계 ───────────────────────────────────────
  let totalReadingSeconds = 0;
  let totalPages = 0;
  let longestSession: RecapHighlights["longestSession"] = null;
  let longestSeconds = 0;
  for (const log of logs) {
    const sec = log.reading_duration_seconds ?? 0;
    totalReadingSeconds += sec;
    if (log.start_page != null && log.end_page != null) {
      totalPages += Math.max(0, log.end_page - log.start_page);
    }
    if (sec > longestSeconds) {
      longestSeconds = sec;
      const lb = firstRelation(log.user_books?.books ?? null);
      longestSession = { bookTitle: lb?.title ?? "", minutes: Math.round(sec / 60) };
    }
  }
  const sessionCount = logs.length;

  // ── completed 집계 ──────────────────────────────────────────
  const completedBooks = completed.length;
  const completedCovers: string[] = [];
  for (const c of completed) {
    const cb = firstRelation(c.books);
    if (cb?.cover_image_url && completedCovers.length < 5) completedCovers.push(cb.cover_image_url);
  }

  // ── 전월 비교 ───────────────────────────────────────────────
  const prevNotesCount = prevNotesRes.count ?? 0;
  const prevLogs = (prevLogsRes.data ?? []) as unknown as { reading_duration_seconds: number | null }[];
  const prevSeconds = prevLogs.reduce((s, r) => s + (r.reading_duration_seconds ?? 0), 0);
  const prevCompleted = prevCompletedRes.count ?? 0;

  // ── 목표 진행도 (연간) ──────────────────────────────────────
  const goalRow = (goalRowRes.data ?? null) as { reading_goal: number | null } | null;
  const goalTarget = goalRow?.reading_goal ?? 0;
  const completedYTD = completedYTDRes.count ?? 0;
  const goalProgress = goalTarget > 0 ? Math.min(Math.round((completedYTD / goalTarget) * 100), 100) : 0;

  // ── 현재 연속 기록일 ────────────────────────────────────────
  const streakNotes = (streakNotesRes.data ?? []) as unknown as { created_at: string }[];
  const currentStreak = computeCurrentStreak(streakNotes.map((n) => toKSTDateKey(new Date(n.created_at))));

  // ── 페르소나 타이틀 / 뱃지 ──────────────────────────────────
  const personaTitle = buildPersonaTitle({
    totalNotes,
    sessionCount,
    totalReadingSeconds,
    completedBooks,
    notesByType,
    timeBuckets,
  });
  const badges = buildBadges({
    maxStreakInMonth,
    currentStreak,
    completedBooks,
    totalNotes,
    totalReadingSeconds,
    activeDays,
  });

  const isEmpty = totalNotes === 0 && sessionCount === 0 && completedBooks === 0;

  return {
    year,
    month,
    stats: {
      totalNotes,
      notesByType,
      totalReadingSeconds,
      totalPages,
      sessionCount,
      completedBooks,
      booksTouched,
      activeDays,
      maxStreakInMonth,
      currentStreak,
      vsPrev: {
        notesDelta: totalNotes - prevNotesCount,
        secondsDelta: totalReadingSeconds - prevSeconds,
        booksDelta: completedBooks - prevCompleted,
      },
      goal: { target: goalTarget, completedYTD, progress: goalProgress },
    },
    highlights: {
      personaTitle,
      topBook,
      mostReadAuthor,
      longestSession,
      busiestDay,
      completedCovers,
      memorableQuote,
      badges,
    },
    isEmpty,
  };
}

// ── 보조 함수 ────────────────────────────────────────────────────────────

/** notes.content에서 인용 텍스트 추출 (JSON {quote,memo} 또는 평문) */
function extractQuoteText(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as { quote?: unknown; memo?: unknown; text?: unknown };
      const q = typeof parsed.quote === "string" ? parsed.quote : "";
      const m = typeof parsed.memo === "string" ? parsed.memo : "";
      const x = typeof parsed.text === "string" ? parsed.text : "";
      return (q || x || m).trim();
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

/** 정렬된 날짜키 배열에서 최대 연속 일수 */
function computeMaxStreak(dateKeys: string[]): number {
  if (dateKeys.length === 0) return 0;
  const days = [...dateKeys].sort();
  let max = 1;
  let cur = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(`${days[i - 1]}T00:00:00Z`).getTime();
    const now = new Date(`${days[i]}T00:00:00Z`).getTime();
    if (now - prev === 86400000) {
      cur += 1;
      if (cur > max) max = cur;
    } else if (now !== prev) {
      cur = 1;
    }
  }
  return max;
}

/** 오늘(또는 어제)부터 거슬러 올라가는 현재 연속 기록일 */
function computeCurrentStreak(dateKeys: string[]): number {
  const set = new Set(dateKeys);
  if (set.size === 0) return 0;
  const todayKst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const todayMid = Date.UTC(todayKst.getUTCFullYear(), todayKst.getUTCMonth(), todayKst.getUTCDate());
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(todayMid - i * 86400000);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    if (set.has(key)) streak += 1;
    else if (i > 0) break;
  }
  return streak;
}

/** 규칙 기반 독서 페르소나 타이틀 */
function buildPersonaTitle(input: {
  totalNotes: number;
  sessionCount: number;
  totalReadingSeconds: number;
  completedBooks: number;
  notesByType: RecapNotesByType;
  timeBuckets: { morning: number; afternoon: number; evening: number; night: number };
}): string {
  if (input.totalNotes < 3 && input.sessionCount < 3) return "이달의 독서가";

  const hours = input.totalReadingSeconds / 3600;
  let volume = "꾸준한";
  if (hours >= 15 || input.completedBooks >= 5) volume = "몰입형";
  else if (hours < 3 && input.completedBooks < 2) volume = "가벼운";

  const tb = input.timeBuckets;
  const maxTime = Math.max(tb.morning, tb.afternoon, tb.evening, tb.night);
  let timeWord = "";
  if (maxTime > 0) {
    if (maxTime === tb.night) timeWord = "심야";
    else if (maxTime === tb.morning) timeWord = "아침";
    else if (maxTime === tb.evening) timeWord = "저녁";
    else timeWord = "한낮";
  }

  const n = input.notesByType;
  const visual = n.photo + n.transcription;
  let styleNoun = "탐독가";
  const maxStyle = Math.max(n.quote, n.memo, visual);
  if (maxStyle > 0) {
    if (maxStyle === n.quote) styleNoun = "문장 수집가";
    else if (maxStyle === n.memo) styleNoun = "사색가";
    else styleNoun = "기록가";
  }

  return [volume, timeWord, styleNoun].filter(Boolean).join(" ");
}

/** 그 달 달성 뱃지 */
function buildBadges(input: {
  maxStreakInMonth: number;
  currentStreak: number;
  completedBooks: number;
  totalNotes: number;
  totalReadingSeconds: number;
  activeDays: number;
}): RecapBadge[] {
  const badges: RecapBadge[] = [];
  const streak = Math.max(input.maxStreakInMonth, input.currentStreak);
  if (streak >= 30) badges.push({ key: "streak_30", label: "30일 연속 독서", icon: "🔥" });
  else if (streak >= 14) badges.push({ key: "streak_14", label: "14일 연속 독서", icon: "🔥" });
  else if (streak >= 7) badges.push({ key: "streak_7", label: "7일 연속 독서", icon: "🔥" });

  if (input.completedBooks >= 10) badges.push({ key: "books_10", label: "월 10권 완독", icon: "📚" });
  else if (input.completedBooks >= 5) badges.push({ key: "books_5", label: "월 5권 완독", icon: "📚" });
  else if (input.completedBooks >= 3) badges.push({ key: "books_3", label: "월 3권 완독", icon: "📚" });
  else if (input.completedBooks >= 1) badges.push({ key: "books_1", label: "완독 달성", icon: "✅" });

  if (input.totalNotes >= 30) badges.push({ key: "notes_30", label: "기록 30개", icon: "✍️" });
  else if (input.totalNotes >= 10) badges.push({ key: "notes_10", label: "기록 10개", icon: "✍️" });

  if (input.totalReadingSeconds >= 36000) badges.push({ key: "time_10h", label: "독서 10시간", icon: "⏱️" });

  if (input.activeDays >= 20) badges.push({ key: "days_20", label: "20일 기록", icon: "📅" });

  return badges;
}
