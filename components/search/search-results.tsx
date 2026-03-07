"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { SearchResultCard } from "./search-result-card";
import { SearchProgressGroup, groupProgressNotes } from "./search-progress-group";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchX, Lightbulb } from "lucide-react";
import type { NoteWithBook } from "@/types/note";
import { useTranslation } from "@/lib/i18n";

interface SearchResultsProps {
  results: NoteWithBook[];
  searchQuery?: string;
  isLoading?: boolean;
  /** 초기 상태 여부 (검색어/필터 없음) */
  isInitialState?: boolean;
  /** 필터 초기화 콜백 */
  onClearFilters?: () => void;
}

/**
 * 검색 결과 목록 컴포넌트
 */
export function SearchResults({
  results,
  searchQuery,
  isLoading,
  isInitialState,
  onClearFilters,
}: SearchResultsProps) {
  const { t } = useTranslation();

  // 진행기록과 일반 기록 분리 + 진행기록 날짜별 그룹화
  const { otherNotes, progressGroups } = useMemo(() => {
    const progressNotes = results.filter((r) => r.type === "progress");
    const otherNotes = results.filter((r) => r.type !== "progress");
    const progressGroups = groupProgressNotes(progressNotes);
    return { otherNotes, progressGroups };
  }, [results]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </motion.div>
        ))}
      </div>
    );
  }

  // 초기 상태 (검색어/필터 없음)
  if (isInitialState) {
    return (
      <EmptyState
        icon={Lightbulb}
        title={t("search.whatToFind")}
        description={t("search.searchHint")}
        variant="encouraging"
        nextStepHint={t("search.searchTip")}
      />
    );
  }

  // 검색 결과 없음
  if (results.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={t("search.noResults")}
        description={
          searchQuery
            ? t("search.noResultsFor").replace("{query}", searchQuery)
            : t("search.noResultsFiltered")
        }
        variant="curious"
        nextStepHint={t("search.shorterHint")}
        action={
          onClearFilters
            ? {
                label: t("search.filterReset"),
                onClick: onClearFilters,
              }
            : undefined
        }
        actionVariant="outline"
      />
    );
  }

  const hasProgress = progressGroups.length > 0;
  const hasOther = otherNotes.length > 0;

  return (
    <div className="space-y-6">
      {/* 진행기록 그룹 (날짜별 묶음) */}
      {hasProgress && (
        <div className="space-y-4">
          {progressGroups.map((group, index) => (
            <motion.div
              key={group.dateKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
            >
              <SearchProgressGroup
                dateKey={group.dateKey}
                bookGroups={group.bookGroups}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* 일반 기록 카드 그리드 */}
      {hasOther && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {otherNotes.map((note, index) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (hasProgress ? progressGroups.length * 0.08 : 0) + index * 0.05, duration: 0.3 }}
            >
              <SearchResultCard note={note} searchQuery={searchQuery} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

