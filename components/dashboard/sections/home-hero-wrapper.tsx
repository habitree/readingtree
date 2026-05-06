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

  // ── 그룹1: 핵심 데이터 (사용자에게 즉시 보여줘야 하는 정보) ──
  const primaryResults = await Promise.allSettled([
    getCachedStreakAndTodayData(user.id),
    getContinueReadingBooks(user, 8),
    getCurrentBookProgress(user),
    getCachedPointsDashboardData(user),
    getCachedCheckHasFirstNote(),
    getUserReadingTimeStats(),
    getActiveSession(user),
  ]);

  const streakAndTodayData = extractSettled(primaryResults[0], { streak: 0, todayNotes: 0 });
  const continueReadingBooks = extractSettled(primaryResults[1], []);
  const currentBookProgress = extractSettled(primaryResults[2], null);
  const pointsData = extractSettled(primaryResults[3], null);
  const firstNoteData = extractSettled(primaryResults[4], { hasFirstNote: true });
  const readingTimeData = extractSettled(primaryResults[5], { totalSeconds: 0, sessionCount: 0, averageSeconds: 0, todaySeconds: 0, thisWeekSeconds: 0 });
  const activeSession = extractSettled(primaryResults[6], null);

  // ── 그룹2: 부차 데이터 (스크롤 아래이거나 부가 정보) ──
  // 핵심 데이터가 준비된 상태에서 병렬 로드
  const secondaryResults = await Promise.allSettled([
    getCachedPersonaDashboardData(),
    getCachedReadingStats(user),
    getWeeklyProgress(user),
    getDailyRecordsByType(user, activityCalendarStart, new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)),
    getFreeNoteStats(user),
  ]);

  const personaData = extractSettled(secondaryResults[0], null);
  const readingStats = extractSettled(secondaryResults[1], null);
  const weeklyProgress = extractSettled(secondaryResults[2], null);
  const dailyRecordsByType = extractSettled(secondaryResults[3], {});
  const freeNoteStats = extractSettled(secondaryResults[4], { totalCount: 0, todayCount: 0 });

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
