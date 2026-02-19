"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link2, Plus, X, Search, BookOpen, Loader2 } from "lucide-react";
import {
  getRelatedBooks,
  addBookRelation,
  removeBookRelation,
  type RelatedBook,
} from "@/app/actions/book-relations";
import { getUserBooksWithNotes, type BookWithNotes } from "@/app/actions/books";
import { getImageUrl } from "@/lib/utils/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";

interface RelatedBooksEditorProps {
  userBookId: string;
}

/**
 * 연결된 책 관리 Dialog
 * 현재 연결된 책 목록 확인 및 추가/삭제
 */
export function RelatedBooksEditor({ userBookId }: RelatedBooksEditorProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [relatedBooks, setRelatedBooks] = useState<RelatedBook[]>([]);
  const [allBooks, setAllBooks] = useState<BookWithNotes[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // 연결된 책 및 전체 책 목록 로드
  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [related, booksResult] = await Promise.all([
          getRelatedBooks(userBookId),
          getUserBooksWithNotes(),
        ]);
        setRelatedBooks(related);
        setAllBooks(booksResult.books);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
        toast.error(t("books.dataLoadFailed"));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [open, userBookId]);

  // 이미 연결된 책 ID 목록
  const relatedBookIds = useMemo(
    () => new Set(relatedBooks.map((b) => b.userBookId)),
    [relatedBooks]
  );

  // 선택 가능한 책 목록 (자기 자신과 이미 연결된 책 제외)
  const availableBooks = useMemo(() => {
    return allBooks.filter(
      (book) => book.id !== userBookId && !relatedBookIds.has(book.id)
    );
  }, [allBooks, userBookId, relatedBookIds]);

  // 검색 필터링
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return availableBooks;

    const query = searchQuery.toLowerCase();
    return availableBooks.filter(
      (book) =>
        book.books.title.toLowerCase().includes(query) ||
        book.books.author?.toLowerCase().includes(query)
    );
  }, [availableBooks, searchQuery]);

  // 책 연결 추가
  const handleAddRelation = async (targetUserBookId: string) => {
    setIsAdding(true);
    try {
      await addBookRelation(userBookId, targetUserBookId);
      // 목록 갱신
      const updated = await getRelatedBooks(userBookId);
      setRelatedBooks(updated);
      toast.success(t("books.bookLinkedSuccess"));
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("books.bookLinkFailed")
      );
    } finally {
      setIsAdding(false);
    }
  };

  // 책 연결 삭제
  const handleRemoveRelation = async (targetUserBookId: string) => {
    setRemovingId(targetUserBookId);
    try {
      await removeBookRelation(userBookId, targetUserBookId);
      // 목록 갱신
      setRelatedBooks((prev) =>
        prev.filter((b) => b.userBookId !== targetUserBookId)
      );
      toast.success(t("books.bookUnlinkedSuccess"));
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("books.bookUnlinkFailed")
      );
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px] max-h-[70vh] flex flex-col p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4" />
            {t("books.relatedBooksTitle")}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 gap-4">
            {/* 현재 연결된 책 */}
            <div>
              <h4 className="text-sm font-medium mb-2">
                {t("books.relatedBooksCountLabel", { count: relatedBooks.length })}
              </h4>
              {relatedBooks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {t("books.noRelatedBooks")}
                </p>
              ) : (
                <ScrollArea className="h-[140px]">
                  <div className="space-y-2 pr-4">
                    {relatedBooks.map((book) => (
                      <div
                        key={book.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                      >
                        {/* 책 표지 */}
                        <div className="relative w-10 h-14 rounded overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                          {book.coverImageUrl ? (
                            <Image
                              src={getImageUrl(book.coverImageUrl)}
                              alt={book.title}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="h-4 w-4 text-slate-400" />
                            </div>
                          )}
                        </div>
                        {/* 정보 */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {book.title}
                          </p>
                          {book.author && (
                            <p className="text-xs text-muted-foreground truncate">
                              {book.author}
                            </p>
                          )}
                        </div>
                        {/* 삭제 버튼 */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => handleRemoveRelation(book.userBookId)}
                          disabled={removingId === book.userBookId}
                        >
                          {removingId === book.userBookId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* 구분선 */}
            <div className="border-t" />

            {/* 책 추가 */}
            <div className="flex-1 min-h-0 flex flex-col">
              <h4 className="text-sm font-medium mb-2">{t("books.addBookRelation")}</h4>

              {/* 검색 */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t("books.searchInLibrary")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              {/* 책 목록 */}
              <ScrollArea className="flex-1 min-h-[180px]">
                {filteredBooks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {searchQuery.trim()
                        ? t("books.noSearchResults")
                        : t("books.noBooksToAdd")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 pr-4">
                    {filteredBooks.map((book) => (
                      <button
                        key={book.id}
                        type="button"
                        onClick={() => handleAddRelation(book.id)}
                        disabled={isAdding}
                        className="flex items-center gap-3 p-2 w-full rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left disabled:opacity-50"
                      >
                        {/* 책 표지 */}
                        <div className="relative w-9 h-12 rounded overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                          {book.books.cover_image_url ? (
                            <Image
                              src={getImageUrl(book.books.cover_image_url)}
                              alt={book.books.title}
                              fill
                              className="object-cover"
                              sizes="36px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="h-3 w-3 text-slate-400" />
                            </div>
                          )}
                        </div>
                        {/* 정보 */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {book.books.title}
                          </p>
                          {book.books.author && (
                            <p className="text-xs text-muted-foreground truncate">
                              {book.books.author}
                            </p>
                          )}
                        </div>
                        {/* 추가 아이콘 */}
                        <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
