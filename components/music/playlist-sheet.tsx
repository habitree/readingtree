"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "15분", seconds: 15 * 60 },
  { label: "30분", seconds: 30 * 60 },
  { label: "45분", seconds: 45 * 60 },
  { label: "60분", seconds: 60 * 60 },
  { label: "90분", seconds: 90 * 60 },
] as const;

export function TimerSheet() {
  const { isTimerSheetOpen, closeTimerSheet, startTimer } = useMusicPlayer();
  const [selected, setSelected] = useState<number | null>(30 * 60);
  const [isCustom, setIsCustom] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");

  function handlePresetClick(seconds: number) {
    setSelected(seconds);
    setIsCustom(false);
  }

  function handleCustomClick() {
    setIsCustom(true);
    setSelected(null);
    setCustomMinutes("");
  }

  function handleStart() {
    let seconds = selected;
    if (isCustom) {
      const mins = parseInt(customMinutes, 10);
      if (!mins || mins < 1 || mins > 300) return;
      seconds = mins * 60;
    }
    if (!seconds) return;
    startTimer(seconds);
  }

  const canStart = isCustom
    ? !!customMinutes && parseInt(customMinutes, 10) >= 1
    : !!selected;

  return (
    <Sheet
      open={isTimerSheetOpen}
      onOpenChange={(open) => !open && closeTimerSheet()}
    >
      <SheetContent
        side="bottom"
        className="rounded-t-2xl px-5 pt-3 pb-8 flex flex-col"
      >
        {/* 드래그 인디케이터 */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="mb-5">
          <SheetTitle className="text-base text-center">
            독서 타이머 설정
          </SheetTitle>
          <p className="text-sm text-muted-foreground text-center mt-1">
            독서 시간을 설정하면 클래식 음악과 함께 시작됩니다
          </p>
        </SheetHeader>

        {/* 프리셋 시간 버튼 */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {PRESETS.map(({ label, seconds }) => (
            <button
              key={seconds}
              onClick={() => handlePresetClick(seconds)}
              className={cn(
                "py-3.5 rounded-xl text-sm font-semibold transition-all",
                selected === seconds && !isCustom
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {label}
            </button>
          ))}
          <button
            onClick={handleCustomClick}
            className={cn(
              "py-3.5 rounded-xl text-sm font-semibold transition-all",
              isCustom
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            직접 입력
          </button>
        </div>

        {/* 직접 입력 필드 */}
        {isCustom && (
          <div className="flex items-center gap-2 mb-4 justify-center">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={300}
              placeholder="25"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="w-20 h-11 text-center text-lg font-semibold rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              autoFocus
            />
            <span className="text-sm text-muted-foreground font-medium">
              분
            </span>
          </div>
        )}

        {/* 독서 시작 버튼 */}
        <button
          onClick={handleStart}
          disabled={!canStart}
          className={cn(
            "w-full py-3.5 rounded-xl text-base font-semibold transition-all",
            canStart
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          독서 시작
        </button>
      </SheetContent>
    </Sheet>
  );
}
