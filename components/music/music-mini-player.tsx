"use client";

import { useRef, useEffect, useCallback } from "react";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { getTrackMoodLabel } from "@/lib/music";
import { TimerSheet } from "./playlist-sheet";
import { ReadingCompleteDialog } from "./reading-complete-dialog";
import { TrackListSheet } from "./track-list-sheet";
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Square,
  Timer,
  Volume2,
  VolumeX,
  Music2,
  ListMusic,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** 원형 타이머 인디케이터 */
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
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/40" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} className="text-primary transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Timer className="w-3.5 h-3.5 text-primary" />
      </div>
    </div>
  );
}

/** 헤더 타이머 + 음악 버튼 */
export function MusicToggleButton() {
  const { isVisible, timerStatus, remainingSeconds, elapsedSeconds, isUnlimited, openTimerSheet, pauseTimer, resumeTimer } =
    useMusicPlayer();

  function handleClick() {
    if (timerStatus === "running") pauseTimer();
    else if (timerStatus === "paused") resumeTimer();
    else openTimerSheet();
  }

  const isActive = timerStatus === "running";
  const isPaused = timerStatus === "paused";

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center justify-center rounded-full transition-all gap-1",
        isActive || isPaused ? "px-2.5 h-8 sm:h-9" : "w-9 h-9 sm:w-10 sm:h-10",
        isActive
          ? "bg-primary/10 text-primary"
          : isPaused
            ? "bg-orange-500/10 text-orange-500"
            : "text-muted-foreground hover:bg-muted"
      )}
      title={isActive ? "독서 일시정지" : isPaused ? "독서 계속하기" : "독서 타이머 + 음악"}
    >
      {isActive || isPaused ? (
        <>
          <Timer className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold tabular-nums">
            {isUnlimited ? formatTime(elapsedSeconds) : formatTime(remainingSeconds)}
          </span>
        </>
      ) : (
        <div className="relative">
          <Timer className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          <Music2 className="w-2 h-2 absolute -bottom-0.5 -right-0.5 text-primary" />
        </div>
      )}
    </button>
  );
}

/**
 * 전역 audio 엘리먼트 참조
 * 사용자 클릭 이벤트 핸들러에서 직접 audio.play()를 호출하기 위해 노출
 * (useEffect 내 play()는 브라우저 autoplay 정책에 의해 차단됨)
 */
let globalAudioRef: HTMLAudioElement | null = null;
export function getGlobalAudio() { return globalAudioRef; }

