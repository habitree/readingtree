"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MiniCalendarHeatmapProps {
  /** 일별 기록 데이터 { "2025-01-20": 3, ... } */
  dailyRecords: Record<string, number>;
  /** 표시할 주 수 (기본: 8주) */
  weeks?: number;
  className?: string;
}

/**
 * 컴팩트 히트맵 컴포넌트 (GitHub 스타일)
 *
 * 최근 N주의 기록을 작은 그리드로 시각화
 */
export function MiniCalendarHeatmap({
  dailyRecords,
  weeks = 8,
  className,
}: MiniCalendarHeatmapProps) {
  // 히트맵 데이터 생성 (최근 N주)
  const { heatmapData, stats } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 시작일 계산 (N주 전의 일요일)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (weeks * 7 - 1) - today.getDay());

    const data: Array<{
      date: string;
      count: number;
      dayOfWeek: number;
      isToday: boolean;
      isFuture: boolean;
    }[]> = [];

    let currentWeek: typeof data[0] = [];
    let totalRecords = 0;
    let recordedDays = 0;

    const current = new Date(startDate);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (6 - today.getDay())); // 이번 주 토요일까지

    while (current <= endDate) {
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
      const count = dailyRecords[dateStr] || 0;
      const isToday = current.getTime() === today.getTime();
      const isFuture = current.getTime() > today.getTime();

      if (!isFuture && count > 0) {
        totalRecords += count;
        recordedDays++;
      }

      currentWeek.push({
        date: dateStr,
        count,
        dayOfWeek: current.getDay(),
        isToday,
        isFuture,
      });

      if (current.getDay() === 6) {
        data.push(currentWeek);
        currentWeek = [];
      }

      current.setDate(current.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      data.push(currentWeek);
    }

    return {
      heatmapData: data,
      stats: { totalRecords, recordedDays },
    };
  }, [dailyRecords, weeks]);

  // 최대값 계산 (색상 강도용)
  const maxCount = useMemo(() => {
    return Math.max(...Object.values(dailyRecords), 1);
  }, [dailyRecords]);

  // 색상 강도 클래스
  const getIntensityClass = (count: number, isFuture: boolean) => {
    if (isFuture) return "bg-slate-50 dark:bg-slate-900";
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

  return (
    <Card className={cn("p-2.5 sm:p-3 border-slate-100 dark:border-slate-800", className)}>
      <div className="space-y-2">
        {/* 헤더: 제목 + 통계 */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            최근 {weeks}주 기록
          </span>
          <span className="text-xs text-slate-500">
            {stats.recordedDays}일 · {stats.totalRecords}개
          </span>
        </div>

        {/* 히트맵 그리드 */}
        <div className="flex gap-[3px] overflow-x-auto pb-1">
          {heatmapData.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((day, dayIndex) => (
                <motion.div
                  key={day.date}
                  className={cn(
                    "w-[10px] h-[10px] sm:w-[11px] sm:h-[11px] rounded-[2px]",
                    getIntensityClass(day.count, day.isFuture),
                    day.isToday && "ring-1 ring-forest-500 ring-offset-1 ring-offset-white dark:ring-offset-slate-900"
                  )}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: weekIndex * 0.02,
                    duration: 0.2,
                  }}
                  title={day.isFuture ? "" : `${day.date}: ${day.count}개`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* 범례 (매우 작게) */}
        <div className="flex items-center justify-end gap-1">
          <span className="text-[9px] text-slate-400">적음</span>
          <div className="flex gap-[2px]">
            <div className="w-[8px] h-[8px] rounded-[1px] bg-slate-100 dark:bg-slate-800" />
            <div className="w-[8px] h-[8px] rounded-[1px] bg-forest-200 dark:bg-forest-900" />
            <div className="w-[8px] h-[8px] rounded-[1px] bg-forest-400 dark:bg-forest-600" />
            <div className="w-[8px] h-[8px] rounded-[1px] bg-forest-500" />
          </div>
          <span className="text-[9px] text-slate-400">많음</span>
        </div>
      </div>
    </Card>
  );
}

/**
 * MiniCalendarHeatmap 스켈레톤
 */
export function MiniCalendarHeatmapSkeleton() {
  return (
    <Card className="p-2.5 sm:p-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>
        <div className="flex gap-[3px]">
          {Array.from({ length: 8 }).map((_, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }).map((_, dayIndex) => (
                <div
                  key={dayIndex}
                  className="w-[10px] h-[10px] sm:w-[11px] sm:h-[11px] rounded-[2px] bg-slate-200 dark:bg-slate-700 animate-pulse"
                />
              ))}
            </div>
          ))}
        </div>
        <div className="h-2 w-20 ml-auto rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
      </div>
    </Card>
  );
}
