"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import type {
  PointActionType,
  UserPoints,
  PointTransaction,
  PointLevel,
  EarnPointsResult,
  PointsDashboardData,
  MissionWithDetails,
  DailyMissionType,
  Achievement,
  BonusMission,
  BonusMissionType,
  POINT_ACTION_DEFAULTS,
  LEVEL_DEFAULTS,
} from "@/types/points";
import { BONUS_MISSION_DEFINITIONS } from "@/types/points";

/**
 * 사용자 포인트 정보 조회
 */
export async function getUserPoints(user?: User | null): Promise<UserPoints | null> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const { data: { user: fetchedUser } } = await supabase.auth.getUser();
    if (!fetchedUser) return null;
    currentUser = fetchedUser;
  }

  const { data, error } = await supabase
    .from("user_points")
    .select("*")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (error) {
    console.error("포인트 조회 오류:", error);
    return null;
  }

  // 포인트 정보가 없으면 기본값 생성
  if (!data) {
    const { data: newPoints, error: createError } = await supabase
      .from("user_points")
      .insert({
        user_id: currentUser.id,
        total_points: 0,
        lifetime_points: 0,
        current_level: 1,
        current_streak: 0,
        longest_streak: 0,
      })
      .select()
      .single();

    if (createError) {
      console.error("포인트 생성 오류:", createError);
      return null;
    }

    return newPoints;
  }

  return data;
}

/**
 * 포인트 적립
 */
