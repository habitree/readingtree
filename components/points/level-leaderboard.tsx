"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, Medal } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLevelDistribution, getUserRank } from "@/app/actions/points";
import { LEVEL_STYLES, LEVEL_DEFAULTS } from "@/types/points";
import { Skeleton } from "@/components/ui/skeleton";

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

  if (isLoading) {
    return <LevelLeaderboardSkeleton />;
  }

  // 레벨 10부터 1까지 역순으로 표시
  const sortedDistribution = [...distribution].sort((a, b) => b.level - a.level);

  // 전체 사용자 수
  const totalUsers = distribution.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className={cn("space-y-4", className)}>
      {/* 사용자 순위 정보 */}
      {userRank && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Medal className="h-5 w-5 text-amber-500" />
              <span className="font-medium">나의 순위</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                상위 {userRank.percentile}%
              </div>
              <div className="text-sm text-muted-foreground">
                {userRank.rank.toLocaleString()}위 / {userRank.totalUsers.toLocaleString()}명
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 리더보드 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          레벨별 독서가 분포
        </h3>
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          총 {totalUsers.toLocaleString()}명
        </span>
      </div>

      {/* 레벨 분포 목록 */}
      <div className="space-y-2">
        {sortedDistribution.map((item, index) => {
          const levelStyle = LEVEL_STYLES[item.level] || LEVEL_STYLES[1];
          const levelInfo = LEVEL_DEFAULTS.find((l) => l.level === item.level);
          const isCurrentLevel = item.level === currentLevel;
          const percentage = totalUsers > 0 ? (item.count / totalUsers) * 100 : 0;

          return (
            <motion.div
              key={item.level}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "relative p-3 rounded-lg border transition-all",
                levelStyle.bgColor,
                levelStyle.borderColor,
                isCurrentLevel && "ring-2 ring-offset-2 ring-primary/50"
              )}
            >
              <div className="flex items-center justify-between">
                {/* 레벨 정보 */}
                <div className="flex items-center gap-3">
                  {/* 레벨 아이콘 */}
                  <motion.span
                    className={cn(
                      "text-xl",
                      levelStyle.effect === "glow" && "drop-shadow-[0_0_6px_currentColor]",
                      levelStyle.effect === "premium" && "animate-pulse"
                    )}
                    animate={
                      levelStyle.effect === "premium"
                        ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }
                        : levelStyle.effect === "glow"
                        ? { scale: [1, 1.05, 1] }
                        : {}
                    }
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {levelStyle.emoji}
                  </motion.span>

                  {/* 레벨 텍스트 */}
                  <div>
                    <div className={cn(
                      "font-semibold flex items-center gap-2",
                      levelStyle.textColor
                    )}>
                      Lv.{item.level}
                      <span className="text-sm font-normal">
                        {levelInfo?.title || item.title}
                      </span>
                      {isCurrentLevel && (
                        <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                          현재
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 인원 수 */}
                <div className="text-right">
                  <div className={cn(
                    "font-bold tabular-nums",
                    levelStyle.textColor
                  )}>
                    {item.count.toLocaleString()}명
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* 진행 바 */}
              <div className="mt-2 h-1.5 bg-background/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(percentage, 1)}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: levelStyle.color,
                  }}
                />
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
