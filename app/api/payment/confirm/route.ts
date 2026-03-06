import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/middleware/rate-limit";
import { POINT_PACKAGES } from "@/lib/subscription/pricing-data";
import type {
  ConfirmPaymentRequest,
  TossPaymentResponse,
} from "@/types/payment";

export async function POST(request: Request) {
  // 1. Rate limit (분당 10회)
  const rateLimitResult = await checkRateLimit(request, 10);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  // 2. 인증 확인
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

  // 3. 요청 파싱
  let body: ConfirmPaymentRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청입니다." },
      { status: 400 }
    );
  }

  const { paymentKey, orderId, amount } = body;

  if (!paymentKey || !orderId || !amount) {
    return NextResponse.json(
      { error: "필수 파라미터가 누락되었습니다." },
      { status: 400 }
    );
  }

  // 4. DB에서 주문 조회
  const { data: order, error: orderError } = await supabase
    .from("payment_orders")
    .select("*")
    .eq("order_id", orderId)
    .eq("user_id", user.id)
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: "주문을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 이미 처리된 주문 체크
  if (order.status === "confirmed") {
    return NextResponse.json(
      { error: "이미 처리된 주문입니다." },
      { status: 409 }
    );
  }

  if (order.status !== "pending") {
    return NextResponse.json(
      { error: `주문 상태가 유효하지 않습니다: ${order.status}` },
      { status: 400 }
    );
  }

  // 5. 금액 위변조 검증
  if (order.amount !== amount) {
    await supabase
      .from("payment_orders")
      .update({ status: "failed", failure_code: "AMOUNT_MISMATCH", failure_message: "금액 위변조 감지" })
      .eq("id", order.id);

    await supabase.from("payment_history").insert({
      order_id: orderId,
      user_id: user.id,
      event_type: "payment_failed",
      payload: { reason: "amount_mismatch", db_amount: order.amount, client_amount: amount },
    });

    return NextResponse.json(
      { error: "결제 금액이 일치하지 않습니다." },
      { status: 400 }
    );
  }

  // 6. 토스 결제 승인 API 호출
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "결제 설정 오류입니다." },
      { status: 500 }
    );
  }

  const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;

  let tossResponse: Response;
  try {
    tossResponse = await fetch(
      "https://api.tosspayments.com/v1/payments/confirm",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      }
    );
  } catch {
    await supabase
      .from("payment_orders")
      .update({ status: "failed", failure_code: "NETWORK_ERROR", failure_message: "토스 API 연결 실패" })
      .eq("id", order.id);

    return NextResponse.json(
      { error: "결제 승인 서버에 연결할 수 없습니다." },
      { status: 502 }
    );
  }

  const tossData: TossPaymentResponse = await tossResponse.json();

  // 7. 토스 승인 실패 처리
  if (!tossResponse.ok) {
    const failureCode = tossData.failure?.code || "UNKNOWN";
    const failureMessage = tossData.failure?.message || "결제 승인에 실패했습니다.";

    await supabase
      .from("payment_orders")
      .update({
        status: "failed",
        payment_key: paymentKey,
        failure_code: failureCode,
        failure_message: failureMessage,
      })
      .eq("id", order.id);

    await supabase.from("payment_history").insert({
      order_id: orderId,
      user_id: user.id,
      event_type: "payment_failed",
      payload: { failure_code: failureCode, failure_message: failureMessage },
    });

    return NextResponse.json(
      { error: failureMessage },
      { status: 400 }
    );
  }

  // 8. 승인 성공 → 주문 상태 업데이트
  await supabase
    .from("payment_orders")
    .update({
      status: "confirmed",
      payment_key: paymentKey,
      payment_method: tossData.method,
      confirmed_at: tossData.approvedAt,
    })
    .eq("id", order.id);

  await supabase.from("payment_history").insert({
    order_id: orderId,
    user_id: user.id,
    event_type: "payment_confirmed",
    payload: {
      payment_key: paymentKey,
      method: tossData.method,
      approved_at: tossData.approvedAt,
    },
  });

  // 9. 포인트 충전 (원자적 RPC)
  const totalPoints = order.points + order.bonus_points + order.first_purchase_bonus;

  const pkg = POINT_PACKAGES.find((p) => p.id === order.package_id);
  const description = pkg
    ? `${pkg.displayName} 포인트 충전 (${totalPoints}P)`
    : `포인트 충전 (${totalPoints}P)`;

  const { data: chargeResult, error: chargeError } = await supabase.rpc(
    "charge_payment_points",
    {
      p_order_id: orderId,
      p_user_id: user.id,
      p_total_points: totalPoints,
      p_description: description,
      p_metadata: {
        package_id: order.package_id,
        amount: order.amount,
        base_points: order.points,
        bonus_points: order.bonus_points,
        first_purchase_bonus: order.first_purchase_bonus,
        payment_key: paymentKey,
      },
    }
  );

  if (chargeError) {
    return NextResponse.json(
      { error: "포인트 충전에 실패했습니다." },
      { status: 500 }
    );
  }

  const newTotal = chargeResult?.new_balance ?? 0;

  await supabase.from("payment_history").insert({
    order_id: orderId,
    user_id: user.id,
    event_type: "points_charged",
    payload: {
      total_points: totalPoints,
      base_points: order.points,
      bonus_points: order.bonus_points,
      first_purchase_bonus: order.first_purchase_bonus,
      new_balance: newTotal,
      already_charged: chargeResult?.already_charged ?? false,
    },
  });

  return NextResponse.json({
    success: true,
    pointsCharged: chargeResult?.already_charged ? 0 : totalPoints,
    newBalance: newTotal,
    basePoints: order.points,
    bonusPoints: order.bonus_points,
    firstPurchaseBonus: order.first_purchase_bonus,
  });
}