export async function earnPoints(
  actionType: PointActionType,
  options?: {
    referenceId?: string;
    referenceType?: string;
    description?: string;
    metadata?: Record<string, any>;
    user?: User | null;
  }
): Promise<EarnPointsResult> {
  const supabase = await createServerSupabaseClient();

  let currentUser = options?.user;
  if (!currentUser) {
    const { data: { user: fetchedUser } } = await supabase.auth.getUser();
    if (!fetchedUser) {
      return { success: false, points_earned: 0, final_points: 0, multiplier_applied: 1, new_total: 0, error: "로그인이 필요합니다." };
    }
    currentUser = fetchedUser;
  }

  try {
    // 1. 액션 설정 조회
    const { data: actionConfig } = await supabase
      .from("point_action_configs")
      .select("*")
      .eq("action_type", actionType)
      .eq("is_active", true)
      .single();

    if (!actionConfig) {
      return { success: false, points_earned: 0, final_points: 0, multiplier_applied: 1, new_total: 0, error: "유효하지 않은 액션입니다." };
    }

    // 2. 일일 제한 확인
    if (actionConfig.daily_limit) {
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase
        .from("point_transactions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", currentUser.id)
        .eq("action_type", actionType)
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`);

      if (count && count >= actionConfig.daily_limit) {
        return { success: false, points_earned: 0, final_points: 0, multiplier_applied: 1, new_total: 0, error: "일일 획득 한도에 도달했습니다." };
      }
    }

    // 3. 반복 불가 액션인 경우 이미 획득했는지 확인
    if (!actionConfig.is_repeatable) {
      const { data: existingTransaction } = await supabase
        .from("point_transactions")
        .select("id")
        .eq("user_id", currentUser.id)
        .eq("action_type", actionType)
        .maybeSingle();

      if (existingTransaction) {
        return { success: false, points_earned: 0, final_points: 0, multiplier_applied: 1, new_total: 0, error: "이미 획득한 보상입니다." };
      }
    }

    // 4. 사용자 포인트 정보 조회/생성
    let userPoints = await getUserPoints(currentUser);
    if (!userPoints) {
      // 새 사용자 포인트 레코드 생성
      const { data: newPoints, error: createError } = await supabase
        .from("user_points")
        .insert({
          user_id: currentUser.id,
          total_points: 0,
          lifetime_points: 0,
          current_level: 1,
          current_streak: 0,
          longest_streak: 0,
        })
        .select()
        .single();

      if (createError || !newPoints) {
        return { success: false, points_earned: 0, final_points: 0, multiplier_applied: 1, new_total: 0, error: "포인트 초기화 실패" };
      }
      userPoints = newPoints as UserPoints;
    }

    // 5. 배율 계산 (스트릭 보너스 등)
    const multiplier = userPoints!.streak_bonus_multiplier || 1.0;
    const basePoints = actionConfig.base_points;
    const finalPoints = Math.round(basePoints * multiplier);

    // 6. 새 잔액 계산
    const newTotal = userPoints!.total_points + finalPoints;

    // 7. 거래 내역 생성
    const { error: transactionError } = await supabase
      .from("point_transactions")
      .insert({
        user_id: currentUser.id,
        action_type: actionType,
        points: basePoints,
        multiplier: multiplier,
        final_points: finalPoints,
        description: options?.description || actionConfig.description,
        reference_id: options?.referenceId,
        reference_type: options?.referenceType,
        balance_after: newTotal,
        metadata: options?.metadata,
      });

    if (transactionError) {
      console.error("거래 내역 생성 오류:", transactionError);
      return { success: false, points_earned: 0, final_points: 0, multiplier_applied: 1, new_total: 0, error: "포인트 적립 실패" };
    }

    // 8. 레벨 업 확인
    const { data: levels } = await supabase
      .from("point_levels")
      .select("*")
      .order("required_points", { ascending: true });

    const newLifetimePoints = userPoints!.lifetime_points + finalPoints;
    let newLevel = userPoints!.current_level;
    let levelUp = false;

    if (levels) {
      for (const level of levels) {
        if (newLifetimePoints >= level.required_points) {
          if (level.level > newLevel) {
            newLevel = level.level;
            levelUp = true;
          }
        }
      }
    }

    // 9. 업적 확인
    const achievements: Achievement[] = [];

    // 첫 번째 특별 보상 확인
    if (actionType === "note_create") {
      const { count: noteCount } = await supabase
        .from("point_transactions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", currentUser.id)
        .eq("action_type", "note_create");

      if (noteCount === 1) {
        // 첫 번째 노트 보너스
        await earnPoints("first_note", { user: currentUser, description: "첫 번째 노트 작성 보너스" });
        achievements.push({
          type: "first_time",
          title: "첫 기록!",
          description: "첫 번째 노트를 작성했습니다",
          points_bonus: 20,
          icon: "Pencil",
        });
      }
    }

    if (actionType === "book_add") {
      const { count: bookCount } = await supabase
        .from("point_transactions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", currentUser.id)
        .eq("action_type", "book_add");

      if (bookCount === 1) {
        await earnPoints("first_book", { user: currentUser, description: "첫 번째 책 등록 보너스" });
        achievements.push({
          type: "first_time",
          title: "독서 시작!",
          description: "첫 번째 책을 등록했습니다",
          points_bonus: 30,
          icon: "BookOpen",
        });
      }
    }

    // 레벨업 업적
    if (levelUp) {
      const levelInfo = levels?.find((l) => l.level === newLevel);
      achievements.push({
        type: "level_up",
        title: `레벨 ${newLevel} 달성!`,
        description: levelInfo?.title || "새로운 레벨에 도달했습니다",
        points_bonus: 0,
        icon: levelInfo?.badge_icon || "Star",
      });
    }

    revalidatePath("/");
    revalidatePath("/profile");

    return {
      success: true,
      points_earned: basePoints,
      final_points: finalPoints,
      multiplier_applied: multiplier,
      new_total: newTotal,
      new_level: levelUp ? newLevel : undefined,
      level_up: levelUp,
      achievements: achievements.length > 0 ? achievements : undefined,
    };
  } catch (error) {
    console.error("포인트 적립 오류:", error);
    return { success: false, points_earned: 0, final_points: 0, multiplier_applied: 1, new_total: 0, error: "알 수 없는 오류가 발생했습니다." };
  }
}

/**
 * 스트릭 업데이트 및 보너스 적립
 */
export async function updateStreak(user?: User | null): Promise<{
  streak: number;
  isNewDay: boolean;
  streakBonus?: EarnPointsResult;
}> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const { data: { user: fetchedUser } } = await supabase.auth.getUser();
    if (!fetchedUser) {
      return { streak: 0, isNewDay: false };
    }
    currentUser = fetchedUser;
  }

  const userPoints = await getUserPoints(currentUser);
  if (!userPoints) {
    return { streak: 0, isNewDay: false };
  }

  const today = new Date().toISOString().split("T")[0];
  const lastActivity = userPoints.last_activity_date;

  // 이미 오늘 활동한 경우
  if (lastActivity === today) {
    return { streak: userPoints.current_streak, isNewDay: false };
  }

  // 어제 활동했는지 확인
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let newStreak: number;
  let streakBonus: EarnPointsResult | undefined;

  if (lastActivity === yesterdayStr) {
    // 연속 기록 유지
    newStreak = userPoints.current_streak + 1;
  } else if (!lastActivity) {
    // 첫 활동
    newStreak = 1;
  } else {
    // 연속 기록 끊김
    newStreak = 1;
  }

  // 스트릭 업데이트
  const longestStreak = Math.max(userPoints.longest_streak, newStreak);

  await supabase
    .from("user_points")
    .update({
      last_activity_date: today,
      current_streak: newStreak,
      longest_streak: longestStreak,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", currentUser.id);

  // 스트릭 마일스톤 보너스 확인
  const STREAK_MILESTONES: { days: number; action: PointActionType }[] = [
    { days: 3, action: "streak_3_days" },
    { days: 7, action: "streak_7_days" },
    { days: 14, action: "streak_14_days" },
    { days: 30, action: "streak_30_days" },
    { days: 100, action: "streak_100_days" },
    { days: 365, action: "streak_365_days" },
  ];

  for (const milestone of STREAK_MILESTONES) {
    if (newStreak === milestone.days) {
      streakBonus = await earnPoints(milestone.action, {
        user: currentUser,
        description: `${milestone.days}일 연속 달성 보너스`,
      });
      break;
    }
  }

  // 오늘 첫 활동 보너스
  const dailyBonus = await earnPoints("daily_first_activity", {
    user: currentUser,
    description: "오늘 첫 활동 보너스",
  });

  return {
    streak: newStreak,
    isNewDay: true,
    streakBonus: streakBonus || dailyBonus,
  };
}

/**
 * 포인트 대시보드 데이터 조회
 */
export async function getPointsDashboardData(user?: User | null): Promise<PointsDashboardData> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const { data: { user: fetchedUser } } = await supabase.auth.getUser();
    currentUser = fetchedUser;
  }

  if (!currentUser) {
    return {
      userPoints: null,
      currentLevel: null,
      nextLevel: null,
      progressToNextLevel: 0,
      recentTransactions: [],
      todayEarned: 0,
      weeklyEarned: 0,
      monthlyEarned: 0,
    };
  }

  // 병렬로 데이터 조회
  const [userPoints, levels, recentTransactions, todayStats, weeklyStats, monthlyStats] = await Promise.all([
    getUserPoints(currentUser),

    supabase
      .from("point_levels")
      .select("*")
      .order("required_points", { ascending: true }),

    supabase
      .from("point_transactions")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })
      .limit(10),

    // 오늘 획득 포인트
    supabase
      .from("point_transactions")
      .select("final_points")
      .eq("user_id", currentUser.id)
      .gte("created_at", new Date().toISOString().split("T")[0] + "T00:00:00")
      .gt("final_points", 0),

    // 이번 주 획득 포인트
    (() => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return supabase
        .from("point_transactions")
        .select("final_points")
        .eq("user_id", currentUser.id)
        .gte("created_at", weekStart.toISOString())
        .gt("final_points", 0);
    })(),

    // 이번 달 획득 포인트
    (() => {
      const monthStart = new Date();
      monthStart.setDate(1);
      return supabase
        .from("point_transactions")
        .select("final_points")
        .eq("user_id", currentUser.id)
        .gte("created_at", monthStart.toISOString())
        .gt("final_points", 0);
    })(),
  ]);

  // 레벨 계산
  const sortedLevels = levels.data?.sort((a, b) => a.required_points - b.required_points) || [];
  const currentLevel = sortedLevels.find((l) => l.level === (userPoints?.current_level || 1)) || null;
  const nextLevel = sortedLevels.find((l) => l.level === (userPoints?.current_level || 1) + 1) || null;

  // 다음 레벨까지 진행률 계산
  let progressToNextLevel = 0;
  if (currentLevel && nextLevel && userPoints) {
    const currentRequired = currentLevel.required_points;
    const nextRequired = nextLevel.required_points;
    const pointsInLevel = userPoints.lifetime_points - currentRequired;
    const pointsNeeded = nextRequired - currentRequired;
    progressToNextLevel = Math.min(Math.round((pointsInLevel / pointsNeeded) * 100), 100);
  } else if (!nextLevel) {
    progressToNextLevel = 100; // 최고 레벨
  }

  // 포인트 합계 계산
  const todayEarned = todayStats.data?.reduce((sum, t) => sum + t.final_points, 0) || 0;
  const weeklyEarned = weeklyStats.data?.reduce((sum, t) => sum + t.final_points, 0) || 0;
  const monthlyEarned = monthlyStats.data?.reduce((sum, t) => sum + t.final_points, 0) || 0;

  return {
    userPoints,
    currentLevel,
    nextLevel,
    progressToNextLevel,
    recentTransactions: recentTransactions.data || [],
    todayEarned,
    weeklyEarned,
    monthlyEarned,
  };
}

/**
 * 오늘의 미션 조회
 */
export async function getDailyMissions(user?: User | null): Promise<MissionWithDetails[]> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const { data: { user: fetchedUser } } = await supabase.auth.getUser();
    if (!fetchedUser) return [];
    currentUser = fetchedUser;
  }

  const today = new Date().toISOString().split("T")[0];

  // 오늘의 미션 상태 조회
  const { data: existingMissions } = await supabase
    .from("daily_missions")
    .select("*")
    .eq("user_id", currentUser.id)
    .eq("date", today);

  // 오늘 활동 데이터 조회
  const [todayNotes, userPoints] = await Promise.all([
    supabase
      .from("notes")
      .select("id")
      .eq("user_id", currentUser.id)
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`),

    getUserPoints(currentUser),
  ]);

  const todayNotesCount = todayNotes.data?.length || 0;
  const currentStreak = userPoints?.current_streak || 0;

  // 미션 정의
  const missionDefinitions: {
    type: DailyMissionType;
    title: string;
    description: string;
    reward: number;
    icon: string;
    action_url: string;
    checkComplete: () => boolean;
    getProgress?: () => { current: number; target: number };
  }[] = [
    {
      type: "first_read",
      title: "오늘 첫 독서 기록",
      description: "책을 열고 오늘의 첫 기록을 남겨보세요",
      reward: 10,
      icon: "BookOpen",
      action_url: "/books",
      checkComplete: () => todayNotesCount > 0,
    },
    {
      type: "note",
      title: "메모 1개 작성하기",
      description: "인상 깊은 구절이나 생각을 기록해보세요",
      reward: 15,
      icon: "PenLine",
      action_url: "/notes/new",
      checkComplete: () => todayNotesCount >= 1,
      getProgress: () => ({ current: Math.min(todayNotesCount, 1), target: 1 }),
    },
  ];

  // 스트릭 미션 (3일 이상일 때만 표시)
  if (currentStreak >= 3) {
    missionDefinitions.push({
      type: "streak",
      title: `${currentStreak}일 연속 기록 유지`,
      description: "오늘도 기록을 남겨 연속 기록을 이어가세요",
      reward: 20,
      icon: "Flame",
      action_url: "/notes/new",
      checkComplete: () => todayNotesCount > 0,
    });
  }

  // 미션 상태 매핑
  const missions: MissionWithDetails[] = missionDefinitions.map((def) => {
    const existingMission = existingMissions?.find((m) => m.mission_type === def.type);
    const isComplete = existingMission?.status === "completed" || def.checkComplete();

    return {
      id: existingMission?.id || `${def.type}_${today}`,
      type: def.type,
      title: def.title,
      description: def.description,
      status: isComplete ? "completed" : "pending",
      reward: def.reward,
      icon: def.icon,
      progress: def.getProgress?.(),
      action_url: def.action_url,
      completed_at: existingMission?.completed_at,
    };
  });

  // 미션 상태 DB 동기화
  for (const mission of missions) {
    const existingMission = existingMissions?.find((m) => m.mission_type === mission.type);

    if (!existingMission) {
      // 미션 레코드 생성
      await supabase.from("daily_missions").insert({
        user_id: currentUser.id,
        date: today,
        mission_type: mission.type,
        status: mission.status,
        points_earned: mission.status === "completed" ? mission.reward : 0,
        completed_at: mission.status === "completed" ? new Date().toISOString() : null,
      });

      // 완료된 경우 포인트 적립
      if (mission.status === "completed") {
        await earnPoints("mission_complete", {
          user: currentUser,
          description: `일일 미션 완료: ${mission.title}`,
          referenceId: mission.id,
          referenceType: "mission",
        });
      }
    } else if (existingMission.status === "pending" && mission.status === "completed") {
      // 미션 완료 처리
      await supabase
        .from("daily_missions")
        .update({
          status: "completed",
          points_earned: mission.reward,
          completed_at: new Date().toISOString(),
        })
        .eq("id", existingMission.id);

      await earnPoints("mission_complete", {
        user: currentUser,
        description: `일일 미션 완료: ${mission.title}`,
        referenceId: existingMission.id,
        referenceType: "mission",
      });
    }
  }

  // 모든 미션 완료 보너스 확인
  const allComplete = missions.every((m) => m.status === "completed");
  if (allComplete && missions.length > 0) {
    const { data: allMissionBonus } = await supabase
      .from("point_transactions")
      .select("id")
      .eq("user_id", currentUser.id)
      .eq("action_type", "all_missions_complete")
      .gte("created_at", `${today}T00:00:00`)
      .maybeSingle();

    if (!allMissionBonus) {
      await earnPoints("all_missions_complete", {
        user: currentUser,
        description: "오늘의 모든 미션 완료 보너스",
      });
    }
  }

  return missions;
}

