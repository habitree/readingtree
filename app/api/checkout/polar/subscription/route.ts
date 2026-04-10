import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createPolarClient } from "@/lib/polar";
import { SUBSCRIPTION_PLANS, type SubscriptionTierName } from "@/lib/subscription/pricing-data";

/**
 * POST /api/checkout/polar/subscription
 * Polar 구독 체크아웃 세션 생성
 */
export async function POST(request: Request) {
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

  // 요청 파싱
  let body: { planName: SubscriptionTierName; billingCycle: "monthly" | "yearly" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { planName, billingCycle } = body;

  // 플랜 검증
  const plan = SUBSCRIPTION_PLANS.find((p) => p.name === planName);
  if (!plan || plan.priceMonthly === 0) {
    return NextResponse.json({ error: "유효하지 않은 플랜입니다." }, { status: 400 });
  }

  const productId =
    billingCycle === "yearly" ? plan.polarProductIdYearly : plan.polarProductIdMonthly;

  if (!productId) {
    return NextResponse.json(
      { error: "이 플랜의 Polar 상품이 설정되지 않았습니다." },
      { status: 400 }
    );
  }

  // 이미 활성 구독이 있는지 확인
  const { data: existingSub } = await supabase
    .from("user_subscriptions")
    .select("id, subscription_tiers(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (existingSub) {
    const tierData = existingSub.subscription_tiers as unknown as { name: string } | null;
    return NextResponse.json(
      {
        error: `이미 ${tierData?.name === "master_v2" ? "독서마스터" : "독서가"} 구독 중입니다. 기존 구독을 해지한 후 다시 시도해주세요.`,
      },
      { status: 409 }
    );
  }

  // Polar 체크아웃 세션 생성
  try {
    const polar = createPolarClient();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const checkout = await polar.checkouts.create({
      products: [productId],
      successUrl: `${appUrl}/payment/success?provider=polar&type=subscription&plan=${planName}&cycle=${billingCycle}&checkout_id={CHECKOUT_ID}`,
      metadata: {
        user_id: user.id,
        plan_name: planName,
        billing_cycle: billingCycle,
        type: "subscription",
      },
    });

    // 감사 로그
    await supabase.from("payment_history").insert({
      order_id: `SUB_${planName}_${billingCycle}_${Date.now()}`,
      user_id: user.id,
      event_type: "subscription_checkout_created",
      payload: {
        plan_name: planName,
        billing_cycle: billingCycle,
        checkout_id: checkout.id,
        provider: "polar",
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkout.url,
      checkoutId: checkout.id,
    });
  } catch (err: unknown) {
    console.error(
      "[checkout/polar/subscription] Polar API error:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "결제 페이지 생성에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
