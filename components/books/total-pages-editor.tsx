"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  RefreshCw,
  Edit3,
  Loader2,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import {
  updateBookTotalPages,
  refreshBookPageCount,
} from "@/app/actions/books";
import { toast } from "sonner";

interface TotalPagesEditorProps {
  bookId: string;
  isbn?: string | null;
  totalPages: number | null | undefined;
  onUpdate?: (newTotalPages: number | null) => void;
}

/**
 * 총 페이지 수 편집기 컴포넌트
 * - 수동 입력
 * - API를 통한 자동 조회
 */
export function TotalPagesEditor({
  bookId,
  isbn,
  totalPages: initialTotalPages,
  onUpdate,
}: TotalPagesEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [inputValue, setInputValue] = useState(
    initialTotalPages?.toString() || ""
  );
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSource, setLastSource] = useState<string | null>(null);

  // 수동 저장
  const handleSave = () => {
    const newPages = parseInt(inputValue, 10);

    if (isNaN(newPages) || newPages < 1 || newPages > 10000) {
      toast.error("페이지 수는 1~10,000 사이여야 해요.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await updateBookTotalPages(bookId, newPages);

        if (result.success) {
          setTotalPages(newPages);
          setLastSource("manual");
          onUpdate?.(newPages);
          toast.success("페이지 수가 저장됐어요.");
          setIsOpen(false);
        } else {
          toast.error(result.error || "저장에 실패했어요.");
        }
      } catch (error) {
        toast.error("저장 중 오류가 생겼어요.");
      }
    });
  };

  // API에서 자동 조회
  const handleRefresh = async () => {
    if (!isbn) {
      toast.error("ISBN이 없어 자동 조회가 불가능해요.");
      return;
    }

    setIsRefreshing(true);

    try {
      const result = await refreshBookPageCount(bookId, isbn);

      if (result.success && result.pageCount) {
        setTotalPages(result.pageCount);
        setInputValue(result.pageCount.toString());
        setLastSource(result.source);
        onUpdate?.(result.pageCount);

        const sourceNames: Record<string, string> = {
          nl_seoji: "국립중앙도서관",
          aladin: "알라딘",
          google_books: "Google Books",
        };
        const sourceName = result.source ? sourceNames[result.source] || result.source : "알 수 없음";

        toast.success(`페이지 수를 찾았어요: ${result.pageCount}p (${sourceName})`);
      } else {
        toast.error(result.error || "페이지 수를 찾을 수 없어요.");
      }
    } catch (error) {
      toast.error("조회 중 오류가 생겼어요.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const sourceLabels: Record<string, { label: string; color: string }> = {
    nl_seoji: { label: "국립중앙도서관", color: "bg-blue-100 text-blue-800" },
    aladin: { label: "알라딘", color: "bg-purple-100 text-purple-800" },
    google_books: { label: "Google", color: "bg-green-100 text-green-800" },
    manual: { label: "수동 입력", color: "bg-gray-100 text-gray-800" },
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1 text-muted-foreground hover:text-foreground"
        >
          {totalPages ? (
            <span className="flex items-center gap-1 text-xs">
              <BookOpen className="h-3 w-3" />
              {totalPages}p
              <Edit3 className="h-3 w-3 ml-1" />
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs">
              <AlertCircle className="h-3 w-3" />
              페이지 수 설정
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            총 페이지 수 설정
          </DialogTitle>
          <DialogDescription>
            책의 총 페이지 수를 설정하면 읽기 진행률을 정확하게 추적할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 현재 값 표시 */}
          {totalPages && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">현재 설정값</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{totalPages} 페이지</span>
                {lastSource && sourceLabels[lastSource] && (
                  <Badge
                    variant="secondary"
                    className={`text-xs ${sourceLabels[lastSource].color}`}
                  >
                    {sourceLabels[lastSource].label}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* 자동 조회 버튼 */}
          {isbn && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">자동 조회</Label>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleRefresh}
                disabled={isRefreshing || isPending}
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                ISBN으로 페이지 수 자동 조회
              </Button>
              <p className="text-xs text-muted-foreground">
                국립중앙도서관, 알라딘, Google Books에서 검색합니다.
              </p>
            </div>
          )}

          {/* 구분선 */}
          {isbn && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  또는
                </span>
              </div>
            </div>
          )}

          {/* 수동 입력 */}
          <div className="space-y-2">
            <Label htmlFor="totalPages" className="text-sm font-medium">
              직접 입력
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="totalPages"
                type="number"
                min={1}
                max={10000}
                placeholder="예: 320"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isPending || isRefreshing}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">페이지</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isPending || isRefreshing}
          >
            취소
          </Button>
          <Button onClick={handleSave} disabled={isPending || isRefreshing || !inputValue}>
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 간단한 페이지 수 표시 (총 페이지 수만 표시, 편집 없음)
 */
export function TotalPagesBadge({
  totalPages,
}: {
  totalPages: number | null | undefined;
}) {
  if (!totalPages) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="text-xs">
            <BookOpen className="h-3 w-3 mr-1" />
            {totalPages}p
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>총 {totalPages} 페이지</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * 페이지 수 새로고침 버튼 (아이콘만)
 */
export function RefreshPageCountButton({
  bookId,
  isbn,
  onUpdate,
}: {
  bookId: string;
  isbn?: string | null;
  onUpdate?: (pageCount: number) => void;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!isbn) {
      toast.error("ISBN이 없어 조회할 수 없어요.");
      return;
    }

    setIsRefreshing(true);

    try {
      const result = await refreshBookPageCount(bookId, isbn);

      if (result.success && result.pageCount) {
        onUpdate?.(result.pageCount);
        toast.success(`${result.pageCount}p (${result.source})`);
      } else {
        toast.error(result.error || "조회 실패");
      }
    } catch {
      toast.error("오류 발생");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isbn) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>페이지 수 다시 조회</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
