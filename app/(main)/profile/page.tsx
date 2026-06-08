import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileContent } from "@/components/profile/profile-content";
import { ReadingSpeedCard } from "@/components/profile/reading-speed-card";
import { PageHeader } from "@/components/layout/page-header";
import { SubscriptionCtaCard } from "@/components/subscription/subscription-cta-card";
import { getCachedCurrentUser } from "@/lib/cached";
import { getProfile } from "@/app/actions/profile";
import { getUserSubscriptionTier } from "@/app/actions/subscription";
import { getUserPoints } from "@/app/actions/points";

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

  const [tier, userPoints] = await Promise.all([
    getUserSubscriptionTier(user.id).catch(() => "free" as const),
    getUserPoints().catch(() => null),
  ]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader titleKey="profile.pageTitle" descriptionKey="profile.pageDesc" />
      <SubscriptionCtaCard tier={tier} points={userPoints?.total_points} />
      <ReadingSpeedCard />
      <ProfileContent initialProfile={profile} />
    </div>
  );
}
