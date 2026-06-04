/**
 * 연속 기록일(streak) 계산 — 단일 출처(SSOT).
 *
 * 이전에는 현재/최대 스트릭 계산이 두 곳에 따로 구현돼 있었다:
 *   - `app/actions/stats.ts` getStreakAndTodayData (홈·통계·결산 하이라이트가 참조)
 *   - `app/actions/recap/compute.ts` computeCurrentStreak / computeMaxStreak (월간 결산)
 * 두 알고리즘은 사실상 동일(KST 기준, 오늘부터 역순, 첫 공백에서 중단)했으나
 * 분기되어 불일치 위험이 있었다. 본 모듈로 통합한다.
 *
 * 순수 모듈 — 날짜키("YYYY-MM-DD", KST 기준)만 입력받는다.
 * gamification 원장(`user_points.current_streak`)은 별도 증가식 값으로, 여기서 다루지 않는다.
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;

/** UTC millis → "YYYY-MM-DD" (UTC 컴포넌트 그대로 사용 — 호출부에서 KST 보정 후 전달) */
function dateKeyFromUTCMillis(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/**
 * 오늘(또는 어제)부터 거슬러 올라가는 현재 연속 기록일.
 * 오늘 기록이 없어도 어제까지 연속이면 유지. 첫 공백에서 중단.
 * @param dateKeys 기록이 있는 KST 날짜키 모음
 * @param maxLookbackDays 최대 확인 일수(입력 윈도우보다 크면 결과 불변)
 */
export function computeCurrentStreak(
  dateKeys: Iterable<string>,
  maxLookbackDays = 400
): number {
  const set = dateKeys instanceof Set ? dateKeys : new Set(dateKeys);
  if (set.size === 0) return 0;
  const todayKst = new Date(Date.now() + KST_OFFSET_MS);
  const todayMid = Date.UTC(
    todayKst.getUTCFullYear(),
    todayKst.getUTCMonth(),
    todayKst.getUTCDate()
  );
  let streak = 0;
  for (let i = 0; i < maxLookbackDays; i++) {
    const key = dateKeyFromUTCMillis(todayMid - i * DAY_MS);
    if (set.has(key)) streak += 1;
    else if (i > 0) break;
  }
  return streak;
}

/** 날짜키 모음에서 최대 연속 일수 */
export function computeMaxStreak(dateKeys: Iterable<string>): number {
  const days = [...new Set(dateKeys)].sort();
  if (days.length === 0) return 0;
  let max = 1;
  let cur = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(`${days[i - 1]}T00:00:00Z`).getTime();
    const now = new Date(`${days[i]}T00:00:00Z`).getTime();
    if (now - prev === DAY_MS) {
      cur += 1;
      if (cur > max) max = cur;
    } else if (now !== prev) {
      cur = 1;
    }
  }
  return max;
}
