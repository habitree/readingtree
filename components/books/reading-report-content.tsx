"use client";

import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReadingReportSkeleton } from "./reading-report-skeleton";
import { ReportSaveButton } from "./report-save-button";
import { ReportShareDialog } from "./report-share-dialog";
import { ShareCardDialog } from "./share-card/share-card-dialog";
import { ReadingReportMagazine } from "./reading-report-magazine";
import { generateReadingReport } from "@/app/actions/ai/report";
import { useTranslation } from "@/lib/i18n";
import { useUpgradeModal, isUpgradeLimitError } from "@/hooks/use-upgrade-modal";
import { parseReportSections } from "@/lib/utils/report-parser";
import type { ReadingReportResult, BookInfoForReport, NoteSummary } from "@/types/ai";
import { cn } from "@/lib/utils";

interface InitialSavedReport {
  markdown: string;
  savedAt: string;
  shareId: string;
  isPublic: boolean;
  noteCount: number;
}

interface ReadingReportContentProps {
  userBookId: string;
  bookTitle: string;
  noteCount: number;
  bookInfo?: BookInfoForReport;
  noteSummaries?: NoteSummary[];
  initialSavedReport?: InitialSavedReport;
  completedCount?: number;
  /** 나의 N번째 책 (완독 순번) */
  bookOrdinal?: number | null;
}

export function ReadingReportContent({
  userBookId,
  bookTitle,
  noteCount,
  bookInfo,
  noteSummaries,
  initialSavedReport,
  completedCount = 0,
  bookOrdinal,
}: ReadingReportContentProps) {
  const { t } = useTranslation();
  const { showUpgradeModal } = useUpgradeModal();

  // 저장된 리포트가 있으면 초기 상태로 사용
  const [result, setResult] = useState<ReadingReportResult | null>(
    initialSavedReport
      ? {
          success: true,
          report: initialSavedReport.markdown,
          noteCount: initialSavedReport.noteCount,
          generatedAt: initialSavedReport.savedAt,
        }
      : null
  );
  const [isPending, startTransition] = useTransition();
  // 저장 버튼과 공유 다이얼로그가 공유하는 shareId
  const [savedShareId, setSavedShareId] = useState<string | null>(
    initialSavedReport?.shareId ?? null
  );

  const fetchReport = () => {
    startTransition(async () => {
      const res = await generateReadingReport(userBookId);
      if (!res.success && res.error && isUpgradeLimitError(res.error)) {
        showUpgradeModal({ feature: "AI 독서 리포트", message: res.error });
        return;
      }
      setResult(res);
    });
  };

  useEffect(() => {
    // 저장된 리포트가 있으면 자동 생성 건너뜀
    if (initialSavedReport) return;
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userBookId]);

  // 기록 통계
  const noteTypeCounts = (noteSummaries ?? []).reduce<Record<string, number>>((acc, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1;
    return acc;
  }, {});
  const readingDays = new Set(
    (noteSummaries ?? []).map((n) => (n.createdAt || "").slice(0, 10)).filter(Boolean)
  ).size;

  const sections =
    result?.success && result.report ? parseReportSections(result.report) : [];

  return (
    <div className="pb-20 lg:pb-8">
      {/* 슬림 상단 바 (탈출용) */}
      <div className="mb-3 flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href={`/books/${userBookId}`} aria-label={t("common.back")}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <span className="text-sm text-muted-foreground truncate">
          {t("books.aiReportTitle")}
        </span>
      </div>

      {/* 로딩 */}
      {isPending && <ReadingReportSkeleton />}

      {/* 에러 */}
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

      {/* 성공: 매거진 리포트 */}
      {!isPending && result?.success && result.report && (
        <ReadingReportMagazine
          bookTitle={bookInfo?.title || bookTitle}
          author={bookInfo?.author}
          coverImageUrl={bookInfo?.coverImageUrl}
          startedAt={bookInfo?.startedAt}
          completedAt={bookInfo?.completedAt}
          status={bookInfo?.status}
          totalPages={bookInfo?.totalPages}
          noteCount={result.noteCount ?? noteCount}
          completedCount={completedCount}
          noteTypeCounts={noteTypeCounts}
          readingDays={readingDays}
          bookOrdinal={bookOrdinal}
          publishedAt={result.generatedAt}
          sections={sections}
          actionSlot={
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Button asChild variant="ghost" size="sm">
                <Link href={`/books/${userBookId}`}>
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                  책으로
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={fetchReport} disabled={isPending}>
                  <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isPending && "animate-spin")} />
                  {initialSavedReport ? "새로 생성" : t("books.aiReportRegenerate")}
                </Button>
                {bookInfo && (
                  <>
                    <ReportSaveButton
                      userBookId={userBookId}
                      reportMarkdown={result.report}
                      bookInfo={bookInfo}
                      noteCount={result.noteCount ?? noteCount}
                      noteIds={noteSummaries?.map((n) => n.id) || []}
                      initialShareId={savedShareId}
                      onSaved={(id) => setSavedShareId(id)}
                    />
                    <ShareCardDialog
                      reportMarkdown={result.report}
                      bookInfo={bookInfo}
                      noteCount={result.noteCount ?? noteCount}
                      noteTypeCounts={noteTypeCounts}
                      readingDays={readingDays}
                      generatedAt={result.generatedAt}
                    />
                    <ReportShareDialog
                      userBookId={userBookId}
                      reportMarkdown={result.report}
                      bookInfo={bookInfo}
                      noteCount={result.noteCount ?? noteCount}
                      noteIds={noteSummaries?.map((n) => n.id) || []}
                      noteSummaries={noteSummaries}
                      generatedAt={result.generatedAt}
                      initialShareId={savedShareId}
                      onSaved={(id) => setSavedShareId(id)}
                    />
                  </>
                )}
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}
