import { isAdmin } from "@/app/actions/auth";
import { getAPIKeyStatus } from "@/app/actions/ai/settings";
import { getReportSettingsExtended } from "@/app/actions/ai/report-settings";
import { getReportTemplates } from "@/app/actions/ai/report-templates";
import { getReportUsageStats } from "@/app/actions/ai/report-analytics";
import { ReportSettingsPanel } from "@/components/admin/report-settings-panel";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "AI 리포트 설정 | 관리자",
  description: "AI 독서 리포트 양식 미리보기, 생성 설정 및 템플릿 관리",
};

export default async function ReportSettingsPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/");

  const [settings, templates, stats, apiKeyStatus] = await Promise.all([
    getReportSettingsExtended().catch(() => null),
    getReportTemplates().catch(() => []),
    getReportUsageStats().catch(() => null),
    getAPIKeyStatus(),
  ]);

  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          관리자 대시보드로 돌아가기
        </Link>
      </div>

      <ReportSettingsPanel
        initialSettings={settings}
        initialTemplates={templates}
        initialStats={stats}
        apiKeyStatus={apiKeyStatus}
      />
    </div>
  );
}
