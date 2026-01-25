"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  BookOpen,
  PenLine,
  Clock,
  Sparkles,
  Gift,
  ChevronRight,
  Flame,
  Lock,
  Unlock,
  Zap,
  Quote,
  Brain,
  Camera,
  Share2,
  Timer,
  Users,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import type { BonusMission } from "@/types/points";
import { RARITY_STYLES } from "@/types/points";

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
  action_url?: string;
}

interface DailyMissionsProps {
  missions: Mission[];
  bonusMissions?: BonusMission[];
  isBonusUnlocked?: boolean;
  motivationMessage?: string;
  onMissionComplete?: (missionId: string) => void;
  onBonusMissionClick?: (mission: BonusMission) => void;
}

const missionIcons: Record<Mission["type"], React.ElementType> = {
  first_read: BookOpen,
  note: PenLine,
  time_goal: Clock,
  streak: Flame,
};

const bonusIcons: Record<string, React.ElementType> = {
  PenLine: PenLine,
  Quote: Quote,
  Brain: Brain,
  Camera: Camera,
  Share2: Share2,
  Gift: Gift,
};

const missionColors: Record<Mission["type"], string> = {
  first_read: "text-blue-500",
  note: "text-green-500",
  time_goal: "text-orange-500",
  streak: "text-orange-500",
};

// 미션 타입별 기본 URL
const missionUrls: Record<Mission["type"], string> = {
  first_read: "/books",
  note: "/notes/new",
  time_goal: "/books",
  streak: "/notes/new",
};

/**
 * 오늘의 미션 컴포넌트 (보너스 미션 + 심리학적 동기부여 포함)
 */