/**
 * 레벨별 사용자 수 분포 조회
 */
export async function getLevelDistribution(): Promise<{
  level: number;
  count: number;
  title: string;
  badge_icon: string;
}[]> {
  const supabase = await createServerSupabaseClient();

  // 레벨 정보 조회
  const { data: levels } = await supabase
    .from("point_levels")
    .select("level, title, badge_icon")
    .order("level", { ascending: false });

  if (!levels) return [];

  // 각 레벨별 사용자 수 조회
  const distribution = await Promise.all(
    levels.map(async (level) => {
      const { count } = await supabase
        .from("user_points")
        .select("*", { count: "exact", head: true })
        .eq("current_level", level.level);

      return {
        level: level.level,
        count: count || 0,
        title: level.title,
        badge_icon: level.badge_icon || "Star",
      };
    })
  );

  return distribution;
}

/**
 * 사용자 순위 조회
 */
export async function getUserRank(user?: User | null): Promise<{
  rank: number;
  totalUsers: number;
  percentile: number;
} | null> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const { data: { user: fetchedUser } } = await supabase.auth.getUser();
    if (!fetchedUser) return null;
    currentUser = fetchedUser;
  }

  // 사용자 포인트 조회
  const userPoints = await getUserPoints(currentUser);
  if (!userPoints) return null;

  // 자신보다 높은 포인트를 가진 사용자 수
  const { count: higherCount } = await supabase
    .from("user_points")
    .select("*", { count: "exact", head: true })
    .gt("lifetime_points", userPoints.lifetime_points);

  // 전체 사용자 수
  const { count: totalCount } = await supabase
    .from("user_points")
    .select("*", { count: "exact", head: true });

  const rank = (higherCount || 0) + 1;
  const totalUsers = totalCount || 1;
  const percentile = Math.round((1 - (rank - 1) / totalUsers) * 100);

  return {
    rank,
    totalUsers,
    percentile,
  };
}

