"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";
import type { DailyRecordByType } from "@/app/actions/stats";
import { useTranslation } from "@/lib/i18n";

interface ActivityCalendarProps {
  dailyRecordsByType: Record<string, DailyRecordByType>;
  className?: string;
}

const DAY_LABEL_KEYS = [
  "common.day0Sun", "common.day1Mon", "common.day2Tue", "common.day3Wed",
  "common.day4Thu", "common.day5Fri", "common.day6Sat",
] as const;

// 타입별 색상 정의 (더 부드러운 톤)
const TYPE_COLORS = {
  transcription: {
    base: "bg-violet-400/90 dark:bg-violet-500/80",
    light: "bg-violet-200 dark:bg-violet-800/50",
    text: "text-violet-600 dark:text-violet-400",
    labelKey: "notes.typeTranscription" as const,
  },
  photo: {
    base: "bg-sky-400/90 dark:bg-sky-500/80",
    light: "bg-sky-200 dark:bg-sky-800/50",
    text: "text-sky-600 dark:text-sky-400",
    labelKey: "notes.typePhoto" as const,
  },
  memo: {
    base: "bg-emerald-400/90 dark:bg-emerald-500/80",
    light: "bg-emerald-200 dark:bg-emerald-800/50",
    text: "text-emerald-600 dark:text-emerald-400",
    labelKey: "notes.typeMemo" as const,
  },
  progress: {
    base: "bg-amber-400/90 dark:bg-amber-500/80",
    light: "bg-amber-200 dark:bg-amber-800/50",
    text: "text-amber-600 dark:text-amber-400",
    labelKey: "notes.typeProgress" as const,
  },
};

/**
 * 30일 독서활동 캘린더 (컴팩트 디자인)
 * 타입별 색상 구분: 필사(보라), 사진(하늘), 기록(초록)
 */
