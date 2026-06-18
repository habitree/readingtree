"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import type {
  PointActionType,
  UserPoints,
  PointTransaction,
  EarnPointsResult,
  PointsDashboardData,
  MissionWithDetails,
  DailyMissionType,
  Achievement,
  PointSpendType,
  SpendPointsResult,
  CheckPointBalanceResult,
} from "@/types/points";
import { POINT_SPEND_COSTS } from "@/types/points";

/**
 * KST 기준 오늘 날짜 반환 (YYYY-MM-DD)
 */
function getKSTToday(): string {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  return kstDate.toISOString().split("T")[0];
}

/**
 * KST 기준 어제 날짜 반환 (YYYY-MM-DD)
 */
function getKSTYesterday(): string {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  kstDate.setDate(kstDate.getDate() - 1);
  return kstDate.toISOString().split("T")[0];
}

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
    console.error("Failed to fetch points:", error);
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
      console.error("Failed to create points:", createError);
      return null;
    }

    return newPoints;
  }

  return data;
}

/**
 * 포인트 적립 (배율 없이 순수 포인트)
 */
export async function earnPoints(
  actionType: PointActionType,
  options?: {
    referenceId?: string;
    referenceType?: string;
    description?: string;
    metadata?: Record<string, unknown>;
    user?: User | null;
  }
): Promise<EarnPointsResult> {
  const supabase = await createServerSupabaseClient();

  let currentUser = options?.user;
  if (!currentUser) {
    const { data: { user: fetchedUser } } = await supabase.auth.getUser();
    if (!fetchedUser) {
      return { success: false, points_earned: 0, new_total: 0, error: "Login required." };
    }
    currentUser = fetchedUser;
  }

  try {
    // 원자적 RPC로 포인트 적립 (일일 한도, 중복 방지, 잔액 업데이트를 단일 트랜잭션에서 처리)
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "earn_points_atomic",
      {
        p_user_id: currentUser.id,
        p_action_type: actionType,
        p_description: options?.description || null,
        p_reference_id: options?.referenceId || null,
        p_reference_type: options?.referenceType || null,
        p_metadata: options?.metadata || null,
      }
    );

    if (rpcError) {
      console.error("Failed to earn points (RPC):", rpcError);
      return { success: false, points_earned: 0, new_total: 0, error: "Failed to earn points." };
    }

    if (!rpcResult?.success) {
      return {
        success: false,
        points_earned: 0,
        new_total: rpcResult?.new_total ?? 0,
        error: rpcResult?.error || "Failed to earn points.",
      };
    }

    const finalPoints = rpcResult.points_earned as number;
    const newTotal = rpcResult.new_total as number;
    const oldLevel = rpcResult.old_level as number;

    // 레벨업 확인 (RPC 실행 후 트리거가 레벨을 업데이트했을 수 있음)
    const { data: updatedUserPoints } = await supabase
      .from("user_points")
      .select("current_level")
      .eq("user_id", currentUser.id)
      .single();

    const newLevel = updatedUserPoints?.current_level ?? oldLevel;
    const levelUp = newLevel > oldLevel;

    // 업적 확인 (후처리)
    const achievements: Achievement[] = [];

    if (actionType === "note_create") {
      const { count: noteCount } = await supabase
        .from("point_transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", currentUser.id)
        .eq("action_type", "note_create");

      if (noteCount === 1) {
        await earnPoints("first_note", { user: currentUser, description: "First note bonus" });
        achievements.push({
          type: "first_time",
          title: "First Note!",
          description: "You wrote your first note",
          points_bonus: 50,
          icon: "Pencil",
        });

        // 레퍼럴 보상 트리거 (첫 노트 작성 시 추천인에게 포인트 지급)
        try {
          const { grantReferralRewardOnFirstNote } = await import("@/app/actions/referral");
          await grantReferralRewardOnFirstNote(currentUser.id);
        } catch {
          // 레퍼럴 보상 실패해도 노트 작성에는 영향 없음
        }
      }
    }

    if (actionType === "book_add") {
      const { count: bookCount } = await supabase
        .from("point_transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", currentUser.id)
        .eq("action_type", "book_add");

      if (bookCount === 1) {
        await earnPoints("first_book", { user: currentUser, description: "First book bonus" });
        achievements.push({
          type: "first_time",
          title: "Reading Begins!",
          description: "You registered your first book",
          points_bonus: 35,
          icon: "BookOpen",
        });

        // 레퍼럴 2단계 보상 트리거 (첫 책 등록 시 양쪽 100P)
        try {
          const { grantReferralRewardOnFirstBook } = await import("@/app/actions/referral");
          await grantReferralRewardOnFirstBook(currentUser.id);
        } catch {
          // 레퍼럴 보상 실패해도 책 등록에는 영향 없음
        }
      }
    }

    if (levelUp) {
      const { data: levels } = await supabase
        .from("point_levels")
        .select("level, title, badge_icon")
        .eq("level", newLevel)
        .single();

      achievements.push({
        type: "level_up",
        title: `Level ${newLevel} reached!`,
        description: levels?.title || "You reached a new level",
        points_bonus: 0,
        icon: levels?.badge_icon || "Star",
      });
    }

    revalidatePath("/");
    revalidatePath("/profile");

    return {
      success: true,
      points_earned: finalPoints,
      new_total: newTotal,
      new_level: levelUp ? newLevel : undefined,
      level_up: levelUp,
      achievements: achievements.length > 0 ? achievements : undefined,
    };
  } catch (error) {
    console.error("Failed to earn points:", error);
    return { success: false, points_earned: 0, new_total: 0, error: "An unknown error occurred." };
  }
}

