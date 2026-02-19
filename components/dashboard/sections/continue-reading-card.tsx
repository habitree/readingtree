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
import { useTranslation } from "@/lib/i18n";

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
  const { t } = useTranslation();

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
        className="cursor-pointer h-full"
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

            <div className="relative px-2.5 py-2 flex flex-col h-full">
              {/* 상단: 책 표지 + 제목 */}
              <div className="flex items-start gap-2">
                {/* 책 표지 */}
                <div className="relative shrink-0">
                  <div className="relative w-10 h-[60px] rounded-md overflow-hidden shadow-sm">
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
                  <p className="text-[9px] font-medium text-forest-600 dark:text-forest-400 mb-0.5">
                    {t("dashboard.continueLabel")}
                  </p>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-forest-700 dark:group-hover:text-forest-300 transition-colors leading-tight">
                    {title}
                  </h3>
                  {author && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {author}
                    </p>
                  )}
                </div>
              </div>

              {/* 하단: 진행률 바 (수치 제거, 바만 유지) */}
              <div className="mt-auto pt-1.5">
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
                {t("dashboard.lastReadBook")}
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
 * 단계별 가이드 + CTA로 첫 행동 유도
 */
export function NoReadingBookCard() {
  const { t } = useTranslation();
  return (
    <Card className="p-5 sm:p-6 border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900">
      <div className="text-center space-y-4">
        {/* 일러스트 아이콘 */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-forest-50 dark:bg-forest-900/30 flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-forest-500" />
          </div>
        </div>

        {/* 메시지 */}
        <div>
          <p className="text-base font-semibold text-slate-900 dark:text-white">
            {t("dashboard.addFirstBookTitle")}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("dashboard.addFirstBookDesc")}
          </p>
        </div>

        {/* 단계별 가이드 */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-forest-50 dark:bg-forest-900/30 text-forest-700 dark:text-forest-400">
            {t("dashboard.addFirstBookStep1")}
          </span>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {t("dashboard.addFirstBookStep2")}
          </span>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {t("dashboard.addFirstBookStep3")}
          </span>
        </div>

        {/* CTA 버튼 */}
        <Link
          href="/books/search"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-forest-600 hover:bg-forest-700 text-white px-6 py-2.5 text-sm font-medium transition-colors duration-200 shadow-sm"
        >
          <BookOpen className="h-4 w-4" />
          {t("dashboard.addFirstBookCta")}
        </Link>
      </div>
    </Card>
  );
}
