"use client";

/**
 * MusicMiniPlayer (병합 + 파트 분할 재구성 — 2026-06-08)
 *
 * 장르(클래식/재즈)별로 분할된 파트를 두 개의 audio 엘리먼트로 이중 버퍼링하여
 * 끊김 없이 이어 붙여 "하나의 연속 음원"처럼 재생한다.
 * 재생 시 장르 전체 타임라인에서 랜덤 위치(startAt)부터 시작하고, 끝에 도달하면 처음으로 순환.
 *
 * 컨트롤: 재생/일시정지 · 볼륨 · 종료 만. 스킵/곡목록 제거.
 * 현재 곡 제목은 (현재 파트.start + audio.currentTime) + cues 로 계산해 표시.
 *
 * audio 안정화 로직(safePlay·재시도·버퍼링·네트워크·visibility 복구·fade-in·Media Session) 보존.
 */

import { useRef, useEffect, useCallback } from "react";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { findCueAt, findPartIndexAt } from "@/lib/music";
import type { MusicGenre } from "@/types/music";
import { MusicOnlySheet } from "./music-only-sheet";
import { Pause, Play, Volume2, VolumeX, Music2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** 사용자 클릭 컨텍스트에서 재생을 시작/제어하기 위한 컨트롤러 */
interface MusicController {
  startGenre: (genre: MusicGenre) => void;
  resume: () => void;
  pauseAudio: () => void;
}
let controller: MusicController | null = null;
export function getMusicController() {
  return controller;
}

/** 헤더 음악 버튼 — 단순 idle/playing 분기 */
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

/** 미니 플레이어 (음악만) */
export function MusicMiniPlayer() {
  const aRef = useRef<HTMLAudioElement>(null);
  const bRef = useRef<HTMLAudioElement>(null);
  const activeIdx = useRef<0 | 1>(0);
  const partIdx = useRef(0);
  const preloadedFor = useRef<number | null>(null);
  const retryCount = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isBuffering = useRef(false);
  const fadeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const FADE_IN_MS = 500;
  const PRELOAD_LEAD_S = 30; // 파트 끝 N초 전 다음 파트 프리로드(느린 회선 여유)
  const MAX_RETRIES = 3;

  const {
    isVisible,
    isPlaying,
    currentGenre,
    currentTime,
    volume,
    isVolumeOpen,
    setVolume,
    updateTime,
    toggleVolume,
    openMusicSheet,
    close,
  } = useMusicPlayer();

  const getActive = useCallback(
    () => (activeIdx.current === 0 ? aRef.current : bRef.current),
    [],
  );
  const getInactive = useCallback(
    () => (activeIdx.current === 0 ? bRef.current : aRef.current),
    [],
  );

  // 미니플레이어 높이 CSS 변수
  useEffect(() => {
    const h = isVisible && currentGenre ? "60px" : "0px";
    document.documentElement.style.setProperty("--music-player-height", h);
    return () => {
      document.documentElement.style.setProperty("--music-player-height", "0px");
    };
  }, [isVisible, currentGenre]);

  const clearFade = useCallback(() => {
    if (fadeTimer.current) {
      clearInterval(fadeTimer.current);
      fadeTimer.current = null;
    }
  }, []);

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

  useEffect(() => () => clearFade(), [clearFade]);

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
          if (useMusicPlayer.getState().isPlaying && audio === getActive()) {
            safePlay(audio);
          }
        }, delay);
      } else {
        retryCount.current = 0;
        useMusicPlayer.getState().pause();
      }
    });
  }, [getActive]);

  /** 장르 전체 타임라인 globalT 위치부터 재생 시작 (현재 활성 엘리먼트 사용) */
  const beginAt = useCallback(
    (genre: MusicGenre, globalT: number, fade: boolean) => {
      const audio = getActive();
      if (!audio) return;
      clearFade();
      const inactive = getInactive();
      inactive?.pause();
      preloadedFor.current = null;
      retryCount.current = 0;

      const pIdx = findPartIndexAt(genre.parts, globalT);
      partIdx.current = pIdx;
      const part = genre.parts[pIdx];
      const offset = Math.max(0, globalT - part.start);

      audio.loop = false;
      audio.volume = 0;
      audio.src = part.url;
      audio.play().catch(() => {}); // 사용자 제스처 내 호출 — autoplay 정책

      const onMeta = () => {
        audio.removeEventListener("loadedmetadata", onMeta);
        const seeked = offset > 0 && Number.isFinite(audio.duration);
        if (seeked) {
          audio.currentTime = Math.min(offset, Math.max(0, audio.duration - 0.3));
        }
        const proceed = () => {
          if (!useMusicPlayer.getState().isPlaying) return;
          if (fade) startFadeIn(audio);
          else audio.volume = useMusicPlayer.getState().volume;
          safePlay(audio);
        };
        if (seeked) {
          // seek 위치가 재생 가능해질 때까지 한 번 대기 → 무음으로 페이드되는 것 방지
          const onCp = () => {
            audio.removeEventListener("canplay", onCp);
            proceed();
          };
          audio.addEventListener("canplay", onCp);
        } else {
          proceed();
        }
      };
      audio.addEventListener("loadedmetadata", onMeta);
    },
    [getActive, getInactive, clearFade, startFadeIn, safePlay],
  );

  // 컨트롤러 등록 (사용자 제스처용)
  useEffect(() => {
    controller = {
      startGenre: (genre) => {
        useMusicPlayer.getState().selectGenre(genre);
        beginAt(genre, useMusicPlayer.getState().startAt, true);
      },
      resume: () => {
        const audio = getActive();
        const genre = useMusicPlayer.getState().currentGenre;
        if (!audio || !genre) return;
        if (!audio.src) {
          beginAt(genre, useMusicPlayer.getState().startAt, true);
          return;
        }
        audio.play().then(() => useMusicPlayer.getState().play()).catch(() => {});
      },
      pauseAudio: () => {
        getActive()?.pause();
        useMusicPlayer.getState().pause();
      },
    };
    return () => {
      controller = null;
    };
  }, [beginAt, getActive]);

  // 재생/정지 동기화 (활성 엘리먼트)
  useEffect(() => {
    const audio = getActive();
    if (!audio) return;
    if (isPlaying && audio.paused && audio.src) safePlay(audio);
    else if (!isPlaying && !audio.paused) audio.pause();
  }, [isPlaying, safePlay, getActive]);

  // 볼륨 동기화 — 양쪽 엘리먼트(페이드 중 제외)
  useEffect(() => {
    if (fadeTimer.current) return;
    if (aRef.current) aRef.current.volume = volume;
    if (bRef.current) bRef.current.volume = volume;
  }, [volume]);

  /** 파트 끝 근처에서 다음 파트 프리로드 (이중 버퍼) */
  const maybePreloadNext = useCallback((audio: HTMLAudioElement) => {
    const genre = useMusicPlayer.getState().currentGenre;
    if (!genre || genre.parts.length < 2) return;
    if (!Number.isFinite(audio.duration)) return;
    const remaining = audio.duration - audio.currentTime;
    if (remaining > 0 && remaining < PRELOAD_LEAD_S) {
      const nextPart = (partIdx.current + 1) % genre.parts.length;
      if (preloadedFor.current !== nextPart) {
        const inactive = getInactive();
        if (inactive) {
          inactive.src = genre.parts[nextPart].url;
          inactive.load();
          preloadedFor.current = nextPart;
        }
      }
    }
  }, [getInactive]);

  const handleTimeUpdate = useCallback(
    (e: React.SyntheticEvent<HTMLAudioElement>) => {
      const audio = e.currentTarget;
      if (audio !== getActive()) return;
      const genre = useMusicPlayer.getState().currentGenre;
      if (!genre) return;
      const part = genre.parts[partIdx.current];
      if (!part) return;
      updateTime(part.start + audio.currentTime, genre.durationSeconds);
      maybePreloadNext(audio);
    },
    [getActive, updateTime, maybePreloadNext],
  );

  // 파트 끝 → 다음 파트로 끊김 없이 전환 (loop 순환)
  const handleEnded = useCallback(
    (e: React.SyntheticEvent<HTMLAudioElement>) => {
      const ended = e.currentTarget;
      if (ended !== getActive()) return;
      const genre = useMusicPlayer.getState().currentGenre;
      if (!genre) return;
      const nextPart = (partIdx.current + 1) % genre.parts.length;
      const vol = useMusicPlayer.getState().volume;
      const inactive = getInactive();

      if (inactive && preloadedFor.current === nextPart && inactive.readyState >= 3) {
        // 프리로드 충분(HAVE_FUTURE_DATA 이상) → 즉시 전환(끊김 없음)
        try { inactive.currentTime = 0; } catch { /* noop */ }
        inactive.volume = vol;
        inactive.play().catch(() => {});
        ended.pause();
        activeIdx.current = activeIdx.current === 0 ? 1 : 0;
        partIdx.current = nextPart;
        preloadedFor.current = null;
      } else {
        // 폴백: 활성 엘리먼트에 다음 파트 로드
        partIdx.current = nextPart;
        const audio = getActive();
        if (!audio) return;
        audio.src = genre.parts[nextPart].url;
        audio.volume = vol;
        const onCp = () => {
          audio.removeEventListener("canplay", onCp);
          if (useMusicPlayer.getState().isPlaying) safePlay(audio);
        };
        audio.addEventListener("canplay", onCp);
        audio.load();
      }
    },
    [getActive, getInactive, safePlay],
  );

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLAudioElement>) => {
      const audio = e.currentTarget;
      if (audio !== getActive()) return;
      const state = useMusicPlayer.getState();
      if (!state.isPlaying) return;
      if (retryCount.current < MAX_RETRIES) {
        retryCount.current += 1;
        const delay = 1000 * Math.pow(2, retryCount.current - 1);
        retryTimer.current = setTimeout(() => {
          if (useMusicPlayer.getState().isPlaying && audio === getActive()) {
            audio.load();
            audio.addEventListener("canplay", function onRetry() {
              audio.removeEventListener("canplay", onRetry);
              if (useMusicPlayer.getState().isPlaying) safePlay(audio);
            });
          }
        }, delay);
      } else {
        retryCount.current = 0;
        state.pause();
      }
    },
    [getActive, safePlay],
  );

  // 버퍼링 감지 — 활성(재생 중) 엘리먼트의 이벤트만 반영.
  // 비활성(프리로드) 엘리먼트의 waiting/stalled가 재생 중 음원을 건드리지 않게 한다.
  useEffect(() => {
    const audios = [aRef.current, bRef.current].filter(Boolean) as HTMLAudioElement[];
    function handleWaiting(e: Event) {
      if (e.target === getActive()) isBuffering.current = true;
    }
    function handlePlaying(e: Event) {
      if (e.target !== getActive()) return;
      isBuffering.current = false;
      retryCount.current = 0;
    }
    audios.forEach((a) => {
      a.addEventListener("waiting", handleWaiting);
      a.addEventListener("playing", handlePlaying);
    });
    return () => {
      audios.forEach((a) => {
        a.removeEventListener("waiting", handleWaiting);
        a.removeEventListener("playing", handlePlaying);
      });
    };
  }, [getActive]);

  // 네트워크 복구 + 모바일 백그라운드 복귀
  //
  // 핵심 원칙: 일시적 버퍼링에는 절대 audio.load()(전체 리셋)를 호출하지 않는다.
  // 브라우저는 데이터가 차면 스스로 재개하므로, 우리가 리로드하면 오히려 끊긴다.
  // 1차로 가벼운 play() 재개만 시도하고, 진짜로 멈춰 있을 때만(8초+ stuck) 하드 복구.
  useEffect(() => {
    // 가벼운 재개 — load() 없이. 재생 중(paused=false)이면 개입하지 않음.
    function gentleResume() {
      const audio = getActive();
      const state = useMusicPlayer.getState();
      if (!audio || !state.isPlaying || !state.currentGenre) return;
      if (!audio.paused) return; // 버퍼링 중이면 브라우저 자동 회복에 맡김
      audio.play().catch(() => hardRecover());
    }
    // 최후수단 — 같은 위치로 reload+seek. stuck(8초+ 진전 없음)에서만.
    function hardRecover() {
      const audio = getActive();
      const state = useMusicPlayer.getState();
      if (!audio || !state.isPlaying || !state.currentGenre) return;
      const savedTime = audio.currentTime;
      retryCount.current = 0;
      isBuffering.current = false;
      audio.load();
      audio.addEventListener("canplay", function onRecover() {
        audio.removeEventListener("canplay", onRecover);
        if (savedTime > 0) {
          try { audio.currentTime = savedTime; } catch { /* noop */ }
        }
        if (useMusicPlayer.getState().isPlaying) safePlay(audio);
      });
    }
    function handleOnline() { gentleResume(); }
    function handleStalled(e: Event) {
      // 활성 엘리먼트가 멈춘 경우만. 비활성(프리로드) stalled는 무시.
      if (e.target !== getActive()) return;
      if (!useMusicPlayer.getState().isPlaying) return;
      isBuffering.current = true;
      if (retryTimer.current) clearTimeout(retryTimer.current);
      // 8초 여유를 준 뒤에도 정말 멈춰 있으면만 복구(즉시 load 금지)
      retryTimer.current = setTimeout(() => {
        const audio = getActive();
        if (!audio || !useMusicPlayer.getState().isPlaying) return;
        if (audio.paused) gentleResume();
        else if (isBuffering.current && audio.readyState < 3) hardRecover();
      }, 8000);
    }
    function handleVisibility() {
      if (document.visibilityState !== "visible") return;
      gentleResume();
    }
    const audios = [aRef.current, bRef.current].filter(Boolean) as HTMLAudioElement[];
    window.addEventListener("online", handleOnline);
    audios.forEach((a) => a.addEventListener("stalled", handleStalled));
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("online", handleOnline);
      audios.forEach((a) => a.removeEventListener("stalled", handleStalled));
      document.removeEventListener("visibilitychange", handleVisibility);
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
        retryTimer.current = null;
      }
    };
  }, [safePlay, getActive]);

  // 현재 곡 (큐포인트 계산 — 장르 전체 타임라인 기준)
  const currentCue = currentGenre ? findCueAt(currentGenre.cues, currentTime) : null;

  // Media Session API
  useEffect(() => {
    if (!currentGenre || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentCue?.title ?? currentGenre.name,
      artist: currentCue?.composer ?? "ReadingTree",
      album: `ReadingTree - ${currentGenre.name}`,
    });
    navigator.mediaSession.setActionHandler("play", () => getMusicController()?.resume());
    navigator.mediaSession.setActionHandler("pause", () => getMusicController()?.pauseAudio());
  }, [currentGenre, currentCue?.title, currentCue?.composer]);

  function handlePlayToggle() {
    const ctrl = getMusicController();
    if (isPlaying) ctrl?.pauseAudio();
    else ctrl?.resume();
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setVolume(parseFloat(e.target.value));
  }

  function handleClose() {
    aRef.current?.pause();
    bRef.current?.pause();
    close();
  }

  const audioEls = (
    <>
      <audio ref={aRef} preload="auto" onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} onError={handleError} />
      <audio ref={bRef} preload="auto" onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} onError={handleError} />
    </>
  );

  if (!isVisible || !currentGenre) {
    return (
      <>
        {audioEls}
        <MusicOnlySheet />
      </>
    );
  }

  // 현재 곡 내 진행률 (비대화형 표시용)
  const songProgress =
    currentCue && currentCue.duration > 0
      ? Math.max(0, Math.min(100, ((currentTime - currentCue.start) / currentCue.duration) * 100))
      : 0;

  return (
    <>
      {audioEls}

      <div
        className={cn(
          "fixed bottom-14 sm:bottom-16 lg:bottom-0 left-0 right-0 lg:left-64",
          "z-[45] border-t",
          "transition-transform duration-300",
          isVisible ? "translate-y-0" : "translate-y-full",
          "bg-background/98 backdrop-blur-md",
        )}
      >
        {/* 현재 곡 진행바 (비대화형) */}
        <div className="h-1 bg-muted">
          <div
            className="h-full rounded-r-full bg-primary transition-[width] duration-1000"
            style={{ width: `${songProgress}%` }}
          />
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2">
          <button
            onClick={openMusicSheet}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
            title="음악 종류 변경"
          >
            <span className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-primary/10 to-violet-500/10 flex items-center justify-center ring-1 ring-primary/10 shadow-sm">
              <span className="text-lg" aria-hidden>{currentGenre.emoji}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium truncate leading-tight">
                {currentCue ? `${currentCue.composer} — ${currentCue.title}` : currentGenre.name}
              </span>
              <span className="block text-[11px] text-muted-foreground truncate mt-0.5 leading-tight">
                {currentGenre.emoji} {currentGenre.name} · 종류 변경
              </span>
            </span>
          </button>

          <div className="flex items-center gap-px shrink-0">
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
    </>
  );
}
