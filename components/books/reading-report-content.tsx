"use client";

import { useEffect, useState, useTransition, type ComponentType } from "react";
import {
  ArrowLeft,
  RefreshCw,
  Calendar,
  BookOpen,
  Lightbulb,
  Quote,
  PenLine,
  Route,
  Sparkles,
  FileText,
  Save,
  Clock,
  StickyNote,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReadingReportSkeleton } from "./reading-report-skeleton";
import { ReportSaveButton } from "./report-save-button";
import { ReportShareDialog } from "./report-share-dialog";
import { generateReadingReport } from "@/app/actions/ai/report";
import { useTranslation } from "@/lib/i18n";
import { useUpgradeModal, isUpgradeLimitError } from "@/hooks/use-upgrade-modal";
import {
  parseReportSections,
  getSectionGridClass,
  EARTH_TONE_COLORS,
} from "@/lib/utils/report-parser";
import type { ReadingReportResult, BookInfoForReport, NoteSummary, ReportSection } from "@/types/ai";
import { cn } from "@/lib/utils";

/** 아이콘 매핑 */
const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  BookOpen,
  Lightbulb,
  Quote,
  PenLine,
  Route,
  Sparkles,
  FileText,
};

/** 노트 타입별 한글 라벨 */
const NOTE_TYPE_LABELS: Record<string, string> = {
  quote: "인용구",
  memo: "메모",
  photo: "사진",
  transcription: "필사",
  progress: "독서 여정",
};

/** 노트 타입별 진행 바 색상 */
const NOTE_TYPE_COLORS: Record<string, string> = {
  quote: "bg-amber-400 dark:bg-amber-500",
  memo: "bg-stone-400 dark:bg-stone-500",
  transcription: "bg-emerald-400 dark:bg-emerald-500",
  progress: "bg-sky-400 dark:bg-sky-500",
  photo: "bg-rose-400 dark:bg-rose-500",
};

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
}

