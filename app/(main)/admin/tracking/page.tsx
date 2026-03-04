import { isAdmin } from "@/app/actions/auth";
import {
  getTrackingSummary,
  getLoginLogs,
  getAccessLogs,
  getPageViewRanking,
  getIPActivitySummary,
} from "@/app/actions/admin";
import { TrackingDashboard } from "@/components/admin/tracking-dashboard";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "접속 추적 | 관리자 | ReadingTree",
  description: "IP별 접속/로그인 기록 조회",
};

export default async function TrackingPage() {
  const admin = await isAdmin();
  if (!admin) {
    redirect("/");
  }

  const [summary, loginLogs, accessLogs, pageRanking, ipActivity] =
    await Promise.all([
      getTrackingSummary(),
      getLoginLogs(100),
      getAccessLogs(200),
      getPageViewRanking(),
      getIPActivitySummary(),
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
      />
    </div>
  );
}
