import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileContent } from "@/components/profile/profile-content";
import { PageHeader } from "@/components/layout/page-header";
import { getCachedCurrentUser } from "@/lib/cached";
import { getProfile } from "@/app/actions/profile";

export const metadata: Metadata = {
  title: "프로필",
  description: "프로필을 관리하고 독서 통계를 확인하세요",
};

/**
 * 프로필 페이지
 * US-005: 프로필 관리
 */
export default async function ProfilePage() {
  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");

  let profile;
  try {
    profile = await getProfile();
  } catch {
    profile = null;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader titleKey="profile.pageTitle" descriptionKey="profile.pageDesc" />
      <ProfileContent initialProfile={profile} />
    </div>
  );
}
