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

/** "create" = 신규 reading_log 생성, "attach" = 기존 log 에 사진 첨부 */
export type StampCaptureMode = "create" | "attach";

interface StampCaptureState {
  isOpen: boolean;
  mode: StampCaptureMode;
  targetLogId: string | null;
  selectedBook: StampSelectedBook | null;
  prefillDurationSeconds: number | null;
  prefillStartPage: number | null;
  prefillEndPage: number | null;
  open: () => void;
  openWithBook: (book: StampSelectedBook, options?: { endPage?: number }) => void;
  openWithTimer: (book: StampSelectedBook | null, durationSeconds: number) => void;
  /** 기존 reading_log 에 사진 첨부 모드로 진입 */
  openAttach: (
    logId: string,
    options?: {
      book?: StampSelectedBook | null;
      startPage?: number;
      endPage?: number;
      durationSeconds?: number;
    },
  ) => void;
  selectBook: (book: StampSelectedBook | null) => void;
  close: () => void;
  reset: () => void;
}

export const useStampCaptureStore = create<StampCaptureState>((set) => ({
  isOpen: false,
  mode: "create",
  targetLogId: null,
  selectedBook: null,
  prefillDurationSeconds: null,
  prefillStartPage: null,
  prefillEndPage: null,

  open: () =>
    set({
      isOpen: true,
      mode: "create",
      targetLogId: null,
    }),
  openWithBook: (book, options) =>
    set({
      isOpen: true,
      mode: "create",
      targetLogId: null,
      selectedBook: book,
      prefillEndPage: options?.endPage ?? null,
    }),
  openWithTimer: (book, durationSeconds) =>
    set({
      isOpen: true,
      mode: "create",
      targetLogId: null,
      selectedBook: book,
      prefillDurationSeconds: durationSeconds,
    }),
  openAttach: (logId, options) =>
    set({
      isOpen: true,
      mode: "attach",
      targetLogId: logId,
      selectedBook: options?.book ?? null,
      prefillStartPage: options?.startPage ?? null,
      prefillEndPage: options?.endPage ?? null,
      prefillDurationSeconds: options?.durationSeconds ?? null,
    }),
  selectBook: (book) => set({ selectedBook: book }),
  close: () => set({ isOpen: false }),
  reset: () =>
    set({
      isOpen: false,
      mode: "create",
      targetLogId: null,
      selectedBook: null,
      prefillDurationSeconds: null,
      prefillStartPage: null,
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
