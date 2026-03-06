"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { POINT_PACKAGES } from "@/lib/subscription/pricing-data";
import type {
  CreatePaymentOrderResult,
  PaymentOrder,
  PaymentHistory,
} from "@/types/payment";

/**
 * 주문번호 생성: RT_YYYYMMDDHHmmss_xxxx
 */
function generateOrderId(): string {
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  const timestamp = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RT_${timestamp}_${random}`;
}

/**
 * 결제 주문 생성 (pending 상태)
 */
export async function createPaymentOrder(
  packageId: string
): Promise<CreatePaymentOrderResult> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 패키지 유효성 검증 (SSoT: pricing-data.ts)
  const pkg = POINT_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) {
    return { success: false, error: "유효하지 않은 패키지입니다." };
  }

  // 첫 충전 여부 확인
  const { data: existingOrder } = await supabase
    .from("payment_orders")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .limit(1)
    .maybeSingle();

  const isFirst = !existingOrder;
  const firstPurchaseBonus = isFirst ? pkg.firstPurchaseBonusPoints : 0;

  const orderId = generateOrderId();

  // 주문 생성
  const { error: insertError } = await supabase.from("payment_orders").insert({
    user_id: user.id,
    order_id: orderId,
    package_id: pkg.id,
    amount: pkg.price,
    points: pkg.points,
    bonus_points: pkg.bonusPoints,
    first_purchase_bonus: firstPurchaseBonus,
    status: "pending",
  });

  if (insertError) {
    return { success: false, error: "주문 생성에 실패했습니다." };
  }

  // 감사 로그
  await supabase.from("payment_history").insert({
    order_id: orderId,
    user_id: user.id,
    event_type: "order_created",
    payload: {
      package_id: pkg.id,
      amount: pkg.price,
      points: pkg.points,
      bonus_points: pkg.bonusPoints,
      first_purchase_bonus: firstPurchaseBonus,
    },
  });

  // 프로필에서 이름 가져오기
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return {
    success: true,
    orderId,
    amount: pkg.price,
    orderName: `ReadTree ${pkg.displayName} 포인트 패키지`,
    customerName: profile?.display_name || "고객",
  };
}

/**
 * 결제 내역 조회
 */
export async function getPaymentHistory(): Promise<PaymentOrder[]> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("payment_orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return [];
  return (data as PaymentOrder[]) || [];
}

/**
 * 만료 주문 처리 (10분 초과 pending 주문)
 */
export async function expireOldOrders(): Promise<number> {
  const supabase = await createServerSupabaseClient();

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data: expiredOrders } = await supabase
    .from("payment_orders")
    .select("order_id, user_id")
    .eq("status", "pending")
    .lt("created_at", tenMinutesAgo);

  if (!expiredOrders || expiredOrders.length === 0) return 0;

  // 상태 업데이트
  const { error } = await supabase
    .from("payment_orders")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("created_at", tenMinutesAgo);

  if (error) return 0;

  // 감사 로그
  for (const order of expiredOrders) {
    await supabase.from("payment_history").insert({
      order_id: order.order_id,
      user_id: order.user_id,
      event_type: "order_expired",
      payload: { reason: "10분 초과 자동 만료" },
    });
  }

  return expiredOrders.length;
}
