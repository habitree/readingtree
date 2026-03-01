import type { Metadata } from "next";
import { TIERS, FEATURE_ROWS } from "@/lib/subscription/pricing-data";
import { PricingTierCard } from "@/components/subscription/pricing-tier-card";
import { PricingComparisonTable } from "@/components/subscription/pricing-comparison-table";
import { PricingFaq } from "@/components/subscription/pricing-faq";

export const metadata: Metadata = {
  title: "구독 플랜",
  description: "ReadTree 구독 플랜을 비교하고 나에게 맞는 플랜을 선택하세요.",
};

export default function PricingPage() {
  return (
    <div className="space-y-12 max-w-5xl mx-auto py-4">
      {/* 헤더 */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">구독 플랜</h1>
        <p className="text-muted-foreground">
          나에게 맞는 플랜을 선택하세요
        </p>
      </div>

      {/* 티어 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TIERS.map((tier) => (
          <PricingTierCard
            key={tier.name}
            tier={tier}
            features={FEATURE_ROWS}
          />
        ))}
      </div>

      {/* 기능 비교표 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">기능 비교</h2>
        <PricingComparisonTable />
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">자주 묻는 질문</h2>
        <PricingFaq />
      </section>
    </div>
  );
}
