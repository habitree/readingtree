"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface MiniCalendarHeatmapProps {
  /** 일별 기록 데이터 { "2025-01-20": 3, ... } */
  dailyRecords: Record<string, number>;
  /** 표시할 주 수 (기본: 5주) */
  weeks?: number;
  className?: string;
}

/**
 * 미니 달력 히트맵 컴포넌트
 *
 * 심리학적 설계:
 * - 성취 시각화: 채워진 날짜가 동기 부여
 * - Variable Reward: 연속 기록 마일스톤 표시
 * - Commitment Chain: 달력 체크 시각화로 일관성 유지
 */
export function MiniCalendarHeatmap({
  dailyRecords,
  weeks = 5,
  className,
}: MiniCalendarHeatmapProps) {
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

  // 현재 월의 달력 데이터 생성
  const calendarData = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();

    // 월의 첫날과 마지막 날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // 이번 달 첫 주의 시작 (일요일)
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    // 마지막 주의 끝 (토요일) - 최대 6주
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weeks: Array<Array<{
      date: string;
      day: number;
      count: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isFuture: boolean;
    }>> = [];

    let currentWeek: typeof weeks[0] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;

      currentWeek.push({
        date: dateStr,
        day: current.getDate(),
        count: dailyRecords[dateStr] || 0,
        isCurrentMonth: current.getMonth() === month,
        isToday: current.getTime() === today.getTime(),
        isFuture: current.getTime() > today.getTime(),
      });

      if (current.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      current.setDate(current.getDate() + 1);
    }

    return weeks;
  }, [viewMonth, dailyRecords]);

  // 이번 달 기록 통계
  const monthStats = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    let totalRecords = 0;
    let recordedDays = 0;

    Object.entries(dailyRecords).forEach(([dateStr, count]) => {
      const date = new Date(dateStr);
      if (date.getFullYear() === year && date.getMonth() === month) {
        totalRecords += count;
        if (count > 0) recordedDays++;
      }
    });

    return { totalRecords, recordedDays };
  }, [viewMonth, dailyRecords]);

  // 최대 기록 수 (색상 강도 계산용)
  const maxCount = useMemo(() => {
    return Math.max(...Object.values(dailyRecords), 1);
  }, [dailyRecords]);

  // 월 이동
  const goToPrevMonth = () => {
    setViewMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    const today = new Date();
    const nextMonth = new Date(viewMonth);
    nextMonth.setMonth(viewMonth.getMonth() + 1);
    if (nextMonth <= today) {
      setViewMonth(nextMonth);
    }
  };

  // 현재 월인지 확인
  const isCurrentMonth = useMemo(() => {
    const today = new Date();
    return (
      viewMonth.getFullYear() === today.getFullYear() &&
      viewMonth.getMonth() === today.getMonth()
    );
  }, [viewMonth]);

  const monthLabel = `${viewMonth.getFullYear()}년 ${viewMonth.getMonth() + 1}월`;

  return (
    <Card className={cn("p-3 sm:p-4 border-slate-100 dark:border-slate-800", className)}>
      <div className="space-y-3">
        {/* 헤더: 월 이동 + 통계 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevMonth}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="이전 달"
            >
              <ChevronLeft className="h-4 w-4 text-slate-500" />
            </button>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-[90px] text-center">
              {monthLabel}
            </span>
            <button
              onClick={goToNextMonth}
              disabled={isCurrentMonth}
              className={cn(
                "p-1 rounded-md transition-colors",
                isCurrentMonth
                  ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              )}
              aria-label="다음 달"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            <span>{monthStats.recordedDays}일 기록</span>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1">
          {dayLabels.map((label, i) => (
            <div
              key={label}
              className={cn(
                "text-center text-[10px] font-medium py-1",
                i === 0 ? "text-rose-400" : i === 6 ? "text-blue-400" : "text-slate-400"
              )}
            >
              {label}
            </div>
          ))}
        </div>

        {/* 달력 그리드 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={monthLabel}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-1"
          >
            {calendarData.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-1">
                {week.map((day, dayIndex) => (
                  <DayCell
                    key={day.date}
                    day={day.day}
                    count={day.count}
                    maxCount={maxCount}
                    isCurrentMonth={day.isCurrentMonth}
                    isToday={day.isToday}
                    isFuture={day.isFuture}
                    weekIndex={weekIndex}
                    dayIndex={dayIndex}
                  />
                ))}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* 범례 */}
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] text-slate-400">기록 없음</span>
          <div className="flex gap-0.5">
            <div className="h-3 w-3 rounded-sm bg-slate-100 dark:bg-slate-800" />
            <div className="h-3 w-3 rounded-sm bg-forest-200 dark:bg-forest-900" />
            <div className="h-3 w-3 rounded-sm bg-forest-300 dark:bg-forest-700" />
            <div className="h-3 w-3 rounded-sm bg-forest-400 dark:bg-forest-600" />
            <div className="h-3 w-3 rounded-sm bg-forest-500" />
          </div>
          <span className="text-[10px] text-slate-400">많음</span>
        </div>
      </div>
    </Card>
  );
}

