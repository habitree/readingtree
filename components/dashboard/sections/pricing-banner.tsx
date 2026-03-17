import Link from "next/link";
import { Coins, ArrowRight, Gift, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { IS_BETA_MODE, BETA_MESSAGE } from "@/lib/subscription/beta";

const FREE_LIMITS = [
  { label: "AI 채팅", limit: "10회/월" },
  { label: "OCR 필사", limit: "5회/월" },
  { label: "AI 리포트", limit: "1회/월" },
];

const BETA_LIMITS = [
  { label: "AI 채팅", limit: "무제한" },
  { label: "OCR 필사", limit: "무제한" },
  { label: "AI 리포트", limit: "무제한" },
];

const POINT_COSTS = [
  { label: "AI 채팅", cost: "40P" },
  { label: "OCR 필사", cost: "25P" },
  { label: "AI 리포트", cost: "100P" },
];

/**
 * 대시보드 포인트 안내 배너
 * 베타 모드: 무료 혜택 강조 / 일반 모드: 포인트 비용 안내
 */
export function PricingBanner() {
  const activeLimits = IS_BETA_MODE ? BETA_LIMITS : FREE_LIMITS;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* 상단 배너 */}
        <div className={`px-4 py-3 border-b flex items-center gap-2 ${
          IS_BETA_MODE
            ? "bg-gradient-to-r from-emerald-50 to-forest-50 dark:from-emerald-950/30 dark:to-forest-950/30 border-emerald-200 dark:border-emerald-800"
            : "bg-gradient-to-r from-forest-50 to-emerald-50 dark:from-forest-950/30 dark:to-emerald-950/30 border-forest-200 dark:border-forest-800"
        }`}>
          {IS_BETA_MODE ? (
            <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <Gift className="h-4 w-4 text-forest-600 dark:text-forest-400 shrink-0" />
          )}
          <p className={`text-sm font-semibold ${
            IS_BETA_MODE
              ? "text-emerald-800 dark:text-emerald-300"
              : "text-forest-800 dark:text-forest-300"
          }`}>
            {IS_BETA_MODE
              ? "베타 기간 무료! AI 기능을 마음껏 사용하세요"
              : "매일 무료로 AI 기능을 사용할 수 있어요"}
          </p>
        </div>

        {/* 무료 제공 한도 */}
        <div className="px-4 pt-3 pb-2">
          <span className="text-xs text-muted-foreground">
            {IS_BETA_MODE ? "베타 기간 무료 제공" : "무료 기본 제공"}
          </span>
        </div>
        <div className="px-4 pb-3 grid grid-cols-3 gap-2">
          {activeLimits.map((item) => (
            <div
              key={item.label}
              className={`rounded-lg border p-2.5 text-center ${
                IS_BETA_MODE
                  ? "border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20"
                  : "border-forest-200/60 dark:border-forest-800/40 bg-forest-50/50 dark:bg-forest-950/20"
              }`}
            >
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`text-sm font-semibold mt-0.5 ${
                IS_BETA_MODE
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-forest-700 dark:text-forest-300"
              }`}>{item.limit}</p>
            </div>
          ))}
        </div>

        {!IS_BETA_MODE && (
          <>
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
          </>
        )}

        {IS_BETA_MODE && (
          <div className="px-4 pb-3 border-t border-slate-100 dark:border-slate-800 pt-2">
            <Link
              href="/pricing"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              자세히 보기
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
