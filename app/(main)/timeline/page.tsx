import { Suspense } from "react";
import { TimelineContent } from "@/components/timeline/timeline-content";
import { Skeleton } from "@/components/ui/skeleton";
import { typography } from "@/lib/design-tokens";

/**
 * 타임라인 페이지
 * US-029, US-032: 독서 타임라인 조회 및 정렬
 */
export default async function TimelinePage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className={typography.pageTitle}>타임라인</h1>
        <p className={typography.pageDescription}>
          시간순으로 정리된 독서 기록을 확인하세요
        </p>
      </div>

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

