"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Medal,
  Crown,
  Flame,
  BookOpen,
  PenLine,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  Minus,
  User,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardMember {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string | null;
  notesCount: number;
  booksCount: number;
  streak: number;
  /** 순위 변동 (양수: 상승, 음수: 하락, 0: 유지) */
  rankChange?: number;
  /** 지난 주 대비 활동 증가율 */
  activityGrowth?: number;
}

interface WeeklyLeaderboardProps {
  members: LeaderboardMember[];
  currentUserId?: string;
  /** 주간/월간 전환 */
  showPeriodToggle?: boolean;
  /** 컴팩트 모드 */
  compact?: boolean;
  className?: string;
}

type Period = "weekly" | "monthly";
type SortBy = "notes" | "books" | "streak";

// 순위별 스타일
const RANK_STYLES = {
  1: {
    icon: Crown,
    color: "text-amber-500",
    bgColor: "bg-gradient-to-br from-amber-100 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    badgeClass: "bg-gradient-to-r from-amber-400 to-yellow-500 text-white",
  },
  2: {
    icon: Medal,
    color: "text-slate-400",
    bgColor: "bg-gradient-to-br from-slate-100 to-gray-50 dark:from-slate-900/50 dark:to-gray-950/30",
    borderColor: "border-slate-200 dark:border-slate-700",
    badgeClass: "bg-gradient-to-r from-slate-400 to-gray-500 text-white",
  },
  3: {
    icon: Medal,
    color: "text-orange-400",
    bgColor: "bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/30",
    borderColor: "border-orange-200 dark:border-orange-800",
    badgeClass: "bg-gradient-to-r from-orange-400 to-amber-500 text-white",
  },
} as const;

/**
 * 주간/월간 리더보드 컴포넌트
 *
 * 심리학적 효과:
 * - 긍정적 경쟁: 순위를 통한 동기 부여
 * - 사회적 증거: 다른 멤버들의 활동 확인
 * - 성취감: 순위 상승 시 즉각적 피드백
 */
