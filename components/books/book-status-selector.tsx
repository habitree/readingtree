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

const statusConfig: Record<
  ReadingStatus,
  { label: string; icon: React.ElementType; dotColor: string }
> = {
  not_started: { label: "읽을 예정", icon: BookOpen, dotColor: "bg-gray-400" },
  reading: { label: "읽는 중", icon: BookMarked, dotColor: "bg-blue-500" },
  completed: { label: "완독", icon: Trophy, dotColor: "bg-emerald-500" },
  rereading: { label: "재독", icon: RotateCcw, dotColor: "bg-purple-500" },
  paused: { label: "쉬는 중", icon: Pause, dotColor: "bg-amber-500" },
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
      toast.success("상태가 변경됐어요.");
      router.refresh();
    } catch (error) {
      console.error("상태 변경 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "상태 변경에 실패했어요."
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
      toast.success("서재가 변경됐어요.");
      router.refresh();
    } catch (error) {
      console.error("서재 변경 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "서재 변경에 실패했어요."
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

  const current = statusConfig[currentStatus];
  const currentBookshelf = bookshelves.find((b) => b.id === currentBookshelfId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isUpdating} className="gap-2">
          {isUpdating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="text-sm">변경 중...</span>
            </>
          ) : (
            <>
              <span className={`w-2 h-2 rounded-full shrink-0 ${current.dotColor}`} />
              <span className="text-sm">{current.label}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-52" align="end">
        {/* 독서 상태 */}
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          독서 상태
        </DropdownMenuLabel>
        {statusOptions.map((value) => {
          const config = statusConfig[value];
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
              <span className="flex-1">{config.label}</span>
              {isActive && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}

        {/* 서재 이동 */}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal flex items-center gap-1.5">
          <Library className="h-3 w-3" />
          서재 이동
          {currentBookshelf && (
            <span className="text-[10px] opacity-60">· 현재: {currentBookshelf.name}</span>
          )}
        </DropdownMenuLabel>
        {isLoadingBookshelves ? (
          <DropdownMenuItem disabled>
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            불러오는 중...
          </DropdownMenuItem>
        ) : bookshelves.length === 0 ? (
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            등록된 서재가 없습니다
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
