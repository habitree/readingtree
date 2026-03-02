import Link from "next/link";
import { Coins, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const POINT_COSTS = [
  { label: "AI 채팅", cost: "100P" },
  { label: "OCR 필사", cost: "80P" },
  { label: "AI 리포트", cost: "150P" },
];

/**
 * 대시보드 포인트 안내 배너
 * 첫 충전 2배 강조 + 포인트 비용 간략 안내 + /pricing CTA
 */
export function PricingBanner() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* 첫 충전 2배 배너 */}
        <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b border-amber-200 dark:border-amber-800 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            첫 충전 시 포인트 2배!
          </p>
        </div>

        {/* 헤더 */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold">포인트 비용</span>
          </div>
          <Link
            href="/pricing"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            충전하기
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* 포인트 비용 간략 안내 */}
        <div className="px-4 pb-4 grid grid-cols-3 gap-2">
          {POINT_COSTS.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border p-3 text-center"
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
