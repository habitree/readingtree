import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * GET /api/checkout/polar/status?order_id=RT_xxx
 * Polar 결제 후 주문 상태 확인 (폴링용)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("order_id");

  if (!orderId) {
    return NextResponse.json(
      { error: "order_id 필수" },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const { data: order, error } = await supabase
    .from("payment_orders")
    .select("*")
    .eq("order_id", orderId)
    .eq("user_id", user.id)
    .single();

  if (error || !order) {
    return NextResponse.json(
      { error: "주문을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 포인트 잔액 조회
  let newBalance = 0;
  if (order.status === "confirmed") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("points")
      .eq("id", user.id)
      .single();
    newBalance = profile?.points ?? 0;
  }

  const totalPoints = order.points + order.bonus_points + order.first_purchase_bonus;

  return NextResponse.json({
    status: order.status,
    totalPoints,
    basePoints: order.points,
    bonusPoints: order.bonus_points,
    firstPurchaseBonus: order.first_purchase_bonus,
    newBalance,
  });
}
