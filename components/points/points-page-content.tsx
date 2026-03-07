"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Coins,
  Flame,
  TrendingUp,
  Calendar,
  Zap,
  Target,
  Trophy,
  Sparkles,
  BookOpen,
  PenLine,
  ChevronDown,
  ChevronRight,
  CreditCard,
  History,
  CheckCircle2,
  ArrowUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { PageHeader } from "@/components/layout/page-header";
import type { TranslationKey } from "@/lib/i18n";
import type {
  PointsDashboardData,
  PointTransaction,
  MissionWithDetails,
} from "@/types/points";
import { LEVEL_STYLES, LEVEL_DEFAULTS, POINT_ACTION_DEFAULTS } from "@/types/points";

interface PointsPageContentProps {
  dashboardData: PointsDashboardData;
  missions: MissionWithDetails[];
  transactions: PointTransaction[];
}

export function PointsPageContent({
  dashboardData,
  missions,
  transactions,
}: PointsPageContentProps) {
  const { t, locale } = useTranslation();
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [filterCategory, setFilterCategory] = useState<"all" | "earn" | "spend">("all");

  const { userPoints, currentLevel, nextLevel, progressToNextLevel, todayEarned, weeklyEarned, monthlyEarned } = dashboardData;

  const levelStyle = LEVEL_STYLES[userPoints?.current_level ?? 1];
  const levelInfo = LEVEL_DEFAULTS.find((l) => l.level === (userPoints?.current_level ?? 1));
  const nextLevelInfo = LEVEL_DEFAULTS.find((l) => l.level === (userPoints?.current_level ?? 1) + 1);

  const filteredTransactions = useMemo(() => {
    const list = filterCategory === "all"
      ? transactions
      : filterCategory === "earn"
        ? transactions.filter((tx) => tx.final_points > 0)
        : transactions.filter((tx) => tx.final_points < 0);
    return showAllTransactions ? list : list.slice(0, 10);
  }, [transactions, filterCategory, showAllTransactions]);

  const completedMissions = missions.filter((m) => m.status === "completed").length;

  if (!userPoints) {
    return (
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <PageHeader titleKey={"points.pageTitle" as TranslationKey} />
        <div className="text-center py-12 text-muted-foreground">
          {t("points.noData")}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
      <PageHeader titleKey={"points.pageTitle" as TranslationKey} />

      {/* 히어로 카드: 포인트 + 레벨 + 스트릭 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl border-2 overflow-hidden bg-gradient-to-br from-forest-50 to-emerald-50 dark:from-forest-950/30 dark:to-emerald-950/30 border-forest-200 dark:border-forest-800"
      >
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_30%_20%,currentColor_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* 레벨 + 포인트 */}
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg",
                levelStyle.bgColor, levelStyle.borderColor, "border-2"
              )}>
                {levelStyle.emoji}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-medium", levelStyle.textColor)}>
                    Lv.{userPoints.current_level} {levelInfo?.title}
                  </span>
                </div>
                <div className="text-4xl font-extrabold tabular-nums tracking-tight text-forest-600 dark:text-forest-400">
                  {userPoints.total_points.toLocaleString()}
                  <span className="text-lg font-medium text-muted-foreground ml-1">P</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {t("points.lifetimePoints", { count: userPoints.lifetime_points.toLocaleString() })}
                </div>
              </div>
            </div>

            {/* 스트릭 */}
            {userPoints.current_streak > 0 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-1 px-5 py-3 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 border border-orange-200 dark:border-orange-800"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Flame className="h-7 w-7 text-orange-500" />
                </motion.div>
                <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {userPoints.current_streak}
                </span>
                <span className="text-xs text-orange-500/70">{t("points.consecutiveDays")}</span>
              </motion.div>
            )}
          </div>

          {/* 레벨 진행도 바 */}
          {nextLevelInfo && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>{levelStyle.emoji} {levelInfo?.title}</span>
                <span>
                  {t("points.nextLevel", {
                    level: nextLevelInfo.level,
                    title: nextLevelInfo.title,
                    points: (nextLevelInfo.required_points - userPoints.lifetime_points).toLocaleString(),
                  })}
                </span>
              </div>
              <Progress value={progressToNextLevel} className="h-2.5" />
              <div className="text-right text-xs text-muted-foreground mt-1">
                {progressToNextLevel}%
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* 기간별 통계 */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={Zap}
          label={t("points.today")}
          value={todayEarned}
          color="text-amber-500"
          bgColor="bg-amber-50 dark:bg-amber-950/30"
          hasActivity={todayEarned > 0}
        />
        <StatCard
          icon={Calendar}
          label={t("points.thisWeek")}
          value={weeklyEarned}
          color="text-blue-500"
          bgColor="bg-blue-50 dark:bg-blue-950/30"
        />
        <StatCard
          icon={TrendingUp}
          label={t("points.thisMonth")}
          value={monthlyEarned}
          color="text-emerald-500"
          bgColor="bg-emerald-50 dark:bg-emerald-950/30"
        />
      </div>

      {/* 일일 미션 */}
      {missions.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-violet-500" />
                {t("points.dailyMissions")}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {completedMissions}/{missions.length}
              </Badge>
            </div>
            {/* 미션 진행도 */}
            <Progress
              value={(completedMissions / missions.length) * 100}
              className="h-1.5 mt-2"
            />
          </div>
          <div className="divide-y">
            {missions.map((mission) => (
              <MissionItem key={mission.id} mission={mission} />
            ))}
          </div>
          {completedMissions === missions.length && (
            <div className="px-5 py-3 bg-green-50 dark:bg-green-950/20 text-center">
              <span className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center justify-center gap-1.5">
                <Trophy className="h-4 w-4" />
                {t("points.allMissionsCompleteBonus")}
              </span>
            </div>
          )}
        </Card>
      )}

      {/* 스트릭 상세 + 포인트 획득 안내 (2열 그리드) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 스트릭 상세 */}
        <Card className="p-5">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
            <Flame className="h-4 w-4 text-orange-500" />
            {t("points.streakDetail")}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("points.currentStreak")}</span>
              <span className={cn(
                "font-bold text-lg",
                userPoints.current_streak >= 7 ? "text-orange-500" : "text-foreground"
              )}>
                {userPoints.current_streak}{t("points.daysSuffix")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("points.longestStreak")}</span>
              <span className="font-bold text-lg">
                {userPoints.longest_streak}{t("points.daysSuffix")}
              </span>
            </div>
            {/* 다음 마일스톤 */}
            {getNextMilestone(userPoints.current_streak) && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                  <Trophy className="h-4 w-4" />
                  <span>{getNextMilestoneText(userPoints.current_streak, t)}</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* 포인트 획득 방법 안내 */}
        <Card className="p-5">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-amber-500" />
            {t("points.howToEarn")}
          </h3>
          <div className="space-y-2.5">
            <EarnGuideItem icon={PenLine} label={t("points.noteCreate")} points={10} />
            <EarnGuideItem icon={BookOpen} label={t("points.bookComplete")} points={60} />
            <EarnGuideItem icon={Flame} label={t("points.dailyFirstActivity")} points={8} />
            <EarnGuideItem icon={Target} label={t("points.missionComplete")} points={12} />
            <EarnGuideItem icon={Trophy} label={t("points.streak7Days")} points={50} />
          </div>
        </Card>
      </div>

      {/* 포인트 충전 CTA */}
      <Link href="/pricing" className="block">
        <Card className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300">
                  {t("points.chargePoints")}
                </p>
                <p className="text-xs text-amber-600/80 dark:text-amber-400/70">
                  {t("points.chargePointsDesc")}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-amber-500" />
          </div>
        </Card>
      </Link>

      {/* 포인트 내역 */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            {t("points.transactionHistory")}
          </h3>
          {/* 필터 */}
          <div className="flex gap-1">
            {(["all", "earn", "spend"] as const).map((cat) => (
              <Button
                key={cat}
                variant={filterCategory === cat ? "secondary" : "ghost"}
                size="sm"
                className="text-xs h-7 px-2.5"
                onClick={() => setFilterCategory(cat)}
              >
                {t(`points.filter_${cat}`)}
              </Button>
            ))}
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {t("points.noTransactions")}
          </div>
        ) : (
          <div className="divide-y">
            {filteredTransactions.map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} locale={locale} t={t} />
            ))}
          </div>
        )}

        {/* 더보기 버튼 */}
        {!showAllTransactions && transactions.length > 10 && (
          <div className="px-5 py-3 border-t">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => setShowAllTransactions(true)}
            >
              {t("points.showMore")}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
  hasActivity,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  bgColor: string;
  hasActivity?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("p-4 rounded-xl border border-border/50 text-center", bgColor)}
    >
      <div className="w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center bg-background/80 shadow-sm">
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <div className="flex items-center justify-center gap-1">
        <span className="text-xl font-bold tabular-nums">
          {value > 0 ? "+" : ""}{value.toLocaleString()}
        </span>
        {hasActivity && (
          <ArrowUp className="h-3.5 w-3.5 text-green-500" />
        )}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </motion.div>
  );
}

