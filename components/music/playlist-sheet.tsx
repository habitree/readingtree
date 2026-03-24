"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { Star, Plus, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// ── 즐겨찾기 localStorage 관리 ──
const FAVORITES_KEY = "readingtree-timer-favorites";

function loadFavorites(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is number => typeof v === "number" && v > 0);
  } catch {
    return [];
  }
}

function saveFavorites(favorites: number[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

// ── 기본 프리셋 ──
const DEFAULT_PRESETS = [15, 30, 45, 60, 90];

export function TimerSheet() {
  const { isTimerSheetOpen, closeTimerSheet, startTimer } = useMusicPlayer();
  const [selectedMinutes, setSelectedMinutes] = useState(30);
  const [isCustom, setIsCustom] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isEditingFavorites, setIsEditingFavorites] = useState(false);

  // 즐겨찾기 로드
  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  // 모든 프리셋 (기본 + 즐겨찾기 합산, 중복 제거, 정렬)
  const allPresets = [...new Set([...DEFAULT_PRESETS, ...favorites])].sort(
    (a, b) => a - b
  );

  function handlePresetClick(minutes: number) {
    setSelectedMinutes(minutes);
    setIsCustom(false);
  }

  function handleStart() {
    const minutes = isCustom ? parseInt(customInput, 10) : selectedMinutes;
    if (!minutes || minutes < 1) return;
    startTimer(minutes * 60);
  }

  function toggleFavorite(minutes: number) {
    const next = favorites.includes(minutes)
      ? favorites.filter((f) => f !== minutes)
      : [...favorites, minutes].sort((a, b) => a - b);
    setFavorites(next);
    saveFavorites(next);
  }

  function addCustomFavorite() {
    const mins = parseInt(customInput, 10);
    if (!mins || mins < 1 || mins > 300) return;
    if (!favorites.includes(mins)) {
      const next = [...favorites, mins].sort((a, b) => a - b);
      setFavorites(next);
      saveFavorites(next);
    }
    setSelectedMinutes(mins);
    setIsCustom(false);
    setCustomInput("");
  }

  const canStart = isCustom
    ? !!customInput && parseInt(customInput, 10) >= 1
    : selectedMinutes > 0;

  return (
    <Sheet
      open={isTimerSheetOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeTimerSheet();
          setIsEditingFavorites(false);
          setIsCustom(false);
        }
      }}
    >
      <SheetContent
        side="bottom"
        className="rounded-t-2xl px-5 pt-3 pb-8 flex flex-col max-h-[85vh]"
      >
        {/* 드래그 인디케이터 */}
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="mb-4">
          <SheetTitle className="text-base text-center flex items-center justify-center gap-2">
            <Clock className="w-4.5 h-4.5" />
            독서 타이머
          </SheetTitle>
          <p className="text-xs text-muted-foreground text-center mt-1">
            시간을 설정하면 클래식 음악과 함께 독서가 시작됩니다
          </p>
        </SheetHeader>

        {/* ── 시각적 시간 표시 ── */}
        <div className="flex justify-center mb-5">
          <div className="relative w-36 h-36 sm:w-40 sm:h-40">
            {/* 외곽 원 */}
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-muted/50"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 54}
                strokeDashoffset={
                  2 * Math.PI * 54 * (1 - (isCustom ? parseInt(customInput, 10) || 0 : selectedMinutes) / 120)
                }
                className="text-primary transition-all duration-500"
              />
            </svg>
            {/* 중앙 시간 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl sm:text-4xl font-bold tabular-nums">
                {isCustom
                  ? customInput || "0"
                  : selectedMinutes}
              </span>
              <span className="text-xs text-muted-foreground -mt-0.5">분</span>
            </div>
          </div>
        </div>

        {/* ── 시간 프리셋 그리드 ── */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2 px-0.5">
            <span className="text-xs font-medium text-muted-foreground">
              {isEditingFavorites ? "즐겨찾기 편집" : "시간 선택"}
            </span>
            <button
              onClick={() => setIsEditingFavorites(!isEditingFavorites)}
              className={cn(
                "flex items-center gap-1 text-xs font-medium transition-colors",
                isEditingFavorites
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Star className={cn("w-3 h-3", isEditingFavorites && "fill-primary")} />
              {isEditingFavorites ? "완료" : "즐겨찾기"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {allPresets.map((minutes) => {
              const isFav = favorites.includes(minutes);
              const isDefault = DEFAULT_PRESETS.includes(minutes);
              const isSelected = selectedMinutes === minutes && !isCustom;

              return (
                <button
                  key={minutes}
                  onClick={() => {
                    if (isEditingFavorites) {
                      toggleFavorite(minutes);
                    } else {
                      handlePresetClick(minutes);
                    }
                  }}
                  className={cn(
                    "relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    isEditingFavorites
                      ? isFav
                        ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 ring-1 ring-yellow-500/30"
                        : "bg-muted text-muted-foreground"
                      : isSelected
                        ? "bg-primary text-primary-foreground shadow-sm scale-105"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {isEditingFavorites && (
                    <Star
                      className={cn(
                        "w-3 h-3",
                        isFav && "fill-yellow-500 text-yellow-500"
                      )}
                    />
                  )}
                  {!isEditingFavorites && isFav && !isDefault && (
                    <Star className="w-2.5 h-2.5 fill-current opacity-50" />
                  )}
                  {minutes}분
                  {isEditingFavorites && isFav && !isDefault && (
                    <X className="w-3 h-3 opacity-60" />
                  )}
                </button>
              );
            })}

            {/* 직접 입력 버튼 */}
            {!isEditingFavorites && (
              <button
                onClick={() => {
                  setIsCustom(true);
                  setCustomInput("");
                }}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  isCustom
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Plus className="w-3.5 h-3.5" />
                직접
              </button>
            )}
          </div>
        </div>

        {/* ── 직접 입력 필드 ── */}
        {isCustom && !isEditingFavorites && (
          <div className="flex items-center gap-2 mb-4 justify-center">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={300}
              placeholder="25"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="w-20 h-11 text-center text-lg font-semibold rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              autoFocus
            />
            <span className="text-sm text-muted-foreground">분</span>
            {/* 즐겨찾기에 추가 버튼 */}
            {customInput && parseInt(customInput, 10) >= 1 && (
              <button
                onClick={addCustomFavorite}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/25 transition-colors"
                title="즐겨찾기에 추가"
              >
                <Star className="w-3 h-3" />
                저장
              </button>
            )}
          </div>
        )}

        {/* ── 독서 시작 버튼 ── */}
        {!isEditingFavorites && (
          <button
            onClick={handleStart}
            disabled={!canStart}
            className={cn(
              "w-full py-3.5 rounded-xl text-base font-semibold transition-all flex items-center justify-center gap-2",
              canStart
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <span>📖</span>
            독서 시작
          </button>
        )}
      </SheetContent>
    </Sheet>
  );
}
