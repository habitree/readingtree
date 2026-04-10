import type { Metadata } from "next";
import { Sparkles, Zap, BookOpen, ScanText, FileBarChart, Gift, Flame, Trophy, Pen, UserPlus, Coins } from "lucide-react";
import { IS_BETA_MODE, BETA_MESSAGE } from "@/lib/subscription/beta";
import { ACTIVE_POINT_PACKAGES, PAID_SUBSCRIPTION_PLANS } from "@/lib/subscription/pricing-data";
import { PricingPackageCard } from "@/components/subscription/pricing-package-card";
import { SubscriptionPlanCard } from "@/components/subscription/subscription-plan-card";
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

          {/* 구독 플랜 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">구독 플랜</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {PAID_SUBSCRIPTION_PLANS.map((plan) => (
                <SubscriptionPlanCard key={plan.name} plan={plan} />
              ))}
            </div>
          </section>

          {/* 포인트 탑업 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">포인트 충전</h2>
            <p className="text-sm text-muted-foreground">구독 없이 필요할 때만 포인트로 AI 추가 사용</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ACTIVE_POINT_PACKAGES.map((pkg) => (
                <PricingPackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          </section>
        </>
      )}

      {/* 포인트 적립 방법 — 한눈에 보기 */}
      <section className="space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            포인트 적립 방법
          </h2>
          <p className="text-sm text-muted-foreground">
            독서 활동만으로 포인트가 쌓여요
          </p>
        </div>

        {/* 시작 보너스 강조 */}
        <div className="rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 border border-violet-200 dark:border-violet-800 p-4 text-center">
          <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
            가입 즉시
          </p>
          <p className="text-3xl font-bold text-violet-600 dark:text-violet-400 mt-1">
            200P
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            + 프로필 완성 50P · 첫 노트 50P · 첫 책 등록 35P = 최대 <span className="font-bold text-foreground">335P</span>
          </p>
        </div>

        {/* 적립 카드 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            { icon: Pen, label: "노트 작성", points: "10~15P", desc: "인용구·메모·필사" },
            { icon: Trophy, label: "책 완독", points: "60P", desc: "완독할 때마다" },
            { icon: Flame, label: "매일 활동", points: "8P/일", desc: "오늘 첫 활동" },
            { icon: Gift, label: "연속 7일", points: "50P", desc: "30일 200P · 100일 500P" },
          ] as const).map(({ icon: Icon, label, points, desc }) => (
            <div
              key={label}
              className="rounded-xl border bg-card p-3 text-center space-y-1.5"
            >
              <Icon className="h-5 w-5 mx-auto text-amber-500" />
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{points}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">{desc}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          그 외 노트 공유(8P) · 일일 미션(12P) · 친구 추천(100P) 등 다양한 활동으로 적립 가능
        </p>
      </section>

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