export function WeeklyLeaderboard({
  members,
  currentUserId,
  showPeriodToggle = false,
  compact = false,
  className,
}: WeeklyLeaderboardProps) {
  const [period, setPeriod] = useState<Period>("weekly");
  const [sortBy, setSortBy] = useState<SortBy>("notes");

  // 정렬된 멤버 목록
  const sortedMembers = [...members].sort((a, b) => {
    switch (sortBy) {
      case "notes":
        return b.notesCount - a.notesCount;
      case "books":
        return b.booksCount - a.booksCount;
      case "streak":
        return b.streak - a.streak;
      default:
        return 0;
    }
  });

  // 현재 사용자의 순위
  const currentUserRank = currentUserId
    ? sortedMembers.findIndex((m) => m.userId === currentUserId) + 1
    : null;

  if (compact) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            이번 주 활동 순위
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {sortedMembers.slice(0, 5).map((member, index) => (
              <CompactLeaderboardRow
                key={member.id}
                member={member}
                rank={index + 1}
                isCurrentUser={member.userId === currentUserId}
              />
            ))}
          </div>
          {currentUserRank && currentUserRank > 5 && (
            <div className="p-3 bg-primary/5 border-t">
              <p className="text-xs text-center text-muted-foreground">
                나의 순위: <span className="font-bold">{currentUserRank}위</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            {period === "weekly" ? "이번 주" : "이번 달"} 리더보드
          </CardTitle>
          {showPeriodToggle && (
            <Tabs
              value={period}
              onValueChange={(v) => setPeriod(v as Period)}
              className="h-8"
            >
              <TabsList className="h-7">
                <TabsTrigger value="weekly" className="text-xs h-6 px-2">
                  주간
                </TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs h-6 px-2">
                  월간
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        {/* 정렬 기준 */}
        <div className="flex gap-2 mt-2">
          <SortButton
            active={sortBy === "notes"}
            onClick={() => setSortBy("notes")}
            icon={PenLine}
            label="기록"
          />
          <SortButton
            active={sortBy === "books"}
            onClick={() => setSortBy("books")}
            icon={BookOpen}
            label="독서"
          />
          <SortButton
            active={sortBy === "streak"}
            onClick={() => setSortBy("streak")}
            icon={Flame}
            label="연속"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* 상위 3명 */}
        <div className="p-4 space-y-2">
          <AnimatePresence mode="popLayout">
            {sortedMembers.slice(0, 3).map((member, index) => (
              <motion.div
                key={member.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <TopLeaderboardRow
                  member={member}
                  rank={index + 1}
                  sortBy={sortBy}
                  isCurrentUser={member.userId === currentUserId}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* 4위 이하 */}
        {sortedMembers.length > 3 && (
          <div className="border-t divide-y">
            {sortedMembers.slice(3, 10).map((member, index) => (
              <LeaderboardRow
                key={member.id}
                member={member}
                rank={index + 4}
                sortBy={sortBy}
                isCurrentUser={member.userId === currentUserId}
              />
            ))}
          </div>
        )}

        {/* 현재 사용자가 10위 밖인 경우 */}
        {currentUserRank && currentUserRank > 10 && (
          <div className="p-4 bg-primary/5 border-t">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">나의 순위:</span>
              <Badge variant="secondary" className="font-bold">
                {currentUserRank}위
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SortButtonProps {
  active: boolean;
  onClick: () => void;
  icon: typeof PenLine;
  label: string;
}

function SortButton({ active, onClick, icon: Icon, label }: SortButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

interface LeaderboardRowProps {
  member: LeaderboardMember;
  rank: number;
  sortBy: SortBy;
  isCurrentUser?: boolean;
}

function TopLeaderboardRow({ member, rank, sortBy, isCurrentUser }: LeaderboardRowProps) {
  const style = RANK_STYLES[rank as keyof typeof RANK_STYLES];
  const Icon = style?.icon || Medal;
  const value =
    sortBy === "notes"
      ? member.notesCount
      : sortBy === "books"
      ? member.booksCount
      : member.streak;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border",
        style?.bgColor,
        style?.borderColor,
        isCurrentUser && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {/* 순위 */}
      <div className="w-8 h-8 flex items-center justify-center">
        <Icon className={cn("h-6 w-6", style?.color)} />
      </div>

      {/* 아바타 + 이름 */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
          <AvatarImage src={member.avatarUrl || undefined} />
          <AvatarFallback>
            {member.name?.charAt(0) || <User className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">
            {member.name}
            {isCurrentUser && (
              <span className="text-primary text-xs ml-1">(나)</span>
            )}
          </p>
          {member.rankChange !== undefined && member.rankChange !== 0 && (
            <RankChangeIndicator change={member.rankChange} />
          )}
        </div>
      </div>

      {/* 수치 */}
      <div className="text-right">
        <div className={cn("text-lg font-bold", style?.color)}>{value}</div>
        <div className="text-[10px] text-muted-foreground">
          {sortBy === "notes" ? "기록" : sortBy === "books" ? "권" : "일"}
        </div>
      </div>
    </div>
  );
}

function LeaderboardRow({ member, rank, sortBy, isCurrentUser }: LeaderboardRowProps) {
  const value =
    sortBy === "notes"
      ? member.notesCount
      : sortBy === "books"
      ? member.booksCount
      : member.streak;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors",
        isCurrentUser && "bg-primary/5"
      )}
    >
      {/* 순위 */}
      <div className="w-6 text-center">
        <span className="text-sm font-medium text-muted-foreground">{rank}</span>
      </div>

      {/* 아바타 + 이름 */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Avatar className="h-8 w-8">
          <AvatarImage src={member.avatarUrl || undefined} />
          <AvatarFallback>
            {member.name?.charAt(0) || <User className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm truncate">
          {member.name}
          {isCurrentUser && (
            <span className="text-primary text-xs ml-1">(나)</span>
          )}
        </span>
      </div>

      {/* 순위 변동 */}
      {member.rankChange !== undefined && (
        <RankChangeIndicator change={member.rankChange} />
      )}

      {/* 수치 */}
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function CompactLeaderboardRow({
  member,
  rank,
  isCurrentUser,
}: {
  member: LeaderboardMember;
  rank: number;
  isCurrentUser?: boolean;
}) {
  const style = RANK_STYLES[rank as keyof typeof RANK_STYLES];
  const Icon = rank <= 3 ? style?.icon || Medal : null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2.5",
        isCurrentUser && "bg-primary/5"
      )}
    >
      {/* 순위 */}
      <div className="w-6 text-center">
        {Icon ? (
          <Icon className={cn("h-4 w-4 mx-auto", style?.color)} />
        ) : (
          <span className="text-xs text-muted-foreground">{rank}</span>
        )}
      </div>

      {/* 아바타 + 이름 */}
      <Avatar className="h-6 w-6">
        <AvatarImage src={member.avatarUrl || undefined} />
        <AvatarFallback className="text-[10px]">
          {member.name?.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <span className="flex-1 text-xs truncate">
        {member.name}
        {isCurrentUser && <span className="text-primary ml-1">(나)</span>}
      </span>

      {/* 기록 수 */}
      <span className="text-xs font-medium">{member.notesCount}</span>
    </div>
  );
}

function RankChangeIndicator({ change }: { change: number }) {
  if (change === 0) {
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  }

  if (change > 0) {
    return (
      <div className="flex items-center text-emerald-500">
        <ChevronUp className="h-3 w-3" />
        <span className="text-[10px] font-medium">{change}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center text-rose-500">
      <ChevronDown className="h-3 w-3" />
      <span className="text-[10px] font-medium">{Math.abs(change)}</span>
    </div>
  );
}
