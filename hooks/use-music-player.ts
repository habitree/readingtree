"use client";

import { create } from "zustand";
import type { MusicTrack } from "@/types/music";
import { getDefaultPlaylistTracks, getPlaylistTracks } from "@/lib/music";

export type TimerStatus = "idle" | "running" | "paused" | "completed";

export interface ActiveBook {
  userBookId: string;
  bookId: string;
  title: string;
  coverUrl: string | null;
}

interface MusicPlayerState {
  // ── 음악 상태 ──
  isVisible: boolean;
  isPlaying: boolean;
  currentTrack: MusicTrack | null;
  playlist: MusicTrack[];
  currentIndex: number;
  volume: number;
  currentTime: number;
  duration: number;

  // ── 타이머 상태 ──
  timerStatus: TimerStatus;
  targetSeconds: number;
  remainingSeconds: number;
  elapsedSeconds: number;
  timerStartedAt: string | null;
  isUnlimited: boolean;
  isTimerSheetOpen: boolean;
  isCompleteDialogOpen: boolean;
  isTrackListOpen: boolean;
  isVolumeOpen: boolean;

  // ── 독서 연결 ──
  activeBook: ActiveBook | null;

  // ── 음악 액션 ──
  loadPlaylist: (tracks: MusicTrack[], startIndex?: number) => void;
  selectTrack: (index: number) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seekTo: (time: number) => void;
  setVolume: (vol: number) => void;
  updateTime: (current: number, dur: number) => void;

