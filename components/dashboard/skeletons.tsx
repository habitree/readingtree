import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 홈 히어로 스켈레톤
 * Stitch 스타일: 그래디언트 히어로 + 2열 통계 + 주간 달성
 */
export function HomeHeroSkeleton() {
  return (
    <div className="space-y-2 sm:space-y-3">
      {/* 히어로 카드 스켈레톤 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#eafdf5] to-[#f4fbf8] dark:from-forest-950/40 dark:to-slate-900 border border-forest-200/40 dark:border-forest-800/30">
        <div className="px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-3">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48 rounded" />
                <Skeleton className="h-4 w-40 rounded" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg shrink-0" />
          </div>
        </div>
      </div>

      {/* 2열 통계 카드 스켈레톤 */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="p-3 sm:p-4 border-slate-200/60 dark:border-slate-800/60">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-6 w-12 rounded" />
              <div className="flex items-end gap-0.5 h-4">
                {Array.from({ length: 7 }).map((_, j) => (
                  <Skeleton key={j} className="flex-1 h-2 rounded-t-sm" />
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 주간 달성 스켈레톤 */}
      <Card className="px-4 py-3 sm:px-5 sm:py-4 border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-12 rounded" />
        </div>
        <div className="flex justify-between items-center">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
              <Skeleton className="h-2.5 w-3 rounded" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          ))}
        </div>
      </Card>

      {/* 계속 읽기 스켈레톤 */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-16 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-12 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-1.5 w-full rounded mt-2" />
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * 최근 기록한 책 스켈레톤
 */
export function RecentBooksSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[3/4] rounded-lg" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2 w-12" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 최근 기록 스켈레톤
 */
export function RecentNotesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
