"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Pencil, Calendar, Plus, X, BookOpen } from "lucide-react";
import { updateBookInfo } from "@/app/actions/books";
import { moveBookToBookshelf } from "@/app/actions/bookshelves";
import { getBookshelves } from "@/app/actions/bookshelves";
import { BookshelfSelector } from "@/components/bookshelves/bookshelf-selector";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Bookshelf } from "@/types/bookshelf";

interface BookInfoEditorProps {
  userBookId: string;
  currentReadingReason?: string | null;
  currentStartedAt?: string | null;
  currentCompletedDates?: string[] | null;
  currentBookshelfId?: string | null;
}

/**
 * 책 정보 편집 컴포넌트
 * 읽는 이유와 시작일을 편집할 수 있음
 */
export function BookInfoEditor({
  userBookId,
  currentReadingReason,
  currentStartedAt,
  currentCompletedDates,
  currentBookshelfId,
}: BookInfoEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [readingReason, setReadingReason] = useState(currentReadingReason || "");
  const [startedAt, setStartedAt] = useState(
    currentStartedAt ? new Date(currentStartedAt).toISOString().split("T")[0] : ""
  );
  const [completedDates, setCompletedDates] = useState<string[]>(
    currentCompletedDates && currentCompletedDates.length > 0
      ? currentCompletedDates.map((date) => new Date(date).toISOString().split("T")[0])
      : []
  );
  const [selectedBookshelfId, setSelectedBookshelfId] = useState<string>(
    currentBookshelfId || ""
  );
  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBookshelves, setIsLoadingBookshelves] = useState(true);

  useEffect(() => {
    async function loadBookshelves() {
      try {
        const data = await getBookshelves();
        setBookshelves(data);
        // 현재 서재가 없으면 메인 서재로 설정
        if (!selectedBookshelfId && data.length > 0) {
          const mainBookshelf = data.find((b) => b.is_main);
          if (mainBookshelf) {
            setSelectedBookshelfId(mainBookshelf.id);
          }
        }
      } catch (error) {
        console.error("서재 목록 조회 오류:", error);
      } finally {
        setIsLoadingBookshelves(false);
      }
    }
    if (open) {
      loadBookshelves();
    }
  }, [open, selectedBookshelfId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const startedAtISO = startedAt
        ? new Date(startedAt).toISOString()
        : null;

      const completedDatesISO = completedDates
        .filter((date) => date.trim() !== "")
        .map((date) => new Date(date).toISOString());

      // 책 정보 업데이트
      await updateBookInfo(
        userBookId,
        readingReason || null,
        startedAtISO,
        completedDatesISO.length > 0 ? completedDatesISO : null
      );

      // 서재 변경 (변경된 경우만)
      if (selectedBookshelfId && selectedBookshelfId !== currentBookshelfId) {
        await moveBookToBookshelf(userBookId, selectedBookshelfId);
      }

      toast.success("책 정보가 업데이트됐어요.");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "책 정보 업데이트에 실패했어요."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const addCompletedDate = () => {
    setCompletedDates([...completedDates, ""]);
  };

  const removeCompletedDate = (index: number) => {
    setCompletedDates(completedDates.filter((_, i) => i !== index));
  };

  const updateCompletedDate = (index: number, value: string) => {
    const newDates = [...completedDates];
    newDates[index] = value;
    setCompletedDates(newDates);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-4 w-4" />
          정보 수정
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>책 정보 수정</DialogTitle>
            <DialogDescription>
              읽는 이유, 시작일, 완독일자, 서재를 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bookshelf">서재</Label>
              {isLoadingBookshelves ? (
                <div className="h-10 bg-muted animate-pulse rounded-md" />
              ) : (
                <BookshelfSelector
                  value={selectedBookshelfId}
                  onValueChange={setSelectedBookshelfId}
                  placeholder="서재를 선택하세요"
                />
              )}
              <p className="text-xs text-muted-foreground">
                이 책이 속한 서재를 선택하세요.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reading-reason">읽는 이유</Label>
              <Textarea
                id="reading-reason"
                placeholder="이 책을 읽는 이유를 입력하세요..."
                value={readingReason}
                onChange={(e) => setReadingReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                이 책을 읽게 된 계기나 목적을 자유롭게 작성해주세요.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="started-at">시작일</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="started-at"
                  type="date"
                  value={startedAt}
                  onChange={(e) => setStartedAt(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                이 책을 읽기 시작한 날짜를 선택하세요.
              </p>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="completed-dates">완독일자</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCompletedDate}
                  disabled={isLoading}
                  className="h-8"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  추가
                </Button>
              </div>
              {completedDates.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">
                  완독일자가 없습니다. 추가 버튼을 눌러 완독일자를 등록하세요.
                </p>
              ) : (
                <div className="space-y-2">
                  {completedDates.map((date, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          value={date}
                          onChange={(e) => updateCompletedDate(index, e.target.value)}
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCompletedDate(index)}
                        disabled={isLoading}
                        className="h-10 w-10 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                여러 번 완독한 경우 각 완독일자를 추가할 수 있습니다.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

