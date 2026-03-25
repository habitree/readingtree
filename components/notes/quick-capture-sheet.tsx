"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useQuickCapture } from "@/hooks/use-quick-capture";
import { cn } from "@/lib/utils";
import { QuickCaptureForm } from "./quick-capture-form";

/**
 * Quick Capture 바텀시트 (모바일 전용)
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
    reset,
  } = useQuickCapture();

  const [content, setContent] = useState("");
  const [showBookSelector, setShowBookSelector] = useState(false);

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

        <div className="px-4">
          <QuickCaptureForm
            content={content}
            setContent={setContent}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            selectedBook={selectedBook}
            readingDurationSeconds={readingDurationSeconds}
            onSelectBook={selectBook}
            onClearBook={clearBook}
            onReset={reset}
            showBookSelector={showBookSelector}
            setShowBookSelector={setShowBookSelector}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
