"use client";

import { useRef, useEffect, useCallback } from "react";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { getDefaultPlaylistTracks, MUSIC_CATEGORIES } from "@/lib/music-data";
import { PlaylistSheet } from "./playlist-sheet";
import { cn } from "@/lib/utils";

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** 헤더 음악 버튼 (플레이어 열기/닫기) */
export function MusicToggleButton() {
  const { isVisible, isPlaying, loadPlaylist, close, toggle } =
    useMusicPlayer();

  function handleClick() {
    if (isVisible) {
      if (isPlaying) {
        toggle();
      } else {
        close();
      }
    } else {
      const tracks = getDefaultPlaylistTracks();
      loadPlaylist(tracks);
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-colors",
        isVisible && isPlaying
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-muted"
      )}
      title={isVisible ? (isPlaying ? "음악 정지" : "음악 닫기") : "배경음악 재생"}
    >
      <span className="text-base sm:text-lg">
        {isVisible && isPlaying ? "🎵" : "🎶"}
      </span>
    </button>
  );
}

/** 미니 플레이어 (하단 고정) */
export function MusicMiniPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const {
    isVisible,
    isPlaying,
    currentTrack,
    currentTime,
    duration,
    volume,
    toggle,
    next,
    prev,
    seekTo,
    updateTime,
    openPlaylist,
  } = useMusicPlayer();

  // 재생/정지 동기화
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.play().catch(() => {
        // 자동재생 차단 시 (모바일) 상태 복원
        useMusicPlayer.getState().pause();
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  // 트랙 변경 시 src 업데이트
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.src = currentTrack.sourceUrl;
    audio.load();
    if (isPlaying) {
      audio.play().catch(() => {
        useMusicPlayer.getState().pause();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  // 볼륨 동기화
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  // 시킹 동기화
  const lastSeek = useRef(0);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (Math.abs(currentTime - lastSeek.current) > 1) {
      // 외부에서 seekTo 호출 시
      if (Math.abs(audio.currentTime - currentTime) > 2) {
        audio.currentTime = currentTime;
      }
    }
    lastSeek.current = currentTime;
  }, [currentTime]);

  // 오디오 이벤트
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    lastSeek.current = audio.currentTime;
    updateTime(audio.currentTime, audio.duration || 0);
  }, [updateTime]);

  const handleEnded = useCallback(() => {
    next();
  }, [next]);

  // Media Session API
  useEffect(() => {
    if (!currentTrack || !("mediaSession" in navigator)) return;

    const catInfo = MUSIC_CATEGORIES.find(
      (c) => c.id === currentTrack.category
    );

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: `${currentTrack.composer} · ${currentTrack.performer}`,
      album: catInfo ? `ReadingTree - ${catInfo.name}` : "ReadingTree Music",
    });

    navigator.mediaSession.setActionHandler("play", () =>
      useMusicPlayer.getState().play()
    );
    navigator.mediaSession.setActionHandler("pause", () =>
      useMusicPlayer.getState().pause()
    );
    navigator.mediaSession.setActionHandler("previoustrack", () =>
      useMusicPlayer.getState().prev()
    );
    navigator.mediaSession.setActionHandler("nexttrack", () =>
      useMusicPlayer.getState().next()
    );
  }, [currentTrack]);

  // 프로그레스 바 클릭 시킹
  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    const bar = progressRef.current;
    const audio = audioRef.current;
    if (!bar || !audio || !audio.duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const newTime = pct * audio.duration;
    audio.currentTime = newTime;
    seekTo(newTime);
  }

  if (!isVisible || !currentTrack) return null;

  const catInfo = MUSIC_CATEGORIES.find(
    (c) => c.id === currentTrack.category
  );
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* 숨겨진 audio 요소 */}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />

      {/* 미니 플레이어 */}
      <div
        className={cn(
          "fixed bottom-14 sm:bottom-16 lg:bottom-0 left-0 right-0 lg:left-64",
          "z-[45] bg-background/98 backdrop-blur-md border-t",
          "transition-transform duration-300",
          isVisible ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* 프로그레스 바 */}
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="h-1 bg-muted cursor-pointer group hover:h-1.5 transition-all"
        >
          <div
            className="h-full bg-primary rounded-r-full transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 플레이어 컨텐츠 */}
        <div className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5">
          {/* 트랙 정보 */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="text-lg shrink-0">{catInfo?.emoji ?? "🎵"}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {currentTrack.composer} — {currentTrack.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {currentTrack.performer} · {catInfo?.name}
              </p>
            </div>
          </div>

          {/* 시간 */}
          <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* 컨트롤 */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={prev}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              title="이전 곡"
            >
              <span className="text-sm">⏮</span>
            </button>
            <button
              onClick={toggle}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              title={isPlaying ? "일시정지" : "재생"}
            >
              <span className="text-base">{isPlaying ? "⏸" : "▶"}</span>
            </button>
            <button
              onClick={next}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              title="다음 곡"
            >
              <span className="text-sm">⏭</span>
            </button>
            <button
              onClick={openPlaylist}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              title="플레이리스트"
            >
              <span className="text-sm">☰</span>
            </button>
          </div>
        </div>
      </div>

      {/* 플레이리스트 바텀시트 */}
      <PlaylistSheet />
    </>
  );
}
