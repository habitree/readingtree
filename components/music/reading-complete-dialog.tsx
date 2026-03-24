"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { useMobileNoteSheet } from "@/hooks/use-mobile-note-sheet";
import { cn } from "@/lib/utils";

const CONTINUE_PRESETS = [
  { label: "+15분", seconds: 15 * 60 },
  { label: "+30분", seconds: 30 * 60 },
  { label: "+60분", seconds: 60 * 60 },
] as const;

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  return `${m}분`;
}

export function ReadingCompleteDialog() {
  const {
    isCompleteDialogOpen,
    closeCompleteDialog,
    elapsedSeconds,
    continueReading,
    close,
  } = useMusicPlayer();

  const { open: openNoteSheet } = useMobileNoteSheet();
  const [showContinueOptions, setShowContinueOptions] = useState(false);

  function handleRecord() {
    closeCompleteDialog();
    // 노트 작성 시트 열기 (메모 모드)
    openNoteSheet("memo");
  }

  function handleContinue(seconds: number) {
    setShowContinueOptions(false);
    continueReading(seconds);
  }

  function handleStop() {
    setShowContinueOptions(false);
    closeCompleteDialog();
    close();
  }

  return (
    <Dialog
      open={isCompleteDialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          setShowContinueOptions(false);
          closeCompleteDialog();
        }
      }}
    >
      <DialogContent className="sm:max-w-[340px] rounded-2xl p-6">
        <DialogHeader className="items-center space-y-3">
          <div className="text-4xl">📚</div>
          <DialogTitle className="text-lg">독서 완료!</DialogTitle>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {formatDuration(elapsedSeconds)}
            </span>{" "}
            동안 독서했습니다
          </p>
        </DialogHeader>

        <div className="mt-4 space-y-2.5">
          {/* 계속 읽기 */}
          {!showContinueOptions ? (
            <button
              onClick={() => setShowContinueOptions(true)}
              className="w-full py-3 rounded-xl bg-muted text-sm font-semibold hover:bg-muted/80 transition-colors"
            >
              계속 읽기
            </button>
          ) : (
            <div className="flex gap-2">
              {CONTINUE_PRESETS.map(({ label, seconds }) => (
                <button
                  key={seconds}
                  onClick={() => handleContinue(seconds)}
                  className="flex-1 py-3 rounded-xl bg-muted text-xs font-semibold hover:bg-muted/80 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* 기록하기 */}
          <button
            onClick={handleRecord}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            기록하기
          </button>

          {/* 그만 읽기 */}
          <button
            onClick={handleStop}
            className="w-full py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            그만 읽기
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
