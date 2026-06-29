/**
 * 독서 집계 코어 `computeReadingMetrics` (A3) — 단일 출처(SSOT).
 *
 * 라이브(`app/actions/stats.ts`)와 스냅샷(`app/actions/recap/compute.ts`)이
 * 같은 순수 함수로 메트릭을 산출 → 화면 간 숫자 일치(DEC-1 채택안).
 *
 * 순수 모듈 — DB 접근 없음. 이미 fetch한 행과 KST 헬퍼·streak 유틸을 재사용한다.
 * 결산 하이라이트(topBook·timeBuckets·memorableQuote 등)는 일반 메트릭이 아니므로
 * 호출부(compute.ts)가 별도로 계산한다.
 */

import { toKSTDateKey } from "@/lib/utils/timezone";
import { computeCurrentStreak, computeMaxStreak } from "@/lib/utils/streak";
import type { ReadingMetrics } from "@/types/reading-metrics";

/** 집계용 노트 행(최소 필드) */
export interface MetricNote {
  created_at: string;
  type: string;
  /** 책 관계가 있을 때만 book_id, 없으면 null (booksTouched 집계용) */
  bookId: string | null;
}

/** 집계용 세션(reading_logs) 행(최소 필드) */
export interface MetricLog {
  reading_duration_seconds: number | null;
  start_page: number | null;
  end_page: number | null;
}

export interface MetricsInput {
  notes: MetricNote[];
  logs: MetricLog[];
  /** 완독 권수 (호출부에서 count로 전달) */
  completedCount: number;
  range: { start: Date; end: Date };
  /**
   * 현재(전체) 연속 기록일 계산용 날짜키.
   * 미지정 시 notes의 날짜키 사용 — 단, 정확한 currentStreak는 더 넓은 윈도우의
   * 날짜키를 전달해야 한다(compute.ts는 streakNotes를 별도 조회해 전달).
   */
  streakDateKeys?: string[];
  /**
   * 범위 내 reading_logs "독서 활동"의 KST 날짜키 — 타이머 세션 포함.
   * activeDays·maxStreak 가 notes 뿐 아니라 독서 활동일도 포함하도록 병합한다.
   * 대시보드 캘린더/스트릭과 동일 정의(status='completed' reading_log)로 화면 간 숫자를 일치시킨다.
   * 미지정/빈배열이면 기존(notes-only) 동작.
   */
  logActivityDateKeys?: string[];
}

/** 기간 집계 — notes/logs/completed 행을 받아 공통 메트릭을 산출 */
export function computeReadingMetrics(input: MetricsInput): ReadingMetrics {
  const notesByType: Record<string, number> = {};
  const dayCounts = new Map<string, number>();
  const touchedBooks = new Set<string>();

  for (const n of input.notes) {
    notesByType[n.type] = (notesByType[n.type] ?? 0) + 1;
    const key = toKSTDateKey(new Date(n.created_at));
    dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
    if (n.bookId) touchedBooks.add(n.bookId);
  }

  // 독서 활동일(reading_logs 완료분 — 타이머 세션 포함) 병합 → activeDays·maxStreak 에 반영.
  // notesByType/booksTouched 는 노트 전용 메트릭이므로 건드리지 않는다. 날짜 단위 union 이라 이중 카운트 없음.
  for (const key of input.logActivityDateKeys ?? []) {
    dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
  }

  let totalSeconds = 0;
  let pages = 0;
  for (const l of input.logs) {
    totalSeconds += l.reading_duration_seconds ?? 0;
    if (l.start_page != null && l.end_page != null) {
      pages += Math.max(0, l.end_page - l.start_page);
    }
  }
  const sessionCount = input.logs.length;
  const dayKeys = [...dayCounts.keys()];

  return {
    range: { startISO: input.range.start.toISOString(), endISO: input.range.end.toISOString() },
    notes: input.notes.length,
    notesByType,
    time: {
      totalSeconds,
      sessionCount,
      avgSeconds: sessionCount > 0 ? Math.round(totalSeconds / sessionCount) : 0,
    },
    pages,
    completedBooks: input.completedCount,
    booksTouched: touchedBooks.size,
    activeDays: dayCounts.size,
    currentStreak: computeCurrentStreak(input.streakDateKeys ?? dayKeys),
    maxStreak: computeMaxStreak(dayKeys),
  };
}
