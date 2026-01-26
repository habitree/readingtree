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
        todayNotes={0}
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
    getContinueReadingBooks(user, 4).catch(() => []),
    getBonusMissions(user).catch(() => ({ missions: [], isUnlocked: false, motivationMessage: undefined })),
  ]);

  // 오늘 기록 수
  const todayNotes = streakAndTodayData.todayNotes;

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
      todayNotes={todayNotes}
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
 * 오늘의 미션 생성 (간소화: 핵심 미션 1개 + 조건부 보너스)
 * - 심리학적 원칙: SMART 목표 (구체적, 측정 가능)
 * - UX 원칙: 인지 부하 감소, 명확한 행동 유도
 */
function generateDailyMissions(
  hasReadToday: boolean,
  todayNotes: number,
  streak: number
) {
  const missions = [];

  // 핵심 미션: 오늘 기록 남기기 (통합된 단일 미션)
  const isCompleted = hasReadToday || todayNotes > 0;

  // 스트릭 기반 동기부여 메시지
  let description = "오늘의 독서 흔적을 남겨보세요";
  if (streak > 0 && !isCompleted) {
    description = `${streak}일 연속 기록을 이어가세요!`;
  } else if (isCompleted && streak > 0) {
    description = `${streak + 1}일 연속 기록 달성!`;
  } else if (isCompleted) {
    description = "오늘 기록을 남겼어요!";
  }

  missions.push({
    id: "daily_record",
    type: "note" as const,
    title: "오늘 기록 남기기",
    description,
    status: isCompleted ? "completed" as const : "pending" as const,
    reward: "+15",
    highlight: true, // 핵심 미션 강조 플래그
  });

  // 보너스 미션: 스트릭 7일 이상일 때만 표시 (선택적 확장)
  if (streak >= 7) {
    missions.push({
      id: "streak_bonus",
      type: "streak" as const,
      title: `${streak}일 연속 기록 보너스`,
      description: "꾸준한 독서 습관에 추가 보상!",
      status: isCompleted ? "completed" as const : "pending" as const,
      reward: "+10",
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