/**
 * 포인트 거래 내역 조회
 */
export async function getPointTransactions(
  options?: {
    limit?: number;
    offset?: number;
    actionType?: PointActionType;
  },
  user?: User | null
): Promise<PointTransaction[]> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const { data: { user: fetchedUser } } = await supabase.auth.getUser();
    if (!fetchedUser) return [];
    currentUser = fetchedUser;
  }

  let query = supabase
    .from("point_transactions")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (options?.actionType) {
    query = query.eq("action_type", options.actionType);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error("거래 내역 조회 오류:", error);
    return [];
  }

  return data || [];
}

/**
 * 보너스 미션 조회 (모든 일일 미션 완료 시 해금)
 * 심리학적 동기부여 요소 포함:
 * - 가변 보상 (슬롯머신 효과)
 * - 희소성 (제한 시간)
 * - 사회적 증거 (완료한 사용자 수)
 */
export async function getBonusMissions(user?: User | null): Promise<{
  missions: BonusMission[];
  isUnlocked: boolean;
  motivationMessage?: string;
}> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const { data: { user: fetchedUser } } = await supabase.auth.getUser();
    if (!fetchedUser) return { missions: [], isUnlocked: false };
    currentUser = fetchedUser;
  }

  const today = new Date().toISOString().split("T")[0];

  // 오늘의 일일 미션 상태 확인
  const dailyMissions = await getDailyMissions(currentUser);
  const allDailyComplete = dailyMissions.every(m => m.status === "completed");

  // 일일 미션 모두 완료하지 않으면 보너스 미션 잠금
  if (!allDailyComplete) {
    const completedCount = dailyMissions.filter(m => m.status === "completed").length;
    const remaining = dailyMissions.length - completedCount;

    return {
      missions: [],
      isUnlocked: false,
      motivationMessage: remaining === 1
        ? "마지막 1개만 완료하면 보너스 미션이 열려요! 🎁"
        : `${remaining}개 미션만 더 완료하면 보너스 미션이 열려요!`,
    };
  }

  // 오늘 완료한 보너스 미션 조회
  const { data: completedBonusMissions } = await supabase
    .from("point_transactions")
    .select("reference_id, action_type")
    .eq("user_id", currentUser.id)
    .eq("reference_type", "bonus_mission")
    .gte("created_at", `${today}T00:00:00`);

  const completedTypes = new Set(
    completedBonusMissions?.map(m => m.reference_id) || []
  );

  // 오늘의 사용자 활동 데이터 조회 (보너스 미션 진행률 체크용)
  const { data: todayNotes } = await supabase
    .from("notes")
    .select("id, quote_content, memo_content, image_url, is_public")
    .eq("user_id", currentUser.id)
    .gte("created_at", `${today}T00:00:00`);

  const notesCount = todayNotes?.length || 0;

  // 오늘 보너스 미션 완료자 수 (사회적 증거)
  const { count: todayCompletedUsers } = await supabase
    .from("point_transactions")
    .select("user_id", { count: "exact", head: true })
    .eq("reference_type", "bonus_mission")
    .gte("created_at", `${today}T00:00:00`);

  // 보너스 미션 2-3개 랜덤 선택 (매일 다른 조합)
  const seed = new Date().getDate() + currentUser.id.charCodeAt(0);
  const shuffled = [...BONUS_MISSION_DEFINITIONS].sort((a, b) => {
    const hashA = (seed * a.type.length) % 100;
    const hashB = (seed * b.type.length) % 100;
    return hashA - hashB;
  });
  const selectedDefinitions = shuffled.slice(0, 3);

  // 보너스 미션 생성
  const bonusMissions: BonusMission[] = selectedDefinitions.map((def, index) => {
    const isCompleted = completedTypes.has(def.type);
    const now = new Date();

    // 제한 시간 계산 (희소성)
    let expiresAt: string | undefined;
    if (def.durationMinutes && !isCompleted) {
      const expires = new Date(now.getTime() + def.durationMinutes * 60 * 1000);
      // 오늘 자정까지만
      const midnight = new Date(now);
      midnight.setHours(23, 59, 59, 999);
      expiresAt = (expires < midnight ? expires : midnight).toISOString();
    }

    // 요구사항 계산
    let requirement: BonusMission["requirement"];
    if (def.type === "extra_note") {
      requirement = { type: "notes", target: notesCount + 1, current: notesCount };
    } else if (def.type === "deep_reading") {
      const longMemoCount = todayNotes?.filter(n =>
        (n.memo_content?.length || 0) >= 100
      ).length || 0;
      requirement = { type: "long_memo", target: 1, current: longMemoCount };
    } else if (def.type === "photo_capture") {
      const photoCount = todayNotes?.filter(n => n.image_url).length || 0;
      requirement = { type: "photo", target: 1, current: photoCount };
    } else if (def.type === "share_wisdom") {
      const publicCount = todayNotes?.filter(n => n.is_public).length || 0;
      requirement = { type: "public_note", target: 1, current: publicCount };
    }

    return {
      id: `bonus_${def.type}_${today}`,
      type: def.type,
      title: def.title,
      description: def.description,
      status: isCompleted
        ? "completed"
        : requirement && requirement.current >= requirement.target
          ? "completed"
          : "available",
      reward: {
        min: def.reward.min,
        max: def.reward.max,
      },
      icon: def.icon,
      action_url: def.action_url,
      expires_at: expiresAt,
      difficulty: def.difficulty,
      rarity: def.rarity,
      requirement,
      completedBy: todayCompletedUsers || 0,
    };
  });

  return {
    missions: bonusMissions,
    isUnlocked: true,
    motivationMessage: "🎉 보너스 미션이 열렸어요! 추가 보상을 획득하세요!",
  };
}

