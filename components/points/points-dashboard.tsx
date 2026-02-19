"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Coins,
  Flame,
  TrendingUp,
  Zap,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { PointsDashboardData, PointTransaction } from "@/types/points";

interface PointsDashboardProps {
  data: PointsDashboardData;
}

export function PointsDashboard({ data }: PointsDashboardProps) {
  const { t } = useTranslation();
  const {
    userPoints,
    recentTransactions,
    todayEarned,
    weeklyEarned,
    monthlyEarned,
  } = data;

  return (
    <div className="space-y-4">
      {/* 포인트 요약 카드 */}
      <Card className="overflow-hidden">
        <div className="p-4 bg-gradient-to-br from-forest-500 to-emerald-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-forest-100 opacity-90">{t("points.totalPoints")}</p>
              <motion.p
                className="text-3xl font-bold"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {(userPoints?.total_points || 0).toLocaleString()}
              </motion.p>
            </div>
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <Coins className="h-7 w-7" />
            </div>
          </div>

          {/* 누적 포인트 */}
          <div className="mt-3 text-sm text-forest-100 opacity-90">
            {t("points.lifetimePointsShort", { count: (userPoints?.lifetime_points || 0).toLocaleString() })}
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800">
          <StatItem
            icon={Zap}
            label={t("points.today")}
            value={todayEarned}
            color="text-amber-500"
          />
          <StatItem
            icon={Calendar}
            label={t("points.thisWeek")}
            value={weeklyEarned}
            color="text-blue-500"
          />
          <StatItem
            icon={TrendingUp}
            label={t("points.thisMonth")}
            value={monthlyEarned}
            color="text-green-500"
          />
        </div>
      </Card>

      {/* 스트릭 정보 */}
      {userPoints && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  userPoints.current_streak > 0
                    ? "bg-orange-100 dark:bg-orange-900/30"
                    : "bg-slate-100 dark:bg-slate-800"
                )}
              >
                <Flame
                  className={cn(
                    "h-5 w-5",
                    userPoints.current_streak > 0
                      ? "text-orange-500"
                      : "text-slate-400"
                  )}
                />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("points.continuousStreak")}
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {t("points.daysUnit", { count: userPoints.current_streak })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("points.longestRecord")}
              </p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("points.daysUnit", { count: userPoints.longest_streak })}
              </p>
            </div>
          </div>

        </Card>
      )}

      {/* 최근 거래 내역 */}
      {recentTransactions.length > 0 && (
        <Card>
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              {t("points.recentActivity")}
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTransactions.slice(0, 5).map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="p-3 text-center">
      <Icon className={cn("h-4 w-4 mx-auto mb-1", color)} />
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-lg font-bold text-slate-900 dark:text-white">
        +{value}
      </p>
    </div>
  );
}

function TransactionItem({ transaction }: { transaction: PointTransaction }) {
  const { t, locale } = useTranslation();

  const actionLabels: Record<string, string> = {
    note_create: t("points.noteCreate"),
    note_quote: t("points.noteQuote"),
    note_memo: t("points.noteMemo"),
    note_photo: t("points.notePhoto"),
    note_transcription: t("points.noteTranscription"),
    book_add: t("points.bookAdd"),
    book_complete: t("points.bookComplete"),
    book_progress_update: t("points.bookProgressUpdate"),
    daily_first_activity: t("points.dailyFirstActivity"),
    streak_3_days: t("points.streak3Days"),
    streak_7_days: t("points.streak7Days"),
    streak_14_days: t("points.streak14Days"),
    streak_30_days: t("points.streak30Days"),
    streak_100_days: t("points.streak100Days"),
    streak_365_days: t("points.streak365Days"),
    mission_complete: t("points.missionComplete"),
    all_missions_complete: t("points.allMissionsComplete"),
    first_book: t("points.firstBook"),
    first_note: t("points.firstNote"),
  };

  const label = actionLabels[transaction.action_type] || transaction.description || t("points.activity");
  const date = new Date(transaction.created_at);
  const timeAgo = getTimeAgo(date, t, locale);

  return (
    <div className="px-4 py-3 flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
          {label}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {timeAgo}
        </p>
      </div>
      <Badge
        variant={transaction.final_points > 0 ? "default" : "secondary"}
        className={cn(
          "shrink-0",
          transaction.final_points > 0
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
        )}
      >
        {transaction.final_points > 0 ? "+" : ""}
        {transaction.final_points}
      </Badge>
    </div>
  );
}

function getTimeAgo(
  date: Date,
  t: (key: any, params?: Record<string, string | number>) => string,
  locale: string
): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return t("points.justNow");
  }
  if (diffInSeconds < 3600) {
    return t("points.minutesAgo", { count: Math.floor(diffInSeconds / 60) });
  }
  if (diffInSeconds < 86400) {
    return t("points.hoursAgo", { count: Math.floor(diffInSeconds / 3600) });
  }
  if (diffInSeconds < 604800) {
    return t("points.daysAgo", { count: Math.floor(diffInSeconds / 86400) });
  }

  return date.toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * 포인트 대시보드 스켈레톤
 */
export function PointsDashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="p-4 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-16 bg-slate-300 dark:bg-slate-600 rounded animate-pulse" />
              <div className="h-8 w-24 bg-slate-300 dark:bg-slate-600 rounded animate-pulse" />
            </div>
            <div className="w-14 h-14 rounded-full bg-slate-300 dark:bg-slate-600 animate-pulse" />
          </div>
          <div className="mt-3">
            <div className="h-3 w-20 bg-slate-300 dark:bg-slate-600 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 text-center space-y-2">
              <div className="h-4 w-4 mx-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-3 w-10 mx-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-5 w-8 mx-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="space-y-1">
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-5 w-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
