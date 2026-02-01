"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Calendar, TrendingUp, Flame } from "lucide-react";

interface MiniCalendarHeatmapProps {
  /** 일별 기록 데이터 { "2025-01-20": 3, ... } */
  dailyRecords: Record<string, number>;
  /** 표시할 주 수 (기본: 10주) */
  weeks?: number;
  className?: string;
}

/**
 * 독서 활동 히트맵 컴포넌트
 *
 * 디자인 원칙:
 * - 요일 라벨로 시간적 맥락 제공
 * - 월 경계 표시로 기간 인식 용이
 * - 적절한 셀 크기로 터치/클릭 용이
 * - 통계 정보로 성취감 강화
 */
export function MiniCalendarHeatmap({
  dailyRecords,
  weeks = 10,
  className,
}: MiniCalendarHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

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
    let maxDayCount = 0;
    let currentStreak = 0;
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
      const displayDate = `${current.getMonth() + 1}/${current.getDate()}`;
      const count = dailyRecords[dateStr] || 0;
      const isToday = current.getTime() === today.getTime();
      const isFuture = current.getTime() > today.getTime();
      const month = current.getMonth();

      // 월 변경 감지
      if (month !== lastMonth && current.getDay() === 0) {
        months.push({ month, year: current.getFullYear(), weekIndex });
        lastMonth = month;
      }

      if (!isFuture) {
        if (count > 0) {
          totalRecords += count;
          recordedDays++;
          maxDayCount = Math.max(maxDayCount, count);
          tempStreak++;
        } else {
          if (tempStreak > currentStreak) {
            currentStreak = tempStreak;
          }
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

    // 마지막 연속 기록 확인
    if (tempStreak > currentStreak) {
      currentStreak = tempStreak;
    }

    return {
      heatmapData: data,
      stats: {
        totalRecords,
        recordedDays,
        totalDays: weeks * 7,
        maxDayCount,
        currentStreak,
        avgPerDay: recordedDays > 0 ? (totalRecords / recordedDays).toFixed(1) : "0",
      },
      monthLabels: months,
    };
  }, [dailyRecords, weeks]);

  // 최대값 계산
  const maxCount = useMemo(() => {
    return Math.max(...Object.values(dailyRecords), 1);
  }, [dailyRecords]);

  // 색상 강도 클래스
  const getIntensityClass = (count: number, isFuture: boolean) => {
    if (isFuture) return "bg-slate-50 dark:bg-slate-800/50";
    if (count === 0) return "bg-slate-100 dark:bg-slate-800";

    const intensity = Math.ceil((count / maxCount) * 4);
    const colors = [
      "bg-forest-200 dark:bg-forest-900/80",
      "bg-forest-300 dark:bg-forest-700",
      "bg-forest-400 dark:bg-forest-500",
      "bg-forest-500 dark:bg-forest-400",
    ];
    return colors[Math.min(intensity - 1, 3)];
  };

  const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

  return (
    <Card className={cn("p-3 sm:p-4 border-slate-100 dark:border-slate-800", className)}>
      <div className="space-y-3">
        {/* 헤더: 타이틀 + 통계 요약 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-forest-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              독서 활동
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1 text-slate-500">
              <span className="font-medium text-forest-600 dark:text-forest-400">{stats.recordedDays}</span>
              <span>일 기록</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <TrendingUp className="h-3 w-3" />
              <span className="font-medium text-forest-600 dark:text-forest-400">{stats.totalRecords}</span>
              <span>개</span>
            </div>
          </div>
        </div>

        {/* 월 라벨 */}
        <div className="flex pl-6">
          <div className="flex flex-1 relative h-4">
            {monthLabels.map((m, i) => (
              <span
                key={`${m.year}-${m.month}`}
                className="absolute text-[10px] text-slate-400 dark:text-slate-500"
                style={{ left: `${(m.weekIndex / heatmapData.length) * 100}%` }}
              >
                {monthNames[m.month]}
              </span>
            ))}
          </div>
        </div>

        {/* 히트맵 그리드 + 요일 라벨 */}
        <div className="flex gap-1.5">
          {/* 요일 라벨 */}
          <div className="flex flex-col gap-[3px] pt-0">
            {dayLabels.map((label, i) => (
              <div
                key={label}
                className={cn(
                  "h-[14px] sm:h-[16px] flex items-center justify-end pr-1",
                  // 월, 수, 금만 표시 (공간 절약)
                  i % 2 === 1 ? "text-[10px] text-slate-400 dark:text-slate-500" : "text-transparent text-[10px]"
                )}
              >
                {label}
              </div>
            ))}
          </div>

          {/* 히트맵 그리드 */}
          <div className="flex gap-[3px] flex-1 overflow-x-auto pb-1">
            {heatmapData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {week.map((day) => (
                  <motion.div
                    key={day.date}
                    className={cn(
                      "w-[14px] h-[14px] sm:w-[16px] sm:h-[16px] rounded-sm cursor-default relative",
                      getIntensityClass(day.count, day.isFuture),
                      day.isToday && "ring-2 ring-forest-500 ring-offset-1 ring-offset-white dark:ring-offset-slate-900",
                      !day.isFuture && day.count > 0 && "hover:ring-1 hover:ring-slate-400"
                    )}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      delay: weekIndex * 0.015,
                      duration: 0.2,
                    }}
                    onMouseEnter={() => !day.isFuture && setHoveredDay(day.date)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    {/* 툴팁 */}
                    {hoveredDay === day.date && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-10 whitespace-nowrap"
                      >
                        <div className="bg-slate-800 dark:bg-slate-700 text-white text-[10px] px-2 py-1 rounded shadow-lg">
                          <div className="font-medium">{day.displayDate}</div>
                          <div className="text-slate-300">
                            {day.count > 0 ? `${day.count}개 기록` : "기록 없음"}
                          </div>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* 하단: 범례 + 추가 통계 */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
          {/* 최장 연속 기록 */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Flame className="h-3.5 w-3.5 text-orange-400" />
            <span>최장 연속 <span className="font-medium text-slate-700 dark:text-slate-300">{stats.currentStreak}일</span></span>
          </div>

          {/* 범례 */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400">적음</span>
            <div className="flex gap-[2px]">
              <div className="w-[10px] h-[10px] rounded-[2px] bg-slate-100 dark:bg-slate-800" />
              <div className="w-[10px] h-[10px] rounded-[2px] bg-forest-200 dark:bg-forest-900/80" />
              <div className="w-[10px] h-[10px] rounded-[2px] bg-forest-300 dark:bg-forest-700" />
              <div className="w-[10px] h-[10px] rounded-[2px] bg-forest-400 dark:bg-forest-500" />
              <div className="w-[10px] h-[10px] rounded-[2px] bg-forest-500 dark:bg-forest-400" />
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
    <Card className="p-3 sm:p-4">
      <div className="space-y-3">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-3 w-10 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
        </div>

        {/* 월 라벨 */}
        <div className="h-4 ml-6" />

        {/* 히트맵 */}
        <div className="flex gap-1.5">
          <div className="flex flex-col gap-[3px]">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-[14px] sm:h-[16px] w-4" />
            ))}
          </div>
          <div className="flex gap-[3px] flex-1">
            {Array.from({ length: 10 }).map((_, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {Array.from({ length: 7 }).map((_, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="w-[14px] h-[14px] sm:w-[16px] sm:h-[16px] rounded-sm bg-slate-200 dark:bg-slate-700 animate-pulse"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* 하단 */}
        <div className="flex items-center justify-between pt-1">
          <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>
      </div>
    </Card>
  );
}
