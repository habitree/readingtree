import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { POINT_PACKAGES } from "@/lib/subscription/pricing-data";
import { PricingPackageCard } from "@/components/subscription/pricing-package-card";
import { PricingComparisonTable } from "@/components/subscription/pricing-comparison-table";
import { PricingFaq } from "@/components/subscription/pricing-faq";

export const metadata: Metadata = {
  title: "포인트 안내",
  description: "ReadTree 포인트로 더 많은 AI 독서 경험을 이용하세요.",
};

export default function PricingPage() {
  return (
    <div className="space-y-12 max-w-5xl mx-auto py-4">
      {/* 헤더 — Gain-framing */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">더 많은 AI 독서 경험을</h1>
        <p className="text-muted-foreground">
          포인트로 AI 채팅, OCR 필사, 독서 리포트를 무제한으로
        </p>
      </div>

      {/* 첫 충전 2배 보너스 배너 */}
      <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 p-5 text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <p className="font-semibold text-amber-800 dark:text-amber-300 text-lg">
            첫 충전 시 포인트 2배!
          </p>
        </div>
        <p className="text-sm text-amber-700 dark:text-amber-400">
          지금 충전하면 2배의 포인트를 드려요
        </p>
      </div>

      {/* 포인트 충전 패키지 카드 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">포인트 충전</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {POINT_PACKAGES.map((pkg) => (
            <PricingPackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      </section>

      {/* 무료 한도 + 포인트 비용 테이블 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">무료 한도 & 포인트 비용</h2>
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
