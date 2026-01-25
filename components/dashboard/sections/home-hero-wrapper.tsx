import { getCurrentUser } from "@/app/actions/auth";
import { getPersonaDashboardData } from "@/app/actions/persona";
import { getReadingStats } from "@/app/actions/stats";
import { getContinueReadingBooks } from "@/app/actions/books";
import { getBonusMissions } from "@/app/actions/points";
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
        todayGoalProgress={0}
        weeklyNotes={0}
        continueReadingBooks={[]}
        dailyMissions={[]}
      />
    );
  }

  // 병렬로 데이터 조회
  const [personaData, readingStats, streakAndTodayData, continueReadingBooks, bonusMissionsData] = await Promise.all([
    getPersonaDashboardData().catch(() => null),
    getReadingStats(user).catch(() => null),
    getStreakAndTodayData(user.id).catch(() => ({ streak: 0, todayNotes: 0, hasReadToday: false })),
    getContinueReadingBooks(user, 3).catch(() => []),
    getBonusMissions(user).catch(() => ({ missions: [], isUnlocked: false, motivationMessage: undefined })),
  ]);

  // 오늘 목표 달성률 계산 (간단한 예: 목표 1개 기록 기준)
  const todayNotes = streakAndTodayData.todayNotes;
  const dailyGoal = 1; // 기본 일일 목표
  const todayGoalProgress = Math.min((todayNotes / dailyGoal) * 100, 100);

  // 오늘의 미션 생성
  const dailyMissions = generateDailyMissions(
    streakAndTodayData.hasReadToday,
    todayNotes,
    streakAndTodayData.streak
  );

  return (
    <HomeHeroSection
      userName={user.user_metadata?.name || user.email?.split("@")[0]}
      persona={personaData?.persona ?? null}
      streak={streakAndTodayData.streak}
      todayGoalProgress={todayGoalProgress}
      weeklyNotes={readingStats?.thisWeek?.notes ?? 0}
      continueReadingBooks={continueReadingBooks || []}
      dailyMissions={dailyMissions}
      bonusMissions={bonusMissionsData.missions}
      isBonusUnlocked={bonusMissionsData.isUnlocked}
      bonusMotivationMessage={bonusMissionsData.motivationMessage}
    />
  );
}

/**
 * 오늘의 미션 생성
 */
function generateDailyMissions(
  hasReadToday: boolean,
  todayNotes: number,
  streak: number
) {
  const missions = [];

  // 미션 1: 오늘 첫 독서 기록
  missions.push({
    id: "first_read",
    type: "first_read" as const,
    title: "오늘 첫 독서 기록하기",
    description: "책을 열고 오늘의 첫 기록을 남겨보세요",
    status: hasReadToday || todayNotes > 0 ? "completed" as const : "pending" as const,
    reward: "+10",
  });

  // 미션 2: 메모 작성
  missions.push({
    id: "note",
    type: "note" as const,
    title: "메모 1개 작성하기",
    description: "인상 깊은 구절이나 생각을 기록해보세요",
    status: todayNotes >= 1 ? "completed" as const : "pending" as const,
    reward: "+15",
    progress: todayNotes < 1 ? { current: todayNotes, target: 1 } : undefined,
  });

  // 미션 3: 스트릭 유지 (조건부)
  if (streak >= 3) {
    missions.push({
      id: "streak",
      type: "streak" as const,
      title: `${streak}일 연속 기록 유지`,
      description: "오늘도 기록을 남겨 연속 기록을 이어가세요",
      status: todayNotes > 0 ? "completed" as const : "pending" as const,
      reward: "+20",
    });
  }

  return missions;
}

/**
 * 연속 기록 일수 및 오늘 기록 수 조회
 */
async function getStreakAndTodayData(userId: string): Promise<{ streak: number; todayNotes: number; hasReadToday: boolean }> {
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
      return { streak: 0, todayNotes: 0, hasReadToday: false };
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

    return { streak, todayNotes, hasReadToday: todayNotes > 0 };
  } catch (error) {
    console.error("스트릭 조회 오류:", error);
    return { streak: 0, todayNotes: 0, hasReadToday: false };
  }
}
