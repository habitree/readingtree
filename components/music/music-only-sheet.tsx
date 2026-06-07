"use client";

/**
 * MusicOnlySheet (단일파일 병합 재구성 — 2026-06-08)
 *
 * 클래식/재즈 2장르 카드 + 재생/정지만. 플레이리스트·곡목록·스킵 전부 제거.
 * 장르 선택 시 병합된 단일 MP3 를 랜덤 위치에서 재생한다(끊김 없음).
 */

import { Music2, Pause, Play } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { MUSIC_GENRES } from "@/lib/music";
import type { MusicGenre } from "@/types/music";
import { getMusicController } from "./music-mini-player";

export function MusicOnlySheet() {
  const {
    isMusicSheetOpen,
    closeMusicSheet,
    isPlaying,
    currentGenre,
    selectGenre,
  } = useMusicPlayer();

  const handlePlay = (genre: MusicGenre) => {
    // 사용자 클릭 컨텍스트 — 컨트롤러가 랜덤 시작 위치부터 파트 로드 + play() 호출(autoplay 정책).
    const ctrl = getMusicController();
    if (ctrl) ctrl.startGenre(genre);
    else selectGenre(genre); // 폴백 (미니플레이어 미마운트 시)
    closeMusicSheet();
  };

  const handleStop = () => {
    getMusicController()?.pauseAudio();
    useMusicPlayer.getState().close();
    closeMusicSheet();
  };

  return (
    <Sheet open={isMusicSheetOpen} onOpenChange={(open) => (open ? null : closeMusicSheet())}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[85dvh] overflow-y-auto p-0 sm:max-w-lg sm:mx-auto"
      >
        <div className="px-4 py-4 sm:px-6">
          <SheetHeader className="text-left pb-3">
            <SheetTitle className="flex items-center gap-2">
              <Music2 className="h-5 w-5 text-emerald-600" />
              배경음악
            </SheetTitle>
            <SheetDescription>
              종류를 선택하면 끊김 없이 이어서 재생됩니다.
            </SheetDescription>
          </SheetHeader>

          {/* 2장르 카드 */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            {MUSIC_GENRES.map((genre) => {
              const isActive = isPlaying && currentGenre?.id === genre.id;
              return (
                <button
                  key={genre.id}
                  type="button"
                  onClick={() => handlePlay(genre)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-2xl py-7 text-center transition-all",
                    isActive
                      ? "bg-emerald-500/10 text-emerald-700 ring-2 ring-emerald-500/40 dark:text-emerald-400"
                      : "bg-muted/50 text-foreground hover:bg-muted ring-1 ring-border",
                  )}
                >
                  <span className="text-4xl">{genre.emoji}</span>
                  <span className="text-sm font-semibold">{genre.name}</span>
                  {isActive && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      재생 중
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 정지 (재생 중일 때만) */}
          {isPlaying && (
            <div className="flex pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleStop}
                className="flex-1"
              >
                <Pause className="mr-1 h-4 w-4" />
                정지
              </Button>
            </div>
          )}

          {!isPlaying && currentGenre && (
            <div className="flex pt-1">
              <Button
                type="button"
                onClick={() => handlePlay(currentGenre)}
                className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Play className="mr-1 h-4 w-4" />
                {currentGenre.name} 다시 재생
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
