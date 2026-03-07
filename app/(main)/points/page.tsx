import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCachedCurrentUser } from "@/lib/cached";
import { getPointsDashboardData, getDailyMissions, getUserRank, getPointTransactions } from "@/app/actions/points";
import { PointsPageContent } from "@/components/points/points-page-content";

export const metadata: Metadata = {
  title: "포인트 | ReadTree",
  description: "나의 포인트 현황과 내역을 확인하세요",
};

export default async function PointsPage() {
  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");

  const [dashboardData, missions, rank, transactions] = await Promise.all([
    getPointsDashboardData(user),
    getDailyMissions(user),
    getUserRank(user),
    getPointTransactions({ limit: 20 }, user),
  ]);

  return (
    <PointsPageContent
      dashboardData={dashboardData}
      missions={missions}
      rank={rank}
      transactions={transactions}
    />
  );
}
