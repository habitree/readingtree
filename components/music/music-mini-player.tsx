"use client";

import { useRef, useEffect, useCallback } from "react";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { useRouter } from "next/navigation";
import { getTrackMoodLabel, initMusicData } from "@/lib/music";
import { TimerSheet } from "./playlist-sheet";
import { ReadingCompleteDialog } from "./reading-complete-dialog";
import { TrackListSheet } from "./track-list-sheet";
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Square,
  Volume2,
  VolumeX,
  Music2,
  ListMusic,
  BookOpen,
  Headphones,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Network Information API 타입 (실험적, Chrome/Android 지원) */
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
        <BookOpen className="w-3.5 h-3.5 text-primary" />
      </div>
    </div>
  );
}

/** 헤더 배경 음악 + 타이머 버튼 */
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
        "group relative flex items-center justify-center transition-all duration-300",
        isActive || isPaused
          ? "h-8 sm:h-9 px-3 rounded-full gap-1.5"
          : "w-9 h-9 sm:w-10 sm:h-10 rounded-xl",
        isActive
          ? "bg-gradient-to-r from-amber-500/12 to-yellow-600/12 text-amber-700 dark:text-amber-400 shadow-sm ring-1 ring-amber-500/20"
          : isPaused
            ? "bg-gradient-to-r from-orange-500/12 to-amber-500/12 text-orange-500 shadow-sm ring-1 ring-orange-400/20"
            : "text-muted-foreground hover:bg-amber-500/8 hover:text-amber-700 dark:hover:text-amber-400 hover:shadow-sm"
      )}
      title={isActive ? "독서 일시정지" : isPaused ? "독서 계속하기" : "배경 음악 + 독서 타이머"}
    >
      {isActive ? (
        <>
          {/* 활성 — 음표 메인 + 작은 시계 뱃지 + 시간 */}
          <span className="absolute inset-0 rounded-full animate-ping bg-amber-500/8 pointer-events-none" style={{ animationDuration: "2.5s" }} />
          <span className="relative flex items-center gap-1.5">
            <span className="relative flex items-center justify-center w-5 h-5">
              <Music2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="absolute -top-1 -right-1.5 flex items-center justify-center w-2.5 h-2.5 rounded-full bg-primary/90 ring-1 ring-background">
                <Clock className="w-1.5 h-1.5 text-primary-foreground" />
              </span>
            </span>
            <span className="text-[11px] font-bold tabular-nums tracking-tight">
              {isUnlimited ? formatTime(elapsedSeconds) : formatTime(remainingSeconds)}
            </span>
          </span>
        </>
      ) : isPaused ? (
        <>
          {/* 일시정지 — 음표 + 일시정지 뱃지 + 시간 */}
          <span className="relative flex items-center gap-1.5">
            <span className="relative flex items-center justify-center w-5 h-5">
              <Music2 className="w-4 h-4 text-orange-500 opacity-60" />
              <span className="absolute -top-1 -right-1.5 flex items-center justify-center w-2.5 h-2.5 rounded-full bg-orange-500 ring-1 ring-background">
                <Pause className="w-1.5 h-1.5 text-white" />
              </span>
            </span>
            <span className="text-[11px] font-bold tabular-nums tracking-tight">
              {isUnlimited ? formatTime(elapsedSeconds) : formatTime(remainingSeconds)}
            </span>
          </span>
        </>
      ) : (
        /* idle — 배경 음악 음표 메인 + 작은 시계 뱃지 */
        <span className="relative flex items-center justify-center w-full h-full">
          <Music2 className="w-[18px] h-[18px] sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110 group-hover:text-amber-600 dark:group-hover:text-amber-400" />
          <span className="absolute -top-0.5 -right-0.5 sm:top-0 sm:right-0 flex items-center justify-center w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-background shadow-sm ring-1 ring-border/60">
            <Clock className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-muted-foreground group-hover:text-primary" />
          </span>
        </span>
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
  /** 트랙 변경 중 플래그 — isPlaying effect와 경쟁 방지 */
  const isLoadingTrack = useRef(false);
  /** 에러 재시도 카운터 */
  const retryCount = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const MAX_RETRIES = 3;

  /** 오디오 버퍼링(네트워크 끊김) 감지 플래그 */
  const isBuffering = useRef(false);

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
    activeBook,
  } = useMusicPlayer();

  const router = useRouter();
  const isTimerActive = timerStatus === "running" || timerStatus === "paused";

  // ── Music Supabase 데이터 초기화 ──
  useEffect(() => {
    initMusicData();
  }, []);

  // ── 전역 audio 참조 동기화 ──
  useEffect(() => {
    globalAudioRef = audioRef.current;
    return () => { globalAudioRef = null; };
  }, []);

  // ── 뮤직 플레이어 높이 CSS 변수 동기화 (모바일 하단 패딩 계산용) ──
  useEffect(() => {
    const h = isVisible && currentTrack ? '60px' : '0px';
    document.documentElement.style.setProperty('--music-player-height', h);
    return () => { document.documentElement.style.setProperty('--music-player-height', '0px'); };
  }, [isVisible, currentTrack]);

  // ── 타이머 setInterval (오디오 실제 재생 여부 확인) ──
  useEffect(() => {
    if (timerStatus === "running") {
      timerRef.current = setInterval(() => {
        // 오디오가 버퍼링 중이면 타이머도 일시 중단
        const audio = audioRef.current;
        if (audio && isBuffering.current) return;
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

  // ── 안전한 play 호출 (재시도 포함) ──
  const safePlay = useCallback((audio: HTMLAudioElement) => {
    audio.play().catch((err: DOMException) => {
      // NotAllowedError = autoplay 정책 차단 → 재시도 불필요
      if (err.name === "NotAllowedError") {
        useMusicPlayer.getState().pause();
        return;
      }
      // 네트워크/디코딩 에러 → 재시도
      if (retryCount.current < MAX_RETRIES) {
        retryCount.current += 1;
        const delay = 1000 * Math.pow(2, retryCount.current - 1); // 1s, 2s, 4s
        retryTimer.current = setTimeout(() => {
          const state = useMusicPlayer.getState();
          if (state.isPlaying && audio === audioRef.current) {
            safePlay(audio);
          }
        }, delay);
      } else {
        // 재시도 소진 → 다음 곡으로
        retryCount.current = 0;
        useMusicPlayer.getState().next();
      }
    });
  }, []);

  // ── 재생/정지 동기화 ──
  // handlePlayToggle/handleTimerToggle에서 직접 audio를 제어하므로
  // useEffect에서는 보조적 역할만 (상태와 audio가 불일치할 때 동기화)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // 트랙 로딩 중이면 canplay 이벤트가 처리하므로 skip
    if (isLoadingTrack.current && isPlaying) return;
    // audio 상태와 isPlaying이 이미 일치하면 skip
    if (isPlaying && !audio.paused) return;
    if (!isPlaying && audio.paused) return;
    if (isPlaying) {
      safePlay(audio);
    } else {
      audio.pause();
    }
  }, [isPlaying, safePlay]);

  // ── 트랙 변경 시 src 업데이트 (canplay 대기 후 재생) ──
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    // 이미 동일 src가 설정되어 있으면 skip (handleStart에서 직접 설정한 경우)
    if (audio.src.endsWith(currentTrack.sourceUrl)) return;

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
  }, [currentTrack?.id, safePlay]);

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

  // ── 로딩 실패 시 재시도 or 다음 곡 스킵 ──
  const handleError = useCallback(() => {
    isLoadingTrack.current = false;
    const state = useMusicPlayer.getState();
    if (!state.isPlaying) return;
    // 재시도 가능하면 재시도
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
            if (useMusicPlayer.getState().isPlaying) {
              safePlay(audio);
            }
          });
        }
      }, delay);
    } else {
      retryCount.current = 0;
      state.next();
    }
  }, [safePlay]);

  // ── 오디오 버퍼링 감지 (waiting/playing 이벤트) ──
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    function handleWaiting() {
      // 버퍼 부족으로 재생 멈춤 → 버퍼링 플래그 설정
      isBuffering.current = true;
    }

    function handlePlaying() {
      // 다시 재생 시작 → 버퍼링 해제
      isBuffering.current = false;
      retryCount.current = 0;
    }

    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);

    return () => {
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
    };
  }, []);

  // ── 네트워크 복구 + 전환 감지 ──
  useEffect(() => {
    /** 오디오 소스를 현재 위치에서 다시 로드 */
    function recoverPlayback() {
      const audio = audioRef.current;
      const state = useMusicPlayer.getState();
      if (!audio || !state.isPlaying || !state.currentTrack) return;
      // audio가 멈춰있거나 버퍼링 중이면 복구 시도
      if (audio.paused || isBuffering.current) {
        const savedTime = audio.currentTime;
        retryCount.current = 0;
        isBuffering.current = false;
        audio.load();
        audio.addEventListener("canplay", function onRecover() {
          audio.removeEventListener("canplay", onRecover);
          // 이전 재생 위치로 복원
          if (savedTime > 0) audio.currentTime = savedTime;
          if (useMusicPlayer.getState().isPlaying) {
            safePlay(audio);
          }
        });
      }
    }

    function handleOnline() {
      recoverPlayback();
    }

    function handleStalled() {
      // stalled 이벤트: 데이터 다운로드가 멈춤
      const audio = audioRef.current;
      const state = useMusicPlayer.getState();
      if (!audio || !state.isPlaying) return;
      isBuffering.current = true;
      // 짧은 지연 후 복구 시도
      retryTimer.current = setTimeout(() => {
        recoverPlayback();
      }, 2000);
    }

    // Network Information API — WiFi ↔ 모바일 데이터 전환 감지
    function handleConnectionChange() {
      const state = useMusicPlayer.getState();
      if (!state.isPlaying) return;
      // 네트워크 타입 변경 시 약간의 지연 후 복구 (새 연결 안정화 대기)
      retryTimer.current = setTimeout(() => {
        recoverPlayback();
      }, 1000);
    }

    const audio = audioRef.current;
    window.addEventListener("online", handleOnline);
    audio?.addEventListener("stalled", handleStalled);

    // navigator.connection은 실험적 API (Chrome/Android 지원)
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

  // ── 모바일 백그라운드 복귀 시 재생 복구 ──
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      const audio = audioRef.current;
      const state = useMusicPlayer.getState();
      if (!audio || !state.isPlaying || !state.currentTrack) return;
      // 백그라운드에서 돌아왔는데 audio가 멈춰있으면 복구
      if (audio.paused || isBuffering.current) {
        const savedTime = audio.currentTime;
        retryCount.current = 0;
        isBuffering.current = false;
        // 단순 play 시도 → 실패 시 소스 리로드
        audio.play().catch(() => {
          audio.load();
          audio.addEventListener("canplay", function onRecover() {
            audio.removeEventListener("canplay", onRecover);
            if (savedTime > 0) audio.currentTime = savedTime;
            if (useMusicPlayer.getState().isPlaying) {
              safePlay(audio);
            }
          });
        });
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [safePlay]);

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
      artist: currentTrack.composer,
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

  // audio 엘리먼트는 항상 렌더링 (autoplay 정책 우회를 위해)
  // isVisible=false일 때는 UI만 숨기고 audio는 유지
  if (!isVisible || !currentTrack) {
    return (
      <>
        <audio ref={audioRef} preload="metadata" onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} onError={handleError} />
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
          {/* 좌측: 타이머 or 음악 아이콘 */}
          {isTimerActive ? (
            isUnlimited ? (
              <div className="relative shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-emerald-500/15 flex items-center justify-center ring-1 ring-primary/10 shadow-sm">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 animate-pulse ring-2 ring-background" />
              </div>
            ) : (
              <CircleTimer remaining={remainingSeconds} total={targetSeconds} size={40} stroke={3} />
            )
          ) : (
            <button
              onClick={openTrackList}
              className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-primary/10 to-violet-500/10 flex items-center justify-center ring-1 ring-primary/10 shadow-sm hover:shadow-md transition-shadow"
              title="재생 목록"
            >
              <Headphones className="w-4.5 h-4.5 text-primary" />
            </button>
          )}

          {/* 곡 정보 (탭하면 트랙리스트) */}
          <button onClick={openTrackList} className="min-w-0 flex-1 text-left">
            {isTimerActive && activeBook && (
              <p
                className="text-[10px] text-primary/70 truncate leading-tight mb-0.5 hover:underline cursor-pointer"
                onClick={(e) => { e.stopPropagation(); router.push(`/books/${activeBook.userBookId}`); }}
              >
                📖 {activeBook.title}
              </p>
            )}
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
                "w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 shadow-sm",
                isTimerActive && timerStatus === "paused"
                  ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-orange-500/25"
                  : "bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground shadow-primary/25",
                "hover:scale-105 active:scale-95"
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
