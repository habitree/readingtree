import { NextResponse } from "next/server";
import {
  validateEvent,
  WebhookVerificationError,
} from "@polar-sh/sdk/webhooks";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { POINT_PACKAGES } from "@/lib/subscription/pricing-data";

/**
 * POST /api/webhook/polar
 * Polar 웹훅 수신 — 결제 완료 시 포인트 충전
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "웹훅 시크릿 미설정" },
      { status: 500 }
    );
  }

  // 1. 서명 검증
  const body = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let event: ReturnType<typeof validateEvent>;
  try {
    event = validateEvent(body, headers, webhookSecret);
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "서명 검증 실패" }, { status: 403 });
    }
    return NextResponse.json({ error: "웹훅 파싱 실패" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  // 2. 이벤트 처리
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventData = event as { type: string; data: any };

  if (eventData.type === "order.paid") {
    const order = eventData.data;
    const metadata = order.metadata || {};
    const orderId = metadata.order_id as string | undefined;
    const userId = metadata.user_id as string | undefined;

    if (!orderId || !userId) {
      // 감사 로그만 남기고 무시
      await supabase.from("payment_history").insert({
        order_id: orderId || "unknown",
        user_id: userId || "00000000-0000-0000-0000-000000000000",
        event_type: "webhook_received",
        payload: { polar_event: eventData.type, error: "metadata 누락" },
      });
      return NextResponse.json({ received: true }, { status: 202 });
    }

    // 감사 로그
    await supabase.from("payment_history").insert({
      order_id: orderId,
      user_id: userId,
      event_type: "webhook_received",
      payload: {
        polar_event: eventData.type,
        polar_order_id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });

    // DB에서 주문 조회
    const { data: dbOrder, error: orderError } = await supabase
      .from("payment_orders")
      .select("*")
      .eq("order_id", orderId)
      .eq("user_id", userId)
      .single();

    if (orderError || !dbOrder) {
      return NextResponse.json({ error: "주문 없음" }, { status: 404 });
    }

    // 이미 처리된 주문
    if (dbOrder.status === "confirmed") {
      return NextResponse.json({ received: true, already_processed: true }, { status: 202 });
    }

    // 주문 상태 업데이트
    await supabase
      .from("payment_orders")
      .update({
        status: "confirmed",
        payment_key: order.id,
        payment_method: "polar",
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", dbOrder.id);

    await supabase.from("payment_history").insert({
      order_id: orderId,
      user_id: userId,
      event_type: "payment_confirmed",
      payload: {
        provider: "polar",
        polar_order_id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });

    // 포인트 충전
    const totalPoints =
      dbOrder.points + dbOrder.bonus_points + dbOrder.first_purchase_bonus;

    const pkg = POINT_PACKAGES.find((p) => p.id === dbOrder.package_id);
    const description = pkg
      ? `${pkg.displayName} 포인트 충전 (${totalPoints}P)`
      : `포인트 충전 (${totalPoints}P)`;

    const { data: chargeResult, error: chargeError } = await supabase.rpc(
      "charge_payment_points",
      {
        p_order_id: orderId,
        p_user_id: userId,
        p_total_points: totalPoints,
        p_description: description,
        p_metadata: {
          package_id: dbOrder.package_id,
          amount: dbOrder.amount,
          base_points: dbOrder.points,
          bonus_points: dbOrder.bonus_points,
          first_purchase_bonus: dbOrder.first_purchase_bonus,
          provider: "polar",
          polar_order_id: order.id,
        },
      }
    );

    if (chargeError) {
      await supabase.from("payment_history").insert({
        order_id: orderId,
        user_id: userId,
        event_type: "payment_failed",
        payload: { error: "charge_payment_points 실패", detail: chargeError.message },
      });
      return NextResponse.json({ error: "포인트 충전 실패" }, { status: 500 });
    }

    await supabase.from("payment_history").insert({
      order_id: orderId,
      user_id: userId,
      event_type: "points_charged",
      payload: {
        total_points: totalPoints,
        base_points: dbOrder.points,
        bonus_points: dbOrder.bonus_points,
        first_purchase_bonus: dbOrder.first_purchase_bonus,
        new_balance: chargeResult?.new_balance ?? 0,
        already_charged: chargeResult?.already_charged ?? false,
        provider: "polar",
      },
    });

    return NextResponse.json({ received: true, points_charged: totalPoints }, { status: 202 });
  }

  if (eventData.type === "order.refunded") {
    const order = eventData.data;
    const metadata = order.metadata || {};
    const orderId = metadata.order_id as string | undefined;
    const userId = metadata.user_id as string | undefined;

    if (orderId && userId) {
      // 주문 취소 처리
      await supabase
        .from("payment_orders")
        .update({ status: "cancelled" })
        .eq("order_id", orderId);

      // 포인트 회수
      await supabase.rpc("refund_payment_points", {
        p_order_id: orderId,
        p_user_id: userId,
      });

      await supabase.from("payment_history").insert({
        order_id: orderId,
        user_id: userId,
        event_type: "payment_cancelled",
        payload: { provider: "polar", polar_order_id: order.id },
      });
    }

    return NextResponse.json({ received: true }, { status: 202 });
  }

  // 기타 이벤트는 무시
  return NextResponse.json({ received: true }, { status: 202 });
}
