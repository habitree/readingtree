"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface BookSearchInputProps {
  className?: string;
  basePath?: string;
}

/**
 * 책 검색 입력 컴포넌트
 * 책 제목, 저자, ISBN으로 검색
 *
 * 한글 IME 조합 문제 해결:
 * - compositionstart/compositionend 이벤트로 조합 상태 추적
 * - 조합 중에는 URL 동기화 방지
 * - 사용자 입력과 URL 동기화를 분리하여 순환 의존성 해결
 */
export function BookSearchInput({ className, basePath: propBasePath }: BookSearchInputProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [query, setQuery] = useState(() => searchParams.get("q") || "");
  const [isSearching, setIsSearching] = useState(false);

  // Refs for tracking state without re-renders
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isComposingRef = useRef(false); // IME 조합 중 상태
  const isUserInputRef = useRef(false); // 사용자 입력으로 인한 변경인지 추적
  const lastUrlQueryRef = useRef(searchParams.get("q") || ""); // 마지막 URL 쿼리 저장

  // 현재 경로에 따라 기본 경로 결정 (서재 개별 페이지, 샘플 페이지인지 확인)
  const basePath = propBasePath || (pathname?.startsWith("/bookshelves/") ? pathname : pathname?.startsWith("/sample") ? "/sample" : "/books");

  // URL 파라미터 변경 시 검색어 업데이트 (외부 네비게이션으로 인한 변경만)
  useEffect(() => {
    const urlQuery = searchParams.get("q") || "";

    // 사용자 입력으로 인한 변경이면 무시 (순환 의존성 방지)
    if (isUserInputRef.current) {
      isUserInputRef.current = false;
      lastUrlQueryRef.current = urlQuery;
      return;
    }

    // URL이 외부에서 변경된 경우에만 상태 업데이트
    if (urlQuery !== lastUrlQueryRef.current) {
      lastUrlQueryRef.current = urlQuery;
      setQuery(urlQuery);
    }
  }, [searchParams]);

  // URL 업데이트 함수 (공통)
  const syncQueryToUrl = useCallback((searchQuery: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const currentUrlQuery = searchParams.get("q") || "";
    if (searchQuery.trim() === currentUrlQuery) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim());
      } else {
        params.delete("q");
      }
      params.set("page", "1");

      isUserInputRef.current = true;
      lastUrlQueryRef.current = searchQuery.trim();

      router.push(`${basePath}?${params.toString()}`, { scroll: false });
      setIsSearching(false);
    }, 300);
  }, [router, searchParams, basePath]);

  // 검색어 변경 시 URL 업데이트 (디바운싱, IME 조합 중에는 건너뜀)
  useEffect(() => {
    if (isComposingRef.current) {
      return;
    }
    syncQueryToUrl(query);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, syncQueryToUrl]);

  // IME 조합 이벤트 핸들러
  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    // 조합 완료 후 즉시 URL 동기화 (useEffect가 재실행되지 않으므로 직접 호출)
    syncQueryToUrl(e.currentTarget.value);
  }, [syncQueryToUrl]);

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <Search
        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        placeholder={t("books.searchInputPlaceholder")}
        value={query}
        onChange={handleQueryChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        className="pl-9 pr-9 h-9 text-sm"
        aria-label={t("books.searchInputAriaLabel")}
      />
      {isSearching && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2" aria-hidden="true">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

