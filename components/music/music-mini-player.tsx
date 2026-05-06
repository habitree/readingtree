"use client";

/**
 * MusicMiniPlayer (단순화 — 2026-05-05 분리 단계 C)
 *
 * 음악 전용. 기록·세션·타이머와 분리.
 * 표시: 재생 중 곡 정보 + 재생/정지/이전/다음/볼륨/곡목록 버튼.
 * 시간 표시·CircleTimer·"독서 시간"·activeBook·종료 버튼 모두 제거.
 *
 * audio 처리 로직(safePlay·재시도·버퍼링·네트워크 복구·Media Session)은 보존.
 */

import { useRef, useEffect, useCallback } from "react";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { getTrackMoodLabel, initMusicData } from "@/lib/music";
import { MusicOnlySheet } from "./music-only-sheet";
import { TrackListSheet } from "./track-list-sheet";
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music2,
  ListMusic,
  Headphones,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NetworkInformation extends EventTarget {
  type?: string;
  effectiveType?: string;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}
interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** 헤더 음악 버튼 — 단순 idle/playing 분기 */
export function MusicToggleButton() {
  const { isPlaying, openMusicSheet, pause, play } = useMusicPlayer();
  const audio = getGlobalAudio();

  function handleClick() {
    if (isPlaying) {
      audio?.pause();
      pause();
    } else {
      // 이미 곡이 로드되어 있으면 재생, 없으면 시트 열기
      if (audio?.src) {
        audio.play().then(() => play()).catch(() => openMusicSheet());
      } else {
        openMusicSheet();
      }
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

/** 전역 audio 참조 — 외부에서 사용자 클릭 컨텍스트로 audio.play() 호출 */
let globalAudioRef: HTMLAudioElement | null = null;
export function getGlobalAudio() {
  return globalAudioRef;
}

/** 미니 플레이어 (음악만) */
export function MusicMiniPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const isLoadingTrack = useRef(false);
  const retryCount = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isBuffering = useRef(false);
  /**
   * 페이드 인/아웃 보조.
   * - fadeTimer: 시작 페이드 인 setInterval 핸들 (진행 중 ≠ null)
   * - 페이드 진행 중에는 useEffect[volume] 의 직접 audio.volume 동기화를 건너뛴다.
   *   (사용자 슬라이더 변경은 다음 setInterval 콜백에서 자연스럽게 반영)
   */
  const fadeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const FADE_IN_MS = 500;
  const FADE_OUT_S = 1.2; // 트랙 끝 기준 초
  const MAX_RETRIES = 3;

  const {
    isVisible,
    isPlaying,
    currentTrack,
    currentTime,
    duration,
    volume,
    isVolumeOpen,
    toggle,
    next,
    prev,
    seekTo,
    setVolume,
    updateTime,
    openTrackList,
    toggleVolume,
    close,
  } = useMusicPlayer();

  useEffect(() => {
    initMusicData();
  }, []);

  useEffect(() => {
    globalAudioRef = audioRef.current;
    return () => {
      globalAudioRef = null;
    };
  }, []);

  // 미니플레이어 높이 CSS 변수 (모바일 하단 패딩 계산용)
  useEffect(() => {
    const h = isVisible && currentTrack ? "60px" : "0px";
    document.documentElement.style.setProperty("--music-player-height", h);
    return () => {
      document.documentElement.style.setProperty("--music-player-height", "0px");
    };
  }, [isVisible, currentTrack]);

  // 페이드 타이머 정리
  const clearFade = useCallback(() => {
    if (fadeTimer.current) {
      clearInterval(fadeTimer.current);
      fadeTimer.current = null;
    }
  }, []);

  // 트랙 시작 페이드 인 — audio.volume 0 에서 사용자 설정값까지 점진 증가
  const startFadeIn = useCallback(
    (audio: HTMLAudioElement) => {
      clearFade();
      const STEPS = 20;
      const interval = FADE_IN_MS / STEPS;
      audio.volume = 0;
      let step = 0;
      fadeTimer.current = setInterval(() => {
        step++;
        const target = useMusicPlayer.getState().volume;
        audio.volume = Math.max(0, Math.min(1, target * (step / STEPS)));
        if (step >= STEPS) {
          audio.volume = target;
          clearFade();
        }
      }, interval);
    },
    [clearFade],
  );

  // unmount 시 타이머 정리
  useEffect(() => {
    return () => clearFade();
  }, [clearFade]);

  // 안전한 play 호출 (재시도 포함)
  const safePlay = useCallback((audio: HTMLAudioElement) => {
    audio.play().catch((err: DOMException) => {
      if (err.name === "NotAllowedError") {
        useMusicPlayer.getState().pause();
        return;
      }
      if (retryCount.current < MAX_RETRIES) {
        retryCount.current += 1;
        const delay = 1000 * Math.pow(2, retryCount.current - 1);
        retryTimer.current = setTimeout(() => {
          const state = useMusicPlayer.getState();
          if (state.isPlaying && audio === audioRef.current) {
            safePlay(audio);
          }
        }, delay);
      } else {
        retryCount.current = 0;
        useMusicPlayer.getState().next();
      }
    });
  }, []);

  // 재생/정지 동기화
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isLoadingTrack.current && isPlaying) return;
    if (isPlaying && !audio.paused) return;
    if (!isPlaying && audio.paused) return;
    if (isPlaying) safePlay(audio);
    else audio.pause();
  }, [isPlaying, safePlay]);

  // 트랙 변경 시 src 업데이트 + 페이드 인
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    // 시트(MusicOnlySheet.handlePlay)가 이미 src 설정 + audio.play() 호출한 경우.
    // useEffect 가 currentTrack id 변경으로 트리거되었지만 src 는 그대로.
    // → 페이드 인만 적용 (src 재설정·load·canplay 대기 불필요).
    if (audio.src.endsWith(currentTrack.sourceUrl)) {
      if (useMusicPlayer.getState().isPlaying) startFadeIn(audio);
      return;
    }

    isLoadingTrack.current = true;
    retryCount.current = 0;
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }

    const onCanPlay = () => {
      isLoadingTrack.current = false;
      audio.removeEventListener("canplay", onCanPlay);
      if (useMusicPlayer.getState().isPlaying) {
        startFadeIn(audio);
        safePlay(audio);
      }
    };

    audio.addEventListener("canplay", onCanPlay);
    audio.src = currentTrack.sourceUrl;
    audio.load();

    return () => {
      audio.removeEventListener("canplay", onCanPlay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id, safePlay, startFadeIn]);

  // 볼륨 동기화 — 페이드 진행 중에는 직접 변경 생략(다음 setInterval 콜백에서 반영)
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && !fadeTimer.current) audio.volume = volume;
  }, [volume]);

  // 시킹 동기화
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

    // 트랙 끝 페이드 아웃 — 페이드 인이 진행 중이면 건너뜀
    if (!fadeTimer.current && audio.duration > 3) {
      const remaining = audio.duration - audio.currentTime;
      if (remaining > 0 && remaining < FADE_OUT_S) {
        const target = useMusicPlayer.getState().volume;
        audio.volume = Math.max(0, target * (remaining / FADE_OUT_S));
      }
    }
  }, [updateTime]);

  const handleEnded = useCallback(() => {
    // 페이드 아웃 후 다음 트랙 진입 — 페이드 인이 0 으로 다시 리셋해주지만
    // canplay 대기 사이에 무음으로 들리지 않도록 사용자 볼륨으로 잠시 복원.
    const audio = audioRef.current;
    if (audio) audio.volume = useMusicPlayer.getState().volume;
    next();
  }, [next]);

  const handleError = useCallback(() => {
    isLoadingTrack.current = false;
    const state = useMusicPlayer.getState();
    if (!state.isPlaying) return;
    if (retryCount.current < MAX_RETRIES) {
      retryCount.current += 1;
      const delay = 1000 * Math.pow(2, retryCount.current - 1);
      retryTimer.current = setTimeout(() => {
        const audio = audioRef.current;
        const s = useMusicPlayer.getState();
        if (audio && s.isPlaying && s.currentTrack) {
          audio.load();
          audio.addEventListener("canplay", function onRetry() {
            audio.removeEventListener("canplay", onRetry);
            if (useMusicPlayer.getState().isPlaying) safePlay(audio);
          });
        }
      }, delay);
    } else {
      retryCount.current = 0;
      state.next();
    }
  }, [safePlay]);

  // 버퍼링 감지
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    function handleWaiting() { isBuffering.current = true; }
    function handlePlaying() { isBuffering.current = false; retryCount.current = 0; }
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    return () => {
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
    };
  }, []);

  // 네트워크 복구
  useEffect(() => {
    function recoverPlayback() {
      const audio = audioRef.current;
      const state = useMusicPlayer.getState();
      if (!audio || !state.isPlaying || !state.currentTrack) return;
      if (audio.paused || isBuffering.current) {
        const savedTime = audio.currentTime;
        retryCount.current = 0;
        isBuffering.current = false;
        audio.load();
        audio.addEventListener("canplay", function onRecover() {
          audio.removeEventListener("canplay", onRecover);
          if (savedTime > 0) audio.currentTime = savedTime;
          if (useMusicPlayer.getState().isPlaying) safePlay(audio);
        });
      }
    }
    function handleOnline() { recoverPlayback(); }
    function handleStalled() {
      const audio = audioRef.current;
      const state = useMusicPlayer.getState();
      if (!audio || !state.isPlaying) return;
      isBuffering.current = true;
      retryTimer.current = setTimeout(() => recoverPlayback(), 2000);
    }
    function handleConnectionChange() {
      const state = useMusicPlayer.getState();
      if (!state.isPlaying) return;
      retryTimer.current = setTimeout(() => recoverPlayback(), 1000);
    }
    const audio = audioRef.current;
    window.addEventListener("online", handleOnline);
    audio?.addEventListener("stalled", handleStalled);
    const connection = (navigator as NavigatorWithConnection).connection;
    connection?.addEventListener("change", handleConnectionChange);
    return () => {
      window.removeEventListener("online", handleOnline);
      audio?.removeEventListener("stalled", handleStalled);
      connection?.removeEventListener("change", handleConnectionChange);
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
        retryTimer.current = null;
      }
    };
  }, [safePlay]);

  // 모바일 백그라운드 복귀
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      const audio = audioRef.current;
      const state = useMusicPlayer.getState();
      if (!audio || !state.isPlaying || !state.currentTrack) return;
      if (audio.paused || isBuffering.current) {
        const savedTime = audio.currentTime;
        retryCount.current = 0;
        isBuffering.current = false;
        audio.play().catch(() => {
          audio.load();
          audio.addEventListener("canplay", function onRecover() {
            audio.removeEventListener("canplay", onRecover);
            if (savedTime > 0) audio.currentTime = savedTime;
            if (useMusicPlayer.getState().isPlaying) safePlay(audio);
          });
        });
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [safePlay]);

  // Media Session API (단순화 — timer 의존 제거)
  useEffect(() => {
    if (!currentTrack || !("mediaSession" in navigator)) return;
    const moodLabel = getTrackMoodLabel(currentTrack);
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.composer,
      album: `ReadingTree - ${moodLabel.name}`,
    });
    navigator.mediaSession.setActionHandler("play", () => useMusicPlayer.getState().play());
    navigator.mediaSession.setActionHandler("pause", () => useMusicPlayer.getState().pause());
    navigator.mediaSession.setActionHandler("previoustrack", () => useMusicPlayer.getState().prev());
    navigator.mediaSession.setActionHandler("nexttrack", () => useMusicPlayer.getState().next());
  }, [currentTrack]);

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    const bar = progressRef.current;
    const audio = audioRef.current;
    if (!bar || !audio || !audio.duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
    seekTo(pct * audio.duration);
  }

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

  function handleClose() {
    const audio = audioRef.current;
    audio?.pause();
    close();
  }

  // audio 엘리먼트는 항상 렌더링 (autoplay 정책 우회 위해)
  if (!isVisible || !currentTrack) {
    return (
      <>
        <audio ref={audioRef} preload="metadata" onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} onError={handleError} />
        <MusicOnlySheet />
        <TrackListSheet />
      </>
    );
  }

  const catInfo = getTrackMoodLabel(currentTrack);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <audio ref={audioRef} preload="metadata" onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} onError={handleError} />

      <div
        className={cn(
          "fixed bottom-14 sm:bottom-16 lg:bottom-0 left-0 right-0 lg:left-64",
          "z-[45] border-t",
          "transition-transform duration-300",
          isVisible ? "translate-y-0" : "translate-y-full",
          "bg-background/98 backdrop-blur-md",
        )}
      >
        {/* 프로그레스 바 (드래그 가능) */}
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="h-1 bg-muted transition-all cursor-pointer hover:h-1.5"
        >
          <div
            className="h-full rounded-r-full bg-primary transition-[width] duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2">
          <button
            onClick={openTrackList}
            className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-primary/10 to-violet-500/10 flex items-center justify-center ring-1 ring-primary/10 shadow-sm hover:shadow-md transition-shadow"
            title="재생 목록"
          >
            <Headphones className="w-5 h-5 text-primary" />
          </button>

          <button onClick={openTrackList} className="min-w-0 flex-1 text-left">
            <p className="text-[13px] font-medium truncate leading-tight">
              {currentTrack.composer} — {currentTrack.title}
            </p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5 leading-tight">
              {catInfo?.emoji} {catInfo?.name} · {formatTime(currentTime)}/{formatTime(duration)}
            </p>
          </button>

          <div className="flex items-center gap-px shrink-0">
            <button
              onClick={prev}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              title="이전 곡"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handlePlayToggle}
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 shadow-sm",
                "bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground shadow-primary/25",
                "hover:scale-105 active:scale-95",
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

            <button
              onClick={openTrackList}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              title="재생 목록"
            >
              <ListMusic className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="음악 종료"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

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

      <MusicOnlySheet />
      <TrackListSheet />
    </>
  );
}
