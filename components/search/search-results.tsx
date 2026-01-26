import { motion } from "framer-motion";
import { SearchResultCard } from "./search-result-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchX, Lightbulb } from "lucide-react";
import type { NoteWithBook } from "@/types/note";

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
        title="무엇을 찾고 있나요?"
        description="책 제목, 저자, 기록 내용으로 검색할 수 있어요"
        variant="encouraging"
        nextStepHint="위 검색창에 검색어를 입력하거나 필터를 사용해보세요"
      />
    );
  }

  // 검색 결과 없음
  if (results.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="검색 결과가 없어요"
        description={
          searchQuery
            ? `"${searchQuery}"와 일치하는 기록을 찾지 못했어요`
            : "조건에 맞는 기록을 찾지 못했어요"
        }
        variant="curious"
        nextStepHint="검색어를 더 짧게 입력하거나 다른 필터를 사용해보세요"
        action={
          onClearFilters
            ? {
                label: "필터 초기화",
                onClick: onClearFilters,
              }
            : undefined
        }
        actionVariant="outline"
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {results.map((note, index) => (
        <motion.div
          key={note.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
        >
          <SearchResultCard note={note} searchQuery={searchQuery} />
        </motion.div>
      ))}
    </div>
  );
}

