"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, Plus, BookOpen, Loader2, Search } from "lucide-react";
import { getUserBooks } from "@/app/actions/books";
import { updateNote } from "@/app/actions/notes";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
// import type { BookWithNotes } from "@/app/actions/books";
import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils/image";

interface RelatedBooksManagerProps {
  noteId: string;
  currentRelatedBookIds: string[] | null;
  mainBookId: string; // 주 책의 user_books.id
  onUpdate?: (updatedIds: string[] | null) => void; // 연결된 책 목록 업데이트 콜백
}

/**
 * 기록의 관련 책을 관리하는 컴포넌트
 */
export function RelatedBooksManager({
  noteId,
  currentRelatedBookIds,
  mainBookId,
  onUpdate,
}: RelatedBooksManagerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [availableBooks, setAvailableBooks] = useState<any[]>([]);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>(
    currentRelatedBookIds || []
  );
  const [searchQuery, setSearchQuery] = useState("");

  // 사용 가능한 책 목록 로드
  useEffect(() => {
    if (open) {
      loadAvailableBooks();
      setSearchQuery(""); // 다이얼로그 열 때 검색어 초기화
    }
  }, [open]);

  const loadAvailableBooks = async () => {
    setIsLoadingBooks(true);
    try {
      const result = await getUserBooks();
      // getUserBooks는 배열을 반환하므로 직접 사용
      // 주 책을 제외한 책들만 표시
      const filtered = (result || []).filter((book: any) => book.id !== mainBookId);
      setAvailableBooks(filtered);
    } catch (error) {
      console.error("책 목록 로드 오류:", error);
      toast.error("책 목록을 불러오지 못했어요.");
    } finally {
      setIsLoadingBooks(false);
    }
  };

  const handleToggleBook = (bookId: string) => {
    setSelectedBookIds((prev) => {
      if (prev.includes(bookId)) {
        return prev.filter((id) => id !== bookId);
      } else {
        return [...prev, bookId];
      }
    });
  };

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await updateNote(noteId, {
        related_user_book_ids: selectedBookIds.length > 0 ? selectedBookIds : [],
      });

      toast.success("관련 책이 업데이트됐어요.");
      
      // 부모 컴포넌트에 업데이트된 목록 전달
      if (onUpdate) {
        onUpdate(selectedBookIds.length > 0 ? selectedBookIds : null);
      }
      
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error("관련 책 업데이트 오류:", error);
      toast.error(error.message || "관련 책 업데이트에 실패했어요.");
    } finally {
      setIsUpdating(false);
    }
  };

  const selectedBooks = availableBooks.filter((book) =>
    selectedBookIds.includes(book.id)
  );

  // 검색어로 필터링된 책 목록
  const filteredBooks = availableBooks.filter((book) => {
    if (!searchQuery.trim()) {
      return true;
    }
    const query = searchQuery.toLowerCase();
    const title = (book.books?.title || "").toLowerCase();
    const author = (book.books?.author || "").toLowerCase();
    return title.includes(query) || author.includes(query);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 px-2.5 sm:px-3">
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">연결된 책</span>
          {currentRelatedBookIds && currentRelatedBookIds.length > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 px-1.5 text-xs">
              {currentRelatedBookIds.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
          <DialogTitle className="text-base sm:text-lg">연결된 책 관리</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            이 기록과 관련된 다른 책을 선택하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6 space-y-3 sm:space-y-4">
          {/* 선택된 책 목록 */}
          {selectedBooks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">
                선택됨 ({selectedBooks.length})
              </h4>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {selectedBooks.map((book) => (
                  <div
                    key={book.id}
                    className="inline-flex items-center gap-1 bg-primary text-primary-foreground rounded-full pl-2.5 pr-1 py-0.5 sm:pl-3 sm:py-1 text-xs sm:text-sm"
                  >
                    <span className="truncate max-w-[120px] sm:max-w-[180px]">{book.books.title}</span>
                    <button
                      onClick={() => handleToggleBook(book.id)}
                      className="ml-0.5 h-5 w-5 rounded-full flex items-center justify-center text-primary-foreground/70 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      aria-label={`${book.books.title} 제거`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 사용 가능한 책 목록 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs sm:text-sm font-medium text-muted-foreground shrink-0">책 선택</h4>
              {availableBooks.length > 0 && (
                <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  {filteredBooks.length}/{availableBooks.length}
                </span>
              )}
            </div>

            {/* 검색 입력 필드 */}
            {availableBooks.length > 0 && (
              <div className="relative">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 sm:pl-10 h-9 text-sm"
                />
              </div>
            )}

            {isLoadingBooks ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-muted-foreground" />
              </div>
            ) : availableBooks.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground text-center py-8">
                연결할 수 있는 다른 책이 없습니다.
              </p>
            ) : filteredBooks.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground text-center py-8">
                검색 결과가 없습니다.
              </p>
            ) : (
              <div className="space-y-1.5 sm:space-y-2 max-h-[40vh] sm:max-h-[300px] overflow-y-auto -mx-1 px-1">
                {filteredBooks.map((book) => {
                  const isSelected = selectedBookIds.includes(book.id);
                  return (
                    <div
                      key={book.id}
                      className={`flex items-center gap-2.5 sm:gap-3 p-2 sm:p-3 rounded-lg border cursor-pointer transition-colors active:scale-[0.98] ${
                        isSelected
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted active:bg-muted"
                      }`}
                      onClick={() => handleToggleBook(book.id)}
                    >
                      <div className="relative w-10 h-14 sm:w-12 sm:h-16 shrink-0 overflow-hidden rounded bg-muted">
                        <Image
                          src={getImageUrl(book.books.cover_image_url)}
                          alt={book.books.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:font-medium truncate">{book.books.title}</p>
                        {book.books.author && (
                          <p className="text-xs text-muted-foreground truncate">
                            {book.books.author}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary flex items-center justify-center">
                          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 액션 버튼 - 하단 고정 */}
        <div className="flex gap-2 p-4 sm:p-6 pt-3 sm:pt-4 border-t bg-background shrink-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isUpdating}
            size="sm"
            className="h-9 sm:h-10"
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={isUpdating}
            size="sm"
            className="flex-1 h-9 sm:h-10"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              `저장${selectedBookIds.length > 0 ? ` (${selectedBookIds.length})` : ""}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 기록 상세 페이지에서 관련 책을 표시하는 컴포넌트
 */
interface RelatedBooksDisplayProps {
  relatedBookIds: string[] | null;
  mainBookId: string;
  initialBooks?: any[];
}

export function RelatedBooksDisplay({
  relatedBookIds,
  mainBookId,
  initialBooks,
}: RelatedBooksDisplayProps) {
  const [relatedBooks, setRelatedBooks] = useState<any[]>(initialBooks || []);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!initialBooks && relatedBookIds && relatedBookIds.length > 0) {
      loadRelatedBooks();
    }
  }, [relatedBookIds]);

  const loadRelatedBooks = async () => {
    if (!relatedBookIds || relatedBookIds.length === 0) return;

    setIsLoading(true);
    try {
      const result = await getUserBooks();
      const filtered = (result || []).filter((book: any) =>
        relatedBookIds.includes(book.id)
      );
      setRelatedBooks(filtered);
    } catch (error) {
      console.error("관련 책 로드 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!relatedBookIds || relatedBookIds.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">관련 책을 불러오는 중...</div>
    );
  }

  if (relatedBooks.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        연결된 책이 삭제되었거나 더 이상 접근할 수 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
        <BookOpen className="w-3.5 h-3.5" />
        연결된 책
        <Badge variant="secondary" className="ml-1 h-4 min-w-4 px-1 text-[10px]">
          {relatedBooks.length}
        </Badge>
      </h4>
      {/* 모바일: 가로 스크롤, 데스크탑: 래핑 */}
      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible scrollbar-hide -mx-1 px-1">
        {relatedBooks.map((book) => (
          <Link
            key={book.id}
            href={`/books/${book.id}`}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border bg-card hover:bg-accent active:scale-[0.98] transition-all shrink-0"
          >
            <div className="relative w-6 h-8 sm:w-8 sm:h-10 shrink-0 overflow-hidden rounded bg-muted">
              <Image
                src={getImageUrl(book.books.cover_image_url)}
                alt={book.books.title}
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
            <span className="text-xs sm:text-sm font-medium truncate max-w-[100px] sm:max-w-[150px]">
              {book.books.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
