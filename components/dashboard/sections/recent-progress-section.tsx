"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { TrendingUp, ChevronRight, BookOpen, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProgressLogItem } from "@/app/actions/stats";
import { useTranslation, type TranslationKey } from "@/lib/i18n";

interface RecentProgressSectionProps {
  logs: ProgressLogItem[];
  className?: string;
}

/**
 * 최근 진행 체크 섹션
 * 최근 3개의 진행 로그를 카드 형태로 표시
 */
export function RecentProgressSection({ logs, className }: RecentProgressSectionProps) {
  const { t } = useTranslation();

  // 로그가 없으면 빈 상태 표시
  if (!logs || logs.length === 0) {
    return (
      <Card className={cn("p-4", className)}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/50 dark:to-blue-800/30 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {t("dashboard.recentProgress")}
            </span>
          </div>
        </div>
        <div className="text-center py-6 text-slate-500 dark:text-slate-400">
          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t("dashboard.noProgressYet")}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {t("dashboard.noProgressDesc")}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-4", className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/50 dark:to-blue-800/30 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {t("dashboard.recentProgress")}
          </span>
        </div>
        <Link
          href="/notes?type=progress"
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-forest-600 dark:hover:text-forest-400 flex items-center gap-0.5 transition-colors"
        >
          {t("dashboard.viewAllNotes")}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* 로그 목록 */}
      <div className="space-y-2">
        {logs.map((log, index) => (
          <ProgressLogCard key={log.id} log={log} index={index} />
        ))}
      </div>
    </Card>
  );
}

interface ProgressLogCardProps {
  log: ProgressLogItem;
  index: number;
}

function ProgressLogCard({ log, index }: ProgressLogCardProps) {
  const { t } = useTranslation();
  const timeAgo = getTimeAgo(log.createdAt, t);
  const truncatedContent = log.content
    ? log.content.length > 50
      ? log.content.slice(0, 50) + "..."
      : log.content
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link
        href={`/books/${log.userBookId}`}
        className="block group"
      >
        <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          {/* 책 아이콘 또는 커버 */}
          <div className="shrink-0 w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
            {log.bookCoverUrl ? (
              <img
                src={log.bookCoverUrl}
                alt={log.bookTitle}
                className="w-full h-full object-cover"
              />
            ) : (
              <BookOpen className="h-4 w-4 text-slate-400" />
            )}
          </div>

          {/* 내용 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {log.bookTitle}
              </span>
              {log.pageNumber && (
                <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                  p.{log.pageNumber}
                </span>
              )}
            </div>
            {truncatedContent && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                "{truncatedContent}"
              </p>
            )}
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-400 dark:text-slate-500">
              <Clock className="h-3 w-3" />
              <span>{timeAgo}</span>
            </div>
          </div>

          {/* 화살표 */}
          <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500 shrink-0 transition-colors" />
        </div>
      </Link>
    </motion.div>
  );
}

/**
 * 시간 경과 문자열 계산
 */
function getTimeAgo(dateString: string, t: (key: TranslationKey, params?: Record<string, string | number>) => string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return t("common.justNow");
  if (diffMins < 60) return t("common.minutesAgo", { count: diffMins });
  if (diffHours < 24) return t("common.hoursAgo", { count: diffHours });
  if (diffDays === 1) return t("common.yesterday");
  if (diffDays < 7) return t("common.daysAgo", { count: diffDays });
  if (diffDays < 30) return t("common.weeksAgo", { count: Math.floor(diffDays / 7) });
  return t("common.monthsAgo", { count: Math.floor(diffDays / 30) });
}

/**
 * RecentProgressSection 스켈레톤
 */
export function RecentProgressSectionSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>
        <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3 p-2.5">
            <div className="w-8 h-8 rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
