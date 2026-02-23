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
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReadingReportSkeleton } from "./reading-report-skeleton";
import { ReportShareDialog } from "./report-share-dialog";
import { generateReadingReport } from "@/app/actions/ai/report";
import { useTranslation } from "@/lib/i18n";
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
  progress: "독서 진행",
};

interface ReadingReportContentProps {
  userBookId: string;
  bookTitle: string;
  noteCount: number;
  bookInfo?: BookInfoForReport;
  noteSummaries?: NoteSummary[];
}

export function ReadingReportContent({
  userBookId,
  bookTitle,
  noteCount,
  bookInfo,
  noteSummaries,
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
                  {result.generatedAt && (
                    <span className="flex items-center gap-1 bg-white/60 dark:bg-slate-800/60 px-2 py-0.5 rounded-full">
                      <Calendar className="h-3 w-3" />
                      {new Date(result.generatedAt).toLocaleDateString("ko-KR")}
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

          {/* 3. 사용된 기록 섹션 */}
          {noteSummaries && noteSummaries.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                {t("books.aiReportUsedNotes")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {noteSummaries.slice(0, 9).map((note) => (
                  <Link
                    key={note.id}
                    href={`/notes/${note.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors group"
                  >
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium shrink-0">
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
              {noteSummaries.length > 9 && (
                <p className="text-xs text-muted-foreground text-center">
                  외 {noteSummaries.length - 9}개 기록
                </p>
              )}
            </div>
          )}

          {/* 4. 액션 바 */}
          <div className="flex items-center justify-between pt-4 border-t gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/books/${userBookId}`}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                {t("common.back")}
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchReport}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                {t("books.aiReportRegenerate")}
              </Button>
              {bookInfo && (
                <ReportShareDialog
                  userBookId={userBookId}
                  reportMarkdown={result.report}
                  bookInfo={bookInfo}
                  noteCount={result.noteCount ?? noteCount}
                  noteIds={noteSummaries?.map((n) => n.id) || []}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