/** 미니 플레이어 */
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
    isUnlimited,
    isVolumeOpen,
    toggle,
    next,
    prev,
    seekTo,
    setVolume,
    updateTime,
    pauseTimer,
    resumeTimer,
    stopTimer,
    openTrackList,
    toggleVolume,
  } = useMusicPlayer();

  const isTimerActive = timerStatus === "running" || timerStatus === "paused";

  // ── 전역 audio 참조 동기화 ──
  useEffect(() => {
    globalAudioRef = audioRef.current;
    return () => { globalAudioRef = null; };
  }, []);

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
      audio.play().catch(() => useMusicPlayer.getState().pause());
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  // ── 트랙 변경 시 src 업데이트 ──
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    // 이미 동일 트랙이 재생 중이면 skip (handleStart에서 직접 play한 경우)
    if (audio.src.endsWith(currentTrack.sourceUrl) && !audio.paused) return;
    audio.src = currentTrack.sourceUrl;
    audio.load();
    if (isPlaying) {
      audio.play().catch(() => useMusicPlayer.getState().pause());
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

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    lastSeek.current = audio.currentTime;
    updateTime(audio.currentTime, audio.duration || 0);
  }, [updateTime]);

  const handleEnded = useCallback(() => next(), [next]);

  // ── 외부 URL 로딩 실패 시 다음 곡 스킵 ──
  const handleError = useCallback(() => {
    const state = useMusicPlayer.getState();
    if (state.currentTrack?.isExternal) {
      state.next();
    }
  }, []);

  // ── Media Session API ──
  useEffect(() => {
    if (!currentTrack || !("mediaSession" in navigator)) return;
    const moodLabel = getTrackMoodLabel(currentTrack);
    navigator.mediaSession.metadata = new MediaMetadata({
      title: isTimerActive
        ? isUnlimited
          ? `${formatTime(elapsedSeconds)} 경과 — ${currentTrack.title}`
          : `${formatTime(remainingSeconds)} 남음 — ${currentTrack.title}`
        : currentTrack.title,
      artist: `${currentTrack.composer} · ${currentTrack.performer}`,
      album: `ReadingTree - ${moodLabel.name}`,
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
    navigator.mediaSession.setActionHandler("previoustrack", () => useMusicPlayer.getState().prev());
    navigator.mediaSession.setActionHandler("nexttrack", () => useMusicPlayer.getState().next());
  }, [currentTrack, isTimerActive, isUnlimited, remainingSeconds, elapsedSeconds]);

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    if (isTimerActive && !isUnlimited) return;
    const bar = progressRef.current;
    const audio = audioRef.current;
    if (!bar || !audio || !audio.duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
    seekTo(pct * audio.duration);
  }

  function handleTimerToggle() {
    const audio = audioRef.current;
    if (timerStatus === "running") {
      audio?.pause();
      pauseTimer();
    } else if (timerStatus === "paused") {
      audio?.play().catch(() => {});
      resumeTimer();
    }
  }

  // 사용자 클릭에서 직접 audio.play() 호출 (autoplay 정책 우회)
  function handlePlayToggle() {
    const audio = audioRef.current;
    if (!audio) { toggle(); return; }
    if (isPlaying) {
      audio.pause();
      useMusicPlayer.getState().pause();
    } else {
      audio.play().then(() => {
        useMusicPlayer.getState().play();
      }).catch(() => {});
    }
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setVolume(parseFloat(e.target.value));
  }

  // TimerSheet/ReadingCompleteDialog/TrackListSheet는 항상 렌더링
  if (!isVisible || !currentTrack) {
    return (
      <>
        <TimerSheet />
        <ReadingCompleteDialog />
        <TrackListSheet />
      </>
    );
  }

  const catInfo = getTrackMoodLabel(currentTrack);
  const progress = isTimerActive && !isUnlimited
    ? targetSeconds > 0 ? ((targetSeconds - remainingSeconds) / targetSeconds) * 100 : 0
    : duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <audio ref={audioRef} preload="metadata" onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} onError={handleError} />

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
          className={cn("h-1 bg-muted transition-all", (!isTimerActive || isUnlimited) && "cursor-pointer hover:h-1.5")}
        >
          <div
            className={cn(
              "h-full rounded-r-full transition-[width] duration-1000",
              isTimerActive && timerStatus === "paused" ? "bg-orange-400" : "bg-primary"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2">
          {/* 좌측: 타이머 or 카테고리 아이콘 */}
          {isTimerActive ? (
            isUnlimited ? (
              <div className="relative shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Timer className="w-4 h-4 text-primary animate-pulse" />
              </div>
            ) : (
              <CircleTimer remaining={remainingSeconds} total={targetSeconds} size={36} stroke={3} />
            )
          ) : (
            <button
              onClick={openTrackList}
              className="w-9 h-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center"
              title="재생 목록"
            >
              <Music2 className="w-4 h-4 text-primary" />
            </button>
          )}

          {/* 곡 정보 (탭하면 트랙리스트) */}
          <button onClick={openTrackList} className="min-w-0 flex-1 text-left">
            <p className="text-[13px] font-medium truncate leading-tight">
              {currentTrack.composer} — {currentTrack.title}
            </p>
            {isTimerActive ? (
              <div className="flex items-center gap-1.5 text-xs mt-0.5">
                {isUnlimited ? (
                  <>
                    <span className={cn("font-bold tabular-nums", timerStatus === "paused" ? "text-orange-500" : "text-primary")}>
                      {formatTime(elapsedSeconds)}
                    </span>
                    <span className="text-muted-foreground">경과</span>
                    {timerStatus === "paused" && <span className="text-orange-500/70 text-[10px]">일시정지</span>}
                    <span className="text-muted-foreground/40 ml-auto text-[10px]">무제한</span>
                  </>
                ) : (
                  <>
                    <span className={cn("font-bold tabular-nums", timerStatus === "paused" ? "text-orange-500" : "text-primary")}>
                      {formatTime(remainingSeconds)}
                    </span>
                    <span className="text-muted-foreground">남음</span>
                    {timerStatus === "paused" && <span className="text-orange-500/70 text-[10px]">일시정지</span>}
                    <span className="text-muted-foreground/40 ml-auto text-[10px] tabular-nums hidden sm:block">
                      {formatTime(elapsedSeconds)} 경과
                    </span>
                  </>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground truncate mt-0.5 leading-tight">
                {catInfo?.emoji} {catInfo?.name} · {formatTime(currentTime)}/{formatTime(duration)}
              </p>
            )}
          </button>

          {/* 컨트롤 */}
          <div className="flex items-center gap-px shrink-0">
            <button
              onClick={prev}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              title="이전 곡"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={isTimerActive ? handleTimerToggle : handlePlayToggle}
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-full transition-colors",
                isTimerActive && timerStatus === "paused"
                  ? "bg-orange-500 text-white"
                  : "bg-primary text-primary-foreground"
              )}
              title={isPlaying ? "일시정지" : "재생"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              onClick={next}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              title="다음 곡"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            {/* 음량 버튼 */}
            <button
              onClick={toggleVolume}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              title="음량 조절"
            >
              {volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>

            {/* 트랙리스트 버튼 */}
            <button
              onClick={openTrackList}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              title="재생 목록"
            >
              <ListMusic className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {/* 타이머 종료 버튼 */}
            {isTimerActive && (
              <button
                onClick={stopTimer}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title="독서 종료"
              >
                <Square className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* 음량 슬라이더 (토글) */}
        {isVolumeOpen && (
          <div className="flex items-center gap-3 px-4 pb-2 pt-0.5">
            <VolumeX
              className="w-3.5 h-3.5 text-muted-foreground shrink-0 cursor-pointer"
              onClick={() => setVolume(0)}
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm"
            />
            <Volume2
              className="w-3.5 h-3.5 text-muted-foreground shrink-0 cursor-pointer"
              onClick={() => setVolume(0.7)}
            />
            <span className="text-[10px] text-muted-foreground tabular-nums w-7 text-right">
              {Math.round(volume * 100)}
            </span>
          </div>
        )}
      </div>

      <TimerSheet />
      <ReadingCompleteDialog />
      <TrackListSheet />
    </>
  );
}
