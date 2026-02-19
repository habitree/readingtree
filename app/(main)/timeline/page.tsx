import type { Metadata } from "next";
import { Suspense } from "react";
import { TimelineContent } from "@/components/timeline/timeline-content";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "타임라인",
  description: "시간순으로 독서 기록을 살펴보세요",
};

/**
 * 타임라인 페이지
 * US-029, US-032: 독서 타임라인 조회 및 정렬
 */
export default async function TimelinePage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader titleKey="timeline.pageTitle" descriptionKey="timeline.pageDesc" />

      <Suspense
        fallback={
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        }
      >
        <TimelineContent />
      </Suspense>
    </div>
  );
}

