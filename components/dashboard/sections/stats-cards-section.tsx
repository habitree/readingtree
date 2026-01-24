import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getReadingStats } from "@/app/actions/stats";
import { getCurrentUser } from "@/app/actions/auth";
import { FileText, Award, TrendingUp } from "lucide-react";

/**
 * 통계 카드 섹션 (Streaming SSR)
 */
export async function StatsCardsSection() {
  const user = await getCurrentUser();
  const readingStats = await getReadingStats(user);

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2 sm:pb-3">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="rounded-lg bg-blue-500/10 p-1.5 sm:p-2">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            </div>
            <CardDescription className="text-xs sm:text-sm font-medium">이번 주 기록</CardDescription>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            {readingStats?.thisWeek.notes ?? 0}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-2 sm:pb-3">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="rounded-lg bg-green-500/10 p-1.5 sm:p-2">
              <Award className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            </div>
            <CardDescription className="text-xs sm:text-sm font-medium">올해 완독</CardDescription>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            {readingStats?.thisYear.completedBooks ?? 0}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-2 sm:pb-3">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="rounded-lg bg-purple-500/10 p-1.5 sm:p-2">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
            </div>
            <CardDescription className="text-xs sm:text-sm font-medium">올해 기록</CardDescription>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            {readingStats?.thisYear.notes ?? 0}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
