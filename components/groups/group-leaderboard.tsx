"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  PenLine,
  Medal,
  Crown,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 리더보드 항목 타입
 * Social Comparison Theory - 동료 비교가 동기부여
 */
export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  notesThisWeek: number;
  booksCompleted: number;
  rank: number;
  trend: "up" | "down" | "same";
  isCurrentUser?: boolean;
}

interface GroupLeaderboardProps {
  entries: LeaderboardEntry[];
  groupName: string;
  totalMembers: number;
  currentUserRank?: number;
  className?: string;
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  same: Minus,
};

const trendColors = {
  up: "text-green-500",
  down: "text-red-500",
  same: "text-slate-400",
};

const rankIcons: Record<number, { icon: React.ElementType; color: string }> = {
  1: { icon: Crown, color: "text-amber-500" },
  2: { icon: Medal, color: "text-slate-400" },
  3: { icon: Medal, color: "text-amber-700" },
};

/**
 * 그룹 리더보드 컴포넌트
 * 이번 주 TOP 멤버와 활동 현황을 표시
 */
export function GroupLeaderboard({
  entries,
  groupName,
  totalMembers,
  currentUserRank,
  className,
}: GroupLeaderboardProps) {
  const topThree = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base">이번 주 활동 TOP</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            {totalMembers}명 참여
          </Badge>
        </div>
        {currentUserRank && (
          <p className="text-sm text-muted-foreground mt-1">
            당신은 <span className="font-semibold text-primary">{currentUserRank}위</span>예요!
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* TOP 3 강조 표시 */}
        <div className="space-y-2">
          {topThree.map((entry, index) => {
            const RankIcon = rankIcons[entry.rank]?.icon || Medal;
            const rankColor = rankIcons[entry.rank]?.color || "text-slate-500";
            const TrendIcon = trendIcons[entry.trend];

            return (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-all",
                  entry.isCurrentUser
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-slate-50/50 dark:bg-slate-800/50",
                  entry.rank === 1 && "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30"
                )}
              >
                {/* 순위 */}
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                  <RankIcon className={cn("h-4 w-4", rankColor)} />
                </div>

                {/* 사용자 정보 */}
                <Avatar className="h-8 w-8">
                  <AvatarImage src={entry.avatarUrl || undefined} alt={entry.name} />
                  <AvatarFallback className="text-xs">
                    {entry.name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-medium text-sm truncate",
                        entry.isCurrentUser && "text-primary"
                      )}
                    >
                      {entry.name}
                    </span>
                    {entry.isCurrentUser && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        나
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <PenLine className="h-3 w-3" />
                      {entry.notesThisWeek}개
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {entry.booksCompleted}권
                    </span>
                  </div>
                </div>

                {/* 트렌드 */}
                <TrendIcon className={cn("h-4 w-4", trendColors[entry.trend])} />
              </motion.div>
            );
          })}
        </div>

        {/* 나머지 순위 (간단한 리스트) */}
        {rest.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-1.5">
              {rest.map((entry) => {
                const TrendIcon = trendIcons[entry.trend];
                return (
                  <div
                    key={entry.userId}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded text-sm",
                      entry.isCurrentUser && "bg-primary/5"
                    )}
                  >
                    <span className="w-5 text-center text-muted-foreground text-xs">
                      {entry.rank}
                    </span>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={entry.avatarUrl || undefined} alt={entry.name} />
                      <AvatarFallback className="text-[10px]">
                        {entry.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "flex-1 truncate",
                        entry.isCurrentUser && "font-medium text-primary"
                      )}
                    >
                      {entry.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {entry.notesThisWeek}개
                    </span>
                    <TrendIcon className={cn("h-3 w-3", trendColors[entry.trend])} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 동기부여 메시지 */}
        {currentUserRank && currentUserRank > 3 && (
          <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>
              {3 - (currentUserRank - 1)}개 더 기록하면 TOP 3 진입!
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 리더보드 스켈레톤
 */
export function GroupLeaderboardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
