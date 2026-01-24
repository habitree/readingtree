"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Loader2 } from "lucide-react";

interface BookSearchInputProps {
  className?: string;
  basePath?: string;
}

/**
 * 책 검색 입력 컴포넌트
 * 책 제목, 저자, ISBN으로 검색
 */
export function BookSearchInput({ className, basePath: propBasePath }: BookSearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [query, setQuery] = useState(() => searchParams.get("q") || "");
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 현재 경로에 따라 기본 경로 결정 (서재 개별 페이지, 샘플 페이지인지 확인)
  const basePath = propBasePath || (pathname?.startsWith("/bookshelves/") ? pathname : pathname?.startsWith("/sample") ? "/sample" : "/books");

  // URL 파라미터 변경 시 검색어 업데이트
  useEffect(() => {
    const urlQuery = searchParams.get("q") || "";
    if (urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, [searchParams]);

  // 검색어 변경 시 URL 업데이트 (디바운싱)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) {
        params.set("q", query.trim());
      } else {
        params.delete("q");
      }
      params.set("page", "1"); // 검색 시 첫 페이지로
      router.push(`${basePath}?${params.toString()}`, { scroll: false });
      setIsSearching(false);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, router, searchParams, basePath]);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <Search
        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        placeholder="검색"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        className="pl-9 pr-9 h-9 text-sm"
        aria-label="책 검색"
      />
      {isSearching && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2" aria-hidden="true">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

