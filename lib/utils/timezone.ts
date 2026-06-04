/**
 * KST(UTC+9) 표준 시간 헬퍼 — 통계/결산 집계의 단일 출처(SSOT).
 *
 * 이전에는 `app/actions/stats.ts` 와 `app/actions/recap/compute.ts` 가
 * 동일한 KST 월경계/날짜키 로직을 각자 정의("동일 공식" 주석까지)했다.
 * 월말 off-by-one을 한 곳에서 보장하기 위해 본 모듈로 통합한다.
 *
 * 순수 모듈("use server" 없음) — 서버 액션/컴포넌트 어디서든 import 가능.
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** UTC Date를 KST 기준 "YYYY-MM-DD" 날짜키로 변환 */
export function toKSTDateKey(date: Date): string {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, "0")}-${String(kst.getUTCDate()).padStart(2, "0")}`;
}

/** KST 기준 Date의 연/월(1~12)/일/요일(0=일) 컴포넌트 반환 */
export function getKSTComponents(date: Date): {
  year: number;
  month: number;
  day: number;
  dayOfWeek: number;
} {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  return {
    year: kst.getUTCFullYear(),
    month: kst.getUTCMonth() + 1,
    day: kst.getUTCDate(),
    dayOfWeek: kst.getUTCDay(),
  };
}

/** KST 기준 지정 날짜(month: 1~12)의 자정(00:00:00) UTC Date 반환 */
export function toKSTMidnight(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day) - KST_OFFSET_MS);
}

/** KST 기준 오늘 자정(00:00:00) UTC Date 반환 */
export function getKSTToday(): Date {
  const { year, month, day } = getKSTComponents(new Date());
  return toKSTMidnight(year, month, day);
}

/** KST 기준 해당 월 1일 자정(month: 1~12)의 UTC Date 반환 */
export function kstMonthStart(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1) - KST_OFFSET_MS);
}

/** KST 기준 해당 월 마지막 순간(23:59:59.999, month: 1~12)의 UTC Date 반환 */
export function kstMonthEnd(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999) - KST_OFFSET_MS);
}

/** UTC Date의 KST 기준 시(0~23) 반환 */
export function kstHour(date: Date): number {
  return new Date(date.getTime() + KST_OFFSET_MS).getUTCHours();
}

/** KST 기준 현재 연/월(month: 1~12) */
export function getKSTYearMonth(): { year: number; month: number } {
  const kst = new Date(Date.now() + KST_OFFSET_MS);
  return { year: kst.getUTCFullYear(), month: kst.getUTCMonth() + 1 };
}

/** (year, month: 1~12)가 현재 KST 월보다 미래인지 */
export function isFutureKSTMonth(year: number, month: number): boolean {
  const cur = getKSTYearMonth();
  return year > cur.year || (year === cur.year && month > cur.month);
}
