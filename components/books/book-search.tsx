"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Loader2, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { addBook } from "@/app/actions/books";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";

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

  // IME 조합 상태 추적
  const isComposingRef = useRef(false);

  // 디바운싱을 위한 검색 함수
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // 캐시 확인 (클라이언트 사이드에서만)
      if (typeof window !== "undefined") {
        const { cache } = await import("@/lib/utils/cache");
        const cacheKey = `book-search-${searchQuery}`;
        const cached = cache.get<any>(cacheKey);
        
        if (cached) {
          setResults(cached.books || []);
          setIsSearching(false);
          return;
        }
      }

      // 재시도 로직이 포함된 fetch
      const { withRetry } = await import("@/lib/utils/retry");
      
      const data = await withRetry(
        async () => {
          const response = await fetch(
            `/api/books/search?query=${encodeURIComponent(searchQuery)}&display=10`
          );

          if (!response.ok) {
            // API에서 반환한 에러 메시지 가져오기
            let errorMessage = t("books.searchFailedMsg");
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
            } catch {
              // JSON 파싱 실패 시 기본 메시지 사용
            }
            throw new Error(errorMessage);
          }

          return await response.json();
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
        const { cache } = await import("@/lib/utils/cache");
        const cacheKey = `book-search-${searchQuery}`;
        cache.set(cacheKey, data, 5 * 60 * 1000);
      }

      setResults(data.books || []);
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
  // IME 조합 중에는 검색하지 않음
  useEffect(() => {
    // IME 조합 중이면 검색 하지 않음
    if (isComposingRef.current) {
      return;
    }

    if (query.trim().length < 2 && query.trim().length > 0) {
      // 검색어가 1자일 때는 결과를 비우고 검색하지 않음
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      // 조합 완료 후에도 확인
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
  }, [query, performSearch]);

  // IME 조합 이벤트 핸들러
  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false;
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
        toast.success(t("books.bookAddedSuccess"));
        setQuery("");
        setResults([]);
        onBookAdded?.();
        router.push("/books");
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
                        {book.author}
                      </p>
                    )}
                    {book.publisher && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {book.publisher}
                      </p>
                    )}
                  </div>
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
                      t("books.addButton")
                    )}
                  </Button>
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
    </div>
  );
}

