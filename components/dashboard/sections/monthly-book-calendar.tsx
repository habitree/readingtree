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

// 부드러운 스프링 애니메이션 설정 (성능 최적화: 가벼운 설정)
const gentleSpring = { type: "spring" as const, stiffness: 260, damping: 20 };
const quickTransition = { duration: 0.15 };

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
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-forest-500/20 to-forest-600/10 dark:from-forest-400/20 dark:to-forest-500/10">
              <Calendar className="w-4 h-4 text-forest-600 dark:text-forest-400" />
            </div>
            <span className="text-sm font-semibold text-slate-800 dark:text-white">
              독서 달력
            </span>
          </div>

          {/* 통계 뱃지 */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-900/30">
              <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                {calendarData.recordedDays}일
              </span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-forest-100/80 dark:bg-forest-900/30">
              <BookOpen className="w-3 h-3 text-forest-600 dark:text-forest-400" />
              <span className="text-xs font-medium text-forest-700 dark:text-forest-300">
                {calendarData.uniqueBooks}권
              </span>
            </div>
          </div>
        </div>

        {/* 월 선택 */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-full"
            onClick={handlePrevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm font-semibold text-slate-800 dark:text-white">
            {year}년 {MONTH_LABELS[month - 1]}
          </span>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-full"
            onClick={handleNextMonth}
            disabled={isCurrentMonth || isFutureMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
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
    // 빈 셀도 책 비율 유지
    return <div className="aspect-[3/4]" />;
  }

  const hasBooks = books.length > 0;

  return (
    <div
      className={cn(
        // 책 비율: 3:4 (세로로 긴 책 형태)
        "aspect-[3/4] rounded-lg cursor-pointer relative",
        isFuture && "opacity-30 cursor-default",
        !hasBooks && "bg-slate-50/60 dark:bg-slate-800/40",
        !isFuture && "hover:scale-105 hover:z-10 transition-transform duration-150"
      )}
      onClick={onClick}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      {/* 오늘 날짜 링 */}
      {isToday && (
        <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-br from-forest-400 to-forest-600 dark:from-forest-500 dark:to-forest-700" />
      )}

      {/* 선택 상태 링 */}
      {isSelected && !isToday && (
        <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500" />
      )}

      {/* 내부 컨텐츠 */}
      <div className={cn(
        "absolute inset-0.5 rounded-md overflow-hidden",
        (isToday || isSelected) && "bg-white dark:bg-slate-900"
      )}>
        {hasBooks ? (
          <StackedBookCovers books={books} isHovered={isHovered} />
        ) : (
          /* 빈 날: 연한 배경 + 날짜만 */
          <div className="w-full h-full flex items-end justify-end p-1">
            <span className={cn(
              "text-[9px] font-medium",
              dayOfWeek === 0
                ? "text-rose-400 dark:text-rose-500"
                : dayOfWeek === 6
                  ? "text-blue-400 dark:text-blue-500"
                  : "text-slate-400 dark:text-slate-500"
            )}>
              {day}
            </span>
          </div>
        )}

        {/* 날짜 오버레이 (책 있을 때) */}
        {hasBooks && (
          <div className="absolute bottom-0 right-0 text-[8px] font-bold px-1 py-0.5 rounded-tl bg-black/60 text-white">
            {day}
          </div>
        )}
      </div>
    </div>
  );
}

interface StackedBookCoversProps {
  books: DailyBookActivity["books"];
  isHovered: boolean;
}

function StackedBookCovers({ books, isHovered }: StackedBookCoversProps) {
  // 최대 3개까지 표시 (성능 최적화)
  const displayBooks = books.slice(0, 3);
  const remainingCount = Math.max(0, books.length - 3);
  const bookCount = displayBooks.length;

  // 1권: 전체 표시
  if (bookCount === 1) {
    const book = displayBooks[0];
    return (
      <div className="w-full h-full relative">
        {book.coverImageUrl ? (
          <img
            src={book.coverImageUrl}
            alt={book.title}
            loading="lazy"
            className={cn(
              "w-full h-full object-cover transition-transform duration-150",
              isHovered && "scale-105"
            )}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-forest-200 to-forest-400 dark:from-forest-700 dark:to-forest-900 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-forest-700 dark:text-forest-300" />
          </div>
        )}
      </div>
    );
  }

  // 여러 권: 겹침 효과 (CSS 기반 - 성능 최적화)
  return (
    <div className="w-full h-full relative">
      {displayBooks.map((book, index) => {
        // 뒤에서부터 렌더링 (z-index 자연스럽게)
        const reverseIndex = bookCount - 1 - index;

        // 겹침 위치 계산: 각 책이 오른쪽 아래로 살짝 밀림
        const offset = reverseIndex * 3;
        // 회전: 뒤 책일수록 살짝 회전
        const rotation = (reverseIndex - 1) * 4;

        return (
          <div
            key={book.bookId}
            className={cn(
              "absolute inset-0 rounded-sm overflow-hidden",
              "transition-all duration-150 ease-out",
              // 호버 시 펼쳐지는 효과
              isHovered && reverseIndex > 0 && "translate-x-1"
            )}
            style={{
              // 기본 겹침 효과
              top: `${offset}px`,
              left: `${offset}px`,
              right: `${-offset}px`,
              bottom: `${-offset}px`,
              transform: isHovered
                ? `rotate(${(reverseIndex - 1) * 6}deg) translateX(${reverseIndex * 4}px)`
                : `rotate(${rotation}deg)`,
              transformOrigin: 'bottom center',
              boxShadow: `0 ${2 + reverseIndex}px ${4 + reverseIndex * 2}px rgba(0,0,0,${0.15 + reverseIndex * 0.05})`,
            }}
          >
            {book.coverImageUrl ? (
              <img
                src={book.coverImageUrl}
                alt={book.title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-400 dark:from-slate-600 dark:to-slate-800 flex items-center justify-center">
                <BookOpen className="w-3 h-3 text-slate-600 dark:text-slate-300" />
              </div>
            )}
          </div>
        );
      })}

      {/* 추가 권수 표시 */}
      {remainingCount > 0 && (
        <div className="absolute -top-1 -right-1 bg-forest-500 text-white text-[7px] font-bold w-4 h-4 rounded-full flex items-center justify-center z-10 shadow-sm">
          +{remainingCount}
        </div>
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={quickTransition}
      className="relative rounded-xl overflow-hidden bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/50 dark:border-slate-700/50"
    >
      <div className="p-3 space-y-2.5">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-sm font-semibold text-slate-800 dark:text-white">
              {formattedDate}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-forest-100 dark:bg-forest-900/40 text-forest-700 dark:text-forest-300 font-medium">
              {books.length}권
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* 책 목록 - 가로 스크롤 */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {books.map((book) => (
            <Link
              key={book.bookId}
              href={`/books/${book.userBookId}`}
              className="group flex-shrink-0 flex items-center gap-2 bg-white dark:bg-slate-700/60 rounded-lg p-1.5 pr-3 border border-slate-200/50 dark:border-slate-600/50 hover:border-forest-300 dark:hover:border-forest-600 transition-colors"
            >
              {/* 책 표지 - 세로로 긴 비율 */}
              <div className="w-8 h-11 rounded overflow-hidden bg-slate-200 dark:bg-slate-600 shrink-0">
                {book.coverImageUrl ? (
                  <img
                    src={book.coverImageUrl}
                    alt={book.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-forest-200 to-forest-300 dark:from-forest-700 dark:to-forest-800">
                    <BookOpen className="w-3 h-3 text-forest-600 dark:text-forest-300" />
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate max-w-[80px] group-hover:text-forest-600 dark:group-hover:text-forest-400 transition-colors">
                {book.title}
              </span>
            </Link>
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
    <Card className="p-4 sm:p-5 bg-gradient-to-br from-paper-50/90 to-white/80 dark:from-slate-900/90 dark:to-slate-800/80">
      <div className="space-y-3">
        {/* 헤더 스켈레톤 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-12 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-5 w-12 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
        </div>

        {/* 월 선택 스켈레톤 */}
        <div className="flex items-center justify-between">
          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>

        {/* 요일 헤더 스켈레톤 */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-5 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          ))}
        </div>

        {/* 캘린더 그리드 스켈레톤 - 책 비율(3:4) */}
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }).map((_, dayIndex) => (
                <div
                  key={dayIndex}
                  className="aspect-[3/4] rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
