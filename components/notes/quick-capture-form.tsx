"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { BookOpen, Send, ChevronDown, ChevronUp, Clock, ArrowRight, Quote, Loader2, CheckCircle2 } from "lucide-react";
import { QuickBookSelector } from "@/components/books/quick-book-selector";
import type { BookWithNotes } from "@/app/actions/books";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

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
  /** 확장 모드 제출 (구절/페이지 포함, published) */
  onSubmitExpanded?: (data: {
    quoteContent?: string;
    pageNumber?: string;
    publishDirectly?: boolean;
  }) => void;
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
 * Quick Capture 공유 입력 폼 (Progressive Disclosure)
 * 기본 모드: 텍스트 + 책 + 전송 (draft)
 * 확장 모드: + 구절 + 페이지 + 바로 발행 옵션
 */
export function QuickCaptureForm({
  content,
  setContent,
  onSubmit,
  onSubmitExpanded,
  isSubmitting,
  selectedBook,
  readingDurationSeconds,
  onSelectBook,
  onClearBook,
  onReset,
  showBookSelector,
  setShowBookSelector,
}: QuickCaptureFormProps) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [quoteContent, setQuoteContent] = useState("");
  const [pageNumber, setPageNumber] = useState("");
  const [publishDirectly, setPublishDirectly] = useState(false);

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && !expanded) {
        e.preventDefault();
        onSubmit();
      }
    },
    [onSubmit, expanded],
  );

  const handleSubmit = useCallback(() => {
    if (expanded && onSubmitExpanded) {
      onSubmitExpanded({
        quoteContent: quoteContent.trim() || undefined,
        pageNumber: pageNumber.trim() || undefined,
        publishDirectly,
      });
    } else {
      onSubmit();
    }
  }, [expanded, onSubmit, onSubmitExpanded, quoteContent, pageNumber, publishDirectly]);

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

      {/* 내 생각 (메인 입력) */}
      <Textarea
        ref={textareaRef}
        name="quick-capture-content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={readingDurationSeconds ? "메모를 남겨보세요 (선택사항)" : "이 책에서 떠오른 생각을 적어보세요"}
        className="min-h-[80px] max-h-[200px] resize-none text-sm border-muted-foreground/20 focus-visible:ring-primary/30"
        maxLength={10000}
      />

      {/* 확장 모드 토글 */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? "접기" : "구절·페이지 추가"}
      </button>

      {/* 확장 필드 */}
      {expanded && (
        <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
          {/* 인상깊은 구절 */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 mb-1">
              <Quote className="w-3 h-3" />
              인상깊은 구절
            </label>
            <Textarea
              name="quick-capture-quote"
              value={quoteContent}
              onChange={(e) => setQuoteContent(e.target.value)}
              placeholder="기억하고 싶은 문장을 적어보세요"
              className="min-h-[50px] max-h-[120px] resize-none text-sm border-blue-200/50 dark:border-blue-800/30 focus-visible:ring-blue-300/30"
              maxLength={5000}
            />
          </div>

          {/* 페이지 번호 */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-medium text-muted-foreground shrink-0">페이지</label>
            <Input
              name="quick-capture-page"
              value={pageNumber}
              onChange={(e) => setPageNumber(e.target.value)}
              placeholder="p."
              className="w-20 h-7 text-xs"
            />

            {/* 바로 발행 체크 */}
            <label className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={publishDirectly}
                onChange={(e) => setPublishDirectly(e.target.checked)}
                className="rounded border-muted-foreground/30"
              />
              바로 발행
            </label>
          </div>
        </div>
      )}

      {/* 하단 액션 */}
      <div className="flex items-center justify-between pb-2">
        {/* 입력 진행 도트 */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[
              content.trim().length > 0,
              expanded && quoteContent.trim().length > 0,
              expanded && pageNumber.trim().length > 0,
            ].map((filled, i) => (
              <div
                key={i}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  filled ? "bg-primary" : "bg-muted-foreground/20"
                )}
              />
            ))}
          </div>
          <Link
            href={`/notes/new${selectedBook ? `?bookId=${selectedBook.id}` : ""}`}
            onClick={() => onReset()}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            사진으로 기록
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={(!content.trim() && !readingDurationSeconds) || isSubmitting}
          className="gap-1.5"
        >
          {isSubmitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          {isSubmitting ? "저장 중..." : expanded && publishDirectly ? "발행" : "기록 저장"}
        </Button>
      </div>
    </div>
  );
}
