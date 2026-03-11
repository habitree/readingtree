import { isAdmin } from "@/app/actions/auth";
import {
  getTrackingSummary,
  getLoginLogs,
  getAccessLogs,
  getPageViewRanking,
  getIPActivitySummary,
  getDailyTrends,
  getRecentSignups,
  getMenuUsageAnalysis,
} from "@/app/actions/admin";
import { TrackingDashboard } from "@/components/admin/tracking-dashboard";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "접속 추적 | 관리자 | ReadingTree",
  description: "사용자 접속 추적, 회원가입 분석, 메뉴 사용 현황",
};

export default async function TrackingPage() {
  const admin = await isAdmin();
  if (!admin) {
    redirect("/");
  }

  const [summary, loginLogs, accessLogs, pageRanking, ipActivity, dailyTrends, recentSignups, menuUsage] =
    await Promise.all([
      getTrackingSummary(),
      getLoginLogs(100),
      getAccessLogs(200),
      getPageViewRanking(),
      getIPActivitySummary(),
      getDailyTrends(14),
      getRecentSignups(30),
      getMenuUsageAnalysis(),
    ]);

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          관리자 대시보드로 돌아가기
        </Link>
      </div>
      <TrackingDashboard
        summary={summary}
        loginLogs={loginLogs}
        accessLogs={accessLogs}
        pageRanking={pageRanking}
        ipActivity={ipActivity}
        dailyTrends={dailyTrends}
        recentSignups={recentSignups}
        menuUsage={menuUsage}
      />
    </div>
  );
}
