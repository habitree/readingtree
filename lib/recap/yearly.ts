/**
 * 연간 독서 결산(Reading Wrapped) 집계 — 순수 함수.
 *
 * DB 접근 없음. compute-yearly.ts 가 조회한 행을 받아 결산 수치와 슬라이드 목록을 만든다.
 * 일반 지표는 월간 결산과 같은 코어(computeReadingMetrics)를 써서 화면 간 숫자를 맞춘다.
 * yearly_recaps.stats / highlights JSONB 에 그대로 저장된다.
 */

import { computeReadingMetrics } from "@/lib/reading/metrics";
import { extractQuoteText } from "@/lib/recap/text";
import {
  buildPersonaTitle,
  YEARLY_PERSONA_THRESHOLDS,
  type PersonaTimeBuckets,
} from "@/lib/recap/persona-title";
import { getKSTComponents, kstHour, kstMonthEnd, kstMonthStart, toKSTDateKey } from "@/lib/utils/timezone";
import type { RecapNotesByType, RecapTopBook } from "@/app/actions/recap/types";

// ── 입력 ────────────────────────────────────────────────────────────────
export interface YearlyNoteInput {
  created_at: string;
  type: string;
  content: string | null;
  book: { id: string; title: string | null; author: string | null; coverImageUrl: string | null } | null;
}
export interface YearlyLogInput {
  reading_duration_seconds: number | null;
  start_page: number | null;
  end_page: number | null;
  started_at: string | null;
  bookTitle: string | null;
}
export interface YearlyCompletedInput {
  completed_at: string | null;
  title: string | null;
  coverImageUrl: string | null;
}
export interface YearlyPrevTotals {
  seconds: number;
  completedBooks: number;
  notes: number;
}
export interface YearlyRecapInput {
  year: number;
  notes: YearlyNoteInput[];
  /** status='completed' 세션만 */
  logs: YearlyLogInput[];
  completed: YearlyCompletedInput[];
  /** 활동일·연속일용 — 완료된 reading_logs 의 created_at (페이지만 기록한 진행 포함) */
  logActivityCreatedAts: string[];
  /** 작년 합계. 작년 기록이 전혀 없으면 null */
  prev: YearlyPrevTotals | null;
}

// ── 출력 ────────────────────────────────────────────────────────────────
export type PeakTime = keyof PersonaTimeBuckets;

export interface YearlyRecapStats {
  totalReadingSeconds: number;
  totalPages: number;
  sessionCount: number;
  completedBooks: number;
  totalNotes: number;
  notesByType: RecapNotesByType;
  booksTouched: number;
  activeDays: number;
  maxStreak: number;
  /** 인덱스 0 = 1월 */
  monthly: { seconds: number[]; completed: number[]; notes: number[] };
  /** 가장 많이 읽은 달(1~12). 활동이 전혀 없으면 null */
  bestMonth: number | null;
  timeBuckets: PersonaTimeBuckets;
  vsPrev: { secondsDelta: number; booksDelta: number; notesDelta: number } | null;
}

export interface YearlyRecapHighlights {
  personaTitle: string;
  /** 타입명의 근거가 된 사실 (최대 3줄) */
  personaReasons: string[];
  peakTime: PeakTime | null;
  topBook: RecapTopBook | null;
  /** 완독 책 표지 URL (최대 12장) */
  completedCovers: string[];
  longestSession: { bookTitle: string; minutes: number } | null;
  busiestDay: { dateKey: string; count: number } | null;
  memorableQuote: { text: string; bookTitle: string } | null;
}

export interface YearlyRecapComputed {
  year: number;
  stats: YearlyRecapStats;
  highlights: YearlyRecapHighlights;
  isEmpty: boolean;
}

export type YearlySlideKey =
  | "intro"
  | "totals"
  | "monthly"
  | "book"
  | "rhythm"
  | "quote"
  | "persona"
  | "summary";

export const PEAK_TIME_LABELS: Record<PeakTime, string> = {
  morning: "아침",
  afternoon: "한낮",
  evening: "저녁",
  night: "심야",
};

const MAX_COVERS = 12;
const QUOTE_MAX_LENGTH = 140;

/** 길면 말줄임표를 붙여 QUOTE_MAX_LENGTH 자로 자른다 */
function clipQuote(text: string): string {
  return text.length > QUOTE_MAX_LENGTH ? `${text.slice(0, QUOTE_MAX_LENGTH - 1)}…` : text;
}

function bucketOf(hour: number): PeakTime {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
}

