"use client";

import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/lib/i18n";

export function ReadingReportSkeleton() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 로딩 헤더 */}
      <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/10">
        <Sparkles className="h-5 w-5 text-primary animate-pulse" />
        <p className="text-sm font-medium text-primary">
          {t("books.aiReportGenerating")}
        </p>
      </div>

      {/* 섹션 스켈레톤 6개 */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          {i === 2 && (
            <div className="ml-4 space-y-2 border-l-2 border-muted pl-4">
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/6" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
