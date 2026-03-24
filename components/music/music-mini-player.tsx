"use client";

import { useRef, useEffect, useCallback } from "react";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { MUSIC_CATEGORIES } from "@/lib/music-data";
import { TimerSheet } from "./playlist-sheet";
import { ReadingCompleteDialog } from "./reading-complete-dialog";
import { cn } from "@/lib/utils";

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** 헤더 음악/타이머 버튼 */
export function MusicToggleButton() {
  const { isVisible, timerStatus, openTimerSheet, pauseTimer, resumeTimer } =
    useMusicPlayer();

  function handleClick() {
    if (timerStatus === "running") {
      pauseTimer();
    } else if (timerStatus === "paused") {
      resumeTimer();
    } else {
      openTimerSheet();
    }
  }

  const isActive = timerStatus === "running";
  const isPaused = timerStatus === "paused";

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-colors",
        isActive
          ? "bg-primary/15 text-primary"
          : isPaused
            ? "bg-orange-500/15 text-orange-500"
            : "text-muted-foreground hover:bg-muted"
      )}
      title={
        isActive
          ? "독서 일시정지"
          : isPaused
            ? "독서 계속하기"
            : "독서 타이머"
      }
    >
      <span className="text-base sm:text-lg">
        {isActive ? "⏱" : isPaused ? "⏸" : "🎶"}
      </span>
    </button>
  );
}

/** 미니 플레이어 (하단 고정) */
export function MusicMiniPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    isVisible,
    isPlaying,
    currentTrack,
    currentTime,
    duration,
    volume,
    timerStatus,
    targetSeconds,
    remainingSeconds,
    toggle,
    next,
    prev,
    seekTo,
    updateTime,
    tickTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
  } = useMusicPlayer();

  const isTimerActive = timerStatus === "running" || timerStatus === "paused";

  // ── 타이머 setInterval ──
  useEffect(() => {
    if (timerStatus === "running") {
      timerRef.current = setInterval(() => {
        useMusicPlayer.getState().tickTimer();
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerStatus]);

  // ── 재생/정지 동기화 ──
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.play().catch(() => {
        useMusicPlayer.getState().pause();
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  // ── 트랙 변경 시 src 업데이트 ──
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

  // ── 볼륨 동기화 ──
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  // ── 시킹 동기화 ──
  const lastSeek = useRef(0);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (Math.abs(currentTime - lastSeek.current) > 1) {
      if (Math.abs(audio.currentTime - currentTime) > 2) {
        audio.currentTime = currentTime;
      }
    }
    lastSeek.current = currentTime;
  }, [currentTime]);

  // ── 오디오 이벤트 ──
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    lastSeek.current = audio.currentTime;
    updateTime(audio.currentTime, audio.duration || 0);
  }, [updateTime]);

  const handleEnded = useCallback(() => {
    next();
  }, [next]);

  // ── Media Session API ──
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

  // ── 프로그레스 바 클릭 ──
  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    if (isTimerActive) return; // 타이머 모드에서는 시킹 불가
    const bar = progressRef.current;
    const audio = audioRef.current;
    if (!bar || !audio || !audio.duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const newTime = pct * audio.duration;
    audio.currentTime = newTime;
    seekTo(newTime);
  }

  // ── 타이머 일시정지/재시작 토글 ──
  function handleTimerToggle() {
    if (timerStatus === "running") pauseTimer();
    else if (timerStatus === "paused") resumeTimer();
  }

  // TimerSheet와 ReadingCompleteDialog는 플레이어 비표시 상태에서도 접근 가능해야 함
  if (!isVisible || !currentTrack) {
    return (
      <>
        <TimerSheet />
        <ReadingCompleteDialog />
      </>
    );
  }

  const catInfo = MUSIC_CATEGORIES.find(
    (c) => c.id === currentTrack.category
  );

  // 프로그레스: 타이머 모드면 남은 시간, 아니면 곡 진행률
  const progress = isTimerActive
    ? targetSeconds > 0
      ? ((targetSeconds - remainingSeconds) / targetSeconds) * 100
      : 0
    : duration > 0
      ? (currentTime / duration) * 100
      : 0;

  return (
    <>
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
          className={cn(
            "h-1 bg-muted transition-all",
            !isTimerActive && "cursor-pointer group hover:h-1.5"
          )}
        >
          <div
            className={cn(
              "h-full rounded-r-full transition-[width] duration-200",
              isTimerActive ? "bg-orange-500" : "bg-primary"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 플레이어 컨텐츠 */}
        <div className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5">
          {/* 트랙 정보 */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="text-lg shrink-0">
              {isTimerActive ? "⏱" : (catInfo?.emoji ?? "🎵")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {currentTrack.composer} — {currentTrack.title}
              </p>
              {isTimerActive ? (
                <p
                  className={cn(
                    "text-xs font-semibold tabular-nums",
                    timerStatus === "paused"
                      ? "text-orange-500"
                      : "text-muted-foreground"
                  )}
                >
                  {timerStatus === "paused" ? "일시정지 · " : ""}
                  {formatTime(remainingSeconds)} 남음
                </p>
              ) : (
                <p className="text-xs text-muted-foreground truncate">
                  {currentTrack.performer} · {catInfo?.name}
                </p>
              )}
            </div>
          </div>

          {/* 시간 (타이머 미사용 시만) */}
          {!isTimerActive && (
            <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          )}

          {/* 컨트롤 */}
          <div className="flex items-center gap-0.5">
            {!isTimerActive && (
              <button
                onClick={prev}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                title="이전 곡"
              >
                <span className="text-sm">⏮</span>
              </button>
            )}

            <button
              onClick={isTimerActive ? handleTimerToggle : toggle}
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

            {isTimerActive ? (
              <button
                onClick={stopTimer}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                title="타이머 종료"
              >
                <span className="text-sm">⏹</span>
              </button>
            ) : (
              <button
                onClick={() => useMusicPlayer.getState().openTimerSheet()}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                title="타이머 설정"
              >
                <span className="text-sm">⏱</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 타이머 설정 시트 */}
      <TimerSheet />

      {/* 독서 완료 팝업 */}
      <ReadingCompleteDialog />
    </>
  );
}
