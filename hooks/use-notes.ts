"use client";

import { useState, useEffect, useCallback } from "react";
import { getNotes, createNote, updateNote, deleteNote } from "@/app/actions/notes";
import type { NoteType, NoteWithBook } from "@/types/note";
import type { CreateNoteInput, UpdateNoteInput } from "@/types/note";

/**
 * 기록 관련 커스텀 훅
 * 낙관적 업데이트 + useCallback 메모이제이션 적용
 */
export function useNotes(bookId?: string, type?: NoteType) {
  const [notes, setNotes] = useState<NoteWithBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getNotes(bookId, type);
      setNotes(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("기록 목록 조회 실패");
      setError(error);
      console.error("기록 목록 조회 오류:", error);
    } finally {
      setIsLoading(false);
    }
  }, [bookId, type]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleCreateNote = useCallback(async (data: CreateNoteInput) => {
    try {
      const result = await createNote(data);
      // 백그라운드에서 전체 목록 동기화 (생성 결과는 noteId만 포함)
      fetchNotes().catch(() => {});
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("기록 생성 실패");
      setError(error);
      throw error;
    }
  }, [fetchNotes]);

  const handleUpdateNote = useCallback(async (noteId: string, data: UpdateNoteInput) => {
    // 낙관적 업데이트: 즉시 UI 반영
    const previousNotes = notes;
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId ? { ...note, ...data } as NoteWithBook : note
      )
    );

    try {
      await updateNote(noteId, data);
      // 백그라운드 동기화
      fetchNotes().catch(() => {});
    } catch (err) {
      // 실패 시 롤백
      setNotes(previousNotes);
      const error = err instanceof Error ? err : new Error("기록 수정 실패");
      setError(error);
      throw error;
    }
  }, [notes, fetchNotes]);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    // 낙관적 업데이트: 즉시 목록에서 제거
    const previousNotes = notes;
    setNotes((prev) => prev.filter((note) => note.id !== noteId));

    try {
      await deleteNote(noteId);
    } catch (err) {
      // 실패 시 롤백
      setNotes(previousNotes);
      const error = err instanceof Error ? err : new Error("기록 삭제 실패");
      setError(error);
      throw error;
    }
  }, [notes]);

  return {
    notes,
    isLoading,
    error,
    createNote: handleCreateNote,
    updateNote: handleUpdateNote,
    deleteNote: handleDeleteNote,
    refetch: fetchNotes,
  };
}

