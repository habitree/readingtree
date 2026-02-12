import { getCachedCurrentUser, getCachedPersonaDashboardData } from "@/lib/cached";
import {
  getReadingStats,
  getWeeklyProgress,
  getDailyRecordsByType,
  getCurrentBookProgress,
} from "@/app/actions/stats";
import { getContinueReadingBooks } from "@/app/actions/books";
import {
  getSampleDashboardStats,
  getSampleContinueReadingBooks,
} from "@/app/actions/sample";
import { HomeHeroSection } from "./home-hero-section";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
  ] = await Promise.all([
    getCachedPersonaDashboardData().catch(() => null),
    getReadingStats(user).catch(() => null),
    getStreakAndTodayData(user.id).catch(() => ({ streak: 0, todayNotes: 0 })),
    // 홈 화면 진행 카드: 최대 6권까지 표시
    getContinueReadingBooks(user, 6).catch(() => []),
    getWeeklyProgress(user).catch(() => null),
    getDailyRecordsByType(user, activityCalendarStart, new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)).catch(() => ({})),
    getCurrentBookProgress(user).catch(() => null),
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
    />
  );
}

/** UTC Date를 KST(UTC+9) 기준 YYYY-MM-DD 문자열로 변환 */
function toKSTDateKey(date: Date): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, "0")}-${String(kst.getUTCDate()).padStart(2, "0")}`;
}

/** KST 기준 현재 날짜의 자정(00:00:00) UTC Date 반환 */
function getKSTToday(): Date {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - 9 * 60 * 60 * 1000);
}

/**
 * 연속 기록 일수 및 오늘 기록 수 조회 (KST 기준)
 */
async function getStreakAndTodayData(userId: string): Promise<{ streak: number; todayNotes: number }> {
  try {
    const supabase = await createServerSupabaseClient();

    // KST 기준 오늘 자정
    const kstTodayMidnight = getKSTToday();
    const kstTodayKey = toKSTDateKey(kstTodayMidnight);

    // 최근 30일간의 기록 날짜 조회
    const thirtyDaysAgo = new Date(kstTodayMidnight.getTime() - 30 * 24 * 60 * 60 * 1000);

    const { data: notes, error } = await supabase
      .from("notes")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (error || !notes || notes.length === 0) {
      return { streak: 0, todayNotes: 0 };
    }

    // 날짜별로 그룹화 및 오늘 기록 수 계산 (KST 기준)
    const dateCountMap = new Map<string, number>();
    let todayNotes = 0;

    notes.forEach((note) => {
      const dateKey = toKSTDateKey(new Date(note.created_at));

      if (dateKey === kstTodayKey) {
        todayNotes++;
      }

      dateCountMap.set(dateKey, (dateCountMap.get(dateKey) || 0) + 1);
    });

    // 연속 일수 계산 (KST 기준)
    let streak = 0;

    for (let i = 0; i < 30; i++) {
      const checkTime = kstTodayMidnight.getTime() - i * 24 * 60 * 60 * 1000;
      const dateKey = toKSTDateKey(new Date(checkTime));

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