function MissionItem({ mission }: { mission: MissionWithDetails }) {
  const { t } = useTranslation();
  const isComplete = mission.status === "completed";
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    BookOpen,
    PenLine,
    Flame,
  };
  const Icon = iconMap[mission.icon] || Target;

  const missionTitle = mission.title.startsWith("mission.")
    ? t(`points.${mission.title}` as TranslationKey, mission.params)
    : mission.title;

  return (
    <div className={cn(
      "px-5 py-3.5 flex items-center gap-3 transition-colors",
      isComplete && "bg-green-50/50 dark:bg-green-950/10"
    )}>
      <div className={cn(
        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
        isComplete
          ? "bg-green-100 dark:bg-green-900/30"
          : "bg-muted/50"
      )}>
        {isComplete ? (
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
        ) : (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn(
          "text-sm font-medium",
          isComplete && "line-through text-muted-foreground"
        )}>
          {missionTitle}
        </div>
        {mission.progress && !isComplete && (
          <div className="flex items-center gap-2 mt-1">
            <Progress
              value={(mission.progress.current / mission.progress.target) * 100}
              className="h-1 flex-1"
            />
            <span className="text-xs text-muted-foreground">
              {mission.progress.current}/{mission.progress.target}
            </span>
          </div>
        )}
      </div>
      <Badge
        variant={isComplete ? "default" : "secondary"}
        className={cn(
          "shrink-0 text-xs",
          isComplete && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        )}
      >
        +{mission.reward}P
      </Badge>
    </div>
  );
}