  // ── 타이머 액션 ──
  selectedPlaylistId: string | null;
  startTimer: (seconds: number, playlistId?: string) => void;
  startUnlimitedTimer: (playlistId?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  tickTimer: () => void;
  completeTimer: () => void;
  continueReading: (seconds: number) => void;
  stopTimer: () => void;
  openTimerSheet: () => void;
  closeTimerSheet: () => void;
  closeCompleteDialog: () => void;
  openTrackList: () => void;
  closeTrackList: () => void;
  toggleVolume: () => void;

  // ── 독서 연결 액션 ──
  setActiveBook: (book: ActiveBook | null) => void;

  // ── 공통 ──
  close: () => void;
}

const INITIAL_TIMER = {
  timerStatus: "idle" as TimerStatus,
  targetSeconds: 0,
  remainingSeconds: 0,
  timerStartedAt: null as string | null,
  isUnlimited: false,
  isTrackListOpen: false,
  isVolumeOpen: false,
  elapsedSeconds: 0,
  isTimerSheetOpen: false,
  isCompleteDialogOpen: false,
  activeBook: null as ActiveBook | null,
};

export const useMusicPlayer = create<MusicPlayerState>((set, get) => ({
  // ── 초기값 ──
  isVisible: false,
  isPlaying: false,
  currentTrack: null,
  playlist: [],
  currentIndex: 0,
  volume: 0.35,
  currentTime: 0,
  duration: 0,
  selectedPlaylistId: null,
  ...INITIAL_TIMER,

  // ── 음악 액션 ──
  loadPlaylist: (tracks, startIndex) => {
    // 기본 랜덤 재생: startIndex 미지정 시 랜덤 트랙부터 시작
    const idx = startIndex ?? (tracks.length > 0 ? Math.floor(Math.random() * tracks.length) : 0);
    set({
      playlist: tracks,
      currentIndex: idx,
      currentTrack: tracks[idx] ?? null,
      isVisible: true,
      isPlaying: false,
      currentTime: 0,
      duration: tracks[idx]?.durationSeconds ?? 0,
    });
  },

  selectTrack: (index) => {
    const { playlist } = get();
    const track = playlist[index];
    if (!track) return;
    set({
      currentIndex: index,
      currentTrack: track,
      currentTime: 0,
      duration: track.durationSeconds,
      isPlaying: true,
    });
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),

  next: () => {
    const { playlist, currentIndex } = get();
    if (playlist.length === 0) return;
    // 랜덤 재생: 현재 트랙을 제외한 랜덤 인덱스 선택
    let nextIndex: number;
    if (playlist.length === 1) {
      nextIndex = 0;
    } else {
      do {
        nextIndex = Math.floor(Math.random() * playlist.length);
      } while (nextIndex === currentIndex);
    }
    const track = playlist[nextIndex];
    if (!track) return;
    set({
      currentIndex: nextIndex,
      currentTrack: track,
      currentTime: 0,
      duration: track.durationSeconds,
      isPlaying: true,
    });
  },

  prev: () => {
    const { playlist, currentIndex, currentTime } = get();
    if (playlist.length === 0) return;
    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    const track = playlist[prevIndex];
    if (!track) return;
    set({
      currentIndex: prevIndex,
      currentTrack: track,
      currentTime: 0,
      duration: track.durationSeconds,
      isPlaying: true,
    });
  },

  seekTo: (time) => set({ currentTime: time }),
  setVolume: (vol) => set({ volume: Math.max(0, Math.min(1, vol)) }),
  updateTime: (current, dur) => set({ currentTime: current, duration: dur }),

  // ── 타이머 액션 ──
  startTimer: (seconds, playlistId) => {
    const tracks = playlistId
      ? getPlaylistTracks(playlistId)
      : getDefaultPlaylistTracks();
    if (tracks.length === 0) return;
    const randomIdx = Math.floor(Math.random() * tracks.length);
    set({
      playlist: tracks,
      currentIndex: randomIdx,
      currentTrack: tracks[randomIdx] ?? null,
      isVisible: true,
      isPlaying: true,
      currentTime: 0,
      duration: tracks[0]?.durationSeconds ?? 0,
      selectedPlaylistId: playlistId ?? "comfortable",
      timerStatus: "running",
      targetSeconds: seconds,
      remainingSeconds: seconds,
      elapsedSeconds: 0,
      timerStartedAt: new Date().toISOString(),
      isTimerSheetOpen: false,
      isCompleteDialogOpen: false,
    });
  },

  startUnlimitedTimer: (playlistId) => {
    const tracks = playlistId
      ? getPlaylistTracks(playlistId)
      : getDefaultPlaylistTracks();
    if (tracks.length === 0) return;
    const randomIdx = Math.floor(Math.random() * tracks.length);
    set({
      playlist: tracks,
      currentIndex: randomIdx,
      currentTrack: tracks[randomIdx] ?? null,
      isVisible: true,
      isPlaying: true,
      currentTime: 0,
      duration: tracks[0]?.durationSeconds ?? 0,
      selectedPlaylistId: playlistId ?? "comfortable",
      timerStatus: "running",
      targetSeconds: 0,
      remainingSeconds: 0,
      elapsedSeconds: 0,
      isUnlimited: true,
      timerStartedAt: new Date().toISOString(),
      isTimerSheetOpen: false,
      isCompleteDialogOpen: false,
    });
  },

  pauseTimer: () =>
    set({ timerStatus: "paused", isPlaying: false }),

  resumeTimer: () =>
    set({ timerStatus: "running", isPlaying: true }),

  tickTimer: () => {
    const { remainingSeconds, timerStatus, isUnlimited } = get();
    if (timerStatus !== "running") return;
    if (!isUnlimited && remainingSeconds <= 1) {
      get().completeTimer();
      return;
    }
    set((s) => ({
      remainingSeconds: isUnlimited ? s.remainingSeconds : s.remainingSeconds - 1,
      elapsedSeconds: s.elapsedSeconds + 1,
    }));
  },

  completeTimer: () =>
    set({
      timerStatus: "completed",
      remainingSeconds: 0,
      isPlaying: false,
      isCompleteDialogOpen: true,
    }),

  continueReading: (seconds) => {
    const unlimited = seconds === Infinity;
    set({
      timerStatus: "running",
      targetSeconds: unlimited ? 0 : seconds,
      remainingSeconds: unlimited ? 0 : seconds,
      isUnlimited: unlimited,
      isPlaying: true,
      isCompleteDialogOpen: false,
      elapsedSeconds: 0,
      timerStartedAt: new Date().toISOString(),
    });
  },

  stopTimer: () => {
    const { elapsedSeconds } = get();
    // 경과 시간이 있으면 완료 팝업 표시
    if (elapsedSeconds > 0) {
      set({
        timerStatus: "completed",
        remainingSeconds: 0,
        isPlaying: false,
        isCompleteDialogOpen: true,
      });
    } else {
      set({ ...INITIAL_TIMER, isPlaying: false });
    }
  },

  openTimerSheet: () => set({ isTimerSheetOpen: true }),
  closeTimerSheet: () => set({ isTimerSheetOpen: false }),
  closeCompleteDialog: () => set({ isCompleteDialogOpen: false }),
  openTrackList: () => set({ isTrackListOpen: true }),
  closeTrackList: () => set({ isTrackListOpen: false }),
  toggleVolume: () => set((s) => ({ isVolumeOpen: !s.isVolumeOpen })),

  // ── 독서 연결 ──
  setActiveBook: (book) => set({ activeBook: book }),

  // ── 전체 종료 ──
  close: () =>
    set({
      isVisible: false,
      isPlaying: false,
      currentTrack: null,
      playlist: [],
      currentIndex: 0,
      currentTime: 0,
      duration: 0,
      ...INITIAL_TIMER,
    }),
}));
