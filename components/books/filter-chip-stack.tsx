"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  describeActiveFilters,
  parseLibrarySearchParams,
  removeFilter,
  serializeLibraryQuery,
  type LibraryFilterChip,
} from "@/lib/library-query";

export interface FilterChipStackProps {
  shelfNameById?: Record<string, string>;
  basePath?: string;
}

/**
 * 서재 페이지 상단에 렌더되는 활성 필터 칩 스택.
 * URL 쿼리와 양방향으로 연결되어, 칩 클릭으로 개별 필터를 제거하거나 전체를 지울 수 있다.
 */
export function FilterChipStack({
  shelfNameById,
  basePath = "/books",
}: FilterChipStackProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const state = parseLibrarySearchParams(searchParams);
  const chips = describeActiveFilters(state, { shelfNameById });

  if (chips.length === 0) return null;

  const handleRemove = (key: LibraryFilterChip["key"]) => {
    const next = removeFilter(state, key);
    router.push(`${basePath}${serializeLibraryQuery(next)}`);
  };

  const handleClearAll = () => {
    router.push(basePath);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      {chips.map((chip) => (
        <Badge
          key={`${chip.key}-${chip.value}`}
          variant="secondary"
          className="gap-1 pl-2.5 pr-1 py-1"
        >
          <span className="text-xs">{chip.label}</span>
          <button
            type="button"
            onClick={() => handleRemove(chip.key)}
            className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            aria-label={`${chip.label} 필터 제거`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {chips.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={handleClearAll}
        >
          모두 지우기
        </Button>
      )}
    </div>
  );
}