function EarnGuideItem({
  icon: Icon,
  label,
  points,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  points: number;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <span className="font-medium text-forest-600 dark:text-forest-400">+{points}P</span>
    </div>
  );
}

function TransactionRow({
  transaction,
  locale,
  t,
}: {
  transaction: PointTransaction;
  locale: string;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}) {
  const isEarned = transaction.final_points > 0;
  const actionLabel = getActionLabel(transaction.action_type, t) || transaction.description || t("points.activity" as TranslationKey);
  const date = new Date(transaction.created_at);
  const timeStr = formatTransactionDate(date, locale);

  return (
    <div className="px-5 py-3 flex items-center gap-3">
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
        isEarned
          ? "bg-green-100 dark:bg-green-900/30"
          : "bg-red-100 dark:bg-red-900/30"
      )}>
        {isEarned ? (
          <ArrowUp className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : (
          <Coins className="h-4 w-4 text-red-500 dark:text-red-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{actionLabel}</p>
        <p className="text-xs text-muted-foreground">{timeStr}</p>
      </div>
      <div className="text-right shrink-0">
        <span className={cn(
          "text-sm font-bold tabular-nums",
          isEarned ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
        )}>
          {isEarned ? "+" : ""}{transaction.final_points}P
        </span>
        <p className="text-xs text-muted-foreground tabular-nums">
          {transaction.balance_after.toLocaleString()}P
        </p>
      </div>
    </div>
  );
}

function getActionLabel(actionType: string, t: (key: TranslationKey) => string): string {
  const labelMap: Record<string, string> = {
    note_create: t("points.noteCreate"),
    note_quote: t("points.noteQuote"),
    note_memo: t("points.noteMemo"),
    note_photo: t("points.notePhoto"),
    note_transcription: t("points.noteTranscription"),
    note_progress: t("points.bookProgressUpdate"),
    book_add: t("points.bookAdd"),
    book_complete: t("points.bookComplete"),
    daily_first_activity: t("points.dailyFirstActivity"),
    streak_7_days: t("points.streak7Days"),
    streak_30_days: t("points.streak30Days"),
    streak_100_days: t("points.streak100Days"),
    mission_complete: t("points.missionComplete"),
    all_missions_complete: t("points.allMissionsComplete"),
    first_book: t("points.firstBook"),
    first_note: t("points.firstNote"),
    welcome_bonus: t("points.welcomeBonus"),
    profile_complete: t("points.profileComplete"),
    note_share: t("points.noteShare"),
    feature_request_create: t("points.featureRequestCreate"),
    feature_request_vote: t("points.featureRequestVote"),
    feature_request_adopted: t("points.featureRequestAdopted"),
    ai_chat_spend: t("points.aiChatSpend"),
    ocr_spend: t("points.ocrSpend"),
    ai_report_spend: t("points.aiReportSpend"),
    point_refund: t("points.pointRefund"),
    point_purchase: t("points.pointPurchase"),
    admin_adjust: t("points.adminAdjust"),
  };
  return labelMap[actionType] || "";
}

function formatTransactionDate(date: Date, locale: string): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return locale === "ko" ? "방금 전" : "Just now";
  if (diffMin < 60) return locale === "ko" ? `${diffMin}분 전` : `${diffMin}m ago`;
  if (diffHour < 24) return locale === "ko" ? `${diffHour}시간 전` : `${diffHour}h ago`;
  if (diffDay < 7) return locale === "ko" ? `${diffDay}일 전` : `${diffDay}d ago`;

  return date.toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNextMilestone(streak: number): number | null {
  if (streak < 7) return 7;
  if (streak < 30) return 30;
  if (streak < 100) return 100;
  return null;
}

function getNextMilestoneText(
  streak: number,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
): string {
  if (streak < 7) return t("points.milestone7", { days: 7 - streak });
  if (streak < 30) return t("points.milestone30", { days: 30 - streak });
  if (streak < 100) return t("points.milestone100", { days: 100 - streak });
  return "";
}