/**
 * 보너스 미션 완료 처리
 * 가변 보상 시스템 (심리학적 슬롯머신 효과)
 */
export async function completeBonusMission(
  missionType: BonusMissionType,
  user?: User | null
): Promise<{
  success: boolean;
  reward?: number;
  message?: string;
  isLuckyBonus?: boolean;
}> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const { data: { user: fetchedUser } } = await supabase.auth.getUser();
    if (!fetchedUser) {
      return { success: false, message: "로그인이 필요합니다." };
    }
    currentUser = fetchedUser;
  }

  const today = new Date().toISOString().split("T")[0];

  // 이미 완료했는지 확인
  const { data: existing } = await supabase
    .from("point_transactions")
    .select("id")
    .eq("user_id", currentUser.id)
    .eq("reference_type", "bonus_mission")
    .eq("reference_id", missionType)
    .gte("created_at", `${today}T00:00:00`)
    .maybeSingle();

  if (existing) {
    return { success: false, message: "이미 완료한 미션입니다." };
  }

  // 미션 정의 찾기
  const missionDef = BONUS_MISSION_DEFINITIONS.find(m => m.type === missionType);
  if (!missionDef) {
    return { success: false, message: "유효하지 않은 미션입니다." };
  }

  // 가변 보상 계산 (슬롯머신 효과)
  const { min, max } = missionDef.reward;
  let reward: number;
  let isLuckyBonus = false;

  if (missionType === "lucky_box") {
    // 럭키박스: 확률 기반 보상
    const rand = Math.random();
    if (rand < 0.05) {
      // 5% 확률: 최대 보상
      reward = max;
      isLuckyBonus = true;
    } else if (rand < 0.20) {
      // 15% 확률: 상위 보상
      reward = Math.round(min + (max - min) * 0.7);
    } else if (rand < 0.50) {
      // 30% 확률: 중간 보상
      reward = Math.round(min + (max - min) * 0.4);
    } else {
      // 50% 확률: 기본 보상
      reward = Math.round(min + (max - min) * 0.1);
    }
  } else {
    // 일반 보너스 미션: 약간의 변동
    const variance = (max - min) * 0.3;
    reward = Math.round(min + Math.random() * variance);
  }

  // 포인트 적립
  const result = await earnPoints("mission_complete", {
    user: currentUser,
    description: `보너스 미션 완료: ${missionDef.title}`,
    referenceId: missionType,
    referenceType: "bonus_mission",
    metadata: {
      reward,
      isLuckyBonus,
      missionType,
    },
  });

  if (!result.success) {
    return { success: false, message: result.error };
  }

  // 추가 포인트 적립 (가변 보상분)
  const bonusPoints = reward - 10; // mission_complete 기본 10포인트 제외
  if (bonusPoints > 0) {
    await supabase.from("point_transactions").insert({
      user_id: currentUser.id,
      action_type: "admin_adjust",
      points: bonusPoints,
      multiplier: 1,
      final_points: bonusPoints,
      description: `보너스 미션 추가 보상: ${missionDef.title}`,
      reference_id: missionType,
      reference_type: "bonus_mission_extra",
      balance_after: result.new_total + bonusPoints,
    });

    // 총 포인트 업데이트
    await supabase
      .from("user_points")
      .update({
        total_points: result.new_total + bonusPoints,
        lifetime_points: (await getUserPoints(currentUser))!.lifetime_points + bonusPoints,
      })
      .eq("user_id", currentUser.id);
  }

  revalidatePath("/");

  return {
    success: true,
    reward,
    isLuckyBonus,
    message: isLuckyBonus
      ? `🎉 대박! ${reward} 포인트 획득!`
      : `+${reward} 포인트 획득!`,
  };
}