export function ReadingReportContent({
  userBookId,
  bookTitle,
  noteCount,
  bookInfo,
  noteSummaries,
  initialSavedReport,
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

  // 파싱된 섹션
  const sections: ReportSection[] =
    result?.success && result.report
      ? parseReportSections(result.report)
      : [];

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
          {/* 1. 히어로 헤더 */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-100 via-amber-50 to-orange-50 dark:from-stone-900 dark:via-amber-950 dark:to-orange-950 border border-stone-200/60 dark:border-stone-700/40 p-5 sm:p-6">
            <div className="flex items-start gap-4 sm:gap-5">
              {/* 책 표지 */}
              {bookInfo?.coverImageUrl ? (
                <img
                  src={bookInfo.coverImageUrl}
                  alt={bookInfo.title}
                  className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded-lg shadow-md shrink-0"
                />
              ) : (
                <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-lg bg-stone-200 dark:bg-stone-700 flex items-center justify-center shrink-0 shadow-md">
                  <BookOpen className="h-6 w-6 text-stone-400 dark:text-stone-500" />
                </div>
              )}

              <div className="flex-1 min-w-0 space-y-2">
                <h2 className="text-base sm:text-lg font-bold truncate">
                  {bookInfo?.title || bookTitle}
                </h2>
                {bookInfo?.author && (
                  <p className="text-sm text-muted-foreground truncate">
                    {bookInfo.author}
                  </p>
                )}
                {/* 메타 정보 배지 */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 bg-white/60 dark:bg-slate-800/60 px-2 py-0.5 rounded-full">
                    <StickyNote className="h-3 w-3" />
                    {t("books.aiReportBasedOn", { count: result.noteCount ?? noteCount })}
                  </span>
                  {initialSavedReport && (
                    <span className="flex items-center gap-1 bg-amber-100/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" />
                      저장된 리포트
                    </span>
                  )}
                  {result.generatedAt && (
                    <span className="flex items-center gap-1 bg-white/60 dark:bg-slate-800/60 px-2 py-0.5 rounded-full">
                      <Calendar className="h-3 w-3" />
                      {new Date(result.generatedAt).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                      {initialSavedReport && " 발행"}
                    </span>
                  )}
                  {bookInfo?.startedAt && (
                    <span className="flex items-center gap-1 bg-white/60 dark:bg-slate-800/60 px-2 py-0.5 rounded-full">
                      <Clock className="h-3 w-3" />
                      {new Date(bookInfo.startedAt).toLocaleDateString("ko-KR")} ~
                      {bookInfo.completedAt
                        ? ` ${new Date(bookInfo.completedAt).toLocaleDateString("ko-KR")}`
                        : " 진행 중"}
                    </span>
                  )}
                </div>

                {/* 독서 여정 바 */}
                {bookInfo?.totalPages && bookInfo.totalPages > 0 && (
                  (() => {
                    const pct =
                      bookInfo.status === "completed"
                        ? 100
                        : bookInfo.currentPage && bookInfo.currentPage > 0
                        ? Math.min(100, Math.round((bookInfo.currentPage / bookInfo.totalPages) * 100))
                        : 0;
                    return (
                      <div className="space-y-1 pt-0.5">
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            독서 여정
                          </span>
                          <span className="font-medium tabular-nums">
                            {bookInfo.currentPage
                              ? `${bookInfo.currentPage.toLocaleString()} / ${bookInfo.totalPages.toLocaleString()}쪽`
                              : `총 ${bookInfo.totalPages.toLocaleString()}쪽`}
                            <span className="ml-1 text-amber-600 dark:text-amber-400 font-semibold">
                              ({pct}%)
                            </span>
                          </span>
                        </div>
                        <div className="w-full bg-stone-200/60 dark:bg-stone-700/50 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 dark:from-amber-500 dark:to-orange-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </div>

          {/* 2. Bento Grid — 섹션 카드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {sections.map((section) => {
              const colors =
                EARTH_TONE_COLORS[section.colorTheme] ||
                EARTH_TONE_COLORS.stone;
              const IconComponent = ICON_MAP[section.icon] || FileText;
              const gridClass = getSectionGridClass(section.id);

              return (
                <Card
                  key={section.id}
                  variant="glass"
                  className={cn(
                    "p-4 sm:p-5 space-y-3 transition-shadow",
                    colors.bg,
                    colors.border,
                    gridClass
                  )}
                >
                  {/* 섹션 헤더 */}
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg",
                        colors.iconBg
                      )}
                    >
                      <IconComponent
                        className={cn("h-4 w-4", colors.iconColor)}
                      />
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold">
                      {section.title}
                    </h3>
                  </div>

                  {/* 섹션 콘텐츠 */}
                  <article className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-h3:text-sm prose-p:text-[13px] prose-p:leading-relaxed prose-ul:text-[13px] prose-ol:text-[13px] prose-li:my-0.5 prose-blockquote:border-primary/30 prose-blockquote:bg-muted/20 prose-blockquote:py-0.5 prose-blockquote:px-3 prose-blockquote:rounded-r-lg prose-blockquote:text-[13px]">
                    <ReactMarkdown>{section.content}</ReactMarkdown>
                  </article>
                </Card>
              );
            })}
          </div>

          {/* 3. 기록 통계 + 사용된 기록 섹션 */}
          {noteSummaries && noteSummaries.length > 0 && (() => {
            const noteTypeStats = noteSummaries.reduce<Record<string, number>>(
              (acc, note) => { acc[note.type] = (acc[note.type] || 0) + 1; return acc; },
              {}
            );
            const totalNotes = noteSummaries.length;
            return (
              <div className="space-y-4">
                {/* 기록 통계 시각화 */}
                <div className="rounded-xl border bg-card/50 dark:bg-card/30 p-4 space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-muted-foreground" />
                    {t("books.aiReportUsedNotes")}
                    <span className="text-xs font-normal text-muted-foreground">
                      — 총 {totalNotes}개
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(noteTypeStats)
                      .sort(([, a], [, b]) => b - a)
                      .map(([type, count]) => {
                        const pct = Math.round((count / totalNotes) * 100);
                        const barColor = NOTE_TYPE_COLORS[type] || "bg-stone-400";
                        return (
                          <div key={type} className="flex items-center gap-2.5">
                            <span className="text-xs text-muted-foreground w-14 shrink-0 tabular-nums">
                              {NOTE_TYPE_LABELS[type] || type}
                            </span>
                            <div className="flex-1 bg-muted/40 dark:bg-muted/20 rounded-full h-2 overflow-hidden">
                              <div
                                className={cn("h-2 rounded-full transition-all", barColor)}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-12 text-right shrink-0 tabular-nums">
                              {count}개 <span className="text-muted-foreground/60">({pct}%)</span>
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* 기록 목록 (독서여정은 건수로 그룹화) */}
                {(() => {
                  const progressNotes = noteSummaries.filter((n) => n.type === "progress");
                  const otherNotes = noteSummaries.filter((n) => n.type !== "progress");
                  const displayNotes = otherNotes.slice(0, 9);
                  const remainingCount = Math.max(0, otherNotes.length - 9);

                  return (
                    <div className="space-y-2">
                      {/* 독서여정 그룹 요약 */}
                      {progressNotes.length > 0 && (
                        <div className="flex items-center gap-3 p-3 rounded-lg border border-sky-200/60 dark:border-sky-800/40 bg-sky-50/50 dark:bg-sky-950/20">
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium shrink-0 text-white/90",
                            NOTE_TYPE_COLORS.progress
                          )}>
                            {NOTE_TYPE_LABELS.progress}
                          </span>
                          <span className="text-sm flex-1 font-medium text-sky-700 dark:text-sky-300">
                            {progressNotes.length}건의 진행 기록
                          </span>
                          {progressNotes[0].pageNumber && progressNotes[progressNotes.length - 1].pageNumber && (
                            <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                              p.{progressNotes[progressNotes.length - 1].pageNumber} → p.{progressNotes[0].pageNumber}
                            </span>
                          )}
                        </div>
                      )}

                      {/* 기타 기록 개별 표시 */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {displayNotes.map((note) => (
                          <Link
                            key={note.id}
                            href={`/notes/${note.id}`}
                            className="flex items-center gap-3 p-3 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors group"
                          >
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-medium shrink-0 text-white/90",
                                NOTE_TYPE_COLORS[note.type] || "bg-stone-400"
                              )}
                            >
                              {NOTE_TYPE_LABELS[note.type] || note.type}
                            </span>
                            <span className="text-sm truncate flex-1 group-hover:text-primary transition-colors">
                              {note.title || `${NOTE_TYPE_LABELS[note.type] || note.type} 기록`}
                            </span>
                            {note.pageNumber && (
                              <span className="text-xs text-muted-foreground shrink-0">
                                p.{note.pageNumber}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                      {remainingCount > 0 && (
                        <p className="text-xs text-muted-foreground text-center">
                          외 {remainingCount}개 기록
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          {/* 4. 액션 바 */}
          <div className="flex items-center justify-between pt-4 border-t gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/books/${userBookId}`}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                {t("common.back")}
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
        </>
      )}
    </div>
  );
}
