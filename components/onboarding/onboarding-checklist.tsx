"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  BookOpen,
  PenLine,
  Target,
  User,
  Droplets,
  Gift,
  ChevronRight,
  ChevronDown,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

/**
 * 온보딩 체크리스트 아이템 정의
 * Endowed Progress Effect - 시작된 진행이 완료율 82% 향상
 */
export interface OnboardingItem {
  id: string;
  title: string;
  description: string;
  reward: number;
  icon: "book" | "note" | "water" | "goal" | "persona";
  href: string;
  completed: boolean;
}

export const ONBOARDING_CHECKLIST: Omit<OnboardingItem, "completed" | "title" | "description">[] = [
  {
    id: "first_book",
    reward: 35,
    icon: "book",
    href: "/books/search",
  },
  {
    id: "first_note",
    reward: 50,
    icon: "note",
    href: "/notes/new",
  },
  {
    id: "profile_complete",
    reward: 50,
    icon: "persona",
    href: "/profile",
  },
];

/** Advanced 온보딩 항목 (핵심 3개 완료 후 표시) */
export const ONBOARDING_ADVANCED: Omit<OnboardingItem, "completed" | "title" | "description">[] = [
  {
    id: "water_tree",
    reward: 10,
    icon: "water",
    href: "/tree",
  },
  {
    id: "explore_persona",
    reward: 15,
    icon: "persona",
    href: "/profile/persona",
  },
];

const iconMap = {
  book: BookOpen,
  note: PenLine,
  water: Droplets,
  goal: Target,
  persona: User,
};

interface OnboardingChecklistProps {
  items: OnboardingItem[];
  onDismiss?: () => void;
  className?: string;
}

/**
 * 온보딩 체크리스트 컴포넌트
 * 새로운 사용자에게 핵심 기능을 안내하고 완료 시 보상을 제공
 */
export function OnboardingChecklist({
  items,
  onDismiss,
  className,
}: OnboardingChecklistProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [celebratedItems, setCelebratedItems] = useState<Set<string>>(new Set());

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const progress = (completedCount / totalCount) * 100;
  const allCompleted = completedCount === totalCount;
  const totalReward = items.reduce((sum, item) => sum + item.reward, 0);
  const earnedReward = items
    .filter((item) => item.completed)
    .reduce((sum, item) => sum + item.reward, 0);

  // 완료된 아이템 축하 효과
  useEffect(() => {
    items.forEach((item) => {
      if (item.completed && !celebratedItems.has(item.id)) {
        setCelebratedItems((prev) => new Set(prev).add(item.id));
      }
    });
  }, [items, celebratedItems]);

  // 전체 완료 시 특별 축하
  useEffect(() => {
    if (allCompleted && completedCount > 0) {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#22c55e", "#10b981", "#059669", "#fbbf24", "#f59e0b"],
      });
    }
  }, [allCompleted, completedCount]);

  if (allCompleted && onDismiss) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("relative", className)}
      >
        <Card className="overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-green-700 dark:text-green-300">
                  {t("onboardingChecklist.congrats")}
                </p>
                <p className="text-sm text-green-600/80 dark:text-green-400/80">
                  {t("onboardingChecklist.totalPoints", { count: totalReward })}
                </p>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-green-200/50 dark:hover:bg-green-800/50 rounded-full transition-colors"
              aria-label={t("onboardingChecklist.closeAriaLabel")}
            >
              <X className="h-4 w-4 text-green-600 dark:text-green-400" />
            </button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("relative", className)}
    >
      <Card className="overflow-hidden">
        {/* 헤더 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-b border-blue-100 dark:border-blue-900 flex items-center justify-between hover:bg-blue-100/50 dark:hover:bg-blue-900/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  {t("onboardingChecklist.startGuide")}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {completedCount}/{totalCount}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("onboardingChecklist.completeForPoints", { count: totalReward })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Gift className="h-3 w-3 text-amber-500" />
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {earnedReward}p / {totalReward}p
              </span>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </motion.div>
          </div>
        </button>

        {/* 진행률 바 */}
        <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* 체크리스트 */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item, index) => {
                  const Icon = iconMap[item.icon];
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 transition-all",
                          item.completed
                            ? "bg-green-50/50 dark:bg-green-950/20"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        )}
                      >
                        {/* 체크 상태 */}
                        {item.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600 shrink-0" />
                        )}

                        {/* 아이콘 */}
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                            item.completed
                              ? "bg-green-100 dark:bg-green-900/30"
                              : "bg-blue-100 dark:bg-blue-900/30"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4",
                              item.completed
                                ? "text-green-500"
                                : "text-blue-500"
                            )}
                          />
                        </div>

                        {/* 내용 */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm font-medium",
                              item.completed
                                ? "text-green-700 dark:text-green-300 line-through"
                                : "text-slate-900 dark:text-white"
                            )}
                          >
                            {item.title}
                          </p>
                          {!item.completed && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* 보상 */}
                        <div className="shrink-0 flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Gift className="h-3 w-3 text-amber-500" />
                            <span
                              className={cn(
                                "text-xs font-medium",
                                item.completed
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-amber-600 dark:text-amber-400"
                              )}
                            >
                              +{item.reward}
                            </span>
                          </div>
                          {!item.completed && (
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
