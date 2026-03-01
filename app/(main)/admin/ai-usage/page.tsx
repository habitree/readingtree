import { isAdmin } from "@/app/actions/auth";
import {
  getAIUsageSummary,
  getAIUsageByUser,
  getAIUsageMonthlyTrend,
} from "@/app/actions/admin";
import { AIUsageDashboard } from "@/components/admin/ai-usage-dashboard";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "AI/OCR 사용량 통계 | 관리자 | ReadingTree",
  description: "AI 채팅, OCR, 리포트의 사용자별 사용량 및 비용 통계",
};

export default async function AIUsagePage() {
  const admin = await isAdmin();
  if (!admin) {
    redirect("/");
  }

  const [summary, userUsage, monthlyTrend] = await Promise.all([
    getAIUsageSummary(),
    getAIUsageByUser(),
    getAIUsageMonthlyTrend(),
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
      <AIUsageDashboard
        summary={summary}
        userUsage={userUsage}
        monthlyTrend={monthlyTrend}
      />
    </div>
  );
}
