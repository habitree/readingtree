"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { getContinueReadingBooks } from "@/app/actions/books";
import { useAuth } from "@/hooks/use-auth";

export interface StampSelectedBook {
  id: string; // user_books.id
  bookId: string; // books.id
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  totalPages: number | null;
}

interface StampCaptureState {
  isOpen: boolean;
  selectedBook: StampSelectedBook | null;
  prefillDurationSeconds: number | null;
  prefillEndPage: number | null;
  open: () => void;
  openWithBook: (book: StampSelectedBook, options?: { endPage?: number }) => void;
  openWithTimer: (book: StampSelectedBook | null, durationSeconds: number) => void;
  selectBook: (book: StampSelectedBook | null) => void;
  close: () => void;
  reset: () => void;
}

export const useStampCaptureStore = create<StampCaptureState>((set) => ({
  isOpen: false,
  selectedBook: null,
  prefillDurationSeconds: null,
  prefillEndPage: null,

  open: () => set({ isOpen: true }),
  openWithBook: (book, options) =>
    set({
      isOpen: true,
      selectedBook: book,
      prefillEndPage: options?.endPage ?? null,
    }),
  openWithTimer: (book, durationSeconds) =>
    set({ isOpen: true, selectedBook: book, prefillDurationSeconds: durationSeconds }),
  selectBook: (book) => set({ selectedBook: book }),
  close: () => set({ isOpen: false }),
  reset: () =>
    set({
      isOpen: false,
      selectedBook: null,
      prefillDurationSeconds: null,
      prefillEndPage: null,
    }),
}));

/**
 * Stamp Composer 진입 훅.
 * 시트가 열리면 최근 읽던 책을 자동 선택 (사용자가 변경 가능).
 */
export function useStampCapture() {
  const { user } = useAuth();
  const store = useStampCaptureStore();

  useEffect(() => {
    if (!store.isOpen || !user || store.selectedBook) return;

    getContinueReadingBooks(undefined, 1)
      .then((books) => {
        if (books.length > 0 && !store.selectedBook) {
          const b = books[0];
          store.selectBook({
            id: b.userBookId,
            bookId: b.bookId,
            title: b.title,
            author: b.author,
            coverImageUrl: b.coverImageUrl,
            totalPages: b.totalPages ?? null,
          });
        }
      })
      .catch(() => {
        // 자동 선택 실패는 무시 — 사용자가 직접 선택 가능
      });
  }, [store.isOpen, user, store.selectedBook]); // eslint-disable-line react-hooks/exhaustive-deps

  return store;
}
