"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, FileText, PenTool, Plus } from "lucide-react";
import { QuickBookSelector } from "@/components/books/quick-book-selector";
import { NoteFormNew } from "./note-form-new";
import type { BookWithNotes } from "@/app/actions/books";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import Link from "next/link";

/**
 * 데스크톱 기록 작성 통합 플로우
 * 1단계: 상단 "책 없이 기록" 배너 + 책 선택
 * 2단계: NoteFormNew로 기록 작성
 */
export function NoteCreationFlow() {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedBook, setSelectedBook] = useState<BookWithNotes | null>(null);

  const handleBookSelect = useCallback((book: BookWithNotes) => {
    setSelectedBook(book);
    setStep(2);
  }, []);

  const handleSkipBook = useCallback(() => {
    setSelectedBook(null);
    setStep(2);
  }, []);

  const handleChangeBook = useCallback(() => {
    setSelectedBook(null);
    setStep(1);
  }, []);

  // 2단계: 기록 작성 폼
  if (step === 2) {
    return (
      <div className="space-y-6">
        {/* 선택된 책 정보 또는 자유 기록 헤더 */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleChangeBook}
            className="h-9 w-9 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {selectedBook ? (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative w-10 h-14 rounded-md overflow-hidden bg-slate-200 dark:bg-slate-700 shadow-sm flex-shrink-0">
                {selectedBook.books.cover_image_url ? (
                  <Image
                    src={selectedBook.books.cover_image_url}
                    alt={selectedBook.books.title}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-slate-400" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{t("notes.selectedBook")}</p>
                <p className="text-sm font-medium truncate">{selectedBook.books.title}</p>
                {selectedBook.books.author && (
                  <p className="text-xs text-muted-foreground truncate">{selectedBook.books.author}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleChangeBook}
                className="ml-auto text-xs text-muted-foreground shrink-0"
              >
                {t("notes.changeBook")}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-forest-600" />
              <span className="font-medium">{t("notes.freeNote")}</span>
            </div>
          )}
        </div>

        <NoteFormNew bookId={selectedBook?.id} />
      </div>
    );
  }

  // 1단계: 책 선택
  return (
    <div className="space-y-5">
      {/* 페이지 제목 */}
      <div className="flex items-center gap-2">
        <PenTool className="h-5 w-5 text-forest-600" />
        <h2 className="text-lg font-semibold">{t("notes.writeNotePageTitle")}</h2>
      </div>

      {/* 빠른 액션: 책 등록 + 책 없이 기록 */}
      <div className="flex gap-3">
        <Link
          href="/books/search"
          className="flex-1 rounded-xl border border-forest-200/60 dark:border-forest-800/40 bg-forest-50/50 dark:bg-forest-950/30 p-3 hover:shadow-md hover:border-forest-300 dark:hover:border-forest-700 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-forest-100 dark:bg-forest-900/50 flex items-center justify-center shrink-0 group-hover:bg-forest-200 dark:group-hover:bg-forest-800/50 transition-colors">
              <Plus className="h-4 w-4 text-forest-600 dark:text-forest-400" />
            </div>
            <span className="text-sm font-medium text-forest-800 dark:text-forest-300">
              {t("notes.registerNewBook")}
            </span>
          </div>
        </Link>
        <button
          type="button"
          onClick={handleSkipBook}
          className="flex-1 rounded-xl border border-slate-200/60 dark:border-slate-700/40 bg-slate-50/50 dark:bg-slate-900/30 p-3 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center shrink-0 group-hover:bg-slate-200 dark:group-hover:bg-slate-700/50 transition-colors">
              <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </div>
            <div className="text-left">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {t("notes.writeWithoutBook")}
              </span>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {t("notes.writeWithoutBookShortDesc")}
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* 구분선 + 책 선택 안내 */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        <span className="text-xs text-muted-foreground shrink-0">{t("notes.selectBookBelow")}</span>
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* 책 선택 */}
      <QuickBookSelector onSelect={handleBookSelect} />
    </div>
  );
}
