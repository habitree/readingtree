import { getCurrentUser } from "@/app/actions/auth";
import { getPersonaDashboardData } from "@/app/actions/persona";
import { getDailyRecordsByType } from "@/app/actions/stats";
import { TertiaryZoneClient } from "./tertiary-zone-client";
import type { ReadingStats } from "@/types/persona";

/**
 * Tertiary Zone 서버 래퍼
 * 활동 캘린더, 최근 기록한 책, 페르소나 인사이트를 접이식으로 표시
 */
export async function TertiaryZoneWrapper() {
  const user = await getCurrentUser();

  if (!user) {
    // 게스트 사용자는 Tertiary Zone 숨김
    return null;
  }

  // 30일 활동 캘린더용 날짜 범위
  const today = new Date();
  const activityCalendarStart = new Date(today);
  activityCalendarStart.setDate(today.getDate() - 29);
  activityCalendarStart.setHours(0, 0, 0, 0);

  // 병렬로 데이터 조회
  const [personaData, dailyRecordsByType] = await Promise.all([
    getPersonaDashboardData().catch(() => null),
    getDailyRecordsByType(user, activityCalendarStart, today).catch(() => ({})),
  ]);

  // 데이터가 없으면 숨김
  const hasActivityData = Object.keys(dailyRecordsByType || {}).length > 0;
  const persona = personaData?.persona;
  const readingStats = persona?.reading_stats as ReadingStats | null;
  const hasPersonaData = persona && readingStats;

  if (!hasActivityData && !hasPersonaData) {
    return null;
  }

  return (
    <TertiaryZoneClient
      dailyRecordsByType={dailyRecordsByType || {}}
      persona={persona ?? null}
      readingStats={readingStats ?? null}
    />
  );
}
