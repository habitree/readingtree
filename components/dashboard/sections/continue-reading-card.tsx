"use client";

import { useState, useCallback, useEffect, useRef, memo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, ChevronRight, Loader2, Check, Search, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAuthor } from "@/lib/utils/book";
import { useHapticFeedback } from "@/components/ui/touch-feedback";
import { useTranslation } from "@/lib/i18n";
import { formatSmartDate } from "@/lib/utils/date";
import { updateBookProgress } from "@/app/actions/books";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { toast } from "sonner";
import { BookCompletionDialog } from "@/components/books/book-completion-dialog";

interface ContinueReadingCardProps {
  userBookId: string;
  bookId?: string;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  currentPage: number;
  totalPages: number | null;
  progressPercent: number;
  lastRecordedAt?: string | null;
  compact?: boolean;
  priority?: boolean;
}

/**
 * 계속 읽기 카드 - 마지막 읽던 책으로 바로 이동하는 CTA
 * compact 모드: 여러 책이 있을 때 작은 카드로 표시 + 인라인 진행률 업데이트
 */
export const ContinueReadingCard = memo(function ContinueReadingCard({
  userBookId,
  bookId,
  title,
  author,
  coverImageUrl,
  currentPage,
  totalPages,
  progressPercent,
  lastRecordedAt,
  compact = false,
  priority = false,
}: ContinueReadingCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [pageInput, setPageInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [localPage, setLocalPage] = useState(currentPage);
  const [localProgress, setLocalProgress] = useState(progressPercent);
  const inputRef = useRef<HTMLInputElement>(null);
  const { lightTap } = useHapticFeedback();
  const { t } = useTranslation();
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

  const handleStartReading = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const { setActiveBook, openTimerSheet } = useMusicPlayer.getState();
    setActiveBook({
      userBookId,
      bookId: bookId || userBookId,
      title,
      coverUrl: coverImageUrl,
    });
    openTimerSheet();
  }, [userBookId, bookId, title, coverImageUrl]);

  // 뒤로가기 등으로 경로가 변경되면 네비게이션 상태 리셋
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isNavigating || isEditing) return;

    setIsNavigating(true);
    lightTap();

    // 전역 네비게이션 이벤트 발생
    window.dispatchEvent(new CustomEvent("navigation-start", { detail: { path: `/books/${userBookId}` } }));

    router.push(`/books/${userBookId}`);
  }, [router, userBookId, isNavigating, isEditing, lightTap]);

  // 진행률 바 클릭 → 인라인 편집 모드
  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsEditing(true);
    setPageInput(String(localPage || ""));
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [localPage]);

  // 진행률 저장
  const handleSavePage = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const page = parseInt(pageInput, 10);
    if (isNaN(page) || page < 0) {
      setIsEditing(false);
      return;
    }
    if (totalPages && page > totalPages) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    // 낙관적 업데이트
    setLocalPage(page);
    const newProgress = totalPages ? Math.round((page / totalPages) * 100) : localProgress;
    setLocalProgress(newProgress);

    try {
      const result = await updateBookProgress(userBookId, page);
      if (result.reachedEnd) {
        setShowCompletionDialog(true);
      } else {
        toast.success(t("dashboard.updatePageSuccess"));
      }
    } catch {
      // 롤백
      setLocalPage(currentPage);
      setLocalProgress(progressPercent);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  }, [pageInput, totalPages, localProgress, userBookId, t, currentPage, progressPercent]);

  const completionDialog = showCompletionDialog ? (
    <BookCompletionDialog
      open={showCompletionDialog}
      onOpenChange={setShowCompletionDialog}
      userBookId={userBookId}
      bookTitle={title}
      bookAuthor={author}
      bookCoverUrl={coverImageUrl}
      onCompleted={() => {
        window.location.reload();
      }}
    />
  ) : null;

  // compact 모드: 세로 레이아웃의 작은 카드 + 인라인 진행률
  if (compact) {
    return (
      <>{completionDialog}<motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        whileTap={isEditing ? undefined : { scale: 0.98 }}
        onClick={isEditing ? undefined : handleClick}
        className={cn("h-full", !isEditing && "cursor-pointer")}
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
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-forest-600 dark:text-forest-400 mb-0.5">
                        {t("dashboard.continueLabel")}
                      </p>
                      <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-forest-700 dark:group-hover:text-forest-300 transition-colors leading-tight">
                        {title}
                      </h3>
                    </div>
                    <button
                      onClick={handleStartReading}
                      className="shrink-0 p-1.5 rounded-lg bg-forest-50 dark:bg-forest-900/30 hover:bg-forest-100 dark:hover:bg-forest-800/50 text-forest-600 dark:text-forest-400 transition-colors"
                      aria-label="독서 타이머 시작"
                    >
                      <Timer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {author && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {author}
                    </p>
                  )}
                  {lastRecordedAt && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5" suppressHydrationWarning>
                      {formatSmartDate(lastRecordedAt)}에 읽음
                    </p>
                  )}
                </div>
              </div>

              {/* 하단: 클릭 가능한 진행률 바 + 인라인 편집 */}
              <div className="mt-auto pt-1.5">
                {isEditing ? (
                  <form
                    onSubmit={handleSavePage}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1"
                  >
                    <Input
                      ref={inputRef}
                      type="number"
                      min={0}
                      max={totalPages || undefined}
                      value={pageInput}
                      onChange={(e) => setPageInput(e.target.value)}
                      onBlur={() => handleSavePage()}
                      placeholder={t("dashboard.updatePagePlaceholder")}
                      className="h-6 text-[11px] px-1.5 w-full"
                      disabled={isSaving}
                    />
                    {totalPages && (
                      <span className="text-[11px] text-slate-400 shrink-0">/{totalPages}</span>
                    )}
                  </form>
                ) : (
                  <button
                    onClick={handleProgressClick}
                    className="w-full text-left group/progress"
                    aria-label={t("dashboard.updatePagePlaceholder")}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] text-slate-400 group-hover/progress:text-forest-500 transition-colors">
                        {localPage}{totalPages ? `/${totalPages}` : ""}p
                      </span>
                    </div>
                    <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden group-hover/progress:bg-slate-300 dark:group-hover/progress:bg-slate-600 transition-colors">
                      <div
                        className="h-full bg-forest-400 rounded-full transition-all duration-300"
                        style={{ width: `${localProgress}%` }}
                      />
                    </div>
                  </button>
                )}
              </div>
            </div>
          </Card>
      </motion.div></>
    );
  }

  // 기본 모드: 가로 레이아웃의 큰 카드
  return (
    <>{completionDialog}<motion.div
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
              {lastRecordedAt && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5" suppressHydrationWarning>
                  {formatSmartDate(lastRecordedAt)}에 읽음
                </p>
              )}

              {/* 진행률 바 */}
              <div className="mt-2">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] text-slate-400">
                    {localPage}{totalPages ? `/${totalPages}` : ""}p
                  </span>
                </div>
                <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-forest-400 rounded-full transition-all duration-300"
                    style={{ width: `${localProgress}%` }}
                  />
                </div>
              </div>
            </div>

          {/* CTA: ChevronRight */}
          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-forest-500 transition-colors shrink-0" />
        </div>
      </Card>
    </motion.div></>
  );
});

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
 * 데모 이어읽기 미리보기 + 단계별 가이드 + CTA로 첫 행동 유도
 */
