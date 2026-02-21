import { Suspense } from "react";
import { notFound } from "next/navigation";
import { GroupDashboard } from "@/components/groups/group-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { getGroupDetail } from "@/app/actions/groups";
import { getCachedCurrentUser } from "@/lib/cached";
import { isValidUUID } from "@/lib/utils/validation";
import { sanitizeErrorForLogging } from "@/lib/utils/validation";

interface GroupDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * 모임 대시보드 페이지
 * US-036: 모임 대시보드
 */
export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  // Next.js 15+ 에서 params는 Promise일 수 있음
  const resolvedParams = await params;
  
  // params.id 검증
  if (!resolvedParams?.id || typeof resolvedParams.id !== 'string') {
    notFound();
  }

  // UUID 검증
  if (!isValidUUID(resolvedParams.id)) {
    notFound();
  }

  let groupData;
  let currentUser;
  try {
    [groupData, currentUser] = await Promise.all([
      getGroupDetail(resolvedParams.id),
      getCachedCurrentUser(),
    ]);
  } catch (error) {
    const safeError = sanitizeErrorForLogging(error);
    console.error("모임 상세 조회 오류:", safeError);
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <GroupDashboard groupData={groupData} currentUserId={currentUser?.id} />
    </Suspense>
  );
}

