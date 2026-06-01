import { Metadata } from "next";
import { getCachedCurrentUser, getCachedPersonaDashboardData } from "@/lib/cached";
import {
  getReadingStats,
  getMonthlyStats,
  getWeeklyProgress,
  getGoalProgress,
  getDailyRecordsForCalendar,
} from "@/app/actions/stats";
import { getUserTagsWithCount } from "@/app/actions/notes";
import { getUserReadingTimeStats } from "@/app/actions/progress";
import {
  getSamplePersonaDashboardData,
  getSampleReadingStats,
  getSampleMonthlyStats,
  getSampleWeeklyProgress,
  getSampleGoalProgress,
  getSampleDailyRecordsForCalendar,
  getSampleUserTagsWithCount,
  getSampleReadingTimeStats,
} from "@/app/actions/sample";
import { PageHeader } from "@/components/layout/page-header";
import { StatsContent } from "@/components/stats/stats-content";
import { GuestAlert } from "@/components/ui/guest-alert";
import { PersonaCard } from "@/components/persona/persona-card";
import { ReadingStats } from "@/components/persona/reading-stats";
import { RecapSection } from "@/components/recap/recap-section";
import { getRecapForView } from "@/app/actions/recap/generate";

export const metadata: Metadata = {
  title: "독서성향 | ReadTree",
  description: "나의 독서 성향과 통계를 한눈에 확인하세요",
};

/** ?m=YYYY-MM 파싱 → 유효하면 {year, month}, 아니면 현재 KST 월 */
function resolveRecapMonth(m: string | undefined): { year: number; month: number } {
  if (m && /^\d{4}-\d{2}$/.test(m)) {
    const [y, mo] = m.split("-").map(Number);
    if (mo >= 1 && mo <= 12) return { year: y, month: mo };
  }
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return { year: kst.getUTCFullYear(), month: kst.getUTCMonth() + 1 };
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams?: Promise<{ m?: string }>;
}) {
  const user = await getCachedCurrentUser();
  const isGuest = !user;

  const { year: recapYear, month: recapMonth } = resolveRecapMonth((await searchParams)?.m);
  const recapView = await getRecapForView(recapYear, recapMonth);

  // 12주(약 3개월)치 캘린더 데이터
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 84); // 12주

  // 게스트: 샘플 데이터, 로그인 사용자: 실제 데이터
  const [readingStats, monthlyStats, weeklyProgress, goalProgress, topTags, dailyRecords, personaData, readingTimeStats] =
    isGuest
      ? await Promise.all([
          getSampleReadingStats(),
          getSampleMonthlyStats(),
          getSampleWeeklyProgress(),
          getSampleGoalProgress(),
          getSampleUserTagsWithCount(),
          getSampleDailyRecordsForCalendar(startDate, endDate),
          getSamplePersonaDashboardData(),
          getSampleReadingTimeStats(),
        ])
      : await Promise.all([
          getReadingStats(user),
          getMonthlyStats(user),
          getWeeklyProgress(user),
          getGoalProgress(user),
          getUserTagsWithCount(user),
          getDailyRecordsForCalendar(user, startDate, endDate),
          getCachedPersonaDashboardData(),
          getUserReadingTimeStats(),
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

      {/* 월간 독서결산 섹션 */}
      {recapView && <RecapSection initialView={recapView} />}

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
        readingTimeStats={readingTimeStats}
      />
    </div>
  );
}
