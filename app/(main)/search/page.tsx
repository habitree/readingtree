"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, X, BookOpen, Calendar, Tag, FileText, Clock, Trash2 } from "lucide-react";
import { SearchFilters } from "@/components/search/search-filters";
import { SearchResults } from "@/components/search/search-results";
import { Pagination } from "@/components/search/pagination";
import { useSearch } from "@/hooks/use-search";
import { useSearchHistory } from "@/hooks/use-search-history";
import { Loader2, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { typography } from "@/lib/design-tokens";
import { useTranslation } from "@/lib/i18n";

/**
 * 검색 페이지
 * US-019~US-023: 검색 기능
 */
export default function SearchPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { search, isLoading, error } = useSearch();
  const { history, addQuery: addToHistory, removeQuery: removeFromHistory, clearHistory } = useSearchHistory();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevParamsRef = useRef<string>("");

  // 초기 검색어는 URL에서 가져오기
  const [query, setQuery] = useState(() => searchParams.get("q") || "");
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );
  const [totalPages, setTotalPages] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // 책 목록 (필터 칩에서 책 제목 표시용)
  const [booksMap, setBooksMap] = useState<Map<string, string>>(new Map());

  // URL 파라미터에서 필터 값 추출 (의존성 최적화)
  const bookId = searchParams.get("bookId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const tags = searchParams.get("tags");
  const types = searchParams.get("types");
  const urlPage = parseInt(searchParams.get("page") || "1", 10);

  // URL에서 페이지 동기화
  useEffect(() => {
    if (urlPage !== currentPage) {
      setCurrentPage(urlPage);
    }
  }, [urlPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // 검색 실행 함수
  const executeSearch = useCallback(async (searchQuery: string, page: number) => {
    const hasQuery = searchQuery.trim().length > 0;
    const hasBookFilter = !!bookId;
    const hasDateFilter = !!startDate || !!endDate;
    const hasTagFilter = !!tags;
    const hasTypeFilter = !!types;

    if (!hasQuery && !hasBookFilter && !hasDateFilter && !hasTagFilter && !hasTypeFilter) {
      setResults([]);
      setTotal(0);
      setTotalPages(0);
      return;
    }

    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (bookId) params.set("bookId", bookId);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (tags) params.set("tags", tags);
      if (types) params.set("types", types);
      params.set("page", page.toString());

      // URL 업데이트
      router.replace(`/search?${params.toString()}`, { scroll: false });

      const data = await search(params);
      setResults(data.results || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);

      // 검색 성공 + 결과 있으면 히스토리에 추가
      if (searchQuery.trim() && (data.total || 0) > 0) {
        addToHistory(searchQuery.trim());
      }
    } catch (err) {
      console.error("검색 오류:", err);
      setResults([]);
      setTotal(0);
      setTotalPages(0);
    }
  }, [bookId, startDate, endDate, tags, types, search, router]);

  // 단일 useEffect: 모든 검색 조건 변경에 대응
  useEffect(() => {
    // 파라미터 직렬화로 중복 실행 방지
    const paramsKey = `${query}|${bookId}|${startDate}|${endDate}|${tags}|${types}|${currentPage}`;
    if (paramsKey === prevParamsRef.current) return;
    prevParamsRef.current = paramsKey;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // 검색어 변경만 디바운스, 나머지는 즉시 실행
    const delay = query !== (searchParams.get("q") || "") ? 300 : 0;

    searchTimeoutRef.current = setTimeout(() => {
      executeSearch(query, currentPage);
    }, delay);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, bookId, startDate, endDate, tags, types, currentPage, executeSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setCurrentPage(1);
  }, []);

  const handleHistorySelect = useCallback((historyQuery: string) => {
    setQuery(historyQuery);
    setCurrentPage(1);
  }, []);

  // 필터 칩에서 책 목록 받아오기
  const handleBooksLoaded = useCallback((books: Array<{ id: string; books: { title: string } }>) => {
    const map = new Map<string, string>();
    books.forEach((b) => {
      map.set(b.id, (b as any).books?.title || "");
    });
    setBooksMap(map);
  }, []);

  // 초기 상태 여부 (검색어/필터 없음)
  const hasQuery = query.trim().length > 0;
  const hasBookFilter = !!bookId;
  const hasDateFilter = !!startDate || !!endDate;
  const hasTagFilter = !!tags;
  const hasTypeFilter = !!types;
  const isInitialState = !hasQuery && !hasBookFilter && !hasDateFilter && !hasTagFilter && !hasTypeFilter;
  const hasAnyFilter = hasBookFilter || hasDateFilter || hasTagFilter || hasTypeFilter;

  // 개별 필터 제거
  const clearFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.set("page", "1");
    router.push(`/search?${params.toString()}`);
  };

  // 모든 필터 초기화
  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    params.set("page", "1");
    router.push(`/search?${params.toString()}`);
  }, [query, router]);

  // 기록 유형 라벨
  const getTypeLabel = (type: string) => {
    if (type.includes("transcription")) return t("searchFilters.typeTranscription");
    if (type.includes("quote")) return t("searchFilters.typeQuote");
    if (type === "photo") return t("searchFilters.typePhoto");
    if (type === "memo") return t("searchFilters.typeMemo");
    return type;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className={typography.pageTitle}>{t("search.search")}</h1>
        <p className={typography.pageDescription}>
          {t("search.pageDescription")}
        </p>
      </div>

      {/* 검색바 - 모바일에서 상단 고정 */}
      <div className="sticky top-12 sm:top-14 z-30 -mx-2 sm:-mx-4 px-2 sm:px-4 py-3 bg-background/95 backdrop-blur-sm border-b lg:relative lg:top-0 lg:mx-0 lg:px-0 lg:py-0 lg:bg-transparent lg:backdrop-blur-none lg:border-b-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* 검색 입력 */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("search.searchInputPlaceholder")}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="pl-10"
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {/* 모바일 필터 토글 버튼 */}
          <Button
            variant="outline"
            className="lg:hidden flex items-center justify-between w-full sm:w-auto"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>{t("search.filters")}</span>
              {hasAnyFilter && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs justify-center">
                  {[hasBookFilter, hasDateFilter, hasTagFilter, hasTypeFilter].filter(Boolean).length}
                </Badge>
              )}
            </div>
            {isFilterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* 적용된 필터 칩 */}
        {hasAnyFilter && (
          <div className="flex flex-wrap gap-2 mt-3">
            {bookId && booksMap.get(bookId) && (
              <Badge variant="secondary" className="gap-1 pr-1">
                <BookOpen className="h-3 w-3" />
                <span className="max-w-[120px] truncate">{booksMap.get(bookId)}</span>
                <button
                  onClick={() => clearFilter("bookId")}
                  className="ml-1 rounded-full hover:bg-destructive hover:text-destructive-foreground p-0.5"
                  aria-label={t("searchFilters.removeBookFilter")}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {(startDate || endDate) && (
              <Badge variant="secondary" className="gap-1 pr-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {startDate && endDate
                    ? `${startDate} ~ ${endDate}`
                    : startDate
                    ? `${startDate} ~`
                    : `~ ${endDate}`}
                </span>
                <button
                  onClick={() => {
                    clearFilter("startDate");
                    clearFilter("endDate");
                  }}
                  className="ml-1 rounded-full hover:bg-destructive hover:text-destructive-foreground p-0.5"
                  aria-label={t("searchFilters.removeDateFilter")}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {types && (
              <Badge variant="secondary" className="gap-1 pr-1">
                <FileText className="h-3 w-3" />
                <span>{getTypeLabel(types)}</span>
                <button
                  onClick={() => clearFilter("types")}
                  className="ml-1 rounded-full hover:bg-destructive hover:text-destructive-foreground p-0.5"
                  aria-label={t("searchFilters.removeTypeFilter")}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {tags && tags.split(",").map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                <Tag className="h-3 w-3" />
                <span className="max-w-[80px] truncate">{tag.trim()}</span>
                <button
                  onClick={() => {
                    const newTags = tags
                      .split(",")
                      .filter((t) => t.trim() !== tag.trim())
                      .join(",");
                    if (newTags) {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set("tags", newTags);
                      params.set("page", "1");
                      router.push(`/search?${params.toString()}`);
                    } else {
                      clearFilter("tags");
                    }
                  }}
                  className="ml-1 rounded-full hover:bg-destructive hover:text-destructive-foreground p-0.5"
                  aria-label={`${t("searchFilters.removeTag")} ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* 필터 사이드바 - 모바일에서는 조건부 표시 */}
        <div className={cn(
          "lg:col-span-1",
          !isFilterOpen && "hidden lg:block transition-all"
        )}>
          <div className="sticky top-20 bg-background/95 backdrop-blur p-4 rounded-lg border lg:border-none lg:p-0">
            <h2 className="text-lg font-semibold mb-4 hidden lg:block">{t("search.filters")}</h2>
            <SearchFilters onBooksLoaded={handleBooksLoaded} />
          </div>
        </div>

        {/* 검색 결과 */}
        <div className="lg:col-span-3 space-y-4">
          {/* 접근성: 검색 결과 상태 알림 */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {isLoading
              ? t("search.searching")
              : isInitialState
              ? t("search.searchTip")
              : t("search.totalResults").replace("{total}", String(total))}
          </div>

          {error && (
            <div className="text-center py-8 text-destructive">
              <p>{t("search.error").replace("{message}", error.message)}</p>
            </div>
          )}

          {!error && (
            <>
              {total > 0 && (
                <p className="text-sm text-muted-foreground">
                  {t("search.foundResults").replace("{total}", String(total))}
                </p>
              )}

              {/* 최근 검색어 (초기 상태일 때만) */}
              {isInitialState && history.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{t("search.recentSearches")}</span>
                    </div>
                    <button
                      onClick={clearHistory}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      {t("search.clearHistory")}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {history.map((q) => (
                      <Badge
                        key={q}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent gap-1 pr-1"
                        onClick={() => handleHistorySelect(q)}
                      >
                        <span className="max-w-[150px] truncate">{q}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromHistory(q);
                          }}
                          className="ml-0.5 rounded-full hover:bg-destructive hover:text-destructive-foreground p-0.5"
                          aria-label={`${t("search.removeHistoryItem")} ${q}`}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <SearchResults
                results={results}
                searchQuery={query}
                isLoading={isLoading}
                isInitialState={isInitialState}
                onClearFilters={hasAnyFilter ? clearAllFilters : undefined}
              />

              {totalPages > 1 && (
                <Pagination currentPage={currentPage} totalPages={totalPages} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

