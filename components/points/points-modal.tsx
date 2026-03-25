"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  Flame,
  TrendingUp,
  Calendar,
  Zap,
  Target,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getPointsDashboardData } from "@/app/actions/points";
import type { PointsDashboardData } from "@/types/points";

interface PointsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 포인트 대시보드 모달 (Sheet)
 * - 개인 포인트 정보
 * - 연속 기록 현황 (핵심)
 * - 기간별 통계
 */
export function PointsModal({ open, onOpenChange }: PointsModalProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<PointsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const dashboardData = await getPointsDashboardData();
      setData(dashboardData);
    } catch (error) {
      console.error("대시보드 데이터 로드 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-hidden">
        {/* 헤더 */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-background to-muted/30">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Coins className="h-5 w-5 text-amber-500" />
              </motion.div>
              <span>{t("points.dashboard")}</span>
            </div>
            {/* 오늘 획득 포인트 뱃지 */}
            {data?.todayEarned ? (
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {t("points.todayEarned", { count: data.todayEarned })}
              </Badge>
            ) : null}
          </SheetTitle>
          <SheetDescription className="sr-only">포인트 현황 및 내역</SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-5rem)]">
          {isLoading ? (
            <PointsModalSkeleton />
          ) : data?.userPoints ? (
            <div className="p-6 space-y-6">
              {/* 메인 포인트 카드 - 연속 기록 중심 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative rounded-2xl border-2 overflow-hidden bg-gradient-to-br from-forest-50 to-emerald-50 dark:from-forest-950/30 dark:to-emerald-950/30 border-forest-200 dark:border-forest-800"
              >
                {/* 배경 패턴 */}
                <div className="absolute inset-0">
                  <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_30%_20%,currentColor_1px,transparent_1px)] [background-size:16px_16px]" />
                </div>

                {/* 상단 영역: 연속 기록 강조 */}
                <div className="relative px-5 pt-5 pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-amber-500" />
                      <span className="font-semibold text-foreground">{t("points.myPoints")}</span>
                    </div>

                    {/* 연속 기록 뱃지 - 핵심 동기부여 요소 */}
                    {data.userPoints.current_streak > 0 && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 border border-orange-200 dark:border-orange-800"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                        >
                          <Flame className="h-6 w-6 text-orange-500" />
                        </motion.div>
                        <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {data.userPoints.current_streak}일
                        </span>
                        <span className="text-[10px] text-orange-500/70">{t("points.streak")}</span>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* 중앙: 총 포인트 */}
                <div className="relative px-5 py-6 text-center">
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      {t("points.totalPoints")}
                    </div>
                    <AnimatedCounter
                      value={data.userPoints.total_points}
                      className="text-5xl font-extrabold tabular-nums tracking-tight text-forest-600 dark:text-forest-400"
                    />
                    <div className="mt-2 text-sm text-muted-foreground">
                      {t("points.lifetimePoints", { count: data.userPoints.lifetime_points.toLocaleString() })}
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* 통계 섹션 */}
              <div className="space-y-5">
                {/* 기간별 통계 카드 */}
                <div className="grid grid-cols-3 gap-3">
                  <StatCard
                    icon={Zap}
                    label={t("points.today")}
                    value={data.todayEarned}
                    color="text-amber-500"
                    bgColor="bg-amber-50 dark:bg-amber-950/30"
                    trend={data.todayEarned > 0 ? "up" : undefined}
                  />
                  <StatCard
                    icon={Calendar}
                    label={t("points.thisWeek")}
                    value={data.weeklyEarned}
                    color="text-blue-500"
                    bgColor="bg-blue-50 dark:bg-blue-950/30"
                  />
                  <StatCard
                    icon={TrendingUp}
                    label={t("points.thisMonth")}
                    value={data.monthlyEarned}
                    color="text-emerald-500"
                    bgColor="bg-emerald-50 dark:bg-emerald-950/30"
                  />
                </div>

                {/* 주간 활동 히트맵 (심리학적 요소: 시각적 습관 추적) */}
                <WeeklyActivityHeatmap
                  todayEarned={data.todayEarned}
                  streak={data.userPoints.current_streak}
                />

                {/* 연속 기록 정보 카드 - 손실 회피 심리 활용 */}
                {data.userPoints.current_streak > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-900/20 dark:via-amber-900/20 dark:to-yellow-900/20 border border-orange-200 dark:border-orange-800"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                          <Flame className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-orange-700 dark:text-orange-300">
                            {t("points.streakOngoing")}
                          </div>
                          <div className="text-xs text-orange-600/70 dark:text-orange-400/70">
                            {data.userPoints.current_streak >= 7
                              ? t("points.streakMilestoneHigh")
                              : t("points.streakMilestoneLow")}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                          {data.userPoints.current_streak}
                        </div>
                        <div className="text-xs text-orange-500/70">{t("points.consecutiveDays")}</div>
                      </div>
                    </div>

                    {/* 다음 마일스톤 안내 */}
                    {getNextMilestoneMessage(data.userPoints.current_streak, t) && (
                      <div className="mt-3 pt-3 border-t border-orange-200/50 dark:border-orange-700/50">
                        <div className="flex items-center gap-2 text-sm text-orange-600/80 dark:text-orange-400/80">
                          <Trophy className="h-4 w-4" />
                          <span>{getNextMilestoneMessage(data.userPoints.current_streak, t)}</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 상세 정보 카드 */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    {t("points.detailStats")}
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoItem
                      label={t("points.lifetimePointsLabel")}
                      value={data.userPoints.lifetime_points.toLocaleString()}
                      subValue="P"
                    />
                    <InfoItem
                      label={t("points.currentStreak")}
                      value={data.userPoints.current_streak.toString()}
                      subValue={t("points.daysStreak")}
                      highlight={data.userPoints.current_streak >= 7}
                    />
                    <InfoItem
                      label={t("points.longestStreak")}
                      value={data.userPoints.longest_streak.toString()}
                      subValue={t("points.daysStreak")}
                    />
                    <InfoItem
                      label={t("points.currentLevel")}
                      value={data.currentLevel?.title || t("points.defaultLevel")}
                      subValue={`Lv.${data.userPoints.current_level}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              {t("points.noData")}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

/**
 * 다음 마일스톤 메시지 생성
 */
function getNextMilestoneMessage(currentStreak: number, t: (key: any, params?: any) => string): string | null {
  if (currentStreak < 7) {
    const daysLeft = 7 - currentStreak;
    return t("points.milestone7", { days: daysLeft });
  } else if (currentStreak < 30) {
    const daysLeft = 30 - currentStreak;
    return t("points.milestone30", { days: daysLeft });
  } else if (currentStreak < 100) {
    const daysLeft = 100 - currentStreak;
    return t("points.milestone100", { days: daysLeft });
  }
  return null;
}

/**
 * 통계 카드 컴포넌트
 */
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  bgColor?: string;
  trend?: "up" | "down";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "p-4 rounded-xl border border-border/50 text-center transition-all",
        bgColor || "bg-muted/30"
      )}
    >
      <div className={cn(
        "w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center",
        "bg-background/80 shadow-sm"
      )}>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <div className="flex items-center justify-center gap-1">
        <span className="text-xl font-bold tabular-nums">
          {value > 0 ? "+" : ""}{value.toLocaleString()}
        </span>
        {trend === "up" && (
          <motion.div
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
          </motion.div>
        )}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </motion.div>
  );
}

/**
 * 주간 활동 히트맵 컴포넌트 (심리학적 요소: 시각적 습관 추적)
 */
function WeeklyActivityHeatmap({
  todayEarned,
  streak,
}: {
  todayEarned: number;
  streak: number;
}) {
  const { t } = useTranslation();
  // 월~일 순서로 요일 라벨 (Mon-Sun order)
  const days = [
    t("common.day1Mon"), t("common.day2Tue"), t("common.day3Wed"),
    t("common.day4Thu"), t("common.day5Fri"), t("common.day6Sat"), t("common.day0Sun"),
  ];
  const today = new Date().getDay();
  const adjustedToday = today === 0 ? 6 : today - 1; // 월요일 기준으로 조정

  // 스트릭 기반 활동일 계산
  const activeDays = useMemo(() => {
    const active = new Set<number>();
    // 오늘 활동이 있으면 오늘 추가
    if (todayEarned > 0) {
      active.add(adjustedToday);
    }
    // 스트릭 수만큼 이전 날짜들 추가
    for (let i = 1; i < Math.min(streak, 7); i++) {
      const dayIndex = (adjustedToday - i + 7) % 7;
      active.add(dayIndex);
    }
    return active;
  }, [todayEarned, streak, adjustedToday]);

  return (
    <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {t("points.weeklyActivity")}
        </h4>
        <span className="text-xs text-muted-foreground">
          {t("points.weeklyActivityCount", { count: activeDays.size })}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          const isActive = activeDays.has(index);
          const isToday = index === adjustedToday;
          const isFuture = index > adjustedToday;

          return (
            <motion.div
              key={day}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col items-center gap-1"
            >
              <span className={cn(
                "text-[10px]",
                isToday ? "font-bold text-primary" : "text-muted-foreground"
              )}>
                {day}
              </span>
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                  isActive && "bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-sm shadow-green-500/30",
                  !isActive && !isFuture && "bg-muted/50 text-muted-foreground",
                  isFuture && "bg-muted/20 text-muted-foreground/30",
                  isToday && !isActive && "ring-2 ring-primary/30"
                )}
              >
                {isActive ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    <Sparkles className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <span className="text-xs">{index + 1}</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 정보 항목 컴포넌트
 */
function InfoItem({
  label,
  value,
  subValue,
  highlight,
}: {
  label: string;
  value: string;
  subValue?: string;
  highlight?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn(
        "flex items-baseline gap-1",
        highlight && "text-orange-500"
      )}>
        <span className="text-lg font-bold">{value}</span>
        {subValue && (
          <span className="text-xs text-muted-foreground">{subValue}</span>
        )}
      </div>
    </div>
  );
}

/**
 * 애니메이션 카운터
 */
function AnimatedCounter({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const startTime = Date.now();
    const startValue = displayValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (value - startValue) * easeOut);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span className={className}>{displayValue.toLocaleString()}</span>;
}

/**
 * 모달 스켈레톤
 */
function PointsModalSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-64 w-full rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  );
}
