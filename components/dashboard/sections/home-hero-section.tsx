"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ChevronRight,
  Quote,
  Camera,
  FileText,
  PenTool,
  PenLine,
  CheckCircle2,
  Check,
  Circle,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserPersona } from "@/types/persona";
import type { ReadingStats } from "@/types/persona";
import { useStyle } from "@/hooks/use-style";
import { ContinueReadingCard, NoReadingBookCard } from "./continue-reading-card";
import { OnboardingChecklist, type OnboardingItem } from "@/components/onboarding/onboarding-checklist";
import type { DailyRecordByType } from "@/app/actions/stats";

interface ContinueReadingData {
  userBookId: string;
  bookId: string;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  currentPage: number;
  totalPages: number | null;
  progressPercent: number;
  lastActivityAt: string;
}

interface WeeklyProgressDay {
  date: string;
  dayOfWeek: number;
  dayLabel: string;
  hasRecord: boolean;
  count: number;
  isToday: boolean;
  isFuture: boolean;
}

interface WeeklyProgressData {
  days: WeeklyProgressDay[];
  recordedDays: number;
  totalDays: number;
  streak: number;
  streakStatus: "active" | "at_risk" | "none";
}

interface CurrentBookProgressData {
  userBookId: string;
  bookTitle: string;
  currentPage: number;
  totalPages: number | null;
  progressPercent: number;
}

interface HomeHeroSectionProps {
  userName?: string | null;
  persona: UserPersona | null;
  streak?: number;
  todayNotes?: number;
  weeklyNotes?: number;
  continueReadingBooks?: ContinueReadingData[];
  onboardingItems?: OnboardingItem[];
  onDismissOnboarding?: () => void;
  weeklyProgress?: WeeklyProgressData | null;
  dailyRecordsByType?: Record<string, DailyRecordByType>;
  currentBookProgress?: CurrentBookProgressData | null;
}

/**
 * 홈 히어로 섹션 - 5초 규칙 기반 정보 계층 구조
 * Primary Zone: 인사말 + 핵심 지표 3개 + 주간 진행 바
 */
