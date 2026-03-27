import { Metadata } from "next";
import { getCachedCurrentUser } from "@/lib/cached";
import { getPointsDashboardData, getDailyMissions, getPointTransactions } from "@/app/actions/points";
import { PointsPageContent } from "@/components/points/points-page-content";
import { GuestAlert } from "@/components/ui/guest-alert";

export const metadata: Metadata = {
  title: "포인트 | ReadTree",
  description: "나의 포인트 현황과 내역을 확인하세요",
};

export default async function PointsPage() {
  const user = await getCachedCurrentUser();
  const isGuest = !user;

  const [dashboardData, missions, transactions] = await Promise.all([
    getPointsDashboardData(user),
    getDailyMissions(user),
    getPointTransactions({ limit: 20 }, user),
  ]);

  return (
    <>
      {isGuest && (
        <div className="mb-4">
          <GuestAlert
            variant="compact"
            message="포인트 시스템을 미리보고 있어요"
          />
        </div>
      )}
      <PointsPageContent
        dashboardData={dashboardData}
        missions={missions}
        transactions={transactions}
      />
    </>
  );
}
