import type { Metadata } from "next";
import { Sparkles, Zap, BookOpen, ScanText, FileBarChart } from "lucide-react";
import { IS_BETA_MODE, BETA_MESSAGE } from "@/lib/subscription/beta";
import { POINT_PACKAGES } from "@/lib/subscription/pricing-data";
import { PricingPackageCard } from "@/components/subscription/pricing-package-card";
import { PricingComparisonTable } from "@/components/subscription/pricing-comparison-table";
import { PricingFaq } from "@/components/subscription/pricing-faq";
import { PricingPointsBanner } from "@/components/subscription/pricing-points-banner";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = IS_BETA_MODE
  ? {
      title: "AI 기능 안내 | ReadTree",
      description: "베타 테스트 기간 동안 모든 AI 기능을 무료로 이용하세요.",
    }
  : {
      title: "포인트 충전 | ReadTree",
      description: "ReadTree 포인트로 더 많은 AI 독서 경험을 이용하세요.",
    };

export default function PricingPage() {
  return (
    <div className="space-y-12 max-w-5xl mx-auto py-4">
      {/* 헤더 */}
      <div className="text-center space-y-2">
        {IS_BETA_MODE ? (
          <>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-2">
              <Zap className="h-3.5 w-3.5" />
              {BETA_MESSAGE.badge}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {BETA_MESSAGE.title}
            </h1>
            <p className="text-muted-foreground">
              정식 출시 전까지 AI 채팅, OCR 필사, 독서 리포트를 무제한으로 이용하세요
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold tracking-tight">더 많은 AI 독서 경험을</h1>
            <p className="text-muted-foreground">
              포인트로 AI 채팅, OCR 필사, 독서 리포트를 무제한으로
            </p>
          </>
        )}
      </div>

      {IS_BETA_MODE ? (
        /* 베타 안내 카드 */
        <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/50 to-forest-50/50 dark:from-emerald-950/20 dark:to-forest-950/20">
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              {BETA_MESSAGE.subtitle}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: BookOpen, label: "AI 채팅", desc: "책에 대해 AI와 자유롭게 대화" },
                { icon: ScanText, label: "OCR 필사", desc: "사진으로 텍스트를 바로 인식" },
                { icon: FileBarChart, label: "AI 독서 리포트", desc: "나만의 독서 분석 리포트" },
              ].map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 bg-white/60 dark:bg-card/60 p-4 text-center space-y-2"
                >
                  <Icon className="h-6 w-6 mx-auto text-emerald-600 dark:text-emerald-400" />
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                  <span className="inline-block text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    무제한 무료
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 내 포인트 현황 배너 (로그인 사용자만) */}
          <PricingPointsBanner />

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
        </>
      )}

      {/* 무료 한도 + 포인트 비용 테이블 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          {IS_BETA_MODE ? "기능별 이용 안내 (베타 무료)" : "무료 한도 & 포인트 비용"}
        </h2>
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
