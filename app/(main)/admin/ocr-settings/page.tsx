import { isAdmin } from "@/app/actions/auth";
import { getAPIKeyStatus } from "@/app/actions/ai/settings";
import {
  getActiveOcrCorrectionSettings,
  getOcrCorrectionStats,
} from "@/app/actions/ai/ocr-settings";
import { OcrSettingsPanel } from "@/components/admin/ocr-settings-panel";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "OCR 보정 설정 | 관리자",
  description: "OCR 텍스트 자동 보정 AI 모델 및 파라미터 설정",
};

export default async function OcrSettingsPage() {
  // 관리자 권한 확인
  const admin = await isAdmin();

  if (!admin) {
    redirect("/");
  }

  // 데이터 로드
  const [settings, stats, apiKeyStatus] = await Promise.all([
    getActiveOcrCorrectionSettings().catch(() => null),
    getOcrCorrectionStats().catch(() => null),
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

      <OcrSettingsPanel
        initialSettings={settings}
        initialStats={stats}
        apiKeyStatus={apiKeyStatus}
      />
    </div>
  );
}
