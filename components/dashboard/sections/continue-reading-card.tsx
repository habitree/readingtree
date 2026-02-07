"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { BookOpen, ChevronRight, Loader2 } from "lucide-react";
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
  priority?: boolean;
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
  priority = false,
}: ContinueReadingCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const { lightTap } = useHapticFeedback();

  // 뒤로가기 등으로 경로가 변경되면 네비게이션 상태 리셋
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        className="cursor-pointer"
      >
        <Card className={cn(
          "relative overflow-hidden h-full border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 transition-colors duration-200",
          isNavigating && "opacity-75"
        )}>
          {/* 로딩 오버레이 */}
          {isNavigating && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 z-10 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-forest-500" />
            </div>
          )}

            <div className="relative p-3 flex flex-col h-full">
              {/* 상단: 책 표지 + 제목 */}
              <div className="flex items-start gap-3">
                {/* 책 표지 */}
                <div className="relative shrink-0">
                  <div className="relative w-12 h-[72px] rounded-md overflow-hidden shadow-sm">
                    {coverImageUrl ? (
                      <Image
                        src={coverImageUrl}
                        alt={title}
                        fill
                        className="object-cover"
                        sizes="48px"
                        priority={priority}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-forest-100 to-forest-200 dark:from-forest-800 dark:to-forest-900 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-forest-500" />
                      </div>
                    )}
                  </div>
                </div>

                {/* 책 정보 */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-forest-600 dark:text-forest-400 mb-0.5">
                    이어서
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

              {/* 하단: 진행률 바 (수치 제거, 바만 유지) */}
              <div className="mt-auto pt-2">
                <div className="h-0.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-forest-400/60 rounded-full"
                    style={{ width: `${progressPercent}%` }}
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="cursor-pointer group"
    >
      <Card className={cn(
        "relative overflow-hidden border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 transition-colors duration-200",
        isNavigating && "opacity-75"
      )}>
        {/* 로딩 오버레이 */}
        {isNavigating && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 z-10 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-forest-500" />
          </div>
        )}

        <div className="relative p-4 flex items-center gap-4">
            {/* 책 표지 */}
            <div className="relative shrink-0">
              <div className="relative w-16 h-24 rounded-lg overflow-hidden shadow-md">
                {coverImageUrl ? (
                  <Image
                    src={coverImageUrl}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="64px"
                    priority={priority}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-forest-100 to-forest-200 dark:from-forest-800 dark:to-forest-900 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-forest-500" />
                  </div>
                )}
              </div>
            </div>

            {/* 책 정보 */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-forest-600 dark:text-forest-400 mb-1">
                지난번에 읽던 책
              </p>
              <h3 className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-forest-700 dark:group-hover:text-forest-300 transition-colors">
                {title}
              </h3>
              {author && (
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {author}
                </p>
              )}

              {/* 진행률 바 (수치 제거, 바만 유지) */}
              <div className="mt-2">
                <div className="h-0.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-forest-400/60 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

          {/* CTA: ChevronRight */}
          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-forest-500 transition-colors shrink-0" />
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
          <div className="h-0.5 w-full rounded bg-slate-200 dark:bg-slate-700 animate-pulse mt-2" />
        </div>
      </div>
    </Card>
  );
}

/**
 * 읽을 책이 없을 때 표시하는 빈 상태 카드
 */
export function NoReadingBookCard() {
  return (
    <Link href="/books" className="block group">
      <Card className="p-4 border-dashed border-2 border-slate-200 dark:border-slate-700 hover:border-forest-300 dark:hover:border-forest-600 transition-colors duration-200">
        <div className="flex items-center gap-4">
          <div className="w-16 h-24 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-slate-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              아직 비어 있어요
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              씨앗을 심어볼까요
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-forest-500 transition-colors" />
        </div>
      </Card>
    </Link>
  );
}
