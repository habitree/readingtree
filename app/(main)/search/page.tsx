"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, X, BookOpen, Calendar, Tag, FileText } from "lucide-react";
import { SearchFilters } from "@/components/search/search-filters";
import { SearchResults } from "@/components/search/search-results";
import { Pagination } from "@/components/search/pagination";
import { useSearch } from "@/hooks/use-search";
import { Loader2, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { typography } from "@/lib/design-tokens";

/**
 * 검색 페이지
 * US-019~US-023: 검색 기능
 */
export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { search, isLoading, error } = useSearch();
  const isInitialMount = useRef(true);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // 검색 실행 함수 (디바운싱)
  const performSearch = useCallback(async (searchQuery: string) => {
    // 검색어나 필터가 하나라도 있으면 검색 실행
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
      params.set("page", currentPage.toString());

      // URL 업데이트 (검색 실행과 함께)
      router.replace(`/search?${params.toString()}`, { scroll: false });

      const data = await search(params);
      setResults(data.results || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error("검색 오류:", err);
      setResults([]);
      setTotal(0);
      setTotalPages(0);
    }
  }, [bookId, startDate, endDate, tags, types, currentPage, search, router]);

  // 초기 마운트 시 URL 파라미터에서 검색어 가져오기 및 검색 실행
  useEffect(() => {
    if (isInitialMount.current) {
      const urlQuery = searchParams.get("q") || "";
      const hasQuery = urlQuery.trim().length > 0;
      const hasBookFilter = !!bookId;
      const hasDateFilter = !!startDate || !!endDate;
      const hasTagFilter = !!tags;
      const hasTypeFilter = !!types;

      // 초기 마운트 시 검색 실행 (URL에 검색어나 필터가 있는 경우)
      if (hasQuery || hasBookFilter || hasDateFilter || hasTagFilter || hasTypeFilter) {
        // URL 파라미터를 직접 사용하여 검색 실행
        const params = new URLSearchParams();
        if (urlQuery.trim()) params.set("q", urlQuery.trim());
        if (bookId) params.set("bookId", bookId);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        if (tags) params.set("tags", tags);
        if (types) params.set("types", types);
        params.set("page", urlPage.toString());

        search(params)
          .then((data) => {
            setResults(data.results || []);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 0);
          })
          .catch((err) => {
            console.error("초기 검색 오류:", err);
            setResults([]);
            setTotal(0);
            setTotalPages(0);
          });
      }

      isInitialMount.current = false;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // URL 파라미터 변경 시 페이지 번호 업데이트 (외부에서 URL 변경 시)
  useEffect(() => {
    if (urlPage !== currentPage && !isInitialMount.current) {
      setCurrentPage(urlPage);
    }
  }, [urlPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // 검색어 또는 필터 변경 시 검색 실행 (디바운싱)
  useEffect(() => {
    // 초기 마운트 시에는 검색 실행하지 않음 (위의 useEffect에서 처리)
    if (isInitialMount.current) {
      return;
    }

    // 이전 타이머 취소
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, bookId, startDate, endDate, tags, types, currentPage, performSearch]);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setCurrentPage(1);
    // URL 업데이트와 검색 실행은 performSearch의 useEffect에서 처리
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
    if (type.includes("quote") || type.includes("transcription")) return "필사";
    if (type === "photo") return "사진";
    if (type === "memo") return "기록";
    return type;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className={typography.pageTitle}>검색</h1>
        <p className={typography.pageDescription}>
          저장한 모든 기록을 검색하세요
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
              placeholder="책 제목, 저자, 기록 내용 검색..."
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
              <span>필터</span>
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
                  aria-label="책 필터 제거"
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
                  aria-label="날짜 필터 제거"
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
                  aria-label="유형 필터 제거"
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
                  aria-label={`${tag} 태그 제거`}
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
            <h2 className="text-lg font-semibold mb-4 hidden lg:block">필터</h2>
            <SearchFilters onBooksLoaded={handleBooksLoaded} />
          </div>
        </div>

        {/* 검색 결과 */}
        <div className="lg:col-span-3 space-y-4">
          {/* 접근성: 검색 결과 상태 알림 */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {isLoading
              ? "검색 중입니다..."
              : isInitialState
              ? "검색어를 입력하거나 필터를 사용하세요."
              : `${total}개의 검색 결과가 있습니다.`}
          </div>

          {error && (
            <div className="text-center py-8 text-destructive">
              <p>검색 중 오류가 발생했습니다: {error.message}</p>
            </div>
          )}

          {!error && (
            <>
              {total > 0 && (
                <p className="text-sm text-muted-foreground">
                  총 {total}개의 결과를 찾았습니다.
                </p>
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