/**
 * 스트릭 보호권 사용 (손실 회피 심리)
 */
export async function useStreakProtection(user?: User | null): Promise<{
  success: boolean;
  message: string;
}> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const { data: { user: fetchedUser } } = await supabase.auth.getUser();
    if (!fetchedUser) {
      return { success: false, message: "로그인이 필요합니다." };
    }
    currentUser = fetchedUser;
  }

  const userPoints = await getUserPoints(currentUser);
  if (!userPoints) {
    return { success: false, message: "포인트 정보를 찾을 수 없습니다." };
  }

  // 스트릭 보호권 비용 (포인트 소모)
  const protectionCost = 50;
  if (userPoints.total_points < protectionCost) {
    return { success: false, message: `스트릭 보호에 ${protectionCost} 포인트가 필요합니다.` };
  }

  // 포인트 차감 및 스트릭 유지
  const today = new Date().toISOString().split("T")[0];

  await supabase
    .from("user_points")
    .update({
      total_points: userPoints.total_points - protectionCost,
      last_activity_date: today, // 오늘 활동한 것으로 처리
    })
    .eq("user_id", currentUser.id);

  // 거래 내역 기록
  await supabase.from("point_transactions").insert({
    user_id: currentUser.id,
    action_type: "point_used",
    points: -protectionCost,
    multiplier: 1,
    final_points: -protectionCost,
    description: "스트릭 보호권 사용",
    reference_type: "streak_protection",
    balance_after: userPoints.total_points - protectionCost,
  });

  revalidatePath("/");

  return {
    success: true,
    message: `🛡️ ${userPoints.current_streak}일 연속 기록이 보호되었습니다!`,
  };
}

