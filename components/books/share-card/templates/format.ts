/**
 * 공유 카드 템플릿 공용 날짜 포맷터
 * (템플릿마다 표기 톤이 달라도 파싱·안전 처리 로직은 공유한다)
 */

function toDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 2026.04.08 */
export function fmtDot(iso?: string | null): string | null {
  const d = toDate(iso);
  if (!d) return null;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

/** 04.08 (연도 생략) */
export function fmtMonthDay(iso?: string | null): string | null {
  const d = toDate(iso);
  if (!d) return null;
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

/** 2026년 4월 8일 */
export function fmtKorean(iso?: string | null): string | null {
  const d = toDate(iso);
  if (!d) return null;
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** 연도만 (2026) */
export function fmtYear(iso?: string | null): string | null {
  const d = toDate(iso);
  if (!d) return null;
  return String(d.getFullYear());
}

/** 월 숫자 (1~12) */
export function monthOf(iso?: string | null): number | null {
  const d = toDate(iso);
  return d ? d.getMonth() + 1 : null;
}

/** "2026.04.08 – 04.15" 형태의 기간 표기 (완독일 없으면 시작일만) */
export function fmtPeriod(startedAt?: string | null, completedAt?: string | null): string | null {
  const s = fmtDot(startedAt);
  if (!s) return fmtDot(completedAt);
  const e = fmtMonthDay(completedAt);
  return e ? `${s} – ${e}` : s;
}
