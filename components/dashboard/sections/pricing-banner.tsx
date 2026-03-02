import Link from "next/link";
import { Coins, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const POINT_COSTS = [
  { label: "AI 채팅", cost: "100P" },
  { label: "OCR 필사", cost: "80P" },
  { label: "AI 리포트", cost: "150P" },
];

/**
 * 대시보드 포인트 안내 배너
 * 포인트 비용 간략 안내 + /pricing CTA
 */
export function PricingBanner() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* 헤더 */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold">포인트</span>
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
