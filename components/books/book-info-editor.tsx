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
import { useTranslation } from "@/lib/i18n";
import { Bookshelf } from "@/types/bookshelf";

interface BookInfoEditorProps {
  userBookId: string;
  currentReadingReason?: string | null;
  currentStartedAt?: string | null;
  currentCompletedDates?: string[] | null;
  currentBookshelfId?: string | null;
  /** 아이콘만 표시 (히어로 섹션용) */
  iconOnly?: boolean;
}

/**
 * YYYY-MM-DD 형식의 날짜 문자열 배열을 과거 → 최근 순으로 정렬.
 * 빈 문자열은 정렬 안정성을 위해 뒤로 보낸다.
 */
function sortDatesAsc(dates: string[]): string[] {
  return [...dates].sort((a, b) => {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return a.localeCompare(b);
  });
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
  iconOnly = false,
}: BookInfoEditorProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [readingReason, setReadingReason] = useState(currentReadingReason || "");
  const [startedAt, setStartedAt] = useState(
    currentStartedAt ? new Date(currentStartedAt).toISOString().split("T")[0] : ""
  );
  const [completedDates, setCompletedDates] = useState<string[]>(
    currentCompletedDates && currentCompletedDates.length > 0
      ? sortDatesAsc(
          currentCompletedDates.map((date) => new Date(date).toISOString().split("T")[0])
        )
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

      const completedDatesISO = sortDatesAsc(
        completedDates.filter((date) => date.trim() !== "")
      ).map((date) => new Date(date).toISOString());

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

      toast.success(t("books.bookInfoUpdatedSuccess"));
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("books.bookInfoUpdateFailed")
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
    setCompletedDates(sortDatesAsc(newDates));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {iconOnly ? (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
            <Pencil className="h-3.5 w-3.5" />
            <span className="sr-only">{t("books.editInfo")}</span>
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Pencil className="mr-2 h-4 w-4" />
            {t("books.editInfo")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("books.editBookInfo")}</DialogTitle>
            <DialogDescription>
              {t("books.editBookInfoDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bookshelf">{t("books.shelfLabel")}</Label>
              {isLoadingBookshelves ? (
                <div className="h-10 bg-muted animate-pulse rounded-md" />
              ) : (
                <BookshelfSelector
                  value={selectedBookshelfId}
                  onValueChange={setSelectedBookshelfId}
                  placeholder={t("books.selectShelfPlaceholder")}
                />
              )}
              <p className="text-xs text-muted-foreground">
                {t("books.selectShelfDesc")}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reading-reason">{t("books.readingReasonLabel")}</Label>
              <Textarea
                id="reading-reason"
                placeholder={t("books.readingReasonPlaceholder")}
                value={readingReason}
                onChange={(e) => setReadingReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {t("books.readingReasonDesc")}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="started-at">{t("books.startDateLabel")}</Label>
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
                {t("books.startDateDesc")}
              </p>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="completed-dates">{t("books.completedDatesLabel")}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCompletedDate}
                  disabled={isLoading}
                  className="h-8"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {t("books.addLabel")}
                </Button>
              </div>
              {completedDates.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">
                  {t("books.noCompletedDatesMessage")}
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
                {t("books.completedDatesDesc")}
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
              {t("books.cancelLabel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t("books.savingLabel") : t("books.saveLabel")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

