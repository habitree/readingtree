"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { updateBookStatus } from "@/app/actions/books";
import { moveBookToBookshelf, getBookshelves } from "@/app/actions/bookshelves";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import type { ReadingStatus } from "@/types/book";
import { Bookshelf } from "@/types/bookshelf";
import {
  Loader2,
  BookOpen,
  BookMarked,
  Trophy,
  Pause,
  RotateCcw,
  ChevronDown,
  Library,
  Check,
} from "lucide-react";

interface BookStatusSelectorProps {
  currentStatus: ReadingStatus;
  userBookId: string;
  currentBookshelfId?: string | null;
}

const statusIcons: Record<ReadingStatus, { icon: React.ElementType; dotColor: string }> = {
  not_started: { icon: BookOpen, dotColor: "bg-gray-400" },
  reading: { icon: BookMarked, dotColor: "bg-blue-500" },
  completed: { icon: Trophy, dotColor: "bg-emerald-500" },
  rereading: { icon: RotateCcw, dotColor: "bg-purple-500" },
  paused: { icon: Pause, dotColor: "bg-amber-500" },
};

const statusLabelKeys: Record<ReadingStatus, string> = {
  not_started: "books.statusNotStarted",
  reading: "books.statusReading",
  completed: "books.statusCompleted",
  rereading: "books.statusRereading",
  paused: "books.statusPaused",
};

/**
 * 독서 상태 변경 컴포넌트
 * US-009: 독서 상태 관리
 */
export function BookStatusSelector({
  currentStatus,
  userBookId,
  currentBookshelfId,
}: BookStatusSelectorProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([]);
  const [isLoadingBookshelves, setIsLoadingBookshelves] = useState(false);

  useEffect(() => {
    loadBookshelves();
  }, []);

  const loadBookshelves = async () => {
    setIsLoadingBookshelves(true);
    try {
      const data = await getBookshelves();
      setBookshelves(data);
    } catch (error) {
      console.error("서재 목록 조회 오류:", error);
    } finally {
      setIsLoadingBookshelves(false);
    }
  };

  const handleStatusChange = async (status: ReadingStatus) => {
    if (status === currentStatus) return;

    setIsUpdating(true);
    try {
      await updateBookStatus(userBookId, status);
      toast.success(t("books.statusChangedSuccess"));
      router.refresh();
    } catch (error) {
      console.error("상태 변경 오류:", error);
      toast.error(
        error instanceof Error ? error.message : t("books.statusChangeFailed")
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBookshelfChange = async (bookshelfId: string) => {
    if (!bookshelfId || bookshelfId === currentBookshelfId) {
      return;
    }

    setIsUpdating(true);
    try {
      await moveBookToBookshelf(userBookId, bookshelfId);
      toast.success(t("books.shelfChangedSuccess"));
      router.refresh();
    } catch (error) {
      console.error("서재 변경 오류:", error);
      toast.error(
        error instanceof Error ? error.message : t("books.shelfChangeFailed")
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const statusOptions: ReadingStatus[] = [
    "not_started",
    "reading",
    "completed",
    "rereading",
    "paused",
  ];

  const current = statusIcons[currentStatus];
  const currentLabel = t(statusLabelKeys[currentStatus] as any);
  const currentBookshelf = bookshelves.find((b) => b.id === currentBookshelfId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isUpdating} className="gap-2">
          {isUpdating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="text-sm">{t("books.changingStatus")}</span>
            </>
          ) : (
            <>
              <span className={`w-2 h-2 rounded-full shrink-0 ${current.dotColor}`} />
              <span className="text-sm">{currentLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-52" align="end">
        {/* 독서 상태 */}
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          {t("books.readingStatus")}
        </DropdownMenuLabel>
        {statusOptions.map((value) => {
          const config = statusIcons[value];
          const Icon = config.icon;
          const isActive = value === currentStatus;
          return (
            <DropdownMenuItem
              key={value}
              onClick={() => handleStatusChange(value)}
              disabled={isActive || isUpdating}
              className="gap-2.5"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${config.dotColor}`} />
              <Icon className="h-3.5 w-3.5 shrink-0 opacity-60" />
              <span className="flex-1">{t(statusLabelKeys[value] as any)}</span>
              {isActive && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}

        {/* 서재 이동 */}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal flex items-center gap-1.5">
          <Library className="h-3 w-3" />
          {t("books.moveToShelfLabel")}
          {currentBookshelf && (
            <span className="text-[10px] opacity-60">· {t("books.currentShelf", { name: currentBookshelf.name })}</span>
          )}
        </DropdownMenuLabel>
        {isLoadingBookshelves ? (
          <DropdownMenuItem disabled>
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            {t("books.loadingBookshelves")}
          </DropdownMenuItem>
        ) : bookshelves.length === 0 ? (
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            {t("books.noShelvesRegistered")}
          </DropdownMenuItem>
        ) : (
          bookshelves.map((bookshelf) => {
            const isActive = bookshelf.id === currentBookshelfId;
            return (
              <DropdownMenuItem
                key={bookshelf.id}
                onClick={() => handleBookshelfChange(bookshelf.id)}
                disabled={isActive || isUpdating}
                className="gap-2.5"
              >
                <BookOpen className="h-3.5 w-3.5 shrink-0 opacity-60" />
                <span className="flex-1">{bookshelf.name}</span>
                {isActive && <Check className="h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