export function HomeHeroSection({
  userName,
  persona,
  streak = 0,
  todayNotes = 0,
  weeklyNotes = 0,
  continueReadingBooks = [],
  onboardingItems,
  onDismissOnboarding,
  weeklyProgress,
  dailyRecordsByType = {},
  currentBookProgress,
}: HomeHeroSectionProps) {
  const [mounted, setMounted] = useState(false);
  const { greeting, getStreakMessage, getMotivationalMessage } = useStyle();
  const stats = persona?.reading_stats as ReadingStats | null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayGreeting = mounted ? greeting : { text: "안녕하세요", emoji: "" };

  const getTimeBasedCue = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 9) {
      return "아침 10분 독서로 하루를 시작해볼까요?";
    } else if (hour >= 9 && hour < 12) {
      return "오전 집중 시간, 책 속으로 들어가 볼까요?";
    } else if (hour >= 12 && hour < 14) {
      return "점심 후 가벼운 독서 어떠세요?";
    } else if (hour >= 14 && hour < 18) {
      return "오후의 여유, 책과 함께해요.";
    } else if (hour >= 18 && hour < 21) {
      return "저녁 독서로 하루를 마무리해보세요.";
    } else {
      return "조용한 밤, 책 읽기 좋은 시간이에요.";
    }
  };

  const getContextualMessage = () => {
    if (continueReadingBooks.length > 0) {
      return getTimeBasedCue();
    }
    if (streak >= 3) {
      return getStreakMessage(streak);
    }
    if (weeklyNotes >= 5) {
      return getMotivationalMessage("default");
    }
    if (persona?.note_style === "quote-focused") {
      return getMotivationalMessage("quoteFocused");
    } else if (persona?.note_style === "reflection-focused") {
      return getMotivationalMessage("reflectionFocused");
    } else if (persona?.note_style === "visual") {
      return getMotivationalMessage("visualFocused");
    }
    return getMotivationalMessage("default");
  };

  const motivationalMessage = mounted ? getContextualMessage() : "독서의 흔적을 남겨보세요";

  // 기록 유형 분포 계산
  const noteDistribution = stats?.noteTypeDistribution;
  const totalNotes = noteDistribution
    ? noteDistribution.quote + noteDistribution.memo + noteDistribution.photo + noteDistribution.transcription
    : 0;

  const dominantType = noteDistribution
    ? Object.entries(noteDistribution).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
    : null;

  const noteTypeIcons: Record<string, { icon: React.ElementType; label: string; color: string }> = {
    quote: { icon: Quote, label: "인용구", color: "text-blue-500" },
    memo: { icon: FileText, label: "메모", color: "text-green-500" },
    photo: { icon: Camera, label: "사진", color: "text-orange-500" },
    transcription: { icon: PenTool, label: "필사", color: "text-purple-500" },
  };

  // 진행률 계산 (현재 읽는 책 기준)
  const progressPercent = currentBookProgress?.progressPercent || 0;

  return (
    <div className="space-y-3">
      {/* ======== PRIMARY ZONE: 5초 내 핵심 파악 ======== */}
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-forest-50 via-white to-emerald-50 dark:from-forest-950 dark:via-slate-900 dark:to-emerald-950">
        {/* 배경 장식 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-forest-200/30 dark:bg-forest-800/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-200/30 dark:bg-emerald-800/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative p-4 sm:p-6">
          {/* 인사말 (간소화) */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl sm:text-2xl">{displayGreeting.emoji}</span>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {displayGreeting.text}
                {userName && <span className="text-forest-600 dark:text-forest-400">, {userName}님</span>}
              </h1>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 pl-8 sm:pl-9">
              {motivationalMessage}
            </p>
          </motion.div>

          {/* 핵심 지표 3개: 스트릭 | 오늘 기록 | 진행률 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-3 gap-2 sm:gap-3"
          >
            {/* 스트릭 */}
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 text-center border border-white/50 dark:border-slate-700/50">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <span className="text-base sm:text-lg">🔥</span>
                <motion.span
                  key={streak}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-base sm:text-xl font-bold text-slate-900 dark:text-white"
                >
                  {streak}
                </motion.span>
              </div>
              <p className="text-[9px] sm:text-xs text-slate-500 dark:text-slate-400">연속</p>
            </div>

            {/* 오늘 기록 */}
            <Link
              href="/notes"
              className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 text-center border border-white/50 dark:border-slate-700/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-center gap-1 mb-0.5">
                {todayNotes > 0 ? (
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                ) : (
                  <PenLine className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-forest-500" />
                )}
                <motion.span
                  key={todayNotes}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-base sm:text-xl font-bold text-slate-900 dark:text-white"
                >
                  {todayNotes}
                </motion.span>
              </div>
              <p className="text-[9px] sm:text-xs text-slate-500 dark:text-slate-400">오늘</p>
            </Link>

            {/* 진행률 */}
            {currentBookProgress ? (
              <Link
                href={`/books/${currentBookProgress.userBookId}`}
                className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 text-center border border-white/50 dark:border-slate-700/50 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-center gap-0.5 mb-0.5">
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                  <motion.span
                    key={progressPercent}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="text-base sm:text-xl font-bold text-slate-900 dark:text-white"
                  >
                    {progressPercent}%
                  </motion.span>
                </div>
                <p className="text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">진행률</p>
              </Link>
            ) : (
              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 text-center border border-white/50 dark:border-slate-700/50">
                <div className="flex items-center justify-center gap-0.5 mb-0.5">
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                  <span className="text-base sm:text-xl font-bold text-slate-400 dark:text-slate-500">
                    -
                  </span>
                </div>
                <p className="text-[9px] sm:text-xs text-slate-400 dark:text-slate-500">진행률</p>
              </div>
            )}
          </motion.div>

          {/* 주간 진행 바 (인라인) */}
          {userName && weeklyProgress && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-700/50"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  이번 주
                </span>
                <span className="text-xs text-slate-500">
                  {weeklyProgress.recordedDays}/{weeklyProgress.totalDays}일
                </span>
              </div>
              <div className="flex justify-between gap-1">
                {weeklyProgress.days.map((day, index) => (
                  <motion.div
                    key={day.date}
                    className="flex flex-col items-center gap-1 flex-1"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.03 }}
                  >
                    <span
                      className={cn(
                        "text-[9px] sm:text-[10px] font-medium",
                        day.isToday
                          ? "text-forest-600 dark:text-forest-400"
                          : "text-slate-400 dark:text-slate-500"
                      )}
                    >
                      {day.dayLabel}
                    </span>
                    <InlineDayIndicator
                      hasRecord={day.hasRecord}
                      isToday={day.isToday}
                      isFuture={day.isFuture}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </Card>

      {/* ======== SECONDARY ZONE: 액션 유도 ======== */}
      {userName && (
        <div className="space-y-2 sm:space-y-3">
          {/* 계속 읽기 (Primary CTA) */}
          {continueReadingBooks.length > 0 ? (
            continueReadingBooks.slice(0, 2).map((book) => (
              <ContinueReadingCard
                key={book.userBookId}
                userBookId={book.userBookId}
                title={book.title}
                author={book.author}
                coverImageUrl={book.coverImageUrl}
                currentPage={book.currentPage}
                totalPages={book.totalPages}
                progressPercent={book.progressPercent}
                compact={true}
              />
            ))
          ) : (
            <NoReadingBookCard />
          )}
        </div>
      )}

      {/* 온보딩 체크리스트 (새 사용자용) */}
      {userName && onboardingItems && onboardingItems.length > 0 && (
        <OnboardingChecklist
          items={onboardingItems}
          onDismiss={onDismissOnboarding}
        />
      )}

      {/* ======== TERTIARY ZONE: 추가 정보 (접이식으로 dashboard-content에서 처리) ======== */}
      {/* 30일 활동 캘린더는 접이식 영역으로 이동 */}

      {/* 페르소나 인사이트 미니 카드는 접이식 영역으로 이동 */}
    </div>
  );
}

/**
 * 인라인 요일 지표 컴포넌트 (컴팩트 버전)
 */
interface InlineDayIndicatorProps {
  hasRecord: boolean;
  isToday: boolean;
  isFuture: boolean;
}

function InlineDayIndicator({ hasRecord, isToday, isFuture }: InlineDayIndicatorProps) {
  if (isFuture) {
    return (
      <div className="h-5 w-5 flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 text-slate-200 dark:text-slate-700" strokeWidth={1} />
      </div>
    );
  }

  if (hasRecord) {
    return (
      <motion.div
        className="h-5 w-5 rounded-full flex items-center justify-center bg-forest-500 text-white"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </motion.div>
    );
  }

  if (isToday) {
    return (
      <motion.div
        className="h-5 w-5 rounded-full border-2 border-dashed flex items-center justify-center border-forest-400 dark:border-forest-500"
        animate={{ borderColor: ["rgba(34, 197, 94, 0.4)", "rgba(34, 197, 94, 0.8)", "rgba(34, 197, 94, 0.4)"] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Circle className="h-1.5 w-1.5 text-forest-400" fill="currentColor" />
      </motion.div>
    );
  }

  return (
    <div className="h-5 w-5 flex items-center justify-center">
      <div className="h-3.5 w-3.5 rounded-full bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}

/**
 * 페르소나 인사이트 카드 (Tertiary Zone용)
 */
export function PersonaInsightCard({
  persona,
  stats,
}: {
  persona: UserPersona | null;
  stats: ReadingStats | null;
}) {
  const noteDistribution = stats?.noteTypeDistribution;
  const totalNotes = noteDistribution
    ? noteDistribution.quote + noteDistribution.memo + noteDistribution.photo + noteDistribution.transcription
    : 0;

  const dominantType = noteDistribution
    ? Object.entries(noteDistribution).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
    : null;

  const noteTypeIcons: Record<string, { label: string }> = {
    quote: { label: "인용구" },
    memo: { label: "메모" },
    photo: { label: "사진" },
    transcription: { label: "필사" },
  };

  if (!persona || !stats || totalNotes === 0) {
    return null;
  }

  return (
    <Link href="/persona" className="block">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="p-3 sm:p-4 hover:shadow-md transition-all active:scale-[0.99] border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-forest-100 to-emerald-100 dark:from-forest-900 dark:to-emerald-900 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-forest-600 dark:text-forest-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    나의 독서 스타일
                  </span>
                  {dominantType && noteTypeIcons[dominantType] && (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                      {noteTypeIcons[dominantType].label} 중심
                    </Badge>
                  )}
                </div>

                <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {noteDistribution && totalNotes > 0 && (
                    <>
                      <motion.div
                        className="bg-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${(noteDistribution.quote / totalNotes) * 100}%` }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                      />
                      <motion.div
                        className="bg-green-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${(noteDistribution.memo / totalNotes) * 100}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      />
                      <motion.div
                        className="bg-orange-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${(noteDistribution.photo / totalNotes) * 100}%` }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      />
                      <motion.div
                        className="bg-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${(noteDistribution.transcription / totalNotes) * 100}%` }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

            <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}

/**
 * 히어로 섹션 스켈레톤
 */
export function HomeHeroSkeleton() {
  return (
    <div className="space-y-3">
      {/* 메인 히어로 카드 스켈레톤 */}
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="p-4 sm:p-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-6 w-48 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </div>
            <div className="h-4 w-56 rounded bg-slate-200 dark:bg-slate-700 animate-pulse ml-9" />
          </div>

          {/* 3열 퀵 스탯 스켈레톤 */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 space-y-2">
                <div className="h-6 w-10 mx-auto rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="h-3 w-12 mx-auto rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              </div>
            ))}
          </div>

          {/* 인라인 주간 바 스켈레톤 */}
          <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-3 w-10 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </div>
            <div className="flex justify-between gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div className="h-2.5 w-3 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 계속 읽기 스켈레톤 */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-16 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-1.5 w-full rounded bg-slate-200 dark:bg-slate-700 animate-pulse mt-2" />
          </div>
        </div>
      </Card>
    </div>
  );
}
