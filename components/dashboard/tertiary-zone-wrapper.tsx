import { getCachedCurrentUser, getCachedPersonaDashboardData } from "@/lib/cached";
import { getKSTYearMonth } from "@/lib/utils/timezone";
import { getMonthlyBookActivities } from "@/app/actions/stats";
import { getSampleFilledMonthlyActivities } from "@/app/actions/sample";
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
    // 게스트 사용자: 관리자(샘플)의 실제 데이터를 당월 날짜에 리매핑해 최대한 채운다.
    // 당월에 작성된 노트만 보던 기존 방식은 관리자가 이번 달 기록이 적으면 비어
    // 일반 데모로 떨어졌다. 실제 책·표지로 채운 뒤, 데이터가 전혀 없을 때만 데모 폴백.
    let sampleActivities = await getSampleFilledMonthlyActivities(
      currentYear,
      currentMonth,
    ).catch(() => ({}));

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
