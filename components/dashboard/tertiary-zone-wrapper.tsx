import { getCachedCurrentUser, getCachedPersonaDashboardData } from "@/lib/cached";
import { getKSTYearMonth } from "@/lib/utils/timezone";
import { getMonthlyBookActivities } from "@/app/actions/stats";
import { getSampleMonthlyActivities } from "@/app/actions/sample";
import { generateDemoMonthlyActivities } from "@/lib/demo-calendar-data";
import { TertiaryZoneClient } from "./tertiary-zone-client";
import type { ReadingStats } from "@/types/persona";

/**
 * Tertiary Zone 서버 래퍼
 * 활동 캘린더, 최근 기록한 책, 페르소나 인사이트를 접이식으로 표시
 */
export async function TertiaryZoneWrapper() {
  const user = await getCachedCurrentUser();

  // 현재 월의 독서 활동 조회 (KST 기준)
  const { year: currentYear, month: currentMonth } = getKSTYearMonth();

  if (!user) {
    // 게스트 사용자: 샘플 월별 활동 데이터 조회
    let sampleActivities = await getSampleMonthlyActivities(currentYear, currentMonth).catch(() => ({}));

    // 샘플 데이터가 없으면 데모 데이터로 대체
    const hasActivityData = Object.keys(sampleActivities || {}).length > 0;
    if (!hasActivityData) {
      sampleActivities = generateDemoMonthlyActivities(currentYear, currentMonth);
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

  // 데이터가 없으면 데모 캘린더로 기능 미리보기 제공
  const hasActivityData = Object.keys(monthlyActivities || {}).length > 0;
  const persona = personaData?.persona;
  const readingStats = persona?.reading_stats as ReadingStats | null;
  const hasPersonaData = persona && readingStats;

  if (!hasActivityData && !hasPersonaData) {
    const demoActivities = generateDemoMonthlyActivities(currentYear, currentMonth);
    return (
      <TertiaryZoneClient
        monthlyActivities={demoActivities}
        initialYear={currentYear}
        initialMonth={currentMonth}
        persona={null}
        readingStats={null}
        isFirstUser
      />
    );
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
