/**
 * 독서 세션 활성 시간 계산 — 서버(저장)·클라이언트(표시) 공용 단일 출처.
 *
 * 활성 시간 = (paused_at ?? now) − started_at − paused_seconds
 *  - paused_at: 현재 일시정지 시작 시각 (NULL = 진행 중)
 *  - paused_seconds: 이전 일시정지 구간 누적(초)
 */
export interface SessionTimeFields {
  started_at: string | null;
  paused_at?: string | null;
  paused_seconds?: number | null;
}

export function computeActiveSeconds(s: SessionTimeFields, nowMs: number = Date.now()): number {
  if (!s.started_at) return 0;
  const startedMs = new Date(s.started_at).getTime();
  if (Number.isNaN(startedMs)) return 0;
  const pausedMs = s.paused_at ? new Date(s.paused_at).getTime() : NaN;
  const untilMs = Number.isNaN(pausedMs) ? nowMs : pausedMs;
  const seconds = Math.floor((untilMs - startedMs) / 1000) - (s.paused_seconds ?? 0);
  return Math.max(0, seconds);
}
