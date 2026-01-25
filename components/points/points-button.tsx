"use client";

import { useState, useEffect } from "react";
import { Coins } from "lucide-react";
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
import { PointsModal } from "./points-modal";

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

  if (!userPoints) {
    return null;
  }

  const level = userPoints.current_level;
  const levelStyle = LEVEL_STYLES[level] || LEVEL_STYLES[1];

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "relative h-8 sm:h-10 px-2 sm:px-3 gap-1.5",
              "hover:bg-accent/50",
              className
            )}
            onClick={() => setIsModalOpen(true)}
            aria-label="포인트 대시보드"
          >
            {/* 레벨 이모지 */}
            <motion.span
              className={cn(
                "text-sm sm:text-base",
                levelStyle.effect === "glow" && "drop-shadow-[0_0_4px_currentColor]",
                levelStyle.effect === "premium" && "animate-pulse"
              )}
              animate={
                levelStyle.effect === "premium"
                  ? { rotate: [0, 5, -5, 0] }
                  : {}
              }
              transition={{ duration: 2, repeat: Infinity }}
            >
              {levelStyle.emoji}
            </motion.span>

            {/* 포인트 숫자 */}
            <AnimatePresence mode="popLayout">
              <motion.span
                key={userPoints.total_points}
                initial={isAnimating ? { y: -10, opacity: 0 } : false}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                className={cn(
                  "font-semibold text-xs sm:text-sm tabular-nums",
                  isAnimating && "text-green-500"
                )}
              >
                {userPoints.total_points.toLocaleString()}
              </motion.span>
            </AnimatePresence>

            {/* 포인트 증가 애니메이션 */}
            <AnimatePresence>
              {isAnimating && (
                <motion.div
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -20 }}
                  exit={{ opacity: 0 }}
                  className="absolute -top-2 right-0 text-xs font-bold text-green-500"
                >
                  +{prevPoints !== null ? userPoints.total_points - prevPoints : 0}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 코인 아이콘 (모바일에서는 숨김) */}
            <Coins className="hidden sm:block h-3.5 w-3.5 text-amber-500" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Lv.{level} {levelStyle.emoji} | {userPoints.total_points.toLocaleString()} 포인트</p>
        </TooltipContent>
      </Tooltip>

      {/* 포인트 대시보드 모달 */}
      <PointsModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
