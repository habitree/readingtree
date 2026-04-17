"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getContinueReadingBooks } from "@/app/actions/books";
import type { User } from "@supabase/supabase-js";

interface ContinueBook {
  id: string; // user_books.id
  bookId: string; // books.id
  title: string;
  author: string | null;
  coverImageUrl: string | null;
}

const REFETCH_INTERVAL_MS = 5 * 60 * 1000; // 5분

/**
 * 이어읽기 책 데이터를 로드하고 visibilitychange 이벤트로 자동 갱신하는 훅
 * mobile-nav.tsx와 sidebar.tsx에서 공용으로 사용
 */
export function useContinueReading(user: User | null) {
  const [continueBook, setContinueBook] = useState<ContinueBook | null>(null);
  const lastFetchRef = useRef(0);

  const fetchBook = useCallback(async () => {
    if (!user) return;
    if (Date.now() - lastFetchRef.current < REFETCH_INTERVAL_MS) return;

    try {
      const books = await getContinueReadingBooks(undefined, 1);
      if (books.length > 0) {
        const b = books[0];
        setContinueBook({
          id: b.userBookId,
          bookId: b.bookId,
          title: b.title,
          author: b.author,
          coverImageUrl: b.coverImageUrl,
        });
      } else {
        setContinueBook(null);
      }
      lastFetchRef.current = Date.now();
    } catch {
      // 실패 시 기존 데이터 유지
    }
  }, [user]);

  // 마운트 시 최초 로드
  useEffect(() => {
    fetchBook();
  }, [fetchBook]);

  // visibilitychange 이벤트로 포커스 복귀 시 자동 갱신
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") {
        fetchBook();
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [fetchBook]);

  return { continueBook, refresh: fetchBook };
}
