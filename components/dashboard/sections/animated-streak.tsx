"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Sparkles, Trophy, Star, Zap, Crown, Target, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface AnimatedStreakProps {
  streak: number;
  showCelebration?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// 스트릭 마일스톤 및 배지 정보
const MILESTONES = [3, 7, 14, 21, 30, 60, 90, 100, 180, 365];

interface MilestoneInfo {
  threshold: number;
  icon: typeof Flame;
  label: string;
  color: string;
  bgColor: string;
}

const MILESTONE_INFO: Record<number, MilestoneInfo> = {
  3: { threshold: 3, icon: Zap, label: "시작", color: "text-yellow-500", bgColor: "from-yellow-400 to-yellow-500" },
  7: { threshold: 7, icon: Star, label: "1주", color: "text-amber-500", bgColor: "from-amber-400 to-amber-500" },
  14: { threshold: 14, icon: Target, label: "2주", color: "text-orange-500", bgColor: "from-orange-400 to-orange-500" },
  21: { threshold: 21, icon: Award, label: "3주", color: "text-rose-500", bgColor: "from-rose-400 to-rose-500" },
  30: { threshold: 30, icon: Trophy, label: "1달", color: "text-red-500", bgColor: "from-red-400 to-red-500" },
  60: { threshold: 60, icon: Crown, label: "2달", color: "text-purple-500", bgColor: "from-purple-400 to-purple-500" },
  100: { threshold: 100, icon: Crown, label: "100일", color: "text-violet-500", bgColor: "from-violet-400 to-violet-500" },
  365: { threshold: 365, icon: Crown, label: "1년", color: "text-indigo-500", bgColor: "from-indigo-400 to-indigo-500" },
};

// 현재 달성한 가장 높은 마일스톤 찾기
const getCurrentMilestone = (streak: number): MilestoneInfo | null => {
  let currentMilestone: MilestoneInfo | null = null;
  for (const threshold of MILESTONES) {
    if (streak >= threshold && MILESTONE_INFO[threshold]) {
      currentMilestone = MILESTONE_INFO[threshold];
    }
  }
  return currentMilestone;
};

/**
 * 애니메이션 스트릭 컴포넌트
 *
 * 심리학적 효과:
 * - 가변 보상: 마일스톤별 다른 축하 효과
 * - 진행 피드백: 시각적 애니메이션으로 성취감 강화
 * - 목표 기울기 효과: 다음 마일스톤까지 진행률 표시
 */
