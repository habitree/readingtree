import { Skeleton } from "@/components/ui/skeleton";

/**
 * 탐색 페이지 로딩 스켈레톤
 */
export default function ExploreLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* PageHeader 스켈레톤 */}
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>

      {/* 정렬 탭 스켈레톤 */}
      <Skeleton className="h-10 w-[240px] rounded-lg" />

      {/* 카드 그리드 스켈레톤 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="border rounded-xl p-4 bg-card space-y-3"
          >
            {/* 작성자 */}
            <div className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
            {/* 콘텐츠 */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            {/* 태그 + 좋아요 */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                <Skeleton className="h-4 w-12 rounded-full" />
                <Skeleton className="h-4 w-10 rounded-full" />
              </div>
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
