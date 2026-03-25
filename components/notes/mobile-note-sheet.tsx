"use client";

import { useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, PenTool, Camera, FileText, Plus } from "lucide-react";
import { QuickBookSelector } from "@/components/books/quick-book-selector";
import { MobileNoteForm } from "./mobile-note-form";
import {
  useMobileNoteSheet,
  toSelectedBook,
} from "@/hooks/use-mobile-note-sheet";
import type { BookWithNotes } from "@/app/actions/books";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import Link from "next/link";

/**
 * 모바일 기록 작성 바텀시트
 * - 스텝 1: 책 선택
 * - 스텝 2: 내용 입력
 */
export function MobileNoteSheet() {
  const { t } = useTranslation();
  const {
    isOpen,
    mode,
    selectedBook,
    currentStep,
    readingDurationSeconds,
    selectBook,
    clearBook,
    skipBook,
    reset,
  } = useMobileNoteSheet();

  // 책 선택 핸들러
  const handleBookSelect = useCallback(
    (book: BookWithNotes) => {
      selectBook(toSelectedBook(book));
    },
    [selectBook]
  );

  // 시트 닫기 핸들러
  const handleClose = useCallback(() => {
    reset();
  }, [reset]);

  // 뒤로가기 핸들러
  const handleBack = useCallback(() => {
    clearBook();
  }, [clearBook]);

  // 저장 완료 핸들러
  const handleSaved = useCallback(() => {
    reset();
  }, [reset]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && reset()}>
      <SheetContent
        side="bottom"
        swipeToClose
        hideCloseButton
        className="h-[90vh] rounded-t-2xl px-4 pt-3 pb-6 flex flex-col"
      >
        {/* 드래그 인디케이터 */}
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* 헤더 */}
        <SheetHeader className="mb-4">
          <div className="flex items-center gap-3">
            {/* 뒤로가기 버튼 (스텝 2에서만) */}
            {currentStep === 2 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-9 w-9 shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}

            {/* 제목 */}
            <SheetTitle className="text-left flex-1 flex items-center gap-2">
              {currentStep === 1 ? (
                <>
                  {mode === "transcription" ? (
                    <Camera className="h-5 w-5 text-purple-600" />
                  ) : (
                    <PenTool className="h-5 w-5 text-forest-600" />
                  )}
                  <span>
                    {mode === "transcription" ? t("notes.selectBookForTranscription") : t("notes.selectBookForNote")}
                  </span>
                </>
              ) : selectedBook ? (
                <SelectedBookInfo book={selectedBook} />
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-5 w-5 text-forest-600" />
                  <span className="text-sm font-medium">{t("notes.freeNote")}</span>
                </div>
              )}
            </SheetTitle>

            {/* 닫기 버튼 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-9 px-3 text-muted-foreground"
            >
              {t("notes.cancel")}
            </Button>
          </div>
        </SheetHeader>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-hidden">
          {currentStep === 1 ? (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-hidden">
                <QuickBookSelector onSelect={handleBookSelect} />
              </div>
              {/* 하단 액션: 책 등록 + 책 없이 저장 */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="flex-1 text-forest-600 dark:text-forest-400 hover:text-forest-700"
                >
                  <Link href="/books/search">
                    <Plus className="h-4 w-4 mr-1" />
                    {t("notes.registerNewBook")}
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipBook}
                  className="flex-1 text-slate-500 dark:text-slate-400 hover:text-slate-600"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  {t("notes.saveWithoutBook")}
                </Button>
              </div>
            </div>
          ) : (
            <MobileNoteForm
              bookId={selectedBook?.id}
              mode={mode}
              onSaved={handleSaved}
              onCancel={handleClose}
              readingDurationSeconds={readingDurationSeconds}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** 선택된 책 정보 표시 */
function SelectedBookInfo({
  book,
}: {
  book: {
    title: string;
    author: string | null;
    coverImageUrl: string | null;
  };
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      {/* 책 표지 */}
      <div className="relative w-8 h-11 rounded overflow-hidden bg-slate-200 dark:bg-slate-700 shadow-sm flex-shrink-0">
        {book.coverImageUrl ? (
          <Image
            src={book.coverImageUrl}
            alt={book.title}
            fill
            className="object-cover"
            sizes="32px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-slate-400" />
          </div>
        )}
      </div>
      {/* 책 정보 */}
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{book.title}</p>
        {book.author && (
          <p className="text-xs text-muted-foreground truncate">{book.author}</p>
        )}
      </div>
    </div>
  );
}

/**
 * 모바일 노트 시트 프로바이더
 * 앱 전역에서 시트를 렌더링하기 위한 컴포넌트
 */
export function MobileNoteSheetProvider() {
  return <MobileNoteSheet />;
}
