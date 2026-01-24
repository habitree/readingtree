"use client";

import { useState, useTransition } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Check, Loader2, Settings2 } from "lucide-react";
import { updateBookProgress } from "@/app/actions/books";
import { toast } from "sonner";
import { TotalPagesEditor } from "./total-pages-editor";

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

  // 완독 상태면 편집 불가
  if (status === "completed") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            읽기 완료
          </span>
          <span className="font-medium text-primary">100%</span>
        </div>
        <Progress value={100} className="h-2" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
          <BookOpen className="h-4 w-4" />
          읽기 진행률
        </Label>
        {displayPercent !== null && (
          <span className="text-sm font-medium">{displayPercent}%</span>
        )}
      </div>

      {displayPercent !== null ? (
        <Progress value={displayPercent} className="h-2" />
      ) : (
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground flex-1">
            총 페이지 수가 설정되지 않았습니다.
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

      {isEditing ? (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            max={totalPages || undefined}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="h-8 w-20"
            disabled={isPending}
          />
          {totalPages && (
            <span className="text-sm text-muted-foreground">/ {totalPages} 페이지</span>
          )}
          <div className="flex-1" />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isPending}
          >
            취소
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm">
            {currentPage}
            {totalPages ? (
              <span className="text-muted-foreground"> / {totalPages} 페이지</span>
            ) : (
              <span className="text-muted-foreground"> 페이지</span>
            )}
          </span>
          {bookId && (
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
