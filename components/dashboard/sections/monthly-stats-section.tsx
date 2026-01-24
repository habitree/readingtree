import { getMonthlyStats } from "@/app/actions/stats";
import { getCurrentUser } from "@/app/actions/auth";
import { MonthlyStatsCard } from "../monthly-stats-card";

/**
 * 월별 통계 섹션 (Streaming SSR)
 */
export async function MonthlyStatsSection() {
  const user = await getCurrentUser();
  const isGuest = !user;
  const monthly = await getMonthlyStats(user);

  return <MonthlyStatsCard monthlyData={monthly} isGuest={isGuest} />;
}
