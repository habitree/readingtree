import { Suspense } from "react";
import { GroupsContent } from "@/components/groups/groups-content";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { typography } from "@/lib/design-tokens";

/**
 * 모임 목록 페이지
 * US-033, US-034: 모임 생성 및 참여 신청
 */
export default function GroupsPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={typography.pageTitle}>독서모임</h1>
          <p className={typography.pageDescription}>
            함께 읽고 기록을 공유하는 독서모임에 참여하세요
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/groups/new">
            <Plus className="mr-2 h-4 w-4" />
            모임 만들기
          </Link>
        </Button>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        }
      >
        <GroupsContent />
      </Suspense>
    </div>
  );
}

