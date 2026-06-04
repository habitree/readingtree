/**
 * 독서 시간(duration) 표시 포맷 — 단일 출처(SSOT).
 *
 * 이전에는 `formatDuration`(reading-time-tab), `formatReadingTime`(lib/recap/text),
 * `formatTime`(music-*) 등 유사 포맷터가 여러 곳에 흩어져 표현이 화면마다 달랐다.
 * 날짜 포맷(date-fns 기반)은 `lib/utils/date.ts`가 담당하고,
 * 본 모듈은 "초 → 사람이 읽는 길이/시계" 변환만 담당한다.
 */

export interface FormatDurationOptions {
  /** 분 계산 방식. "floor"(기본) | "round" */
  rounding?: "floor" | "round";
  /** 0시간 0분일 때 표기. 기본 "1분 미만" */
  zeroLabel?: string;
}

/** 초 → "N시간 M분" / "N시간" / "M분" 한국어 표기 */
export function formatDuration(
  seconds: number,
  options: FormatDurationOptions = {}
): string {
  const { rounding = "floor", zeroLabel = "1분 미만" } = options;
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const rem = total % 3600;
  const m = rounding === "round" ? Math.round(rem / 60) : Math.floor(rem / 60);
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  if (m > 0) return `${m}분`;
  return zeroLabel;
}

/** 초 → "M:SS" 시계 표기 (음악 플레이어 등) */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

/** 시작/종료 ISO 시각 → "HH:MM ~ HH:MM" (KST 로케일) 표기 */
export function formatTimeRange(
  startedAt: string | null,
  endedAt: string | null
): string {
  if (!startedAt) return "";
  const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
  const start = new Date(startedAt).toLocaleTimeString("ko-KR", opts);
  if (!endedAt) return start;
  const end = new Date(endedAt).toLocaleTimeString("ko-KR", opts);
  return `${start} ~ ${end}`;
}
