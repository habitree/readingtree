"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ChevronRight,
  Quote,
  Camera,
  FileText,
  PenTool,
  TrendingUp,
  Target,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserPersona } from "@/types/persona";
import type { ReadingStats } from "@/types/persona";
import { useStyle } from "@/hooks/use-style";

interface HomeHeroSectionProps {
  userName?: string | null;
  persona: UserPersona | null;
  streak?: number; // 연속 기록 일수
  todayGoalProgress?: number; // 오늘 목표 달성률 (0-100)
  weeklyNotes?: number; // 이번 주 기록 수
}

/**
 * 홈 히어로 섹션 - 개인화된 인사 + 페르소나 인사이트
 */
export function HomeHeroSection({
  userName,
  persona,
  streak = 0,
  todayGoalProgress = 0,
  weeklyNotes = 0,
}: HomeHeroSectionProps) {
  const [mounted, setMounted] = useState(false);
  const { greeting, getStreakMessage, getMotivationalMessage } = useStyle();
  const stats = persona?.reading_stats as ReadingStats | null;

  useEffect(() => {
    setMounted(true);
  }, []);

  // 서버 사이드에서는 기본 인사말
  const displayGreeting = mounted ? greeting : { text: "안녕하세요", emoji: "" };

  // 동기부여 메시지 생성
  const getContextualMessage = () => {
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
          <div className="mb-4">
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
          </div>

          {/* 퀵 스탯 (스트릭, 목표, 기록) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {/* 연속 기록 */}
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-3 text-center border border-white/50 dark:border-slate-700/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame className={cn("h-4 w-4", streak > 0 ? "text-orange-500" : "text-slate-400")} />
                <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {streak}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">연속 기록</p>
            </div>

            {/* 오늘 목표 */}
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-3 text-center border border-white/50 dark:border-slate-700/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className={cn("h-4 w-4", todayGoalProgress >= 100 ? "text-green-500" : "text-forest-500")} />
                <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {Math.round(todayGoalProgress)}%
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">오늘 목표</p>
            </div>

            {/* 이번 주 기록 */}
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-3 text-center border border-white/50 dark:border-slate-700/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {weeklyNotes}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">이번 주</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 페르소나 인사이트 미니 카드 (있는 경우에만) */}
      {persona && stats && totalNotes > 0 && (
        <Link href="/persona" className="block">
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
                        <div
                          className="bg-blue-500 transition-all"
                          style={{ width: `${(noteDistribution.quote / totalNotes) * 100}%` }}
                        />
                        <div
                          className="bg-green-500 transition-all"
                          style={{ width: `${(noteDistribution.memo / totalNotes) * 100}%` }}
                        />
                        <div
                          className="bg-orange-500 transition-all"
                          style={{ width: `${(noteDistribution.photo / totalNotes) * 100}%` }}
                        />
                        <div
                          className="bg-purple-500 transition-all"
                          style={{ width: `${(noteDistribution.transcription / totalNotes) * 100}%` }}
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
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="p-4 sm:p-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-6 w-48 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </div>
            <div className="h-4 w-56 rounded bg-slate-200 dark:bg-slate-700 animate-pulse ml-9" />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 space-y-2">
                <div className="h-6 w-12 mx-auto rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="h-3 w-16 mx-auto rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              </div>
            ))}
          </div>
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
