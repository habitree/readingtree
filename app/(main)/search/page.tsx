"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { SearchFilters } from "@/components/search/search-filters";
import { SearchResults } from "@/components/search/search-results";
import { Pagination } from "@/components/search/pagination";
import { useSearch } from "@/hooks/use-search";
import { Loader2, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">검색</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
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
              placeholder="검색어"
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
            </div>
            {isFilterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* 필터 사이드바 - 모바일에서는 조건부 표시 */}
        <div className={cn(
          "lg:col-span-1",
          !isFilterOpen && "hidden lg:block transition-all"
        )}>
          <div className="sticky top-20 bg-background/95 backdrop-blur p-4 rounded-lg border lg:border-none lg:p-0">
            <h2 className="text-lg font-semibold mb-4 hidden lg:block">필터</h2>
            <SearchFilters />
          </div>
        </div>

        {/* 검색 결과 */}
        <div className="lg:col-span-3 space-y-4">
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

