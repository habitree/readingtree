"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { earnPoints } from "@/app/actions/points";
import type { User } from "@supabase/supabase-js";
import { REFERRAL_LIMITS } from "@/lib/constants/limits";

/**
 * 가입 시 레퍼럴 기록 저장
 * 쿠키에서 referrer ID를 읽어 referrals 테이블에 저장
 */
export async function processReferralOnSignup(
  referredUser: User,
  referrerId: string,
  sourceType?: string,
  sourceId?: string
): Promise<{ success: boolean; error?: string }> {
  // 자기 자신 추천 방지
  if (referredUser.id === referrerId) {
    return { success: false, error: "self_referral" };
  }

  const supabase = await createServerSupabaseClient();

  // 이미 레퍼럴 기록이 있는지 확인
  const { data: existing } = await supabase
    .from("referrals")
    .select("id")
    .eq("referred_id", referredUser.id)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "already_referred" };
  }

  // 추천인 존재 확인
  const { data: referrer } = await supabase
    .from("users")
    .select("id")
    .eq("id", referrerId)
    .maybeSingle();

  if (!referrer) {
    return { success: false, error: "referrer_not_found" };
  }

  // 레퍼럴 기록 생성
  const { error } = await supabase.from("referrals").insert({
    referrer_id: referrerId,
    referred_id: referredUser.id,
    source_type: sourceType || "note",
    source_id: sourceId || null,
    status: "pending",
  });

  if (error) {
    console.error("레퍼럴 기록 생성 실패:", error);
    return { success: false, error: "insert_failed" };
  }

  // 피추천인 추가 보너스 즉시 지급 (50P)
  await earnPoints("referral_bonus", {
    user: referredUser,
    description: "추천 가입 보너스",
  });

  return { success: true };
}

/**
 * 첫 노트 작성 시 레퍼럴 보상 지급
 * 피추천인이 첫 노트를 작성하면 추천인에게 100P 지급
 */
export async function grantReferralRewardOnFirstNote(
  userId: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();

  // pending 상태의 레퍼럴 조회
  const { data: referral } = await supabase
    .from("referrals")
    .select("id, referrer_id, referrer_points_granted")
    .eq("referred_id", userId)
    .eq("status", "pending")
    .maybeSingle();

  if (!referral || referral.referrer_points_granted) return;

  // 추천인 월 상한 확인 (월 10명)
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const { count } = await supabase
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", referral.referrer_id)
    .eq("referrer_points_granted", true)
    .gte("completed_at", `${monthStart}T00:00:00+09:00`);

  if ((count || 0) >= REFERRAL_LIMITS.MONTHLY_REWARD_CAP) return;

  // 추천인에게 100P 지급 (admin client로 사용자 조회)
  const adminSupabase = createAdminSupabaseClient();
  const { data: { user: referrerUser } } = await adminSupabase.auth.admin.getUserById(referral.referrer_id);
  if (referrerUser) {
    await earnPoints("referral_success", {
      user: referrerUser as User,
      description: "친구 추천 보상",
      referenceId: referral.id,
      referenceType: "referral",
    });
  }

  // 레퍼럴 상태 업데이트
  await supabase
    .from("referrals")
    .update({
      status: "completed",
      referrer_points_granted: true,
      referred_points_granted: true,
      completed_at: new Date().toISOString(),
    })
    .eq("id", referral.id);
}

/**
 * 내 추천 현황 조회
 */
export async function getMyReferralStats(): Promise<{
  totalReferred: number;
  completedCount: number;
  totalPointsEarned: number;
}> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { totalReferred: 0, completedCount: 0, totalPointsEarned: 0 };

  const { count: totalReferred } = await supabase
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", user.id);

  const { count: completedCount } = await supabase
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", user.id)
    .eq("status", "completed");

  return {
    totalReferred: totalReferred || 0,
    completedCount: completedCount || 0,
    totalPointsEarned: (completedCount || 0) * 100,
  };
}
