"use client";

import { useState, useCallback, useEffect } from "react";
import { create } from "zustand";
import { createQuickNote } from "@/app/actions/notes";
import { getContinueReadingBooks } from "@/app/actions/books";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface SelectedBook {
  id: string; // user_books.id
  bookId: string; // books.id
  title: string;
  author: string | null;
  coverImageUrl: string | null;
}

interface QuickCaptureState {
  isOpen: boolean;
  selectedBook: SelectedBook | null;
  readingDurationSeconds: number | null;
  open: () => void;
  openWithBook: (book: SelectedBook) => void;
  openWithTimer: (book: SelectedBook | null, durationSeconds: number) => void;
  selectBook: (book: SelectedBook) => void;
  clearBook: () => void;
  close: () => void;
  reset: () => void;
}

export const useQuickCaptureStore = create<QuickCaptureState>((set) => ({
  isOpen: false,
  selectedBook: null,
  readingDurationSeconds: null,

  open: () => set({ isOpen: true, readingDurationSeconds: null }),
  openWithBook: (book) => set({ isOpen: true, selectedBook: book, readingDurationSeconds: null }),
  openWithTimer: (book, durationSeconds) =>
    set({ isOpen: true, selectedBook: book, readingDurationSeconds: durationSeconds }),
  selectBook: (book) => set({ selectedBook: book }),
  clearBook: () => set({ selectedBook: null }),
  close: () => set({ isOpen: false }),
  reset: () => set({ isOpen: false, selectedBook: null, readingDurationSeconds: null }),
}));

/**
 * Quick Capture 비즈니스 로직 훅
 * - 최근 읽던 책 자동 선택
 * - 즉시 저장 (draft)
 * - 토스트 + "상세 추가하기" 링크
 */
export function useQuickCapture() {
  const { user } = useAuth();
  const store = useQuickCaptureStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedNoteId, setLastSavedNoteId] = useState<string | null>(null);

  // 최근 읽던 책 자동 로드
  useEffect(() => {
    if (!user || store.selectedBook) return;

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
          });
        }
      })
      .catch(() => {});
  }, [user, store.selectedBook]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitQuickNote = useCallback(
    async (content: string) => {
      if (!content.trim() || isSubmitting) return;

      setIsSubmitting(true);
      try {
        const result = await createQuickNote(
          content,
          store.selectedBook?.id,
          store.readingDurationSeconds ?? undefined,
        );

        if (result.success) {
          setLastSavedNoteId(result.noteId);
          const pointsMsg = result.pointsEarned ? ` +${result.pointsEarned}P` : "";
          toast.success(`기록이 저장되었습니다${pointsMsg}`, {
            action: {
              label: "보완하기",
              onClick: () => {
                window.location.href = `/notes/${result.noteId}/edit`;
              },
            },
            duration: 5000,
          });
          store.reset();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "기록 저장에 실패했습니다.";
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, store],
  );

  const submitExpandedNote = useCallback(
    async (
      content: string,
      expandedData: {
        quoteContent?: string;
        pageNumber?: string;
        publishDirectly?: boolean;
      },
    ) => {
      if (!content.trim() || isSubmitting) return;

      setIsSubmitting(true);
      try {
        const result = await createQuickNote(
          content,
          store.selectedBook?.id,
          store.readingDurationSeconds ?? undefined,
          {
            status: expandedData.publishDirectly ? "published" : "draft",
            quoteContent: expandedData.quoteContent,
            pageNumber: expandedData.pageNumber,
          },
        );

        if (result.success) {
          setLastSavedNoteId(result.noteId);
          const pointsMsg = result.pointsEarned ? ` +${result.pointsEarned}P` : "";
          if (expandedData.publishDirectly) {
            toast.success(`기록이 발행되었습니다${pointsMsg}`);
          } else {
            toast.success(`기록이 저장되었습니다${pointsMsg}`, {
              action: {
                label: "보완하기",
                onClick: () => {
                  window.location.href = `/notes/${result.noteId}/edit`;
                },
              },
              duration: 5000,
            });
          }
          store.reset();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "기록 저장에 실패했습니다.";
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, store],
  );

  return {
    isOpen: store.isOpen,
    selectedBook: store.selectedBook,
    readingDurationSeconds: store.readingDurationSeconds,
    isSubmitting,
    lastSavedNoteId,
    open: store.open,
    openWithBook: store.openWithBook,
    openWithTimer: store.openWithTimer,
    selectBook: store.selectBook,
    clearBook: store.clearBook,
    close: store.close,
    reset: store.reset,
    submitQuickNote,
    submitExpandedNote,
  };
}
