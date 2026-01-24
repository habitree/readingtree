"use client";

import { create } from "zustand";
import type { BookWithNotes } from "@/app/actions/books";

export type NoteMode = "memo" | "transcription";

interface SelectedBook {
  id: string; // user_books.id
  bookId: string; // books.id
  title: string;
  author: string | null;
  coverImageUrl: string | null;
}

interface MobileNoteSheetState {
  /** 시트 열림 여부 */
  isOpen: boolean;
  /** 기록 모드 (memo: 일반 기록, transcription: 필사) */
  mode: NoteMode;
  /** 선택된 책 정보 */
  selectedBook: SelectedBook | null;
  /** 현재 스텝 (1: 책 선택, 2: 내용 입력) */
  currentStep: number;

  /** 시트 열기 */
  open: (mode?: NoteMode) => void;
  /** 시트 닫기 */
  close: () => void;
  /** 모드 변경 */
  setMode: (mode: NoteMode) => void;
  /** 책 선택 */
  selectBook: (book: SelectedBook) => void;
  /** 책 선택 해제 */
  clearBook: () => void;
  /** 다음 스텝으로 이동 */
  nextStep: () => void;
  /** 이전 스텝으로 이동 */
  prevStep: () => void;
  /** 초기화 (시트 닫을 때) */
  reset: () => void;
}

/**
 * 모바일 기록 시트 상태 관리 훅
 * Zustand를 사용하여 전역 상태 관리
 */
export const useMobileNoteSheet = create<MobileNoteSheetState>((set) => ({
  isOpen: false,
  mode: "memo",
  selectedBook: null,
  currentStep: 1,

  open: (mode = "memo") =>
    set({
      isOpen: true,
      mode,
      currentStep: 1,
      selectedBook: null,
    }),

  close: () =>
    set({
      isOpen: false,
    }),

  setMode: (mode) => set({ mode }),

  selectBook: (book) =>
    set({
      selectedBook: book,
      currentStep: 2,
    }),

  clearBook: () =>
    set({
      selectedBook: null,
      currentStep: 1,
    }),

  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, 2),
    })),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 1),
    })),

  reset: () =>
    set({
      isOpen: false,
      mode: "memo",
      selectedBook: null,
      currentStep: 1,
    }),
}));

/**
 * BookWithNotes 객체를 SelectedBook으로 변환하는 헬퍼 함수
 */
export function toSelectedBook(book: BookWithNotes): SelectedBook {
  return {
    id: book.id, // user_books.id
    bookId: book.books.id, // books.id
    title: book.books.title,
    author: book.books.author,
    coverImageUrl: book.books.cover_image_url,
  };
}
