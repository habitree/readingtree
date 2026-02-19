"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import { FEATURE_GATES, type FeatureKey } from "@/lib/subscription/gates";

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
 * 사용자 구독 티어 조회
 */
export async function getUserTier(user?: User | null): Promise<{
  tier: string;
  displayName: string;
  features: Record<string, number>;
  expiresAt: string | null;
}> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const { data: { user: fetchedUser } } = await supabase.auth.getUser();
    if (!fetchedUser) {
      return { tier: "free", displayName: "무료", features: { ai_chat_daily: 3, ocr_daily: 5, groups_create: 2 }, expiresAt: null };
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
    return { tier: "free", displayName: "무료", features: { ai_chat_daily: 3, ocr_daily: 5, groups_create: 2 }, expiresAt: null };
  }

  const tierData = subscription.subscription_tiers as any;
  return {
    tier: tierData.name,
    displayName: tierData.display_name,
    features: tierData.features as Record<string, number>,
    expiresAt: subscription.expires_at,
  };
}

/**
 * 기능 접근 확인 (일일 사용량 기반)
 */
export async function checkFeatureAccess(
  feature: FeatureKey,
  user?: User | null
): Promise<{
  allowed: boolean;
  limit: number;
  used: number;
  tier: string;
  canUseWithPoints: boolean;
  pointCost: number;
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
  const limit = tierInfo.tier === "premium" ? gate.premiumLimit : gate.freeLimit;

  // 무제한이면 즉시 허용
  if (limit === -1) {
    return { allowed: true, limit: -1, used: 0, tier: tierInfo.tier, canUseWithPoints: false, pointCost: 0 };
  }

  // 오늘 사용량 조회
  const today = getKSTToday();
  const actionType = feature === "ai_chat" ? "ai_chat_spend" : feature === "ocr" ? "ocr_spend" : null;

  let used = 0;
  if (actionType) {
    const { count } = await supabase
      .from("point_transactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", currentUser.id)
      .eq("action_type", actionType)
      .gte("created_at", `${today}T00:00:00+09:00`)
      .lte("created_at", `${today}T23:59:59+09:00`);

    used = count || 0;
  }

  // 무료 사용량 카운트 (포인트 차감 없이 사용한 횟수)
  // 무료 한도 내면 허용
  const freeUsed = Math.max(0, used); // 모든 사용량을 카운트
  const allowed = freeUsed < limit;

  return {
    allowed,
    limit,
    used: freeUsed,
    tier: tierInfo.tier,
    canUseWithPoints: !allowed && gate.pointCostOnExceed > 0,
    pointCost: gate.pointCostOnExceed,
  };
}
