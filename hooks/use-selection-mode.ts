"use client";

import { useCallback, useMemo, useRef, useState } from "react";

/**
 * 서재·노트 등에서 재사용되는 다중선택 훅.
 *
 *   const { selected, isActive, enter, exit, toggle, selectAll, clear, range } =
 *     useSelectionMode(items, (item) => item.id);
 *
 * - 제네릭: `T`와 `getId`를 통해 어떤 아이템이든 지원
 * - Shift+클릭으로 범위 선택 (`range`)
 */
export interface UseSelectionModeResult<T> {
  selected: Set<string>;
  isActive: boolean;
  enter: () => void;
  exit: () => void;
  toggle: (id: string) => void;
  /** Shift+클릭 등으로 범위 선택. lastSelected 이후 인덱스까지 선택. */
  range: (id: string) => void;
  selectAll: () => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
  /** 선택된 아이템 반환 (원본 items 순서 유지) */
  selectedItems: T[];
  selectedCount: number;
}

export function useSelectionMode<T>(
  items: T[],
  getId: (item: T) => string,
): UseSelectionModeResult<T> {
  const [isActive, setIsActive] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const lastSelectedRef = useRef<string | null>(null);

  const enter = useCallback(() => {
    setIsActive(true);
  }, []);

  const exit = useCallback(() => {
    setIsActive(false);
    setSelected(new Set());
    lastSelectedRef.current = null;
  }, []);

  const toggle = useCallback(
    (id: string) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
          lastSelectedRef.current = id;
        }
        return next;
      });
    },
    [],
  );

  const range = useCallback(
    (id: string) => {
      const ids = items.map(getId);
      const currentIdx = ids.indexOf(id);
      if (currentIdx === -1) return;

      const lastId = lastSelectedRef.current;
      const lastIdx = lastId ? ids.indexOf(lastId) : -1;

      if (lastIdx === -1) {
        toggle(id);
        return;
      }

      const [start, end] = lastIdx < currentIdx
        ? [lastIdx, currentIdx]
        : [currentIdx, lastIdx];

      setSelected((prev) => {
        const next = new Set(prev);
        for (let i = start; i <= end; i++) {
          next.add(ids[i]);
        }
        return next;
      });
      lastSelectedRef.current = id;
    },
    [items, getId, toggle],
  );

  const selectAll = useCallback(() => {
    setSelected(new Set(items.map(getId)));
  }, [items, getId]);

  const clear = useCallback(() => {
    setSelected(new Set());
    lastSelectedRef.current = null;
  }, []);

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  const selectedItems = useMemo(
    () => items.filter((item) => selected.has(getId(item))),
    [items, selected, getId],
  );

  return {
    selected,
    isActive,
    enter,
    exit,
    toggle,
    range,
    selectAll,
    clear,
    isSelected,
    selectedItems,
    selectedCount: selected.size,
  };
}
