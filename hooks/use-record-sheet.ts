"use client";

/**
 * RecordSheet 통합 시트 훅 (기록 기능 전면 개편 Phase 3)
 *
 * 모드:
 *  - "start"  → 세션 시작 (책·시작 페이지·시간 옵션)
 *  - "end"    → 세션 종료 (끝 페이지·메모·북마크·사진들)
 *  - "detail" → 상세기록 (구절·생각·필사) — 세션 옵셔널 (D3)
 *  - "attach" → 기존 기록에 사진/페이지/메모 사후 첨부 → 스탬프 승격 (기록 기획 12)
 *
 * Phase 4 ActiveSessionIndicator가 openEnd()를 호출.
 * Phase 5에서 모든 진입점이 본 훅을 사용하도록 통합.
 */

import { useEffect } from "react";
import { create } from "zustand";
import { getContinueReadingBooks } from "@/app/actions/books";
import { useAuth } from "@/hooks/use-auth";
import { useReadingSession } from "@/hooks/use-reading-session";

export interface RecordSheetBook {
  id: string; // user_books.id
  bookId: string; // books.id
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  totalPages: number | null;
}

export type RecordSheetMode = "start" | "end" | "detail" | "attach";

interface RecordSheetState {
  isOpen: boolean;
  mode: RecordSheetMode;
  /** end / detail 모드 진입 시 대상 세션 (null 가능 — detail은 자유 상세) */
  targetSessionId: string | null;
  /** attach 모드 진입 시 사진을 첨부할 대상 reading_log id */
  targetLogId: string | null;
  selectedBook: RecordSheetBook | null;
  /** start step의 prefill */
  prefillTargetSeconds: number | null;
  prefillStartPage: number | null;
  /** end / attach step의 prefill */
  prefillEndPage: number | null;

  openStart: (options?: { book?: RecordSheetBook | null; targetSeconds?: number; startPage?: number }) => void;
  openEnd: (sessionId: string, options?: { book?: RecordSheetBook | null; endPage?: number }) => void;
  openDetail: (sessionId?: string | null, options?: { book?: RecordSheetBook | null }) => void;
  /** 기존 reading_log 에 사진/페이지/메모를 사후 첨부 (스탬프 승격) */
  openAttach: (
    logId: string,
    options?: { book?: RecordSheetBook | null; startPage?: number; endPage?: number },
  ) => void;
  selectBook: (book: RecordSheetBook | null) => void;
  close: () => void;
  reset: () => void;
}

export const useRecordSheetStore = create<RecordSheetState>((set) => ({
  isOpen: false,
  mode: "start",
  targetSessionId: null,
  targetLogId: null,
  selectedBook: null,
  prefillTargetSeconds: null,
  prefillStartPage: null,
  prefillEndPage: null,

  openStart: (options) =>
    set({
      isOpen: true,
      mode: "start",
      targetSessionId: null,
      targetLogId: null,
      selectedBook: options?.book ?? null,
      prefillTargetSeconds: options?.targetSeconds ?? null,
      prefillStartPage: options?.startPage ?? null,
      prefillEndPage: null,
    }),
  openEnd: (sessionId, options) =>
    set({
      isOpen: true,
      mode: "end",
      targetSessionId: sessionId,
      targetLogId: null,
      selectedBook: options?.book ?? null,
      prefillEndPage: options?.endPage ?? null,
    }),
  openDetail: (sessionId, options) =>
    set({
      isOpen: true,
      mode: "detail",
      targetSessionId: sessionId ?? null,
      targetLogId: null,
      selectedBook: options?.book ?? null,
    }),
  openAttach: (logId, options) =>
    set({
      isOpen: true,
      mode: "attach",
      targetSessionId: null,
      targetLogId: logId,
      selectedBook: options?.book ?? null,
      prefillStartPage: options?.startPage ?? null,
      prefillEndPage: options?.endPage ?? null,
    }),
  selectBook: (book) => set({ selectedBook: book }),
  close: () => set({ isOpen: false }),
  reset: () =>
    set({
      isOpen: false,
      mode: "start",
      targetSessionId: null,
      targetLogId: null,
      selectedBook: null,
      prefillTargetSeconds: null,
      prefillStartPage: null,
      prefillEndPage: null,
    }),
}));

/**
 * RecordSheet 진입 훅.
 *  - start 모드 + 책 미지정 시: 최근 책 자동 prefill.
 *  - end 모드 진입 시: 진행 중 세션 정보로 책 자동 prefill (이미 된 경우 skip).
 */
export function useRecordSheet() {
  const { user } = useAuth();
  const store = useRecordSheetStore();
  const { session: activeSession } = useReadingSession();

  // start 모드 + 책 없음 → 최근 책 자동 prefill
  useEffect(() => {
    if (!store.isOpen || store.mode !== "start" || !user || store.selectedBook) return;

    let cancelled = false;
    getContinueReadingBooks(undefined, 1)
      .then((books) => {
        if (cancelled || books.length === 0) return;
        const b = books[0];
        store.selectBook({
          id: b.userBookId,
          bookId: b.bookId,
          title: b.title,
          author: b.author,
          coverImageUrl: b.coverImageUrl,
          totalPages: b.totalPages ?? null,
        });
      })
      .catch(() => {
        // 자동 prefill 실패 — 사용자가 직접 선택
      });

    return () => {
      cancelled = true;
    };
  }, [store.isOpen, store.mode, user, store.selectedBook]); // eslint-disable-line react-hooks/exhaustive-deps

  // end 모드 + 책 없음 → 진행 중 세션의 책 사용
  useEffect(() => {
    if (!store.isOpen || store.mode !== "end" || store.selectedBook || !activeSession?.book) return;

    store.selectBook({
      id: activeSession.user_book_id,
      bookId: activeSession.book.id,
      title: activeSession.book.title,
      author: activeSession.book.author,
      coverImageUrl: activeSession.book.cover_image_url,
      totalPages: activeSession.book.total_pages,
    });
  }, [store.isOpen, store.mode, store.selectedBook, activeSession]); // eslint-disable-line react-hooks/exhaustive-deps

  return store;
}
