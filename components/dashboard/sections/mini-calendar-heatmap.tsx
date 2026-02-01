"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";

interface MiniCalendarHeatmapProps {
  dailyRecords: Record<string, number>;
  weeks?: number;
  className?: string;
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 컴팩트 독서 활동 히트맵 (GitHub 스타일)
 *
 * 심리학적 설계:
 * - 시각적 성취감: 채워진 셀이 동기 부여
 * - 연속성 시각화: 패턴을 통해 습관 형성 확인
 */
export function MiniCalendarHeatmap({
  dailyRecords,
  weeks = 12,
  className,
}: MiniCalendarHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const { heatmapData, stats } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 시작일: weeks주 전 일요일부터
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (weeks * 7 - 1) - today.getDay());

    // 주별 데이터 배열 (각 주는 7일 배열)
    const weeklyData: Array<{
      date: string;
      displayDate: string;
      count: number;
      isToday: boolean;
      isFuture: boolean;
    }[]> = [];

    let currentWeek: typeof weeklyData[0] = [];
    let totalRecords = 0;
    let recordedDays = 0;

    const current = new Date(startDate);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (6 - today.getDay()));

    while (current <= endDate) {
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
      const displayDate = `${current.getMonth() + 1}월 ${current.getDate()}일`;
      const count = dailyRecords[dateStr] || 0;
      const isToday = current.getTime() === today.getTime();
      const isFuture = current.getTime() > today.getTime();

      if (!isFuture && count > 0) {
        totalRecords += count;
        recordedDays++;
      }

      currentWeek.push({ date: dateStr, displayDate, count, isToday, isFuture });

      if (current.getDay() === 6) {
        weeklyData.push(currentWeek);
        currentWeek = [];
      }

      current.setDate(current.getDate() + 1);
    }

    if (currentWeek.length > 0) weeklyData.push(currentWeek);

    return {
      heatmapData: weeklyData,
      stats: { totalRecords, recordedDays },
    };
  }, [dailyRecords, weeks]);

  const maxCount = useMemo(() => Math.max(...Object.values(dailyRecords), 1), [dailyRecords]);

  const getIntensityClass = (count: number, isFuture: boolean) => {
    if (isFuture) return "bg-slate-100 dark:bg-slate-800/30";
    if (count === 0) return "bg-slate-200/70 dark:bg-slate-700/50";
    const intensity = Math.ceil((count / maxCount) * 4);
    const colors = [
      "bg-forest-300 dark:bg-forest-700",
      "bg-forest-400 dark:bg-forest-600",
      "bg-forest-500 dark:bg-forest-500",
      "bg-forest-600 dark:bg-forest-400",
    ];
    return colors[Math.min(intensity - 1, 3)];
  };

  return (
    <Card className={cn("p-3 border-slate-200 dark:border-slate-700/50", className)}>
      <div className="space-y-2">
        {/* 상단: 타이틀 + 통계 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                독서 활동
              </span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              최근 {weeks}주
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-forest-600 dark:text-forest-400">{stats.recordedDays}</span>일
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-forest-600 dark:text-forest-400">{stats.totalRecords}</span>개 기록
            </span>
          </div>
        </div>

        {/* 히트맵 그리드 - 요일 라벨 + 셀 */}
        <div className="flex gap-1">
          {/* 요일 라벨 (좌측) */}
          <div className="flex flex-col justify-between py-[1px]">
            {[0, 2, 4, 6].map((dayIndex) => (
              <span
                key={dayIndex}
                className="text-[9px] text-slate-400 dark:text-slate-500 leading-none h-[11px] flex items-center"
              >
                {DAY_LABELS[dayIndex]}
              </span>
            ))}
          </div>

          {/* 히트맵 본체 */}
          <div className="flex-1 overflow-hidden">
            <div
              className="grid gap-[2px]"
              style={{
                gridTemplateColumns: `repeat(${heatmapData.length}, minmax(0, 1fr))`,
                gridTemplateRows: "repeat(7, 11px)"
              }}
            >
              {/* 열 우선 배치: 각 주(열)의 7일을 순서대로 */}
              {heatmapData.map((week, weekIndex) =>
                week.map((day, dayIndex) => (
                  <motion.div
                    key={day.date}
                    className={cn(
                      "rounded-[2px] cursor-default relative",
                      getIntensityClass(day.count, day.isFuture),
                      day.isToday && "ring-1 ring-forest-500 ring-offset-1 ring-offset-white dark:ring-offset-slate-900",
                      !day.isFuture && day.count > 0 && "hover:ring-1 hover:ring-forest-400/50"
                    )}
                    style={{
                      gridColumn: weekIndex + 1,
                      gridRow: dayIndex + 1
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: weekIndex * 0.02 + dayIndex * 0.01 }}
                    onMouseEnter={() => !day.isFuture && setHoveredDay(day.date)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    {hoveredDay === day.date && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 whitespace-nowrap pointer-events-none">
                        <div className="bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] px-2 py-1 rounded shadow-lg">
                          <div className="font-medium">{day.displayDate} ({DAY_LABELS[dayIndex]})</div>
                          <div className="text-slate-300 dark:text-slate-600 text-[9px]">
                            {day.count > 0 ? `${day.count}개 기록` : "기록 없음"}
                          </div>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-100" />
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 하단: 범례 */}
        <div className="flex items-center justify-end gap-1.5">
          <span className="text-[9px] text-slate-400">적음</span>
          <div className="flex gap-[2px]">
            {[
              "bg-slate-200/70 dark:bg-slate-700/50",
              "bg-forest-300 dark:bg-forest-700",
              "bg-forest-400 dark:bg-forest-600",
              "bg-forest-500 dark:bg-forest-500",
              "bg-forest-600 dark:bg-forest-400",
            ].map((color, i) => (
              <div key={i} className={cn("w-[11px] h-[11px] rounded-[2px]", color)} />
            ))}
          </div>
          <span className="text-[9px] text-slate-400">많음</span>
        </div>
      </div>
    </Card>
  );
}

export function MiniCalendarHeatmapSkeleton() {
  return (
    <Card className="p-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>
        <div className="flex gap-1">
          {/* 요일 라벨 스켈레톤 */}
          <div className="flex flex-col justify-between py-[1px]">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-3 h-[11px] rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            ))}
          </div>
          {/* 히트맵 그리드 스켈레톤 */}
          <div className="flex-1">
            <div
              className="grid gap-[2px]"
              style={{
                gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
                gridTemplateRows: "repeat(7, 11px)"
              }}
            >
              {Array.from({ length: 84 }).map((_, i) => (
                <div key={i} className="rounded-[2px] bg-slate-200 dark:bg-slate-700 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>
      </div>
    </Card>
  );
}
