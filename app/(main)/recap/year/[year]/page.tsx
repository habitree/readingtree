import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GuestAlert } from "@/components/ui/guest-alert";
import { getYearlyRecapForView } from "@/app/actions/recap/yearly";
import { YearlyStoryViewer } from "@/components/recap/yearly/yearly-story-viewer";

export const metadata: Metadata = {
  title: "연간 독서 결산 | ReadTree",
  description: "한 해 동안 읽고 남긴 것들을 모아보세요",
};

/**
 * 연간 독서 결산 (REQ-0014).
 * 올해 결산은 12월에만 열린다. 잘못된 연도·아직 열리지 않은 결산은 /stats 로 보낸다.
 */
export default async function YearlyRecapPage({ params }: { params: Promise<{ year: string }> }) {
  const { year: yearParam } = await params;
  if (!/^\d{4}$/.test(yearParam)) redirect("/stats");

  const view = await getYearlyRecapForView(Number(yearParam));
  if (!view || view.status === "locked") redirect("/stats");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-stone-500 hover:text-emerald-700">
          <Link href="/stats" aria-label="독서성향으로">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold sm:text-2xl">{view.year} 독서 결산</h1>
      </div>

      {view.isGuest && <GuestAlert variant="compact" message="샘플 데이터로 만든 결산을 미리보고 있어요" />}

      <YearlyStoryViewer computed={view.computed} userName={view.userName} share={view.share} />
    </div>
  );
}
