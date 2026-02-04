"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatSmartDate } from "@/lib/utils/date";
import { TrendingUp, ChevronRight, Clock } from "lucide-react";
import type { NoteWithBook } from "@/types/note";

interface ProgressLogListProps {
  userBookId: string;
}

/**
 * 진행 로그 전용 목록 컴포넌트
 * progress 타입의 기록만 필터링하여 컴팩트하게 표시
 */
export function ProgressLogList({ userBookId }: ProgressLogListProps) {
  const [logs, setLogs] = useState<NoteWithBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProgressLogs() {
      try {
        const { getNotes } = await import("@/app/actions/notes");
        // userBookId로 해당 책의 기록 조회 후 progress 타입만 필터링
        const allNotes = await getNotes(userBookId, "progress");
        setLogs(allNotes);
      } catch (error) {
        console.error("진행 로그 조회 오류:", error);
        setLogs([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProgressLogs();
  }, [userBookId]);

  if (isLoading) {
    return <ProgressLogListSkeleton />;
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="진행 기록이 없습니다"
        description="읽기 진행률을 업데이트하면 자동으로 기록됩니다"
        variant="encouraging"
      />
    );
  }

  // 페이지 번호 파싱 헬퍼
  const parsePageNumber = (pageNumber: string | null): number | null => {
    if (!pageNumber) return null;
    const num = parseInt(pageNumber, 10);
    return isNaN(num) ? null : num;
  };

  // content에서 memo 추출 헬퍼
  const extractMemo = (content: string | null): string | null => {
    if (!content) return null;
    try {
      const parsed = JSON.parse(content);
      return parsed?.memo || null;
    } catch {
      return content;
    }
  };

  return (
    <div className="space-y-2">
      {logs.map((log) => {
        const pageNumber = parsePageNumber(log.page_number);
        const memo = extractMemo(log.content);

        return (
          <Link key={log.id} href={`/notes/${log.id}`}>
            <Card className="hover:shadow-md active:scale-[0.99] transition-all cursor-pointer border-teal-200/30 dark:border-teal-800/30 hover:border-teal-300/50 dark:hover:border-teal-700/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {/* 페이지 번호 아이콘 */}
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-900/50 dark:to-teal-800/30 flex items-center justify-center">
                    {pageNumber ? (
                      <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
                        {pageNumber}
                      </span>
                    ) : (
                      <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    )}
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {pageNumber && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-5 px-1.5 bg-teal-100/50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-0"
                        >
                          p.{pageNumber}
                        </Badge>
                      )}
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatSmartDate(log.created_at)}
                      </span>
                    </div>
                    {memo && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {memo}
                      </p>
                    )}
                  </div>

                  {/* 화살표 */}
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

/**
 * 진행 로그 목록 스켈레톤
 */
function ProgressLogListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-muted/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-3 w-3/4" />
              </div>
              <Skeleton className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
