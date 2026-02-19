"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  BookOpen,
  Plus,
  Check,
  Loader2,
  Library,
  Filter,
} from "lucide-react";
import Image from "next/image";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { BookStatusBadge } from "@/components/books/book-status-badge";
import type { ReadingStatus } from "@/types/book";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserBook {
  id: string;
  status: ReadingStatus;
  books: {
    id: string;
    title: string;
    author: string | null;
    cover_image_url: string | null;
    publisher?: string | null;
  };
}

interface UserBookSelectDialogProps {
  /** 다이얼로그 트리거 버튼 (children) */
  children?: React.ReactNode;
  /** 책 목록 */
  books: UserBook[];
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 이미 선택된 책 ID 목록 (제외할 책) */
  excludeBookIds?: Set<string>;
  /** 책 선택 시 콜백 */
  onSelect: (userBook: UserBook) => void;
  /** 선택 중 상태 */
  isSelecting?: boolean;
  /** 다이얼로그 제목 */
  title?: string;
  /** 다이얼로그 설명 */
  description?: string;
  /** 선택 버튼 텍스트 */
  selectButtonText?: string;
}

function BookCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[3/4] w-full" />
      <CardContent className="p-3">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-3 w-2/3" />
      </CardContent>
    </Card>
  );
}

/**
 * 내 서재에서 책을 선택하는 다이얼로그
 * 검색 + 표지 표시 + 상태 필터링 지원
 */
export function UserBookSelectDialog({
  children,
  books,
  isLoading = false,
  excludeBookIds = new Set(),
  onSelect,
  isSelecting = false,
  title,
  description,
  selectButtonText,
}: UserBookSelectDialogProps) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t("books.selectFromLibrary");
  const resolvedDescription = description ?? t("books.selectBookToShare");
  const resolvedSelectButtonText = selectButtonText ?? t("common.confirm");
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBook, setSelectedBook] = useState<UserBook | null>(null);

  // 다이얼로그 열릴 때 초기화
  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setStatusFilter("all");
      setSelectedBook(null);
    }
  }, [open]);

  // 필터링된 책 목록
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      // 이미 선택된 책 제외
      if (excludeBookIds.has(book.id)) return false;

      // 상태 필터
      if (statusFilter !== "all" && book.status !== statusFilter) return false;

      // 검색어 필터
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const bookTitle = book.books?.title?.toLowerCase() || "";
        const bookAuthor = book.books?.author?.toLowerCase() || "";
        if (!bookTitle.includes(query) && !bookAuthor.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [books, excludeBookIds, searchQuery, statusFilter]);

  const handleSelect = () => {
    if (selectedBook) {
      onSelect(selectedBook);
      setOpen(false);
    }
  };

  // 선택 가능한 책이 없는 경우
  const hasSelectableBooks = books.filter((b) => !excludeBookIds.has(b.id)).length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" disabled={!hasSelectableBooks}>
            <Library className="mr-2 h-4 w-4" />
            {hasSelectableBooks ? resolvedTitle : t("books.noShareableBook")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="h-5 w-5" />
            {resolvedTitle}
          </DialogTitle>
          <DialogDescription>{resolvedDescription}</DialogDescription>
        </DialogHeader>

        {/* 검색 및 필터 */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("books.searchByTitleOrAuthor")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder={t("books.statusFilter")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("books.filterAll")}</SelectItem>
              <SelectItem value="reading">{t("books.filterReading")}</SelectItem>
              <SelectItem value="completed">{t("books.filterCompleted")}</SelectItem>
              <SelectItem value="paused">{t("books.filterPaused")}</SelectItem>
              <SelectItem value="not_started">{t("books.filterNotStarted")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 책 목록 */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <BookCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? t("search.noResults")
                  : t("books.noShareableBooks")}
              </p>
              {(searchQuery || statusFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                >
                  {t("books.filterReset")}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2">
              {filteredBooks.map((userBook) => {
                const book = userBook.books;
                const isSelected = selectedBook?.id === userBook.id;

                return (
                  <Card
                    key={userBook.id}
                    className={`overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                      isSelected
                        ? "ring-2 ring-primary border-primary"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedBook(userBook)}
                  >
                    {/* 책 표지 */}
                    <div className="relative aspect-[3/4] w-full bg-muted">
                      {isValidImageUrl(book.cover_image_url) ? (
                        <Image
                          src={getImageUrl(book.cover_image_url!)}
                          alt={book.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <BookOpen className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                      {/* 선택 표시 */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-primary text-primary-foreground rounded-full p-2">
                            <Check className="h-6 w-6" />
                          </div>
                        </div>
                      )}
                      {/* 상태 배지 */}
                      <div className="absolute top-2 left-2">
                        <BookStatusBadge status={userBook.status} size="sm" />
                      </div>
                    </div>

                    {/* 책 정보 */}
                    <CardContent className="p-3">
                      <h4 className="font-medium text-sm line-clamp-2 mb-1">
                        {book.title}
                      </h4>
                      {book.author && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {book.author}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* 선택 버튼 */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {t("books.ofCount", { count: filteredBooks.length })}{" "}
            {selectedBook ? (
              <span className="text-primary font-medium">{t("books.oneSelected")}</span>
            ) : (
              t("books.noneSelected")
            )}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSelect} disabled={!selectedBook || isSelecting}>
              {isSelecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("books.processing")}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {resolvedSelectButtonText}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
