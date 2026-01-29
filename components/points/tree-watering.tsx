"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Droplets,
  Clock,
  Sparkles,
  Heart,
  Gift,
  Leaf,
  Sun,
  CloudRain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getWateringStatus, waterTree } from "@/app/actions/points";
import { ReadingTreeImage } from "./reading-tree-image";
import {
  type WateringStatus,
  type WateringResult,
  WATERING_CONFIG,
  getTreeGrowthStage,
} from "@/types/points";

interface TreeWateringProps {
  level: number;
  className?: string;
}

/**
 * 나무 물주기 컴포넌트
 *
 * 심리학적 설계:
 * - 가변 보상: 물줄 때마다 다른 포인트
 * - 시각적 피드백: 나무 성장 애니메이션
 * - 독려 문구: 긍정적 강화
 */
export function TreeWatering({ level, className }: TreeWateringProps) {
  const [status, setStatus] = useState<WateringStatus | null>(null);
  const [isWatering, setIsWatering] = useState(false);
  const [result, setResult] = useState<WateringResult | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [showQuote, setShowQuote] = useState(false);

  const stage = getTreeGrowthStage(level);

  // 상태 로드
  const loadStatus = useCallback(async () => {
    const data = await getWateringStatus();
    setStatus(data);
    setCountdown(data.remainingSeconds);
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // 카운트다운 타이머
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadStatus(); // 쿨다운 완료 시 상태 갱신
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, loadStatus]);

  // 물주기 실행
  const handleWater = async () => {
    if (!status?.canWater || isWatering) return;

    setIsWatering(true);
    setResult(null);

    try {
      const waterResult = await waterTree();
      setResult(waterResult);

      if (waterResult.success) {
        setShowQuote(true);
        // 3초 후 문구 숨김
        setTimeout(() => setShowQuote(false), 4000);
      }

      // 상태 갱신
      await loadStatus();
    } catch (error) {
      console.error("물주기 오류:", error);
    } finally {
      // 애니메이션 완료 대기
      setTimeout(() => setIsWatering(false), 1500);
    }
  };

  // 시간 포맷
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    }
    if (minutes > 0) {
      return `${minutes}분 ${secs}초`;
    }
    return `${secs}초`;
  };

  // 건강도 상태 메시지 (심리학적 요소)
  const healthMessage = useMemo(() => {
    if (!status) return null;
    const health = status.treeHealth;
    if (health >= 90) return { text: "최상의 컨디션!", icon: Sun, color: "text-green-500" };
    if (health >= 70) return { text: "건강해요", icon: Leaf, color: "text-green-500" };
    if (health >= 50) return { text: "물이 필요해요", icon: Droplets, color: "text-yellow-500" };
    return { text: "목이 말라요!", icon: CloudRain, color: "text-red-500" };
  }, [status?.treeHealth]);

  // 남은 물주기 횟수
  const remainingWaterings = status
    ? WATERING_CONFIG.maxDailyWaterings - status.todayWateringCount
    : 0;

  return (
    <div className={cn("relative", className)}>
      {/* 배경 장식 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-200/20 dark:bg-green-800/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-200/20 dark:bg-blue-800/10 rounded-full blur-3xl" />
      </div>

      {/* 나무 영역 - 시각적 강화 */}
      <div className="relative">
        <div className="relative h-52 sm:h-60 flex items-end justify-center">
          <ReadingTreeImage
            level={level}
            health={status?.treeHealth || 100}
            isWatering={isWatering}
            className="h-full w-auto"
          />

          {/* 럭키 드롭 효과 - 더 화려하게 */}
          <AnimatePresence>
            {result?.isLuckyDrop && (
              <motion.div
                initial={{ opacity: 0, scale: 0, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute top-2 left-1/2 -translate-x-1/2"
              >
                <div className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-400 text-yellow-900 rounded-full font-bold shadow-lg shadow-yellow-500/40">
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 0.5, repeat: 3 }}
                  >
                    <Gift className="h-5 w-5" />
                  </motion.div>
                  럭키 드롭!
                  <Sparkles className="h-4 w-4" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 포인트 획득 표시 - 더 눈에 띄게 */}
          <AnimatePresence>
            {result?.success && result.points && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="absolute top-1/4 left-1/2 -translate-x-1/2"
              >
                <div className={cn(
                  "px-4 py-2 rounded-xl font-bold text-3xl shadow-lg",
                  result.isLuckyDrop
                    ? "bg-gradient-to-r from-yellow-400 to-amber-400 text-yellow-900"
                    : "bg-gradient-to-r from-green-400 to-emerald-400 text-green-900"
                )}>
                  +{result.points}P
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 나무 정보 카드 */}
        <div className="mt-3 p-4 rounded-xl bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-800/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-green-800 dark:text-green-200">
                {stage.name}
              </div>
              <div className="text-xs text-green-600/70 dark:text-green-400/70">
                {stage.description}
              </div>
            </div>
            {healthMessage && (
              <Badge
                variant="secondary"
                className={cn(
                  "flex items-center gap-1",
                  healthMessage.color,
                  status?.treeHealth && status.treeHealth >= 70
                    ? "bg-green-100 dark:bg-green-900/30"
                    : status?.treeHealth && status.treeHealth >= 50
                    ? "bg-yellow-100 dark:bg-yellow-900/30"
                    : "bg-red-100 dark:bg-red-900/30"
                )}
              >
                <healthMessage.icon className="h-3 w-3" />
                {healthMessage.text}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* 나무 건강도 - 시각적 개선 */}
      {status && (
        <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                status.treeHealth >= 70 ? "bg-green-100 dark:bg-green-900/30" :
                status.treeHealth >= 50 ? "bg-yellow-100 dark:bg-yellow-900/30" :
                "bg-red-100 dark:bg-red-900/30"
              )}>
                <Heart className={cn(
                  "h-4 w-4",
                  status.treeHealth >= 70 ? "text-green-500" :
                  status.treeHealth >= 50 ? "text-yellow-500" :
                  "text-red-500"
                )} />
              </div>
              <span className="text-sm font-medium">나무 건강</span>
            </div>
            <span className={cn(
              "text-lg font-bold tabular-nums",
              status.treeHealth >= 70 ? "text-green-500" :
              status.treeHealth >= 50 ? "text-yellow-500" :
              "text-red-500"
            )}>
              {status.treeHealth}%
            </span>
          </div>
          <div className="relative">
            <Progress
              value={status.treeHealth}
              className={cn(
                "h-3 bg-muted/50",
                status.treeHealth >= 70 ? "[&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:to-emerald-500" :
                status.treeHealth >= 50 ? "[&>div]:bg-gradient-to-r [&>div]:from-yellow-400 [&>div]:to-amber-500" :
                "[&>div]:bg-gradient-to-r [&>div]:from-red-400 [&>div]:to-orange-500"
              )}
            />
            {/* 건강도 임계점 표시 */}
            <div className="absolute top-0 left-[50%] w-px h-3 bg-border/50" />
            <div className="absolute top-0 left-[70%] w-px h-3 bg-border/50" />
          </div>
        </div>
      )}

      {/* 물주기 버튼 - 디자인 대폭 개선 */}
      <div className="mt-4">
        {status?.canWater ? (
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleWater}
              disabled={isWatering}
              className={cn(
                "w-full h-14 text-base font-semibold rounded-xl",
                "bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500",
                "hover:from-blue-600 hover:via-cyan-600 hover:to-teal-600",
                "shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40",
                "transition-all duration-300"
              )}
            >
              {isWatering ? (
                <motion.span
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="flex items-center gap-2"
                >
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                  >
                    <Droplets className="h-5 w-5" />
                  </motion.div>
                  물 주는 중...
                </motion.span>
              ) : (
                <span className="flex items-center gap-2">
                  <Droplets className="h-5 w-5" />
                  물 주기
                  <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-0">
                    {WATERING_CONFIG.basePoints}~{WATERING_CONFIG.maxPoints}P
                  </Badge>
                </span>
              )}
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <Button
              disabled
              className="w-full h-14 text-base rounded-xl"
              variant="secondary"
            >
              <Clock className="h-5 w-5 mr-2" />
              {countdown > 0 ? (
                <span className="tabular-nums">{formatTime(countdown)}</span>
              ) : (
                "오늘 물주기 완료!"
              )}
            </Button>
            {countdown > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <p className="text-xs text-muted-foreground">
                  조금만 기다리면 다시 물을 줄 수 있어요
                </p>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* 물주기 통계 - 카드 형태로 개선 */}
      {status && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-center border border-blue-200/50 dark:border-blue-800/50"
          >
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {status.todayWateringCount}
            </div>
            <div className="text-xs text-blue-500/70">오늘 물주기</div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={cn(
              "p-3 rounded-xl text-center border",
              remainingWaterings > 0
                ? "bg-green-50 dark:bg-green-950/30 border-green-200/50 dark:border-green-800/50"
                : "bg-muted/30 border-border/50"
            )}
          >
            <div className={cn(
              "text-xl font-bold",
              remainingWaterings > 0
                ? "text-green-600 dark:text-green-400"
                : "text-muted-foreground"
            )}>
              {remainingWaterings}
            </div>
            <div className={cn(
              "text-xs",
              remainingWaterings > 0
                ? "text-green-500/70"
                : "text-muted-foreground/70"
            )}>
              남은 횟수
            </div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-center border border-amber-200/50 dark:border-amber-800/50"
          >
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
              {status.totalWateringCount}
            </div>
            <div className="text-xs text-amber-500/70">총 물주기</div>
          </motion.div>
        </div>
      )}

      {/* 독서 독려 문구 - 더 눈에 띄게 */}
      <AnimatePresence>
        {showQuote && result?.quote && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="mt-4 p-4 rounded-xl bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 border border-green-200 dark:border-green-800 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-800/50 flex items-center justify-center flex-shrink-0">
                <Leaf className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 font-medium leading-relaxed">
                "{result.quote}"
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 에러 메시지 */}
      <AnimatePresence>
        {result && !result.success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          >
            <p className="text-sm text-center text-red-600 dark:text-red-400">
              {result.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
