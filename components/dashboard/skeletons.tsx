import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 홈 히어로 스켈레톤
 * 5초 규칙 기반 레이아웃: 3열 지표 + 인라인 주간 바 + 2열 그리드
 */
export function HomeHeroSkeleton() {
  return (
    <div className="space-y-3">
      {/* Primary Zone: 메인 히어로 카드 */}
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="p-4 sm:p-6">
          {/* 인사말 */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-7 w-7 rounded" />
              <Skeleton className="h-6 w-48 rounded" />
            </div>
            <Skeleton className="h-4 w-56 rounded ml-9" />
          </div>

          {/* 3열 퀵 스탯 */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 space-y-2">
                <Skeleton className="h-6 w-10 mx-auto rounded" />
                <Skeleton className="h-3 w-12 mx-auto rounded" />
              </div>
            ))}
          </div>

          {/* 인라인 주간 바 */}
          <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-3 w-10 rounded" />
            </div>
            <div className="flex justify-between gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <Skeleton className="h-2.5 w-3 rounded" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Secondary Zone: 2열 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

        {/* 진행 체크 스켈레톤 */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 p-2.5">
                <Skeleton className="w-8 h-8 rounded-md shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
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
