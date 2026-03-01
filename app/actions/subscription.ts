"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import { FEATURE_GATES, getLimitForTier, type FeatureKey, type TierName } from "@/lib/subscription/gates";

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
 * KST 기준 이번 달 1일 반환 (YYYY-MM-DD)
 */
function getKSTMonthStart(): string {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const year = kstDate.getUTCFullYear();
  const month = String(kstDate.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

/**
 * KST 기준 이번 달 마지막 날 반환 (YYYY-MM-DD)
 */
function getKSTMonthEnd(): string {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const year = kstDate.getUTCFullYear();
  const month = kstDate.getUTCMonth() + 1;
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

/** 무료 티어 기본 features */
const FREE_TIER_FEATURES: Record<string, number> = {
  ai_chat_daily: 3,
  ocr_daily: 3,
  ai_report_monthly: 0,
  groups_create: 2,
  notes_monthly: 30,
  bookshelf_max: 3,
  groups_join: 1,
};

/**
 * 사용자 구독 티어 조회
 */
export async function getUserTier(user?: User | null): Promise<{
  tier: TierName;
  displayName: string;
  features: Record<string, number>;
  expiresAt: string | null;
}> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const { data: { user: fetchedUser } } = await supabase.auth.getUser();
    if (!fetchedUser) {
      return { tier: "free", displayName: "무료", features: FREE_TIER_FEATURES, expiresAt: null };
    }
    currentUser = fetchedUser;
  }

  // 사용자 구독 조회
  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select(`
      *,
      subscription_tiers (name, display_name, features)
    `)
    .eq("user_id", currentUser.id)
    .eq("status", "active")
    .maybeSingle();

  if (!subscription || !subscription.subscription_tiers) {
    return { tier: "free", displayName: "무료", features: FREE_TIER_FEATURES, expiresAt: null };
  }

  const tierData = subscription.subscription_tiers as Record<string, unknown>;
  const tierName = tierData.name as string;

  // 유효한 TierName 검증
  const validTiers: TierName[] = ["free", "reader", "reader_master"];
  const resolvedTier: TierName = validTiers.includes(tierName as TierName)
    ? (tierName as TierName)
    : "free";

  return {
    tier: resolvedTier,
    displayName: tierData.display_name as string,
    features: tierData.features as Record<string, number>,
    expiresAt: subscription.expires_at,
  };
}

/**
 * feature → action_type 매핑 (point_transactions 기반 카운트용)
 */
function getActionTypeForFeature(feature: FeatureKey): string | null {
  switch (feature) {
    case "ai_chat": return "ai_chat_spend";
    case "ocr": return "ocr_spend";
    case "ai_report": return "ai_report_spend";
    default: return null;
  }
}

/**
 * 테이블 직접 카운트 (notes, bookshelves 등)
 */
async function getTableCount(
  feature: FeatureKey,
  userId: string,
  period?: "daily" | "monthly"
): Promise<number> {
  const supabase = await createServerSupabaseClient();

  switch (feature) {
    case "notes_create": {
      // 월간 노트 생성 수
      const monthStart = getKSTMonthStart();
      const monthEnd = getKSTMonthEnd();
      const { count } = await supabase
        .from("notes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", `${monthStart}T00:00:00+09:00`)
        .lte("created_at", `${monthEnd}T23:59:59+09:00`);
      return count || 0;
    }
    case "bookshelf_create": {
      // 서재 수 (메인 서재 제외)
      const { count } = await supabase
        .from("bookshelves")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_main", false);
      return count || 0;
    }
    case "groups_create": {
      // 생성한 그룹 수
      const { count } = await supabase
        .from("groups")
        .select("*", { count: "exact", head: true })
        .eq("leader_id", userId);
      return count || 0;
    }
    default:
      return 0;
  }
}

/**
 * 그룹 멤버십 카운트 (참여 중인 그룹 수)
 */
async function getMembershipCount(userId: string): Promise<number> {
  const supabase = await createServerSupabaseClient();
  const { count } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "approved");
  return count || 0;
}

/**
 * 기능 접근 확인 (일일/월간 사용량 기반)
 */
export async function checkFeatureAccess(
  feature: FeatureKey,
  user?: User | null
): Promise<{
  allowed: boolean;
  limit: number;
  used: number;
  tier: TierName;
  canUseWithPoints: boolean;
  pointCost: number;
  upgradeMessage?: string;
}> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const { data: { user: fetchedUser } } = await supabase.auth.getUser();
    if (!fetchedUser) {
      return { allowed: false, limit: 0, used: 0, tier: "free", canUseWithPoints: false, pointCost: 0 };
    }
    currentUser = fetchedUser;
  }

  const tierInfo = await getUserTier(currentUser);
  const gate = FEATURE_GATES[feature];

  // 티어별 한도 결정
  const limit = getLimitForTier(gate, tierInfo.tier);

  // 무제한이면 즉시 허용
  if (limit === -1) {
    return { allowed: true, limit: -1, used: 0, tier: tierInfo.tier, canUseWithPoints: false, pointCost: 0 };
  }

  // 사용 불가 (0)이면 즉시 차단
  if (limit === 0) {
    return {
      allowed: false,
      limit: 0,
      used: 0,
      tier: tierInfo.tier,
      canUseWithPoints: gate.pointCostOnExceed > 0,
      pointCost: gate.pointCostOnExceed,
    };
  }

  // countMethod에 따른 사용량 조회
  let used = 0;

  switch (gate.countMethod) {
    case "point_transactions": {
      const actionType = getActionTypeForFeature(feature);
      if (actionType) {
        const countPeriod = gate.countPeriod ?? "daily";
        if (countPeriod === "monthly") {
          const monthStart = getKSTMonthStart();
          const monthEnd = getKSTMonthEnd();
          const { count } = await supabase
            .from("point_transactions")
            .select("*", { count: "exact", head: true })
            .eq("user_id", currentUser.id)
            .eq("action_type", actionType)
            .gte("created_at", `${monthStart}T00:00:00+09:00`)
            .lte("created_at", `${monthEnd}T23:59:59+09:00`);
          used = count || 0;
        } else {
          const today = getKSTToday();
          const { count } = await supabase
            .from("point_transactions")
            .select("*", { count: "exact", head: true })
            .eq("user_id", currentUser.id)
            .eq("action_type", actionType)
            .gte("created_at", `${today}T00:00:00+09:00`)
            .lte("created_at", `${today}T23:59:59+09:00`);
          used = count || 0;
        }
      }
      break;
    }
    case "table_count": {
      used = await getTableCount(feature, currentUser.id, gate.countPeriod);
      break;
    }
    case "membership_count": {
      used = await getMembershipCount(currentUser.id);
      break;
    }
    case "boolean": {
      // boolean 타입: limit > 0이면 허용
      return {
        allowed: true,
        limit,
        used: 0,
        tier: tierInfo.tier,
        canUseWithPoints: false,
        pointCost: 0,
      };
    }
  }

  const allowed = used < limit;

  return {
    allowed,
    limit,
    used,
    tier: tierInfo.tier,
    canUseWithPoints: !allowed && gate.pointCostOnExceed > 0,
    pointCost: gate.pointCostOnExceed,
  };
}
