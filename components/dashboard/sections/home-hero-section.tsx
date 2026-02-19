"use client";

import { useEffect, useState, useMemo, memo } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Flame,
  Target,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserPersona } from "@/types/persona";
import type { ReadingStats } from "@/types/persona";
import { useStyle } from "@/hooks/use-style";
import { useTranslation } from "@/lib/i18n";
import { ContinueReadingCard, NoReadingBookCard } from "./continue-reading-card";
import { OnboardingChecklist, type OnboardingItem } from "@/components/onboarding/onboarding-checklist";
import { FirstNotePrompt } from "@/components/onboarding/first-note-prompt";
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
  /** 사용자 나무 레벨 (1~10) */
  userLevel?: number;
  /** 나무 레벨 이름 (예: "씨앗", "새싹") */
  levelTitle?: string;
  /** 총 포인트 */
  totalPoints?: number;
  /** 게스트 모드 (샘플 데이터 표시) */
  isGuest?: boolean;
  /** 첫 기록 작성 여부 (false이면 CTA 표시) */
  hasFirstNote?: boolean;
}

/**
 * 홈 히어로 섹션 - "오늘의 할 일" 중심 설계
 * Primary Zone: 오늘의 할 일 CTA + 인사말 + 나무 + 이어읽기
 */
export const HomeHeroSection = memo(function HomeHeroSection({
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
  userLevel = 1,
  levelTitle,
  totalPoints = 0,
  isGuest = false,
  hasFirstNote = true,
}: HomeHeroSectionProps) {
  const [mounted, setMounted] = useState(false);
  const { greeting, getStreakMessage, getMotivationalMessage } = useStyle();
  const { t } = useTranslation();
  const stats = persona?.reading_stats as ReadingStats | null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayGreeting = mounted ? greeting : { text: t("auth.welcome"), emoji: "" };

  // 시간대별 메시지 (useMemo로 캐싱)
  const timeBasedCue = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 9) {
      return t("dashboard.timeCueEarlyMorning");
    } else if (hour >= 9 && hour < 12) {
      return t("dashboard.timeCueMorning");
    } else if (hour >= 12 && hour < 14) {
      return t("dashboard.timeCueNoon");
    } else if (hour >= 14 && hour < 18) {
      return t("dashboard.timeCueAfternoon");
    } else if (hour >= 18 && hour < 21) {
      return t("dashboard.timeCueEvening");
    } else {
      return t("dashboard.timeCueNight");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 컴포넌트 마운트 시 한 번만 계산

  // 컨텍스트 기반 메시지 (useMemo로 캐싱)
  const motivationalMessage = useMemo(() => {
    if (!mounted) return t("dashboard.defaultMotivational");

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
    quote: { icon: Quote, label: t("notes.typeQuote"), color: "text-blue-500" },
    memo: { icon: FileText, label: t("notes.typeMemo"), color: "text-green-500" },
    photo: { icon: Camera, label: t("notes.typePhoto"), color: "text-orange-500" },
    transcription: { icon: PenTool, label: t("notes.typeTranscription"), color: "text-purple-500" },
  };

  // 나무 이미지 레벨
  const safeLevel = Math.max(1, Math.min(10, userLevel));

  // 오늘의 할 일 결정
  const todayAction = useMemo(() => {
    if (!userName || isGuest) return null;
    if (!hasFirstNote && continueReadingBooks.length === 0) {
      return { type: "first" as const, label: t("dashboard.todayMissionFirst"), href: "/books/search" };
    }
    if (todayNotes === 0 && continueReadingBooks.length > 0) {
      return { type: "read" as const, label: t("dashboard.todayMissionRead"), href: `/books/${continueReadingBooks[0].userBookId}` };
    }
    if (todayNotes === 0) {
      return { type: "note" as const, label: t("dashboard.todayMissionNote"), href: "/notes/new" };
    }
    return { type: "done" as const, label: t("dashboard.todayMissionDone"), href: "" };
  }, [userName, isGuest, hasFirstNote, todayNotes, continueReadingBooks, t]);

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* ======== 오늘의 할 일 (최우선 CTA — 로그인 유저만) ======== */}
      {todayAction && todayAction.type !== "done" && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Link href={todayAction.href}>
            <Card className="p-3 sm:p-4 border-forest-200/60 dark:border-forest-700/40 bg-gradient-to-r from-forest-50 to-emerald-50 dark:from-forest-950/50 dark:to-emerald-950/30 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-forest-500 text-white shadow-sm shrink-0">
                  <Target className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs font-semibold text-forest-600 dark:text-forest-400">{t("dashboard.todayMission")}</p>
                  <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">{todayAction.label}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-forest-400 shrink-0" />
              </div>
            </Card>
          </Link>
        </motion.div>
      )}

      {/* ======== 오늘의 기록 완료 상태 ======== */}
      {todayAction?.type === "done" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <Card className="p-3 sm:p-4 border-forest-200/60 dark:border-forest-700/40 bg-gradient-to-r from-forest-50/50 to-emerald-50/50 dark:from-forest-950/30 dark:to-emerald-950/20">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-forest-100 dark:bg-forest-900/50 shrink-0">
                <CheckCircle2 className="h-5 w-5 text-forest-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-forest-700 dark:text-forest-300">{todayAction.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{todayNotes}{t("common.count")} {t("dashboard.todayNotes")}</p>
              </div>
              <Flame className={cn("h-5 w-5 shrink-0", streak > 0 ? "text-orange-500" : "text-slate-300")} />
              {streak > 0 && <span className="text-sm font-bold text-orange-500">{streak}</span>}
            </div>
          </Card>
        </motion.div>
      )}

      {/* ======== PRIMARY ZONE: 히어로 카드 ======== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#eafdf5] to-[#f4fbf8] dark:from-forest-950/40 dark:to-slate-900 border border-forest-200/40 dark:border-forest-800/30 shadow-sm">
          {/* 장식 배경 원 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-forest-500/5 dark:bg-forest-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-400/10 dark:bg-amber-400/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start justify-between gap-3">
              {/* 좌측: 인사말 + 레벨 뱃지 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                  {displayGreeting.emoji && (
                    <span className="text-xl sm:text-2xl">{displayGreeting.emoji}</span>
                  )}
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
                    {displayGreeting.text}
                    {userName && <span className="text-forest-700 dark:text-forest-400">, {userName}</span>}
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-3">
                  {motivationalMessage}
                </p>

                {/* 레벨 뱃지 + 기록 버튼 */}
                <div className="flex items-center gap-2 flex-wrap">
                  {levelTitle && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/70 dark:bg-white/10 rounded-full shadow-sm border border-forest-200/40 dark:border-forest-700/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-forest-500 animate-pulse" />
                      <span className="text-[10px] sm:text-xs font-semibold text-forest-700 dark:text-forest-300">
                        Lv.{safeLevel} {levelTitle}
                      </span>
                    </div>
                  )}
                  <Link
                    href="/notes/new"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-forest-600 hover:bg-forest-700 text-white rounded-full shadow-sm text-[10px] sm:text-xs font-semibold transition-colors"
                  >
                    <PenTool className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    {t("notes.writeNoteHeroCta")}
                  </Link>
                </div>
              </div>

              {/* 우측: 나무 이미지 + 포인트 */}
              <div className="flex flex-col items-center shrink-0 gap-1">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28">
                  <Image
                    src={`/images/trees/level-${safeLevel}.webp`}
                    alt={`ReadingTree Lv.${safeLevel}`}
                    fill
                    className="object-contain drop-shadow-md"
                    priority
                  />
                </div>
                <div className="text-center">
                  <span className="text-[10px] sm:text-xs font-bold text-forest-700 dark:text-forest-300">
                    {totalPoints.toLocaleString()}P
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ======== 첫 기록 CTA (기록이 없는 유저에게만 표시) ======== */}
      {userName && !isGuest && !hasFirstNote && <FirstNotePrompt />}

      {/* ======== 계속 읽기 (이어읽기 카드 — 인라인 진행률 포함) ======== */}
      {(userName || (isGuest && continueReadingBooks.length > 0)) && (
        <div className="space-y-2 sm:space-y-3">
          {continueReadingBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-3">
              {continueReadingBooks.slice(0, 6).map((book, index) => (
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
                  priority={index === 0}
                />
              ))}
            </div>
          ) : (
            <NoReadingBookCard />
          )}
        </div>
      )}

      {/* ======== 통계 카드 2개: 연속 기록 + 오늘의 기록 ======== */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {/* 연속 기록 */}
        <Card className="p-3 sm:p-4 border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">{t("dashboard.streak")}</span>
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{streak}</span>
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">{t("common.day")}</span>
          </div>
          {weeklyProgress && (
            <div className="flex items-end gap-0.5 h-4 opacity-60">
              {weeklyProgress.days.map((day) => (
                <div
                  key={day.date}
                  className={cn(
                    "flex-1 rounded-t-sm",
                    day.hasRecord
                      ? "bg-orange-400 dark:bg-orange-400 h-full"
                      : day.isFuture
                        ? "bg-orange-100 dark:bg-orange-900/30 h-1/4"
                        : "bg-orange-200 dark:bg-orange-800/40 h-2/5"
                  )}
                />
              ))}
            </div>
          )}
        </Card>

        {/* 오늘의 기록 */}
        <Link href="/notes">
          <Card className="p-3 sm:p-4 border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow duration-200 h-full">
            <div className="flex items-center gap-1.5 mb-1.5">
              {todayNotes > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-forest-500" />
              ) : (
                <PenLine className="h-4 w-4 text-forest-500" />
              )}
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">{t("dashboard.todayNotes")}</span>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{todayNotes}</span>
              <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">{t("common.count")}</span>
            </div>
            {weeklyProgress && (
              <div className="flex items-end gap-0.5 h-4 opacity-60">
                {weeklyProgress.days.map((day) => (
                  <div
                    key={day.date}
                    className={cn(
                      "flex-1 rounded-t-sm",
                      day.hasRecord
                        ? "bg-forest-400 dark:bg-forest-400"
                        : "bg-forest-100 dark:bg-forest-900/30",
                      day.hasRecord
                        ? day.count >= 3 ? "h-full" : day.count >= 1 ? "h-3/5" : "h-2/5"
                        : "h-1/4"
                    )}
                  />
                ))}
              </div>
            )}
          </Card>
        </Link>
      </div>

      {/* ======== 주간 진행 (나뭇잎 버전) ======== */}
      {userName && weeklyProgress && (
        <Card className="px-4 py-3 sm:px-5 sm:py-4 border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-slate-900 dark:text-white">{t("dashboard.weeklyAchievement")}</span>
            <span className="text-[10px] sm:text-xs font-medium text-forest-600 dark:text-forest-400 bg-forest-50 dark:bg-forest-900/30 px-2 py-0.5 rounded-md">
              {weeklyProgress.recordedDays}/{weeklyProgress.totalDays}{t("common.day")}
            </span>
          </div>
          <div className="flex justify-between items-center">
            {weeklyProgress.days.map((day) => (
              <div
                key={day.date}
                className="flex flex-col items-center gap-1.5 flex-1"
              >
                <span
                  className={cn(
                    "text-[9px] sm:text-[10px] font-bold uppercase",
                    day.isToday
                      ? "text-forest-600 dark:text-forest-400"
                      : "text-slate-400 dark:text-slate-500"
                  )}
                >
                  {day.dayLabel}
                </span>
                <LeafDayIndicator
                  hasRecord={day.hasRecord}
                  isToday={day.isToday}
                  isFuture={day.isFuture}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 온보딩 체크리스트 (새 사용자용) */}
      {userName && onboardingItems && onboardingItems.length > 0 && (
        <OnboardingChecklist
          items={onboardingItems}
          onDismiss={onDismissOnboarding}
        />
      )}
    </div>
  );
});

/**
 * 나뭇잎 요일 지표 컴포넌트
 * hasRecord → forest-500 나뭇잎 / isToday (no record) → forest-400 테두리 나뭇잎
 * past no record → slate-200 작은 나뭇잎 / future → slate-200 작은 원
 */
interface LeafDayIndicatorProps {
  hasRecord: boolean;
  isToday: boolean;
  isFuture: boolean;
}

function LeafDayIndicator({ hasRecord, isToday, isFuture }: LeafDayIndicatorProps) {
  if (isFuture) {
    return (
      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-600">
        <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600 opacity-50" />
      </div>
    );
  }

  if (hasRecord) {
    return (
      <div className="h-8 w-8 rounded-full bg-forest-500 dark:bg-forest-500 flex items-center justify-center shadow-sm">
        <Check className="h-4 w-4 text-white" strokeWidth={3} />
      </div>
    );
  }

  if (isToday) {
    return (
      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center border-2 border-dashed border-forest-400 dark:border-forest-500">
        <div className="h-2 w-2 rounded-full bg-forest-400 dark:bg-forest-500" />
      </div>
    );
  }

  return (
    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-600">
      <div className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
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

  const { t: tPersona } = useTranslation();
  const noteTypeIcons: Record<string, { label: string }> = {
    quote: { label: tPersona("notes.typeQuote") },
    memo: { label: tPersona("notes.typeMemo") },
    photo: { label: tPersona("notes.typePhoto") },
    transcription: { label: tPersona("notes.typeTranscription") },
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
                  {tPersona("dashboard.noteStyle")}
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
    <div className="space-y-2 sm:space-y-3">
      {/* 히어로 카드 스켈레톤 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#eafdf5] to-[#f4fbf8] dark:from-forest-950/40 dark:to-slate-900 border border-forest-200/40 dark:border-forest-800/30">
        <div className="px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-3">
              <div className="space-y-2">
                <div className="h-6 w-48 rounded bg-forest-200/40 dark:bg-forest-700/30 animate-pulse" />
                <div className="h-4 w-40 rounded bg-forest-200/30 dark:bg-forest-700/20 animate-pulse" />
              </div>
              <div className="h-6 w-24 rounded-full bg-white/50 dark:bg-white/10 animate-pulse" />
            </div>
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg bg-forest-200/30 dark:bg-forest-700/20 animate-pulse shrink-0" />
          </div>
        </div>
      </div>

      {/* 2열 통계 카드 스켈레톤 */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="p-3 sm:p-4 border-slate-200/60 dark:border-slate-800/60">
            <div className="space-y-2">
              <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-6 w-12 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="flex items-end gap-0.5 h-4">
                {Array.from({ length: 7 }).map((_, j) => (
                  <div key={j} className="flex-1 h-2 rounded-t-sm bg-slate-200 dark:bg-slate-700 animate-pulse" />
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 주간 달성 스켈레톤 */}
      <Card className="px-4 py-3 sm:px-5 sm:py-4 border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-4 w-12 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>
        <div className="flex justify-between items-center">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
              <div className="h-2.5 w-3 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </div>
          ))}
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
