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
import { getContinueReadingBooks, getPopularBooks } from "@/app/actions/books";
import { getUserReadingTimeStats } from "@/app/actions/progress";
import { getActiveSession } from "@/app/actions/sessions";
import { getFreeNoteStats } from "@/app/actions/notes";
import { generateDemoWeeklyProgress } from "@/lib/demo-calendar-data";
import {
  getSampleDashboardStats,
  getSampleContinueReadingBooks,
  getSamplePointsDashboardData,
} from "@/app/actions/sample";
import { HomeHeroSection } from "./home-hero-section";
import { PopularBooksWidget } from "./popular-books-widget";

/** Promise.allSettled 결과에서 값을 추출하는 헬퍼 */
function extractSettled<T>(
  result: PromiseSettledResult<T>,
  fallback: T,
): T {
  return result.status === "fulfilled" ? result.value : fallback;
}

/**
 * 홈 히어로 섹션 서버 래퍼
 * 페르소나 데이터와 사용자 정보를 조회하여 클라이언트 컴포넌트에 전달
 *
 * 성능 최적화:
 * - 핵심 데이터(그룹1)를 먼저 Promise.allSettled로 로드
 * - 부차 데이터(그룹2)를 이어서 Promise.allSettled로 로드
 * - 개별 쿼리 실패 시 fallback 기본값으로 대체 (전체 블로킹 방지)
 */
export async function HomeHeroWrapper() {
  const user = await getCachedCurrentUser();

  if (!user) {
    // 게스트 사용자: 샘플 데이터 조회 (관리자 데이터와 동일하게 표시)
    const guestResults = await Promise.allSettled([
      getSampleDashboardStats(),
      getSampleContinueReadingBooks(8),
      getSamplePointsDashboardData(),
    ]);

    const sampleStats = extractSettled(guestResults[0], { streak: 0, todayNotes: 0, weeklyNotes: 0 });
    const sampleBooks = extractSettled(guestResults[1], []);
    const samplePoints = extractSettled(guestResults[2], { userLevel: 1, levelTitle: undefined as string | undefined, totalPoints: 0 });

    return (
      <HomeHeroSection
        userName={null}
        persona={null}
        streak={sampleStats.streak}
        todayNotes={sampleStats.todayNotes}
        weeklyNotes={sampleStats.weeklyNotes}
        continueReadingBooks={sampleBooks}
        isGuest={true}
        userLevel={samplePoints.userLevel}
        levelTitle={samplePoints.levelTitle}
        totalPoints={samplePoints.totalPoints}
      />
    );
  }

  // 30일 활동 캘린더용 날짜 범위 (KST 기준)
  const today = getKSTToday();
  const activityCalendarStart = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);

  // ── 단일 웨이브: 히어로에 필요한 모든 데이터 병렬 로드 ──
  // 기존엔 핵심(그룹1)을 전부 await한 뒤 부차(그룹2)를 시작해 DB 라운드트립이 2-웨이브로
  // 직렬화됐으나, 두 그룹 간 데이터 의존성이 없어 단일 Promise.allSettled로 병합한다.
  // (popularBooks만 continueReadingBooks 의존이므로 아래 후속 웨이브 유지)
  const results = await Promise.allSettled([
    getCachedStreakAndTodayData(user.id),
    getContinueReadingBooks(user, 8),
    getCurrentBookProgress(user),
    getCachedPointsDashboardData(user),
    getCachedCheckHasFirstNote(),
    getUserReadingTimeStats(),
    getActiveSession(user),
    getCachedPersonaDashboardData(),
    getCachedReadingStats(user),
    getWeeklyProgress(user),
    getDailyRecordsByType(user, activityCalendarStart, new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)),
    getFreeNoteStats(user),
  ]);

  const streakAndTodayData = extractSettled(results[0], { streak: 0, todayNotes: 0 });
  const continueReadingBooks = extractSettled(results[1], []);
  const currentBookProgress = extractSettled(results[2], null);
  const pointsData = extractSettled(results[3], null);
  const firstNoteData = extractSettled(results[4], { hasFirstNote: true });
  const readingTimeData = extractSettled(results[5], { totalSeconds: 0, sessionCount: 0, averageSeconds: 0, todaySeconds: 0, thisWeekSeconds: 0 });
  const activeSession = extractSettled(results[6], null);
  const personaData = extractSettled(results[7], null);
  const readingStats = extractSettled(results[8], null);
  const weeklyProgress = extractSettled(results[9], null);
  const dailyRecordsByType = extractSettled(results[10], {});
  const freeNoteStats = extractSettled(results[11], { totalCount: 0, todayCount: 0 });

  // 책 0권 사용자에게 인기 도서 위젯 표시
  const hasNoBooks = (!continueReadingBooks || continueReadingBooks.length === 0);
  const popularBooksResult = hasNoBooks
    ? await Promise.allSettled([getPopularBooks(10)])
    : [{ status: "fulfilled" as const, value: [] as Awaited<ReturnType<typeof getPopularBooks>> }];
  const popularBooks = extractSettled(popularBooksResult[0], []);

  // 첫 사용자(책 없음 + 주간 데이터 없음)에게 데모 주간 통계 제공
  const effectiveWeeklyProgress = weeklyProgress ?? (hasNoBooks ? generateDemoWeeklyProgress() : null);
  const isFirstUserDemo = hasNoBooks && !weeklyProgress;

  return (
    <>
      <HomeHeroSection
        userName={user.user_metadata?.name || user.email?.split("@")[0]}
        persona={personaData?.persona ?? null}
        streak={isFirstUserDemo ? 3 : streakAndTodayData.streak}
        todayNotes={streakAndTodayData.todayNotes}
        weeklyNotes={readingStats?.thisWeek?.notes ?? 0}
        continueReadingBooks={continueReadingBooks || []}
        weeklyProgress={effectiveWeeklyProgress}
        dailyRecordsByType={dailyRecordsByType}
        currentBookProgress={currentBookProgress}
        userLevel={pointsData?.currentLevel?.level ?? 1}
        levelTitle={pointsData?.currentLevel?.title}
        totalPoints={pointsData?.userPoints?.total_points ?? 0}
        hasFirstNote={firstNoteData.hasFirstNote}
        freeNoteStats={freeNoteStats}
        isFirstUserDemo={isFirstUserDemo}
        todayReadingSeconds={readingTimeData.todaySeconds}
        activeSessionId={activeSession?.id ?? null}
        activeSessionUserBookId={activeSession?.user_book_id ?? null}
      />
      {hasNoBooks && popularBooks.length > 0 && (
        <PopularBooksWidget books={popularBooks} />
      )}
    </>
  );
}
