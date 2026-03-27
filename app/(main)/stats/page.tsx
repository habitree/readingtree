import { Metadata } from "next";
import { getCachedCurrentUser, getCachedPersonaDashboardData } from "@/lib/cached";
import {
  getReadingStats,
  getMonthlyStats,
  getWeeklyProgress,
  getGoalProgress,
} from "@/app/actions/stats";
import { getUserTagsWithCount } from "@/app/actions/notes";
import { getDailyRecordsForCalendar } from "@/app/actions/stats";
import {
  getSamplePersonaDashboardData,
  getSampleReadingStats,
  getSampleMonthlyStats,
  getSampleWeeklyProgress,
  getSampleGoalProgress,
  getSampleDailyRecordsForCalendar,
  getSampleUserTagsWithCount,
} from "@/app/actions/sample";
import { PageHeader } from "@/components/layout/page-header";
import { StatsContent } from "@/components/stats/stats-content";
import { GuestAlert } from "@/components/ui/guest-alert";
import { PersonaCard } from "@/components/persona/persona-card";
import { ReadingStats } from "@/components/persona/reading-stats";

export const metadata: Metadata = {
  title: "독서성향 | ReadTree",
  description: "나의 독서 성향과 통계를 한눈에 확인하세요",
};

export default async function StatsPage() {
  const user = await getCachedCurrentUser();
  const isGuest = !user;

  // 12주(약 3개월)치 캘린더 데이터
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 84); // 12주

  // 게스트: 샘플 데이터, 로그인 사용자: 실제 데이터
  const [readingStats, monthlyStats, weeklyProgress, goalProgress, topTags, dailyRecords, personaData] =
    isGuest
      ? await Promise.all([
          getSampleReadingStats(),
          getSampleMonthlyStats(),
          getSampleWeeklyProgress(),
          getSampleGoalProgress(),
          getSampleUserTagsWithCount(),
          getSampleDailyRecordsForCalendar(startDate, endDate),
          getSamplePersonaDashboardData(),
        ])
      : await Promise.all([
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

      {isGuest && (
        <GuestAlert
          variant="compact"
          message="샘플 독서 성향 데이터를 미리보고 있어요"
        />
      )}

      {/* 독서 페르소나 섹션 */}
      <PersonaCard
        persona={personaData.persona}
        needsAnalysis={personaData.needsAnalysis}
        analysisAge={personaData.analysisAge ?? 0}
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
