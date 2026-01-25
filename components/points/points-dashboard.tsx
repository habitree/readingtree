"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Star,
  Crown,
  Trophy,
  Award,
  Flame,
  TrendingUp,
  BookOpen,
  Gem,
  Sprout,
  Sparkles,
  Zap,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PointsDashboardData, PointTransaction } from "@/types/points";

// 레벨별 아이콘 매핑
const levelIcons: Record<string, React.ElementType> = {
  Sprout,
  Sparkles,
  TrendingUp,
  Flame,
  Star,
  Crown,
  Award,
  BookOpen,
  Trophy,
  Gem,
};

interface PointsDashboardProps {
  data: PointsDashboardData;
}

export function PointsDashboard({ data }: PointsDashboardProps) {
  const {
    userPoints,
    currentLevel,
    nextLevel,
    progressToNextLevel,
    recentTransactions,
    todayEarned,
    weeklyEarned,
    monthlyEarned,
  } = data;

  const LevelIcon = currentLevel?.badge_icon
    ? levelIcons[currentLevel.badge_icon] || Star
    : Star;

  return (
    <div className="space-y-4">
      {/* 포인트 요약 카드 */}
      <Card className="overflow-hidden">
        <div className="p-4 bg-gradient-to-br from-forest-500 to-emerald-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-forest-100 opacity-90">총 포인트</p>
              <motion.p
                className="text-3xl font-bold"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {(userPoints?.total_points || 0).toLocaleString()}
              </motion.p>
            </div>
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <LevelIcon className="h-7 w-7" />
            </div>
          </div>

          {/* 레벨 정보 */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-forest-100">
                Lv.{currentLevel?.level || 1} {currentLevel?.title || "새싹 독서가"}
              </span>
              {nextLevel && (
                <span className="text-forest-100">
                  Lv.{nextLevel.level}까지 {progressToNextLevel}%
                </span>
              )}
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressToNextLevel}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800">
          <StatItem
            icon={Zap}
            label="오늘"
            value={todayEarned}
            color="text-amber-500"
          />
          <StatItem
            icon={Calendar}
            label="이번 주"
            value={weeklyEarned}
            color="text-blue-500"
          />
          <StatItem
            icon={TrendingUp}
            label="이번 달"
            value={monthlyEarned}
            color="text-green-500"
          />
        </div>
      </Card>

      {/* 스트릭 정보 */}
      {userPoints && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  userPoints.current_streak > 0
                    ? "bg-orange-100 dark:bg-orange-900/30"
                    : "bg-slate-100 dark:bg-slate-800"
                )}
              >
                <Flame
                  className={cn(
                    "h-5 w-5",
                    userPoints.current_streak > 0
                      ? "text-orange-500"
                      : "text-slate-400"
                  )}
                />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  연속 스트릭
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {userPoints.current_streak}일
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                최장 기록
              </p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {userPoints.longest_streak}일
              </p>
            </div>
          </div>

          {/* 스트릭 보너스 */}
          {userPoints.streak_bonus_multiplier > 1.0 && (
            <div className="mt-3 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                <Sparkles className="inline-block h-3 w-3 mr-1" />
                레벨 보너스로 포인트 x{userPoints.streak_bonus_multiplier.toFixed(2)} 적용 중!
              </p>
            </div>
          )}
        </Card>
      )}

      {/* 최근 거래 내역 */}
      {recentTransactions.length > 0 && (
        <Card>
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              최근 활동
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTransactions.slice(0, 5).map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="p-3 text-center">
      <Icon className={cn("h-4 w-4 mx-auto mb-1", color)} />
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-lg font-bold text-slate-900 dark:text-white">
        +{value}
      </p>
    </div>
  );
}

function TransactionItem({ transaction }: { transaction: PointTransaction }) {
  const actionLabels: Record<string, string> = {
    note_create: "노트 작성",
    note_quote: "인용구 기록",
    note_memo: "메모 작성",
    note_photo: "사진 기록",
    note_transcription: "필사 기록",
    book_add: "책 추가",
    book_complete: "책 완독",
    book_progress_update: "진행률 업데이트",
    daily_first_activity: "오늘 첫 활동",
    streak_3_days: "3일 연속 달성",
    streak_7_days: "7일 연속 달성",
    streak_14_days: "14일 연속 달성",
    streak_30_days: "30일 연속 달성",
    streak_100_days: "100일 연속 달성",
    streak_365_days: "365일 연속 달성",
    mission_complete: "미션 완료",
    all_missions_complete: "모든 미션 완료",
    first_book: "첫 책 등록",
    first_note: "첫 노트 작성",
  };

  const label = actionLabels[transaction.action_type] || transaction.description || "활동";
  const date = new Date(transaction.created_at);
  const timeAgo = getTimeAgo(date);

  return (
    <div className="px-4 py-3 flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
          {label}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {timeAgo}
        </p>
      </div>
      <Badge
        variant={transaction.final_points > 0 ? "default" : "secondary"}
        className={cn(
          "shrink-0",
          transaction.final_points > 0
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
        )}
      >
        {transaction.final_points > 0 ? "+" : ""}
        {transaction.final_points}
      </Badge>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "방금 전";
  }
  if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}분 전`;
  }
  if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  }
  if (diffInSeconds < 604800) {
    return `${Math.floor(diffInSeconds / 86400)}일 전`;
  }

  return date.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

/**
 * 포인트 대시보드 스켈레톤
 */
export function PointsDashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="p-4 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-16 bg-slate-300 dark:bg-slate-600 rounded animate-pulse" />
              <div className="h-8 w-24 bg-slate-300 dark:bg-slate-600 rounded animate-pulse" />
            </div>
            <div className="w-14 h-14 rounded-full bg-slate-300 dark:bg-slate-600 animate-pulse" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <div className="h-3 w-20 bg-slate-300 dark:bg-slate-600 rounded animate-pulse" />
              <div className="h-3 w-16 bg-slate-300 dark:bg-slate-600 rounded animate-pulse" />
            </div>
            <div className="h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 text-center space-y-2">
              <div className="h-4 w-4 mx-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-3 w-10 mx-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-5 w-8 mx-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="space-y-1">
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-5 w-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
