"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
 * UX/UI 설계:
 * - 시각적 성취감: 채워진 셀이 동기 부여
 * - 연속성 시각화: 패턴을 통해 습관 형성 확인
 * - 모바일 최적화: 터치로 툴팁 토글
 * - 접근성: 충분한 터치 영역, 명확한 피드백
 */
export function MiniCalendarHeatmap({
  dailyRecords,
  weeks = 12,
  className,
}: MiniCalendarHeatmapProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // 외부 클릭 시 툴팁 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSelectedDay(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleDayClick = useCallback((date: string, isFuture: boolean) => {
    if (isFuture) return;
    setSelectedDay(prev => prev === date ? null : date);
  }, []);

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

  // 선택된 날짜 정보 찾기
  const selectedDayInfo = useMemo(() => {
    if (!selectedDay) return null;
    for (const week of heatmapData) {
      for (let dayIndex = 0; dayIndex < week.length; dayIndex++) {
        const day = week[dayIndex];
        if (day.date === selectedDay) {
          return { ...day, dayIndex };
        }
      }
    }
    return null;
  }, [selectedDay, heatmapData]);

  return (
    <Card
      ref={containerRef}
      className={cn(
        "p-3 border-slate-200 dark:border-slate-700/50 overflow-visible",
        className
      )}
    >
      <div className="space-y-2">
        {/* 상단: 타이틀 + 통계 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <Flame className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
              독서 활동
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
              {weeks}주
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] shrink-0">
            <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap">
              <span className="font-semibold text-forest-600 dark:text-forest-400">{stats.recordedDays}</span>일
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap">
              <span className="font-semibold text-forest-600 dark:text-forest-400">{stats.totalRecords}</span>개
            </span>
          </div>
        </div>

        {/* 히트맵 그리드 - 요일 라벨 + 셀 */}
        <div className="flex gap-1.5">
          {/* 요일 라벨 (좌측) */}
          <div className="flex flex-col justify-between py-[1px] shrink-0">
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
          <div className="flex-1 min-w-0">
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
                      "rounded-[2px] cursor-pointer relative",
                      getIntensityClass(day.count, day.isFuture),
                      day.isToday && "ring-1 ring-forest-500 ring-offset-1 ring-offset-white dark:ring-offset-slate-900",
                      selectedDay === day.date && "ring-2 ring-forest-500",
                      !day.isFuture && "hover:brightness-110 active:scale-95 transition-all"
                    )}
                    style={{
                      gridColumn: weekIndex + 1,
                      gridRow: dayIndex + 1
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: weekIndex * 0.015 + dayIndex * 0.005 }}
                    onClick={() => handleDayClick(day.date, day.isFuture)}
                    onMouseEnter={() => !day.isFuture && setSelectedDay(day.date)}
                    onMouseLeave={() => setSelectedDay(null)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* 선택된 날짜 정보 표시 (인라인) */}
        <AnimatePresence mode="wait">
          {selectedDayInfo && (
            <motion.div
              key={selectedDayInfo.date}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 rounded-md px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-3 h-3 rounded-sm shrink-0",
                    getIntensityClass(selectedDayInfo.count, selectedDayInfo.isFuture)
                  )} />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {selectedDayInfo.displayDate} ({DAY_LABELS[selectedDayInfo.dayIndex]})
                  </span>
                </div>
                <span className={cn(
                  "text-xs font-semibold",
                  selectedDayInfo.count > 0
                    ? "text-forest-600 dark:text-forest-400"
                    : "text-slate-400 dark:text-slate-500"
                )}>
                  {selectedDayInfo.count > 0 ? `${selectedDayInfo.count}개 기록` : "기록 없음"}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 하단: 범례 (선택된 날짜가 없을 때만 표시) */}
        {!selectedDayInfo && (
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
        )}
      </div>
    </Card>
  );
}

export function MiniCalendarHeatmapSkeleton() {
  return (
    <Card className="p-3">
      <div className="space-y-2">
        {/* 상단 헤더 스켈레톤 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-4 w-14 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-3 w-8 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-8 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-3 w-8 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
        </div>
        {/* 히트맵 스켈레톤 */}
        <div className="flex gap-1.5">
          {/* 요일 라벨 스켈레톤 */}
          <div className="flex flex-col justify-between py-[1px] shrink-0">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-3 h-[11px] rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            ))}
          </div>
          {/* 히트맵 그리드 스켈레톤 */}
          <div className="flex-1 min-w-0">
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
        {/* 범례 스켈레톤 */}
        <div className="flex justify-end gap-1.5">
          <div className="h-3 w-6 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="flex gap-[2px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[11px] h-[11px] rounded-[2px] bg-slate-200 dark:bg-slate-700 animate-pulse" />
            ))}
          </div>
          <div className="h-3 w-6 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>
      </div>
    </Card>
  );
}
