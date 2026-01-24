"use client";

import { useState, useTransition } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Check, Loader2, Settings2, Flame, Target, Trophy, Sparkles, TrendingUp } from "lucide-react";
import { updateBookProgress } from "@/app/actions/books";
import { toast } from "sonner";
import { TotalPagesEditor } from "./total-pages-editor";
import { cn } from "@/lib/utils";

interface ReadingProgressProps {
  userBookId: string;
  bookId?: string;
  isbn?: string | null;
  currentPage: number;
  totalPages: number | null | undefined;
  status: string;
  onUpdate?: (newPage: number) => void;
  onTotalPagesUpdate?: (newTotalPages: number | null) => void;
}

/**
 * 읽기 진행률 표시 및 업데이트 컴포넌트
 */
export function ReadingProgress({
  userBookId,
  bookId,
  isbn,
  currentPage: initialPage,
  totalPages: initialTotalPages,
  status,
  onUpdate,
  onTotalPagesUpdate,
}: ReadingProgressProps) {
  const [currentPage, setCurrentPage] = useState(initialPage || 0);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [inputValue, setInputValue] = useState(String(initialPage || 0));
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 총 페이지 수 업데이트 핸들러
  const handleTotalPagesUpdate = (newTotalPages: number | null) => {
    setTotalPages(newTotalPages);
    onTotalPagesUpdate?.(newTotalPages);
  };

  // 진행률 계산 (totalPages가 없으면 표시 불가)
  const progressPercent = totalPages && totalPages > 0
    ? Math.min(Math.round((currentPage / totalPages) * 100), 100)
    : null;

  // 완독 상태면 100%로 표시
  const displayPercent = status === "completed" ? 100 : progressPercent;

  const handleSave = () => {
    const newPage = parseInt(inputValue, 10);

    if (isNaN(newPage) || newPage < 0) {
      toast.error("올바른 페이지 수를 입력해주세요.");
      return;
    }

    startTransition(async () => {
      try {
        await updateBookProgress(userBookId, newPage);
        setCurrentPage(newPage);
        setIsEditing(false);
        onUpdate?.(newPage);
        toast.success("진행률이 업데이트되었습니다.");
      } catch (error) {
        toast.error("진행률 업데이트에 실패했습니다.");
      }
    });
  };

  const handleCancel = () => {
    setInputValue(String(currentPage));
    setIsEditing(false);
  };

  // 동기부여 메시지 생성 함수
  const getMotivationalMessage = (percent: number, remaining: number) => {
    if (percent === 0) return { icon: Sparkles, message: "첫 페이지를 펼쳐보세요!", color: "text-slate-500" };
    if (percent < 10) return { icon: Flame, message: "좋은 시작이에요!", color: "text-orange-500" };
    if (percent < 25) return { icon: TrendingUp, message: "순조로운 출발!", color: "text-blue-500" };
    if (percent < 50) return { icon: Target, message: `${remaining}페이지 더 읽으면 절반!`, color: "text-indigo-500" };
    if (percent < 75) return { icon: Flame, message: "절반을 넘었어요!", color: "text-amber-500" };
    if (percent < 90) return { icon: Trophy, message: "완독이 눈앞에!", color: "text-emerald-500" };
    return { icon: Sparkles, message: "거의 다 읽었어요!", color: "text-primary" };
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
            완독 완료
          </span>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">100%</span>
        </div>
        <div className="relative">
          <Progress value={100} className="h-2.5 bg-emerald-100 dark:bg-emerald-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" />
        </div>
        <p className="text-xs text-center text-emerald-600/80 dark:text-emerald-400/80 font-medium">
          축하합니다! 책을 완독하셨어요
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
          읽기 진행률
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

      {/* 진행률 바 */}
      {displayPercent !== null ? (
        <div className="space-y-2">
          <div className="relative">
            <Progress
              value={displayPercent}
              className={cn(
                "h-2.5 transition-all",
                displayPercent >= 75 ? "[&>div]:bg-emerald-500" :
                displayPercent >= 50 ? "[&>div]:bg-amber-500" :
                displayPercent >= 25 ? "[&>div]:bg-indigo-500" :
                "[&>div]:bg-blue-500"
              )}
            />
            {/* 마일스톤 마커 */}
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            <div className="absolute top-1/2 left-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            <div className="absolute top-1/2 left-3/4 -translate-y-1/2 w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          </div>

          {/* 동기부여 메시지 */}
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
            총 페이지 수를 설정하면 진행률을 확인할 수 있어요
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
            취소
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
                    ({remainingPages}p 남음)
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">페이지</span>
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
            진행률 수정
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
  // 완독 상태
  if (status === "completed") {
    return (
      <div className="flex items-center gap-1 text-xs text-primary">
        <Check className="h-3 w-3" />
        완독
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
