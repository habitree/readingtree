import type { Metadata } from "next";
import { Suspense } from "react";
import { GroupsContent } from "@/components/groups/groups-content";
import { Skeleton } from "@/components/ui/skeleton";
import { GroupsPageHeader } from "./groups-page-header";

export const metadata: Metadata = {
  title: "독서 모임",
  description: "함께 읽고 기록을 나누는 독서 모임",
};

/**
 * 모임 목록 페이지
 * US-033, US-034: 모임 생성 및 참여 신청
 */
export default function GroupsPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <GroupsPageHeader />

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

