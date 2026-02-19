"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { grids } from "@/lib/design-tokens";
import { EmptyState } from "@/components/ui/empty-state";
import type { EmptyStateProps } from "@/components/ui/empty-state";

// ============================================================================
// ListContainer - 로딩/빈상태/그리드 자동 처리
// ============================================================================

type GridVariant = keyof typeof grids;

export interface ListContainerProps<T> {
  /** 아이템 배열 */
  items: T[] | undefined | null;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 로딩 스켈레톤 (isLoading=true일 때 표시) */
  loadingSkeleton?: React.ReactNode;
  /** 빈 상태 설정 (EmptyState에 전달) */
  emptyState?: Omit<EmptyStateProps, "className">;
  /** 각 아이템 렌더 함수 */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** grids 토큰 키 */
  gridVariant?: GridVariant;
  /** 커스텀 그리드 클래스 (gridVariant 대신 사용) */
  gridClassName?: string;
  /** 컨테이너 추가 클래스 */
  className?: string;
}

function ListContainer<T>({
  items,
  isLoading,
  loadingSkeleton,
  emptyState,
  renderItem,
  gridVariant,
  gridClassName,
  className,
}: ListContainerProps<T>) {
  // 로딩 상태
  if (isLoading) {
    return loadingSkeleton ? <>{loadingSkeleton}</> : null;
  }

  // 빈 상태
  if (!items || items.length === 0) {
    if (emptyState) {
      return <EmptyState {...emptyState} />;
    }
    return null;
  }

  // 그리드 클래스 결정
  const gridClass = gridClassName ?? (gridVariant ? grids[gridVariant] : undefined);

  return (
    <div className={cn(gridClass, className)}>
      {items.map((item, index) => renderItem(item, index))}
    </div>
  );
}

export { ListContainer };
