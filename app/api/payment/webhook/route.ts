import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { POINT_PACKAGES } from "@/lib/subscription/pricing-data";
import type { TossWebhookPayload } from "@/types/payment";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * 토스페이먼츠 웹훅 서명 검증
 * HMAC-SHA256(webhookSecret, requestBody) === signatureHeader
 */
function verifyWebhookSignature(
  body: string,
  signature: string | null
): boolean {
  const webhookSecret = process.env.TOSS_WEBHOOK_SECRET;

  if (!webhookSecret || !signature) {
    return false;
  }

  const expectedSignature = createHmac("sha256", webhookSecret)
    .update(body)
    .digest("base64");

  const sigBuffer = Buffer.from(signature, "utf-8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf-8");

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(sigBuffer, expectedBuffer);
}

/**
 * 토스페이먼츠 웹훅 수신
 * - HMAC-SHA256 서명 검증 필수
 * - 가상계좌 입금 확인 (DEPOSIT_CALLBACK)
 * - 결제 취소 시 포인트 회수
 * - 항상 200 반환 (토스 재시도 방지)
 */
export async function POST(request: Request) {
  // 1. 원본 body 텍스트와 서명 헤더 추출
  const rawBody = await request.text();
  const signature = request.headers.get("x-toss-signature");

  // 2. 서명 검증 (fail-closed: 검증 실패 시 거부)
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 }
    );
  }

  // 3. 페이로드 파싱
  let payload: TossWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  const supabase = createAdminSupabaseClient();

  const { eventType, data } = payload;
  const orderId = data?.orderId;

  if (!orderId) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  // 주문 조회
  const { data: order } = await supabase
    .from("payment_orders")
    .select("*")
    .eq("order_id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  // 감사 로그
  await supabase.from("payment_history").insert({
    order_id: orderId,
    user_id: order.user_id,
    event_type: "webhook_received",
    payload: { event_type: eventType, toss_data: data },
  });

  // 가상계좌 입금 확인
  if (eventType === "DEPOSIT_CALLBACK" && order.status === "pending") {
    // 주문 확인 처리
    await supabase
      .from("payment_orders")
      .update({
        status: "confirmed",
        payment_key: data.paymentKey,
        payment_method: data.method,
        confirmed_at: data.approvedAt || new Date().toISOString(),
      })
      .eq("id", order.id);

    // 포인트 충전 (원자적 RPC)
    const totalPoints =
      order.points + order.bonus_points + order.first_purchase_bonus;

    const pkg = POINT_PACKAGES.find((p) => p.id === order.package_id);
    const description = pkg
      ? `${pkg.displayName} 포인트 충전 (${totalPoints}P)`
      : `포인트 충전 (${totalPoints}P)`;

    const { data: chargeResult } = await supabase.rpc(
      "charge_payment_points",
      {
        p_order_id: orderId,
        p_user_id: order.user_id,
        p_total_points: totalPoints,
        p_description: description,
        p_metadata: {
          package_id: order.package_id,
          amount: order.amount,
          base_points: order.points,
          bonus_points: order.bonus_points,
          first_purchase_bonus: order.first_purchase_bonus,
          payment_key: data.paymentKey,
          source: "webhook",
        },
      }
    );

    await supabase.from("payment_history").insert({
      order_id: orderId,
      user_id: order.user_id,
      event_type: "points_charged",
      payload: {
        total_points: totalPoints,
        new_balance: chargeResult?.new_balance ?? 0,
        source: "webhook_deposit",
        already_charged: chargeResult?.already_charged ?? false,
      },
    });
  }

  // 결제 취소
  if (
    (eventType === "PAYMENT_STATUS_CHANGED" && data.status === "CANCELED") ||
    eventType === "CANCEL"
  ) {
    if (order.status === "confirmed") {
      const totalPoints =
        order.points + order.bonus_points + order.first_purchase_bonus;

      // 포인트 환불 (원자적 RPC)
      const { data: refundResult } = await supabase.rpc(
        "refund_payment_points",
        {
          p_order_id: orderId,
          p_user_id: order.user_id,
          p_total_points: totalPoints,
        }
      );

      await supabase.from("payment_history").insert({
        order_id: orderId,
        user_id: order.user_id,
        event_type: "points_refunded",
        payload: {
          refunded_points: refundResult?.refunded_points ?? 0,
          new_balance: refundResult?.new_balance ?? 0,
          source: "webhook",
        },
      });
    }

    await supabase
      .from("payment_orders")
      .update({ status: "cancelled" })
      .eq("id", order.id);

    await supabase.from("payment_history").insert({
      order_id: orderId,
      user_id: order.user_id,
      event_type: "payment_cancelled",
      payload: { source: "webhook" },
    });
  }

  // 항상 200 반환 (토스 재시도 방지)
  return NextResponse.json({ success: true }, { status: 200 });
}
