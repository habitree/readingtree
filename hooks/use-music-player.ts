"use client";

/**
 * useMusicPlayer (개별 곡 재생 — 병합 스트림 폐기, 2026-07-24)
 *
 * 채널(음악 3종 + 백색소음 4종)의 곡을 개별 파일로 이중 버퍼 재생하되,
 * 순서는 곡 단위 셔플 큐가 결정한다 — 들을 때마다 다른 순서.
 * 곡 하나가 독립 파일이라 "파일상 다음 곡" 이 없어 겹침이 원천 불가능하다.
 *
 * 컨트롤: 채널 선택 + 재생/정지/종료 + 다음 곡 + 볼륨.
 * 현재 곡 = currentGenre.tracks[queue[queueIndex]] (컴포넌트에서 파생).
 * currentTime 은 "현재 곡 내" 재생 위치(초).
 */

import { create } from "zustand";
import type { MusicGenre } from "@/types/music";

/** Fisher-Yates 셔플 — avoidFirst 가 선두에 오면 임의 위치와 교환(연속 중복 방지) */
function shuffledIndices(n: number, avoidFirst?: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  if (n > 1 && avoidFirst !== undefined && arr[0] === avoidFirst) {
    const k = 1 + Math.floor(Math.random() * (n - 1));
    [arr[0], arr[k]] = [arr[k], arr[0]];
  }
  return arr;
}

interface MusicPlayerState {
  // ── 재생 상태 ──
  isVisible: boolean;
  isPlaying: boolean;
  currentGenre: MusicGenre | null;
  volume: number;
  /** 현재 곡 내 재생 위치(초) */
  currentTime: number;
  /** 현재 곡 길이(초) */
  duration: number;

  // ── 셔플 큐 (곡 인덱스 순서, 소진 임박 시 자동 연장) ──
  queue: number[];
  queueIndex: number;

  // ── 시트 토글 ──
  isMusicSheetOpen: boolean;
  isVolumeOpen: boolean;

  // ── 액션 ──
  selectGenre: (genre: MusicGenre) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  setVolume: (vol: number) => void;
  updateTime: (current: number, dur?: number) => void;
  /** 현재 재생 중인 곡 인덱스 (queue[queueIndex]) */
  currentTrack: () => number;
  /** 다음에 재생할 곡 인덱스 미리보기 (필요 시 큐 연장) */
  peekNext: () => number;
  /** 큐를 한 칸 진행하고 새 곡 인덱스 반환 */
  advance: () => number;

  openMusicSheet: () => void;
  closeMusicSheet: () => void;
  toggleVolume: () => void;

  /** 전체 종료 (audio 정지 + UI 닫기) */
  close: () => void;
}

export const useMusicPlayer = create<MusicPlayerState>((set, get) => ({
  isVisible: false,
  isPlaying: false,
  currentGenre: null,
  volume: 0.35,
  currentTime: 0,
  duration: 0,
  queue: [],
  queueIndex: 0,
  isMusicSheetOpen: false,
  isVolumeOpen: false,

  selectGenre: (genre) =>
    set(() => {
      // 곡 단위 셔플 큐 — 들을 때마다 다른 순서로 재생
      const queue = shuffledIndices(genre.tracks.length);
      const first = genre.tracks[queue[0]];
      return {
        currentGenre: genre,
        isVisible: true,
        isPlaying: true,
        queue,
        queueIndex: 0,
        currentTime: 0,
        duration: first?.duration ?? 0,
      };
    }),

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setVolume: (vol) => set({ volume: Math.max(0, Math.min(1, vol)) }),
  updateTime: (current, dur) =>
    set((s) => ({ currentTime: current, duration: dur ?? s.duration })),

  currentTrack: () => {
    const s = get();
    return s.queue[s.queueIndex] ?? -1;
  },

  peekNext: () => {
    const s = get();
    const n = s.currentGenre?.tracks.length ?? 0;
    if (n === 0) return -1;
    let queue = s.queue;
    if (s.queueIndex + 1 >= queue.length) {
      // 소진 임박 — 직전 곡과 연속 중복을 피해 셔플 블록 연장
      queue = [...queue, ...shuffledIndices(n, queue[queue.length - 1])];
      set({ queue });
    }
    return queue[s.queueIndex + 1];
  },

  advance: () => {
    const next = get().peekNext();
    if (next < 0) return -1;
    set((s) => ({ queueIndex: s.queueIndex + 1 }));
    return next;
  },

  openMusicSheet: () => set({ isMusicSheetOpen: true }),
  closeMusicSheet: () => set({ isMusicSheetOpen: false }),
  toggleVolume: () => set((s) => ({ isVolumeOpen: !s.isVolumeOpen })),

  close: () =>
    set({
      isVisible: false,
      isPlaying: false,
      currentGenre: null,
      currentTime: 0,
      duration: 0,
      queue: [],
      queueIndex: 0,
      isVolumeOpen: false,
    }),
}));
