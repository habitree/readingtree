import { Skeleton } from "@/components/ui/skeleton";

export default function PointsLoading() {
  return (
    <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
