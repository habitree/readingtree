import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GuestAlert } from "@/components/ui/guest-alert";
import { getMonthlyBooksList } from "@/app/actions/recap/books-list";
import { MonthlyBooksShowcase } from "@/components/recap/monthly-books-showcase";
import { RecapPageMonthSwitcher } from "@/components/recap/recap-page-month-switcher";

export const metadata: Metadata = {
  title: "월간 독서 책장 | ReadTree",
  description: "이번 달 읽은 책들을 한눈에 모아보세요",
};

/** KST 기준 현재 YYYY-MM */
function currentYearMonth(): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** YYYY-MM 파싱 → 유효하면 {year, month}, 아니면 null */
function parseYearMonth(ym: string): { year: number; month: number } | null {
  if (!/^\d{4}-\d{2}$/.test(ym)) return null;
  const [y, m] = ym.split("-").map(Number);
  if (m < 1 || m > 12 || y < 2000 || y > 2100) return null;
  return { year: y, month: m };
}

export default async function RecapBooksPage({
  params,
}: {
  params: Promise<{ yearMonth: string }>;
}) {
  const { yearMonth } = await params;
  const parsed = parseYearMonth(yearMonth);
  if (!parsed) redirect(`/recap/${currentYearMonth()}`);

  const { year, month } = parsed!;
  const result = await getMonthlyBooksList(year, month);
  // 미래월 등으로 null이면 현재월로
  if (!result) redirect(`/recap/${currentYearMonth()}`);

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-stone-500 hover:text-emerald-700">
            <Link href="/stats" aria-label="독서성향으로">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-bold sm:text-2xl">
            {year}년 {month}월 독서
          </h1>
        </div>
        <RecapPageMonthSwitcher year={year} month={month} />
      </div>

      {result!.isGuest && (
        <GuestAlert variant="compact" message="샘플 독서 데이터를 미리보고 있어요" />
      )}

      <MonthlyBooksShowcase result={result!} variant="full" yearMonth={yearMonth} />
    </div>
  );
}
