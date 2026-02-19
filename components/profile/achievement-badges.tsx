"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/lib/i18n";
import {
  Award,
  BookOpen,
  Flame,
  Users,
  PenLine,
  Calendar,
  Star,
  Trophy,
  Lock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/**
 * 업적 티어 타입
 */
export type AchievementTier = "bronze" | "silver" | "gold" | "platinum";

/**
 * 업적 배지 정의
 * Collection Mechanics - 수집 욕구가 목표 지향 행동 강화
 */
export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  tier: AchievementTier;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  progress?: {
    current: number;
    target: number;
  };
}

/**
 * 기본 업적 배지 목록
 */
export const ACHIEVEMENT_BADGES: Omit<AchievementBadge, "earned" | "earnedAt" | "progress">[] = [
  {
    id: "first_week",
    title: "첫 발자국",
    description: "7일 연속 기록",
    tier: "bronze",
    icon: "calendar",
  },
  {
    id: "book_worm",
    title: "책벌레",
    description: "10권 완독",
    tier: "silver",
    icon: "book",
  },
  {
    id: "social_butterfly",
    title: "소셜 나비",
    description: "3개 모임 활동",
    tier: "gold",
    icon: "users",
  },
  {
    id: "note_master",
    title: "기록의 달인",
    description: "100개 기록",
    tier: "platinum",
    icon: "pen",
  },
  {
    id: "streak_champion",
    title: "꾸준함의 왕",
    description: "30일 연속 기록",
    tier: "gold",
    icon: "flame",
  },
  {
    id: "early_bird",
    title: "아침 독서인",
    description: "아침 6~9시 10회 기록",
    tier: "bronze",
    icon: "star",
  },
];

const tierStyles: Record<AchievementTier, {
  bg: string;
  border: string;
  text: string;
  gradient: string;
}> = {
  bronze: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    border: "border-amber-300 dark:border-amber-700",
    text: "text-amber-700 dark:text-amber-300",
    gradient: "from-amber-200 to-amber-400",
  },
  silver: {
    bg: "bg-slate-100 dark:bg-slate-800/50",
    border: "border-slate-300 dark:border-slate-600",
    text: "text-slate-600 dark:text-slate-300",
    gradient: "from-slate-200 to-slate-400",
  },
  gold: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    border: "border-yellow-400 dark:border-yellow-600",
    text: "text-yellow-700 dark:text-yellow-300",
    gradient: "from-yellow-300 to-amber-500",
  },
  platinum: {
    bg: "bg-violet-100 dark:bg-violet-900/30",
    border: "border-violet-300 dark:border-violet-600",
    text: "text-violet-700 dark:text-violet-300",
    gradient: "from-violet-300 to-purple-500",
  },
};

const iconMap: Record<string, LucideIcon> = {
  calendar: Calendar,
  book: BookOpen,
  users: Users,
  pen: PenLine,
  flame: Flame,
  star: Star,
  trophy: Trophy,
  award: Award,
};

interface AchievementBadgesProps {
  badges: AchievementBadge[];
  className?: string;
}

// 배지 ID -> 번역 키 매핑
const BADGE_TITLE_KEYS: Record<string, string> = {
  first_week: "achievementBadges.firstStep",
  book_worm: "achievementBadges.bookworm",
  social_butterfly: "achievementBadges.socialButterfly",
  note_master: "achievementBadges.noteMaster",
  streak_champion: "achievementBadges.streakChampion",
  early_bird: "achievementBadges.earlyBird",
};

const BADGE_DESC_KEYS: Record<string, string> = {
  first_week: "achievementBadges.firstStepDesc",
  book_worm: "achievementBadges.bookwormDesc",
  social_butterfly: "achievementBadges.socialButterflyDesc",
  note_master: "achievementBadges.noteMasterDesc",
  streak_champion: "achievementBadges.streakChampionDesc",
  early_bird: "achievementBadges.earlyBirdDesc",
};

/**
 * 프로필 업적 배지 컴포넌트
 */
export function AchievementBadges({ badges, className }: AchievementBadgesProps) {
  const { t } = useTranslation();
  const earnedBadges = badges.filter((b) => b.earned);
  const lockedBadges = badges.filter((b) => !b.earned);
  const nextToEarn = lockedBadges.find((b) => b.progress && b.progress.current > 0);

  const getBadgeTitle = (badge: AchievementBadge) =>
    BADGE_TITLE_KEYS[badge.id] ? t(BADGE_TITLE_KEYS[badge.id] as any) : badge.title;
  const getBadgeDesc = (badge: AchievementBadge) =>
    BADGE_DESC_KEYS[badge.id] ? t(BADGE_DESC_KEYS[badge.id] as any) : badge.description;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base">{t("achievementBadges.title")}</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            {t("achievementBadges.earnedCount", { earned: earnedBadges.length, total: badges.length })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 획득한 배지 */}
        {earnedBadges.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">{t("achievementBadges.earnedBadges")}</h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {earnedBadges.map((badge, index) => {
                const Icon = iconMap[badge.icon] || Award;
                const style = tierStyles[badge.tier];

                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div
                      className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center border-2 shadow-sm",
                        style.bg,
                        style.border
                      )}
                    >
                      <Icon className={cn("h-6 w-6", style.text)} />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium truncate max-w-[70px]">
                        {getBadgeTitle(badge)}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] px-1 py-0 mt-0.5", style.text, style.border)}
                      >
                        {badge.tier}
                      </Badge>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* 다음 달성 가능 배지 */}
        {nextToEarn && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              {t("achievementBadges.soonAchievable")}
            </h4>
            <div className={cn(
              "p-3 rounded-lg border-2 border-dashed",
              tierStyles[nextToEarn.tier].border,
              tierStyles[nextToEarn.tier].bg
            )}>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    `bg-gradient-to-br ${tierStyles[nextToEarn.tier].gradient}`
                  )}
                >
                  {(() => {
                    const Icon = iconMap[nextToEarn.icon] || Award;
                    return <Icon className="h-5 w-5 text-white" />;
                  })()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{getBadgeTitle(nextToEarn as AchievementBadge)}</p>
                  <p className="text-xs text-muted-foreground">{getBadgeDesc(nextToEarn as AchievementBadge)}</p>
                  {nextToEarn.progress && (
                    <div className="mt-2 space-y-1">
                      <Progress
                        value={(nextToEarn.progress.current / nextToEarn.progress.target) * 100}
                        className="h-1.5"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        {nextToEarn.progress.current} / {nextToEarn.progress.target}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 잠긴 배지 */}
        {lockedBadges.filter((b) => b !== nextToEarn).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">{t("achievementBadges.inChallenge")}</h4>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {lockedBadges
                .filter((b) => b !== nextToEarn)
                .map((badge) => {
                  const style = tierStyles[badge.tier];

                  return (
                    <div
                      key={badge.id}
                      className="flex flex-col items-center gap-1 opacity-50"
                      title={`${getBadgeTitle(badge)}: ${getBadgeDesc(badge)}`}
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center border-2 border-dashed",
                          "bg-slate-100 dark:bg-slate-800",
                          "border-slate-300 dark:border-slate-600"
                        )}
                      >
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[50px]">
                        {getBadgeTitle(badge)}
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 업적 배지 스켈레톤
 */
export function AchievementBadgesSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
