import { getCurrentUser } from "@/app/actions/auth";
import { getPersonaDashboardData } from "@/app/actions/persona";
import {
  getReadingStats,
  getWeeklyProgress,
  getDailyRecordsByType,
  getCurrentBookProgress,
} from "@/app/actions/stats";
import { getContinueReadingBooks } from "@/app/actions/books";
import { getUserPoints } from "@/app/actions/points";
import { HomeHeroSection } from "./home-hero-section";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * 홈 히어로 섹션 서버 래퍼
 * 페르소나 데이터와 사용자 정보를 조회하여 클라이언트 컴포넌트에 전달
 */
export async function HomeHeroWrapper() {
  const user = await getCurrentUser();

  if (!user) {
    // 게스트 사용자는 기본 히어로 표시
    return (
      <HomeHeroSection
        userName={null}
        persona={null}
        streak={0}
        todayNotes={0}
        weeklyNotes={0}
        continueReadingBooks={[]}
        level={1}
      />
    );
  }

  // 30일 활동 캘린더용 날짜 범위
  const today = new Date();
  const activityCalendarStart = new Date(today);
  activityCalendarStart.setDate(today.getDate() - 29);
  activityCalendarStart.setHours(0, 0, 0, 0);

  // 병렬로 데이터 조회
  const [
    personaData,
    readingStats,
    streakAndTodayData,
    continueReadingBooks,
    weeklyProgress,
    dailyRecordsByType,
    currentBookProgress,
    userPoints,
  ] = await Promise.all([
    getPersonaDashboardData().catch(() => null),
    getReadingStats(user).catch(() => null),
    getStreakAndTodayData(user.id).catch(() => ({ streak: 0, todayNotes: 0 })),
    getContinueReadingBooks(user, 4).catch(() => []),
    getWeeklyProgress(user).catch(() => null),
    getDailyRecordsByType(user, activityCalendarStart, today).catch(() => ({})),
    getCurrentBookProgress(user).catch(() => null),
    getUserPoints(user).catch(() => null),
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
      level={userPoints?.current_level || 1}
    />
  );
}

/**
 * 연속 기록 일수 및 오늘 기록 수 조회
 */
async function getStreakAndTodayData(userId: string): Promise<{ streak: number; todayNotes: number }> {
  try {
    const supabase = await createServerSupabaseClient();

    // 최근 30일간의 기록 날짜 조회
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: notes, error } = await supabase
      .from("notes")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (error || !notes || notes.length === 0) {
      return { streak: 0, todayNotes: 0 };
    }

    // 날짜별로 그룹화 및 오늘 기록 수 계산
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

    const dateCountMap = new Map<string, number>();
    let todayNotes = 0;

    notes.forEach((note) => {
      const date = new Date(note.created_at);
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

      if (dateKey === todayKey) {
        todayNotes++;
      }

      dateCountMap.set(dateKey, (dateCountMap.get(dateKey) || 0) + 1);
    });

    // 연속 일수 계산
    let streak = 0;

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;

      if (dateCountMap.has(dateKey)) {
        streak++;
      } else if (i > 0) {
        // 오늘은 아직 기록 안 해도 어제까지 연속이면 유지
        break;
      }
    }

    return { streak, todayNotes };
  } catch (error) {
    console.error("스트릭 조회 오류:", error);
    return { streak: 0, todayNotes: 0 };
  }
}
