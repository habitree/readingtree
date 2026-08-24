"use client";

import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReadingReportSkeleton } from "./reading-report-skeleton";
import { ReportSaveButton } from "./report-save-button";
import { ReportShareDialog } from "./report-share-dialog";
import { ShareCardDialog } from "./share-card/share-card-dialog";
import { ReportStylePicker } from "./share-card/report-style-picker";
import { SHARE_CARD_TEMPLATES } from "./share-card/templates";
import { TemplateScaledView } from "./share-card/template-scaled-view";
import { buildShareCardData } from "./share-card/share-card-data";
import { ensureShareCardFonts } from "./share-card/share-card-fonts";
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
  // 생성 전 선택한 이미지 카드 스타일 — 이미지 카드 다이얼로그의 초기 템플릿
  const [styleId, setStyleId] = useState(SHARE_CARD_TEMPLATES[0].id);

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

  // 선택된 템플릿 + 리포트 카드 데이터
  const selectedTemplate =
    SHARE_CARD_TEMPLATES.find((tpl) => tpl.id === styleId) ?? SHARE_CARD_TEMPLATES[0];
  const shareData =
    bookInfo && result?.success && result.report
      ? buildShareCardData({
          reportMarkdown: result.report,
          bookInfo,
          noteCount: result.noteCount ?? noteCount,
          noteTypeCounts,
          readingDays,
          generatedAt: result.generatedAt,
        })
      : null;
  // 생성 전 스타일 미리보기용 (책 정보·통계만 채워진 상태)
  const pickerPreviewData = bookInfo
    ? buildShareCardData({
        reportMarkdown: "",
        bookInfo,
        noteCount,
        noteTypeCounts,
        readingDays,
      })
    : null;

  // 본문 렌더 서체 로드 — view=saved처럼 피커를 거치지 않는 진입 대비
  useEffect(() => {
    if (result?.success) ensureShareCardFonts(selectedTemplate.fonts);
  }, [result, selectedTemplate]);

  // 공통 액션 바 (스타일 뷰·매거진 폴백 양쪽에서 사용)
  const actionBar =
    result?.success && result.report ? (
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
                initialTemplateId={styleId}
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
    ) : null;

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

      {/* 생성 전: 스타일 선택 (기존 진입 즉시 자동 생성 → 명시적 선택 후 생성) */}
      {!isPending && !result && (
        <ReportStylePicker
          noteCount={noteCount}
          selectedId={styleId}
          onSelect={setStyleId}
          onGenerate={fetchReport}
          previewData={pickerPreviewData}
        />
      )}

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

      {/* 성공: 선택한 스타일 양식으로 리포트 렌더 (+ 스타일 전환 칩) */}
      {!isPending && result?.success && result.report && shareData && (
        <div className="mx-auto max-w-[800px] space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {SHARE_CARD_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setStyleId(tpl.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  tpl.id === selectedTemplate.id
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted/60"
                )}
              >
                {tpl.name}
              </button>
            ))}
          </div>
          <TemplateScaledView
            template={selectedTemplate}
            data={shareData}
            className="overflow-hidden rounded-lg border shadow-sm"
          />
          {actionBar}
        </div>
      )}

      {/* 성공(폴백): 책 정보가 없으면 기존 매거진 뷰 */}
      {!isPending && result?.success && result.report && !shareData && (
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
          actionSlot={actionBar ?? undefined}
        />
      )}
    </div>
  );
}
