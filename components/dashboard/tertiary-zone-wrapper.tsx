import { getCachedCurrentUser, getCachedPersonaDashboardData } from "@/lib/cached";
import { getMonthlyBookActivities } from "@/app/actions/stats";
import { TertiaryZoneClient } from "./tertiary-zone-client";
import type { ReadingStats } from "@/types/persona";

/**
 * Tertiary Zone 서버 래퍼
 * 활동 캘린더, 최근 기록한 책, 페르소나 인사이트를 접이식으로 표시
 */
export async function TertiaryZoneWrapper() {
  const user = await getCachedCurrentUser();

  if (!user) {
    // 게스트 사용자는 Tertiary Zone 숨김
    return null;
  }

  // 현재 월의 독서 활동 조회
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  // 병렬로 데이터 조회
  const [personaData, monthlyActivities] = await Promise.all([
    getCachedPersonaDashboardData().catch(() => null),
    getMonthlyBookActivities(user, currentYear, currentMonth).catch(() => ({})),
  ]);

  // 데이터가 없으면 숨김
  const hasActivityData = Object.keys(monthlyActivities || {}).length > 0;
  const persona = personaData?.persona;
  const readingStats = persona?.reading_stats as ReadingStats | null;
  const hasPersonaData = persona && readingStats;

  if (!hasActivityData && !hasPersonaData) {
    return null;
  }

  return (
    <TertiaryZoneClient
      monthlyActivities={monthlyActivities || {}}
      initialYear={currentYear}
      initialMonth={currentMonth}
      persona={persona ?? null}
      readingStats={readingStats ?? null}
    />
  );
}
