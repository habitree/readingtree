"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  BookCheck,
  PenLine,
  Calendar,
  Trophy,
  Star,
  Flame,
  TrendingUp,
  Clock,
  Heart,
  Share2,
  Download,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Quote,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface YearlyStats {
  year: number;
  totalBooks: number;
  completedBooks: number;
  totalNotes: number;
  totalQuotes: number;
  readingDays: number;
  longestStreak: number;
  currentStreak: number;
  favoriteCategory: string | null;
  totalReadingTime: number; // 분 단위
  groupsJoined: number;
  notesShared: number;
  /** 월별 독서량 */
  monthlyBooks: number[];
  /** 월별 기록 수 */
  monthlyNotes: number[];
  /** 가장 많이 읽은 달 */
  bestMonth: number;
  /** 올해의 책 (가장 많은 기록을 남긴 책) */
  bookOfTheYear?: {
    id: string;
    title: string;
    author: string | null;
    coverImageUrl: string | null;
    notesCount: number;
  };
  /** 올해의 인용구 */
  quoteOfTheYear?: {
    content: string;
    bookTitle: string;
  };
}

interface YearlyReportProps {
  stats: YearlyStats;
  /** 전년도 통계 (비교용) */
  previousYearStats?: YearlyStats | null;
  /** 공유 기능 */
  onShare?: () => void;
  className?: string;
}

const MONTH_NAMES = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월"
];

// 독서 레벨 결정
function getReadingLevel(completedBooks: number): {
  level: string;
  icon: typeof Star;
  color: string;
  description: string;
} {
  if (completedBooks >= 50) {
    return {
      level: "마스터 독서가",
      icon: Trophy,
      color: "text-amber-500",
      description: "놀라운 독서량! 진정한 독서 마스터예요",
    };
  }
  if (completedBooks >= 30) {
    return {
      level: "열정적 독서가",
      icon: Flame,
      color: "text-orange-500",
      description: "열정적으로 책을 읽고 있어요!",
    };
  }
  if (completedBooks >= 15) {
    return {
      level: "성실한 독서가",
      icon: Star,
      color: "text-blue-500",
      description: "꾸준히 독서 습관을 만들어가고 있어요",
    };
  }
  if (completedBooks >= 5) {
    return {
      level: "성장하는 독서가",
      icon: TrendingUp,
      color: "text-emerald-500",
      description: "좋은 시작이에요! 계속 성장해보세요",
    };
  }
  return {
    level: "새싹 독서가",
    icon: Sparkles,
    color: "text-green-500",
    description: "독서의 즐거움을 발견해보세요",
  };
}

/**
 * 연간 독서 리포트 컴포넌트
 *
 * 1년간의 독서 활동을 인포그래픽 형태로 요약합니다.
 * 성취감을 극대화하고 공유 욕구를 자극합니다.
 */
