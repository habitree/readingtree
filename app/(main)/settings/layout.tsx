import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCachedCurrentUser } from "@/lib/cached";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";

export const metadata: Metadata = {
  title: "설정 | ReadTree",
  description: "계정과 알림, 프라이버시를 관리해요.",
};

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        titleKey="settings.pageTitle"
        descriptionKey="settings.pageDesc"
      />
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <SettingsNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
