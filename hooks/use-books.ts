"use client";

import { useState, useEffect, useCallback } from "react";
import { getUserBooks, addBook, updateBookStatus } from "@/app/actions/books";
import type { ReadingStatus, UserBook } from "@/types/book";
import type { AddBookInput } from "@/app/actions/books";

/**
 * 책 관련 커스텀 훅
 * 책 목록 조회, 추가, 상태 변경 기능 제공
 */
export function useBooks(status?: ReadingStatus) {
  const [books, setBooks] = useState<UserBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUserBooks(status);
      setBooks(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("책 목록 조회 실패");
      setError(error);
      console.error("책 목록 조회 오류:", error);
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleAddBook = async (
    bookData: AddBookInput,
    bookStatus: ReadingStatus = "reading"
  ) => {
    try {
      const result = await addBook(bookData, bookStatus);
      if (!result.success) throw new Error(result.error);
      await fetchBooks(); // 새 책은 ID를 알 수 없으므로 전체 새로고침
    } catch (err) {
      const error = err instanceof Error ? err : new Error("책 추가 실패");
      setError(error);
      throw error;
    }
  };

  // Optimistic update: 즉시 UI 반영 후 서버 동기화
  const handleUpdateStatus = async (
    userBookId: string,
    newStatus: ReadingStatus
  ) => {
    // 현재 상태 백업 (롤백용)
    const previousBooks = books;

    // 1. 즉시 로컬 상태 업데이트 (UI 반응성 향상)
    setBooks((prev) =>
      prev.map((book) =>
        book.id === userBookId ? { ...book, status: newStatus } : book
      )
    );

    try {
      // 2. 서버에 변경 요청
      await updateBookStatus(userBookId, newStatus);
      // 성공 시 추가 작업 없음 (이미 로컬 상태 업데이트됨)
    } catch (err) {
      // 3. 실패 시 롤백
      setBooks(previousBooks);
      const error = err instanceof Error ? err : new Error("상태 변경 실패");
      setError(error);
      throw error;
    }
  };

  return {
    books,
    isLoading,
    error,
    addBook: handleAddBook,
    updateStatus: handleUpdateStatus,
    refetch: fetchBooks,
  };
}