export function DailyMissions({
  missions,
  bonusMissions = [],
  isBonusUnlocked = false,
  motivationMessage,
  onMissionComplete,
  onBonusMissionClick,
}: DailyMissionsProps) {
  const router = useRouter();
  const [celebratingMission, setCelebratingMission] = useState<string | null>(null);
  const [showBonusUnlock, setShowBonusUnlock] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const prevBonusUnlockedRef = useRef(isBonusUnlocked);

  // 남은 시간 업데이트를 위한 타이머 (1분마다)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const completedCount = missions.filter((m) => m.status === "completed").length;
  const totalCount = missions.length;
  const allCompleted = completedCount === totalCount;

  // 보너스 미션 해금 애니메이션
  useEffect(() => {
    if (isBonusUnlocked && !prevBonusUnlockedRef.current) {
      // 특별한 축하 효과
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#fbbf24", "#f59e0b", "#d97706", "#22c55e"],
      });
      // setTimeout 내에서 setState 호출 (비동기)
      const showTimer = setTimeout(() => setShowBonusUnlock(true), 0);
      const hideTimer = setTimeout(() => setShowBonusUnlock(false), 3000);
      prevBonusUnlockedRef.current = isBonusUnlocked;
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
    prevBonusUnlockedRef.current = isBonusUnlocked;
  }, [isBonusUnlocked]);

  // 미션 완료 시 축하 애니메이션 (부모 컴포넌트에서 사용 가능)
  const triggerCelebration = useCallback((missionId: string) => {
    setCelebratingMission(missionId);

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
  }, [onMissionComplete]);

  // triggerCelebration은 향후 미션 완료 이벤트와 연결하여 사용
  void triggerCelebration;

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

  // 미션 클릭 핸들러
  const handleMissionClick = (mission: Mission) => {
    if (mission.status === "completed") {
      return;
    }
    const url = mission.action_url || missionUrls[mission.type];
    router.push(url);
  };

  // 보너스 미션 클릭 핸들러
  const handleBonusMissionClick = (mission: BonusMission) => {
    if (mission.status === "completed") return;
    onBonusMissionClick?.(mission);
    if (mission.action_url) {
      router.push(mission.action_url);
    }
  };

  // 남은 시간 계산 (희소성)
  const getRemainingTime = useCallback((expiresAt?: string) => {
    if (!expiresAt) return null;
    const remaining = new Date(expiresAt).getTime() - currentTime;
    if (remaining <= 0) return null;
    const minutes = Math.floor(remaining / 60000);
    return minutes > 60 ? `${Math.floor(minutes / 60)}시간` : `${minutes}분`;
  }, [currentTime]);

  if (missions.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="space-y-3"
    >
      {/* 일일 미션 카드 */}
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
                  onClick={() => handleMissionClick(mission)}
                  className={cn(
                    "px-4 py-3 flex items-center gap-3 transition-all",
                    isCompleted
                      ? "bg-green-50/50 dark:bg-green-950/20"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer active:scale-[0.99]"
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

                  {/* 보상 및 액션 */}
                  <div className="shrink-0 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Gift className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                        {mission.reward}
                      </span>
                    </div>
                    {!isCompleted && (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
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
                  오늘의 미션을 모두 완료했어요! +30 보너스
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* 보너스 미션 섹션 */}
      <AnimatePresence>
        {!isBonusUnlocked ? (
          /* 보너스 미션 잠금 상태 */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="overflow-hidden border-dashed border-2 border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20">
              <div className="px-4 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    🎁 보너스 미션
                  </p>
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                    {motivationMessage || "모든 일일 미션을 완료하면 해금돼요!"}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-amber-500">
                  <Zap className="h-4 w-4" />
                  <span className="text-xs font-medium">추가 보상</span>
                </div>
              </div>

              {/* 진행률 표시 (Near-miss 효과) */}
              <div className="px-4 pb-3">
                <div className="h-2 bg-amber-100 dark:bg-amber-900/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedCount / totalCount) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1 text-center">
                  {totalCount - completedCount}개 미션 남음
                </p>
              </div>
            </Card>
          </motion.div>
        ) : (
          /* 보너스 미션 해금 상태 */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Card className="overflow-hidden">
              {/* 해금 알림 */}
              <AnimatePresence>
                {showBonusUnlock && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 py-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Unlock className="h-4 w-4 animate-bounce" />
                      <span className="text-sm font-semibold">
                        🎉 보너스 미션 해금!
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 헤더 */}
              <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border-b border-amber-100 dark:border-amber-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-amber-500" />
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      보너스 미션
                    </h3>
                    <Badge className="bg-amber-500 text-white text-xs">NEW</Badge>
                  </div>
                  {bonusMissions.length > 0 && bonusMissions[0].completedBy !== undefined && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Users className="h-3 w-3" />
                      <span>{bonusMissions[0].completedBy}명 참여</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 보너스 미션 목록 */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {bonusMissions.map((mission, index) => {
                  const Icon = bonusIcons[mission.icon] || Gift;
                  const isCompleted = mission.status === "completed";
                  const rarityStyle = RARITY_STYLES[mission.rarity];
                  const remainingTime = getRemainingTime(mission.expires_at);

                  return (
                    <motion.div
                      key={mission.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      onClick={() => handleBonusMissionClick(mission)}
                      className={cn(
                        "px-4 py-3 flex items-center gap-3 transition-all",
                        isCompleted
                          ? "bg-green-50/50 dark:bg-green-950/20"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer active:scale-[0.99]",
                        mission.rarity === "legendary" && !isCompleted && "bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20"
                      )}
                    >
                      {/* 상태 아이콘 */}
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600 shrink-0" />
                      )}

                      {/* 미션 아이콘 */}
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          isCompleted
                            ? "bg-green-100 dark:bg-green-900/30"
                            : rarityStyle.bg
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            isCompleted ? "text-green-500" : rarityStyle.text
                          )}
                        />
                      </div>

                      {/* 미션 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              "text-sm font-medium truncate",
                              isCompleted
                                ? "text-green-700 dark:text-green-300 line-through"
                                : "text-slate-900 dark:text-white"
                            )}
                          >
                            {mission.title}
                          </p>
                          {mission.rarity !== "common" && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-1.5 py-0",
                                rarityStyle.border,
                                rarityStyle.text
                              )}
                            >
                              {mission.rarity === "rare" && "희귀"}
                              {mission.rarity === "epic" && "에픽"}
                              {mission.rarity === "legendary" && "전설"}
                            </Badge>
                          )}
                        </div>
                        {/* 제한 시간 표시 (희소성) */}
                        {remainingTime && !isCompleted && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Timer className="h-3 w-3 text-red-500" />
                            <span className="text-xs text-red-500 font-medium">
                              {remainingTime} 남음
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 보상 (가변 보상 표시) */}
                      <div className="shrink-0 flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Gift className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                            {isCompleted && mission.reward.actual
                              ? `+${mission.reward.actual}`
                              : mission.reward.min === mission.reward.max
                                ? `+${mission.reward.min}`
                                : `+${mission.reward.min}~${mission.reward.max}`
                            }
                          </span>
                        </div>
                        {!isCompleted && (
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* 동기부여 메시지 */}
              {bonusMissions.length > 0 && bonusMissions.every(m => m.status !== "completed") && (
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                    💡 보너스 미션은 추가 포인트와 특별 보상을 제공해요!
                  </p>
                </div>
              )}

              {/* 모든 보너스 미션 완료 */}
              {bonusMissions.length > 0 && bonusMissions.every(m => m.status === "completed") && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-t border-amber-100 dark:border-amber-900"
                >
                  <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-300">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      대단해요! 모든 보너스 미션을 완료했어요! 🎉
                    </span>
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * 오늘의 미션 스켈레톤
 */
export function DailyMissionsSkeleton() {
  return (
    <div className="space-y-3">
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

      {/* 보너스 미션 스켈레톤 */}
      <Card className="overflow-hidden border-dashed border-2 border-slate-200 dark:border-slate-700">
        <div className="px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-3 w-40 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
        </div>
      </Card>
    </div>
  );
}
