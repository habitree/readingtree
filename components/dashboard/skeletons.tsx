import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 홈 히어로 스켈레톤
 */
export function HomeHeroSkeleton() {
  return (
    <div className="space-y-3">
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="p-4 sm:p-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-7 w-7 rounded" />
              <Skeleton className="h-6 w-48 rounded" />
            </div>
            <Skeleton className="h-4 w-56 rounded ml-9" />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 space-y-2">
                <Skeleton className="h-6 w-12 mx-auto rounded" />
                <Skeleton className="h-3 w-16 mx-auto rounded" />
              </div>
            ))}
          </div>
        </div>
      </Card>
      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-1.5 w-full rounded" />
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * 목표 진행률 스켈레톤
 */
export function GoalProgressSkeleton() {
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
        <Skeleton className="h-3 w-full mb-3" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 통계 카드 스켈레톤
 */
export function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-l-4 border-l-muted">
          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg" />
              <Skeleton className="h-3 w-16 sm:h-4 sm:w-20" />
            </div>
            <Skeleton className="h-8 w-12 sm:h-10 sm:w-16" />
          </CardHeader>
        </Card>
      ))}
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
 * 월별 통계 차트 스켈레톤
 */
export function MonthlyStatsSkeleton() {
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
        <Skeleton className="h-[300px] w-full rounded-lg" />
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

/**
 * 가장 많이 기록한 책 스켈레톤
 */
export function TopBooksSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
