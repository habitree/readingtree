"use client";

import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, BookOpen, Calendar, Sparkles, X } from "lucide-react";
import Link from "next/link";
import type { DailyBookActivity } from "@/app/actions/stats";

interface MonthlyBookCalendarProps {
  activities: Record<string, DailyBookActivity>;
  year: number;
  month: number;
  onMonthChange?: (year: number, month: number) => void;
  className?: string;
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTH_LABELS = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월"
];

// Warm, earthy 색상 팔레트 - 감정 디자인 기반
const WARM_COLORS = {
  achievement: "from-amber-400/20 to-orange-400/20",
  glow: "shadow-amber-400/30",
  border: "border-amber-300/50",
  ring: "ring-amber-400/60",
};

// 부드러운 스프링 애니메이션 설정
const springConfig = { stiffness: 300, damping: 30, mass: 0.8 };
const gentleSpring = { type: "spring" as const, stiffness: 200, damping: 25 };

/**
 * 월별 독서 활동 캘린더 v2.0
 * 2026 UI/UX 트렌드 적용:
 * - Emotional Design (감정 디자인)
 * - Stacked Cards (겹침 효과)
 * - Glassmorphism (글라스모피즘)
 * - Micro-animations (마이크로 애니메이션)
 * - Warm Colors (따뜻한 색상)
 */
