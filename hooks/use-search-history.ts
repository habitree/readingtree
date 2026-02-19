"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "readingtree_search_history";
const MAX_ITEMS = 10;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      // localStorage 접근 실패 무시
    }
  }, []);

  const addQuery = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setHistory((prev) => {
      const filtered = prev.filter((q) => q !== trimmed);
      const updated = [trimmed, ...filtered].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // localStorage 쓰기 실패 무시
      }
      return updated;
    });
  }, []);

  const removeQuery = useCallback((query: string) => {
    setHistory((prev) => {
      const updated = prev.filter((q) => q !== query);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // localStorage 쓰기 실패 무시
      }
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage 접근 실패 무시
    }
  }, []);

  return { history, addQuery, removeQuery, clearHistory };
}
