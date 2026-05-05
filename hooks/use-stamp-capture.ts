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
 *
 * attach 모드(=기존 reading_log에 사진 첨부)에서는 자동 책 선택을 건너뛴다.
 *  - attach는 기록의 user_book_id가 진짜 소스. 자동 선택이 끼어들면
 *    화면에 표시되는 책 정보가 실제 첨부 대상과 달라 보일 수 있음.
 *  - 호출처(예: ReadingTimeTab)가 openAttach({ book }) 로 명시하면 그대로 유지.
 */
export function useStampCapture() {
  const { user } = useAuth();
  const store = useStampCaptureStore();

  useEffect(() => {
    if (!store.isOpen || !user || store.selectedBook) return;
    if (store.mode === "attach") return;

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