/** 해당 연도(KST)의 월 인덱스(0~11). 연도가 다르면 null */
function monthIndexInYear(iso: string | null, year: number): number | null {
  if (!iso) return null;
  const c = getKSTComponents(new Date(iso));
  return c.year === year ? c.month - 1 : null;
}

function argMax(values: number[]): number | null {
  let best: number | null = null;
  for (let i = 0; i < values.length; i++) {
    if (values[i] > 0 && (best === null || values[i] > values[best])) best = i;
  }
  return best;
}

export function buildYearlyRecap(input: YearlyRecapInput): YearlyRecapComputed {
  const { year } = input;
  const start = kstMonthStart(year, 1);
  const end = kstMonthEnd(year, 12);

  const metrics = computeReadingMetrics({
    notes: input.notes.map((n) => ({ created_at: n.created_at, type: n.type, bookId: n.book?.id ?? null })),
    logs: input.logs,
    completedCount: input.completed.length,
    range: { start, end },
    logActivityDateKeys: input.logActivityCreatedAts.map((iso) => toKSTDateKey(new Date(iso))),
  });

  const monthly = {
    seconds: new Array<number>(12).fill(0),
    completed: new Array<number>(12).fill(0),
    notes: new Array<number>(12).fill(0),
  };
  const notesByType: RecapNotesByType = { transcription: 0, photo: 0, memo: 0, quote: 0, progress: 0 };
  const noteTime: PersonaTimeBuckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  const sessionTime: PersonaTimeBuckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  const dayCounts = new Map<string, number>();
  const bookNoteCounts = new Map<string, { book: NonNullable<YearlyNoteInput["book"]>; count: number }>();
  let quote: { text: string; bookTitle: string; isQuote: boolean } | null = null;

  for (const note of input.notes) {
    const t = note.type as keyof RecapNotesByType;
    if (t in notesByType) notesByType[t] += 1;

    const created = new Date(note.created_at);
    const mi = monthIndexInYear(note.created_at, year);
    if (mi !== null) monthly.notes[mi] += 1;
    const dateKey = toKSTDateKey(created);
    dayCounts.set(dateKey, (dayCounts.get(dateKey) ?? 0) + 1);
    noteTime[bucketOf(kstHour(created))] += 1;

    if (note.book) {
      const cur = bookNoteCounts.get(note.book.id);
      if (cur) cur.count += 1;
      else bookNoteCounts.set(note.book.id, { book: note.book, count: 1 });
    }

    // 올해의 문장: 인용을 메모보다 우선, 같은 종류 안에서는 가장 긴 것
    if ((note.type === "quote" || note.type === "memo") && note.content) {
      const text = extractQuoteText(note.content);
      const isQuote = note.type === "quote";
      const better =
        !quote || (isQuote && !quote.isQuote) || (isQuote === quote.isQuote && text.length > quote.text.length);
      if (text && better) quote = { text, bookTitle: note.book?.title ?? "", isQuote };
    }
  }

  let longestSession: YearlyRecapHighlights["longestSession"] = null;
  let longestSeconds = 0;
  for (const log of input.logs) {
    const sec = log.reading_duration_seconds ?? 0;
    const mi = monthIndexInYear(log.started_at, year);
    if (mi !== null) monthly.seconds[mi] += sec;
    if (log.started_at && sec > 0) sessionTime[bucketOf(kstHour(new Date(log.started_at)))] += 1;
    if (sec > longestSeconds) {
      longestSeconds = sec;
      longestSession = { bookTitle: log.bookTitle ?? "", minutes: Math.round(sec / 60) };
    }
  }

  const completedCovers: string[] = [];
  for (const c of input.completed) {
    const mi = monthIndexInYear(c.completed_at, year);
    if (mi !== null) monthly.completed[mi] += 1;
    if (c.coverImageUrl && completedCovers.length < MAX_COVERS) completedCovers.push(c.coverImageUrl);
  }

  // 시간대: 세션 시작 시각 기준, 세션이 없으면 기록 작성 시각
  const hasSessionTime = Object.values(sessionTime).some((v) => v > 0);
  const timeBuckets = hasSessionTime ? sessionTime : noteTime;
  let peakTime: PeakTime | null = null;
  for (const key of ["night", "morning", "evening", "afternoon"] as const) {
    if (timeBuckets[key] > 0 && (peakTime === null || timeBuckets[key] > timeBuckets[peakTime])) peakTime = key;
  }

  // 가장 많이 읽은 달: 독서 시간 → 없으면 기록 수 + 완독 수
  let bestIndex = argMax(monthly.seconds);
  if (bestIndex === null) bestIndex = argMax(monthly.notes.map((n, i) => n + monthly.completed[i]));

  let topBook: RecapTopBook | null = null;
  for (const { book, count } of bookNoteCounts.values()) {
    if (!topBook || count > topBook.noteCount) {
      topBook = {
        bookId: book.id,
        title: book.title ?? "제목 미상",
        author: book.author,
        coverImageUrl: book.coverImageUrl,
        noteCount: count,
      };
    }
  }

  let busiestDay: YearlyRecapHighlights["busiestDay"] = null;
  for (const [dateKey, count] of dayCounts) {
    if (!busiestDay || count > busiestDay.count) busiestDay = { dateKey, count };
  }

  const totalReadingSeconds = metrics.time.totalSeconds;
  const personaTitle = buildPersonaTitle(
    {
      totalNotes: metrics.notes,
      sessionCount: metrics.time.sessionCount,
      totalReadingSeconds,
      completedBooks: metrics.completedBooks,
      notesByType,
      timeBuckets,
    },
    YEARLY_PERSONA_THRESHOLDS,
  );

  const personaReasons: string[] = [];
  const hours = Math.round(totalReadingSeconds / 3600);
  if (hours > 0 || metrics.completedBooks > 0) {
    personaReasons.push(`올해 ${hours}시간 읽고 ${metrics.completedBooks}권을 완독했어요`);
  }
  if (peakTime) {
    personaReasons.push(
      hasSessionTime
        ? `${PEAK_TIME_LABELS[peakTime]}에 시작한 독서가 가장 많았어요`
        : `${PEAK_TIME_LABELS[peakTime]}에 남긴 기록이 가장 많았어요`,
    );
  }
  const visual = notesByType.photo + notesByType.transcription;
  const maxStyle = Math.max(notesByType.quote, notesByType.memo, visual);
  if (maxStyle > 0) {
    if (maxStyle === notesByType.quote) personaReasons.push(`인용 기록이 ${notesByType.quote}개로 가장 많았어요`);
    else if (maxStyle === notesByType.memo) personaReasons.push(`메모 기록이 ${notesByType.memo}개로 가장 많았어요`);
    else personaReasons.push(`사진·필사 기록이 ${visual}개로 가장 많았어요`);
  }

  const isEmpty =
    metrics.notes === 0 && metrics.time.sessionCount === 0 && metrics.completedBooks === 0 && metrics.activeDays === 0;

  return {
    year,
    stats: {
      totalReadingSeconds,
      totalPages: metrics.pages,
      sessionCount: metrics.time.sessionCount,
      completedBooks: metrics.completedBooks,
      totalNotes: metrics.notes,
      notesByType,
      booksTouched: metrics.booksTouched,
      activeDays: metrics.activeDays,
      maxStreak: metrics.maxStreak,
      monthly,
      bestMonth: bestIndex === null ? null : bestIndex + 1,
      timeBuckets,
      vsPrev: input.prev
        ? {
            secondsDelta: totalReadingSeconds - input.prev.seconds,
            booksDelta: metrics.completedBooks - input.prev.completedBooks,
            notesDelta: metrics.notes - input.prev.notes,
          }
        : null,
    },
    highlights: {
      personaTitle,
      personaReasons,
      peakTime,
      topBook,
      completedCovers,
      longestSession,
      busiestDay,
      memorableQuote: quote ? { text: clipQuote(quote.text), bookTitle: quote.bookTitle } : null,
    },
    isEmpty,
  };
}

/** 데이터가 있는 슬라이드만 순서대로 반환. 빈 결산이면 빈 배열 */
export function selectSlides(computed: YearlyRecapComputed): YearlySlideKey[] {
  if (computed.isEmpty) return [];
  const { stats, highlights } = computed;
  const slides: YearlySlideKey[] = ["intro", "totals"];
  if (stats.bestMonth !== null) slides.push("monthly");
  if (highlights.topBook || highlights.completedCovers.length > 0) slides.push("book");
  if (highlights.longestSession || highlights.peakTime || stats.maxStreak >= 2) slides.push("rhythm");
  if (highlights.memorableQuote) slides.push("quote");
  if (highlights.personaTitle !== YEARLY_PERSONA_THRESHOLDS.fallbackTitle) slides.push("persona");
  slides.push("summary");
  return slides;
}
