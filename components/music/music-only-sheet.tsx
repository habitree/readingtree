"use client";

/**
 * MusicOnlySheet (음악 3채널 + 백색소음 4채널 — 2026-07-31)
 *
 * 음악(피아노/클래식/재즈) 카드 + 백색소음(빗소리/숲속/파도/모닥불) 카드 + 재생/정지.
 * 음악은 곡 단위 셔플 큐로 매번 다른 순서, 백색소음은 단일 음원을 이어 반복한다.
 * 백색소음 출처(CC 표기 의무)는 섹션 하단 문구 + 미니플레이어 녹음자명으로 표기.
 * 음악 출처(Musopen·Commons·Mixkit, CC BY-SA 2곡)도 같은 문구에 표기 — 2026-09-03.
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
import { getMusicController } from "./music-controller";

export function MusicOnlySheet() {
  const {
    isMusicSheetOpen,
    closeMusicSheet,
    isPlaying,
    currentGenre,
    selectGenre,
  } = useMusicPlayer();

  const handlePlay = (genre: MusicGenre) => {
    // 사용자 클릭 컨텍스트 — 컨트롤러가 셔플 큐 첫 곡부터 파트 로드 + play() 호출(autoplay 정책).
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
              음악은 매번 새로운 순서로, 백색소음은 끊김 없이 반복 재생됩니다.
            </SheetDescription>
          </SheetHeader>

          {/* 음악 채널 카드 */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            {MUSIC_GENRES.filter((g) => !g.ambience).map((genre) => (
              <GenreCard
                key={genre.id}
                genre={genre}
                isActive={isPlaying && currentGenre?.id === genre.id}
                onPlay={handlePlay}
              />
            ))}
          </div>

          {/* 백색소음 채널 카드 */}
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            백색소음 — 자연의 소리를 이어서 반복 재생합니다
          </p>
          <div className="mb-2 grid grid-cols-2 gap-3">
            {MUSIC_GENRES.filter((g) => g.ambience).map((genre) => (
              <GenreCard
                key={genre.id}
                genre={genre}
                isActive={isPlaying && currentGenre?.id === genre.id}
                onPlay={handlePlay}
              />
            ))}
          </div>
          <p className="mb-4 text-[10px] leading-relaxed text-muted-foreground/70">
            자연음 출처: Wikimedia Commons — Zuvji(빗소리, CC BY-SA 4.0) ·
            Silas S. Brown(숲속, PD) · Andrew Migneault(파도, CC BY-SA 4.0) ·
            Glaneur de sons(모닥불, CC BY 3.0)
            <br />
            음악 출처: Musopen · Wikimedia Commons(PD/CC0) · Mixkit(재즈) ·
            Advent Chamber Orchestra(아이네 클라이네 1악장·브란덴부르크 3번, CC BY-SA 2.0)
          </p>

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

function GenreCard({
  genre,
  isActive,
  onPlay,
}: {
  genre: MusicGenre;
  isActive: boolean;
  onPlay: (genre: MusicGenre) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPlay(genre)}
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
}
