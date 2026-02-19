import {
  getCachedCurrentUser,
  getCachedPersonaDashboardData,
  getCachedReadingStats,
  getCachedStreakAndTodayData,
  getCachedPointsDashboardData,
  getCachedCheckHasFirstNote,
} from "@/lib/cached";
import {
  getWeeklyProgress,
  getDailyRecordsByType,
  getCurrentBookProgress,
} from "@/app/actions/stats";

/** KST 기준 현재 날짜의 자정(00:00:00) UTC Date 반환 */
function getKSTToday(): Date {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - 9 * 60 * 60 * 1000);
}
import { getContinueReadingBooks } from "@/app/actions/books";
import {
  getSampleDashboardStats,
  getSampleContinueReadingBooks,
} from "@/app/actions/sample";
import { HomeHeroSection } from "./home-hero-section";

/**
 * 홈 히어로 섹션 서버 래퍼
 * 페르소나 데이터와 사용자 정보를 조회하여 클라이언트 컴포넌트에 전달
 */
export async function HomeHeroWrapper() {
  const user = await getCachedCurrentUser();

  if (!user) {
    // 게스트 사용자: 샘플 데이터 조회
    const [sampleStats, sampleBooks] = await Promise.all([
      getSampleDashboardStats().catch(() => ({ streak: 0, todayNotes: 0, weeklyNotes: 0 })),
      getSampleContinueReadingBooks(6).catch(() => []),
    ]);

    return (
      <HomeHeroSection
        userName={null}
        persona={null}
        streak={sampleStats.streak}
        todayNotes={sampleStats.todayNotes}
        weeklyNotes={sampleStats.weeklyNotes}
        continueReadingBooks={sampleBooks}
        isGuest={true}
      />
    );
  }

  // 30일 활동 캘린더용 날짜 범위 (KST 기준)
  const today = getKSTToday();
  const activityCalendarStart = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);

  // 병렬로 데이터 조회
  const [
    personaData,
    readingStats,
    streakAndTodayData,
    continueReadingBooks,
    weeklyProgress,
    dailyRecordsByType,
    currentBookProgress,
    pointsData,
    firstNoteData,
  ] = await Promise.all([
    getCachedPersonaDashboardData().catch(() => null),
    getCachedReadingStats(user).catch(() => null),
    getCachedStreakAndTodayData(user.id).catch(() => ({ streak: 0, todayNotes: 0 })),
    // 홈 화면 진행 카드: 최대 6권까지 표시
    getContinueReadingBooks(user, 6).catch(() => []),
    getWeeklyProgress(user).catch(() => null),
    getDailyRecordsByType(user, activityCalendarStart, new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)).catch(() => ({})),
    getCurrentBookProgress(user).catch(() => null),
    getCachedPointsDashboardData(user).catch(() => null),
    getCachedCheckHasFirstNote().catch(() => ({ hasFirstNote: true })),
  ]);

  return (
    <HomeHeroSection
      userName={user.user_metadata?.name || user.email?.split("@")[0]}
      persona={personaData?.persona ?? null}
      streak={streakAndTodayData.streak}
      todayNotes={streakAndTodayData.todayNotes}
      weeklyNotes={readingStats?.thisWeek?.notes ?? 0}
      continueReadingBooks={continueReadingBooks || []}
      weeklyProgress={weeklyProgress}
      dailyRecordsByType={dailyRecordsByType}
      currentBookProgress={currentBookProgress}
      userLevel={pointsData?.currentLevel?.level ?? 1}
      levelTitle={pointsData?.currentLevel?.title}
      totalPoints={pointsData?.userPoints?.total_points ?? 0}
      hasFirstNote={firstNoteData.hasFirstNote}
    />
  );
}
