"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, Loader2 } from "lucide-react";
import Image from "next/image";
import {
  getQuickPickerBooks,
  searchUserBooksForPicker,
  type BookWithNotes,
} from "@/app/actions/books";
import { useTranslation } from "@/lib/i18n";

interface QuickBookSelectorProps {
  onSelect: (book: BookWithNotes) => void;
  /** 제외할 책 ID 목록 (user_books.id) */
  excludeUserBookIds?: string[];
}

/**
 * 빠른 책 선택 컴포넌트
 *
 * 동작:
 *  - 마운트 시: getQuickPickerBooks() — 이어읽기 + 최근 기록 책만 가벼운 쿼리로 즉시 노출.
 *  - 검색 입력 시: searchUserBooksForPicker(query) — 디바운스 후 서재 전체에서 매칭.
 *
 * 이전 동작과의 차이:
 *  기존에는 마운트 시 getUserBooksWithNotes() 전체(통계·그룹·연결책 포함)를 한 번에
 *  조회해 클라이언트에서 useMemo로 분류했음. 책이 많을수록 응답이 폭증하고 모바일에서 체감 느렸음.
 *  picker가 실제로 보여주는 정보(제목·표지·저자·기록수)에 맞춰 쿼리를 분리·경량화했음.
 */
export function QuickBookSelector({ onSelect, excludeUserBookIds = [] }: QuickBookSelectorProps) {
  const { t } = useTranslation();
  const [continueReading, setContinueReading] = useState<BookWithNotes[]>([]);
  const [recentNoted, setRecentNoted] = useState<BookWithNotes[]>([]);
  const [searchResults, setSearchResults] = useState<BookWithNotes[]>([]);
  const [isLoadingDefault, setIsLoadingDefault] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isComposingRef = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const excludeSet = useMemo(() => new Set(excludeUserBookIds), [excludeUserBookIds]);

  // 마운트: 가벼운 첫 화면 데이터 로드
  useEffect(() => {
    let cancelled = false;
    setIsLoadingDefault(true);
    getQuickPickerBooks()
      .then((data) => {
        if (cancelled) return;
        setContinueReading(data.continueReading);
        setRecentNoted(data.recentNoted);
      })
      .catch((err) => {
        console.error("getQuickPickerBooks 실패:", err);
        if (!cancelled) {
          setContinueReading([]);
          setRecentNoted([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDefault(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 검색: 디바운스 후 서버 호출 (IME 조합 중에는 보류)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    if (trimmed.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    if (isComposingRef.current) return;

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchUserBooksForPicker(trimmed);
        setSearchResults(results);
      } catch (err) {
        console.error("searchUserBooksForPicker 실패:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };
  const handleCompositionEnd = () => {
    isComposingRef.current = false;
    setSearchQuery((q) => q); // useEffect 재트리거
  };

  const handleBookSelect = (book: BookWithNotes) => {
    onSelect(book);
  };

  // 제외 필터 적용
  const visibleContinueReading = useMemo(
    () => continueReading.filter((b) => !excludeSet.has(b.id)),
    [continueReading, excludeSet],
  );
  const visibleRecentNoted = useMemo(
    () => recentNoted.filter((b) => !excludeSet.has(b.id)),
    [recentNoted, excludeSet],
  );
  const visibleSearchResults = useMemo(
    () => searchResults.filter((b) => !excludeSet.has(b.id)),
    [searchResults, excludeSet],
  );

  const isSearchActive = searchQuery.trim().length > 0;

  // 첫 로드 중
  if (isLoadingDefault) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p className="text-sm">{t("books.loadingBooks")}</p>
      </div>
    );
  }

  // 첫 로드 완료, 서재가 비어있음
  if (!isSearchActive && visibleContinueReading.length === 0 && visibleRecentNoted.length === 0) {
    return (
      <div className="flex flex-col h-full">
        {/* 검색 입력은 여전히 노출 (서재가 비어있어 보일 뿐, 실제로는 매칭 가능) */}
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          isLoading={false}
          placeholder={t("books.searchBooksPlaceholder")}
        />
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <BookOpen className="h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm font-medium">{t("books.noBooksInLibrary")}</p>
          <p className="text-xs mt-1">{t("books.addBooksFirst")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        isLoading={isSearching}
        placeholder={t("books.searchBooksPlaceholder")}
      />

      {isSearchActive && (
        <p className="text-xs text-muted-foreground px-1 mb-2">
          {visibleSearchResults.length}
          {t("search.resultsCount")}
        </p>
      )}

      <div className="flex-1 overflow-y-auto space-y-4">
        {!isSearchActive && visibleContinueReading.length > 0 && (
          <Section title={t("books.currentlyReadingBooks")}>
            <div className="grid grid-cols-3 gap-2">
              {visibleContinueReading.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  variant="compact"
                  onSelect={() => handleBookSelect(book)}
                />
              ))}
            </div>
          </Section>
        )}

        {!isSearchActive && visibleRecentNoted.length > 0 && (
          <Section title={t("books.recentlyNoted")}>
            <div className="grid grid-cols-3 gap-2">
              {visibleRecentNoted.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  variant="compact"
                  onSelect={() => handleBookSelect(book)}
                />
              ))}
            </div>
          </Section>
        )}

        {isSearchActive && (
          <div>
            {isSearching && visibleSearchResults.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : visibleSearchResults.length > 0 ? (
              <div className="space-y-2">
                {visibleSearchResults.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    variant="list"
                    onSelect={() => handleBookSelect(book)}
                  />
                ))}
              </div>
            ) : !isSearching ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">{t("search.noResults")}</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  onCompositionStart: () => void;
  onCompositionEnd: () => void;
  isLoading: boolean;
  placeholder: string;
}

function SearchInput({
  value,
  onChange,
  onCompositionStart,
  onCompositionEnd,
  isLoading,
  placeholder,
}: SearchInputProps) {
  return (
    <div className="relative mb-2">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        name="book-selector-search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        className="pl-9 pr-9 h-11"
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-forest-500" />
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-medium text-muted-foreground mb-2">{title}</h4>
      {children}
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
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
          {book.books.title}
        </p>
        {book.books.author && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{book.books.author}</p>
        )}
        <p className="text-xs text-muted-foreground/70 mt-1">
          {t("books.noteCountLabel", { count: book.noteCount })}
        </p>
      </div>
    </button>
  );
}
