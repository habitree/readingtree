import { Suspense } from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCachedCurrentUser, getCachedPersonaDashboardData } from "@/lib/cached";
import {
  getReadingStats,
  getMonthlyStats,
  getWeeklyProgress,
  getGoalProgress,
} from "@/app/actions/stats";
import { getUserTagsWithCount } from "@/app/actions/notes";
import { getDailyRecordsForCalendar } from "@/app/actions/stats";
import { getSamplePersonaDashboardData } from "@/app/actions/sample";
import { PageHeader } from "@/components/layout/page-header";
import { StatsContent } from "@/components/stats/stats-content";
import { PersonaCard, PersonaCardSkeleton } from "@/components/persona/persona-card";
import { ReadingStats, ReadingStatsSkeleton } from "@/components/persona/reading-stats";

export const metadata: Metadata = {
  title: "독서성향 | ReadTree",
  description: "나의 독서 성향과 통계를 한눈에 확인하세요",
};

export default async function StatsPage() {
  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");

  // 12주(약 3개월)치 캘린더 데이터
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 84); // 12주

  // 병렬 데이터 로드 (통계 + 페르소나)
  const [readingStats, monthlyStats, weeklyProgress, goalProgress, topTags, dailyRecords, personaData] =
    await Promise.all([
      getReadingStats(user),
      getMonthlyStats(user),
      getWeeklyProgress(user),
      getGoalProgress(user),
      getUserTagsWithCount(user),
      getDailyRecordsForCalendar(user, startDate, endDate),
      getCachedPersonaDashboardData(),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader titleKey="persona.pageTitle" descriptionKey="persona.pageDesc" />

      {/* 독서 페르소나 섹션 */}
      <PersonaCard
        persona={personaData.persona}
        needsAnalysis={personaData.needsAnalysis}
        analysisAge={personaData.analysisAge}
      />
      <ReadingStats persona={personaData.persona} />

      {/* 통계 섹션 */}
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
