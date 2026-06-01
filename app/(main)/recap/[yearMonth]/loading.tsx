export default function Loading() {
  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
        <div className="h-8 w-32 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
      </div>

      {/* 히어로 */}
      <div className="h-44 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />

      {/* 책 그리드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="space-y-2 p-2">
            <div className="aspect-[3/4] animate-pulse rounded-lg bg-stone-200 dark:bg-stone-800" />
            <div className="h-3.5 w-3/4 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
