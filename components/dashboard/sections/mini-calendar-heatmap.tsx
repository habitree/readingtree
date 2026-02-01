"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Calendar, Flame } from "lucide-react";

interface MiniCalendarHeatmapProps {
  /** 일별 기록 데이터 { "2025-01-20": 3, ... } */
  dailyRecords: Record<string, number>;
  /** 표시할 주 수 (기본: 12주) */
  weeks?: number;
  className?: string;
}

/**
 * 독서 활동 히트맵 컴포넌트
 */
export function MiniCalendarHeatmap({
  dailyRecords,
  weeks = 12,
  className,
}: MiniCalendarHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  // 히트맵 데이터 생성
  const { heatmapData, stats, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 시작일: N주 전 일요일
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (weeks * 7 - 1) - today.getDay());

    const data: Array<{
      date: string;
      displayDate: string;
      count: number;
      dayOfWeek: number;
      isToday: boolean;
      isFuture: boolean;
      month: number;
    }[]> = [];

    let currentWeek: typeof data[0] = [];
    let totalRecords = 0;
    let recordedDays = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    // 월 라벨 위치 계산용
    const months: { month: number; year: number; weekIndex: number }[] = [];
    let lastMonth = -1;

    const current = new Date(startDate);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (6 - today.getDay()));

    let weekIndex = 0;

    while (current <= endDate) {
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
      const displayDate = `${current.getMonth() + 1}월 ${current.getDate()}일`;
      const count = dailyRecords[dateStr] || 0;
      const isToday = current.getTime() === today.getTime();
      const isFuture = current.getTime() > today.getTime();
      const month = current.getMonth();

      // 월 변경 감지 (첫 번째 또는 월이 바뀔 때)
      if (month !== lastMonth) {
        months.push({ month, year: current.getFullYear(), weekIndex });
        lastMonth = month;
      }

      if (!isFuture) {
        if (count > 0) {
          totalRecords += count;
          recordedDays++;
          tempStreak++;
        } else {
          if (tempStreak > maxStreak) maxStreak = tempStreak;
          tempStreak = 0;
        }
      }

      currentWeek.push({
        date: dateStr,
        displayDate,
        count,
        dayOfWeek: current.getDay(),
        isToday,
        isFuture,
        month,
      });

      if (current.getDay() === 6) {
        data.push(currentWeek);
        currentWeek = [];
        weekIndex++;
      }

      current.setDate(current.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      data.push(currentWeek);
    }

    if (tempStreak > maxStreak) maxStreak = tempStreak;

    return {
      heatmapData: data,
      stats: { totalRecords, recordedDays, maxStreak },
      monthLabels: months,
    };
  }, [dailyRecords, weeks]);

  // 최대값 계산
  const maxCount = useMemo(() => {
    return Math.max(...Object.values(dailyRecords), 1);
  }, [dailyRecords]);

  // 색상 강도 클래스
  const getIntensityClass = (count: number, isFuture: boolean) => {
    if (isFuture) return "bg-slate-100/50 dark:bg-slate-800/30";
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

  const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
  const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <Card className={cn("p-4 border-slate-200 dark:border-slate-700", className)}>
      <div className="space-y-3">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-forest-500" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              독서 활동
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              <span className="font-semibold text-forest-600 dark:text-forest-400">{stats.recordedDays}</span>일 기록
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span>
              <span className="font-semibold text-forest-600 dark:text-forest-400">{stats.totalRecords}</span>개
            </span>
          </div>
        </div>

        {/* 월 라벨 + 히트맵 */}
        <div className="space-y-1">
          {/* 월 라벨 행 */}
          <div className="flex">
            <div className="w-7 shrink-0" /> {/* 요일 라벨 공간 */}
            <div className="flex-1 flex relative h-4">
              {monthLabels.map((m, idx) => {
                // 다음 월까지의 거리 계산
                const nextMonth = monthLabels[idx + 1];
                const endWeek = nextMonth ? nextMonth.weekIndex : heatmapData.length;
                const span = endWeek - m.weekIndex;

                // 충분한 공간이 있을 때만 표시
                if (span < 2) return null;

                return (
                  <span
                    key={`${m.year}-${m.month}`}
                    className="text-[10px] text-slate-500 dark:text-slate-400 absolute"
                    style={{
                      left: `${(m.weekIndex / heatmapData.length) * 100}%`,
                    }}
                  >
                    {monthNames[m.month]}
                  </span>
                );
              })}
            </div>
          </div>

          {/* 요일 라벨 + 히트맵 그리드 */}
          <div className="flex gap-1">
            {/* 요일 라벨 */}
            <div className="w-6 shrink-0 flex flex-col justify-between py-[2px]">
              {dayLabels.map((label, i) => (
                <div
                  key={label}
                  className={cn(
                    "h-3 text-[10px] leading-3 text-right pr-1",
                    i % 2 === 1
                      ? "text-slate-400 dark:text-slate-500"
                      : "text-transparent select-none"
                  )}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* 히트맵 그리드 */}
            <div className="flex-1 flex gap-[3px]">
              {heatmapData.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px] flex-1">
                  {week.map((day) => (
                    <motion.div
                      key={day.date}
                      className={cn(
                        "aspect-square rounded-sm cursor-default relative",
                        getIntensityClass(day.count, day.isFuture),
                        day.isToday && "ring-2 ring-forest-500 ring-offset-1 ring-offset-white dark:ring-offset-slate-900"
                      )}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: weekIndex * 0.01, duration: 0.15 }}
                      onMouseEnter={() => !day.isFuture && setHoveredDay(day.date)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      {/* 툴팁 */}
                      {hoveredDay === day.date && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 whitespace-nowrap pointer-events-none">
                          <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] px-2 py-1.5 rounded-md shadow-lg">
                            <div className="font-medium">{day.displayDate}</div>
                            <div className="text-slate-300 dark:text-slate-600">
                              {day.count > 0 ? `${day.count}개 기록` : "기록 없음"}
                            </div>
                          </div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900 dark:border-t-slate-100" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 하단: 최장 연속 + 범례 */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            <span>최장 연속</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{stats.maxStreak}일</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400">적음</span>
            <div className="flex gap-[2px]">
              <div className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-700" />
              <div className="w-3 h-3 rounded-sm bg-forest-200 dark:bg-forest-800" />
              <div className="w-3 h-3 rounded-sm bg-forest-300 dark:bg-forest-600" />
              <div className="w-3 h-3 rounded-sm bg-forest-400 dark:bg-forest-500" />
              <div className="w-3 h-3 rounded-sm bg-forest-500 dark:bg-forest-400" />
            </div>
            <span className="text-[10px] text-slate-400">많음</span>
          </div>
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
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
          <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>

        <div className="space-y-1">
          <div className="h-4 ml-7" />
          <div className="flex gap-1">
            <div className="w-6 shrink-0" />
            <div className="flex-1 flex gap-[3px]">
              {Array.from({ length: 12 }).map((_, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px] flex-1">
                  {Array.from({ length: 7 }).map((_, dayIndex) => (
                    <div
                      key={dayIndex}
                      className="aspect-square rounded-sm bg-slate-200 dark:bg-slate-700 animate-pulse"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>
      </div>
    </Card>
  );
}
