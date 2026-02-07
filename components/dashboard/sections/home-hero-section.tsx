"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
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

  // 시간대별 메시지 (useMemo로 캐싱)
  const timeBasedCue = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 9) {
      return "아침 공기가 맑아요";
    } else if (hour >= 9 && hour < 12) {
      return "고요한 시간이에요";
    } else if (hour >= 12 && hour < 14) {
      return "잠시 쉬어가도 좋아요";
    } else if (hour >= 14 && hour < 18) {
      return "오후의 여백";
    } else if (hour >= 18 && hour < 21) {
      return "하루가 마무리되고 있어요";
    } else {
      return "조용한 밤, 좋은 시간이에요";
    }
  }, []); // 컴포넌트 마운트 시 한 번만 계산

  // 컨텍스트 기반 메시지 (useMemo로 캐싱)
  const motivationalMessage = useMemo(() => {
    if (!mounted) return "독서의 흔적을 남겨보세요";

    if (continueReadingBooks.length > 0) {
      return timeBasedCue;
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
  }, [mounted, continueReadingBooks.length, streak, weeklyNotes, persona?.note_style, timeBasedCue, getStreakMessage, getMotivationalMessage]);

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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60">
          <div className="relative p-4 sm:p-6">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                {displayGreeting.emoji && (
                  <span className="text-xl sm:text-2xl">{displayGreeting.emoji}</span>
                )}
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {displayGreeting.text}
                  {userName && <span className="text-forest-600 dark:text-forest-400">, {userName}님</span>}
                </h1>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {motivationalMessage}
              </p>
            </div>

            {/* 핵심 지표 3개: 스트릭 | 오늘 기록 | 읽은 만큼 */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* 스트릭 */}
              <div className="rounded-lg p-2.5 sm:p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <span className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300">
                    {streak}
                  </span>
                </div>
                <p className="text-[9px] sm:text-xs text-slate-500 dark:text-slate-400">흔적</p>
              </div>

              {/* 오늘 기록 */}
              <Link
                href="/notes"
                className="rounded-lg p-2.5 sm:p-3 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  {todayNotes > 0 ? (
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                  ) : (
                    <PenLine className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-forest-500" />
                  )}
                  <span className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300">
                    {todayNotes}
                  </span>
                </div>
                <p className="text-[9px] sm:text-xs text-slate-500 dark:text-slate-400">오늘의 기록</p>
              </Link>

              {/* 읽은 만큼 */}
              {currentBookProgress ? (
                <Link
                  href={`/books/${currentBookProgress.userBookId}`}
                  className="rounded-lg p-2.5 sm:p-3 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center justify-center gap-0.5 mb-0.5">
                    <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                    <span className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300">
                      {progressPercent}%
                    </span>
                  </div>
                  <p className="text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">읽은 만큼</p>
                </Link>
              ) : (
                <div className="rounded-lg p-2.5 sm:p-3 text-center">
                  <div className="flex items-center justify-center gap-0.5 mb-0.5">
                    <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                    <span className="text-sm sm:text-base font-medium text-slate-400 dark:text-slate-500">
                      -
                    </span>
                  </div>
                  <p className="text-[9px] sm:text-xs text-slate-400 dark:text-slate-500">읽은 만큼</p>
                </div>
              )}
            </div>

            {/* 주간 진행 바 (인라인) */}
            {userName && weeklyProgress && (
              <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    이번 주의 흐름
                  </span>
                  <span className="text-xs text-slate-500">
                    {weeklyProgress.recordedDays}일
                  </span>
                </div>
                <div className="flex justify-between gap-1">
                  {weeklyProgress.days.map((day) => (
                    <div
                      key={day.date}
                      className="flex flex-col items-center gap-1 flex-1"
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
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

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
      <div className="h-5 w-5 rounded-full flex items-center justify-center bg-forest-500 text-white">
        <Check className="h-3 w-3" strokeWidth={3} />
      </div>
    );
  }

  if (isToday) {
    return (
      <div className="h-5 w-5 rounded-full border-2 border-dashed flex items-center justify-center border-forest-400 dark:border-forest-500">
        <Circle className="h-1.5 w-1.5 text-forest-400" fill="currentColor" />
      </div>
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
      <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow duration-200 active:scale-[0.99] border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-forest-50 dark:bg-forest-900/30 flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5 text-forest-600 dark:text-forest-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  기록의 결
                </span>
                {dominantType && noteTypeIcons[dominantType] && (
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                    {noteTypeIcons[dominantType].label}
                  </Badge>
                )}
              </div>

              <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                {noteDistribution && totalNotes > 0 && (
                  <>
                    <div
                      className="bg-forest-600"
                      style={{ width: `${(noteDistribution.quote / totalNotes) * 100}%` }}
                    />
                    <div
                      className="bg-forest-400"
                      style={{ width: `${(noteDistribution.memo / totalNotes) * 100}%` }}
                    />
                    <div
                      className="bg-forest-300"
                      style={{ width: `${(noteDistribution.photo / totalNotes) * 100}%` }}
                    />
                    <div
                      className="bg-forest-200 dark:bg-forest-700"
                      style={{ width: `${(noteDistribution.transcription / totalNotes) * 100}%` }}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
        </div>
      </Card>
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
      <Card className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60">
        <div className="p-4 sm:p-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-40 sm:w-48 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </div>
            <div className="h-4 w-48 sm:w-56 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>

          {/* 3열 퀵 스탯 스켈레톤 */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg p-3 space-y-2">
                <div className="h-5 w-10 mx-auto rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
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
            <div className="h-0.5 w-full rounded bg-slate-200 dark:bg-slate-700 animate-pulse mt-2" />
          </div>
        </div>
      </Card>
    </div>
  );
}
