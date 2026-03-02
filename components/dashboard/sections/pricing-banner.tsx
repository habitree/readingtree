import Link from "next/link";
import { Crown, ArrowRight, Sparkles, Infinity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TIERS, formatPrice } from "@/lib/subscription/pricing-data";

/**
 * 대시보드 구독 플랜 배너
 * 3개 티어를 간략 카드로 표시 + /pricing CTA
 */
export function PricingBanner() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* 헤더 */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold">구독 플랜</span>
          </div>
          <Link
            href="/pricing"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            자세히 보기
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* 3 티어 미니 카드 */}
        <div className="px-4 pb-4 grid grid-cols-3 gap-2">
          {TIERS.map((tier) => (
            <Link
              key={tier.name}
              href="/pricing"
              className={`relative rounded-lg p-3 text-center transition-colors hover:bg-muted/50 ${
                tier.highlighted
                  ? "border-2 border-primary bg-primary/5"
                  : "border"
              }`}
            >
              {tier.highlighted && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] px-1.5 py-0">
                  추천
                </Badge>
              )}
              <div className="mb-1">
                {tier.name === "free" && (
                  <Sparkles className="h-4 w-4 mx-auto text-slate-400" />
                )}
                {tier.name === "reader" && (
                  <Crown className="h-4 w-4 mx-auto text-amber-500" />
                )}
                {tier.name === "reader_master" && (
                  <Infinity className="h-4 w-4 mx-auto text-purple-500" />
                )}
              </div>
              <p className="text-xs font-medium">{tier.displayName}</p>
              <p className="text-[11px] font-semibold mt-0.5">
                {formatPrice(tier.priceMonthly)}
                {tier.priceMonthly > 0 && (
                  <span className="text-muted-foreground font-normal">/월</span>
                )}
              </p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
