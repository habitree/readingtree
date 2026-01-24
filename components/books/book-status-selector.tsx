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
import { BookStatusBadge } from "./book-status-badge";
import type { ReadingStatus } from "@/types/book";
import { Bookshelf } from "@/types/bookshelf";
import { Loader2, BookOpen } from "lucide-react";

interface BookStatusSelectorProps {
  currentStatus: ReadingStatus;
  userBookId: string;
  currentBookshelfId?: string | null;
}

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
    // 컴포넌트 마운트 시 서재 목록 로드
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
      toast.success("상태가 변경되었습니다.");
      router.refresh();
    } catch (error) {
      console.error("상태 변경 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "상태 변경에 실패했습니다."
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
      toast.success("저장됨");
      router.refresh();
    } catch (error) {
      console.error("서재 변경 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "서재 변경에 실패했습니다."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const statusOptions: Array<{ value: ReadingStatus; label: string }> = [
    { value: "not_started", label: "읽기전" },
    { value: "reading", label: "읽는 중" },
    { value: "completed", label: "완독" },
    { value: "rereading", label: "재독" },
    { value: "paused", label: "중단" },
  ];

  const currentBookshelf = bookshelves.find((b) => b.id === currentBookshelfId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isUpdating}>
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              변경 중...
            </>
          ) : (
            <>
              상태 변경
              <BookStatusBadge status={currentStatus} className="ml-2" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>독서 상태</DropdownMenuLabel>
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            disabled={option.value === currentStatus || isUpdating}
            className={option.value === currentStatus ? "bg-accent" : ""}
          >
            {option.label}
            {option.value === currentStatus && " ✓"}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>서재</DropdownMenuLabel>
        {isLoadingBookshelves ? (
          <DropdownMenuItem disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            로딩 중...
          </DropdownMenuItem>
        ) : bookshelves.length === 0 ? (
          <DropdownMenuItem disabled>서재가 없습니다</DropdownMenuItem>
        ) : (
          bookshelves.map((bookshelf) => (
            <DropdownMenuItem
              key={bookshelf.id}
              onClick={() => handleBookshelfChange(bookshelf.id)}
              disabled={bookshelf.id === currentBookshelfId || isUpdating}
              className={bookshelf.id === currentBookshelfId ? "bg-accent" : ""}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              {bookshelf.name}
              {bookshelf.id === currentBookshelfId && " ✓"}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

