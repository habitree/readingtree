import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getYearlyRecapPromoYear } from "@/lib/feature-flags";

/**
 * 연간 독서 결산 진입 배너 (REQ-0014).
 * 12월에는 올해, 1월에는 작년 결산으로 안내하고 그 외 기간에는 아무것도 그리지 않는다.
 */
export function YearlyRecapBanner() {
  const year = getYearlyRecapPromoYear();
  if (year === null) return null;

  return (
    <Link
      href={`/recap/year/${year}`}
      className="flex items-center justify-between gap-3 rounded-xl bg-forest-800 px-4 py-3 text-white transition-colors hover:bg-forest-700"
    >
      <span>
        <span className="block text-sm font-bold">{year} 독서 결산이 도착했어요</span>
        <span className="block text-xs text-white/75">한 해 동안 읽고 남긴 것들을 모아봤어요</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0" aria-hidden />
    </Link>
  );
}
