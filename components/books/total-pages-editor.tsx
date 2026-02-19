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
import { useTranslation } from "@/lib/i18n";

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
  const { t } = useTranslation();
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
      toast.error(t("books.pageRangeError"));
      return;
    }

    startTransition(async () => {
      try {
        const result = await updateBookTotalPages(bookId, newPages);

        if (result.success) {
          setTotalPages(newPages);
          setLastSource("manual");
          onUpdate?.(newPages);
          toast.success(t("books.pagesSavedSuccess"));
          setIsOpen(false);
        } else {
          toast.error(result.error || t("books.pagesSaveFailed"));
        }
      } catch (error) {
        toast.error(t("books.pageSaveError"));
      }
    });
  };

  // API에서 자동 조회
  const handleRefresh = async () => {
    if (!isbn) {
      toast.error(t("books.noIsbnError"));
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
          nl_seoji: t("books.sourceNlSeoji"),
          aladin: t("books.sourceAladin"),
          google_books: t("books.sourceGoogleBooks"),
        };
        const sourceName = result.source ? sourceNames[result.source] || result.source : t("books.sourceUnknown");

        toast.success(t("books.pageFoundSuccess", { count: result.pageCount, source: sourceName }));
      } else {
        toast.error(result.error || t("books.pageNotFoundError"));
      }
    } catch (error) {
      toast.error(t("books.pageLookupError"));
    } finally {
      setIsRefreshing(false);
    }
  };

  const sourceLabels: Record<string, { label: string; color: string }> = {
    nl_seoji: { label: t("books.sourceNlSeoji"), color: "bg-blue-100 text-blue-800" },
    aladin: { label: t("books.sourceAladin"), color: "bg-purple-100 text-purple-800" },
    google_books: { label: t("books.sourceGoogleBooks"), color: "bg-green-100 text-green-800" },
    manual: { label: t("books.sourceManual"), color: "bg-gray-100 text-gray-800" },
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
              {t("books.setPageCount")}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t("books.totalPagesSetting")}
          </DialogTitle>
          <DialogDescription>
            {t("books.totalPagesDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 현재 값 표시 */}
          {totalPages && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">{t("books.currentValue")}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{t("books.pagesCount", { count: totalPages })}</span>
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
              <Label className="text-sm font-medium">{t("books.autoLookup")}</Label>
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
                {t("books.autoLookupByIsbn")}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t("books.autoLookupDesc")}
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
                  {t("books.orDivider")}
                </span>
              </div>
            </div>
          )}

          {/* 수동 입력 */}
          <div className="space-y-2">
            <Label htmlFor="totalPages" className="text-sm font-medium">
              {t("books.manualInput")}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="totalPages"
                type="number"
                min={1}
                max={10000}
                placeholder={t("books.examplePages")}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isPending || isRefreshing}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">{t("books.pageUnit")}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isPending || isRefreshing}
          >
            {t("books.cancelLabel")}
          </Button>
          <Button onClick={handleSave} disabled={isPending || isRefreshing || !inputValue}>
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {t("books.saveLabel")}
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
  const { t } = useTranslation();
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
          <p>{t("books.totalPagesLabel", { count: totalPages })}</p>
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
  const { t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!isbn) {
      toast.error(t("books.noIsbnRefreshError"));
      return;
    }

    setIsRefreshing(true);

    try {
      const result = await refreshBookPageCount(bookId, isbn);

      if (result.success && result.pageCount) {
        onUpdate?.(result.pageCount);
        toast.success(`${result.pageCount}p (${result.source})`);
      } else {
        toast.error(result.error || t("books.refreshFailed"));
      }
    } catch {
      toast.error(t("books.refreshError"));
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
          <p>{t("books.refreshPageCount")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