export function ActivityCalendar({
  dailyRecordsByType,
  className,
}: ActivityCalendarProps) {
  const { t } = useTranslation();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 30일 데이터 생성 (GitHub 스타일 - 주별 열 구조)
  const { weeklyData, stats } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 시작일 계산: 4주 전 일요일부터 (약 30일)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 27 - today.getDay());

    const weeks: Array<Array<{
      date: string;
      displayDate: string;
      dayOfWeek: number;
      records: DailyRecordByType | null;
      isToday: boolean;
      isFuture: boolean;
    }>> = [];

    let currentWeek: typeof weeks[0] = [];
    let totalRecords = 0;
    let recordedDays = 0;

    const current = new Date(startDate);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (6 - today.getDay()));

    while (current <= endDate) {
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
      const displayDate = `${current.getMonth() + 1}/${current.getDate()}`;
      const records = dailyRecordsByType[dateStr] || null;
      const isToday = current.getTime() === today.getTime();
      const isFuture = current.getTime() > today.getTime();

      if (!isFuture && records && records.total > 0) {
        totalRecords += records.total;
        recordedDays++;
      }

      currentWeek.push({
        date: dateStr,
        displayDate,
        dayOfWeek: current.getDay(),
        records,
        isToday,
        isFuture,
      });

      if (current.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      current.setDate(current.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return {
      weeklyData: weeks,
      stats: { totalRecords, recordedDays },
    };
  }, [dailyRecordsByType]);

  // 외부 클릭 시 닫기
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

  // 타입에 따른 색상 결정 (progress 타입 포함)
  const getDayColor = useCallback((records: DailyRecordByType | null, isFuture: boolean) => {
    if (isFuture) return "bg-slate-100/50 dark:bg-slate-800/30";
    if (!records || records.total === 0) return "bg-slate-200/60 dark:bg-slate-700/40";

    const counts = {
      transcription: records.transcription || 0,
      photo: records.photo || 0,
      memo: (records.memo || 0) + (records.quote || 0),
      progress: records.progress || 0,
    };

    const maxType = Object.entries(counts).reduce((a, b) =>
      counts[a[0] as keyof typeof counts] >= counts[b[0] as keyof typeof counts] ? a : b
    )[0] as keyof typeof TYPE_COLORS;

    return TYPE_COLORS[maxType].base;
  }, []);

  // 선택된 날짜 정보
  const selectedDayInfo = useMemo(() => {
    if (!selectedDay) return null;
    for (const week of weeklyData) {
      const day = week.find(d => d.date === selectedDay);
      if (day) return day;
    }
    return null;
  }, [selectedDay, weeklyData]);

  return (
    <Card
      ref={containerRef}
      className={cn(
        "p-2.5 sm:p-3 border-slate-200/80 dark:border-slate-700/50",
        className
      )}
    >
      <div className="space-y-2">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {t("dashboard.readingActivity")}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-0.5">
              30{t("common.day")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-forest-600 dark:text-forest-400">{stats.recordedDays}</span>{t("common.day")}
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-forest-600 dark:text-forest-400">{stats.totalRecords}</span>{t("common.count")}
            </span>
          </div>
        </div>

        {/* 히트맵 그리드 (GitHub 스타일) */}
        <div className="flex gap-1">
          {/* 요일 라벨 */}
          <div className="flex flex-col justify-between py-[1px] shrink-0">
            {[0, 2, 4, 6].map((dayIndex) => (
              <span
                key={dayIndex}
                className="text-[8px] text-slate-400 dark:text-slate-500 leading-none h-[10px] flex items-center"
              >
                {t(DAY_LABEL_KEYS[dayIndex])}
              </span>
            ))}
          </div>

          {/* 히트맵 */}
          <div className="flex-1 min-w-0">
            <div
              className="grid gap-[2px]"
              style={{
                gridTemplateColumns: `repeat(${weeklyData.length}, minmax(0, 1fr))`,
                gridTemplateRows: "repeat(7, 10px)"
              }}
            >
              {weeklyData.map((week, weekIndex) =>
                week.map((day, dayIndex) => (
                  <motion.div
                    key={day.date}
                    className={cn(
                      "rounded-[2px] cursor-pointer",
                      getDayColor(day.records, day.isFuture),
                      day.isToday && "ring-1 ring-forest-500 ring-offset-1 ring-offset-white dark:ring-offset-slate-900",
                      selectedDay === day.date && "ring-1.5 ring-forest-600",
                      !day.isFuture && "hover:brightness-110 active:scale-90 transition-all"
                    )}
                    style={{
                      gridColumn: weekIndex + 1,
                      gridRow: dayIndex + 1
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: weekIndex * 0.01 + dayIndex * 0.003 }}
                    onClick={() => !day.isFuture && setSelectedDay(prev => prev === day.date ? null : day.date)}
                    onMouseEnter={() => !day.isFuture && setSelectedDay(day.date)}
                    onMouseLeave={() => setSelectedDay(null)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* 선택된 날짜 상세 or 범례 */}
        <AnimatePresence mode="wait">
          {selectedDayInfo && !selectedDayInfo.isFuture ? (
            <motion.div
              key={selectedDayInfo.date}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.12 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 rounded px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-sm shrink-0",
                    getDayColor(selectedDayInfo.records, false)
                  )} />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    {selectedDayInfo.displayDate}
                    {selectedDayInfo.isToday && (
                      <span className="ml-1 text-forest-500 font-semibold">{t("dashboard.todayLabel")}</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  {selectedDayInfo.records && selectedDayInfo.records.total > 0 ? (
                    <>
                      {selectedDayInfo.records.transcription > 0 && (
                        <span className="text-violet-600 dark:text-violet-400">
                          {t("notes.typeTranscription")} {selectedDayInfo.records.transcription}
                        </span>
                      )}
                      {selectedDayInfo.records.photo > 0 && (
                        <span className="text-sky-600 dark:text-sky-400">
                          {t("notes.typePhoto")} {selectedDayInfo.records.photo}
                        </span>
                      )}
                      {(selectedDayInfo.records.memo > 0 || selectedDayInfo.records.quote > 0) && (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {t("notes.typeMemo")} {selectedDayInfo.records.memo + selectedDayInfo.records.quote}
                        </span>
                      )}
                      {selectedDayInfo.records.progress > 0 && (
                        <span className="text-amber-600 dark:text-amber-400">
                          {t("notes.typeProgress")} {selectedDayInfo.records.progress}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">{t("dashboard.noRecords")}</span>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="legend"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex items-center justify-center gap-3"
            >
              {Object.entries(TYPE_COLORS).map(([key, value]) => (
                <div key={key} className="flex items-center gap-1">
                  <div className={cn("w-2 h-2 rounded-sm", value.base)} />
                  <span className="text-[9px] text-slate-500 dark:text-slate-400">{t(value.labelKey)}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}

export function ActivityCalendarSkeleton() {
  return (
    <Card className="p-2.5 sm:p-3">
      <div className="space-y-2">
        {/* 헤더 스켈레톤 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-3.5 w-14 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-8 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-3 w-8 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
        </div>

        {/* 히트맵 스켈레톤 */}
        <div className="flex gap-1">
          <div className="flex flex-col justify-between py-[1px] shrink-0">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-2.5 h-[10px] rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            ))}
          </div>
          <div className="flex-1">
            <div
              className="grid gap-[2px]"
              style={{
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gridTemplateRows: "repeat(7, 10px)"
              }}
            >
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="rounded-[2px] bg-slate-200 dark:bg-slate-700 animate-pulse" />
              ))}
            </div>
          </div>
        </div>

        {/* 범례 스켈레톤 */}
        <div className="flex items-center justify-center gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="w-5 h-2.5 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
