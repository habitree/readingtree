"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityHeatmap } from "@/components/profile/reading-stats-chart";
import { useTranslation } from "@/lib/i18n";
import {
  BookOpen,
  PenLine,
  Flame,
  Target,
  Tag,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface StatsContentProps {
  readingStats: {
    thisWeek: { notes: number };
    thisYear: { completedBooks: number; notes: number };
    topBooks: Array<{ book: any; noteCount: number }>;
    recentBooks: Array<{ book: any; noteCount: number }>;
  };
  monthlyStats: Array<{ month: string; count: number }>;
  weeklyProgress: {
    days: Array<{
      date: string;
      dayLabel: string;
      hasRecord: boolean;
      count: number;
      isToday: boolean;
      isFuture: boolean;
    }>;
    recordedDays: number;
    totalDays: number;
    streak: number;
    streakStatus: "active" | "at_risk" | "none";
  };
  goalProgress: {
    goal: number;
    completed: number;
    progress: number;
    remaining: number;
  };
  topTags: Array<{ tag: string; count: number }>;
  dailyRecords: Record<string, number>;
  readingTimeStats?: { totalSeconds: number; sessionCount: number };
}

export function StatsContent({
  readingStats,
  monthlyStats,
  weeklyProgress,
  goalProgress,
  topTags,
  dailyRecords,
  readingTimeStats,
}: StatsContentProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* 요약 카드 4개 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={BookOpen}
          label={t("stats.completedBooks")}
          value={readingStats.thisYear.completedBooks}
          unit={t("stats.unitBooks")}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-50 dark:bg-blue-950/30"
          href="/books?status=completed"
        />
        <StatCard
          icon={PenLine}
          label={t("stats.totalNotes")}
          value={readingStats.thisYear.notes}
          unit={t("stats.unitCount")}
          color="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-50 dark:bg-emerald-950/30"
          href="/notes"
        />
        <StatCard
          icon={Flame}
          label={t("stats.currentStreak")}
          value={weeklyProgress.streak}
          unit={t("stats.unitDays")}
          color="text-orange-600 dark:text-orange-400"
          bgColor="bg-orange-50 dark:bg-orange-950/30"
          highlight={weeklyProgress.streakStatus === "active"}
        />
        <StatCard
          icon={Target}
          label={t("stats.goalProgress")}
          value={goalProgress.goal > 0 ? goalProgress.progress : 0}
          unit="%"
          color="text-purple-600 dark:text-purple-400"
          bgColor="bg-purple-50 dark:bg-purple-950/30"
          subtitle={
            goalProgress.goal > 0
              ? `${goalProgress.completed}/${goalProgress.goal}${t("stats.unitBooks")}`
              : t("stats.setGoal")
          }
          href="/profile"
        />
        {readingTimeStats && readingTimeStats.totalSeconds > 0 && (
          <StatCard
            icon={Timer}
            label={t("stats.totalReadingTime")}
            value={
              readingTimeStats.totalSeconds >= 3600
                ? Math.round((readingTimeStats.totalSeconds / 3600) * 10) / 10
                : Math.round(readingTimeStats.totalSeconds / 60)
            }
            unit={readingTimeStats.totalSeconds >= 3600 ? "시간" : "분"}
            color="text-cyan-600 dark:text-cyan-400"
            bgColor="bg-cyan-50 dark:bg-cyan-950/30"
            subtitle={t("stats.sessionCount", { count: readingTimeStats.sessionCount })}
          />
        )}
      </div>

      {/* 이번 주 진행 현황 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {t("stats.weeklyActivity")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {weeklyProgress.days.map((day) => (
              <div key={day.date} className="flex-1 text-center">
                <div className="text-[10px] text-muted-foreground mb-1">
                  {day.dayLabel}
                </div>
                <div
                  className={cn(
                    "mx-auto w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                    day.isToday && "ring-2 ring-primary ring-offset-1",
                    day.isFuture
                      ? "bg-slate-50 dark:bg-slate-900 text-muted-foreground/30"
                      : day.hasRecord
                        ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                        : "bg-slate-100 dark:bg-slate-800 text-muted-foreground"
                  )}
                >
                  {day.isFuture ? "" : day.hasRecord ? <CheckCircle2 className="h-4 w-4" /> : "—"}
                </div>
                {!day.isFuture && day.count > 0 && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">{day.count}</div>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <span>
              {t("stats.weekRecordDays", {
                recorded: weeklyProgress.recordedDays,
                total: weeklyProgress.totalDays,
              })}
            </span>
            {weeklyProgress.streak > 0 && (
              <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium">
                <Flame className="h-3 w-3" />
                {t("stats.streakDays", { count: weeklyProgress.streak })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 월별 기록 추이 + 활동 히트맵 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 월별 기록 추이 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t("stats.monthlyTrend")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {monthlyStats.map((item) => {
                const maxCount = Math.max(...monthlyStats.map((m) => m.count), 1);
                const percentage = (item.count / maxCount) * 100;
                const [year, month] = item.month.split("-");
                return (
                  <div key={item.month} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-12 shrink-0">
                      {month}{t("stats.monthSuffix")}
                    </span>
                    <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/70 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-8 text-right">{item.count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 활동 히트맵 (기존 컴포넌트 재사용) */}
        <ActivityHeatmap dailyActivity={dailyRecords} weeks={12} />
      </div>

      {/* 인기 책 + 태그 Top 10 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 인기 책 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {t("stats.topBooks")}
              </CardTitle>
              <Link href="/books" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {t("stats.viewAllBooks")} →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {readingStats.topBooks.length > 0 ? (
              <div className="space-y-1">
                {readingStats.topBooks.slice(0, 5).map((item, i) => (
                  <Link
                    key={item.book?.id || i}
                    href={`/books/${item.book?.id}`}
                    className="flex items-center gap-3 py-1.5 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-xs font-bold text-muted-foreground w-5">
                      {i + 1}
                    </span>
                    <span className="text-sm flex-1 truncate">{item.book?.title || "알 수 없는 책"}</span>
                    <Badge variant="secondary" className="text-xs">
                      {item.noteCount}{t("stats.unitCount")}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("stats.noTopBooks")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* 태그 Top 10 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              {t("stats.topTags")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {topTags.map(({ tag, count }) => (
                  <Link
                    key={tag}
                    href={`/search?q=${encodeURIComponent(tag)}&filter=tag`}
                  >
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-forest-100 dark:hover:bg-forest-900/30 transition-colors px-3 py-1"
                    >
                      #{tag}
                      <span className="ml-1.5 text-muted-foreground font-normal text-xs">
                        {count}
                      </span>
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("stats.noTags")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** 요약 카드 컴포넌트 */
function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
  bgColor,
  highlight,
  subtitle,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  unit: string;
  color: string;
  bgColor: string;
  highlight?: boolean;
  subtitle?: string;
  href?: string;
}) {
  const card = (
    <Card className={cn(highlight && "ring-1 ring-orange-300 dark:ring-orange-700", href && "hover:bg-muted/50 transition-colors cursor-pointer")}>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={cn("p-1.5 rounded-lg", bgColor)}>
            <Icon className={cn("h-4 w-4", color)} />
          </div>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">{value}</span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
        {subtitle && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}
