"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { getUserBooksWithNotes, type BookWithNotes } from "@/app/actions/books";
import { toSelectedBook, useMobileNoteSheet } from "@/hooks/use-mobile-note-sheet";

interface QuickBookSelectorProps {
  onSelect: (book: BookWithNotes) => void;
}

/**
 * 빠른 책 선택 컴포넌트
 * 내 서재에서 책을 빠르게 선택할 수 있는 UI
 */
export function QuickBookSelector({ onSelect }: QuickBookSelectorProps) {
  const [books, setBooks] = useState<BookWithNotes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // 책 목록 로드
  useEffect(() => {
    const loadBooks = async () => {
      setIsLoading(true);
      try {
        const result = await getUserBooksWithNotes();
        setBooks(result.books);
      } catch (error) {
        console.error("책 목록 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadBooks();
  }, []);

  // 검색 필터링
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books;

    const query = searchQuery.toLowerCase();
    return books.filter(
      (book) =>
        book.books.title.toLowerCase().includes(query) ||
        book.books.author?.toLowerCase().includes(query)
    );
  }, [books, searchQuery]);

  // 최근 읽은 책 (읽는 중 상태) - 최대 6권
  const recentBooks = useMemo(() => {
    return books
      .filter((book) => book.status === "reading" || book.status === "rereading")
      .slice(0, 6);
  }, [books]);

  // 나머지 책 목록
  const otherBooks = useMemo(() => {
    if (searchQuery.trim()) return filteredBooks;

    const recentIds = new Set(recentBooks.map((b) => b.id));
    return books.filter((book) => !recentIds.has(book.id));
  }, [books, recentBooks, filteredBooks, searchQuery]);

  const handleBookSelect = (book: BookWithNotes) => {
    onSelect(book);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p className="text-sm">책 목록을 불러오는 중...</p>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <BookOpen className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm font-medium">서재에 책이 없습니다</p>
        <p className="text-xs mt-1">먼저 책을 추가해주세요</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 검색 입력 */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="책 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-11"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {/* 검색 중이 아닐 때만 최근 읽은 책 표시 */}
        {!searchQuery.trim() && recentBooks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              읽는 중인 책
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {recentBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  variant="compact"
                  onSelect={() => handleBookSelect(book)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 전체 책 목록 */}
        <div>
          {!searchQuery.trim() && recentBooks.length > 0 && (
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              내 서재
            </h4>
          )}
          {otherBooks.length > 0 ? (
            <div className="space-y-2">
              {otherBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  variant="list"
                  onSelect={() => handleBookSelect(book)}
                />
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">검색 결과가 없습니다</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface BookCardProps {
  book: BookWithNotes;
  variant: "compact" | "list";
  onSelect: () => void;
}

function BookCard({ book, variant, onSelect }: BookCardProps) {
  const coverUrl = book.books.cover_image_url;

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={onSelect}
        className="flex flex-col items-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all min-h-[110px]"
      >
        {/* 책 표지 */}
        <div className="relative w-14 h-20 rounded-md overflow-hidden bg-slate-200 dark:bg-slate-700 shadow-sm flex-shrink-0">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={book.books.title}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-slate-400" />
            </div>
          )}
        </div>
        {/* 제목 */}
        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-1.5 line-clamp-2 text-center leading-tight">
          {book.books.title}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex items-center gap-3 p-3 w-full rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-[0.98] transition-all text-left"
    >
      {/* 책 표지 */}
      <div className="relative w-11 h-16 rounded-md overflow-hidden bg-slate-200 dark:bg-slate-700 shadow-sm flex-shrink-0">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={book.books.title}
            fill
            className="object-cover"
            sizes="44px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-slate-400" />
          </div>
        )}
      </div>
      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
          {book.books.title}
        </p>
        {book.books.author && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {book.books.author}
          </p>
        )}
        <p className="text-xs text-muted-foreground/70 mt-1">
          기록 {book.noteCount}개
        </p>
      </div>
    </button>
  );
}
