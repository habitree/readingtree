"use client";

import Link from "next/link";
import { BookOpen, Compass, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface SearchNoResultsProps {
  query: string;
  /** 제안된 교정어 (있을 때만 표시) */
  suggestion?: string | null;
  /** 검색 카테고리 전환 옵션 */
  alternateSearches?: Array<{
    label: string;
    href: string;
  }>;
}

/**
 * 검색 결과 0건일 때 대안을 제시하는 빈 상태.
 */
export function SearchNoResults({
  query,
  suggestion,
  alternateSearches,
}: SearchNoResultsProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Search className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          “{query}”에 대한 결과가 없어요
        </p>
        <p className="text-xs text-muted-foreground">
          검색어를 바꿔보거나 다른 영역에서 찾아보세요.
        </p>
      </div>

      {suggestion && (
        <Button asChild variant="outline" size="sm">
          <Link href={`?q=${encodeURIComponent(suggestion)}`}>
            “{suggestion}”로 다시 찾아보기
          </Link>
        </Button>
      )}

      {alternateSearches && alternateSearches.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {alternateSearches.map((alt) => (
            <Button
              key={alt.href}
              asChild
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
            >
              <Link href={alt.href}>
                <Compass className="h-3.5 w-3.5" />
                {alt.label}
              </Link>
            </Button>
          ))}
        </div>
      )}

      <div className="pt-4 text-xs text-muted-foreground">
        <p className="flex items-center justify-center gap-1">
          <BookOpen className="h-3 w-3" />
          검색 문법:{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            태그:자기계발
          </code>
          {" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            책:김영하
          </code>
        </p>
      </div>
    </div>
  );
}
