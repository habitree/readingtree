import { Skeleton } from "@/components/ui/skeleton";
import { grids } from "@/lib/design-tokens";

/**
 * 책 카드 스켈레톤
 */
export function BookCardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="aspect-[3/4] w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

/**
 * 책 목록 스켈레톤
 * @param count 스켈레톤 개수 (기본: 10)
 */
export function BookListSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className={grids.bookList}>
      {Array.from({ length: count }).map((_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * 노트 카드 스켈레톤
 */
export function NoteCardSkeleton() {
  return (
    <div className="p-3 sm:p-4 border rounded-lg space-y-3">
      <div className="flex gap-3 sm:gap-4">
        <Skeleton className="w-16 h-22 sm:w-20 sm:h-28 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Skeleton className="h-5 sm:h-6 w-12 rounded" />
            <Skeleton className="h-5 sm:h-6 w-24 rounded" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

/**
 * 노트 목록 스켈레톤
 * @param count 스켈레톤 개수 (기본: 6)
 */
export function NoteListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={grids.noteList}>
      {Array.from({ length: count }).map((_, i) => (
        <NoteCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * 페이지 헤더 스켈레톤
 */
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}

/**
 * 테이블 스켈레톤
 * @param rows 행 수 (기본: 5)
 * @param cols 열 수 (기본: 4)
 */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 헤더 */}
      <div className="flex gap-4 p-4 border-b bg-muted/50">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* 행 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b last:border-b-0">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
