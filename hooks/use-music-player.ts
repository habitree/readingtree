"use client";

import { create } from "zustand";
import type { MusicTrack } from "@/types/music";

interface MusicPlayerState {
  /** 미니 플레이어 표시 여부 */
  isVisible: boolean;
  /** 재생 중 여부 */
  isPlaying: boolean;
  /** 현재 트랙 */
  currentTrack: MusicTrack | null;
  /** 플레이리스트 */
  playlist: MusicTrack[];
  /** 현재 트랙 인덱스 */
  currentIndex: number;
  /** 볼륨 (0~1) */
  volume: number;
  /** 현재 재생 시간 (초) */
  currentTime: number;
  /** 전체 길이 (초) */
  duration: number;
  /** 플레이리스트 시트 열림 여부 */
  isPlaylistOpen: boolean;

  /** 플레이리스트 로드 + 플레이어 표시 */
  loadPlaylist: (tracks: MusicTrack[], startIndex?: number) => void;
  /** 특정 인덱스의 트랙으로 전환 */
  selectTrack: (index: number) => void;
  /** 재생 */
  play: () => void;
  /** 일시정지 */
  pause: () => void;
  /** 재생/정지 토글 */
  toggle: () => void;
  /** 다음 곡 */
  next: () => void;
  /** 이전 곡 */
  prev: () => void;
  /** 시킹 */
  seekTo: (time: number) => void;
  /** 볼륨 설정 */
  setVolume: (vol: number) => void;
  /** 시간 업데이트 (audio timeupdate에서 호출) */
  updateTime: (current: number, dur: number) => void;
  /** 플레이리스트 시트 열기 */
  openPlaylist: () => void;
  /** 플레이리스트 시트 닫기 */
  closePlaylist: () => void;
  /** 플레이어 닫기 */
  close: () => void;
}

export const useMusicPlayer = create<MusicPlayerState>((set, get) => ({
  isVisible: false,
  isPlaying: false,
  currentTrack: null,
  playlist: [],
  currentIndex: 0,
  volume: 0.7,
  currentTime: 0,
  duration: 0,
  isPlaylistOpen: false,

  loadPlaylist: (tracks, startIndex = 0) =>
    set({
      playlist: tracks,
      currentIndex: startIndex,
      currentTrack: tracks[startIndex] ?? null,
      isVisible: true,
      isPlaying: false,
      currentTime: 0,
      duration: tracks[startIndex]?.durationSeconds ?? 0,
    }),

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
    const nextIndex = (currentIndex + 1) % playlist.length;
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
    // 3초 이상 재생했으면 곡 처음으로, 아니면 이전 곡
    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }
    const prevIndex =
      (currentIndex - 1 + playlist.length) % playlist.length;
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
  openPlaylist: () => set({ isPlaylistOpen: true }),
  closePlaylist: () => set({ isPlaylistOpen: false }),

  close: () =>
    set({
      isVisible: false,
      isPlaying: false,
      currentTrack: null,
      playlist: [],
      currentIndex: 0,
      currentTime: 0,
      duration: 0,
      isPlaylistOpen: false,
    }),
}));
