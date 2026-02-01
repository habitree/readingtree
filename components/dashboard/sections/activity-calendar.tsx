"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarDays, PenTool, Camera, FileText } from "lucide-react";
import type { DailyRecordByType } from "@/app/actions/stats";

interface ActivityCalendarProps {
  dailyRecordsByType: Record<string, DailyRecordByType>;
  className?: string;
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTH_LABELS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

// 타입별 색상 정의
const TYPE_COLORS = {
  transcription: {
    bg: "bg-purple-400 dark:bg-purple-500",
    text: "text-purple-600 dark:text-purple-400",
    label: "필사",
    icon: FileText,
  },
  photo: {
    bg: "bg-blue-400 dark:bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
    label: "사진",
    icon: Camera,
  },
  memo: {
    bg: "bg-emerald-400 dark:bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    label: "기록",
    icon: PenTool,
  },
};

/**
 * 30일 독서활동 캘린더
 * 타입별 색상 구분: 필사(보라), 사진(파랑), 기록(초록)
 */
export function ActivityCalendar({
  dailyRecordsByType,
  className,
}: ActivityCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 30일 캘린더 데이터 생성
  const { calendarData, stats } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: Array<{
      date: string;
      displayDate: string;
      dayOfWeek: number;
      dayOfMonth: number;
      month: number;
      records: DailyRecordByType | null;
      isToday: boolean;
      isFuture: boolean;
    }> = [];

    let totalRecords = 0;
    let transcriptionCount = 0;
    let photoCount = 0;
    let memoCount = 0;
    let recordedDays = 0;

    // 최근 30일 (오늘 포함)
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const displayDate = `${date.getMonth() + 1}월 ${date.getDate()}일`;
      const records = dailyRecordsByType[dateStr] || null;
      const isToday = i === 0;

      if (records && records.total > 0) {
        totalRecords += records.total;
        transcriptionCount += records.transcription;
        photoCount += records.photo;
        memoCount += records.memo + records.quote;
        recordedDays++;
      }

      days.push({
        date: dateStr,
        displayDate,
        dayOfWeek: date.getDay(),
        dayOfMonth: date.getDate(),
        month: date.getMonth(),
        records,
        isToday,
        isFuture: false,
      });
    }

