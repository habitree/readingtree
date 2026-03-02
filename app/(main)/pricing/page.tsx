import type { Metadata } from "next";
import { POINT_PACKAGES } from "@/lib/subscription/pricing-data";
import { PricingPackageCard } from "@/components/subscription/pricing-package-card";
import { PricingComparisonTable } from "@/components/subscription/pricing-comparison-table";
import { PricingFaq } from "@/components/subscription/pricing-faq";

export const metadata: Metadata = {
  title: "포인트 안내",
  description: "ReadTree 포인트로 더 많은 기능을 이용하세요.",
};

export default function PricingPage() {
  return (
    <div className="space-y-12 max-w-5xl mx-auto py-4">
      {/* 헤더 */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">포인트 안내</h1>
        <p className="text-muted-foreground">
          무료 한도 내에서 자유롭게 사용하고, 포인트로 더 많이 이용하세요
        </p>
      </div>

      {/* 무료 한도 + 포인트 비용 테이블 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">무료 한도 & 포인트 비용</h2>
        <PricingComparisonTable />
      </section>

      {/* 포인트 충전 패키지 카드 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">포인트 충전</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {POINT_PACKAGES.map((pkg) => (
            <PricingPackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">자주 묻는 질문</h2>
        <PricingFaq />
      </section>
    </div>
  );
}
