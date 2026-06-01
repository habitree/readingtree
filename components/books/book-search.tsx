"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Loader2, BookOpen, Users, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { addBook, getPopularBooks } from "@/app/actions/books";
import type { PopularBook } from "@/app/actions/books";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";
import { formatAuthor } from "@/lib/utils/book";
import { cn } from "@/lib/utils";
import { cache } from "@/lib/utils/cache";
import { withRetry } from "@/lib/utils/retry";

interface SearchResult {
  isbn: string | null;
  title: string;
  author: string | null;
  publisher: string | null;
  published_date: string | null;
  cover_image_url: string | null;
}

interface BookSearchProps {
  onBookAdded?: () => void;
  onSelectBook?: (book: SearchResult & { bookId?: string }) => void;
  excludeBookIds?: Set<string>; // 제외할 책 ID 목록 (예: 이미 내 서재에 있는 책)
  showAlreadyAdded?: boolean; // 이미 추가된 책 표시 여부
}

/**
 * 책 검색 컴포넌트
 * 네이버 API를 통해 책을 검색하고 추가할 수 있습니다.
 */
export function BookSearch({ onBookAdded, onSelectBook, excludeBookIds, showAlreadyAdded = false }: BookSearchProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [popularBooks, setPopularBooks] = useState<PopularBook[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(true);
  const [wantToReadIds, setWantToReadIds] = useState<Set<string>>(new Set());
  const [addingWantToRead, setAddingWantToRead] = useState<string | null>(null);

  // IME 조합 상태 추적
  const isComposingRef = useRef(false);
  const [searchTrigger, setSearchTrigger] = useState(0);

  // 인기 도서 조회는 메인 스레드 idle 시점까지 양보 (검색 입력 응답성 우선).
  // requestIdleCallback 미지원 브라우저(Safari)는 setTimeout으로 fallback.
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      if (cancelled) return;
      getPopularBooks(8)
        .then((books) => {
          if (!cancelled) setPopularBooks(books);
        })
        .catch(() => {
          if (!cancelled) setPopularBooks([]);
        })
        .finally(() => {
          if (!cancelled) setIsLoadingPopular(false);
        });
    };

    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const w = window as IdleWindow;
    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (typeof w.requestIdleCallback === "function") {
      idleId = w.requestIdleCallback(load, { timeout: 1500 });
    } else {
      timeoutId = setTimeout(load, 200);
    }

    return () => {
      cancelled = true;
      if (idleId !== null && typeof w.cancelIdleCallback === "function") {
        w.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, []);

  // 검색 실행 — 캐시 + 재시도 + SWR(stale 백그라운드 갱신).
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const cacheKey = `book-search-${searchQuery}`;

    const fetchAndStore = async (): Promise<{ books: SearchResult[] } | null> => {
      const data = await withRetry(
        async () => {
          const response = await fetch(
            `/api/books/search?query=${encodeURIComponent(searchQuery)}&display=10`
          );
          if (!response.ok) {
            let errorMessage = t("books.searchFailedMsg");
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
            } catch {
              // JSON 파싱 실패 시 기본 메시지 사용
            }
            throw new Error(errorMessage);
          }
          return (await response.json()) as { books: SearchResult[] };
        },
        {
          maxRetries: 2,
          initialDelay: 500,
          retryableErrors: (error) => {
            const message = error.message.toLowerCase();
            return (
              message.includes("network") ||
              message.includes("fetch") ||
              message.includes("timeout") ||
              message.includes("503") ||
              message.includes("502")
            );
          },
        }
      );
      // 캐시에 저장 (5분간 유지)
      if (typeof window !== "undefined") {
        cache.set(cacheKey, data, 5 * 60 * 1000);
      }
      return data;
    };

    setIsSearching(true);
    try {
      // SWR: 캐시 히트 시 즉시 표시, TTL의 절반(2.5분) 경과했으면 백그라운드 갱신.
      if (typeof window !== "undefined") {
        const entry = cache.getEntry<{ books: SearchResult[] }>(cacheKey);
        if (entry) {
          setResults(entry.data.books || []);
          setIsSearching(false);

          if (Date.now() - entry.timestamp > entry.ttl / 2) {
            void fetchAndStore()
              .then((fresh) => {
                if (fresh && fresh.books) setResults(fresh.books);
              })
              .catch(() => {
                /* stale revalidate 실패는 무시 — 사용자에게 이미 캐시 결과 표시됨 */
              });
          }
          return;
        }
      }

      const data = await fetchAndStore();
      setResults(data?.books || []);
    } catch (error) {
      console.error("책 검색 오류:", error);
      const errorMessage = error instanceof Error ? error.message : t("books.unknownErrorMsg");

      // 사용자 친화적인 에러 메시지 (이미 API에서 변환된 메시지일 수 있음)
      if (errorMessage.includes("일시적인 문제") || errorMessage.includes("잠시 후")) {
        toast.error(errorMessage, {
          description: t("books.searchRetryDesc"),
          duration: 5000,
        });
      } else if (errorMessage.includes("인터넷 연결") || errorMessage.includes("네트워크") || errorMessage.includes("fetch")) {
        toast.error(t("books.networkErrorMsg"), {
          description: t("books.networkErrorDesc"),
          duration: 5000,
        });
      } else if (errorMessage.includes("검색어")) {
        toast.error(errorMessage, {
          duration: 3000,
        });
      } else {
        toast.error(errorMessage || t("books.searchFailedMsg"), {
          description: t("books.searchFailedDesc"),
          duration: 5000,
        });
      }
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [t]);

  // 디바운싱 (300ms) - 검색어가 2자 이상일 때만 검색
  // IME 조합 중에는 검색하지 않음 (searchTrigger로 조합 완료 시 재트리거)
  useEffect(() => {
    if (isComposingRef.current) {
      return;
    }

    if (query.trim().length < 2 && query.trim().length > 0) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      if (isComposingRef.current) {
        return;
      }

      if (query.trim().length >= 2) {
        performSearch(query);
      } else if (query.trim().length === 0) {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch, searchTrigger]);

  // IME 조합 이벤트 핸들러
  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false;
    // 조합 완료 시 useEffect 재실행을 트리거하여 검색 수행
    setSearchTrigger((c) => c + 1);
  }, []);

  const handleAddBook = async (book: SearchResult) => {
    setIsAdding(book.isbn || book.title);
    try {
      // onSelectBook이 있으면 내 서재에 추가하지 않고, books 테이블에만 확인/생성
      if (onSelectBook) {
        // books 테이블에 책이 있는지 확인하고, 없으면 생성
        const response = await fetch("/api/books/ensure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(book),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || t("books.bookAddFailed"));
        }
        
        const { bookId } = await response.json();
        setQuery("");
        setResults([]);
        
        onSelectBook({
          ...book,
          bookId: bookId,
        });
      } else {
        // 기존 동작: 내 서재에 추가
        const result = await addBook(book, "reading");
        if (!result.success) {
          // 중복인 경우 "해당 책으로 이동" 링크 토스트 제공
          if (result.code === "DUPLICATE" && result.existingUserBookId) {
            const existingId = result.existingUserBookId;
            toast.info(result.error, {
              action: {
                label: "해당 책으로 이동",
                onClick: () => {
                  router.push(`/books/${existingId}`);
                },
              },
            });
            return;
          }
          throw new Error(result.error);
        }
        const addedBookId = result.userBookId;
        toast.success(t("books.bookAddedWithAction"), {
          description: t("books.bookAddedActionDesc"),
          action: {
            label: t("books.writeFirstNote"),
            onClick: () => {
              router.push(`/notes/new?bookId=${addedBookId}`);
            },
          },
        });
        setQuery("");
        setResults([]);
        onBookAdded?.();
        router.push(`/books/${addedBookId}`);
        router.refresh();
      }
    } catch (error) {
      console.error("책 추가 오류:", error);
      toast.error(
        error instanceof Error ? error.message : t("books.bookAddFailed")
      );
    } finally {
      setIsAdding(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          name="book-search-full"
          placeholder={t("books.searchPlaceholderFull")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          className="pl-10"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-2 max-h-[60vh] sm:max-h-96 overflow-y-auto">
          {results.map((book) => {
            // 고유 키 생성: ISBN이 있으면 ISBN 사용, 없으면 title과 author 조합
            const uniqueKey = book.isbn || `${book.title}-${book.author || 'unknown'}-${book.publisher || 'unknown'}`;
            return (
            <Card key={uniqueKey} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="relative w-16 h-20 shrink-0 overflow-hidden rounded bg-muted">
                    {isValidImageUrl(book.cover_image_url) && book.cover_image_url ? (
                      <Image
                        src={book.cover_image_url}
                        alt={book.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <BookOpen className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="font-semibold line-clamp-2">{book.title}</h4>
                    {book.author && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {formatAuthor(book.author)}
                      </p>
                    )}
                    {book.publisher && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {book.publisher}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleAddBook(book)}
                      disabled={isAdding === (book.isbn || book.title)}
                    >
                      {isAdding === (book.isbn || book.title) ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          {t("books.addingBook")}
                        </>
                      ) : (
                        <>
                          <BookOpen className="mr-1 h-3 w-3" />
                          {t("books.addButton")}
                        </>
                      )}
                    </Button>
                    {!onSelectBook && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 gap-1"
                        onClick={async () => {
                          const key = book.isbn || book.title;
                          if (isAdding === `want-${key}`) return;
                          setIsAdding(`want-${key}`);
                          try {
                            const wantResult = await addBook(book, "not_started");
                            if (!wantResult.success) throw new Error(wantResult.error);
                            toast.success(t("dashboard.wantToReadAdded"));
                            router.refresh();
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : t("books.bookAddFailed"));
                          } finally {
                            setIsAdding(null);
                          }
                        }}
                        disabled={isAdding === `want-${book.isbn || book.title}`}
                      >
                        {isAdding === `want-${book.isbn || book.title}` ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Heart className="h-3 w-3" />
                            {t("dashboard.wantToRead")}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {query && !isSearching && results.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {t("books.noResults")}
        </div>
      )}

      {/* 검색어 없을 때: 인기 도서 표시 */}
      {!query && !isSearching && results.length === 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t("dashboard.popularBooksTitle")}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("dashboard.popularBooksDesc")}
            </p>
          </div>

          {isLoadingPopular ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : popularBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {popularBooks.map((book) => {
                const isAdded = wantToReadIds.has(book.bookId);
                const isAddingThis = addingWantToRead === book.bookId;

                return (
                  <div key={book.bookId} className="flex flex-col items-center text-center">
                    <div className="relative w-20 h-28 rounded-lg overflow-hidden shadow-sm mb-2">
                      {book.coverImageUrl ? (
                        <Image
                          src={book.coverImageUrl}
                          alt={book.title}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-forest-100 to-forest-200 dark:from-forest-800 dark:to-forest-900 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-forest-500" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-900 dark:text-white line-clamp-2 leading-tight mb-0.5">
                      {book.title}
                    </p>
                    {book.author && (
                      <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1 mb-1">
                        {formatAuthor(book.author)}
                      </p>
                    )}
                    <div className="flex items-center gap-0.5 text-[11px] sm:text-xs text-muted-foreground mb-1.5">
                      <Users className="h-2.5 w-2.5" />
                      <span>{t("dashboard.readersCount", { count: book.readerCount })}</span>
                    </div>
                    <button
                      onClick={async () => {
                        if (isAdded || isAddingThis) return;
                        setAddingWantToRead(book.bookId);
                        try {
                          const popResult = await addBook(
                            {
                              title: book.title,
                              author: book.author,
                              cover_image_url: book.coverImageUrl,
                              isbn: book.isbn,
                            },
                            "not_started"
                          );
                          if (!popResult.success) throw new Error(popResult.error);
                          setWantToReadIds((prev) => new Set(prev).add(book.bookId));
                          toast.success(t("dashboard.wantToReadAdded"));
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : t("books.bookAddFailed"));
                        } finally {
                          setAddingWantToRead(null);
                        }
                      }}
                      disabled={isAddingThis || isAdded}
                      className={cn(
                        "w-full py-1.5 px-2 rounded-md text-[11px] sm:text-xs font-medium transition-all",
                        isAdded
                          ? "bg-forest-50 dark:bg-forest-900/30 text-forest-600 dark:text-forest-400 border border-forest-200 dark:border-forest-700"
                          : "bg-forest-600 hover:bg-forest-700 text-white shadow-sm"
                      )}
                    >
                      {isAddingThis ? (
                        <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                      ) : isAdded ? (
                        <span className="flex items-center justify-center gap-0.5">
                          <Heart className="h-2.5 w-2.5 fill-current" />
                          {t("dashboard.wantToReadAdded")}
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-0.5">
                          <Heart className="h-2.5 w-2.5" />
                          {t("dashboard.wantToRead")}
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

