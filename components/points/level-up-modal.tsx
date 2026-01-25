"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Star,
  Crown,
  Trophy,
  Award,
  Flame,
  TrendingUp,
  BookOpen,
  Gem,
  Sprout,
} from "lucide-react";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

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

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
  levelTitle: string;
  levelDescription?: string;
  badgeIcon?: string;
  streakBonus?: number;
}

export function LevelUpModal({
  isOpen,
  onClose,
  newLevel,
  levelTitle,
  levelDescription,
  badgeIcon = "Star",
  streakBonus = 1.0,
}: LevelUpModalProps) {
  const [showContent, setShowContent] = useState(false);

  const Icon = levelIcons[badgeIcon] || Star;

  // 모달 열릴 때 confetti 효과
  useEffect(() => {
    if (isOpen) {
      setShowContent(false);

      // 먼저 confetti 효과
      const duration = 2000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ["#FFD700", "#FFA500", "#FF6347", "#4ADE80", "#3B82F6"],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ["#FFD700", "#FFA500", "#FF6347", "#4ADE80", "#3B82F6"],
        });
      }, 250);

      // 콘텐츠 표시
      setTimeout(() => {
        setShowContent(true);
      }, 500);

      return () => {
        clearInterval(interval);
      };
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>레벨 업!</DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {showContent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center py-6"
            >
              {/* 레벨 뱃지 */}
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                className="relative"
              >
                {/* 빛나는 효과 */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ filter: "blur(20px)" }}
                />

                {/* 아이콘 배경 */}
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Icon className="h-12 w-12 text-white" />
                </div>

                {/* 레벨 숫자 뱃지 */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 500 }}
                  className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-forest-500 text-white flex items-center justify-center font-bold text-lg shadow-md"
                >
                  {newLevel}
                </motion.div>
              </motion.div>

              {/* 레벨업 텍스트 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mt-6 text-center"
              >
                <p className="text-sm text-amber-600 font-medium mb-1">
                  LEVEL UP!
                </p>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {levelTitle}
                </h2>
                {levelDescription && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    {levelDescription}
                  </p>
                )}
              </motion.div>

              {/* 보너스 정보 */}
              {streakBonus > 1.0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="mt-4 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg"
                >
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    <Sparkles className="inline-block h-4 w-4 mr-1" />
                    포인트 보너스 <span className="font-bold">x{streakBonus.toFixed(2)}</span> 적용!
                  </p>
                </motion.div>
              )}

              {/* 확인 버튼 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.3 }}
                className="mt-6"
              >
                <Button onClick={onClose} className="px-8">
                  계속하기
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 업적 달성 토스트 컴포넌트
 */
interface AchievementToastProps {
  title: string;
  description: string;
  icon?: string;
  pointsBonus: number;
  onClose: () => void;
}

export function AchievementToast({
  title,
  description,
  icon = "Trophy",
  pointsBonus,
  onClose,
}: AchievementToastProps) {
  const Icon = levelIcons[icon] || Trophy;

  useEffect(() => {
    // 작은 confetti 효과
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.3, x: 0.9 },
      colors: ["#22c55e", "#10b981", "#059669"],
    });

    // 자동 닫기
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, y: 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed top-4 right-4 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4 max-w-sm"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {title}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {description}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
            +{pointsBonus} 포인트
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <span className="sr-only">닫기</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}
