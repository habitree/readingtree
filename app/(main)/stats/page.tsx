import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCachedCurrentUser } from "@/lib/cached";
import {
  getReadingStats,
  getMonthlyStats,
  getWeeklyProgress,
  getGoalProgress,
} from "@/app/actions/stats";
import { getUserTagsWithCount } from "@/app/actions/notes";
import { getDailyRecordsForCalendar } from "@/app/actions/stats";
import { PageHeader } from "@/components/layout/page-header";
import { StatsContent } from "@/components/stats/stats-content";

export const metadata: Metadata = {
  title: "통계 | ReadTree",
  description: "나의 독서 통계를 한눈에 확인하세요",
};

export default async function StatsPage() {
  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");

  // 12주(약 3개월)치 캘린더 데이터
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 84); // 12주

  // 병렬 데이터 로드
  const [readingStats, monthlyStats, weeklyProgress, goalProgress, topTags, dailyRecords] =
    await Promise.all([
      getReadingStats(user),
      getMonthlyStats(user),
      getWeeklyProgress(user),
      getGoalProgress(user),
      getUserTagsWithCount(user),
      getDailyRecordsForCalendar(user, startDate.toISOString(), endDate.toISOString()),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader titleKey="stats.pageTitle" descriptionKey="stats.pageDescription" />
      <StatsContent
        readingStats={readingStats}
        monthlyStats={monthlyStats}
        weeklyProgress={weeklyProgress}
        goalProgress={goalProgress}
        topTags={topTags.slice(0, 10)}
        dailyRecords={dailyRecords}
      />
    </div>
  );
}