export function AnimatedStreak({
  streak,
  showCelebration = true,
  size = "md",
  className,
}: AnimatedStreakProps) {
  const [prevStreak, setPrevStreak] = useState(streak);
  const [celebrating, setCelebrating] = useState(false);
  const [milestoneReached, setMilestoneReached] = useState<MilestoneInfo | null>(null);

  // 축하 효과 발생
  const triggerCelebration = useCallback((milestone: number | null) => {
    setCelebrating(true);

    if (milestone) {
      // 마일스톤 달성 시 큰 축하 (다양한 색상 + 더 많은 파티클)
      const colors = milestone >= 30
        ? ["#ec4899", "#f43f5e", "#ef4444", "#f97316", "#eab308"]
        : ["#f97316", "#fb923c", "#fdba74", "#fed7aa"];

      // 중앙 폭발
      confetti({
        particleCount: milestone >= 30 ? 150 : 80,
        spread: milestone >= 30 ? 100 : 70,
        origin: { y: 0.6, x: 0.5 },
        colors,
      });

      // 큰 마일스톤은 양쪽에서도 발사
      if (milestone >= 30) {
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.7 },
            colors,
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.7 },
            colors,
          });
        }, 200);
      }
    } else {
      // 일반 스트릭 증가 시 작은 축하
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7, x: 0.5 },
        colors: ["#f97316", "#fbbf24"],
        scalar: 0.8,
      });
    }

    setTimeout(() => {
      setCelebrating(false);
      setMilestoneReached(null);
    }, 2000);
  }, []);

  // 스트릭 증가 시 축하 효과
  useEffect(() => {
    if (streak > prevStreak && showCelebration) {
      // 마일스톤 달성 체크
      const reachedMilestone = MILESTONES.find(
        (m) => streak >= m && prevStreak < m
      );

      if (reachedMilestone && MILESTONE_INFO[reachedMilestone]) {
        setMilestoneReached(MILESTONE_INFO[reachedMilestone]);
        triggerCelebration(reachedMilestone);
      } else if (streak > 0) {
        triggerCelebration(null);
      }
    }
    setPrevStreak(streak);
  }, [streak, prevStreak, showCelebration, triggerCelebration]);

  const sizeClasses = {
    sm: {
      container: "p-2",
      icon: "h-3 w-3",
      number: "text-base",
      label: "text-[9px]",
      badge: "text-[7px] px-1",
    },
    md: {
      container: "p-3",
      icon: "h-4 w-4",
      number: "text-lg sm:text-xl",
      label: "text-[10px] sm:text-xs",
      badge: "text-[8px] px-1.5",
    },
    lg: {
      container: "p-4",
      icon: "h-5 w-5",
      number: "text-2xl sm:text-3xl",
      label: "text-xs sm:text-sm",
      badge: "text-[9px] px-2",
    },
  };

  const sizes = sizeClasses[size];
  const isActive = streak > 0;
  const currentMilestone = getCurrentMilestone(streak);
  const MilestoneIcon = currentMilestone?.icon || Flame;

  // 다음 마일스톤까지의 진행률 계산
  const getNextMilestoneProgress = () => {
    for (const m of MILESTONES) {
      if (streak < m) {
        const prevM = MILESTONES[MILESTONES.indexOf(m) - 1] || 0;
        return {
          next: m,
          progress: ((streak - prevM) / (m - prevM)) * 100,
        };
      }
    }
    return { next: null, progress: 100 };
  };

  const { next: nextMilestone, progress: progressToNext } = getNextMilestoneProgress();

  return (
    <div
      className={cn(
        "relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl text-center border border-white/50 dark:border-slate-700/50 overflow-hidden",
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
            className={cn(
              "absolute inset-0 rounded-xl -z-10",
              currentMilestone
                ? `bg-gradient-to-br ${currentMilestone.bgColor} opacity-20`
                : "bg-gradient-to-br from-orange-200/30 to-amber-200/30 dark:from-orange-800/20 dark:to-amber-800/20"
            )}
          />
        )}
      </AnimatePresence>

      {/* 마일스톤 달성 축하 오버레이 */}
      <AnimatePresence>
        {milestoneReached && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-amber-400/90 to-orange-500/90 rounded-xl"
          >
            <div className="flex flex-col items-center text-white">
              <motion.div
                animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                <milestoneReached.icon className="h-6 w-6 mb-1" />
              </motion.div>
              <span className="text-xs font-bold">{milestoneReached.label} 달성!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 축하 효과 배경 (일반) */}
      <AnimatePresence>
        {celebrating && !milestoneReached && (
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
                  scale: [1, 1.4, 1],
                  rotate: [0, -15, 15, 0],
                }
              : isActive
              ? {
                  scale: [1, 1.1, 1],
                }
              : {}
          }
          transition={
            celebrating
              ? { duration: 0.6, ease: "easeOut" }
              : { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <MilestoneIcon
            className={cn(
              sizes.icon,
              isActive
                ? currentMilestone?.color || "text-orange-500"
                : "text-slate-400",
              celebrating && "drop-shadow-lg"
            )}
          />
        </motion.div>

        {/* 숫자 애니메이션 */}
        <motion.span
          key={streak}
          initial={{ opacity: 0, y: -15, scale: 0.5 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
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
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 400 }}
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

      {/* 다음 마일스톤 진행률 바 */}
      {isActive && nextMilestone && size !== "sm" && (
        <div className="mt-1.5 px-1">
          <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressToNext}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <p className="text-[8px] text-slate-400 mt-0.5">
            {nextMilestone}일까지 {nextMilestone - streak}일
          </p>
        </div>
      )}

      {/* 마일스톤 뱃지 */}
      {currentMilestone && (
        <motion.div
          initial={{ opacity: 0, scale: 0, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, delay: 0.1 }}
          className="absolute -top-1 -right-1"
        >
          <div
            className={cn(
              "py-0.5 font-bold text-white shadow-sm rounded-full",
              sizes.badge,
              `bg-gradient-to-r ${currentMilestone.bgColor}`
            )}
          >
            {currentMilestone.label}
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
  if (streak === 1) return "좋은 시작이에요! 내일도 함께해요.";
  if (streak === 2) return "이틀째! 습관이 시작되고 있어요.";
  if (streak < 7) return `${streak}일 연속! 습관이 형성되고 있어요.`;
  if (streak === 7) return "일주일 달성! 첫 번째 마일스톤 축하해요!";
  if (streak < 14) return `${streak}일 연속! 꾸준함이 빛나요.`;
  if (streak === 14) return "2주 달성! 습관이 자리잡고 있어요!";
  if (streak < 21) return `${streak}일 연속! 정말 대단해요!`;
  if (streak === 21) return "3주 달성! 습관이 거의 완성됐어요!";
  if (streak < 30) return `${streak}일 연속! 한 달까지 조금만 더!`;
  if (streak === 30) return "한 달 달성! 놀라운 성취에요!";
  if (streak < 60) return `${streak}일 연속! 진정한 독서가!`;
  if (streak < 100) return `${streak}일 연속! 독서 습관의 달인!`;
  if (streak === 100) return "100일 달성! 당신은 진정한 챔피언!";
  if (streak < 365) return `${streak}일 연속! 전설이 만들어지고 있어요!`;
  return `${streak}일 연속! 1년을 넘겼어요! 당신은 독서 마스터!`;
}

/**
 * 다음 마일스톤까지 남은 일수
 */
export function getDaysToNextMilestone(streak: number): number | null {
  for (const m of MILESTONES) {
    if (streak < m) {
      return m - streak;
    }
  }
  return null;
}

/**
 * 스트릭 관련 동기부여 메시지 (가변 보상용 랜덤 메시지)
 */
export function getRandomStreakMotivation(streak: number): string {
  const messages = {
    low: [
      "작은 시작이 큰 변화를 만들어요!",
      "오늘 하루도 기록해봐요!",
      "한 줄이라도 좋아요!",
    ],
    medium: [
      "꾸준함이 빛나고 있어요!",
      "오늘도 함께해요!",
      "습관이 만들어지고 있어요!",
    ],
    high: [
      "당신의 꾸준함에 감동받았어요!",
      "진정한 독서가의 면모가 보여요!",
      "오늘도 멋진 하루 되세요!",
    ],
    master: [
      "당신은 진정한 독서 마스터!",
      "전설적인 기록이에요!",
      "당신의 습관이 영감을 줘요!",
    ],
  };

  let pool: string[];
  if (streak < 7) {
    pool = messages.low;
  } else if (streak < 30) {
    pool = messages.medium;
  } else if (streak < 100) {
    pool = messages.high;
  } else {
    pool = messages.master;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}
