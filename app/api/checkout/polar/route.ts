import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createPolarClient } from "@/lib/polar";
import { POINT_PACKAGES } from "@/lib/subscription/pricing-data";

/**
 * POST /api/checkout/polar
 * Polar 체크아웃 세션 생성 → 체크아웃 URL 반환
 */
export async function POST(request: Request) {
  // 1. 인증 확인
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

  // 2. 요청 파싱
  let body: { packageId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청입니다." },
      { status: 400 }
    );
  }

  const { packageId } = body;
  const pkg = POINT_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) {
    return NextResponse.json(
      { error: "유효하지 않은 패키지입니다." },
      { status: 400 }
    );
  }

  if (!pkg.polarProductId) {
    return NextResponse.json(
      { error: "이 패키지의 Polar 상품이 설정되지 않았습니다." },
      { status: 400 }
    );
  }

  // 3. 첫 충전 여부 확인
  const { data: existingOrder } = await supabase
    .from("payment_orders")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .limit(1)
    .maybeSingle();

  const isFirst = !existingOrder;
  const firstPurchaseBonus = isFirst ? pkg.firstPurchaseBonusPoints : 0;

  // 4. 주문번호 생성
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
  const orderId = `RT_${timestamp}_${random}`;

  // 5. DB에 pending 주문 생성
  const { error: insertError } = await supabase.from("payment_orders").insert({
    user_id: user.id,
    order_id: orderId,
    package_id: pkg.id,
    amount: pkg.price,
    points: pkg.points,
    bonus_points: pkg.bonusPoints,
    first_purchase_bonus: firstPurchaseBonus,
    status: "pending",
    payment_method: "polar",
  });

  if (insertError) {
    return NextResponse.json(
      { error: "주문 생성에 실패했습니다." },
      { status: 500 }
    );
  }

  // 감사 로그
  await supabase.from("payment_history").insert({
    order_id: orderId,
    user_id: user.id,
    event_type: "order_created",
    payload: {
      package_id: pkg.id,
      amount: pkg.price,
      amount_usd: pkg.priceUsd,
      points: pkg.points,
      bonus_points: pkg.bonusPoints,
      first_purchase_bonus: firstPurchaseBonus,
      provider: "polar",
    },
  });

  // 6. Polar 체크아웃 세션 생성
  try {
    const polar = createPolarClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkout = await polar.checkouts.create({
      products: [pkg.polarProductId],
      successUrl: `${appUrl}/payment/success?provider=polar&checkout_id={CHECKOUT_ID}&order_id=${orderId}`,
      metadata: {
        user_id: user.id,
        order_id: orderId,
        package_id: pkg.id,
      },
    });

    // 주문에 체크아웃 ID 저장
    await supabase
      .from("payment_orders")
      .update({ payment_key: checkout.id })
      .eq("order_id", orderId);

    return NextResponse.json({
      success: true,
      checkoutUrl: checkout.url,
      checkoutId: checkout.id,
      orderId,
    });
  } catch (err: unknown) {
    // 주문 실패 처리
    await supabase
      .from("payment_orders")
      .update({
        status: "failed",
        failure_code: "POLAR_CHECKOUT_ERROR",
        failure_message: err instanceof Error ? err.message : "체크아웃 생성 실패",
      })
      .eq("order_id", orderId);

    return NextResponse.json(
      { error: "결제 페이지 생성에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
