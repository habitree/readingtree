"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, Loader2 } from "lucide-react";
import Image from "next/image";
import { getUserBooksWithNotes, type BookWithNotes } from "@/app/actions/books";
import { useTranslation } from "@/lib/i18n";

interface QuickBookSelectorProps {
  onSelect: (book: BookWithNotes) => void;
  /** 제외할 책 ID 목록 (user_books.id) */
  excludeUserBookIds?: string[];
}

/**
 * 빠른 책 선택 컴포넌트
 * 내 서재에서 책을 빠르게 선택할 수 있는 UI
 */
export function QuickBookSelector({ onSelect, excludeUserBookIds = [] }: QuickBookSelectorProps) {
  const { t } = useTranslation();
  const [books, setBooks] = useState<BookWithNotes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // 제외할 ID를 Set으로 변환 (검색 성능 최적화)
  const excludeSet = useMemo(() => new Set(excludeUserBookIds), [excludeUserBookIds]);

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

  // 검색 필터링 + 제외 목록 필터링
  const filteredBooks = useMemo(() => {
    const filtered = books.filter((book) => !excludeSet.has(book.id));

    if (!searchQuery.trim()) return filtered;

    const query = searchQuery.toLowerCase();
    return filtered.filter(
      (book) =>
        book.books.title.toLowerCase().includes(query) ||
        book.books.author?.toLowerCase().includes(query) ||
        book.books.publisher?.toLowerCase().includes(query)
    );
  }, [books, searchQuery, excludeSet]);

  // 최근 기록한 책 - 최대 6권 (제외 목록 적용)
  // 정렬 기준: latestNote가 있는 책을 최근 기록 날짜 순으로 정렬
  const recentNoteBooks = useMemo(() => {
    return books
      .filter((book) => !excludeSet.has(book.id) && book.latestNote)
      .sort((a, b) => {
        const aDate = new Date(a.latestNote?.created_at || 0).getTime();
        const bDate = new Date(b.latestNote?.created_at || 0).getTime();
        return bDate - aDate; // 최근 기록 순
      })
      .slice(0, 6);
  }, [books, excludeSet]);

  // 읽는 중인 책 (reading, rereading) - 최근 기록 책 제외, 최대 6권
  const readingBooks = useMemo(() => {
    const recentNoteIds = new Set(recentNoteBooks.map((b) => b.id));
    return books
      .filter(
        (book) =>
          !excludeSet.has(book.id) &&
          !recentNoteIds.has(book.id) &&
          (book.status === "reading" || book.status === "rereading")
      )
      .slice(0, 6);
  }, [books, recentNoteBooks, excludeSet]);

  // 나머지 책 목록 (최근 기록 책과 읽는 중 책 제외)
  const otherBooks = useMemo(() => {
    if (searchQuery.trim()) return filteredBooks;

    const recentNoteIds = new Set(recentNoteBooks.map((b) => b.id));
    const readingIds = new Set(readingBooks.map((b) => b.id));
    return books.filter(
      (book) =>
        !excludeSet.has(book.id) &&
        !recentNoteIds.has(book.id) &&
        !readingIds.has(book.id)
    );
  }, [books, recentNoteBooks, readingBooks, filteredBooks, searchQuery, excludeSet]);

  const handleBookSelect = (book: BookWithNotes) => {
    onSelect(book);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p className="text-sm">{t("books.loadingBooks")}</p>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <BookOpen className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm font-medium">{t("books.noBooksInLibrary")}</p>
        <p className="text-xs mt-1">{t("books.addBooksFirst")}</p>
      </div>
    );
  }

  const isSearchActive = searchQuery.trim().length > 0;
  const searchResultCount = isSearchActive ? filteredBooks.length : 0;

  return (
    <div className="flex flex-col h-full">
      {/* 검색 입력 */}
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          name="book-selector-search"
          placeholder={t("books.searchBooksPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9 h-11"
        />
        {isSearchActive && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-forest-500" />
          </div>
        )}
      </div>

      {/* 검색 결과 건수 표시 */}
      {isSearchActive && (
        <p className="text-xs text-muted-foreground px-1 mb-2">
          {searchResultCount}{t("search.resultsCount")}
        </p>
      )}

      <div className="flex-1 overflow-y-auto space-y-4">
        {/* 검색 중이 아닐 때만 최근 기록한 책 표시 */}
        {!searchQuery.trim() && recentNoteBooks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              {t("books.recentlyNoted")}
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {recentNoteBooks.map((book) => (
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

        {/* 검색 중이 아닐 때만 읽는 중인 책 표시 */}
        {!searchQuery.trim() && readingBooks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              {t("books.currentlyReadingBooks")}
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {readingBooks.map((book) => (
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
          {!searchQuery.trim() && (recentNoteBooks.length > 0 || readingBooks.length > 0) && (
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              {t("books.myBooks")}
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
              <p className="text-sm">{t("search.noResults")}</p>
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
  const { t } = useTranslation();
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
          {t("books.noteCountLabel", { count: book.noteCount })}
        </p>
      </div>
    </button>
  );
}
