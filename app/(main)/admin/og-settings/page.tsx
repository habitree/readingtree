import { isAdmin } from "@/app/actions/auth";
import { getActiveOgSettings } from "@/app/actions/admin/og-settings";
import { OgSettingsPanel } from "@/components/admin/og-settings-panel";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "OG 이미지 설정 | 관리자",
  description: "소셜 공유 미리보기 이미지의 브랜드, 색상, 아이콘 설정",
};

export default async function OgSettingsPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/");

  const settings = await getActiveOgSettings().catch(() => null);

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

      <OgSettingsPanel initialSettings={settings} />
    </div>
  );
}
