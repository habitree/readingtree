"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Flame, Check, Circle } from "lucide-react";

interface WeeklyProgressDay {
  date: string;
  dayOfWeek: number;
  dayLabel: string;
  hasRecord: boolean;
  count: number;
  isToday: boolean;
  isFuture: boolean;
}

interface WeeklyProgressBarProps {
  days: WeeklyProgressDay[];
  recordedDays: number;
  totalDays: number;
  streak: number;
  streakStatus: "active" | "at_risk" | "none";
  className?: string;
}

/**
 * 이번 주 진행률 컴포넌트
 *
 * 심리학적 설계:
 * - Chain Effect: 연속 기록 시각화로 끊기 싫은 마음 유발
 * - Progress Illusion: 진행률 바로 완료 동기 부여
 * - Loss Aversion: 스트릭 위험 시 경고로 끊기 방지
 */
export function WeeklyProgressBar({
  days,
  recordedDays,
  totalDays,
  streak,
  streakStatus,
  className,
}: WeeklyProgressBarProps) {
  const progressPercent = (recordedDays / totalDays) * 100;

  // 스트릭 상태별 메시지
  const getStreakMessage = () => {
    if (streakStatus === "active") {
      if (streak >= 30) return `대단해요! ${streak}일 연속 기록 중!`;
      if (streak >= 14) return `${streak}일 연속! 습관이 되어가고 있어요`;
      if (streak >= 7) return `${streak}일 연속! 일주일 달성!`;
      if (streak >= 3) return `${streak}일 연속 기록 중!`;
      return `${streak}일 연속! 계속 이어가요`;
    }
    if (streakStatus === "at_risk") {
      return `${streak}일 기록 중 - 오늘 기록하면 유지!`;
    }
    return "오늘 첫 기록을 남겨보세요";
  };

  return (
    <Card className={cn("p-3 sm:p-4 border-slate-100 dark:border-slate-800", className)}>
      <div className="space-y-3">
        {/* 헤더: 제목 + 진행률 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            이번 주 독서 현황
          </span>
          <span className="text-sm font-semibold text-forest-600 dark:text-forest-400">
            {recordedDays}/{totalDays}일
          </span>
        </div>

        {/* 프로그레스 바 */}
        <div className="relative h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-forest-400 to-forest-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        {/* 요일별 체크 */}
        <div className="flex justify-between gap-1">
          {days.map((day, index) => (
            <motion.div
              key={day.date}
              className="flex flex-col items-center gap-1 flex-1"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {/* 요일 라벨 */}
              <span
                className={cn(
                  "text-[10px] font-medium",
                  day.isToday
                    ? "text-forest-600 dark:text-forest-400"
                    : "text-slate-400 dark:text-slate-500"
                )}
              >
                {day.dayLabel}
              </span>

              {/* 체크 아이콘 */}
              <DayIndicator
                hasRecord={day.hasRecord}
                isToday={day.isToday}
                isFuture={day.isFuture}
                count={day.count}
              />
            </motion.div>
          ))}
        </div>

        {/* 스트릭 메시지 */}
        <motion.div
          className={cn(
            "flex items-center justify-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800",
            streakStatus === "at_risk" && "text-amber-600 dark:text-amber-400"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {streak > 0 && (
            <motion.div
              animate={
                streakStatus === "at_risk"
                  ? { scale: [1, 1.1, 1] }
                  : {}
              }
              transition={{ duration: 0.5, repeat: streakStatus === "at_risk" ? Infinity : 0, repeatDelay: 1 }}
            >
              <Flame
                className={cn(
                  "h-4 w-4",
                  streakStatus === "active"
                    ? "text-orange-500"
                    : "text-amber-500"
                )}
              />
            </motion.div>
          )}
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {getStreakMessage()}
          </span>
        </motion.div>
      </div>
    </Card>
  );
}

interface DayIndicatorProps {
  hasRecord: boolean;
  isToday: boolean;
  isFuture: boolean;
  count: number;
}

function DayIndicator({ hasRecord, isToday, isFuture, count }: DayIndicatorProps) {
  // 미래 날짜
  if (isFuture) {
    return (
      <div className="h-6 w-6 flex items-center justify-center">
        <Circle className="h-3 w-3 text-slate-200 dark:text-slate-700" strokeWidth={1} />
      </div>
    );
  }

  // 기록 있음
  if (hasRecord) {
    return (
      <motion.div
        className={cn(
          "h-6 w-6 rounded-full flex items-center justify-center",
          "bg-forest-500 text-white"
        )}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </motion.div>
    );
  }

  // 오늘 (기록 없음)
  if (isToday) {
    return (
      <motion.div
        className={cn(
          "h-6 w-6 rounded-full border-2 border-dashed flex items-center justify-center",
          "border-forest-400 dark:border-forest-500"
        )}
        animate={{ borderColor: ["rgba(34, 197, 94, 0.4)", "rgba(34, 197, 94, 0.8)", "rgba(34, 197, 94, 0.4)"] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Circle className="h-2 w-2 text-forest-400" fill="currentColor" />
      </motion.div>
    );
  }

  // 과거 (기록 없음)
  return (
    <div className="h-6 w-6 flex items-center justify-center">
      <div className="h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}

/**
 * WeeklyProgressBar 스켈레톤
 */
export function WeeklyProgressBarSkeleton() {
  return (
    <Card className="p-3 sm:p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-4 w-12 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>
        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="flex justify-between gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div className="h-3 w-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-4 w-32 mx-auto rounded bg-slate-200 dark:bg-slate-700 animate-pulse pt-2" />
      </div>
    </Card>
  );
}
