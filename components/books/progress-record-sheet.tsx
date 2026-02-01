"use client";

import { useState, useTransition } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Loader2,
  Share2,
  Lock,
  Globe,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { createNote } from "@/app/actions/notes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProgressRecordSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userBookId: string;
  bookTitle: string;
  bookAuthor: string | null;
  currentPage: number;
  totalPages: number | null;
  onSuccess?: () => void;
}

/**
 * 간단한 진행 기록 시트
 * - 읽은 페이지 자동 표시
 * - 한 줄 메모 (선택)
 * - 공개 여부 설정
 * - 심플한 저장
 */
export function ProgressRecordSheet({
  open,
  onOpenChange,
  userBookId,
  bookTitle,
  bookAuthor,
  currentPage,
  totalPages,
  onSuccess,
}: ProgressRecordSheetProps) {
  const [memo, setMemo] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isPending, startTransition] = useTransition();

  const progressPercent = totalPages && totalPages > 0
    ? Math.min(Math.round((currentPage / totalPages) * 100), 100)
    : null;

  const handleSave = () => {
    startTransition(async () => {
      try {
        await createNote({
          book_id: userBookId,
          type: "progress",
          page_number: String(currentPage),
          memo_content: memo.trim() || undefined,
          is_public: isPublic,
        });

        toast.success("진행 기록이 저장되었습니다!");
        setMemo("");
        onOpenChange(false);
        onSuccess?.();
      } catch (error) {
        console.error("진행 기록 저장 실패:", error);
        toast.error("저장에 실패했습니다. 다시 시도해주세요.");
      }
    });
  };

  const getProgressMessage = () => {
    if (!progressPercent) return "읽기 시작!";
    if (progressPercent < 25) return "좋은 시작이에요!";
    if (progressPercent < 50) return "순조롭게 진행 중!";
    if (progressPercent < 75) return "절반을 넘었어요!";
    if (progressPercent < 100) return "완독이 눈앞에!";
    return "완독을 축하해요!";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh]">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-forest-500" />
            진행 기록
          </SheetTitle>
          <SheetDescription>
            현재 읽은 페이지를 기록하고 공유해보세요
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 pb-6">
          {/* 책 정보 + 진행률 */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                  {bookTitle}
                </h3>
                {bookAuthor && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {bookAuthor}
                  </p>
                )}
              </div>
              {progressPercent !== null && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "shrink-0 font-bold",
                    progressPercent >= 75
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                      : progressPercent >= 50
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  )}
                >
                  {progressPercent}%
                </Badge>
              )}
            </div>

            {/* 페이지 정보 */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-forest-100 dark:bg-forest-900 text-forest-700 dark:text-forest-300 px-3 py-1.5 rounded-lg">
                  <span className="text-xl font-bold">{currentPage}</span>
                  {totalPages && (
                    <span className="text-sm text-forest-600 dark:text-forest-400">
                      {" "}/ {totalPages}p
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                {progressPercent !== null && progressPercent >= 50 ? (
                  <Sparkles className="h-4 w-4 text-amber-500" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                )}
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  {getProgressMessage()}
                </span>
              </div>
            </div>
          </div>

          {/* 한 줄 메모 (선택) */}
          <div className="space-y-2">
            <Label htmlFor="memo" className="text-sm text-slate-600 dark:text-slate-400">
              한 줄 메모 <span className="text-slate-400">(선택)</span>
            </Label>
            <Textarea
              id="memo"
              placeholder="오늘의 독서 한 줄..."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="resize-none h-20"
              maxLength={200}
            />
            <p className="text-xs text-right text-slate-400">
              {memo.length}/200
            </p>
          </div>

          {/* 공개 여부 */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Globe className="h-4 w-4 text-forest-500" />
              ) : (
                <Lock className="h-4 w-4 text-slate-400" />
              )}
              <Label htmlFor="public" className="text-sm font-medium cursor-pointer">
                {isPublic ? "전체 공개" : "나만 보기"}
              </Label>
            </div>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {/* 저장 버튼 */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isPending}
            >
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending}
              className="flex-1 bg-forest-600 hover:bg-forest-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  저장 중...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  기록하기
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
