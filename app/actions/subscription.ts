"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import { getGatesForTier, EFFECTIVE_FEATURE_GATES, type FeatureKey } from "@/lib/subscription/gates";
import type { SubscriptionTierName } from "@/lib/subscription/pricing-data";

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
): Promise<number> {
  const supabase = await createServerSupabaseClient();

  switch (feature) {
    case "notes_create": {
      const monthStart = getKSTMonthStart();
      const monthEnd = getKSTMonthEnd();
      const { count } = await supabase
        .from("notes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", `${monthStart}T00:00:00+09:00`)
        .lte("created_at", `${monthEnd}T23:59:59+09:00`);
      return count || 0;
    }
    case "bookshelf_create": {
      const { count } = await supabase
        .from("bookshelves")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_main", false)
        .is("group_id", null);
      return count || 0;
    }
    case "groups_create": {
      const { count } = await supabase
        .from("groups")
        .select("id", { count: "exact", head: true })
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
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "approved");
  return count || 0;
}

/**
 * 사용자의 활성 구독 티어 조회
 */
export async function getUserSubscriptionTier(
  userId: string
): Promise<SubscriptionTierName> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("user_subscriptions")
    .select("tier_id, status, expires_at, subscription_tiers(name)")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (!data) return "free";

  // 만료 확인
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return "free";
  }

  const tierData = data.subscription_tiers as unknown as { name: string } | null;
  const tierName = tierData?.name;

  if (tierName === "reader_v2" || tierName === "master_v2") {
    return tierName;
  }

  return "free";
}

/**
 * 사용자의 구독 상세 정보 조회
 */
export async function getUserSubscription(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("user_subscriptions")
    .select(`
      id,
      status,
      billing_cycle,
      started_at,
      expires_at,
      cancelled_at,
      subscription_tiers (
        name,
        display_name,
        price_monthly,
        price_yearly,
        bonus_points_monthly
      )
    `)
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  return data;
}

/**
 * 기능 접근 확인 (구독 티어 + 사용량 기반)
 */
export async function checkFeatureAccess(
  feature: FeatureKey,
  user?: User | null
): Promise<{
  allowed: boolean;
  limit: number;
  used: number;
  canUseWithPoints: boolean;
  pointCost: number;
  tier: SubscriptionTierName;
  upgradeMessage?: string;
}> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const { data: { user: fetchedUser } } = await supabase.auth.getUser();
    if (!fetchedUser) {
      return { allowed: false, limit: 0, used: 0, canUseWithPoints: false, pointCost: 0, tier: "free" };
    }
    currentUser = fetchedUser;
  }

  // 구독 티어 조회
  const tier = await getUserSubscriptionTier(currentUser.id);
  const gates = getGatesForTier(tier);
  const gate = gates[feature];
  const limit = gate.limit;

  // 무제한이면 즉시 허용
  if (limit === -1) {
    return { allowed: true, limit: -1, used: 0, canUseWithPoints: false, pointCost: 0, tier };
  }

  // 사용 불가 (0)이면 즉시 차단
  if (limit === 0) {
    return {
      allowed: false,
      limit: 0,
      used: 0,
      canUseWithPoints: gate.pointCost > 0,
      pointCost: gate.pointCost,
      tier,
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
            .select("id", { count: "exact", head: true })
            .eq("user_id", currentUser.id)
            .eq("action_type", actionType)
            .gte("created_at", `${monthStart}T00:00:00+09:00`)
            .lte("created_at", `${monthEnd}T23:59:59+09:00`);
          used = count || 0;
        } else {
          const today = getKSTToday();
          const { count } = await supabase
            .from("point_transactions")
            .select("id", { count: "exact", head: true })
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
      used = await getTableCount(feature, currentUser.id);
      break;
    }
    case "membership_count": {
      used = await getMembershipCount(currentUser.id);
      break;
    }
    case "boolean": {
      return {
        allowed: true,
        limit,
        used: 0,
        canUseWithPoints: false,
        pointCost: 0,
        tier,
      };
    }
  }

  const allowed = used < limit;

  // 업그레이드 메시지 생성
  let upgradeMessage: string | undefined;
  if (!allowed && tier === "free") {
    upgradeMessage = "독서가 플랜으로 업그레이드하면 더 많이 사용할 수 있어요!";
  } else if (!allowed && tier === "reader_v2") {
    upgradeMessage = "독서마스터로 업그레이드하면 무제한으로 사용할 수 있어요!";
  }

  return {
    allowed,
    limit,
    used,
    canUseWithPoints: !allowed && gate.pointCost > 0,
    pointCost: gate.pointCost,
    tier,
    upgradeMessage,
  };
}
