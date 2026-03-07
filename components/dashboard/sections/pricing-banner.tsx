import Link from "next/link";
import { Coins, ArrowRight, Gift } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const FREE_LIMITS = [
  { label: "AI 채팅", limit: "10회/월" },
  { label: "OCR 필사", limit: "5회/월" },
  { label: "AI 리포트", limit: "1회/월" },
];

const POINT_COSTS = [
  { label: "AI 채팅", cost: "40P" },
  { label: "OCR 필사", cost: "25P" },
  { label: "AI 리포트", cost: "100P" },
];

/**
 * 대시보드 포인트 안내 배너
 * 무료 제공 안내 + 포인트 비용 간략 안내 + /pricing CTA
 */
export function PricingBanner() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* 무료 기본 제공 안내 */}
        <div className="px-4 py-3 bg-gradient-to-r from-forest-50 to-emerald-50 dark:from-forest-950/30 dark:to-emerald-950/30 border-b border-forest-200 dark:border-forest-800 flex items-center gap-2">
          <Gift className="h-4 w-4 text-forest-600 dark:text-forest-400 shrink-0" />
          <p className="text-sm font-semibold text-forest-800 dark:text-forest-300">
            매일 무료로 AI 기능을 사용할 수 있어요
          </p>
        </div>

        {/* 무료 제공 한도 */}
        <div className="px-4 pt-3 pb-2">
          <span className="text-xs text-muted-foreground">무료 기본 제공</span>
        </div>
        <div className="px-4 pb-3 grid grid-cols-3 gap-2">
          {FREE_LIMITS.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-forest-200/60 dark:border-forest-800/40 bg-forest-50/50 dark:bg-forest-950/20 p-2.5 text-center"
            >
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-sm font-semibold text-forest-700 dark:text-forest-300 mt-0.5">{item.limit}</p>
            </div>
          ))}
        </div>

        {/* 포인트 비용 헤더 */}
        <div className="px-4 pt-2 pb-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold">추가 사용은 포인트로</span>
          </div>
          <Link
            href="/pricing"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            자세히 보기
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* 포인트 비용 간략 안내 */}
        <div className="px-4 pb-4 grid grid-cols-3 gap-2">
          {POINT_COSTS.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border p-2.5 text-center"
            >
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-sm font-semibold mt-0.5">{item.cost}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
