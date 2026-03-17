import { Skeleton } from "@/components/ui/skeleton";

export default function BookshelvesLoading() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-1">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-20 w-14 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
