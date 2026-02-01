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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserPersona } from "@/types/persona";
import type { ReadingStats } from "@/types/persona";
import { useStyle } from "@/hooks/use-style";
import { ContinueReadingCard, NoReadingBookCard } from "./continue-reading-card";
import { OnboardingChecklist, type OnboardingItem } from "@/components/onboarding/onboarding-checklist";
import { WeeklyProgressBar } from "./weekly-progress-bar";
import { MiniCalendarHeatmap } from "./mini-calendar-heatmap";
import { ActivityCalendar } from "./activity-calendar";
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

interface HomeHeroSectionProps {
  userName?: string | null;
  persona: UserPersona | null;
  streak?: number;
  /** 오늘 기록 수 (구체적인 숫자 표시) */
  todayNotes?: number;
  weeklyNotes?: number;
  continueReadingBooks?: ContinueReadingData[];
  /** 온보딩 체크리스트 (새 사용자에게 표시) */
  onboardingItems?: OnboardingItem[];
  /** 온보딩 숨기기 핸들러 */
  onDismissOnboarding?: () => void;
  /** 주간 진행 상황 데이터 */
  weeklyProgress?: WeeklyProgressData | null;
  /** 일별 기록 데이터 (달력용) */
  dailyRecords?: Record<string, number>;
  /** 일별 타입별 기록 데이터 (30일 활동 캘린더용) */
  dailyRecordsByType?: Record<string, DailyRecordByType>;
}