export function NoReadingBookCard() {
  const { t } = useTranslation();

  // 데모 이어읽기 카드 데이터
  const demoBooks = [
    { title: "어린 왕자", author: "생텍쥐페리", currentPage: 45, totalPages: 150, progress: 30 },
    { title: "달러구트 꿈 백화점", author: "이미예", currentPage: 120, totalPages: 320, progress: 38 },
  ];

  return (
    <Card className="p-5 sm:p-6 border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900">
      <div className="space-y-4">
        {/* 데모 이어읽기 미리보기 */}
        <div className="relative">
          <div className="opacity-40 pointer-events-none select-none blur-[0.5px]">
            <div className="grid grid-cols-2 gap-2">
              {demoBooks.map((book) => (
                <div
                  key={book.title}
                  className="rounded-lg border border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-800/50 p-2.5"
                >
                  <div className="flex items-start gap-2">
                    <div className="shrink-0 w-8 h-[48px] rounded bg-gradient-to-br from-forest-100 to-forest-200 dark:from-forest-800 dark:to-forest-900 flex items-center justify-center">
                      <BookOpen className="h-3 w-3 text-forest-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-forest-600 dark:text-forest-400 font-medium">{t("dashboard.continueLabel")}</p>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{book.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{formatAuthor(book.author)}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[9px] text-slate-400">{book.currentPage}/{book.totalPages}p</span>
                    </div>
                    <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-forest-400 rounded-full" style={{ width: `${book.progress}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* 오버레이 힌트 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-slate-200/60 dark:border-slate-700/60">
              {t("empty.demoContinueReadingHint")}
            </span>
          </div>
        </div>

        {/* 메시지 */}
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-2xl bg-forest-50 dark:bg-forest-900/30 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-forest-500" />
            </div>
          </div>
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

        {/* CTA 버튼 2개 병렬 배치 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <Link
            href="/books/search"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-forest-600 hover:bg-forest-700 text-white px-6 py-2.5 text-sm font-medium transition-colors duration-200 shadow-sm w-full sm:w-auto"
          >
            <BookOpen className="h-4 w-4" />
            {t("dashboard.addFirstBookCta")}
          </Link>
          <Link
            href="/books/search"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-forest-300 dark:border-forest-700 bg-white dark:bg-slate-800 hover:bg-forest-50 dark:hover:bg-forest-900/20 text-forest-700 dark:text-forest-300 px-6 py-2.5 text-sm font-medium transition-colors duration-200 w-full sm:w-auto"
          >
            <Search className="h-4 w-4" />
            {t("dashboard.findBooksToRead")}
          </Link>
        </div>
      </div>
    </Card>
  );
}
