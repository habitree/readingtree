import { isAdmin } from "@/app/actions/auth";
import { getActiveAISettings, getAPIKeyStatus } from "@/app/actions/ai/settings";
import { AISettingsPanel } from "@/components/admin/ai-settings-panel";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "AI 챗봇 설정 | 관리자",
  description: "AI 독서 도우미의 모델, 프롬프트, 동작 방식 설정",
};

export default async function AISettingsPage() {
  // 관리자 권한 확인
  const admin = await isAdmin();

  if (!admin) {
    redirect("/");
  }

  // 데이터 로드
  const [settings, apiKeyStatus] = await Promise.all([
    getActiveAISettings(),
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

      <AISettingsPanel initialSettings={settings} apiKeyStatus={apiKeyStatus} />
    </div>
  );
}