/**
 * 스트릭 업데이트 및 보너스 적립 (3개 마일스톤만 유지)
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

  const today = getKSTToday();
  const lastActivity = userPoints.last_activity_date;

  // 이미 오늘 활동한 경우
  if (lastActivity === today) {
    return { streak: userPoints.current_streak, isNewDay: false };
  }

  // 어제 활동했는지 확인 (KST 기준)
  const yesterdayStr = getKSTYesterday();

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

  // 스트릭 마일스톤 보너스 확인 (3개만 유지: 7일, 30일, 100일)
  const STREAK_MILESTONES: { days: number; action: PointActionType }[] = [
    { days: 7, action: "streak_7_days" },
    { days: 30, action: "streak_30_days" },
    { days: 100, action: "streak_100_days" },
  ];

  for (const milestone of STREAK_MILESTONES) {
    if (newStreak === milestone.days) {
      streakBonus = await earnPoints(milestone.action, {
        user: currentUser,
        description: `${milestone.days}-day streak bonus`,
      });
      break;
    }
  }

  // 오늘 첫 활동 보너스
  const dailyBonus = await earnPoints("daily_first_activity", {
    user: currentUser,
    description: "First activity of the day bonus",
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

  const today = getKSTToday();

  // 오늘의 미션 상태 조회
  const { data: existingMissions } = await supabase
    .from("daily_missions")
    .select("*")
    .eq("user_id", currentUser.id)
    .eq("date", today);

  // 오늘 활동 데이터 조회 (KST 기준)
  const [todayNotes, userPoints] = await Promise.all([
    supabase
      .from("notes")
      .select("id")
      .eq("user_id", currentUser.id)
      .gte("created_at", `${today}T00:00:00+09:00`)
      .lte("created_at", `${today}T23:59:59+09:00`),

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
      title: "mission.firstRead.title",
      description: "mission.firstRead.description",
      reward: 10,
      icon: "BookOpen",
      action_url: "/books",
      checkComplete: () => todayNotesCount > 0,
    },
    {
      type: "note",
      title: "mission.note.title",
      description: "mission.note.description",
      reward: 15,
      icon: "PenLine",
      action_url: "/notes/new",
      checkComplete: () => todayNotesCount >= 1,
      getProgress: () => ({ current: Math.min(todayNotesCount, 1), target: 1 }),
    },
  ];

  // 연속 기록 미션 (3일 이상일 때만 표시)
  if (currentStreak >= 3) {
    missionDefinitions.push({
      type: "streak",
      title: "mission.streak.title",
      description: "mission.streak.description",
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
      params: def.type === "streak" ? { count: currentStreak } : undefined,
      action_url: def.action_url,
      completed_at: existingMission?.completed_at,
    };
  });

  // 미션 상태 DB 동기화
  for (const mission of missions) {
    const existingMission = existingMissions?.find((m) => m.mission_type === mission.type);

    if (!existingMission) {
      // 미션 레코드 생성 (UPSERT로 Race Condition 방지)
      const { data: inserted, error: insertError } = await supabase
        .from("daily_missions")
        .upsert(
          {
            user_id: currentUser.id,
            date: today,
            mission_type: mission.type,
            status: mission.status,
            points_earned: mission.status === "completed" ? mission.reward : 0,
            completed_at: mission.status === "completed" ? new Date().toISOString() : null,
          },
          { onConflict: "user_id,date,mission_type", ignoreDuplicates: true }
        )
        .select("id")
        .maybeSingle();

      // 완료된 경우 포인트 적립 (insert 성공 시에만 — 중복 방지)
      if (!insertError && inserted && mission.status === "completed") {
        await earnPoints("mission_complete", {
          user: currentUser,
          description: `Daily mission complete: ${mission.title}`,
          referenceId: inserted.id,
          referenceType: "mission",
        });
      }
    } else if (existingMission.status === "pending" && mission.status === "completed") {
      // 미션 완료 처리 (상태 조건부 업데이트로 Race Condition 방지)
      const { data: updated, error: updateError } = await supabase
        .from("daily_missions")
        .update({
          status: "completed",
          points_earned: mission.reward,
          completed_at: new Date().toISOString(),
        })
        .eq("id", existingMission.id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();

      // 업데이트 성공 시에만 포인트 적립 (이미 completed면 updated는 null)
      if (!updateError && updated) {
        await earnPoints("mission_complete", {
          user: currentUser,
          description: `Daily mission complete: ${mission.title}`,
          referenceId: existingMission.id,
          referenceType: "mission",
        });
      }
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
        description: "All daily missions complete bonus",
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
        .select("id", { count: "exact", head: true })
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
    .select("id", { count: "exact", head: true })
    .gt("lifetime_points", userPoints.lifetime_points);

  // 전체 사용자 수
  const { count: totalCount } = await supabase
    .from("user_points")
    .select("id", { count: "exact", head: true });

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
    console.error("Failed to fetch transactions:", error);
    return [];
  }

  return data || [];
}

/**
 * 포인트 잔액 확인
 */
