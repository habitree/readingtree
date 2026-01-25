"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  Flame,
  TrendingUp,
  Calendar,
  Zap,
  Target,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getPointsDashboardData } from "@/app/actions/points";
import { LEVEL_STYLES, LEVEL_DEFAULTS, type PointsDashboardData } from "@/types/points";
import { LevelLeaderboard } from "./level-leaderboard";

interface PointsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 포인트 대시보드 모달 (Sheet)
 * - 개인 포인트 정보
 * - 레벨 진행률
 * - 리더보드 (레벨별 분포)
 */
export function PointsModal({ open, onOpenChange }: PointsModalProps) {
  const [data, setData] = useState<PointsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

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

  const level = data?.userPoints?.current_level || 1;
  const levelStyle = LEVEL_STYLES[level] || LEVEL_STYLES[1];
  const levelInfo = LEVEL_DEFAULTS.find((l) => l.level === level);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            포인트 대시보드
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-5rem)]">
          {isLoading ? (
            <PointsModalSkeleton />
          ) : data?.userPoints ? (
            <div className="p-6 space-y-6">
              {/* 메인 포인트 카드 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "p-6 rounded-2xl border-2 relative overflow-hidden",
                  levelStyle.bgColor,
                  levelStyle.borderColor
                )}
              >
                {/* 배경 패턴 */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,currentColor_1px,transparent_1px)] [background-size:20px_20px]" />
                </div>

                <div className="relative">
                  {/* 레벨 뱃지 */}
                  <div className="flex items-center justify-between mb-4">
                    <motion.div
                      className="flex items-center gap-3"
                      animate={
                        levelStyle.effect === "premium"
                          ? { scale: [1, 1.02, 1] }
                          : {}
                      }
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <span
                        className={cn(
                          "text-4xl",
                          levelStyle.effect === "glow" && "drop-shadow-[0_0_8px_currentColor]",
                          levelStyle.effect === "premium" && "animate-pulse"
                        )}
                      >
                        {levelStyle.emoji}
                      </span>
                      <div>
                        <div className={cn("text-2xl font-bold", levelStyle.textColor)}>
                          Lv.{level}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {levelInfo?.title}
                        </div>
                      </div>
                    </motion.div>

                    {/* 스트릭 */}
                    {data.userPoints.current_streak > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                        <Flame className="h-4 w-4" />
                        <span className="font-semibold text-sm">
                          {data.userPoints.current_streak}일
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 총 포인트 */}
                  <div className="text-center py-4">
                    <AnimatedCounter
                      value={data.userPoints.total_points}
                      className={cn("text-5xl font-bold tabular-nums", levelStyle.textColor)}
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                      총 포인트
                    </div>
                  </div>

                  {/* 다음 레벨 진행률 */}
                  {data.nextLevel && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">다음 레벨까지</span>
                        <span className="font-medium">
                          {data.nextLevel.required_points - data.userPoints.lifetime_points} P 필요
                        </span>
                      </div>
                      <Progress
                        value={data.progressToNextLevel}
                        className="h-2"
                        style={{
                          // @ts-ignore
                          "--progress-background": levelStyle.color,
                        }}
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Lv.{level}</span>
                        <span>{data.progressToNextLevel}%</span>
                        <span>Lv.{data.nextLevel.level}</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* 탭 네비게이션 */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="overview">개요</TabsTrigger>
                  <TabsTrigger value="ranking">랭킹</TabsTrigger>
                </TabsList>

                {/* 개요 탭 */}
                <TabsContent value="overview" className="mt-4 space-y-4">
                  {/* 통계 카드들 */}
                  <div className="grid grid-cols-3 gap-3">
                    <StatCard
                      icon={Calendar}
                      label="오늘"
                      value={data.todayEarned}
                      color="text-blue-500"
                    />
                    <StatCard
                      icon={TrendingUp}
                      label="이번 주"
                      value={data.weeklyEarned}
                      color="text-green-500"
                    />
                    <StatCard
                      icon={Target}
                      label="이번 달"
                      value={data.monthlyEarned}
                      color="text-purple-500"
                    />
                  </div>

                  {/* 스트릭 보너스 정보 */}
                  {data.userPoints.streak_bonus_multiplier > 1 && (
                    <div className="p-4 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-orange-500" />
                        <span className="font-medium">스트릭 보너스 활성화</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        현재 {((data.userPoints.streak_bonus_multiplier - 1) * 100).toFixed(0)}% 추가 포인트 획득 중
                      </p>
                    </div>
                  )}

                  {/* 레벨 정보 */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground">레벨 정보</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>현재 레벨</span>
                        <span className="font-medium">{levelInfo?.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>누적 포인트</span>
                        <span className="font-medium">{data.userPoints.lifetime_points.toLocaleString()} P</span>
                      </div>
                      <div className="flex justify-between">
                        <span>최장 연속 기록</span>
                        <span className="font-medium">{data.userPoints.longest_streak}일</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* 랭킹 탭 */}
                <TabsContent value="ranking" className="mt-4">
                  <LevelLeaderboard currentLevel={level} />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              포인트 데이터를 불러올 수 없습니다
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

/**
 * 통계 카드 컴포넌트
 */
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-muted/30 text-center">
      <Icon className={cn("h-4 w-4 mx-auto mb-1", color)} />
      <div className="font-bold tabular-nums">{value.toLocaleString()}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
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
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
