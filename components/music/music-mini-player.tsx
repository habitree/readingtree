"use client";

/**
 * MusicMiniPlayer (개별 곡 재생 — 병합 스트림 폐기, 2026-07-24)
 *
 * 채널(음악 3종 + 백색소음 4종)의 곡을 두 개의 audio 엘리먼트로 이중 버퍼링하되,
 * 순서는 스토어의 곡 단위 셔플 큐가 결정한다. 각 곡은 독립 파일이므로 재생 위치 seek 이
 * 없고, "파일상 다음 곡" 이라는 개념 자체가 없어 곡 겹침이 원천 불가능하다.
 * 백색소음은 채널당 1곡 — 같은 큐 메커니즘으로 자기 자신을 프리로드해 반복 재생한다.
 *
 * 전환: 곡 끝 ~15s 전에 다음 셔플 곡을 비활성 엘리먼트에 프리로드 → 곡이 끝나면(ended)
 *       비활성으로 즉시 스왑(신곡 페이드인). 구곡은 이미 끝나 소리가 없으므로 겹치지 않는다.
 *       스킵/다음곡 버튼은 구곡을 짧게 페이드아웃(딥)한 뒤 신곡을 올려 마찬가지로 겹침이 없다.
 *
 * 컨트롤: 재생/일시정지 · 다음 곡 · 볼륨 · 종료.
 * audio 안정화 로직(safePlay·재시도·네트워크·visibility 복구·fade-in·Media Session) 보존.
 */