interface DayCellProps {
  day: number;
  count: number;
  maxCount: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  weekIndex: number;
  dayIndex: number;
}

function DayCell({
  day,
  count,
  maxCount,
  isCurrentMonth,
  isToday,
  isFuture,
  weekIndex,
  dayIndex,
}: DayCellProps) {
  // 색상 강도 계산
  const getIntensityClass = () => {
    if (!isCurrentMonth || isFuture) return "bg-transparent";
    if (count === 0) return "bg-slate-100 dark:bg-slate-800";

    const intensity = Math.ceil((count / maxCount) * 4);
    const colors = [
      "bg-forest-200 dark:bg-forest-900",
      "bg-forest-300 dark:bg-forest-700",
      "bg-forest-400 dark:bg-forest-600",
      "bg-forest-500",
    ];
    return colors[Math.min(intensity - 1, 3)];
  };

  // 현재 월이 아닌 날짜
  if (!isCurrentMonth) {
    return (
      <div className="aspect-square flex items-center justify-center">
        <span className="text-[10px] text-slate-200 dark:text-slate-700">{day}</span>
      </div>
    );
  }

  // 오늘 날짜
  if (isToday) {
    return (
      <motion.div
        className={cn(
          "aspect-square rounded-md flex items-center justify-center relative overflow-hidden",
          count > 0
            ? getIntensityClass()
            : "border-2 border-dashed border-forest-400 dark:border-forest-500"
        )}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: weekIndex * 0.02 + dayIndex * 0.01 }}
      >
        {count === 0 && (
          <motion.div
            className="absolute inset-0 bg-forest-100 dark:bg-forest-900/30"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        <span
          className={cn(
            "text-[10px] font-bold relative z-10",
            count > 0
              ? "text-white"
              : "text-forest-600 dark:text-forest-400"
          )}
        >
          {day}
        </span>
      </motion.div>
    );
  }

  // 미래 날짜
  if (isFuture) {
    return (
      <div className="aspect-square flex items-center justify-center">
        <span className="text-[10px] text-slate-300 dark:text-slate-600">{day}</span>
      </div>
    );
  }

  // 일반 날짜
  return (
    <motion.div
      className={cn(
        "aspect-square rounded-md flex items-center justify-center cursor-default",
        getIntensityClass()
      )}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: weekIndex * 0.02 + dayIndex * 0.01 }}
      title={count > 0 ? `${count}개의 기록` : ""}
    >
      <span
        className={cn(
          "text-[10px]",
          count > 0
            ? count >= maxCount * 0.75
              ? "text-white font-medium"
              : "text-forest-800 dark:text-forest-100 font-medium"
            : "text-slate-400 dark:text-slate-500"
        )}
      >
        {day}
      </span>
    </motion.div>
  );
}

/**
 * MiniCalendarHeatmap 스켈레톤
 */
export function MiniCalendarHeatmapSkeleton() {
  return (
    <Card className="p-3 sm:p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-6 w-6 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
          <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>

        {/* 요일 헤더 스켈레톤 */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          ))}
        </div>

        {/* 달력 그리드 스켈레톤 */}
        {Array.from({ length: 5 }).map((_, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, dayIndex) => (
              <div
                key={dayIndex}
                className="aspect-square rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse"
              />
            ))}
          </div>
        ))}

        <div className="h-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse pt-2" />
      </div>
    </Card>
  );
}
