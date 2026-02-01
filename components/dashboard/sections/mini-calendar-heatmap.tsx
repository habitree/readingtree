"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MiniCalendarHeatmapProps {
  dailyRecords: Record<string, number>;
  weeks?: number;
  className?: string;
}

/**
 * 컴팩트 독서 활동 히트맵
 * - 최근 N주간의 일별 기록을 시각화
 * - 색이 진할수록 기록이 많음
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

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (weeks * 7 - 1) - today.getDay());

    const data: Array<{
      date: string;
      displayDate: string;
      count: number;
      isToday: boolean;
      isFuture: boolean;
    }[]> = [];

    let currentWeek: typeof data[0] = [];
    let totalRecords = 0;
    let recordedDays = 0;

    const current = new Date(startDate);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (6 - today.getDay()));

    while (current <= endDate) {
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
      const displayDate = `${current.getMonth() + 1}/${current.getDate()}`;
      const count = dailyRecords[dateStr] || 0;
      const isToday = current.getTime() === today.getTime();
      const isFuture = current.getTime() > today.getTime();

      if (!isFuture && count > 0) {
        totalRecords += count;
        recordedDays++;
      }

      currentWeek.push({ date: dateStr, displayDate, count, isToday, isFuture });

      if (current.getDay() === 6) {
        data.push(currentWeek);
        currentWeek = [];
      }

      current.setDate(current.getDate() + 1);
    }

    if (currentWeek.length > 0) data.push(currentWeek);

    return {
      heatmapData: data,
      stats: { totalRecords, recordedDays, totalDays: weeks * 7 },
    };
  }, [dailyRecords, weeks]);

  const maxCount = useMemo(() => Math.max(...Object.values(dailyRecords), 1), [dailyRecords]);

  const getIntensityClass = (count: number, isFuture: boolean) => {
    if (isFuture) return "bg-slate-100 dark:bg-slate-800/40";
    if (count === 0) return "bg-slate-200 dark:bg-slate-700";
    const intensity = Math.ceil((count / maxCount) * 4);
    const colors = [
      "bg-forest-200 dark:bg-forest-800",
      "bg-forest-300 dark:bg-forest-600",
      "bg-forest-400 dark:bg-forest-500",
      "bg-forest-500 dark:bg-forest-400",
    ];
    return colors[Math.min(intensity - 1, 3)];
  };

  return (
    <Card className={cn("px-3 py-2.5 border-slate-200 dark:border-slate-700", className)}>
      {/* 한 줄 레이아웃: 설명 + 히트맵 + 통계 */}
      <div className="flex items-center gap-3">
        {/* 좌측: 설명 텍스트 */}
        <div className="shrink-0">
          <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
            최근 {weeks}주
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">
            독서 기록
          </div>
        </div>

        {/* 중앙: 히트맵 그리드 */}
        <div className="flex-1 flex gap-[2px] overflow-hidden">
          {heatmapData.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[2px]">
              {week.map((day) => (
                <motion.div
                  key={day.date}
                  className={cn(
                    "w-[8px] h-[8px] rounded-[2px] cursor-default relative",
                    getIntensityClass(day.count, day.isFuture),
                    day.isToday && "ring-1 ring-forest-500"
                  )}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: weekIndex * 0.008 }}
                  onMouseEnter={() => !day.isFuture && setHoveredDay(day.date)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {hoveredDay === day.date && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 whitespace-nowrap pointer-events-none">
                      <div className="bg-slate-800 dark:bg-white text-white dark:text-slate-800 text-[10px] px-1.5 py-1 rounded shadow-lg">
                        {day.displayDate}: {day.count > 0 ? `${day.count}개` : "없음"}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ))}
        </div>

        {/* 우측: 통계 + 범례 */}
        <div className="shrink-0 text-right">
          <div className="text-[11px] text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-forest-600 dark:text-forest-400">{stats.recordedDays}</span>
            <span className="text-slate-400 dark:text-slate-500">/{stats.totalDays}일</span>
          </div>
          <div className="flex items-center gap-[2px] justify-end mt-0.5">
            <span className="text-[8px] text-slate-400 mr-0.5">적음</span>
            {[
              "bg-slate-200 dark:bg-slate-700",
              "bg-forest-200 dark:bg-forest-800",
              "bg-forest-400 dark:bg-forest-500",
              "bg-forest-500 dark:bg-forest-400",
            ].map((color, i) => (
              <div key={i} className={cn("w-[6px] h-[6px] rounded-[1px]", color)} />
            ))}
            <span className="text-[8px] text-slate-400 ml-0.5">많음</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function MiniCalendarHeatmapSkeleton() {
  return (
    <Card className="px-3 py-2.5">
      <div className="flex items-center gap-3">
        <div className="shrink-0 space-y-1">
          <div className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-2.5 w-10 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>
        <div className="flex-1 flex gap-[2px]">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-[2px]">
              {Array.from({ length: 7 }).map((_, j) => (
                <div key={j} className="w-[8px] h-[8px] rounded-[2px] bg-slate-200 dark:bg-slate-700 animate-pulse" />
              ))}
            </div>
          ))}
        </div>
        <div className="shrink-0 space-y-1">
          <div className="h-3 w-10 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-2 w-14 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>
      </div>
    </Card>
  );
}
