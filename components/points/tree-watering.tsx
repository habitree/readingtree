"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, Clock, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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

  return (
    <div className={cn("relative", className)}>
      {/* 나무 영역 */}
      <div className="relative h-48 sm:h-56 flex items-end justify-center">
        <ReadingTreeImage
          level={level}
          health={status?.treeHealth || 100}
          isWatering={isWatering}
          className="h-full w-auto"
        />

        {/* 럭키 드롭 효과 */}
        <AnimatePresence>
          {result?.isLuckyDrop && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute top-4 left-1/2 -translate-x-1/2"
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-yellow-900 rounded-full font-bold shadow-lg">
                <Sparkles className="h-5 w-5" />
                럭키!
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 포인트 획득 표시 */}
        <AnimatePresence>
          {result?.success && result.points && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: -20, scale: 1 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.5 }}
              className={cn(
                "absolute top-1/3 left-1/2 -translate-x-1/2 text-2xl font-bold",
                result.isLuckyDrop ? "text-yellow-500" : "text-green-500"
              )}
            >
              +{result.points}P
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 나무 정보 */}
      <div className="text-center mt-2 space-y-1">
        <div className="text-lg font-semibold">{stage.name}</div>
        <div className="text-sm text-muted-foreground">{stage.description}</div>
      </div>

      {/* 나무 건강도 */}
      {status && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Heart className="h-3.5 w-3.5 text-red-400" />
              나무 건강
            </span>
            <span className={cn(
              "font-medium",
              status.treeHealth >= 80 ? "text-green-500" :
              status.treeHealth >= 50 ? "text-yellow-500" :
              "text-red-500"
            )}>
              {status.treeHealth}%
            </span>
          </div>
          <Progress
            value={status.treeHealth}
            className={cn(
              "h-2",
              status.treeHealth >= 80 ? "[&>div]:bg-green-500" :
              status.treeHealth >= 50 ? "[&>div]:bg-yellow-500" :
              "[&>div]:bg-red-500"
            )}
          />
        </div>
      )}

      {/* 물주기 버튼 */}
      <div className="mt-4">
        {status?.canWater ? (
          <Button
            onClick={handleWater}
            disabled={isWatering}
            className={cn(
              "w-full h-12 text-base font-semibold",
              "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600",
              "shadow-lg shadow-blue-500/30"
            )}
          >
            {isWatering ? (
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="flex items-center gap-2"
              >
                <Droplets className="h-5 w-5" />
                물 주는 중...
              </motion.span>
            ) : (
              <span className="flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                물 주기
              </span>
            )}
          </Button>
        ) : (
          <div className="space-y-2">
            <Button
              disabled
              className="w-full h-12 text-base"
              variant="secondary"
            >
              <Clock className="h-5 w-5 mr-2" />
              {countdown > 0 ? formatTime(countdown) : "오늘 완료"}
            </Button>
            {countdown > 0 && (
              <p className="text-xs text-center text-muted-foreground">
                다음 물주기까지 기다려주세요
              </p>
            )}
          </div>
        )}
      </div>

      {/* 물주기 통계 */}
      {status && (
        <div className="mt-4 flex justify-center gap-6 text-sm text-muted-foreground">
          <div className="text-center">
            <div className="font-semibold text-foreground">{status.todayWateringCount}</div>
            <div>오늘</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-foreground">{WATERING_CONFIG.maxDailyWaterings - status.todayWateringCount}</div>
            <div>남은 횟수</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-foreground">{status.totalWateringCount}</div>
            <div>총 물주기</div>
          </div>
        </div>
      )}

      {/* 독서 독려 문구 */}
      <AnimatePresence>
        {showQuote && result?.quote && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800"
          >
            <p className="text-sm text-center text-green-700 dark:text-green-300 font-medium">
              {result.quote}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 에러 메시지 */}
      <AnimatePresence>
        {result && !result.success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
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
