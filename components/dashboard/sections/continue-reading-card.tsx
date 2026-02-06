"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight, Play, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/components/ui/touch-feedback";

interface ContinueReadingCardProps {
  userBookId: string;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  currentPage: number;
  totalPages: number | null;
  progressPercent: number;
  compact?: boolean;
}

/**
 * 계속 읽기 카드 - 마지막 읽던 책으로 바로 이동하는 CTA
 * compact 모드: 여러 책이 있을 때 작은 카드로 표시
 */
export function ContinueReadingCard({
  userBookId,
  title,
  author,
  coverImageUrl,
  currentPage,
  totalPages,
  progressPercent,
  compact = false,
}: ContinueReadingCardProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const { lightTap } = useHapticFeedback();

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isNavigating) return;

    setIsNavigating(true);
    lightTap();

    // 전역 네비게이션 이벤트 발생
    window.dispatchEvent(new CustomEvent("navigation-start", { detail: { path: `/books/${userBookId}` } }));

    router.push(`/books/${userBookId}`);
  }, [router, userBookId, isNavigating, lightTap]);

  // compact 모드: 세로 레이아웃의 작은 카드
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        className="cursor-pointer"
      >
        <Card className={cn(
          "relative overflow-hidden h-full border-forest-200/50 dark:border-forest-800/50 bg-gradient-to-br from-forest-50/80 to-emerald-50/80 dark:from-forest-950/50 dark:to-emerald-950/50 hover:shadow-lg hover:border-forest-300 dark:hover:border-forest-700 transition-all duration-150",
          isNavigating && "opacity-75"
        )}>
          {/* 로딩 오버레이 */}
          {isNavigating && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 z-10 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-forest-500" />
            </div>
          )}
            {/* 배경 장식 */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-forest-200/20 dark:bg-forest-800/10 rounded-full blur-xl translate-x-1/2 -translate-y-1/2" />

            <div className="relative p-3 flex flex-col h-full">
              {/* 상단: 책 표지 + 제목 */}
              <div className="flex items-start gap-3">
                {/* 책 표지 */}
                <div className="relative shrink-0">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="relative w-12 h-[72px] rounded-md overflow-hidden shadow-sm"
                  >
                    {coverImageUrl ? (
                      <Image
                        src={coverImageUrl}
                        alt={title}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-forest-100 to-forest-200 dark:from-forest-800 dark:to-forest-900 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-forest-500" />
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* 책 정보 */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-forest-600 dark:text-forest-400 mb-0.5">
                    계속 읽기
                  </p>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-forest-700 dark:group-hover:text-forest-300 transition-colors leading-tight">
                    {title}
                  </h3>
                  {author && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {author}
                    </p>
                  )}
                </div>
              </div>

              {/* 하단: 진행률 */}
              <div className="mt-auto pt-2">
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                  <span>
                    {currentPage}p {totalPages && `/ ${totalPages}p`}
                  </span>
                  <span className="font-medium text-forest-600 dark:text-forest-400">
                    {progressPercent}%
                  </span>
                </div>
                <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-forest-400 to-emerald-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
                  />
                </div>
              </div>
            </div>
          </Card>
      </motion.div>
    );
  }

  // 기본 모드: 가로 레이아웃의 큰 카드
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="cursor-pointer group"
    >
      <Card className={cn(
        "relative overflow-hidden border-forest-200/50 dark:border-forest-800/50 bg-gradient-to-r from-forest-50/80 to-emerald-50/80 dark:from-forest-950/50 dark:to-emerald-950/50 hover:shadow-lg hover:border-forest-300 dark:hover:border-forest-700 transition-all duration-150",
        isNavigating && "opacity-75"
      )}>
        {/* 로딩 오버레이 */}
        {isNavigating && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 z-10 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-forest-500" />
          </div>
        )}

        {/* 배경 장식 */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-forest-200/20 dark:bg-forest-800/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />

        <div className="relative p-4 flex items-center gap-4">
            {/* 책 표지 */}
            <div className="relative shrink-0">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative w-16 h-24 rounded-lg overflow-hidden shadow-md"
              >
                {coverImageUrl ? (
                  <Image
                    src={coverImageUrl}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-forest-100 to-forest-200 dark:from-forest-800 dark:to-forest-900 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-forest-500" />
                  </div>
                )}
              </motion.div>

              {/* 진행률 링 */}
              {totalPages && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center">
                  <svg className="w-6 h-6 -rotate-90">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-slate-200 dark:text-slate-700"
                    />
                    <motion.circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${progressPercent * 0.628} 62.8`}
                      className="text-forest-500"
                      initial={{ strokeDasharray: "0 62.8" }}
                      animate={{ strokeDasharray: `${progressPercent * 0.628} 62.8` }}
                      transition={{ duration: 1, delay: 0.3 }}
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* 책 정보 */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-forest-600 dark:text-forest-400 mb-1">
                계속 읽기
              </p>
              <h3 className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-forest-700 dark:group-hover:text-forest-300 transition-colors">
                {title}
              </h3>
              {author && (
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {author}
                </p>
              )}

              {/* 진행률 바 */}
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>
                    {currentPage}p {totalPages && `/ ${totalPages}p`}
                  </span>
                  <span className="font-medium text-forest-600 dark:text-forest-400">
                    {progressPercent}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-forest-400 to-emerald-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
                  />
                </div>
              </div>
            </div>

          {/* CTA 버튼 */}
          <div className="shrink-0">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                size="icon"
                className="h-10 w-10 rounded-full bg-forest-500 hover:bg-forest-600 text-white shadow-md"
              >
                {isNavigating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/**
 * 계속 읽기 카드 스켈레톤
 */
export function ContinueReadingCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-24 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-1.5 w-full rounded bg-slate-200 dark:bg-slate-700 animate-pulse mt-2" />
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0" />
      </div>
    </Card>
  );
}

/**
 * 읽을 책이 없을 때 표시하는 빈 상태 카드
 */
export function NoReadingBookCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Link href="/books" className="block group">
        <Card className="p-4 border-dashed border-2 border-slate-200 dark:border-slate-700 hover:border-forest-300 dark:hover:border-forest-600 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-16 h-24 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                읽고 있는 책이 없어요
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                새로운 책을 추가해서 독서를 시작해보세요
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-forest-500 transition-colors" />
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
