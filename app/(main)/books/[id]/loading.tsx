import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

/**
 * 책 상세 페이지 로딩 스켈레톤
 * Next.js의 loading.tsx 규약을 따라 페이지 전환 시 자동으로 표시됨
 */
export default function BookDetailLoading() {
  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 pb-8 animate-in fade-in duration-300">
      {/* Hero Section 스켈레톤 */}
      <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100/80 to-slate-50/80 dark:from-slate-800/50 dark:to-slate-900/50">
        <div className="relative p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
            {/* 책 표지 스켈레톤 */}
            <div className="flex flex-col items-center lg:items-start shrink-0">
              <Skeleton className="w-36 h-48 sm:w-44 sm:h-60 lg:w-48 lg:h-64 rounded-lg sm:rounded-xl" />
              <Skeleton className="mt-3 h-6 w-20 rounded-full lg:hidden" />
            </div>

            {/* 책 정보 스켈레톤 */}
            <div className="flex-1 flex flex-col text-center lg:text-left min-w-0 space-y-4">
              {/* 상태 배지 - PC */}
              <Skeleton className="hidden lg:block h-6 w-24 rounded-full" />

              {/* 제목 & 저자 */}
              <div className="space-y-2">
                <Skeleton className="h-8 w-64 mx-auto lg:mx-0" />
                <Skeleton className="h-5 w-32 mx-auto lg:mx-0" />
              </div>

              {/* 메타 정보 그리드 - PC */}
              <div className="hidden lg:grid grid-cols-2 gap-3">
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-12 rounded-lg" />
              </div>

              {/* 읽기 진행률 카드 */}
              <Card className="border-slate-200/50 dark:border-slate-700/50">
                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-9 flex-1 rounded-md" />
                      <Skeleton className="h-9 w-24 rounded-md" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 액션 버튼 */}
              <div className="flex gap-2 flex-wrap justify-center lg:justify-start mt-auto">
                <Skeleton className="h-9 w-28 rounded-md" />
                <Skeleton className="h-9 w-20 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 메타 정보 */}
      <div className="lg:hidden">
        <Card className="border-muted/50">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 읽는 이유 카드 스켈레톤 */}
      <Card className="border-none bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50">
        <CardContent className="p-4 sm:p-5 pl-5 sm:pl-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-16 w-full rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* 기록 목록 스켈레톤 */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-7 w-12" />
          </div>
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>

        {/* 탭 스켈레톤 */}
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>

        {/* 기록 카드 스켈레톤 */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-muted/50">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
