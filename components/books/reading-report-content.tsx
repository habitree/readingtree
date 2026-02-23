"use client";

import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, RefreshCw, FileText, Calendar, BookOpen } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { ReadingReportSkeleton } from "./reading-report-skeleton";
import { generateReadingReport } from "@/app/actions/ai/report";
import { useTranslation } from "@/lib/i18n";
import type { ReadingReportResult } from "@/types/ai";

interface ReadingReportContentProps {
  userBookId: string;
  bookTitle: string;
  noteCount: number;
}

export function ReadingReportContent({
  userBookId,
  bookTitle,
  noteCount,
}: ReadingReportContentProps) {
  const { t } = useTranslation();
  const [result, setResult] = useState<ReadingReportResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchReport = () => {
    startTransition(async () => {
      const res = await generateReadingReport(userBookId);
      setResult(res);
    });
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userBookId]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href={`/books/${userBookId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">
            {t("books.aiReportTitle")}
          </h1>
          <p className="text-sm text-muted-foreground truncate">{bookTitle}</p>
        </div>
      </div>

      {/* 로딩 상태 */}
      {isPending && <ReadingReportSkeleton />}

      {/* 에러 상태 */}
      {!isPending && result && !result.success && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center space-y-4">
          <p className="text-sm text-destructive font-medium">
            {result.error || t("books.aiReportError")}
          </p>
          <Button variant="outline" size="sm" onClick={fetchReport}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            {t("books.aiReportRegenerate")}
          </Button>
        </div>
      )}

      {/* 성공: 리포트 표시 */}
      {!isPending && result?.success && result.report && (
        <>
          {/* 메타 정보 */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {t("books.aiReportBasedOn", { count: result.noteCount ?? noteCount })}
            </span>
            {result.generatedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(result.generatedAt).toLocaleString("ko-KR")}
              </span>
            )}
          </div>

          {/* 마크다운 리포트 */}
          <article className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-base prose-blockquote:border-primary/30 prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg">
            <ReactMarkdown>{result.report}</ReactMarkdown>
          </article>

          {/* 하단 액션 */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/books/${userBookId}`}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                {t("common.back")}
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={fetchReport}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              {t("books.aiReportRegenerate")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
