"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FeatureRequestStatusBadge } from "./feature-request-status-badge";
import { Lightbulb, ChevronRight, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeatureRequestWithUser } from "@/types/feature-request";

interface FeatureRequestPreviewSectionProps {
  requests: FeatureRequestWithUser[];
  className?: string;
}

/**
 * 홈 화면 기능 요청 프리뷰 섹션
 */
export function FeatureRequestPreviewSection({
  requests,
  className,
}: FeatureRequestPreviewSectionProps) {
  if (requests.length === 0) {
    return null;
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            기능 요청
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/feature-requests" className="flex items-center gap-1">
              전체 보기
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          앱 개선에 참여해주세요!
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {requests.slice(0, 4).map((request) => (
            <Link
              key={request.id}
              href={`/feature-requests/${request.id}`}
              className="block"
            >
              <div className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <FeatureRequestStatusBadge
                    status={request.status}
                    size="sm"
                  />
                </div>
                <h4 className="font-medium text-sm line-clamp-1 mb-1">
                  {request.title}
                </h4>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ThumbsUp className="h-3 w-3" />
                  <span>{request.vote_count}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 프리뷰 섹션 스켈레톤
 */
export function FeatureRequestPreviewSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
          <div className="h-8 w-20 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>
        <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 rounded-lg border">
              <div className="h-4 w-12 rounded bg-slate-200 dark:bg-slate-700 animate-pulse mb-2" />
              <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700 animate-pulse mb-1" />
              <div className="h-3 w-8 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
