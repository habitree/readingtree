"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, FileText, PenTool } from "lucide-react";
import { QuickBookSelector } from "@/components/books/quick-book-selector";
import { NoteFormNew } from "./note-form-new";
import type { BookWithNotes } from "@/app/actions/books";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";

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

      {/* 책 없이 기록하기 배너 (상단 강조) */}
      <button
        type="button"
        onClick={handleSkipBook}
        className="w-full rounded-xl bg-gradient-to-r from-forest-50 to-emerald-50 dark:from-forest-950/40 dark:to-emerald-950/30 border border-forest-200/60 dark:border-forest-800/40 p-4 sm:p-5 text-left hover:shadow-md hover:border-forest-300 dark:hover:border-forest-700 transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-forest-100 dark:bg-forest-900/50 flex items-center justify-center shrink-0 group-hover:bg-forest-200 dark:group-hover:bg-forest-800/50 transition-colors">
            <FileText className="h-6 w-6 text-forest-600 dark:text-forest-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-forest-800 dark:text-forest-300">
              {t("notes.writeWithoutBook")}
            </p>
            <p className="text-xs text-forest-600/80 dark:text-forest-400/70 mt-0.5">
              {t("notes.writeWithoutBookDesc")}
            </p>
          </div>
          <div className="shrink-0">
            <div className="h-8 px-3 rounded-lg bg-forest-600 text-white text-xs font-medium flex items-center group-hover:bg-forest-700 transition-colors">
              {t("notes.writeNoteHeroCta")}
            </div>
          </div>
        </div>
      </button>

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
