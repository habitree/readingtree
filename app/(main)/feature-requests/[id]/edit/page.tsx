import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FeatureRequestForm } from "@/components/feature-requests";
import { getFeatureRequestById } from "@/app/actions/feature-requests";
import { getCachedCurrentUser } from "@/lib/cached";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata: Metadata = {
  title: "기능 요청 수정 | Habitree Reading Hub",
};

export default async function EditFeatureRequestPage({ params }: PageProps) {
  const { id } = await params;
  const [request, currentUser] = await Promise.all([
    getFeatureRequestById(id),
    getCachedCurrentUser(),
  ]);

  // 로그인 확인
  if (!currentUser) {
    redirect("/login?redirect=/feature-requests/" + id + "/edit");
  }

  // 요청 존재 확인
  if (!request) {
    notFound();
  }

  // 권한 확인
  if (request.user_id !== currentUser.id) {
    redirect("/feature-requests/" + id);
  }

  return (
    <div className="container max-w-xl py-6 space-y-6">
      {/* 뒤로가기 */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/feature-requests/${id}`} className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </Link>
      </Button>

      <FeatureRequestForm
        mode="edit"
        initialData={{
          id: request.id,
          title: request.title,
          description: request.description,
        }}
      />
    </div>
  );
}
