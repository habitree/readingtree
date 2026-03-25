"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuickCapture } from "@/hooks/use-quick-capture";
import { QuickCaptureForm } from "./quick-capture-form";

/**
 * Quick Capture 다이얼로그 (PC/데스크톱 전용)
 * - Dialog 래퍼로 QuickCaptureForm을 감싸는 구조
 * - zustand store의 isOpen/reset으로 제어
 */
export function QuickCaptureDialog() {
  const {
    isOpen,
    selectedBook,
    readingDurationSeconds,
    isSubmitting,
    submitQuickNote,
    submitExpandedNote,
    selectBook,
    clearBook,
    reset,
  } = useQuickCapture();

  const [content, setContent] = useState("");
  const [showBookSelector, setShowBookSelector] = useState(false);

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
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            {showBookSelector ? "책 선택" : "빠른 기록"}
          </DialogTitle>
        </DialogHeader>

        <QuickCaptureForm
          content={content}
          setContent={setContent}
          onSubmit={handleSubmit}
          onSubmitExpanded={(data) => {
            if (!content.trim()) return;
            submitExpandedNote(content, data).then(() => {
              setContent("");
              setShowBookSelector(false);
            });
          }}
          isSubmitting={isSubmitting}
          selectedBook={selectedBook}
          readingDurationSeconds={readingDurationSeconds}
          onSelectBook={selectBook}
          onClearBook={clearBook}
          onReset={reset}
          showBookSelector={showBookSelector}
          setShowBookSelector={setShowBookSelector}
        />
      </DialogContent>
    </Dialog>
  );
}
