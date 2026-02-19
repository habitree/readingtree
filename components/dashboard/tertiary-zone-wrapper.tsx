import { getCachedCurrentUser, getCachedPersonaDashboardData } from "@/lib/cached";
import { getMonthlyBookActivities } from "@/app/actions/stats";
import { getSampleMonthlyActivities } from "@/app/actions/sample";
import { TertiaryZoneClient } from "./tertiary-zone-client";
import { TertiaryZoneEmptyGuide } from "./tertiary-zone-empty-guide";
import type { ReadingStats } from "@/types/persona";

/**
 * Tertiary Zone 서버 래퍼
 * 활동 캘린더, 최근 기록한 책, 페르소나 인사이트를 접이식으로 표시
 */
export async function TertiaryZoneWrapper() {
  const user = await getCachedCurrentUser();

  // 현재 월의 독서 활동 조회 (KST 기준)
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const currentYear = kst.getUTCFullYear();
  const currentMonth = kst.getUTCMonth() + 1;

  if (!user) {
    // 게스트 사용자: 샘플 월별 활동 데이터 조회
    const sampleActivities = await getSampleMonthlyActivities(currentYear, currentMonth).catch(() => ({}));

    const hasActivityData = Object.keys(sampleActivities || {}).length > 0;
    if (!hasActivityData) {
      return null;
    }

    return (
      <TertiaryZoneClient
        monthlyActivities={sampleActivities}
        initialYear={currentYear}
        initialMonth={currentMonth}
        persona={null}
        readingStats={null}
        isGuest
      />
    );
  }

  // 병렬로 데이터 조회
  const [personaData, monthlyActivities] = await Promise.all([
    getCachedPersonaDashboardData().catch(() => null),
    getMonthlyBookActivities(user, currentYear, currentMonth).catch(() => ({})),
  ]);

  // 데이터가 없으면 가이드 콘텐츠 표시
  const hasActivityData = Object.keys(monthlyActivities || {}).length > 0;
  const persona = personaData?.persona;
  const readingStats = persona?.reading_stats as ReadingStats | null;
  const hasPersonaData = persona && readingStats;

  if (!hasActivityData && !hasPersonaData) {
    return <TertiaryZoneEmptyGuide />;
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
