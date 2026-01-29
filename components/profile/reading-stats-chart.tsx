"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  PenLine,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthlyData {
  month: string;
  year: number;
  books: number;
  notes: number;
  completedBooks: number;
}

interface ReadingStatsChartProps {
  /** 월별 독서 데이터 */
  monthlyData: MonthlyData[];
  /** 올해 총 독서량 */
  yearlyTotalBooks?: number;
  /** 올해 총 기록 수 */
  yearlyTotalNotes?: number;
  /** 작년 대비 성장률 (%) */
  yearOverYearGrowth?: number;
  className?: string;
}

type ChartType = "books" | "notes";
type Period = "6months" | "12months";

const MONTH_LABELS = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월"
];

/**
 * 독서 통계 차트 컴포넌트
 *
 * 월별 독서량과 기록 수를 바 차트로 시각화합니다.
 * 트렌드 분석 및 전년 대비 성장률을 표시합니다.
 */
export function ReadingStatsChart({
  monthlyData,
  yearlyTotalBooks = 0,
  yearlyTotalNotes = 0,
  yearOverYearGrowth,
  className,
}: ReadingStatsChartProps) {
  const [chartType, setChartType] = useState<ChartType>("books");
  const [period, setPeriod] = useState<Period>("6months");

  // 표시할 데이터 필터링
  const displayData = useMemo(() => {
    const monthCount = period === "6months" ? 6 : 12;
    return monthlyData.slice(-monthCount);
  }, [monthlyData, period]);

  // 차트 최대값 계산
  const maxValue = useMemo(() => {
    const values = displayData.map((d) =>
      chartType === "books" ? d.books : d.notes
    );
    return Math.max(...values, 1);
  }, [displayData, chartType]);

  // 트렌드 계산 (최근 3개월 vs 이전 3개월)
  const trend = useMemo(() => {
    if (displayData.length < 6) return 0;
    const recent = displayData.slice(-3);
    const previous = displayData.slice(-6, -3);
    const recentAvg =
      recent.reduce((sum, d) => sum + (chartType === "books" ? d.books : d.notes), 0) / 3;
    const previousAvg =
      previous.reduce((sum, d) => sum + (chartType === "books" ? d.books : d.notes), 0) / 3;
    if (previousAvg === 0) return recentAvg > 0 ? 100 : 0;
    return Math.round(((recentAvg - previousAvg) / previousAvg) * 100);
  }, [displayData, chartType]);

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? "text-emerald-500" : trend < 0 ? "text-rose-500" : "text-slate-400";

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            독서 활동 추이
          </CardTitle>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)} className="h-8">
            <TabsList className="h-7">
              <TabsTrigger value="6months" className="text-xs h-6 px-2">
                6개월
              </TabsTrigger>
              <TabsTrigger value="12months" className="text-xs h-6 px-2">
                1년
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 요약 통계 */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard
            label="올해 독서"
            value={yearlyTotalBooks}
            unit="권"
            icon={BookOpen}
            color="text-blue-500"
            bgColor="bg-blue-50 dark:bg-blue-950/30"
          />
          <SummaryCard
            label="올해 기록"
            value={yearlyTotalNotes}
            unit="개"
            icon={PenLine}
            color="text-amber-500"
            bgColor="bg-amber-50 dark:bg-amber-950/30"
          />
          <SummaryCard
            label="성장률"
            value={yearOverYearGrowth ?? 0}
            unit="%"
            icon={TrendIcon}
            color={trendColor}
            bgColor="bg-slate-50 dark:bg-slate-950/30"
            showSign
          />
        </div>

        {/* 차트 타입 선택 */}
        <div className="flex gap-2">
          <ChartTypeButton
            active={chartType === "books"}
            onClick={() => setChartType("books")}
            icon={BookOpen}
            label="독서량"
          />
          <ChartTypeButton
            active={chartType === "notes"}
            onClick={() => setChartType("notes")}
            icon={PenLine}
            label="기록 수"
          />
        </div>

        {/* 바 차트 */}
        <div className="space-y-2">
          <div className="flex items-end justify-between h-40 gap-1">
            {displayData.map((data, index) => {
              const value = chartType === "books" ? data.books : data.notes;
              const height = (value / maxValue) * 100;

              return (
                <div key={`${data.year}-${data.month}`} className="flex-1 flex flex-col items-center">
                  <motion.div
                    className="w-full relative group"
                    style={{ height: "100%" }}
                  >
                    {/* 값 툴팁 */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-medium bg-slate-800 text-white px-1.5 py-0.5 rounded">
                        {value}
                      </span>
                    </div>
                    {/* 바 */}
                    <motion.div
                      className={cn(
                        "absolute bottom-0 w-full rounded-t-sm",
                        chartType === "books"
                          ? "bg-gradient-to-t from-blue-500 to-blue-400"
                          : "bg-gradient-to-t from-amber-500 to-amber-400"
                      )}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                    />
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* X축 라벨 */}
          <div className="flex justify-between gap-1">
            {displayData.map((data) => (
              <div key={`label-${data.year}-${data.month}`} className="flex-1 text-center">
                <span className="text-[10px] text-muted-foreground">
                  {MONTH_LABELS[parseInt(data.month) - 1]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 트렌드 정보 */}
        <div className="flex items-center justify-center gap-2 pt-2 border-t">
          <TrendIcon className={cn("h-4 w-4", trendColor)} />
          <span className="text-sm text-muted-foreground">
            최근 3개월 대비{" "}
            <span className={cn("font-medium", trendColor)}>
              {trend > 0 ? "+" : ""}
              {trend}%
            </span>{" "}
            {trend > 0 ? "증가" : trend < 0 ? "감소" : "유지"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  unit: string;
  icon: typeof BookOpen;
  color: string;
  bgColor: string;
  showSign?: boolean;
}

function SummaryCard({
  label,
  value,
  unit,
  icon: Icon,
  color,
  bgColor,
  showSign = false,
}: SummaryCardProps) {
  return (
    <div className={cn("rounded-xl p-3 text-center", bgColor)}>
      <Icon className={cn("h-4 w-4 mx-auto mb-1", color)} />
      <div className={cn("text-lg font-bold", color)}>
        {showSign && value > 0 ? "+" : ""}
        {value}
        <span className="text-xs font-normal text-muted-foreground ml-0.5">
          {unit}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

interface ChartTypeButtonProps {
  active: boolean;
  onClick: () => void;
  icon: typeof BookOpen;
  label: string;
}

function ChartTypeButton({ active, onClick, icon: Icon, label }: ChartTypeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

/**
 * 월별 활동 히트맵 컴포넌트
 */
interface ActivityHeatmapProps {
  /** 일별 활동 데이터 (key: YYYY-MM-DD, value: count) */
  dailyActivity: Record<string, number>;
  /** 표시할 주 수 (기본: 12주) */
  weeks?: number;
  className?: string;
}

export function ActivityHeatmap({
  dailyActivity,
  weeks = 12,
  className,
}: ActivityHeatmapProps) {
  const days = ["일", "월", "화", "수", "목", "금", "토"];

  // 히트맵 데이터 생성
  const heatmapData = useMemo(() => {
    const data: { date: string; count: number; dayOfWeek: number }[][] = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (weeks * 7 - 1));

    let currentWeek: { date: string; count: number; dayOfWeek: number }[] = [];

    // 시작 요일까지 빈 칸 추가
    const startDayOfWeek = startDate.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push({ date: "", count: -1, dayOfWeek: i });
    }

    for (let i = 0; i < weeks * 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      const dayOfWeek = date.getDay();

      currentWeek.push({
        date: dateStr,
        count: dailyActivity[dateStr] || 0,
        dayOfWeek,
      });

      if (dayOfWeek === 6 || i === weeks * 7 - 1) {
        data.push(currentWeek);
        currentWeek = [];
      }
    }

    return data;
  }, [dailyActivity, weeks]);

  // 최대값
  const maxCount = useMemo(() => {
    return Math.max(...Object.values(dailyActivity), 1);
  }, [dailyActivity]);

  // 색상 강도 계산
  const getIntensity = (count: number) => {
    if (count < 0) return "bg-transparent";
    if (count === 0) return "bg-slate-100 dark:bg-slate-800";
    const intensity = Math.ceil((count / maxCount) * 4);
    const colors = [
      "bg-emerald-200 dark:bg-emerald-900",
      "bg-emerald-300 dark:bg-emerald-700",
      "bg-emerald-400 dark:bg-emerald-600",
      "bg-emerald-500 dark:bg-emerald-500",
    ];
    return colors[Math.min(intensity - 1, 3)];
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          활동 히트맵
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1">
          {/* 요일 라벨 */}
          <div className="flex flex-col gap-1 pr-1">
            {days.map((day, i) => (
              <div
                key={day}
                className={cn(
                  "h-3 w-3 text-[8px] text-muted-foreground flex items-center",
                  i % 2 === 0 ? "opacity-100" : "opacity-0"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 히트맵 그리드 */}
          <div className="flex gap-1 overflow-x-auto">
            {heatmapData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <motion.div
                    key={`${weekIndex}-${dayIndex}`}
                    className={cn(
                      "h-3 w-3 rounded-sm",
                      getIntensity(day.count)
                    )}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: weekIndex * 0.02 + dayIndex * 0.01 }}
                    title={day.date ? `${day.date}: ${day.count}개` : ""}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* 범례 */}
        <div className="flex items-center justify-end gap-1 mt-3">
          <span className="text-[10px] text-muted-foreground mr-1">적음</span>
          <div className="h-3 w-3 rounded-sm bg-slate-100 dark:bg-slate-800" />
          <div className="h-3 w-3 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
          <div className="h-3 w-3 rounded-sm bg-emerald-300 dark:bg-emerald-700" />
          <div className="h-3 w-3 rounded-sm bg-emerald-400 dark:bg-emerald-600" />
          <div className="h-3 w-3 rounded-sm bg-emerald-500" />
          <span className="text-[10px] text-muted-foreground ml-1">많음</span>
        </div>
      </CardContent>
    </Card>
  );
}
