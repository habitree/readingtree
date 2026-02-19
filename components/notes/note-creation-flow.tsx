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
 * 1단계: 책 선택 또는 "책 없이 기록하기"
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
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <PenTool className="h-5 w-5 text-forest-600" />
        <h2 className="text-lg font-semibold">{t("notes.writeNotePageTitle")}</h2>
      </div>
      <p className="text-sm text-muted-foreground">{t("notes.selectBookOrFree")}</p>

      <QuickBookSelector onSelect={handleBookSelect} />

      {/* 책 없이 기록하기 */}
      <div className="pt-3 border-t">
        <Button
          variant="ghost"
          onClick={handleSkipBook}
          className="w-full text-muted-foreground hover:text-forest-600"
        >
          <FileText className="h-4 w-4 mr-1.5" />
          {t("notes.writeWithoutBook")}
        </Button>
      </div>
    </div>
  );
}