export function MonthlyBookCalendar({
  activities,
  year,
  month,
  onMonthChange,
  className,
}: MonthlyBookCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // 달력 데이터 생성
  const calendarData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const weeks: Array<Array<{
      date: string | null;
      day: number | null;
      books: DailyBookActivity["books"];
      isToday: boolean;
      isFuture: boolean;
    }>> = [];

    let currentWeek: typeof weeks[0] = [];

    // 첫 주의 빈 칸 채우기
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push({
        date: null,
        day: null,
        books: [],
        isToday: false,
        isFuture: false,
      });
    }

    // 날짜 채우기
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const activity = activities[dateStr];
      const isToday = date.getTime() === today.getTime();
      const isFuture = date.getTime() > today.getTime();

      currentWeek.push({
        date: dateStr,
        day,
        books: activity?.books || [],
        isToday,
        isFuture,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // 마지막 주의 빈 칸 채우기
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: null,
          day: null,
          books: [],
          isToday: false,
          isFuture: false,
        });
      }
      weeks.push(currentWeek);
    }

    // 통계 계산
    const recordedDays = Object.keys(activities).filter(date => {
      const [y, m] = date.split("-").map(Number);
      return y === year && m === month && activities[date].books.length > 0;
    }).length;

    const totalBooks = Object.values(activities)
      .filter(a => {
        const [y, m] = a.date.split("-").map(Number);
        return y === year && m === month;
      })
      .reduce((sum, a) => sum + a.books.length, 0);

    // 유니크한 책 수 계산
    const uniqueBookIds = new Set<string>();
    Object.values(activities).forEach(a => {
      const [y, m] = a.date.split("-").map(Number);
      if (y === year && m === month) {
        a.books.forEach(book => uniqueBookIds.add(book.bookId));
      }
    });

    return { weeks, recordedDays, totalBooks, uniqueBooks: uniqueBookIds.size };
  }, [activities, year, month]);

  // 선택된 날짜 정보
  const selectedDayInfo = useMemo(() => {
    if (!selectedDate) return null;
    return activities[selectedDate] || null;
  }, [selectedDate, activities]);

  // 이전/다음 월 이동
  const handlePrevMonth = useCallback(() => {
    const newDate = new Date(year, month - 2, 1);
    onMonthChange?.(newDate.getFullYear(), newDate.getMonth() + 1);
    setSelectedDate(null);
  }, [year, month, onMonthChange]);

  const handleNextMonth = useCallback(() => {
    const newDate = new Date(year, month, 1);
    onMonthChange?.(newDate.getFullYear(), newDate.getMonth() + 1);
    setSelectedDate(null);
  }, [year, month, onMonthChange]);

  // 현재 월인지 확인 (미래 월로 이동 방지)
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
  const isFutureMonth = year > today.getFullYear() ||
    (year === today.getFullYear() && month > today.getMonth() + 1);

  return (
    <Card
      variant="glass"
      className={cn(
        "p-4 sm:p-5 overflow-hidden",
        "bg-gradient-to-br from-paper-50/90 to-white/80 dark:from-slate-900/90 dark:to-slate-800/80",
        "backdrop-blur-xl border-paper-200/50 dark:border-slate-700/50",
        className
      )}
    >
      <div className="space-y-4">
        {/* 헤더 - Visual Hierarchy */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <motion.div
              className="p-2 rounded-xl bg-gradient-to-br from-forest-500/20 to-forest-600/10 dark:from-forest-400/20 dark:to-forest-500/10"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={gentleSpring}
            >
              <Calendar className="w-4 h-4 text-forest-600 dark:text-forest-400" />
            </motion.div>
            <div>
              <span className="text-sm font-semibold text-slate-800 dark:text-white">
                독서 달력
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                책과 함께한 날들
              </p>
            </div>
          </div>

          {/* 통계 뱃지 - Emotional Design */}
          <div className="flex items-center gap-2">
            <motion.div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30"
              whileHover={{ scale: 1.02 }}
              transition={gentleSpring}
            >
              <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                {calendarData.recordedDays}일
              </span>
            </motion.div>
            <motion.div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-forest-100 to-emerald-100 dark:from-forest-900/30 dark:to-emerald-900/30"
              whileHover={{ scale: 1.02 }}
              transition={gentleSpring}
            >
              <BookOpen className="w-3 h-3 text-forest-600 dark:text-forest-400" />
              <span className="text-xs font-medium text-forest-700 dark:text-forest-300">
                {calendarData.uniqueBooks}권
              </span>
            </motion.div>
          </div>
        </div>

        {/* 월 선택 - Micro-animation */}
        <div className="flex items-center justify-between px-1">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </motion.div>

          <motion.span
            key={`${year}-${month}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-base font-semibold text-slate-800 dark:text-white"
          >
            {year}년 {MONTH_LABELS[month - 1]}
          </motion.span>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={handleNextMonth}
              disabled={isCurrentMonth || isFutureMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1">
          {DAY_LABELS.map((label, index) => (
            <div
              key={label}
              className={cn(
                "text-center text-[10px] font-semibold py-1.5 rounded-md",
                index === 0
                  ? "text-rose-500 bg-rose-50/50 dark:text-rose-400 dark:bg-rose-900/20"
                  : index === 6
                    ? "text-blue-500 bg-blue-50/50 dark:text-blue-400 dark:bg-blue-900/20"
                    : "text-slate-500 dark:text-slate-400"
              )}
            >
              {label}
            </div>
          ))}
        </div>

        {/* 캘린더 그리드 */}
        <div className="space-y-1.5">
          {calendarData.weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1.5">
              {week.map((day, dayIndex) => (
                <DayCell
                  key={day.date || `empty-${weekIndex}-${dayIndex}`}
                  day={day.day}
                  date={day.date}
                  books={day.books}
                  isToday={day.isToday}
                  isFuture={day.isFuture}
                  isSelected={selectedDate === day.date}
                  isHovered={hoveredDate === day.date}
                  dayOfWeek={dayIndex}
                  onClick={() => {
                    if (day.date && !day.isFuture) {
                      setSelectedDate(selectedDate === day.date ? null : day.date);
                    }
                  }}
                  onHoverStart={() => setHoveredDate(day.date)}
                  onHoverEnd={() => setHoveredDate(null)}
                />
              ))}
            </div>
          ))}
        </div>

        {/* 선택된 날짜 상세 - Glassmorphism */}
        <AnimatePresence mode="wait">
          {selectedDayInfo && selectedDayInfo.books.length > 0 && (
            <SelectedDateDetail
              date={selectedDate!}
              books={selectedDayInfo.books}
              onClose={() => setSelectedDate(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}

interface DayCellProps {
  day: number | null;
  date: string | null;
  books: DailyBookActivity["books"];
  isToday: boolean;
  isFuture: boolean;
  isSelected: boolean;
  isHovered: boolean;
  dayOfWeek: number;
  onClick: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

function DayCell({
  day,
  date,
  books,
  isToday,
  isFuture,
  isSelected,
  isHovered,
  dayOfWeek,
  onClick,
  onHoverStart,
  onHoverEnd,
}: DayCellProps) {
  if (!day) {
    return <div className="aspect-square" />;
  }

  const hasBooks = books.length > 0;

  return (
    <motion.div
      className={cn(
        "aspect-square rounded-xl cursor-pointer relative overflow-visible",
        "transition-all duration-200",
        isFuture && "opacity-30 cursor-default",
        !isFuture && !hasBooks && "hover:bg-slate-100/80 dark:hover:bg-slate-800/50",
        !hasBooks && "bg-slate-50/50 dark:bg-slate-800/30"
      )}
      onClick={onClick}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      whileHover={!isFuture ? { scale: 1.08, zIndex: 10 } : undefined}
      whileTap={!isFuture ? { scale: 0.95 } : undefined}
      transition={gentleSpring}
      style={{ willChange: "transform" }}
    >
      {/* 오늘 날짜 링 */}
      {isToday && (
        <motion.div
          className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-forest-400 to-forest-600 dark:from-forest-500 dark:to-forest-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          layoutId="today-ring"
        />
      )}

      {/* 선택 상태 링 */}
      {isSelected && (
        <motion.div
          className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500"
          layoutId="selected-ring"
          transition={gentleSpring}
        />
      )}

      {/* 내부 컨텐츠 */}
      <div className={cn(
        "absolute inset-0.5 rounded-lg overflow-hidden",
        isToday || isSelected ? "bg-white dark:bg-slate-900" : ""
      )}>
        {hasBooks ? (
          <StackedBookCovers
            books={books}
            isHovered={isHovered}
            isSelected={isSelected}
          />
        ) : (
          /* 빈 날: 도트 패턴 */
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>
        )}

        {/* 날짜 표시 - Visual Hierarchy */}
        <div
          className={cn(
            "absolute bottom-0 right-0 text-[9px] font-bold px-1.5 py-0.5 rounded-tl-md",
            hasBooks
              ? "bg-black/70 text-white backdrop-blur-sm"
              : cn(
                  dayOfWeek === 0
                    ? "text-rose-400 dark:text-rose-500"
                    : dayOfWeek === 6
                      ? "text-blue-400 dark:text-blue-500"
                      : "text-slate-400 dark:text-slate-500"
                )
          )}
        >
          {day}
        </div>

        {/* 성취 글로우 효과 - Emotional Design */}
        {hasBooks && (
          <motion.div
            className="absolute inset-0 rounded-lg pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{
              opacity: isHovered ? 0.4 : 0.2,
              boxShadow: isHovered
                ? "inset 0 0 20px rgba(251, 191, 36, 0.3)"
                : "inset 0 0 10px rgba(251, 191, 36, 0.1)"
            }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>
    </motion.div>
  );
}

interface StackedBookCoversProps {
  books: DailyBookActivity["books"];
  isHovered: boolean;
  isSelected: boolean;
}

function StackedBookCovers({ books, isHovered, isSelected }: StackedBookCoversProps) {
  // 최대 4개까지 표시
  const displayBooks = books.slice(0, 4);
  const remainingCount = Math.max(0, books.length - 4);
  const bookCount = displayBooks.length;

  // Fan/Scattered 효과를 위한 회전 및 위치 계산
  const getBookTransform = (index: number, total: number, hovered: boolean) => {
    if (total === 1) {
      return {
        rotate: 0,
        x: 0,
        y: 0,
        scale: hovered ? 1.05 : 1,
        zIndex: 1,
      };
    }

    // 부채꼴 효과: 각 책이 다른 각도로 회전
    const baseRotation = total === 2 ? 5 : total === 3 ? 6 : 7;
    const spreadAngle = (index - (total - 1) / 2) * baseRotation;

    // 호버 시 책들이 펼쳐지는 효과
    const hoverSpread = hovered ? 1.8 : 1;

    // 3D depth 효과: 뒤로 갈수록 작아짐
    const depthScale = 1 - (index * 0.03);

    // 위치 오프셋
    const xOffset = hovered ? (index - (total - 1) / 2) * 8 : index * 2;
    const yOffset = hovered ? 0 : index * 1.5;

    return {
      rotate: spreadAngle * hoverSpread,
      x: xOffset,
      y: yOffset,
      scale: hovered ? 1 : depthScale,
      zIndex: total - index,
    };
  };

  if (bookCount === 1) {
    // 1권: 전체 표시, 살짝 떠 있는 느낌
    const book = displayBooks[0];
    return (
      <motion.div
        className="w-full h-full relative"
        animate={{ y: isHovered ? -2 : 0 }}
        transition={gentleSpring}
      >
        {book.coverImageUrl ? (
          <motion.img
            src={book.coverImageUrl}
            alt={book.title}
            className="w-full h-full object-cover rounded-md"
            style={{
              boxShadow: isHovered
                ? "0 8px 20px -4px rgba(0,0,0,0.3)"
                : "0 4px 12px -2px rgba(0,0,0,0.2)"
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-forest-200 to-forest-400 dark:from-forest-700 dark:to-forest-900 flex items-center justify-center rounded-md">
            <BookOpen className="w-4 h-4 text-forest-700 dark:text-forest-300" />
          </div>
        )}
      </motion.div>
    );
  }

  // 여러 권: Stacked Cards 효과
  return (
    <div className="w-full h-full relative flex items-center justify-center">
      {displayBooks.map((book, index) => {
        const transform = getBookTransform(index, bookCount, isHovered);

        return (
          <motion.div
            key={book.bookId}
            className="absolute rounded-md overflow-hidden"
            style={{
              width: "85%",
              height: "85%",
              zIndex: transform.zIndex,
              transformOrigin: "center bottom",
              boxShadow: isHovered
                ? `0 ${8 - index * 2}px ${16 - index * 3}px -${4 + index}px rgba(0,0,0,0.3)`
                : `0 ${4 - index}px ${8 - index * 2}px -${2 + index}px rgba(0,0,0,0.2)`,
            }}
            initial={false}
            animate={{
              rotate: transform.rotate,
              x: transform.x,
              y: transform.y,
              scale: transform.scale,
            }}
            transition={{
              ...gentleSpring,
              delay: isHovered ? index * 0.03 : (bookCount - 1 - index) * 0.02,
            }}
          >
            {book.coverImageUrl ? (
              <img
                src={book.coverImageUrl}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-400 dark:from-slate-600 dark:to-slate-800 flex items-center justify-center">
                <BookOpen className="w-3 h-3 text-slate-600 dark:text-slate-300" />
              </div>
            )}
          </motion.div>
        );
      })}

      {/* 추가 권수 표시 */}
      {remainingCount > 0 && (
        <motion.div
          className="absolute top-0 right-0 bg-gradient-to-br from-forest-500 to-forest-600 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-bl-md rounded-tr-md z-20"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...gentleSpring, delay: 0.1 }}
        >
          +{remainingCount}
        </motion.div>
      )}
    </div>
  );
}

interface SelectedDateDetailProps {
  date: string;
  books: DailyBookActivity["books"];
  onClose: () => void;
}

function SelectedDateDetail({ date, books, onClose }: SelectedDateDetailProps) {
  const formattedDate = date.split("-").slice(1).map(n => parseInt(n)).join("/");

  return (
    <motion.div
      key={date}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={gentleSpring}
      className="relative overflow-hidden"
    >
      {/* Glassmorphism 배경 */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-paper-50/80 dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-xl rounded-2xl" />

      {/* 따뜻한 글로우 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-orange-400/5 rounded-2xl" />

      {/* 컨텐츠 */}
      <div className="relative p-4 space-y-3">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              className="p-1.5 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40"
              whileHover={{ rotate: 10 }}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </motion.div>
            <span className="text-sm font-semibold text-slate-800 dark:text-white">
              {formattedDate}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-forest-100 dark:bg-forest-900/40 text-forest-700 dark:text-forest-300 font-medium">
              {books.length}권
            </span>
          </div>
          <motion.button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-4 h-4 text-slate-400" />
          </motion.button>
        </div>

        {/* 책 목록 */}
        <div className="flex flex-wrap gap-2">
          {books.map((book, index) => (
            <motion.div
              key={book.bookId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...gentleSpring, delay: index * 0.05 }}
            >
              <Link
                href={`/books/${book.userBookId}`}
                className="group flex items-center gap-2.5 bg-white/80 dark:bg-slate-700/60 backdrop-blur-sm rounded-xl p-2 pr-3.5 border border-slate-200/50 dark:border-slate-600/50 hover:border-forest-300 dark:hover:border-forest-600 hover:shadow-md transition-all"
              >
                <motion.div
                  className="w-10 h-12 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-600 shrink-0 shadow-sm"
                  whileHover={{ scale: 1.05, rotate: -2 }}
                  transition={gentleSpring}
                >
                  {book.coverImageUrl ? (
                    <img
                      src={book.coverImageUrl}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-forest-200 to-forest-300 dark:from-forest-700 dark:to-forest-800">
                      <BookOpen className="w-4 h-4 text-forest-600 dark:text-forest-300" />
                    </div>
                  )}
                </motion.div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate max-w-[100px] group-hover:text-forest-600 dark:group-hover:text-forest-400 transition-colors">
                  {book.title}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * MonthlyBookCalendar 스켈레톤
 */
export function MonthlyBookCalendarSkeleton() {
  return (
    <Card className="p-4 sm:p-5 bg-gradient-to-br from-paper-50/90 to-white/80 dark:from-slate-900/90 dark:to-slate-800/80 backdrop-blur-xl">
      <div className="space-y-4">
        {/* 헤더 스켈레톤 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="space-y-1">
              <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-2.5 w-20 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-14 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-6 w-14 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
        </div>

        {/* 월 선택 스켈레톤 */}
        <div className="flex items-center justify-between px-1">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>

        {/* 요일 헤더 스켈레톤 */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-6 rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse" />
          ))}
        </div>

        {/* 캘린더 그리드 스켈레톤 */}
        <div className="space-y-1.5">
          {Array.from({ length: 5 }).map((_, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 7 }).map((_, dayIndex) => (
                <div
                  key={dayIndex}
                  className="aspect-square rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse"
                  style={{ animationDelay: `${(weekIndex * 7 + dayIndex) * 30}ms` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