import { useRef, useEffect, useCallback } from "react";
import { useMusicPlayer } from "@/hooks/use-music-player";
import type { MusicGenre } from "@/types/music";
import { getMusicController, setMusicController } from "./music-controller";
import { MusicOnlySheet } from "./music-only-sheet";
import { Pause, Play, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** 미니 플레이어 (음악만) */
export function MusicMiniPlayer() {
  const aRef = useRef<HTMLAudioElement>(null);
  const bRef = useRef<HTMLAudioElement>(null);
  const activeIdx = useRef<0 | 1>(0);
  /** 현재 재생 중인 곡(트랙) 인덱스 */
  const currentTrackIdx = useRef(0);
  /** 비활성 엘리먼트에 프리로드된 다음 곡 정보 */
  const preload = useRef<{ trackIdx: number; ready: boolean } | null>(null);
  /** 곡 전환 진행 중 — 중복 전환(ended/skip 경합) 방지 */
  const isTransitioning = useRef(false);
  const retryCount = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isBuffering = useRef(false);
  const fadeTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const FADE_IN_MS = 500; // 채널 시작 페이드인
  const DIP_OUT_MS = 260; // 스킵 시 구곡 페이드아웃
  const XFADE_IN_MS = 400; // 신곡 페이드인
  const PRELOAD_LEAD_S = 15; // 곡 끝 N초 전 다음 곡 프리로드
  const MAX_RETRIES = 3;

  const {
    isVisible,
    isPlaying,
    currentGenre,
    currentTime,
    volume,
    isVolumeOpen,
    queue,
    queueIndex,
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

  /** 부드러운 볼륨 램프(지퍼노이즈 억제 — 촘촘한 스텝). from→target 을 ms 동안. */
  const rampVolume = useCallback(
    (audio: HTMLAudioElement, from: number, to: number, ms: number, onDone?: () => void) => {
      clearFade();
      const STEPS = Math.max(24, Math.round(ms / 12));
      const dt = ms / STEPS;
      let step = 0;
      audio.volume = Math.max(0, Math.min(1, from));
      fadeTimer.current = setInterval(() => {
        step++;
        const t = step / STEPS;
        audio.volume = Math.max(0, Math.min(1, from + (to - from) * t));
        if (step >= STEPS) {
          audio.volume = Math.max(0, Math.min(1, to));
          clearFade();
          onDone?.();
        }
      }, dt);
    },
    [clearFade],
  );

  const startFadeIn = useCallback(
    (audio: HTMLAudioElement, ms: number = FADE_IN_MS) => {
      const target = useMusicPlayer.getState().volume;
      rampVolume(audio, 0, target, ms);
    },
    [rampVolume],
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

  /** 활성 엘리먼트에 곡을 로드해 처음부터 재생 (seek 없음). */
  const beginTrack = useCallback(
    (genre: MusicGenre, trackIdx: number, fade: boolean) => {
      const audio = getActive();
      const track = genre.tracks[trackIdx];
      if (!audio || !track) return;
      clearFade();
      const inactive = getInactive();
      inactive?.pause();
      preload.current = null;
      isTransitioning.current = false;
      retryCount.current = 0;
      currentTrackIdx.current = trackIdx;

      audio.loop = false;
      audio.volume = 0;
      audio.src = track.url;
      updateTime(0, track.duration);

      const onCanPlay = () => {
        audio.removeEventListener("canplay", onCanPlay);
        if (!useMusicPlayer.getState().isPlaying) return;
        if (audio !== getActive()) return;
        if (fade) startFadeIn(audio);
        else audio.volume = useMusicPlayer.getState().volume;
        safePlay(audio);
      };
      audio.addEventListener("canplay", onCanPlay);
      audio.load();
    },
    [getActive, getInactive, clearFade, startFadeIn, safePlay, updateTime],
  );

  // 컨트롤러 등록 (사용자 제스처용)
  useEffect(() => {
    setMusicController({
      startGenre: (genre) => {
        useMusicPlayer.getState().selectGenre(genre);
        const s = useMusicPlayer.getState();
        beginTrack(genre, s.queue[s.queueIndex] ?? 0, true);
      },
      resume: () => {
        const audio = getActive();
        const genre = useMusicPlayer.getState().currentGenre;
        if (!audio || !genre) return;
        if (!audio.src) {
          const s = useMusicPlayer.getState();
          beginTrack(genre, s.queue[s.queueIndex] ?? 0, true);
          return;
        }
        audio.play().then(() => useMusicPlayer.getState().play()).catch(() => {});
      },
      pauseAudio: () => {
        getActive()?.pause();
        useMusicPlayer.getState().pause();
      },
    });
    return () => {
      setMusicController(null);
    };
  }, [beginTrack, getActive]);

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

  /**
   * 곡 끝 근처에서 다음 셔플 곡을 비활성 엘리먼트에 프리로드(이중 버퍼).
   * 1곡 채널(백색소음)도 같은 경로로 자기 자신을 프리로드해 경계 없이 반복된다.
   */
  const maybePreloadNext = useCallback(() => {
    const state = useMusicPlayer.getState();
    const genre = state.currentGenre;
    if (!genre || genre.tracks.length === 0) return;
    const nextIdx = state.peekNext();
    if (nextIdx < 0 || preload.current?.trackIdx === nextIdx) return;
    const inactive = getInactive();
    const nextTrack = genre.tracks[nextIdx];
    if (!inactive || !nextTrack) return;

    const target = { trackIdx: nextIdx, ready: false };
    preload.current = target;
    inactive.src = nextTrack.url;
    inactive.load();

    const markReady = () => {
      if (inactive.readyState < 3) return;
      inactive.removeEventListener("canplay", markReady);
      inactive.removeEventListener("canplaythrough", markReady);
      if (preload.current === target) target.ready = true;
    };
    inactive.addEventListener("canplay", markReady);
    inactive.addEventListener("canplaythrough", markReady);
    markReady();
  }, [getInactive]);

  /**
   * 다음 곡으로 전환. fromPlaying=true(스킵)면 구곡을 짧게 페이드아웃(딥)한 뒤 신곡 페이드인,
   * false(ended)면 구곡은 이미 정지 상태이므로 신곡 페이드인만. 두 곡이 동시에 들리지 않는다.
   */
  const goToTrack = useCallback(
    (nextIdx: number, fromPlaying: boolean) => {
      const genre = useMusicPlayer.getState().currentGenre;
      const nextTrack = genre?.tracks[nextIdx];
      if (!genre || !nextTrack) return;
      const active = getActive();
      const inactive = getInactive();
      isTransitioning.current = true;
      retryCount.current = 0;
      isBuffering.current = false;

      const preloaded =
        inactive != null &&
        preload.current?.trackIdx === nextIdx &&
        preload.current?.ready === true &&
        inactive.readyState >= 3;

      const startNew = (el: HTMLAudioElement, becomeActive: boolean) => {
        currentTrackIdx.current = nextIdx;
        preload.current = null;
        updateTime(0, nextTrack.duration);
        el.currentTime = 0;
        el.volume = 0;
        const target = useMusicPlayer.getState().volume;
        el.play()
          .then(() => rampVolume(el, 0, target, XFADE_IN_MS))
          .catch(() => {});
        if (becomeActive) activeIdx.current = activeIdx.current === 0 ? 1 : 0;
        isTransitioning.current = false;
        if (!useMusicPlayer.getState().isPlaying) el.pause();
      };

      const dipThenStart = (el: HTMLAudioElement, becomeActive: boolean) => {
        if (fromPlaying && active && !active.paused) {
          rampVolume(active, active.volume, 0, DIP_OUT_MS, () => {
            active.pause();
            startNew(el, becomeActive);
          });
        } else {
          active?.pause();
          startNew(el, becomeActive);
        }
      };

      if (preloaded && inactive) {
        dipThenStart(inactive, true);
      } else {
        // 프리로드 미완 — 활성 엘리먼트에 직접 로드(짧은 로딩 허용).
        if (fromPlaying && active && !active.paused) {
          rampVolume(active, active.volume, 0, DIP_OUT_MS, () => {
            beginTrack(genre, nextIdx, true);
          });
        } else {
          beginTrack(genre, nextIdx, true);
        }
      }
    },
    [getActive, getInactive, rampVolume, beginTrack, updateTime],
  );

  /** 다음 셔플 곡으로 즉시 전환 — 스킵 버튼 / Media Session. */
  const skipToNext = useCallback(() => {
    const nextIdx = useMusicPlayer.getState().advance();
    if (nextIdx < 0) return;
    goToTrack(nextIdx, true);
  }, [goToTrack]);

  const handleTimeUpdate = useCallback(
    (e: React.SyntheticEvent<HTMLAudioElement>) => {
      const audio = e.currentTarget;
      if (audio !== getActive() || isTransitioning.current) return;

      // 이중 재생 방지 레퍼리 — 전환 중이 아니면 비활성은 반드시 정지 상태여야 한다.
      const idleEl = getInactive();
      if (idleEl && !idleEl.paused) {
        idleEl.pause();
        idleEl.volume = 0;
      }

      const genre = useMusicPlayer.getState().currentGenre;
      if (!genre) return;
      updateTime(audio.currentTime, genre.tracks[currentTrackIdx.current]?.duration);

      const remaining = (audio.duration || 0) - audio.currentTime;
      if (Number.isFinite(remaining) && remaining < PRELOAD_LEAD_S) maybePreloadNext();
    },
    [getActive, getInactive, updateTime, maybePreloadNext],
  );

  // 곡 끝 도달 → 다음 셔플 곡으로 전환
  const handleEnded = useCallback(
    (e: React.SyntheticEvent<HTMLAudioElement>) => {
      const el = e.currentTarget;
      if (isTransitioning.current) return;
      if (el !== getActive()) return;
      const nextIdx = useMusicPlayer.getState().advance();
      if (nextIdx < 0) return;
      goToTrack(nextIdx, false); // 구곡은 이미 ended → 신곡 페이드인만
    },
    [getActive, goToTrack],
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
              if (audio !== getActive()) return;
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
  // 브라우저는 데이터가 차면 스스로 재개하므로, 1차로 가벼운 play() 재개만 시도하고
  // 진짜로 멈춰 있을 때만(8초+ stuck) 하드 복구한다.
  useEffect(() => {
    function gentleResume() {
      const audio = getActive();
      const state = useMusicPlayer.getState();
      if (!audio || !state.isPlaying || !state.currentGenre) return;
      if (isTransitioning.current) return;
      if (!audio.paused) return; // 버퍼링 중이면 브라우저 자동 회복에 맡김
      audio.play().catch(() => hardRecover());
    }
    function hardRecover() {
      const audio = getActive();
      const state = useMusicPlayer.getState();
      if (!audio || !state.isPlaying || !state.currentGenre) return;
      if (isTransitioning.current) return;
      const savedTime = audio.currentTime;
      retryCount.current = 0;
      isBuffering.current = false;
      audio.load();
      audio.addEventListener("canplay", function onRecover() {
        audio.removeEventListener("canplay", onRecover);
        if (audio !== getActive() || isTransitioning.current) return;
        if (savedTime > 0) {
          try { audio.currentTime = savedTime; } catch { /* noop */ }
        }
        if (useMusicPlayer.getState().isPlaying) safePlay(audio);
      });
    }
    function handleOnline() { gentleResume(); }
    function handleStalled(e: Event) {
      if (e.target !== getActive()) return;
      if (!useMusicPlayer.getState().isPlaying) return;
      isBuffering.current = true;
      if (retryTimer.current) clearTimeout(retryTimer.current);
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

  // 현재 곡 (셔플 큐 기준)
  const currentTrackIndex = queue[queueIndex] ?? -1;
  const currentTrack = currentGenre?.tracks[currentTrackIndex] ?? null;

  // Media Session API
  useEffect(() => {
    if (!currentGenre || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack?.title ?? currentGenre.name,
      artist: currentTrack?.composer ?? "ReadingTree",
      album: `ReadingTree - ${currentGenre.name}`,
    });
    navigator.mediaSession.setActionHandler("play", () => getMusicController()?.resume());
    navigator.mediaSession.setActionHandler("pause", () => getMusicController()?.pauseAudio());
    navigator.mediaSession.setActionHandler("nexttrack", () => skipToNext());
  }, [currentGenre, currentTrack?.title, currentTrack?.composer, skipToNext]);

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
    currentTrack && currentTrack.duration > 0
      ? Math.max(0, Math.min(100, (currentTime / currentTrack.duration) * 100))
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
                {currentTrack ? `${currentTrack.composer} — ${currentTrack.title}` : currentGenre.name}
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
              onClick={() => skipToNext()}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              title="다음 곡"
              aria-label="다음 곡"
            >
              <SkipForward className="w-3.5 h-3.5 text-muted-foreground" />
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
