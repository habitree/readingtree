"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  CheckCircle2,
  BookOpen,
  PenLine,
  TrendingUp,
  Award,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ProgressItem {
  id: string;
  label: string;
  current: number;
  target: number;
  icon: typeof Target;
  color: string;
  bgColor: string;
  href?: string;
}

interface ProgressTrackerProps {
  /** 주간 목표 (기본값: 5) */
  weeklyGoal?: number;
  /** 월간 목표 (기본값: 20) */
  monthlyGoal?: number;
  /** 이번 주 기록 수 */
  weeklyNotes: number;
  /** 이번 달 기록 수 */
  monthlyNotes: number;
  /** 이번 주 읽은 책 수 */
  weeklyBooks?: number;
  /** 이번 달 완독 책 수 */
  monthlyCompletedBooks?: number;
  /** 컴팩트 모드 */
  compact?: boolean;
  className?: string;
}

/**
 * 진행률 추적 컴포넌트
 *
 * 심리학적 효과:
 * - 목표 기울기 효과 (Goal-Gradient Effect): 목표에 가까워질수록 동기 부여 상승
 * - 시각적 피드백: 진행 상황을 직관적으로 확인
 * - 성취감: 목표 달성 시 축하 효과
 */
export function ProgressTracker({
  weeklyGoal = 5,
  monthlyGoal = 20,
  weeklyNotes,
  monthlyNotes,
  weeklyBooks = 0,
  monthlyCompletedBooks = 0,
  compact = false,
  className,
}: ProgressTrackerProps) {
  const [animate, setAnimate] = useState(false);

  // 마운트 후 애니메이션 시작
  useEffect(() => {
    setAnimate(true);
  }, []);

  // 진행률 계산 (100% 초과 방지)
  const weeklyProgress = Math.min((weeklyNotes / weeklyGoal) * 100, 100);
  const monthlyProgress = Math.min((monthlyNotes / monthlyGoal) * 100, 100);

  // 목표 달성 여부
  const weeklyCompleted = weeklyNotes >= weeklyGoal;
  const monthlyCompleted = monthlyNotes >= monthlyGoal;

  // 진행률 항목
  const progressItems: ProgressItem[] = [
    {
      id: "weekly",
      label: "이번 주",
      current: weeklyNotes,
      target: weeklyGoal,
      icon: weeklyCompleted ? CheckCircle2 : Target,
      color: weeklyCompleted ? "text-emerald-500" : "text-blue-500",
      bgColor: weeklyCompleted ? "bg-emerald-500" : "bg-blue-500",
      href: "/notes",
    },
    {
      id: "monthly",
      label: "이번 달",
      current: monthlyNotes,
      target: monthlyGoal,
      icon: monthlyCompleted ? CheckCircle2 : TrendingUp,
      color: monthlyCompleted ? "text-emerald-500" : "text-violet-500",
      bgColor: monthlyCompleted ? "bg-emerald-500" : "bg-violet-500",
      href: "/notes",
    },
  ];

  if (compact) {
    return (
      <div className={cn("grid grid-cols-2 gap-2", className)}>
        {progressItems.map((item) => (
          <CompactProgressCard key={item.id} item={item} animate={animate} />
        ))}
      </div>
    );
  }

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          목표 달성 현황
        </h3>
        <Link
          href="/notes"
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
        >
          자세히
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-4">
        {progressItems.map((item, index) => (
          <ProgressCard
            key={item.id}
            item={item}
            animate={animate}
            delay={index * 0.1}
          />
        ))}

        {/* 추가 통계 */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-amber-500">
              <BookOpen className="h-4 w-4" />
              <span className="text-lg font-bold">{weeklyBooks}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">이번 주 독서</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-500">
              <Award className="h-4 w-4" />
              <span className="text-lg font-bold">{monthlyCompletedBooks}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">이번 달 완독</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

interface ProgressCardProps {
  item: ProgressItem;
  animate: boolean;
  delay?: number;
}

function ProgressCard({ item, animate, delay = 0 }: ProgressCardProps) {
  const progress = Math.min((item.current / item.target) * 100, 100);
  const isCompleted = item.current >= item.target;
  const remaining = Math.max(item.target - item.current, 0);
  const Icon = item.icon;

  return (
    <Link href={item.href || "#"} className="block group">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={animate ? { scale: 1 } : { scale: 0 }}
              transition={{ delay, type: "spring", stiffness: 400 }}
            >
              <Icon className={cn("h-4 w-4", item.color)} />
            </motion.div>
            <span className="text-sm font-medium">{item.label}</span>
          </div>
          <div className="flex items-center gap-1">
            <motion.span
              key={item.current}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("text-sm font-bold", item.color)}
            >
              {item.current}
            </motion.span>
            <span className="text-xs text-muted-foreground">
              / {item.target}
            </span>
          </div>
        </div>

        {/* 프로그레스 바 */}
        <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className={cn("absolute h-full rounded-full", item.bgColor)}
            initial={{ width: 0 }}
            animate={animate ? { width: `${progress}%` } : { width: 0 }}
            transition={{ delay: delay + 0.2, duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* 상태 메시지 */}
        <div className="flex items-center justify-between text-[10px]">
          {isCompleted ? (
            <span className="text-emerald-500 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              목표 달성!
            </span>
          ) : (
            <span className="text-muted-foreground">
              {remaining}개 더 기록하면 달성!
            </span>
          )}
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
      </div>
    </Link>
  );
}

function CompactProgressCard({ item, animate }: ProgressCardProps) {
  const progress = Math.min((item.current / item.target) * 100, 100);
  const isCompleted = item.current >= item.target;
  const Icon = item.icon;

  return (
    <Link
      href={item.href || "#"}
      className="block bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-2.5 border border-white/50 dark:border-slate-700/50 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={cn("h-3.5 w-3.5", item.color)} />
        <span className="text-xs font-medium">{item.label}</span>
      </div>

      {/* 미니 프로그레스 바 */}
      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-1">
        <motion.div
          className={cn("h-full rounded-full", item.bgColor)}
          initial={{ width: 0 }}
          animate={animate ? { width: `${progress}%` } : { width: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className={cn("text-sm font-bold", item.color)}>
          {item.current}
          <span className="text-[10px] text-muted-foreground font-normal">
            /{item.target}
          </span>
        </span>
        {isCompleted && (
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
        )}
      </div>
    </Link>
  );
}

/**
 * 원형 진행률 컴포넌트
 */
export function CircularProgress({
  value,
  max = 100,
  size = 60,
  strokeWidth = 4,
  color = "text-primary",
  bgColor = "text-slate-200 dark:text-slate-700",
  label,
  sublabel,
  className,
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  label?: string;
  sublabel?: string;
  className?: string;
}) {
  const progress = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* 배경 원 */}
        <circle
          className={bgColor}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* 진행 원 */}
        <motion.circle
          className={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      {/* 중앙 텍스트 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && (
          <span className="text-sm font-bold">{label}</span>
        )}
        {sublabel && (
          <span className="text-[10px] text-muted-foreground">{sublabel}</span>
        )}
      </div>
    </div>
  );
}
