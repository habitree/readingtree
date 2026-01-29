"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, Medal, Crown, Star, ChevronUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLevelDistribution, getUserRank } from "@/app/actions/points";
import { LEVEL_STYLES, LEVEL_DEFAULTS } from "@/types/points";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { LevelBadgeImage } from "./level-badge-image";

interface LevelDistribution {
  level: number;
  count: number;
  title: string;
  badge_icon: string;
}

interface UserRank {
  rank: number;
  totalUsers: number;
  percentile: number;
}

interface LevelLeaderboardProps {
  currentLevel: number;
  className?: string;
}

/**
 * 레벨별 사용자 분포 리더보드
 * - 각 레벨별 사용자 수 표시
 * - 현재 사용자 레벨 하이라이트
 * - 상위 N% 표시
 */
export function LevelLeaderboard({ currentLevel, className }: LevelLeaderboardProps) {
  const [distribution, setDistribution] = useState<LevelDistribution[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [dist, rank] = await Promise.all([
          getLevelDistribution(),
          getUserRank(),
        ]);
        setDistribution(dist);
        setUserRank(rank);
      } catch (error) {
        console.error("리더보드 데이터 로드 오류:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // 사용자 순위 티어 계산 (심리학적 요소)
  const rankTier = useMemo(() => {
    if (!userRank) return null;
    const p = userRank.percentile;
    if (p <= 1) return { name: "다이아몬드", color: "text-cyan-500", bgColor: "bg-cyan-50 dark:bg-cyan-950/30", icon: Crown };
    if (p <= 5) return { name: "플래티넘", color: "text-purple-500", bgColor: "bg-purple-50 dark:bg-purple-950/30", icon: Star };
    if (p <= 10) return { name: "골드", color: "text-amber-500", bgColor: "bg-amber-50 dark:bg-amber-950/30", icon: Medal };
    if (p <= 25) return { name: "실버", color: "text-slate-400", bgColor: "bg-slate-50 dark:bg-slate-950/30", icon: Medal };
    return { name: "브론즈", color: "text-orange-400", bgColor: "bg-orange-50 dark:bg-orange-950/30", icon: Medal };
  }, [userRank?.percentile]);

  if (isLoading) {
    return <LevelLeaderboardSkeleton />;
  }

  // 레벨 10부터 1까지 역순으로 표시
  const sortedDistribution = [...distribution].sort((a, b) => b.level - a.level);

  // 전체 사용자 수
  const totalUsers = distribution.reduce((sum, d) => sum + d.count, 0);

  // 가장 많은 인원의 레벨 찾기 (비교 기준)
  const maxCount = Math.max(...distribution.map(d => d.count));

  return (
    <div className={cn("space-y-5", className)}>
      {/* 사용자 순위 정보 - 대폭 개선 */}
      {userRank && rankTier && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-5 rounded-2xl border-2 relative overflow-hidden",
            rankTier.bgColor,
            "border-current/20"
          )}
        >
          {/* 배경 장식 */}
          <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
            <rankTier.icon className="w-full h-full" />
          </div>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center shadow-lg",
                  "bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900"
                )}
              >
                <rankTier.icon className={cn("h-7 w-7", rankTier.color)} />
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-lg font-bold", rankTier.color)}>
                    {rankTier.name} 등급
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    상위 {userRank.percentile}%
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Users className="h-3.5 w-3.5" />
                  {userRank.rank.toLocaleString()}위 / {userRank.totalUsers.toLocaleString()}명
                </div>
              </div>
            </div>

            {/* 순위 상승 힌트 (심리학적 동기부여) */}
            {userRank.percentile > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-right"
              >
                <div className="text-xs text-muted-foreground">다음 등급까지</div>
                <div className="flex items-center gap-1 text-green-500">
                  <ChevronUp className="h-4 w-4" />
                  <span className="font-semibold">
                    {userRank.percentile <= 5 ? "조금만 더!" :
                     userRank.percentile <= 10 ? "분발하세요!" :
                     "도전하세요!"}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* 리더보드 헤더 */}
      <div className="flex items-center justify-between px-1">
        <h3 className="font-semibold flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          레벨별 독서가 분포
        </h3>
        <Badge variant="outline" className="text-xs">
          <Users className="h-3 w-3 mr-1" />
          {totalUsers.toLocaleString()}명
        </Badge>
      </div>

      {/* 레벨 분포 목록 - 디자인 개선 */}
      <div className="space-y-2.5">
        {sortedDistribution.map((item, index) => {
          const levelStyle = LEVEL_STYLES[item.level] || LEVEL_STYLES[1];
          const levelInfo = LEVEL_DEFAULTS.find((l) => l.level === item.level);
          const isCurrentLevel = item.level === currentLevel;
          const percentage = totalUsers > 0 ? (item.count / totalUsers) * 100 : 0;
          const relativePercentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
          const isTopLevel = item.level >= 8;

          return (
            <motion.div
              key={item.level}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              whileHover={{ scale: 1.01 }}
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all cursor-default",
                levelStyle.bgColor,
                levelStyle.borderColor,
                isCurrentLevel && "ring-2 ring-offset-2 ring-primary shadow-lg"
              )}
            >
              {/* 현재 레벨 표시 */}
              {isCurrentLevel && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg"
                >
                  <Star className="h-3.5 w-3.5 text-primary-foreground fill-current" />
                </motion.div>
              )}

              {/* 상위 레벨 효과 */}
              {isTopLevel && (
                <motion.div
                  className="absolute top-2 right-2"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className={cn("h-4 w-4", levelStyle.textColor)} />
                </motion.div>
              )}

              <div className="flex items-center gap-4">
                {/* 레벨 아이콘 */}
                <div className="relative">
                  <LevelBadgeImage
                    level={item.level}
                    size="md"
                    animated={levelStyle.effect !== "none"}
                    showGlow={levelStyle.effect === "glow" || levelStyle.effect === "premium"}
                  />
                </div>

                {/* 레벨 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("font-bold", levelStyle.textColor)}>
                      Lv.{item.level}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {levelInfo?.title || item.title}
                    </span>
                    {isCurrentLevel && (
                      <Badge className="text-[10px] px-1.5 py-0 h-5">
                        현재
                      </Badge>
                    )}
                  </div>

                  {/* 상대적 진행 바 */}
                  <div className="mt-2 h-2 bg-background/60 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(relativePercentage, 2)}%` }}
                      transition={{ duration: 0.6, delay: index * 0.04 }}
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${levelStyle.color}80, ${levelStyle.color})`,
                      }}
                    />
                  </div>
                </div>

                {/* 인원 수 */}
                <div className="text-right">
                  <div className={cn(
                    "text-lg font-bold tabular-nums",
                    levelStyle.textColor
                  )}>
                    {item.count.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 리더보드 스켈레톤
 */
export function LevelLeaderboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
