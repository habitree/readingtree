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
      toast.error("책 목록을 불러오는데 실패했습니다.");
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

      toast.success("관련 책이 업데이트되었습니다.");
      
      // 부모 컴포넌트에 업데이트된 목록 전달
      if (onUpdate) {
        onUpdate(selectedBookIds.length > 0 ? selectedBookIds : null);
      }
      
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error("관련 책 업데이트 오류:", error);
      toast.error(error.message || "관련 책 업데이트에 실패했습니다.");
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
        <Button variant="outline" size="sm" className="gap-2">
          <BookOpen className="w-4 h-4" />
          연결된 책 {currentRelatedBookIds && currentRelatedBookIds.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {currentRelatedBookIds.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>연결된 책 관리</DialogTitle>
          <DialogDescription>
            이 기록과 관련된 다른 책을 선택할 수 있습니다. 주 책은 자동으로 제외됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 선택된 책 목록 */}
          {selectedBooks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">선택된 책 ({selectedBooks.length}개)</h4>
              <div className="flex flex-wrap gap-2">
                {selectedBooks.map((book) => (
                  <div
                    key={book.id}
                    className="inline-flex items-center gap-1 bg-primary text-primary-foreground rounded-full pl-3 pr-1 py-1 text-sm"
                  >
                    <span className="truncate max-w-[180px]">{book.books.title}</span>
                    <button
                      onClick={() => handleToggleBook(book.id)}
                      className="ml-1 h-5 w-5 rounded-full flex items-center justify-center text-primary-foreground/70 hover:bg-destructive hover:text-destructive-foreground transition-colors"
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
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">책 선택</h4>
              {availableBooks.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  전체 {availableBooks.length}개 중 {filteredBooks.length}개 표시
                </span>
              )}
            </div>
            
            {/* 검색 입력 필드 */}
            {availableBooks.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="책 제목 또는 저자로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}

            {isLoadingBooks ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : availableBooks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                연결할 수 있는 다른 책이 없습니다.
              </p>
            ) : filteredBooks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                검색 결과가 없습니다.
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {filteredBooks.map((book) => {
                  const isSelected = selectedBookIds.includes(book.id);
                  return (
                    <div
                      key={book.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => handleToggleBook(book.id)}
                    >
                      <div className="relative w-12 h-16 shrink-0 overflow-hidden rounded bg-muted">
                        <Image
                          src={getImageUrl(book.books.cover_image_url)}
                          alt={book.books.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{book.books.title}</p>
                        {book.books.author && (
                          <p className="text-sm text-muted-foreground truncate">
                            {book.books.author}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <Badge variant="default" className="shrink-0">
                          선택됨
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isUpdating}
            >
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUpdating}
              className="flex-1"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                "저장"
              )}
            </Button>
          </div>
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
}

export function RelatedBooksDisplay({
  relatedBookIds,
  mainBookId,
}: RelatedBooksDisplayProps) {
  const [relatedBooks, setRelatedBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (relatedBookIds && relatedBookIds.length > 0) {
      loadRelatedBooks();
    }
  }, [relatedBookIds]);

  const loadRelatedBooks = async () => {
    if (!relatedBookIds || relatedBookIds.length === 0) return;

    setIsLoading(true);
    try {
      const result = await getUserBooks();
      // getUserBooks는 배열을 반환하므로 직접 사용
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
      <h4 className="text-sm font-medium">연결된 책</h4>
      <div className="flex flex-wrap gap-2">
        {relatedBooks.map((book) => (
          <Link
            key={book.id}
            href={`/books/${book.id}`}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card hover:bg-accent transition-colors"
          >
            <div className="relative w-8 h-10 shrink-0 overflow-hidden rounded bg-muted">
              <Image
                src={getImageUrl(book.books.cover_image_url)}
                alt={book.books.title}
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
            <span className="text-sm font-medium truncate max-w-[150px]">
              {book.books.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
