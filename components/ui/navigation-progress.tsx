"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

/**
 * 전역 네비게이션 프로그레스 바
 * 페이지 전환 시 상단에 로딩 진행률을 표시
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 프로그레스 시작
  const startProgress = useCallback(() => {
    // 기존 인터벌 정리
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsNavigating(true);
    setProgress(10);

    // 점진적 진행률 증가 (최대 90%까지)
    let currentProgress = 10;
    intervalRef.current = setInterval(() => {
      currentProgress = Math.min(90, currentProgress + Math.random() * 15);
      setProgress(currentProgress);
    }, 200);
  }, []);

  // 프로그레스 완료
  const completeProgress = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setProgress(100);

    // 완료 후 숨기기
    timeoutRef.current = setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
    }, 200);
  }, []);

  // 경로 변경 감지 - 완료 처리
  useEffect(() => {
    completeProgress();
  }, [pathname, searchParams, completeProgress]);

  // navigation-start 이벤트 리스너
  useEffect(() => {
    const handleNavigationStart = () => {
      startProgress();
    };

    window.addEventListener("navigation-start", handleNavigationStart);
    return () => {
      window.removeEventListener("navigation-start", handleNavigationStart);
      // 정리
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [startProgress]);

  return (
    <AnimatePresence>
      {isNavigating && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[100] h-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-forest-400 via-emerald-400 to-forest-500 shadow-sm shadow-forest-400/30"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{
              duration: 0.2,
              ease: "easeOut"
            }}
          />
          {/* 글로우 효과 */}
          <motion.div
            className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-white/30 to-transparent"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ right: `${100 - progress}%` }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