/**
 * 홈 히어로 섹션 - 개인화된 인사 + 습관 루프 강화
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
  dailyRecords = {},
  dailyRecordsByType = {},
}: HomeHeroSectionProps) {
  const [mounted, setMounted] = useState(false);
  const { greeting, getStreakMessage, getMotivationalMessage } = useStyle();
  const stats = persona?.reading_stats as ReadingStats | null;

  useEffect(() => {
    setMounted(true);
  }, []);

  // 서버 사이드에서는 기본 인사말
  const displayGreeting = mounted ? greeting : { text: "안녕하세요", emoji: "" };

  // 시간대별 권장 행동 메시지
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

  // 동기부여 메시지 생성
  const getContextualMessage = () => {
    // 계속 읽기 책이 있으면 시간대별 큐
    if (continueReadingBooks.length > 0) {
      return getTimeBasedCue();
    }

    // 스트릭이 있는 경우
    if (streak >= 3) {
      return getStreakMessage(streak);
    }

    // 이번 주 기록 기반
    if (weeklyNotes >= 5) {
      return getMotivationalMessage("default");
    }

    // 페르소나 기반 맞춤 메시지
    if (persona?.note_style === "quote-focused") {
      return getMotivationalMessage("quoteFocused");
    } else if (persona?.note_style === "reflection-focused") {
      return getMotivationalMessage("reflectionFocused");
    } else if (persona?.note_style === "visual") {
      return getMotivationalMessage("visualFocused");
    }

    // 기본 메시지
    return getMotivationalMessage("default");
  };

  const motivationalMessage = mounted ? getContextualMessage() : "독서의 흔적을 남겨보세요";

  // 기록 유형 분포 계산
  const noteDistribution = stats?.noteTypeDistribution;
  const totalNotes = noteDistribution
    ? noteDistribution.quote + noteDistribution.memo + noteDistribution.photo + noteDistribution.transcription
    : 0;

  // 가장 많은 기록 유형 찾기
  const dominantType = noteDistribution
    ? Object.entries(noteDistribution).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
    : null;

  const noteTypeIcons: Record<string, { icon: React.ElementType; label: string; color: string }> = {
    quote: { icon: Quote, label: "인용구", color: "text-blue-500" },
    memo: { icon: FileText, label: "메모", color: "text-green-500" },
    photo: { icon: Camera, label: "사진", color: "text-orange-500" },
    transcription: { icon: PenTool, label: "필사", color: "text-purple-500" },
  };

  return (
    <div className="space-y-3">
      {/* 메인 히어로 카드 */}
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-forest-50 via-white to-emerald-50 dark:from-forest-950 dark:via-slate-900 dark:to-emerald-950">
        {/* 배경 장식 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-forest-200/30 dark:bg-forest-800/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-200/30 dark:bg-emerald-800/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative p-4 sm:p-6">
          {/* 인사말 */}
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

          {/* 퀵 스탯 (간소화: 스트릭 + 오늘 기록) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-2 gap-2 sm:gap-3"
          >
            {/* 스트릭 */}
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-3 text-center border border-white/50 dark:border-slate-700/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-lg">🔥</span>
                <motion.span
                  key={streak}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white"
                >
                  {streak}
                </motion.span>
                <span className="text-sm text-slate-500">일</span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">연속 기록</p>
            </div>

            {/* 오늘 기록 - 구체적 숫자 표시 + 클릭 시 기록 페이지 이동 */}
            <Link
              href="/notes"
              className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-3 text-center border border-white/50 dark:border-slate-700/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                {todayNotes > 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <PenLine className="h-4 w-4 text-forest-500" />
                )}
                <motion.span
                  key={todayNotes}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white"
                >
                  {todayNotes}
                </motion.span>
                <span className="text-sm text-slate-500">개</span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">오늘 기록</p>
            </Link>
          </motion.div>
        </div>
      </Card>

      {/* 주간 진행률 바 (로그인 사용자만) */}
      {userName && weeklyProgress && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <WeeklyProgressBar
            days={weeklyProgress.days}
            recordedDays={weeklyProgress.recordedDays}
            totalDays={weeklyProgress.totalDays}
            streak={weeklyProgress.streak}
            streakStatus={weeklyProgress.streakStatus}
          />
        </motion.div>
      )}

      {/* 30일 활동 캘린더 (로그인 사용자만) - 타입별 색상 구분 */}
      {userName && Object.keys(dailyRecordsByType).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <ActivityCalendar dailyRecordsByType={dailyRecordsByType} />
        </motion.div>
      )}

      {/* 미니 달력 히트맵 (로그인 사용자만 - 12주 히트맵) */}
      {userName && Object.keys(dailyRecords).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <MiniCalendarHeatmap dailyRecords={dailyRecords} />
        </motion.div>
      )}

      {/* 온보딩 체크리스트 (새 사용자용 - Endowed Progress Effect) */}
      {userName && onboardingItems && onboardingItems.length > 0 && (
        <OnboardingChecklist
          items={onboardingItems}
          onDismiss={onDismissOnboarding}
        />
      )}

      {/* 계속 읽기 카드 (Primary CTA) - 최대 4개까지 2x2 그리드 표시 */}
      {userName && (
        continueReadingBooks.length > 0 ? (
          <div className={cn(
            "grid gap-2 sm:gap-3",
            continueReadingBooks.length === 1 && "grid-cols-1",
            continueReadingBooks.length >= 2 && "grid-cols-2"
          )}>
            {continueReadingBooks.map((book, index) => (
              <ContinueReadingCard
                key={book.userBookId}
                userBookId={book.userBookId}
                title={book.title}
                author={book.author}
                coverImageUrl={book.coverImageUrl}
                currentPage={book.currentPage}
                totalPages={book.totalPages}
                progressPercent={book.progressPercent}
                compact={continueReadingBooks.length > 1}
              />
            ))}
          </div>
        ) : (
          <NoReadingBookCard />
        )
      )}

      {/* 페르소나 인사이트 미니 카드 (있는 경우에만) */}
      {persona && stats && totalNotes > 0 && (
        <Link href="/persona" className="block">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="p-3 sm:p-4 hover:shadow-md transition-all active:scale-[0.99] border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* 페르소나 아이콘 */}
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

                    {/* 기록 유형 분포 미니 바 */}
                    <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {noteDistribution && totalNotes > 0 && (
                        <>
                          <motion.div
                            className="bg-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${(noteDistribution.quote / totalNotes) * 100}%` }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                          />
                          <motion.div
                            className="bg-green-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${(noteDistribution.memo / totalNotes) * 100}%` }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                          />
                          <motion.div
                            className="bg-orange-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${(noteDistribution.photo / totalNotes) * 100}%` }}
                            transition={{ duration: 0.5, delay: 0.6 }}
                          />
                          <motion.div
                            className="bg-purple-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${(noteDistribution.transcription / totalNotes) * 100}%` }}
                            transition={{ duration: 0.5, delay: 0.7 }}
                          />
                        </>
                      )}
                    </div>

                    {/* 범례 (모바일에서 숨김) */}
                    <div className="hidden sm:flex items-center gap-3 mt-1.5">
                      {noteDistribution && Object.entries(noteTypeIcons).map(([key, { label }]) => (
                        <div key={key} className="flex items-center gap-1">
                          <div className={cn("h-2 w-2 rounded-full", {
                            "bg-blue-500": key === "quote",
                            "bg-green-500": key === "memo",
                            "bg-orange-500": key === "photo",
                            "bg-purple-500": key === "transcription",
                          })} />
                          <span className="text-[10px] text-slate-500">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
              </div>
            </Card>
          </motion.div>
        </Link>
      )}
    </div>
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

          {/* 2열 퀵 스탯 스켈레톤 */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 space-y-2">
                <div className="h-6 w-12 mx-auto rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="h-3 w-16 mx-auto rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 주간 진행률 스켈레톤 */}
      <Card className="p-3 sm:p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-4 w-12 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="flex justify-between gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div className="h-3 w-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
              </div>
            ))}
          </div>
          <div className="h-4 w-32 mx-auto rounded bg-slate-200 dark:bg-slate-700 animate-pulse pt-2" />
        </div>
      </Card>

      {/* 독서 활동 히트맵 스켈레톤 (컴팩트) */}
      <Card className="px-3 py-2.5">
        <div className="flex items-center gap-3">
          <div className="shrink-0 space-y-1">
            <div className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-2.5 w-10 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
          <div className="flex-1 flex gap-[2px]">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-[2px]">
                {Array.from({ length: 7 }).map((_, j) => (
                  <div key={j} className="w-[8px] h-[8px] rounded-[2px] bg-slate-200 dark:bg-slate-700 animate-pulse" />
                ))}
              </div>
            ))}
          </div>
          <div className="shrink-0 space-y-1">
            <div className="h-3 w-10 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-2 w-14 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
        </div>
      </Card>

      {/* 계속 읽기 스켈레톤 */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-24 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-1.5 w-full rounded bg-slate-200 dark:bg-slate-700 animate-pulse mt-2" />
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0" />
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-1.5 w-full rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
        </div>
      </Card>
    </div>
  );
}
