"use client";

import { type ComponentType } from "react";
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
import type { SavedReport, PublicNoteSummary } from "@/types/ai/report";

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

interface SharedReportViewProps {
  report: SavedReport;
  publicNotes?: PublicNoteSummary[];
}

export function SharedReportView({ report, publicNotes }: SharedReportViewProps) {
  const sections = parseReportSections(report.reportMarkdown);

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
            </div>
          </div>
        </div>
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

      {/* 공개된 기록 목록 */}
      {publicNotes && publicNotes.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            사용된 기록 ({publicNotes.length}개)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {publicNotes.map((note) => (
              <Link
                key={note.id}
                href={`/share/notes/${note.id}`}
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
        </div>
      )}
    </div>
  );
}
