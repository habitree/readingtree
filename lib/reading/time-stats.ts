/**
 * 독서 시간 집계 — 순수 헬퍼 (기록 기획 12 · Phase A)
 *
 * `app/actions/progress.ts`에 흩어져 있던 시간 합산 로직(getUserReadingTimeStats·
 * getReadingTimeStats)을 한 곳으로 모은다. DB 접근은 액션에 남기고(레이어 규칙),
 * 여기서는 이미 fetch한 행만 받아 합산한다 → 순수·테스트 가능·동작 보존.
 *
 * 오늘/이번주 경계는 호출자가 주입한다(KST 일관성·테스트 결정성은 호출자 책임).
 */

export interface ReadingTimeRow {
  reading_duration_seconds: number | null;
  started_at?: string | null;
}

export interface ReadingTimeSummary {
  totalSeconds: number;
  sessionCount: number;
  averageSeconds: number;
  todaySeconds: number;
  thisWeekSeconds: number;
}

export interface TimeBoundaries {
  /** 오늘 시작 시각(ISO). started_at >= 이 값이면 오늘 집계 */
  todayStartIso: string;
  /** 이번주 시작 시각(ISO). started_at >= 이 값이면 이번주 집계 */
  weekStartIso: string;
}

/**
 * 시간 기록 행 배열을 합산한다.
 * - 항상: totalSeconds·sessionCount·averageSeconds
 * - boundaries 주입 시: todaySeconds·thisWeekSeconds (없으면 0)
 *
 * 비교는 ISO 문자열 사전식 비교(기존 동작과 동일) — 동일 형식 가정.
 */
export function summarizeReadingTime(
  rows: ReadingTimeRow[],
  boundaries?: TimeBoundaries,
): ReadingTimeSummary {
  let totalSeconds = 0;
  let todaySeconds = 0;
  let thisWeekSeconds = 0;

  for (const row of rows) {
    const dur = row.reading_duration_seconds || 0;
    totalSeconds += dur;
    if (boundaries) {
      const startedAt = row.started_at || "";
      if (startedAt >= boundaries.todayStartIso) todaySeconds += dur;
      if (startedAt >= boundaries.weekStartIso) thisWeekSeconds += dur;
    }
  }

  const sessionCount = rows.length;

  return {
    totalSeconds,
    sessionCount,
    averageSeconds: sessionCount > 0 ? Math.round(totalSeconds / sessionCount) : 0,
    todaySeconds,
    thisWeekSeconds,
  };
}
