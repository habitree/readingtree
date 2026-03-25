"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Send, ChevronDown, Clock, X, ArrowRight } from "lucide-react";
import { useQuickCapture, useQuickCaptureStore } from "@/hooks/use-quick-capture";
import { QuickBookSelector } from "@/components/books/quick-book-selector";
import { toSelectedBook } from "@/hooks/use-mobile-note-sheet";
import type { BookWithNotes } from "@/app/actions/books";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  if (m > 0) return `${m}분`;
  return `${seconds}초`;
}

/**
 * Quick Capture 바텀시트
 * - 최소 UI: 텍스트 입력 + 책 칩 + 전송
 * - 책 자동 선택 (이어읽기)
 * - 즉시 draft 저장 → 토스트 "상세 추가하기"
 */
export function QuickCaptureSheet() {
  const {
    isOpen,
    selectedBook,
    readingDurationSeconds,
    isSubmitting,
    submitQuickNote,
    selectBook,
    clearBook,
    close,
    reset,
  } = useQuickCapture();

  const [content, setContent] = useState("");
  const [showBookSelector, setShowBookSelector] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 시트 열릴 때 포커스
  useEffect(() => {
    if (isOpen && !showBookSelector) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [isOpen, showBookSelector]);

  // 시트 닫힐 때 초기화
  const handleClose = useCallback(() => {
    setContent("");
    setShowBookSelector(false);
    reset();
  }, [reset]);

  const handleSubmit = useCallback(async () => {
    if (!content.trim()) return;
    await submitQuickNote(content);
    setContent("");
    setShowBookSelector(false);
  }, [content, submitQuickNote]);

  const handleBookSelect = useCallback(
    (book: BookWithNotes) => {
      selectBook({
        id: book.id,
        bookId: book.books.id,
        title: book.books.title,
        author: book.books.author,
        coverImageUrl: book.books.cover_image_url,
      });
      setShowBookSelector(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    },
    [selectBook],
  );

  // Enter로 전송 (Shift+Enter는 줄바꿈)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <SheetContent
        side="bottom"
        className={cn(
          "rounded-t-2xl px-0 pb-safe",
          showBookSelector ? "h-[70vh]" : "h-auto max-h-[50vh]",
        )}
      >
        <div className="mx-auto w-10 h-1 rounded-full bg-muted-foreground/20 mb-2" />

        <SheetHeader className="px-4 pb-2">
          <SheetTitle className="text-base font-bold">
            {showBookSelector ? "책 선택" : "빠른 기록"}
          </SheetTitle>
        </SheetHeader>

        {showBookSelector ? (
          /* 책 선택 모드 */
          <div className="flex-1 overflow-y-auto px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBookSelector(false)}
              className="mb-2 -ml-2 text-xs"
            >
              <ChevronDown className="w-3 h-3 mr-1" />
              돌아가기
            </Button>
            <QuickBookSelector onSelect={handleBookSelect} />
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-muted-foreground"
              onClick={() => {
                clearBook();
                setShowBookSelector(false);
              }}
            >
              책 없이 기록
            </Button>
          </div>
        ) : (
          /* 입력 모드 */
          <div className="px-4 space-y-3">
            {/* 책 칩 + 타이머 뱃지 */}
            <div className="flex items-center gap-2 flex-wrap">
              {selectedBook ? (
                <button
                  type="button"
                  onClick={() => setShowBookSelector(true)}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary hover:bg-primary/15 transition-colors"
                >
                  {selectedBook.coverImageUrl ? (
                    <Image
                      src={selectedBook.coverImageUrl}
                      alt=""
                      width={16}
                      height={22}
                      className="rounded-sm object-cover"
                    />
                  ) : (
                    <BookOpen className="w-3 h-3" />
                  )}
                  <span className="max-w-[140px] truncate">{selectedBook.title}</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowBookSelector(true)}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-xs text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  <BookOpen className="w-3 h-3" />
                  책 선택
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>
              )}

              {readingDurationSeconds && readingDurationSeconds > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium dark:bg-amber-900/30 dark:text-amber-400">
                  <Clock className="w-3 h-3" />
                  {formatDuration(readingDurationSeconds)}
                </span>
              )}
            </div>

            {/* 텍스트 입력 */}
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="읽으면서 떠오른 생각, 인상깊은 구절을 자유롭게 적어보세요..."
              className="min-h-[80px] max-h-[200px] resize-none text-sm border-muted-foreground/20 focus-visible:ring-primary/30"
              maxLength={10000}
            />

            {/* 하단 액션 */}
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Link
                  href={`/notes/new${selectedBook ? `?bookId=${selectedBook.id}` : ""}`}
                  onClick={() => reset()}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  상세 기록
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!content.trim() || isSubmitting}
                className="gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