    return {
      calendarData: days,
      stats: { totalRecords, transcriptionCount, photoCount, memoCount, recordedDays },
    };
  }, [dailyRecordsByType]);

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

  const handleDayClick = useCallback((date: string) => {
    setSelectedDay(prev => prev === date ? null : date);
  }, []);

  // 타입에 따른 색상 결정 (가장 많은 타입 기준)
  const getDayColor = (records: DailyRecordByType | null) => {
    if (!records || records.total === 0) {
      return "bg-slate-100 dark:bg-slate-800/50";
    }

    // 가장 많은 타입 결정
    const counts = {
      transcription: records.transcription,
      photo: records.photo,
      memo: records.memo + records.quote,
    };

    const maxType = Object.entries(counts).reduce((a, b) =>
      counts[a[0] as keyof typeof counts] >= counts[b[0] as keyof typeof counts] ? a : b
    )[0] as keyof typeof TYPE_COLORS;

    return TYPE_COLORS[maxType].bg;
  };

  // 선택된 날짜 정보
  const selectedDayInfo = useMemo(() => {
    if (!selectedDay) return null;
    return calendarData.find(day => day.date === selectedDay) || null;
  }, [selectedDay, calendarData]);

  // 주별로 그룹화 (캘린더 형식)
  const weeks = useMemo(() => {
    const result: typeof calendarData[] = [];
    let currentWeek: typeof calendarData = [];

    // 첫째 날 앞의 빈 칸 채우기
    const firstDayOfWeek = calendarData[0]?.dayOfWeek || 0;
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({
        date: `empty-${i}`,
        displayDate: "",
        dayOfWeek: i,
        dayOfMonth: 0,
        month: 0,
        records: null,
        isToday: false,
        isFuture: true, // 빈 칸 표시용
      });
    }

    calendarData.forEach(day => {
      currentWeek.push(day);
      if (day.dayOfWeek === 6) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });

    // 마지막 주 남은 칸 채우기
    if (currentWeek.length > 0) {
      const remaining = 7 - currentWeek.length;
      for (let i = 0; i < remaining; i++) {
        currentWeek.push({
          date: `empty-end-${i}`,
          displayDate: "",
          dayOfWeek: (currentWeek.length),
          dayOfMonth: 0,
          month: 0,
          records: null,
          isToday: false,
          isFuture: true,
        });
      }
      result.push(currentWeek);
    }

    return result;
  }, [calendarData]);

  return (
    <Card
      ref={containerRef}
      className={cn(
        "p-3 border-slate-200 dark:border-slate-700/50 overflow-visible",
        className
      )}
    >
      <div className="space-y-2.5">
        {/* 헤더: 타이틀 + 통계 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <CalendarDays className="w-3.5 h-3.5 text-forest-500 shrink-0" />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
              활동 캘린더
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
              30일
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

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-[2px]">
          {DAY_LABELS.map((label, i) => (
            <div
              key={label}
              className={cn(
                "text-center text-[10px] font-medium py-0.5",
                i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-slate-400"
              )}
            >
              {label}
            </div>
          ))}
        </div>

        {/* 캘린더 그리드 */}
        <div className="space-y-[2px]">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-[2px]">
              {week.map((day, dayIndex) => (
                <motion.div
                  key={day.date}
                  className={cn(
                    "aspect-square rounded-[3px] flex items-center justify-center text-[10px] font-medium cursor-pointer relative",
                    day.date.startsWith("empty")
                      ? "bg-transparent cursor-default"
                      : getDayColor(day.records),
                    day.isToday && !day.date.startsWith("empty") && "ring-1 ring-forest-500 ring-offset-1 ring-offset-white dark:ring-offset-slate-900",
                    selectedDay === day.date && "ring-2 ring-forest-600",
                    !day.date.startsWith("empty") && "hover:brightness-110 active:scale-95 transition-all",
                    day.records && day.records.total > 0 ? "text-white" : "text-slate-400 dark:text-slate-500"
                  )}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: weekIndex * 0.03 + dayIndex * 0.01 }}
                  onClick={() => !day.date.startsWith("empty") && handleDayClick(day.date)}
                  onMouseEnter={() => !day.date.startsWith("empty") && setSelectedDay(day.date)}
                  onMouseLeave={() => setSelectedDay(null)}
                >
                  {!day.date.startsWith("empty") && day.dayOfMonth}
                </motion.div>
              ))}
            </div>
          ))}
        </div>

        {/* 선택된 날짜 상세 정보 */}
        <AnimatePresence mode="wait">
          {selectedDayInfo && !selectedDayInfo.date.startsWith("empty") && (
            <motion.div
              key={selectedDayInfo.date}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="bg-slate-50 dark:bg-slate-800/70 rounded-md px-2.5 py-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {selectedDayInfo.displayDate} ({DAY_LABELS[selectedDayInfo.dayOfWeek]})
                    {selectedDayInfo.isToday && (
                      <span className="ml-1.5 text-[10px] text-forest-500 font-semibold">오늘</span>
                    )}
                  </span>
                  <span className={cn(
                    "text-xs font-semibold",
                    selectedDayInfo.records && selectedDayInfo.records.total > 0
                      ? "text-forest-600 dark:text-forest-400"
                      : "text-slate-400 dark:text-slate-500"
                  )}>
                    {selectedDayInfo.records?.total || 0}개 기록
                  </span>
                </div>

                {selectedDayInfo.records && selectedDayInfo.records.total > 0 && (
                  <div className="flex items-center gap-3 text-[11px]">
                    {selectedDayInfo.records.transcription > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-purple-400" />
                        <span className="text-purple-600 dark:text-purple-400">
                          필사 {selectedDayInfo.records.transcription}
                        </span>
                      </div>
                    )}
                    {selectedDayInfo.records.photo > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        <span className="text-blue-600 dark:text-blue-400">
                          사진 {selectedDayInfo.records.photo}
                        </span>
                      </div>
                    )}
                    {(selectedDayInfo.records.memo > 0 || selectedDayInfo.records.quote > 0) && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-emerald-600 dark:text-emerald-400">
                          기록 {selectedDayInfo.records.memo + selectedDayInfo.records.quote}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 범례 (선택된 날짜가 없을 때만 표시) */}
        {!selectedDayInfo && (
          <div className="flex items-center justify-center gap-4 pt-0.5">
            {Object.entries(TYPE_COLORS).map(([key, value]) => (
              <div key={key} className="flex items-center gap-1">
                <div className={cn("w-2.5 h-2.5 rounded-[2px]", value.bg)} />
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{value.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export function ActivityCalendarSkeleton() {
  return (
    <Card className="p-3">
      <div className="space-y-2.5">
        {/* 헤더 스켈레톤 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-8 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-3 w-8 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
        </div>

        {/* 요일 헤더 스켈레톤 */}
        <div className="grid grid-cols-7 gap-[2px]">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          ))}
        </div>

        {/* 캘린더 그리드 스켈레톤 */}
        <div className="space-y-[2px]">
          {Array.from({ length: 5 }).map((_, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-[2px]">
              {Array.from({ length: 7 }).map((_, dayIndex) => (
                <div
                  key={dayIndex}
                  className="aspect-square rounded-[3px] bg-slate-200 dark:bg-slate-700 animate-pulse"
                />
              ))}
            </div>
          ))}
        </div>

        {/* 범례 스켈레톤 */}
        <div className="flex items-center justify-center gap-4 pt-0.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="w-6 h-3 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