export function YearlyReport({
  stats,
  previousYearStats,
  onShare,
  className,
}: YearlyReportProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = 4;

  // 독서 레벨
  const readingLevel = useMemo(() => {
    return getReadingLevel(stats.completedBooks);
  }, [stats.completedBooks]);

  // 전년 대비 성장
  const yearOverYearGrowth = useMemo(() => {
    if (!previousYearStats) return null;
    const prevBooks = previousYearStats.completedBooks || 1;
    return Math.round(((stats.completedBooks - prevBooks) / prevBooks) * 100);
  }, [stats.completedBooks, previousYearStats]);

  // 하루 평균 독서 시간
  const avgReadingTimePerDay = useMemo(() => {
    if (stats.readingDays === 0) return 0;
    return Math.round(stats.totalReadingTime / stats.readingDays);
  }, [stats.totalReadingTime, stats.readingDays]);

  const LevelIcon = readingLevel.icon;

  const pages = [
    // Page 1: 메인 통계
    <div key="main" className="space-y-6">
      {/* 레벨 배지 */}
      <div className="text-center py-6 bg-gradient-to-br from-primary/10 via-violet-500/10 to-pink-500/10 rounded-2xl">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className={cn(
            "inline-flex h-20 w-20 items-center justify-center rounded-full mb-4",
            "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg"
          )}
        >
          <LevelIcon className="h-10 w-10 text-white" />
        </motion.div>
        <h3 className={cn("text-2xl font-bold mb-1", readingLevel.color)}>
          {readingLevel.level}
        </h3>
        <p className="text-sm text-muted-foreground">
          {readingLevel.description}
        </p>
      </div>

      {/* 핵심 통계 */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={BookCheck}
          label="완독한 책"
          value={stats.completedBooks}
          unit="권"
          color="text-emerald-500"
          bgColor="bg-emerald-50 dark:bg-emerald-950/30"
          growth={yearOverYearGrowth}
        />
        <StatCard
          icon={PenLine}
          label="남긴 기록"
          value={stats.totalNotes}
          unit="개"
          color="text-blue-500"
          bgColor="bg-blue-50 dark:bg-blue-950/30"
        />
        <StatCard
          icon={Flame}
          label="최장 연속"
          value={stats.longestStreak}
          unit="일"
          color="text-orange-500"
          bgColor="bg-orange-50 dark:bg-orange-950/30"
        />
        <StatCard
          icon={Calendar}
          label="독서일"
          value={stats.readingDays}
          unit="일"
          color="text-violet-500"
          bgColor="bg-violet-50 dark:bg-violet-950/30"
        />
      </div>
    </div>,

    // Page 2: 월별 차트
    <div key="chart" className="space-y-4">
      <h3 className="text-sm font-semibold text-center">월별 독서 현황</h3>

      {/* 월별 바 차트 */}
      <div className="h-40">
        <div className="flex items-end justify-between h-full gap-1 px-2">
          {stats.monthlyBooks.map((count, index) => {
            const maxBooks = Math.max(...stats.monthlyBooks, 1);
            const height = (count / maxBooks) * 100;
            const isBest = index === stats.bestMonth;

            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <motion.div
                  className={cn(
                    "w-full rounded-t relative",
                    isBest
                      ? "bg-gradient-to-t from-amber-500 to-yellow-400"
                      : "bg-gradient-to-t from-primary to-primary/70"
                  )}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(height, 5)}%` }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  {isBest && (
                    <Star className="absolute -top-4 left-1/2 -translate-x-1/2 h-3 w-3 text-amber-500" />
                  )}
                </motion.div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between px-2 mt-1">
          {MONTH_NAMES.map((name, i) => (
            <span key={i} className="text-[8px] text-muted-foreground flex-1 text-center">
              {name.replace("월", "")}
            </span>
          ))}
        </div>
      </div>

      {/* 월간 하이라이트 */}
      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-medium">최고의 달</span>
        </div>
        <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
          {MONTH_NAMES[stats.bestMonth]}
        </p>
        <p className="text-xs text-muted-foreground">
          {stats.monthlyBooks[stats.bestMonth]}권 읽음
        </p>
      </div>
    </div>,

    // Page 3: 올해의 책 & 인용구
    <div key="highlights" className="space-y-4">
      {/* 올해의 책 */}
      {stats.bookOfTheYear && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-pink-50 dark:from-violet-950/30 dark:to-pink-950/30 border border-violet-200 dark:border-violet-800">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="h-4 w-4 text-rose-500" />
            <span className="text-xs font-medium">올해의 책</span>
          </div>
          <div className="flex gap-3">
            {stats.bookOfTheYear.coverImageUrl ? (
              <img
                src={stats.bookOfTheYear.coverImageUrl}
                alt={stats.bookOfTheYear.title}
                className="w-16 h-24 object-cover rounded-lg shadow-md"
              />
            ) : (
              <div className="w-16 h-24 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-sm line-clamp-2">
                {stats.bookOfTheYear.title}
              </p>
              {stats.bookOfTheYear.author && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stats.bookOfTheYear.author}
                </p>
              )}
              <Badge variant="secondary" className="mt-2 text-[10px]">
                {stats.bookOfTheYear.notesCount}개의 기록
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* 올해의 인용구 */}
      {stats.quoteOfTheYear && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border">
          <div className="flex items-center gap-2 mb-3">
            <Quote className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-medium">올해의 인용구</span>
          </div>
          <blockquote className="text-sm italic text-muted-foreground border-l-2 border-primary pl-3">
            "{stats.quoteOfTheYear.content}"
          </blockquote>
          <p className="text-xs text-right mt-2 text-muted-foreground">
            - {stats.quoteOfTheYear.bookTitle}
          </p>
        </div>
      )}

      {!stats.bookOfTheYear && !stats.quoteOfTheYear && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            아직 기록된 내용이 없습니다
          </p>
        </div>
      )}
    </div>,

    // Page 4: 소셜 & 공유
    <div key="social" className="space-y-4">
      <h3 className="text-sm font-semibold text-center">함께한 독서</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-center">
          <Users className="h-6 w-6 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.groupsJoined}
          </p>
          <p className="text-xs text-muted-foreground">참여한 모임</p>
        </div>
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-center">
          <Share2 className="h-6 w-6 text-rose-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {stats.notesShared}
          </p>
          <p className="text-xs text-muted-foreground">공유한 기록</p>
        </div>
      </div>

      {/* 독서 시간 */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Clock className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">올해 총 독서 시간</p>
            <p className="text-2xl font-bold">
              {Math.floor(stats.totalReadingTime / 60)}시간{" "}
              <span className="text-base font-normal text-muted-foreground">
                {stats.totalReadingTime % 60}분
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              하루 평균 {avgReadingTimePerDay}분
            </p>
          </div>
        </div>
      </div>

      {/* 공유 버튼 */}
      {onShare && (
        <Button onClick={onShare} className="w-full" size="lg">
          <Share2 className="h-4 w-4 mr-2" />
          리포트 공유하기
        </Button>
      )}
    </div>,
  ];

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            {stats.year}년 독서 리포트
          </CardTitle>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  currentPage === i ? "w-4 bg-primary" : "w-1.5 bg-slate-300 dark:bg-slate-600"
                )}
              />
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative">
        {/* 페이지 네비게이션 */}
        <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-10">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full pointer-events-auto",
              currentPage === 0 && "opacity-0"
            )}
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full pointer-events-auto",
              currentPage === totalPages - 1 && "opacity-0"
            )}
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* 페이지 콘텐츠 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {pages[currentPage]}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  icon: typeof BookOpen;
  label: string;
  value: number;
  unit: string;
  color: string;
  bgColor: string;
  growth?: number | null;
}

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
  bgColor,
  growth,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("p-4 rounded-xl", bgColor)}
    >
      <Icon className={cn("h-5 w-5 mb-2", color)} />
      <div className="flex items-baseline gap-1">
        <span className={cn("text-2xl font-bold", color)}>{value}</span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {growth !== null && growth !== undefined && (
        <Badge
          variant={growth > 0 ? "default" : "secondary"}
          className={cn(
            "mt-2 text-[10px]",
            growth > 0 && "bg-emerald-500"
          )}
        >
          전년 대비 {growth > 0 ? "+" : ""}{growth}%
        </Badge>
      )}
    </motion.div>
  );
}

/**
 * 연간 리포트 미리보기 카드
 * 프로필 페이지에서 간단히 표시
 */
interface YearlyReportPreviewProps {
  stats: YearlyStats;
  className?: string;
  onViewFull?: () => void;
}

export function YearlyReportPreview({
  stats,
  className,
  onViewFull,
}: YearlyReportPreviewProps) {
  const readingLevel = getReadingLevel(stats.completedBooks);
  const LevelIcon = readingLevel.icon;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={cn(
            "h-14 w-14 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-amber-400 to-orange-500"
          )}>
            <LevelIcon className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className={cn("font-semibold", readingLevel.color)}>
              {readingLevel.level}
            </h3>
            <p className="text-xs text-muted-foreground">
              {stats.year}년 {stats.completedBooks}권 완독 · {stats.totalNotes}개 기록
            </p>
          </div>
          {onViewFull && (
            <Button variant="outline" size="sm" onClick={onViewFull}>
              자세히
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
