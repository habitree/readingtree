"use client";

import { type ComponentType, useEffect, useRef } from "react";
import {
  BookOpen,
  Lightbulb,
  Quote,
  PenLine,
  Route,
  Sparkles,
  FileText,
  StickyNote,
  Calendar,
  Clock,
  Eye,
  Info,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import {
  parseReportSections,
  getSectionGridClass,
  EARTH_TONE_COLORS,
} from "@/lib/utils/report-parser";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { incrementReportViewCount } from "@/app/actions/ai/report";
import { ReportReactions } from "@/components/share/report-reactions";
import { HighlightCardDownload } from "@/components/share/highlight-card-download";
import { useTranslation } from "@/lib/i18n";
import type {
  SavedReport,
  PublicNoteSummary,
  ReportReactionCounts,
} from "@/types/ai/report";

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  BookOpen,
  Lightbulb,
  Quote,
  PenLine,
  Route,
  Sparkles,
  FileText,
};

const NOTE_TYPE_LABELS: Record<string, string> = {
  quote: "인용구",
  memo: "메모",
  photo: "사진",
  transcription: "필사",
  progress: "독서 진행",
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

  // QW-3: 조회수 증가 (마운트 시 1회만)
  useEffect(() => {
    if (!hasIncrementedRef.current) {
      hasIncrementedRef.current = true;
      incrementReportViewCount(report.shareId);
    }
  }, [report.shareId]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 히어로 헤더 */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-100 via-amber-50 to-orange-50 dark:from-stone-900 dark:via-amber-950 dark:to-orange-950 border border-stone-200/60 dark:border-stone-700/40 p-5 sm:p-6">
        <div className="flex items-start gap-4 sm:gap-5">
          {report.coverImageUrl ? (
            <img
              src={report.coverImageUrl}
              alt={report.bookTitle}
              className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded-lg shadow-md shrink-0"
            />
          ) : (
            <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-lg bg-stone-200 dark:bg-stone-700 flex items-center justify-center shrink-0 shadow-md">
              <BookOpen className="h-6 w-6 text-stone-400 dark:text-stone-500" />
            </div>
          )}
          <div className="flex-1 min-w-0 space-y-2">
            <h1 className="text-base sm:text-lg font-bold truncate">
              {report.bookTitle}
            </h1>
            {report.bookAuthor && (
              <p className="text-sm text-muted-foreground truncate">
                {report.bookAuthor}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 bg-white/60 dark:bg-slate-800/60 px-2 py-0.5 rounded-full">
                <StickyNote className="h-3 w-3" />
                기록 {report.noteCount}개 기반
              </span>
              <span className="flex items-center gap-1 bg-white/60 dark:bg-slate-800/60 px-2 py-0.5 rounded-full">
                <Calendar className="h-3 w-3" />
                {new Date(report.createdAt).toLocaleDateString("ko-KR")}
              </span>
              {report.startedAt && (
                <span className="flex items-center gap-1 bg-white/60 dark:bg-slate-800/60 px-2 py-0.5 rounded-full">
                  <Clock className="h-3 w-3" />
                  {new Date(report.startedAt).toLocaleDateString("ko-KR")} ~
                  {report.completedAt
                    ? ` ${new Date(report.completedAt).toLocaleDateString("ko-KR")}`
                    : " 진행 중"}
                </span>
              )}
              {/* QW-3: 조회수 */}
              {report.viewCount > 0 && (
                <span className="flex items-center gap-1 bg-white/60 dark:bg-slate-800/60 px-2 py-0.5 rounded-full">
                  <Eye className="h-3 w-3" />
                  {report.viewCount.toLocaleString()}명이 읽었어요
                </span>
              )}
            </div>

            {/* 독서 진행률 바 */}
            {report.totalPages && report.totalPages > 0 && (
              (() => {
                const pct = report.completedAt
                  ? 100
                  : report.currentPage && report.currentPage > 0
                  ? Math.min(100, Math.round((report.currentPage / report.totalPages) * 100))
                  : 0;
                return (
                  <div className="space-y-1 pt-0.5">
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        독서 진행률
                      </span>
                      <span className="font-medium tabular-nums">
                        {report.currentPage
                          ? `${report.currentPage.toLocaleString()} / ${report.totalPages.toLocaleString()}쪽`
                          : `총 ${report.totalPages.toLocaleString()}쪽`}
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

          {/* QW-1: 카드 다운로드 버튼 */}
          <div className="shrink-0 hidden sm:block">
            <HighlightCardDownload
              shareId={report.shareId}
              bookTitle={report.bookTitle}
            />
          </div>
        </div>

        {/* QW-1: 모바일 카드 다운로드 (히어로 하단) */}
        <div className="mt-3 sm:hidden">
          <HighlightCardDownload
            shareId={report.shareId}
            bookTitle={report.bookTitle}
          />
        </div>
      </div>

      {/* 리포트 설명 */}
      <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 shrink-0" />
        <span>{t("books.aiReportDesc")}</span>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {sections.map((section) => {
          const colors =
            EARTH_TONE_COLORS[section.colorTheme] || EARTH_TONE_COLORS.stone;
          const IconComponent = ICON_MAP[section.icon] || FileText;
          const gridClass = getSectionGridClass(section.id);

          return (
            <Card
              key={section.id}
              variant="glass"
              className={cn(
                "p-4 sm:p-5 space-y-3",
                colors.bg,
                colors.border,
                gridClass
              )}
            >
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
              <article className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-h3:text-sm prose-p:text-[13px] prose-p:leading-relaxed prose-ul:text-[13px] prose-ol:text-[13px] prose-li:my-0.5 prose-blockquote:border-primary/30 prose-blockquote:bg-muted/20 prose-blockquote:py-0.5 prose-blockquote:px-3 prose-blockquote:rounded-r-lg prose-blockquote:text-[13px]">
                <ReactMarkdown>{section.content}</ReactMarkdown>
              </article>
            </Card>
          );
        })}
      </div>

      {/* QW-4: 이모지 반응 */}
      <div className="rounded-xl border bg-card/50 px-4">
        <ReportReactions
          reportId={report.id}
          initialCounts={reactionCounts}
        />
      </div>

      {/* 공개된 기록 목록 */}
      {publicNotes && publicNotes.length > 0 && (() => {
        const noteTypeStats = publicNotes.reduce<Record<string, number>>(
          (acc, note) => { acc[note.type] = (acc[note.type] || 0) + 1; return acc; },
          {}
        );
        const totalNotes = publicNotes.length;
        return (
          <div className="space-y-4 pt-2">
            {/* 기록 통계 시각화 */}
            <div className="rounded-xl border bg-card/50 dark:bg-card/30 p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                {t("books.sharedNotesTitle")}
                <span className="text-xs font-normal text-muted-foreground">
                  — {totalNotes}개
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">{t("books.sharedNotesDesc")}</p>
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

            {/* 기록 목록 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {publicNotes.map((note) => (
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
