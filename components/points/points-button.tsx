"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Coins, Flame, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getUserPoints } from "@/app/actions/points";
import { LEVEL_STYLES, type UserPoints } from "@/types/points";

const PointsModal = dynamic(
  () => import("./points-modal").then((mod) => mod.PointsModal),
  { ssr: false }
);

interface PointsButtonProps {
  className?: string;
}

/**
 * 헤더에 표시되는 포인트 버튼
 * - 현재 포인트와 레벨 아이콘 표시
 * - 클릭 시 포인트 대시보드 모달 열기
 * - 포인트 변경 시 애니메이션 효과
 */
export function PointsButton({ className }: PointsButtonProps) {
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevPoints, setPrevPoints] = useState<number | null>(null);

  // 포인트 데이터 로드
  useEffect(() => {
    const loadPoints = async () => {
      try {
        const points = await getUserPoints();
        if (points) {
          // 포인트 변화 감지 및 애니메이션
          if (prevPoints !== null && points.total_points > prevPoints) {
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 1000);
          }
          setPrevPoints(points.total_points);
          setUserPoints(points);
        }
      } catch (error) {
        console.error("포인트 로드 오류:", error);
      }
    };

    loadPoints();

    // 주기적으로 포인트 업데이트 (30초마다)
    const interval = setInterval(loadPoints, 30000);
    return () => clearInterval(interval);
  }, [prevPoints]);

  // 포인트 증가량 계산
  const pointsGained = useMemo(() => {
    if (prevPoints === null || !userPoints) return 0;
    return userPoints.total_points - prevPoints;
  }, [prevPoints, userPoints?.total_points]);

  if (!userPoints) {
    return null;
  }

  const level = userPoints.current_level;
  const levelStyle = LEVEL_STYLES[level] || LEVEL_STYLES[1];
  const hasStreak = userPoints.current_streak > 0;
  const isHighLevel = level >= 7;

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "relative h-9 sm:h-10 px-2.5 sm:px-3 gap-1.5 rounded-xl",
                "hover:bg-accent/60 transition-all duration-200",
                "border border-transparent hover:border-border/50",
                isHighLevel && "bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20",
                className
              )}
              onClick={() => setIsModalOpen(true)}
              aria-label="포인트 대시보드"
            >
              {/* 레벨 이모지 - 개선된 애니메이션 */}
              <motion.span
                className={cn(
                  "text-base sm:text-lg",
                  levelStyle.effect === "glow" && "drop-shadow-[0_0_6px_currentColor]",
                  levelStyle.effect === "premium" && "drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                )}
                animate={
                  levelStyle.effect === "premium"
                    ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }
                    : levelStyle.effect === "glow"
                    ? { scale: [1, 1.05, 1] }
                    : {}
                }
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                {levelStyle.emoji}
              </motion.span>

              {/* 포인트 숫자 - 시각적 강화 */}
              <div className="flex flex-col items-start leading-none">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={userPoints.total_points}
                    initial={isAnimating ? { y: -8, opacity: 0, scale: 1.1 } : false}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 8, opacity: 0 }}
                    className={cn(
                      "font-bold text-sm sm:text-base tabular-nums",
                      isAnimating ? "text-green-500" : "text-foreground"
                    )}
                  >
                    {userPoints.total_points.toLocaleString()}
                  </motion.span>
                </AnimatePresence>
                <span className="text-[9px] text-muted-foreground hidden sm:block">
                  Lv.{level}
                </span>
              </div>

              {/* 스트릭 인디케이터 (작은 불꽃) */}
              {hasStreak && (
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="flex items-center gap-0.5 text-orange-500"
                >
                  <Flame className="h-3 w-3" />
                  <span className="text-[10px] font-semibold hidden sm:inline">
                    {userPoints.current_streak}
                  </span>
                </motion.div>
              )}

              {/* 포인트 증가 애니메이션 - 더 눈에 띄게 */}
              <AnimatePresence>
                {isAnimating && pointsGained > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.8 }}
                    animate={{ opacity: 1, y: -25, scale: 1 }}
                    exit={{ opacity: 0, y: -35, scale: 0.8 }}
                    transition={{ duration: 0.8 }}
                    className="absolute -top-1 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500 text-white text-xs font-bold shadow-lg"
                  >
                    <Sparkles className="h-3 w-3" />
                    +{pointsGained}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 코인 아이콘 - 숨김 처리 (이모지로 대체) */}
              {/* <Coins className="hidden sm:block h-3.5 w-3.5 text-amber-500" /> */}
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="p-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{levelStyle.emoji}</span>
            <div>
              <div className="font-semibold">
                Lv.{level} · {userPoints.total_points.toLocaleString()}P
              </div>
              <div className="text-xs text-muted-foreground">
                {hasStreak && (
                  <span className="text-orange-500 mr-2">
                    {userPoints.current_streak}일 연속
                  </span>
                )}
                클릭하여 대시보드 열기
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>

      {/* 포인트 대시보드 모달 */}
      <PointsModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
