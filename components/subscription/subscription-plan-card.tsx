"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Crown, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { formatPriceUsd, formatPriceKrwExample, type SubscriptionPlanInfo } from "@/lib/subscription/pricing-data";
import { useRouter } from "next/navigation";

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlanInfo;
}

export function SubscriptionPlanCard({ plan }: SubscriptionPlanCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);

  async function handleSubscribe(billingCycle: "monthly" | "yearly") {
    if (!user) {
      router.push("/login?redirect=/pricing");
      return;
    }

    setLoading(billingCycle);
    try {
      const res = await fetch("/api/checkout/polar/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planName: plan.name, billingCycle }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "결제 페이지 생성에 실패했습니다.");
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch {
      alert("오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(null);
    }
  }

  const isMaster = plan.name === "master_v2";

  return (
    <div
      className={`rounded-xl border p-6 space-y-4 ${
        plan.highlighted
          ? "border-primary bg-primary/5 ring-2 ring-primary/20 relative"
          : "bg-card"
      }`}
    >
      {plan.highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
          <Crown className="h-3 w-3" /> BEST
        </span>
      )}

      <div>
        <h3 className="text-lg font-bold flex items-center gap-2">
          {isMaster && <Sparkles className="h-4 w-4 text-primary" />}
          {plan.displayName}
        </h3>
        <div className="mt-1 space-y-0.5">
          <p className="text-2xl font-extrabold">
            {formatPriceUsd(plan.priceMonthlyUsd)}
            <span className="text-sm font-normal text-muted-foreground">/mo</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {formatPriceKrwExample(plan.priceMonthly)}/월 (예시)
          </p>
        </div>
      </div>

      <ul className="text-sm space-y-1.5 text-muted-foreground">
        <li>
          AI 채팅{" "}
          <span className="font-semibold text-foreground">
            {plan.features.aiChatMonthly === -1 ? "무제한" : `${plan.features.aiChatMonthly}회/월`}
          </span>
        </li>
        <li>
          OCR 필사{" "}
          <span className="font-semibold text-foreground">
            {plan.features.ocrMonthly === -1 ? "무제한" : `${plan.features.ocrMonthly}회/월`}
          </span>
        </li>
        <li>
          AI 리포트{" "}
          <span className="font-semibold text-foreground">
            {plan.features.aiReportMonthly === -1 ? "무제한" : `${plan.features.aiReportMonthly}회/월`}
          </span>
        </li>
        <li>
          월 보너스{" "}
          <span className="font-semibold text-foreground">+{plan.bonusPointsMonthly}P</span>
        </li>
      </ul>

      <div className="space-y-2 pt-2">
        <Button
          className="w-full"
          variant={plan.highlighted ? "default" : "outline"}
          onClick={() => handleSubscribe("monthly")}
          disabled={loading !== null}
        >
          {loading === "monthly" ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          월간 구독 시작
        </Button>

        {plan.priceYearly > 0 && (
          <Button
            className="w-full"
            variant="ghost"
            size="sm"
            onClick={() => handleSubscribe("yearly")}
            disabled={loading !== null}
          >
            {loading === "yearly" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            연간 {formatPriceUsd(plan.priceYearlyUsd)} ({formatPriceKrwExample(plan.priceYearly)} 예시 · 17% 할인)
          </Button>
        )}
      </div>
    </div>
  );
}
