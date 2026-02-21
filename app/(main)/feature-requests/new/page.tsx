import { redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FeatureRequestForm } from "@/components/feature-requests";
import { getCachedCurrentUser } from "@/lib/cached";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "새 기능 요청 | Habitree Reading Hub",
  description: "새로운 기능을 요청해주세요.",
};

export default async function NewFeatureRequestPage() {
  const currentUser = await getCachedCurrentUser();

  // 로그인 확인
  if (!currentUser) {
    redirect("/login?redirect=/feature-requests/new");
  }

  return (
    <div className="container max-w-xl py-6 space-y-6">
      {/* 뒤로가기 */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/feature-requests" className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Link>
      </Button>

      <FeatureRequestForm mode="create" />
    </div>
  );
}
