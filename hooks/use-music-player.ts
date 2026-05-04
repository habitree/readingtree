"use client";

/**
 * useMusicPlayer (단순화 — 2026-05-05 분리 단계 C)
 *
 * 음악 재생만 담당. 기록·세션·타이머 책임 모두 제거 — 완전 분리 (사용자 결정).
 *
 * 폐기된 영역 (이전 코드):
 *   - timerStatus / targetSeconds / remainingSeconds / elapsedSeconds / timerStartedAt / isUnlimited
 *   - startTimer / startUnlimitedTimer / pauseTimer / resumeTimer / tickTimer
 *   - completeTimer / continueReading / stopTimer
 *   - openTimerSheet / closeTimerSheet / closeCompleteDialog
 *   - activeBook / setActiveBook
 * → 모두 사용자 요구로 제거. 기록은 RecordSheet 도메인에서만 처리.
 */

import { create } from "zustand";
import type { MusicTrack } from "@/types/music";

interface MusicPlayerState {
  // ── 음악 상태 (재생만) ──
  isVisible: boolean;
  isPlaying: boolean;
  currentTrack: MusicTrack | null;
  playlist: MusicTrack[];
  currentIndex: number;
  volume: number;
  currentTime: number;
  duration: number;
  selectedPlaylistId: string | null;

  // ── 시트 토글 (음악 시트만) ──
  isMusicSheetOpen: boolean;
  isTrackListOpen: boolean;
  isVolumeOpen: boolean;

  // ── 음악 액션 ──
  loadPlaylist: (tracks: MusicTrack[], playlistId?: string, startIndex?: number) => void;
  selectTrack: (index: number) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seekTo: (time: number) => void;
  setVolume: (vol: number) => void;
  updateTime: (current: number, dur: number) => void;

  // ── UI 시트 ──
  openMusicSheet: () => void;
  closeMusicSheet: () => void;
  openTrackList: () => void;
  closeTrackList: () => void;
  toggleVolume: () => void;

  // ── 전체 종료 (audio 정지 + UI 닫기) ──
  close: () => void;
}

export const useMusicPlayer = create<MusicPlayerState>((set, get) => ({
  // 초기값
  isVisible: false,
  isPlaying: false,
  currentTrack: null,
  playlist: [],
  currentIndex: 0,
  volume: 0.35,
  currentTime: 0,
  duration: 0,
  selectedPlaylistId: null,
  isMusicSheetOpen: false,
  isTrackListOpen: false,
  isVolumeOpen: false,

  loadPlaylist: (tracks, playlistId, startIndex) => {
    const idx = startIndex ?? (tracks.length > 0 ? Math.floor(Math.random() * tracks.length) : 0);
    set({
      playlist: tracks,
      currentIndex: idx,
      currentTrack: tracks[idx] ?? null,
      isVisible: true,
      isPlaying: false,
      currentTime: 0,
      duration: tracks[idx]?.durationSeconds ?? 0,
      selectedPlaylistId: playlistId ?? get().selectedPlaylistId,
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

  openMusicSheet: () => set({ isMusicSheetOpen: true }),
  closeMusicSheet: () => set({ isMusicSheetOpen: false }),
  openTrackList: () => set({ isTrackListOpen: true }),
  closeTrackList: () => set({ isTrackListOpen: false }),
  toggleVolume: () => set((s) => ({ isVolumeOpen: !s.isVolumeOpen })),

  close: () =>
    set({
      isVisible: false,
      isPlaying: false,
      currentTrack: null,
      playlist: [],
      currentIndex: 0,
      currentTime: 0,
      duration: 0,
      isTrackListOpen: false,
      isVolumeOpen: false,
      // selectedPlaylistId는 보존 (다음 재생 시 prefill)
    }),
}));
