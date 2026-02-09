"use client";

import { useMemo, useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, BookOpen, Calendar, Sparkles, X, PenTool } from "lucide-react";
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
      noteTypes: DailyBookActivity["noteTypes"] | null;
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
        noteTypes: null,
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
        noteTypes: activity?.noteTypes || null,
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
          noteTypes: null,
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

    // 총 기록 수 계산
    const totalNotes = Object.values(activities)
      .filter(a => {
        const [y, m] = a.date.split("-").map(Number);
        return y === year && m === month;
      })
      .reduce((sum, a) => sum + (a.noteTypes?.total || 0), 0);

    return { weeks, recordedDays, totalBooks, uniqueBooks: uniqueBookIds.size, totalNotes };
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
            {calendarData.totalNotes > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100/80 dark:bg-violet-900/30">
                <PenTool className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
                  {calendarData.totalNotes}개
                </span>
              </div>
            )}
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
                  noteTypes={day.noteTypes}
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
          {selectedDayInfo && (selectedDayInfo.books.length > 0 || (selectedDayInfo.noteTypes && selectedDayInfo.noteTypes.total > 0)) && (
            <SelectedDateDetail
              date={selectedDate!}
              books={selectedDayInfo.books}
              noteTypes={selectedDayInfo.noteTypes}
              onClose={() => setSelectedDate(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}

// 기록 타입별 색상 (작은 도트 인디케이터용)
const NOTE_TYPE_COLORS = {
  transcription: "bg-violet-400 dark:bg-violet-500",
  photo: "bg-sky-400 dark:bg-sky-500",
  memo: "bg-emerald-400 dark:bg-emerald-500",
  progress: "bg-amber-400 dark:bg-amber-500",
};

interface DayCellProps {
  day: number | null;
  date: string | null;
  books: DailyBookActivity["books"];
  noteTypes: DailyBookActivity["noteTypes"] | null;
  isToday: boolean;
  isFuture: boolean;
  isSelected: boolean;
  isHovered: boolean;
  dayOfWeek: number;
  onClick: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

/**
 * DayCell 컴포넌트 - 메모이제이션으로 불필요한 리렌더링 방지
 * 35개 이상의 셀이 렌더링되므로 성능 최적화 필수
 */
const DayCell = memo(function DayCell({
  day,
  date,
  books,
  noteTypes,
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
  const hasNotes = noteTypes && noteTypes.total > 0;

  // 기록 타입 도트 표시용
  const activeNoteTypes = noteTypes ? [
    noteTypes.transcription > 0 ? "transcription" : null,
    noteTypes.photo > 0 ? "photo" : null,
    (noteTypes.memo > 0 || noteTypes.quote > 0) ? "memo" : null,
    noteTypes.progress > 0 ? "progress" : null,
  ].filter(Boolean) as (keyof typeof NOTE_TYPE_COLORS)[] : [];

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

        {/* 기록 타입 인디케이터 도트 (왼쪽 상단) */}
        {hasNotes && activeNoteTypes.length > 0 && (
          <div className="absolute top-0.5 left-0.5 flex gap-[2px] z-10">
            {activeNoteTypes.slice(0, 3).map((type) => (
              <div
                key={type}
                className={cn(
                  "w-[5px] h-[5px] rounded-full shadow-sm",
                  NOTE_TYPE_COLORS[type]
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

// DayCell displayName 설정 (React DevTools 디버깅용)
DayCell.displayName = "DayCell";

interface StackedBookCoversProps {
  books: DailyBookActivity["books"];
  isHovered: boolean;
}

/**
 * StackedBookCovers 컴포넌트 - 수평 분할(Split) 표현
 * 여러 책이 있을 때 각 표지가 나란히 배치되어 모든 표지가 명확히 보임
 * 호버 시 살짝 벌어져 각 표지를 더 잘 확인 가능
 */
const StackedBookCovers = memo(function StackedBookCovers({ books, isHovered }: StackedBookCoversProps) {
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

  // 2~3권: 수평 분할 배치 - 각 표지가 나란히 보이도록
  // 2권: 각 58% 폭, 16% 겹침 / 3권: 각 42% 폭, 13% 겹침
  const layouts: Record<number, Array<{ left: string; width: string; rotate: number; hoverRotate: number }>> = {
    2: [
      { left: '0%', width: '58%', rotate: -2, hoverRotate: -4 },
      { left: '42%', width: '58%', rotate: 2, hoverRotate: 4 },
    ],
    3: [
      { left: '0%', width: '42%', rotate: -3, hoverRotate: -5 },
      { left: '29%', width: '42%', rotate: 0, hoverRotate: 0 },
      { left: '58%', width: '42%', rotate: 3, hoverRotate: 5 },
    ],
  };

  const positions = layouts[bookCount] || layouts[3];

  return (
    <div className="w-full h-full relative">
      {displayBooks.map((book, index) => {
        const pos = positions[index];
        const rotate = isHovered ? pos.hoverRotate : pos.rotate;

        return (
          <div
            key={book.bookId}
            className="absolute top-0 h-full rounded-sm overflow-hidden transition-all duration-200 ease-out"
            style={{
              left: pos.left,
              width: pos.width,
              zIndex: index,
              transform: `rotate(${rotate}deg)`,
              transformOrigin: 'bottom center',
              boxShadow: index > 0
                ? (isHovered
                  ? `-3px 0 8px rgba(0,0,0,0.25)`
                  : `-2px 0 6px rgba(0,0,0,0.18)`)
                : `0 1px 3px rgba(0,0,0,0.1)`,
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
              <div className={cn(
                "w-full h-full flex items-center justify-center",
                index === 0
                  ? "bg-gradient-to-br from-forest-200 to-forest-400 dark:from-forest-700 dark:to-forest-900"
                  : index === 1
                    ? "bg-gradient-to-br from-indigo-200 to-indigo-400 dark:from-indigo-700 dark:to-indigo-900"
                    : "bg-gradient-to-br from-amber-200 to-amber-400 dark:from-amber-700 dark:to-amber-900"
              )}>
                <BookOpen className="w-3 h-3 text-slate-600 dark:text-slate-300" />
              </div>
            )}
          </div>
        );
      })}

      {/* 책 권수 배지 (2권 이상일 때 항상 표시) */}
      <div
        className={cn(
          "absolute -top-1.5 -right-1.5 text-white text-[8px] font-bold rounded-full flex items-center justify-center z-10",
          "shadow-md border border-white/50 dark:border-slate-800/50",
          "transition-transform duration-200",
          isHovered && "scale-110",
          remainingCount > 0
            ? "w-5 h-5 bg-gradient-to-br from-amber-500 to-orange-600"
            : "w-4 h-4 bg-gradient-to-br from-forest-500 to-forest-700"
        )}
      >
        {remainingCount > 0 ? `${books.length}` : bookCount}
      </div>
    </div>
  );
});

// StackedBookCovers displayName 설정 (React DevTools 디버깅용)
StackedBookCovers.displayName = "StackedBookCovers";

// 기록 타입 라벨 정의 (상세보기용)
const NOTE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  transcription: { label: "필사", color: "text-violet-600 dark:text-violet-400" },
  photo: { label: "사진", color: "text-sky-600 dark:text-sky-400" },
  memo: { label: "기록", color: "text-emerald-600 dark:text-emerald-400" },
  progress: { label: "진행", color: "text-amber-600 dark:text-amber-400" },
};

interface SelectedDateDetailProps {
  date: string;
  books: DailyBookActivity["books"];
  noteTypes: DailyBookActivity["noteTypes"] | null;
  onClose: () => void;
}

function SelectedDateDetail({ date, books, noteTypes, onClose }: SelectedDateDetailProps) {
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

        {/* 기록 타입 요약 */}
        {noteTypes && noteTypes.total > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {noteTypes.transcription > 0 && (
              <span className={cn("text-[11px] font-medium", NOTE_TYPE_LABELS.transcription.color)}>
                필사 {noteTypes.transcription}
              </span>
            )}
            {noteTypes.photo > 0 && (
              <span className={cn("text-[11px] font-medium", NOTE_TYPE_LABELS.photo.color)}>
                사진 {noteTypes.photo}
              </span>
            )}
            {(noteTypes.memo > 0 || noteTypes.quote > 0) && (
              <span className={cn("text-[11px] font-medium", NOTE_TYPE_LABELS.memo.color)}>
                기록 {noteTypes.memo + noteTypes.quote}
              </span>
            )}
            {noteTypes.progress > 0 && (
              <span className={cn("text-[11px] font-medium", NOTE_TYPE_LABELS.progress.color)}>
                진행 {noteTypes.progress}
              </span>
            )}
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              총 {noteTypes.total}개
            </span>
          </div>
        )}

        {/* 책 목록 - 가로 스크롤 */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
          {books.map((book) => (
            <Link
              key={book.bookId}
              href={`/books/${book.userBookId}`}
              className="group flex-shrink-0 flex flex-col items-center gap-1.5 bg-white dark:bg-slate-700/60 rounded-lg p-2 border border-slate-200/50 dark:border-slate-600/50 hover:border-forest-300 dark:hover:border-forest-600 hover:shadow-md transition-all"
            >
              {/* 책 표지 - 크게 표시 */}
              <div className="w-12 h-16 rounded overflow-hidden bg-slate-200 dark:bg-slate-600 shrink-0 shadow-sm">
                {book.coverImageUrl ? (
                  <img
                    src={book.coverImageUrl}
                    alt={book.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-150"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-forest-200 to-forest-300 dark:from-forest-700 dark:to-forest-800">
                    <BookOpen className="w-4 h-4 text-forest-600 dark:text-forest-300" />
                  </div>
                )}
              </div>
              <span className="text-[10px] font-medium text-slate-700 dark:text-slate-200 truncate max-w-[56px] group-hover:text-forest-600 dark:group-hover:text-forest-400 transition-colors text-center leading-tight">
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
