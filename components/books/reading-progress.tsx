"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Check, Loader2, Settings2, Flame, Target, Trophy, Sparkles, TrendingUp, GripHorizontal, X, Send, Calendar } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { updateBookProgress } from "@/app/actions/books";
import { toast } from "sonner";
import { TotalPagesEditor } from "./total-pages-editor";
import { BookCompletionDialog } from "./book-completion-dialog";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface ReadingProgressProps {
  userBookId: string;
  bookId?: string;
  isbn?: string | null;
  bookTitle?: string;
  bookAuthor?: string | null;
  currentPage: number;
  totalPages: number | null | undefined;
  status: string;
  startedAt?: string | null;
  completedDates?: string[];
  onUpdate?: (newPage: number) => void;
  onTotalPagesUpdate?: (newTotalPages: number | null) => void;
  onRecordCreated?: () => void;
}

/**
 * 읽기 진행률 표시 및 업데이트 컴포넌트
 */
export function ReadingProgress({
  userBookId,
  bookId,
  isbn,
  bookTitle = "책",
  bookAuthor,
  currentPage: initialPage,
  totalPages: initialTotalPages,
  status,
  startedAt,
  completedDates,
  onUpdate,
  onTotalPagesUpdate,
  onRecordCreated,
}: ReadingProgressProps) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(initialPage || 0);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [inputValue, setInputValue] = useState(String(initialPage || 0));
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(initialPage || 0);
  const [isPending, startTransition] = useTransition();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 인라인 메모 관련 state
  const [showInlineMemo, setShowInlineMemo] = useState(false);
  const [inlineMemo, setInlineMemo] = useState("");
  const [pendingPageUpdate, setPendingPageUpdate] = useState<number | null>(null);
  const [isInlineSaving, setIsInlineSaving] = useState(false);

  // 완독 확인 다이얼로그
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

  // 읽기 모멘텀 통계 (hydration 안전: 클라이언트에서만 계산)
  const [momentumStats, setMomentumStats] = useState<{
    daysSinceStart: number;
    avgPagesPerDay: string | null;
  } | null>(null);

  useEffect(() => {
    if (startedAt && currentPage > 0) {
      const startDate = new Date(startedAt);
      const now = new Date();
      const days = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      setMomentumStats({
        daysSinceStart: days,
        avgPagesPerDay: (currentPage / days).toFixed(1),
      });
    }
  }, [startedAt, currentPage]);

  // 총 페이지 수 업데이트 핸들러
  const handleTotalPagesUpdate = (newTotalPages: number | null) => {
    setTotalPages(newTotalPages);
    onTotalPagesUpdate?.(newTotalPages);
  };

  // 진행률 계산 (totalPages가 없으면 표시 불가)
  const progressPercent = totalPages && totalPages > 0
    ? Math.min(Math.round((currentPage / totalPages) * 100), 100)
    : null;

  // 드래그 중일 때의 퍼센트
  const dragPercent = totalPages && totalPages > 0
    ? Math.min(Math.round((dragValue / totalPages) * 100), 100)
    : null;

  // 보류 중인 업데이트의 퍼센트
  const pendingPercent = pendingPageUpdate !== null && totalPages && totalPages > 0
    ? Math.min(Math.round((pendingPageUpdate / totalPages) * 100), 100)
    : null;

  // 완독 상태면 100%로 표시, 드래그 중이면 드래그 값, 보류 중이면 보류 값
  const displayPercent = status === "completed" ? 100 : (isDragging ? dragPercent : (pendingPercent ?? progressPercent));

  // 슬라이더 값 변경 핸들러 (드래그 중) - 페이지 기반
  const handleSliderChange = useCallback((value: number[]) => {
    if (!totalPages) return;
    setDragValue(value[0]);
    setIsDragging(true);
  }, [totalPages]);

  // 슬라이더 드래그 종료 핸들러 - 페이지 기반
  const handleSliderCommit = useCallback((value: number[]) => {
    if (!totalPages) return;
    const newPage = value[0];

    // 이전 타이머 취소
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsDragging(false);

    // 값이 변경되지 않았으면 저장하지 않음
    if (newPage === currentPage) return;

    // 인라인 메모 입력 UI 표시
    setPendingPageUpdate(newPage);
    setShowInlineMemo(true);
    setInlineMemo("");
  }, [totalPages, currentPage]);

  // 인라인 메모 없이 진행률만 저장
  const handleSaveProgressOnly = useCallback(async () => {
    if (pendingPageUpdate === null) return;

    setIsInlineSaving(true);
    try {
      const result = await updateBookProgress(userBookId, pendingPageUpdate);
      setCurrentPage(pendingPageUpdate);
      setInputValue(String(pendingPageUpdate));
      setDragValue(pendingPageUpdate);
      onUpdate?.(pendingPageUpdate);

      if (result.reachedEnd) {
        // 완독 확인 다이얼로그 표시
        setShowCompletionDialog(true);
      } else {
        toast.success(t("books.progressUpdatedTo", { page: pendingPageUpdate }));
      }

      setShowInlineMemo(false);
      setPendingPageUpdate(null);
    } catch (error) {
      toast.error(t("books.progressUpdateFailed"));
    } finally {
      setIsInlineSaving(false);
    }
  }, [pendingPageUpdate, userBookId, onUpdate, t]);

  // 인라인 메모와 함께 진행률 저장
  const handleSaveWithMemo = useCallback(async () => {
    if (pendingPageUpdate === null) return;

    setIsInlineSaving(true);
    try {
      // 진행률 업데이트
      const result = await updateBookProgress(userBookId, pendingPageUpdate);

      // 진행 기록 생성 (메모 포함)
      const { createNote } = await import("@/app/actions/notes");
      const content = inlineMemo.trim()
        ? JSON.stringify({ memo: inlineMemo.trim() })
        : null;

      await createNote({
        book_id: userBookId,
        type: "progress",
        content: content || undefined,
        page_number: String(pendingPageUpdate),
        is_public: true,
      });

      setCurrentPage(pendingPageUpdate);
      setInputValue(String(pendingPageUpdate));
      setDragValue(pendingPageUpdate);
      onUpdate?.(pendingPageUpdate);
      onRecordCreated?.();

      if (result.reachedEnd) {
        // 완독 확인 다이얼로그 표시
        setShowCompletionDialog(true);
      } else {
        toast.success(t("books.progressRecordSaved"));
      }

      setShowInlineMemo(false);
      setPendingPageUpdate(null);
      setInlineMemo("");
    } catch (error) {
      toast.error(t("books.saveFailed"));
    } finally {
      setIsInlineSaving(false);
    }
  }, [pendingPageUpdate, userBookId, inlineMemo, onUpdate, onRecordCreated, t]);

  // 인라인 메모 취소
  const handleCancelInlineMemo = useCallback(() => {
    setShowInlineMemo(false);
    setPendingPageUpdate(null);
    setInlineMemo("");
    setDragValue(currentPage);
  }, [currentPage]);

  const handleSave = () => {
    const newPage = parseInt(inputValue, 10);

    if (isNaN(newPage) || newPage < 0) {
      toast.error(t("books.invalidPageNumber"));
      return;
    }

    startTransition(async () => {
      try {
        const result = await updateBookProgress(userBookId, newPage);
        setCurrentPage(newPage);
        setDragValue(newPage);
        setIsEditing(false);
        onUpdate?.(newPage);

        if (result.reachedEnd) {
          setShowCompletionDialog(true);
        } else {
          toast.success(t("books.progressUpdatedSuccess"));
        }
      } catch (error) {
        toast.error(t("books.progressUpdateFailed"));
      }
    });
  };

  const handleCancel = () => {
    setInputValue(String(currentPage));
    setDragValue(currentPage);
    setIsEditing(false);
  };

  // 동기부여 메시지 생성 함수
  const getMotivationalMessage = (percent: number, remaining: number) => {
    if (percent === 0) return { icon: Sparkles, message: t("books.motivationFirstPage"), color: "text-slate-500" };
    if (percent < 10) return { icon: Flame, message: t("books.motivationGoodStart"), color: "text-orange-500" };
    if (percent < 25) return { icon: TrendingUp, message: t("books.motivationSmoothStart"), color: "text-blue-500" };
    if (percent < 50) return { icon: Target, message: t("books.motivationHalfway", { remaining }), color: "text-indigo-500" };
    if (percent < 75) return { icon: Flame, message: t("books.motivationOverHalf"), color: "text-amber-500" };
    if (percent < 90) return { icon: Trophy, message: t("books.motivationAlmostDone"), color: "text-emerald-500" };
    return { icon: Sparkles, message: t("books.motivationNearlyFinished"), color: "text-primary" };
  };

  // 진행률에 따른 색상 결정
  const getProgressColor = (percent: number) => {
    if (percent < 25) return "bg-blue-500";
    if (percent < 50) return "bg-indigo-500";
    if (percent < 75) return "bg-amber-500";
    return "bg-emerald-500";
  };

  // 남은 페이지 계산
  const remainingPages = totalPages ? totalPages - currentPage : 0;
  const pagesToHalf = totalPages ? Math.max(0, Math.ceil(totalPages / 2) - currentPage) : 0;

  // 완독 상태면 축하 메시지와 함께 표시
  if (status === "completed") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-2 font-medium">
            <Trophy className="h-4 w-4" />
            {t("books.readingComplete")}
          </span>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">100%</span>
        </div>
        <div className="relative">
          <Progress value={100} className="h-2.5 bg-emerald-100 dark:bg-emerald-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" />
        </div>
        <p className="text-xs text-center text-emerald-600/80 dark:text-emerald-400/80 font-medium">
          {t("books.congratsCompleted")}
        </p>
      </div>
    );
  }

  const motivation = displayPercent !== null ? getMotivationalMessage(displayPercent, pagesToHalf) : null;
  const MotivationIcon = motivation?.icon || Sparkles;

  return (
    <div className="space-y-3">
      {/* 헤더: 라벨 + 퍼센트 */}
      <div className="flex items-center justify-between">
        <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
          <BookOpen className="h-4 w-4" />
          {t("books.readingProgress")}
          {completedDates && completedDates.length > 0 && (
            <span className="ml-1 text-[11px] font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 px-1.5 py-0.5 rounded-full">
              {completedDates.length + 1}회독
            </span>
          )}
        </Label>
        {displayPercent !== null && (
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "text-lg font-bold transition-colors",
              displayPercent >= 75 ? "text-emerald-600 dark:text-emerald-400" :
              displayPercent >= 50 ? "text-amber-600 dark:text-amber-400" :
              displayPercent >= 25 ? "text-indigo-600 dark:text-indigo-400" :
              "text-blue-600 dark:text-blue-400"
            )}>
              {displayPercent}%
            </span>
          </div>
        )}
      </div>

      {/* 진행률 슬라이더 - 드래그 가능 */}
      {displayPercent !== null && totalPages ? (
        <div className="space-y-2">
          {/* 드래그 가능한 슬라이더 */}
          <div className="relative group">
            <Slider
              value={[isDragging ? dragValue : (pendingPageUpdate ?? currentPage)]}
              onValueChange={handleSliderChange}
              onValueCommit={handleSliderCommit}
              max={totalPages}
              step={1}
              disabled={isPending}
              className={cn(
                "w-full cursor-grab active:cursor-grabbing",
                isPending && "opacity-50 pointer-events-none"
              )}
              trackClassName="h-3 bg-slate-200 dark:bg-slate-700"
              rangeClassName={cn(
                "transition-colors",
                displayPercent >= 75
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                  : displayPercent >= 50
                    ? "bg-gradient-to-r from-amber-400 to-amber-600"
                    : displayPercent >= 25
                      ? "bg-gradient-to-r from-indigo-400 to-indigo-600"
                      : "bg-gradient-to-r from-blue-400 to-blue-600"
              )}
              thumbClassName={cn(
                "h-6 w-6 shadow-lg transition-all hover:scale-110 active:scale-95",
                displayPercent >= 75
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950"
                  : displayPercent >= 50
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-950"
                    : displayPercent >= 25
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
                      : "border-blue-500 bg-blue-50 dark:bg-blue-950"
              )}
            />

            {/* 마일스톤 마커 - 슬라이더 위에 오버레이 */}
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/60 dark:bg-slate-400/60 pointer-events-none z-10 shadow-sm" />
            <div className="absolute top-1/2 left-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/70 dark:bg-slate-400/70 pointer-events-none z-10 shadow-sm" />
            <div className="absolute top-1/2 left-3/4 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/60 dark:bg-slate-400/60 pointer-events-none z-10 shadow-sm" />

            {/* 드래그 힌트 - 처음 표시 시 */}
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <GripHorizontal className="w-3 h-3" />
              {t("books.dragToAdjust")}
            </div>
          </div>

          {/* 드래그 중 페이지 미리보기 */}
          {isDragging && (
            <div className="flex items-center justify-center gap-2 py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-medium animate-in fade-in duration-150">
              <span>{t("books.pagePreview", { page: dragValue })}</span>
              <span className="text-xs text-muted-foreground">({dragPercent}%)</span>
            </div>
          )}

          {/* 인라인 메모 입력 UI */}
          {showInlineMemo && pendingPageUpdate !== null && (
            <div className="p-3 rounded-lg bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200/50 dark:border-teal-800/50 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <span className="text-sm font-medium text-teal-700 dark:text-teal-300">
                    {t("books.updateToPage", { page: pendingPageUpdate })}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelInlineMemo}
                  disabled={isInlineSaving}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                placeholder={t("books.inlineMemoPlaceholder")}
                value={inlineMemo}
                onChange={(e) => setInlineMemo(e.target.value)}
                disabled={isInlineSaving}
                className="min-h-[60px] text-sm resize-none bg-white dark:bg-slate-900 border-teal-200/50 dark:border-teal-800/50 focus-visible:ring-teal-500"
                maxLength={200}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {inlineMemo.length}/200
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSaveProgressOnly}
                    disabled={isInlineSaving}
                    className="h-8 text-xs"
                  >
                    {isInlineSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      t("books.saveWithoutMemo")
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveWithMemo}
                    disabled={isInlineSaving}
                    className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    {isInlineSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5 mr-1" />
                        {t("books.saveRecord")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 동기부여 메시지 */}
          {motivation && !isDragging && !showInlineMemo && (
            <div className={cn("flex items-center gap-1.5 text-xs", motivation.color)}>
              <MotivationIcon className="h-3.5 w-3.5" />
              <span className="font-medium">{motivation.message}</span>
            </div>
          )}

        </div>
      ) : displayPercent !== null ? (
        <div className="space-y-2">
          <Progress
            value={displayPercent}
            className={cn(
              "h-2.5 transition-colors duration-150",
              displayPercent >= 75 ? "[&>div]:bg-emerald-500" :
              displayPercent >= 50 ? "[&>div]:bg-amber-500" :
              displayPercent >= 25 ? "[&>div]:bg-indigo-500" :
              "[&>div]:bg-blue-500"
            )}
          />
          {motivation && (
            <div className={cn("flex items-center gap-1.5 text-xs", motivation.color)}>
              <MotivationIcon className="h-3.5 w-3.5" />
              <span className="font-medium">{motivation.message}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground flex-1">
            {t("books.setTotalPagesHint")}
          </p>
          {bookId && (
            <TotalPagesEditor
              bookId={bookId}
              isbn={isbn}
              totalPages={totalPages}
              onUpdate={handleTotalPagesUpdate}
            />
          )}
        </div>
      )}

      {/* 읽기 모멘텀 통계 - 클라이언트에서만 표시 (hydration 안전) */}
      {momentumStats && !isDragging && !showInlineMemo && (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Calendar className="h-3 w-3 shrink-0" />
          <span>
            {t("books.readingDays", { days: momentumStats.daysSinceStart })}
            {momentumStats.avgPagesPerDay && <> · {t("books.avgPagesPerDay", { avg: momentumStats.avgPagesPerDay })}</>}
            {momentumStats.avgPagesPerDay && totalPages && remainingPages > 0 && (
              <> · {t("books.estimatedCompletion", { days: Math.ceil(remainingPages / Number(momentumStats.avgPagesPerDay)) })}</>
            )}
          </span>
        </div>
      )}

      {/* 완독 확인 다이얼로그 */}
      {showCompletionDialog && (
        <BookCompletionDialog
          open={showCompletionDialog}
          onOpenChange={setShowCompletionDialog}
          userBookId={userBookId}
          bookTitle={bookTitle}
          bookAuthor={bookAuthor}
          onCompleted={() => {
            window.location.reload();
          }}
        />
      )}

      {/* 페이지 수정 UI */}
      {isEditing ? (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
          <Input
            type="number"
            min={0}
            max={totalPages || undefined}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="h-8 w-20 text-center"
            disabled={isPending}
            autoFocus
          />
          {totalPages && (
            <span className="text-sm text-muted-foreground">/ {totalPages}p</span>
          )}
          <div className="flex-1" />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isPending}
            className="h-8 px-2"
          >
            {t("books.cancelLabel")}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="h-8 px-3"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          {/* 현재 페이지 / 총 페이지 */}
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-semibold">{currentPage}</span>
            {totalPages ? (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="text-muted-foreground">{totalPages}p</span>
                {remainingPages > 0 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    {t("books.remainingPages", { count: remainingPages })}
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">{t("books.pageUnit")}</span>
            )}
          </div>
          {bookId && displayPercent !== null && (
            <TotalPagesEditor
              bookId={bookId}
              isbn={isbn}
              totalPages={totalPages}
              onUpdate={handleTotalPagesUpdate}
            />
          )}
          <div className="flex-1" />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="h-8 text-xs"
          >
            {t("books.editProgress")}
          </Button>
        </div>
      )}

    </div>
  );
}

/**
 * 간단한 진행률 표시 (목록용)
 */
export function ReadingProgressBadge({
  currentPage,
  totalPages,
  status,
}: {
  currentPage: number;
  totalPages: number | null | undefined;
  status: string;
}) {
  const { t } = useTranslation();
  // 완독 상태
  if (status === "completed") {
    return (
      <div className="flex items-center gap-1 text-xs text-primary">
        <Check className="h-3 w-3" />
        {t("books.completedBadge")}
      </div>
    );
  }

  // 진행률 계산
  if (!totalPages || totalPages <= 0) {
    return null;
  }

  const percent = Math.min(Math.round((currentPage / totalPages) * 100), 100);

  if (percent === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5">
      <Progress value={percent} className="h-1.5 w-12" />
      <span className="text-xs text-muted-foreground">{percent}%</span>
    </div>
  );
}
