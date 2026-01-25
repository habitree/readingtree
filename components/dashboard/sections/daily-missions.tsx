"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  BookOpen,
  PenLine,
  Clock,
  Target,
  Sparkles,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

export interface Mission {
  id: string;
  type: "first_read" | "note" | "time_goal" | "streak";
  title: string;
  description: string;
  status: "pending" | "completed";
  reward: string;
  progress?: {
    current: number;
    target: number;
  };
}

interface DailyMissionsProps {
  missions: Mission[];
  onMissionComplete?: (missionId: string) => void;
}

const missionIcons: Record<Mission["type"], React.ElementType> = {
  first_read: BookOpen,
  note: PenLine,
  time_goal: Clock,
  streak: Target,
};

const missionColors: Record<Mission["type"], string> = {
  first_read: "text-blue-500",
  note: "text-green-500",
  time_goal: "text-orange-500",
  streak: "text-purple-500",
};

/**
 * 오늘의 미션 컴포넌트
 */
export function DailyMissions({ missions, onMissionComplete }: DailyMissionsProps) {
  const [celebratingMission, setCelebratingMission] = useState<string | null>(null);
  const completedCount = missions.filter((m) => m.status === "completed").length;
  const totalCount = missions.length;
  const allCompleted = completedCount === totalCount;

  // 미션 완료 시 축하 애니메이션
  const handleCelebration = (missionId: string) => {
    setCelebratingMission(missionId);

    // Confetti 효과
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#22c55e", "#10b981", "#059669"],
    });

    setTimeout(() => {
      setCelebratingMission(null);
    }, 1000);

    onMissionComplete?.(missionId);
  };

  // 전체 완료 시 특별한 축하
  useEffect(() => {
    if (allCompleted && totalCount > 0) {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.5 },
        colors: ["#22c55e", "#10b981", "#059669", "#fbbf24", "#f59e0b"],
      });
    }
  }, [allCompleted, totalCount]);

  if (missions.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="overflow-hidden">
        {/* 헤더 */}
        <div className="px-4 py-3 bg-gradient-to-r from-forest-50 to-emerald-50 dark:from-forest-950/50 dark:to-emerald-950/50 border-b border-forest-100 dark:border-forest-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-forest-500" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                오늘의 미션
              </h3>
            </div>
            <Badge
              variant={allCompleted ? "default" : "secondary"}
              className={cn(
                "text-xs",
                allCompleted && "bg-green-500 hover:bg-green-500"
              )}
            >
              {completedCount}/{totalCount}
            </Badge>
          </div>

          {/* 전체 진행률 바 */}
          <div className="mt-2 h-1.5 bg-white/50 dark:bg-slate-800/50 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                allCompleted
                  ? "bg-gradient-to-r from-green-400 to-emerald-400"
                  : "bg-gradient-to-r from-forest-400 to-emerald-400"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / totalCount) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* 미션 목록 */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <AnimatePresence>
            {missions.map((mission, index) => {
              const Icon = missionIcons[mission.type];
              const isCompleted = mission.status === "completed";
              const isCelebrating = celebratingMission === mission.id;

              return (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={cn(
                    "px-4 py-3 flex items-center gap-3 transition-colors",
                    isCompleted && "bg-green-50/50 dark:bg-green-950/20"
                  )}
                >
                  {/* 상태 아이콘 */}
                  <motion.div
                    animate={isCelebrating ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                    )}
                  </motion.div>

                  {/* 미션 아이콘 */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      isCompleted
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-slate-100 dark:bg-slate-800"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        isCompleted ? "text-green-500" : missionColors[mission.type]
                      )}
                    />
                  </div>

                  {/* 미션 내용 */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        isCompleted
                          ? "text-green-700 dark:text-green-300 line-through"
                          : "text-slate-900 dark:text-white"
                      )}
                    >
                      {mission.title}
                    </p>
                    {mission.progress && !isCompleted && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {mission.progress.current}/{mission.progress.target} 완료
                      </p>
                    )}
                  </div>

                  {/* 보상 */}
                  <div className="shrink-0 flex items-center gap-1">
                    <Gift className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      {mission.reward}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* 전체 완료 메시지 */}
        <AnimatePresence>
          {allCompleted && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-t border-green-100 dark:border-green-900"
            >
              <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">
                  오늘의 미션을 모두 완료했어요!
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

/**
 * 오늘의 미션 스켈레톤
 */
export function DailyMissionsSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-5 w-10 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>
        <div className="mt-2 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex items-center gap-3">
            <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </div>
            <div className="h-4 w-12 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
        ))}
      </div>
    </Card>
  );
}
