"use client";

/**
 * 헤더 음악 버튼 — 단순 idle/playing 분기.
 *
 * music-mini-player와 분리된 경량 파일. 헤더는 (main) 레이아웃에 상주하므로
 * 이 파일이 오디오 엔진/채널 데이터를 import 하면 전 페이지 초기 번들이 커진다.
 * 스토어(use-music-player)와 컨트롤러 레지스트리만 사용할 것.
 */

import { Music2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { getMusicController } from "./music-controller";

export function MusicToggleButton() {
  const { isPlaying, currentGenre, openMusicSheet } = useMusicPlayer();

  function handleClick() {
    const ctrl = getMusicController();
    if (isPlaying) {
      ctrl?.pauseAudio();
    } else if (ctrl && currentGenre) {
      ctrl.resume();
    } else {
      openMusicSheet();
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "group relative flex items-center justify-center transition-all duration-300",
        "w-9 h-9 sm:w-10 sm:h-10 rounded-xl",
        isPlaying
          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/20"
          : "text-muted-foreground hover:bg-amber-500/8 hover:text-amber-700 dark:hover:text-amber-400",
      )}
      title={isPlaying ? "음악 일시정지" : "배경음악"}
      aria-label={isPlaying ? "음악 일시정지" : "배경음악"}
    >
      {isPlaying ? (
        <Music2 className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
      ) : (
        <Music2 className="w-[18px] h-[18px] sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110" />
      )}
    </button>
  );
}
