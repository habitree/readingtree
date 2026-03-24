"use client";

import { useRef, useEffect, useCallback } from "react";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { MUSIC_CATEGORIES } from "@/lib/music-data";
import { TimerSheet } from "./playlist-sheet";
import { ReadingCompleteDialog } from "./reading-complete-dialog";
import { Pause, Play, SkipBack, SkipForward, Square, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** 원형 타이머 인디케이터 (미니 사이즈) */
function CircleTimer({
  remaining,
  total,
  size = 36,
  stroke = 3,
}: {
  remaining: number;
  total: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = total > 0 ? remaining / total : 0;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/40"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          className="text-primary transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Timer className="w-3.5 h-3.5 text-primary" />
      </div>
    </div>
  );
}

/** 헤더 음악/타이머 버튼 */
export function MusicToggleButton() {
  const { isVisible, timerStatus, remainingSeconds, targetSeconds, openTimerSheet, pauseTimer, resumeTimer } =
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
        "flex items-center justify-center rounded-full transition-all",
        isActive || isPaused
          ? "gap-1 px-2.5 h-8 sm:h-9"
          : "w-9 h-9 sm:w-10 sm:h-10",
        isActive
          ? "bg-primary/10 text-primary"
          : isPaused
            ? "bg-orange-500/10 text-orange-500"
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
      {isActive || isPaused ? (
        <>
          <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="text-xs font-semibold tabular-nums">
            {formatTime(remainingSeconds)}
          </span>
        </>
      ) : (
        <Timer className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
      )}
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
    elapsedSeconds,
    toggle,
    next,
    prev,
    seekTo,
    updateTime,
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
      title: isTimerActive
        ? `${formatTime(remainingSeconds)} 남음 — ${currentTrack.title}`
        : currentTrack.title,
      artist: `${currentTrack.composer} · ${currentTrack.performer}`,
      album: catInfo ? `ReadingTree - ${catInfo.name}` : "ReadingTree Music",
    });
    navigator.mediaSession.setActionHandler("play", () => {
      const s = useMusicPlayer.getState();
      if (s.timerStatus === "paused") s.resumeTimer();
      else s.play();
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      const s = useMusicPlayer.getState();
      if (s.timerStatus === "running") s.pauseTimer();
      else s.pause();
    });
    navigator.mediaSession.setActionHandler("previoustrack", () =>
      useMusicPlayer.getState().prev()
    );
    navigator.mediaSession.setActionHandler("nexttrack", () =>
      useMusicPlayer.getState().next()
    );
  }, [currentTrack, isTimerActive, remainingSeconds]);

  // ── 프로그레스 바 클릭 ──
  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    if (isTimerActive) return;
    const bar = progressRef.current;
    const audio = audioRef.current;
    if (!bar || !audio || !audio.duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const newTime = pct * audio.duration;
    audio.currentTime = newTime;
    seekTo(newTime);
  }

  function handleTimerToggle() {
    if (timerStatus === "running") pauseTimer();
    else if (timerStatus === "paused") resumeTimer();
  }

  // TimerSheet/ReadingCompleteDialog는 항상 렌더링
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
          "z-[45] border-t",
          "transition-transform duration-300",
          isVisible ? "translate-y-0" : "translate-y-full",
          isTimerActive
            ? "bg-gradient-to-r from-background/98 via-primary/[0.03] to-background/98 backdrop-blur-md"
            : "bg-background/98 backdrop-blur-md"
        )}
      >
        {/* 프로그레스 바 */}
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className={cn(
            "h-1 bg-muted transition-all",
            !isTimerActive && "cursor-pointer hover:h-1.5"
          )}
        >
          <div
            className={cn(
              "h-full rounded-r-full transition-[width] duration-1000",
              isTimerActive
                ? timerStatus === "paused"
                  ? "bg-orange-400"
                  : "bg-primary"
                : "bg-primary"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 플레이어 컨텐츠 */}
        <div className="flex items-center gap-2.5 px-3 py-2 sm:px-4 sm:py-2.5">
          {/* 좌측: 타이머 원형 or 이모지 */}
          {isTimerActive ? (
            <CircleTimer
              remaining={remainingSeconds}
              total={targetSeconds}
              size={38}
              stroke={3}
            />
          ) : (
            <span className="text-lg shrink-0 w-[38px] text-center">
              {catInfo?.emoji ?? "🎵"}
            </span>
          )}

          {/* 트랙 + 타이머 정보 */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">
              {currentTrack.composer} — {currentTrack.title}
            </p>
            {isTimerActive ? (
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={cn(
                    "font-bold tabular-nums",
                    timerStatus === "paused"
                      ? "text-orange-500"
                      : "text-primary"
                  )}
                >
                  {formatTime(remainingSeconds)}
                </span>
                <span className="text-muted-foreground">남음</span>
                {timerStatus === "paused" && (
                  <span className="text-orange-500/70 text-[10px] font-medium">
                    일시정지
                  </span>
                )}
                <span className="text-muted-foreground/50 ml-auto text-[10px] tabular-nums hidden sm:block">
                  {formatTime(elapsedSeconds)} 경과
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground truncate">
                {currentTrack.performer} · {catInfo?.name}
              </p>
            )}
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
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                title="이전 곡"
              >
                <SkipBack className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}

            <button
              onClick={isTimerActive ? handleTimerToggle : toggle}
              className={cn(
                "w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-colors",
                isTimerActive && timerStatus === "paused"
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              title={isPlaying ? "일시정지" : "재생"}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </button>

            <button
              onClick={next}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              title="다음 곡"
            >
              <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {isTimerActive && (
              <button
                onClick={stopTimer}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title="독서 종료"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <TimerSheet />
      <ReadingCompleteDialog />
    </>
  );
}
