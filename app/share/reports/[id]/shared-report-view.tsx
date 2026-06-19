"use client";

import { useEffect, useRef } from "react";
import { StickyNote, Eye, Info } from "lucide-react";
import Link from "next/link";
import { parseReportSections } from "@/lib/utils/report-parser";
import { ReadingReportMagazine } from "@/components/books/reading-report-magazine";
import { cn } from "@/lib/utils";
import { incrementReportViewCount } from "@/app/actions/ai/report";
import { ReportReactions } from "@/components/share/report-reactions";
import { useTranslation } from "@/lib/i18n";
import type {
  SavedReport,
  PublicNoteSummary,
  ReportReactionCounts,
} from "@/types/ai/report";

const NOTE_TYPE_LABELS: Record<string, string> = {
  quote: "인용구",
  memo: "메모",
  photo: "사진",
  transcription: "필사",
  progress: "독서 여정",
};

const NOTE_TYPE_COLORS: Record<string, string> = {
  quote: "bg-amber-400 dark:bg-amber-500",
  memo: "bg-stone-400 dark:bg-stone-500",
  transcription: "bg-emerald-400 dark:bg-emerald-500",
  progress: "bg-sky-400 dark:bg-sky-500",
  photo: "bg-rose-400 dark:bg-rose-500",
};

interface SharedReportViewProps {
  report: SavedReport;
  publicNotes?: PublicNoteSummary[];
  reactionCounts: ReportReactionCounts;
}

export function SharedReportView({
  report,
  publicNotes,
  reactionCounts,
}: SharedReportViewProps) {
  const { t } = useTranslation();
  const sections = parseReportSections(report.reportMarkdown);
  const hasIncrementedRef = useRef(false);

  // 조회수 증가 (마운트 시 1회만)
  useEffect(() => {
    if (!hasIncrementedRef.current) {
      hasIncrementedRef.current = true;
      incrementReportViewCount(report.shareId);
    }
  }, [report.shareId]);

  // 기록 통계 (공개 노트 기반)
  const noteTypeCounts = (publicNotes ?? []).reduce<Record<string, number>>((acc, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1;
    return acc;
  }, {});
  const readingDays = new Set(
    (publicNotes ?? []).map((n) => (n.createdAt || "").slice(0, 10)).filter(Boolean)
  ).size;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 매거진 리포트 (읽기 전용) */}
      <ReadingReportMagazine
        bookTitle={report.bookTitle}
        author={report.bookAuthor}
        coverImageUrl={report.coverImageUrl}
        startedAt={report.startedAt}
        completedAt={report.completedAt}
        status={report.completedAt ? "completed" : "reading"}
        totalPages={report.totalPages}
        noteCount={report.noteCount}
        noteTypeCounts={noteTypeCounts}
        readingDays={readingDays}
        publishedAt={report.createdAt}
        sections={sections}
      />

      {/* 설명 + 조회수 */}
      <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 shrink-0" />
        <span>{t("books.aiReportDesc")}</span>
        {report.viewCount > 0 && (
          <span className="flex items-center gap-1 ml-auto shrink-0">
            <Eye className="h-3.5 w-3.5" />
            {report.viewCount.toLocaleString()}명이 읽었어요
          </span>
        )}
      </div>

      {/* 이모지 반응 */}
      <div className="rounded-xl border bg-card/50 px-4">
        <ReportReactions reportId={report.id} initialCounts={reactionCounts} />
      </div>

      {/* 공개된 기록 목록 */}
      {publicNotes && publicNotes.length > 0 && (() => {
        const progressItems = publicNotes.filter((n) => n.type === "progress");
        const otherItems = publicNotes.filter((n) => n.type !== "progress");

        return (
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-muted-foreground" />
              {t("books.sharedNotesTitle")}
              <span className="text-xs font-normal text-muted-foreground">
                — {publicNotes.length}개
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">{t("books.sharedNotesDesc")}</p>

            {/* 독서여정 그룹 요약 */}
            {progressItems.length > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-sky-200/60 dark:border-sky-800/40 bg-sky-50/50 dark:bg-sky-950/20">
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium shrink-0 text-white/90",
                  NOTE_TYPE_COLORS.progress
                )}>
                  {NOTE_TYPE_LABELS.progress}
                </span>
                <span className="text-sm flex-1 font-medium text-sky-700 dark:text-sky-300">
                  {progressItems.length}건의 진행 기록
                </span>
                {progressItems[0].pageNumber && progressItems[progressItems.length - 1].pageNumber && (
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                    p.{progressItems[progressItems.length - 1].pageNumber} → p.{progressItems[0].pageNumber}
                  </span>
                )}
              </div>
            )}

            {/* 기타 기록 개별 표시 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {otherItems.map((note) => (
                <Link
                  key={note.id}
                  href={`/share/notes/${note.id}`}
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
          </div>
        );
      })()}
    </div>
  );
}