/**
 * ============================================
 * 물주기 시스템 API
 * ============================================
 */

import {
  WateringStatus,
  WateringResult,
  WATERING_CONFIG,
  getRandomEncouragementQuote,
} from "@/types/points";

/**
 * 물주기 상태 조회
 */
export async function getWateringStatus(user?: User | null): Promise<WateringStatus> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const { data: { user: fetchedUser } } = await supabase.auth.getUser();
    if (!fetchedUser) {
      return {
        canWater: false,
        nextWateringAt: null,
        remainingSeconds: 0,
        todayWateringCount: 0,
        totalWateringCount: 0,
        treeHealth: 100,
        lastWateredAt: null,
      };
    }
    currentUser = fetchedUser;
  }

  const today = new Date().toISOString().split("T")[0];

  // 오늘의 물주기 횟수 조회
  const { count: todayCount } = await supabase
    .from("point_transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", currentUser.id)
    .eq("reference_type", "tree_watering")
    .gte("created_at", `${today}T00:00:00`);

  // 총 물주기 횟수 조회
  const { count: totalCount } = await supabase
    .from("point_transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", currentUser.id)
    .eq("reference_type", "tree_watering");

  // 마지막 물주기 시간 조회
  const { data: lastWatering } = await supabase
    .from("point_transactions")
    .select("created_at")
    .eq("user_id", currentUser.id)
    .eq("reference_type", "tree_watering")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 쿨다운 계산
  let canWater = true;
  let nextWateringAt: string | null = null;
  let remainingSeconds = 0;

  if (lastWatering) {
    const lastTime = new Date(lastWatering.created_at);
    const cooldownMs = WATERING_CONFIG.cooldownHours * 60 * 60 * 1000;
    const nextTime = new Date(lastTime.getTime() + cooldownMs);
    const now = new Date();

    if (nextTime > now) {
      canWater = false;
      nextWateringAt = nextTime.toISOString();
      remainingSeconds = Math.ceil((nextTime.getTime() - now.getTime()) / 1000);
    }
  }

  // 일일 최대 횟수 체크
  if ((todayCount || 0) >= WATERING_CONFIG.maxDailyWaterings) {
    canWater = false;
  }

  // 나무 건강도 계산 (마지막 물주기 이후 시간 기반)
  let treeHealth = 100;
  if (lastWatering) {
    const hoursSinceWatering = (Date.now() - new Date(lastWatering.created_at).getTime()) / (1000 * 60 * 60);
    const healthDecay = Math.floor(hoursSinceWatering * WATERING_CONFIG.healthDecayPerHour);
    treeHealth = Math.max(0, 100 - healthDecay);
  }

  return {
    canWater,
    nextWateringAt,
    remainingSeconds,
    todayWateringCount: todayCount || 0,
    totalWateringCount: totalCount || 0,
    treeHealth,
    lastWateredAt: lastWatering?.created_at || null,
  };
}

