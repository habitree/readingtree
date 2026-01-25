"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface AnimatedStreakProps {
  streak: number;
  showCelebration?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// 스트릭 마일스톤
const MILESTONES = [3, 7, 14, 21, 30, 60, 90, 100, 180, 365];

/**
 * 애니메이션 스트릭 컴포넌트
 */
export function AnimatedStreak({
  streak,
  showCelebration = true,
  size = "md",
  className,
}: AnimatedStreakProps) {
  const [prevStreak, setPrevStreak] = useState(streak);
  const [celebrating, setCelebrating] = useState(false);

  // 스트릭 증가 시 축하 효과
  useEffect(() => {
    if (streak > prevStreak && showCelebration) {
      // 마일스톤 달성 체크
      const reachedMilestone = MILESTONES.find(
        (m) => streak >= m && prevStreak < m
      );

      if (reachedMilestone || streak > 0) {
        setCelebrating(true);

        if (reachedMilestone) {
          // 마일스톤 달성 시 큰 축하
          confetti({
            particleCount: 80,
            spread: 80,
            origin: { y: 0.6, x: 0.5 },
            colors: ["#f97316", "#fb923c", "#fdba74", "#fed7aa"],
          });
        }

        setTimeout(() => setCelebrating(false), 1500);
      }
    }
    setPrevStreak(streak);
  }, [streak, prevStreak, showCelebration]);

  const sizeClasses = {
    sm: {
      container: "p-2",
      icon: "h-3 w-3",
      number: "text-base",
      label: "text-[9px]",
    },
    md: {
      container: "p-3",
      icon: "h-4 w-4",
      number: "text-lg sm:text-xl",
      label: "text-[10px] sm:text-xs",
    },
    lg: {
      container: "p-4",
      icon: "h-5 w-5",
      number: "text-2xl sm:text-3xl",
      label: "text-xs sm:text-sm",
    },
  };

  const sizes = sizeClasses[size];
  const isActive = streak > 0;

  return (
    <div
      className={cn(
        "relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl text-center border border-white/50 dark:border-slate-700/50",
        sizes.container,
        className
      )}
    >
      {/* 스트릭 배경 글로우 효과 */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-200/30 to-amber-200/30 dark:from-orange-800/20 dark:to-amber-800/20 -z-10"
          />
        )}
      </AnimatePresence>

      {/* 축하 효과 배경 */}
      <AnimatePresence>
        {celebrating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1.5 }}
            exit={{ opacity: 0, scale: 2 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-300/50 to-amber-300/50 -z-10"
          />
        )}
      </AnimatePresence>

      {/* 아이콘 + 숫자 */}
      <div className="flex items-center justify-center gap-1 mb-1">
        <motion.div
          animate={
            celebrating
              ? {
                  scale: [1, 1.3, 1],
                  rotate: [0, -10, 10, 0],
                }
              : isActive
              ? {
                  scale: [1, 1.1, 1],
                }
              : {}
          }
          transition={
            celebrating
              ? { duration: 0.5 }
              : { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <Flame
            className={cn(
              sizes.icon,
              isActive ? "text-orange-500" : "text-slate-400",
              celebrating && "text-orange-400"
            )}
          />
        </motion.div>

        {/* 숫자 애니메이션 */}
        <motion.span
          key={streak}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            sizes.number,
            "font-bold text-slate-900 dark:text-white"
          )}
        >
          {streak}
        </motion.span>

        {/* 축하 스파클 */}
        <AnimatePresence>
          {celebrating && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              <Sparkles className="h-3 w-3 text-amber-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 라벨 */}
      <p className={cn(sizes.label, "text-slate-500 dark:text-slate-400")}>
        연속 기록
      </p>

      {/* 마일스톤 뱃지 */}
      {streak >= 7 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-1 -right-1"
        >
          <div className="px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full text-[8px] font-bold text-white shadow-sm">
            {streak >= 365
              ? "1년+"
              : streak >= 100
              ? "100+"
              : streak >= 30
              ? "30+"
              : streak >= 7
              ? "7+"
              : ""}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/**
 * 스트릭 메시지 생성
 */
export function getStreakEncouragement(streak: number): string {
  if (streak === 0) return "오늘부터 시작해볼까요?";
  if (streak === 1) return "좋은 시작이에요!";
  if (streak < 3) return `${streak}일째 이어가고 있어요!`;
  if (streak < 7) return `${streak}일 연속! 좋은 습관이 만들어지고 있어요.`;
  if (streak < 14) return `${streak}일 연속! 일주일을 넘겼어요!`;
  if (streak < 30) return `${streak}일 연속! 대단해요!`;
  if (streak < 60) return `${streak}일 연속! 한 달을 넘겼어요! 🎉`;
  if (streak < 100) return `${streak}일 연속! 독서 습관의 달인!`;
  return `${streak}일 연속! 놀라운 기록이에요! 🏆`;
}
