"use client";

import { useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Send, ChevronDown, Clock, ArrowRight } from "lucide-react";
import { QuickBookSelector } from "@/components/books/quick-book-selector";
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

interface SelectedBook {
  id: string;
  bookId: string;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
}

interface QuickCaptureFormProps {
  content: string;
  setContent: (content: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  selectedBook: SelectedBook | null;
  readingDurationSeconds: number | null;
  onSelectBook: (book: SelectedBook) => void;
  onClearBook: () => void;
  onReset: () => void;
  showBookSelector: boolean;
  setShowBookSelector: (show: boolean) => void;
}

/**
 * Quick Capture 공유 입력 폼
 * 모바일 Sheet과 PC Dialog 양쪽에서 재사용
 */
export function QuickCaptureForm({
  content,
  setContent,
  onSubmit,
  isSubmitting,
  selectedBook,
  readingDurationSeconds,
  onSelectBook,
  onClearBook,
  onReset,
  showBookSelector,
  setShowBookSelector,
}: QuickCaptureFormProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 책 선택기가 닫히면 포커스
  useEffect(() => {
    if (!showBookSelector) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [showBookSelector]);

  const handleBookSelect = useCallback(
    (book: BookWithNotes) => {
      onSelectBook({
        id: book.id,
        bookId: book.books.id,
        title: book.books.title,
        author: book.books.author,
        coverImageUrl: book.books.cover_image_url,
      });
      setShowBookSelector(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    },
    [onSelectBook, setShowBookSelector],
  );

  // Enter로 전송 (Shift+Enter는 줄바꿈)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSubmit();
      }
    },
    [onSubmit],
  );

  if (showBookSelector) {
    return (
      <div className="flex-1 overflow-y-auto">
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
            onClearBook();
            setShowBookSelector(false);
          }}
        >
          책 없이 기록
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
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
            onClick={() => onReset()}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            상세 기록
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={!content.trim() || isSubmitting}
          className="gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          {isSubmitting ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
}