export async function checkPointBalance(
  spendType: PointSpendType,
  user?: User | null
): Promise<CheckPointBalanceResult> {
  const cost = POINT_SPEND_COSTS[spendType];
  const userPoints = await getUserPoints(user);
  const balance = userPoints?.total_points ?? 0;

  return {
    canAfford: balance >= cost,
    balance,
    cost,
  };
}

/**
 * 포인트 차감 (AI 채팅, OCR 등 유료 기능 사용 시)
 * 원자적 RPC를 사용하여 Race Condition 방지
 */
export async function spendPoints(
  spendType: PointSpendType,
  options?: {
    user?: User | null;
    description?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<SpendPointsResult> {
  const supabase = await createServerSupabaseClient();
  const cost = POINT_SPEND_COSTS[spendType];

  let currentUser = options?.user;
  if (!currentUser) {
    const { data: { user: fetchedUser } } = await supabase.auth.getUser();
    if (!fetchedUser) {
      return { success: false, points_spent: 0, new_total: 0, error: "로그인이 필요합니다." };
    }
    currentUser = fetchedUser;
  }

  const actionTypeMap: Record<PointSpendType, PointActionType> = {
    ai_chat: "ai_chat_spend",
    ocr_process: "ocr_spend",
    ai_report: "ai_report_spend",
    group_create: "group_create_spend",
    group_join: "group_join_spend",
    bookshelf_create: "bookshelf_create_spend",
    note_create: "note_create_spend",
  };
  const actionType = actionTypeMap[spendType];

  // 원자적 RPC로 잔액 확인 + 차감 + 트랜잭션 기록을 단일 트랜잭션에서 처리
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "spend_points_atomic",
    {
      p_user_id: currentUser.id,
      p_action_type: actionType,
      p_cost: cost,
      p_description: options?.description || `${spendType} 포인트 차감`,
      p_metadata: options?.metadata || null,
    }
  );

  if (rpcError) {
    console.error("포인트 차감 실패 (RPC):", rpcError);
    return { success: false, points_spent: 0, new_total: 0, error: "포인트 차감에 실패했습니다." };
  }

  if (!rpcResult?.success) {
    return {
      success: false,
      points_spent: 0,
      new_total: rpcResult?.new_total ?? 0,
      error: rpcResult?.error || "포인트 차감에 실패했습니다.",
    };
  }

  revalidatePath("/");

  return {
    success: true,
    points_spent: cost,
    new_total: rpcResult.new_total,
  };
}

/**
 * 포인트 환불 (AI 호출 실패 등 오류 시)
 */
export async function refundPoints(
  transactionId: string,
  reason: string,
  user?: User | null
): Promise<SpendPointsResult> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const { data: { user: fetchedUser } } = await supabase.auth.getUser();
    if (!fetchedUser) {
      return { success: false, points_spent: 0, new_total: 0, error: "로그인이 필요합니다." };
    }
    currentUser = fetchedUser;
  }

  // 원본 트랜잭션 조회
  const { data: originalTx, error: txError } = await supabase
    .from("point_transactions")
    .select("*")
    .eq("id", transactionId)
    .eq("user_id", currentUser.id)
    .single();

  if (txError || !originalTx) {
    return { success: false, points_spent: 0, new_total: 0, error: "원본 트랜잭션을 찾을 수 없습니다." };
  }

  const refundAmount = Math.abs(originalTx.final_points);

  // spend_points_atomic RPC를 음수 비용으로 호출하여 원자적 환불 처리
  // (환불은 드문 관리자 작업이므로 RPC 재사용)
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "spend_points_atomic",
    {
      p_user_id: currentUser.id,
      p_action_type: "point_refund",
      p_cost: -refundAmount, // 음수 = 포인트 추가
      p_description: `환불: ${reason}`,
      p_metadata: { original_transaction_id: transactionId },
    }
  );

  if (rpcError || !rpcResult?.success) {
    // Fallback: RPC 실패 시 기존 방식으로 처리
    const userPoints = await getUserPoints(currentUser);
    if (!userPoints) {
      return { success: false, points_spent: 0, new_total: 0, error: "포인트 정보를 찾을 수 없습니다." };
    }

    const newTotal = userPoints.total_points + refundAmount;

    await supabase.from("point_transactions").insert({
      user_id: currentUser.id,
      action_type: "point_refund" as PointActionType,
      points: refundAmount,
      final_points: refundAmount,
      description: `환불: ${reason}`,
      reference_id: transactionId,
      reference_type: "refund",
      balance_after: newTotal,
    });

    await supabase
      .from("user_points")
      .update({ total_points: newTotal, updated_at: new Date().toISOString() })
      .eq("user_id", currentUser.id);

    revalidatePath("/");
    return { success: true, points_spent: -refundAmount, new_total: newTotal };
  }

  revalidatePath("/");

  return {
    success: true,
    points_spent: -refundAmount,
    new_total: rpcResult.new_total,
  };
}

/**
 * 웰컴 보너스 지급 (신규 가입 시 200P)
 *
 * 가입 직후 1회만 지급. 이미 지급된 경우 무시.
 * 나머지 100P는 온보딩 미션(프로필 완성 50P + 첫 노트 50P)으로 분할 지급.
 */
export async function grantWelcomeBonus(
  user?: User | null
): Promise<EarnPointsResult> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const { data: { user: fetchedUser } } = await supabase.auth.getUser();
    if (!fetchedUser) {
      return { success: false, points_earned: 0, new_total: 0, error: "로그인이 필요합니다." };
    }
    currentUser = fetchedUser;
  }

  // 이미 웰컴 보너스를 받았는지 확인
  const { data: existing } = await supabase
    .from("point_transactions")
    .select("id")
    .eq("user_id", currentUser.id)
    .eq("action_type", "welcome_bonus")
    .maybeSingle();

  if (existing) {
    return { success: false, points_earned: 0, new_total: 0, error: "이미 웰컴 보너스를 받았습니다." };
  }

  return earnPoints("welcome_bonus", {
    user: currentUser,
    description: "가입 축하 보너스 200P",
  });
}