/**
 * 나무에 물주기
 * 가변 보상 시스템 적용 (심리학적 슬롯머신 효과)
 */
export async function waterTree(user?: User | null): Promise<WateringResult> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const { data: { user: fetchedUser } } = await supabase.auth.getUser();
    if (!fetchedUser) {
      return { success: false, message: "로그인이 필요합니다." };
    }
    currentUser = fetchedUser;
  }

  // 물주기 가능 여부 확인
  const status = await getWateringStatus(currentUser);
  if (!status.canWater) {
    if (status.remainingSeconds > 0) {
      const minutes = Math.ceil(status.remainingSeconds / 60);
      return {
        success: false,
        message: `${minutes}분 후에 다시 물을 줄 수 있어요 💧`,
      };
    }
    return {
      success: false,
      message: "오늘은 충분히 물을 주셨어요! 내일 다시 만나요 🌙",
    };
  }

  // 가변 보상 계산 (심리학적 설계)
  const rand = Math.random();
  let points = WATERING_CONFIG.basePoints;
  let isLuckyDrop = false;
  let bonusPoints = 0;

  // 럭키 드롭 (10% 확률)
  if (rand < WATERING_CONFIG.luckyDropChance) {
    isLuckyDrop = true;
    bonusPoints = Math.round(WATERING_CONFIG.basePoints * (WATERING_CONFIG.luckyDropMultiplier - 1));
    points = WATERING_CONFIG.basePoints * WATERING_CONFIG.luckyDropMultiplier;
  } else {
    // 일반 가변 보상 (3-8 포인트)
    points = WATERING_CONFIG.basePoints + Math.floor(rand * (WATERING_CONFIG.maxPoints - WATERING_CONFIG.basePoints + 1));
  }

  // 포인트 적립
  const userPoints = await getUserPoints(currentUser);
  if (!userPoints) {
    return { success: false, message: "포인트 정보를 찾을 수 없습니다." };
  }

  const newTotal = userPoints.total_points + points;

  // 거래 내역 생성
  await supabase.from("point_transactions").insert({
    user_id: currentUser.id,
    action_type: "daily_first_activity",
    points: points,
    multiplier: 1,
    final_points: points,
    description: isLuckyDrop ? "🍀 럭키 물주기!" : "나무에 물주기",
    reference_type: "tree_watering",
    balance_after: newTotal,
    metadata: { isLuckyDrop, bonusPoints },
  });

  // 포인트 업데이트
  await supabase
    .from("user_points")
    .update({
      total_points: newTotal,
      lifetime_points: userPoints.lifetime_points + points,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", currentUser.id);

  // 나무 건강도 계산
  const newTreeHealth = Math.min(100, status.treeHealth + WATERING_CONFIG.healthRecoveryPerWatering);

  // 독서 독려 문구 선택
  const quoteCategory = isLuckyDrop ? "achievement" : (Math.random() > 0.5 ? "prompt" : "motivation");
  const quote = getRandomEncouragementQuote(quoteCategory);

  revalidatePath("/");

  return {
    success: true,
    points,
    message: isLuckyDrop
      ? `🍀 럭키! +${points} 포인트!`
      : `+${points} 포인트!`,
    quote,
    isLuckyDrop,
    bonusPoints: isLuckyDrop ? bonusPoints : undefined,
    newTreeHealth,
  };
}
