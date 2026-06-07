"use client";

/**
 * useMusicPlayer (병합 + 파트 분할 재구성 — 2026-06-08)
 *
 * 장르(클래식/재즈)별로 분할된 파트를 이중 버퍼로 이어 붙여 단일 음원처럼 재생한다.
 * 곡/플레이리스트/인덱스/스킵 개념 제거 — 장르 선택 + 재생/정지/종료 + 볼륨만.
 *
 * currentTime 은 "장르 전체 타임라인" 기준(초). 현재 곡 제목은
 * currentTime + currentGenre.cues 로 컴포넌트에서 계산한다.
 */

import { create } from "zustand";
import type { MusicGenre } from "@/types/music";

interface MusicPlayerState {
  // ── 재생 상태 ──
  isVisible: boolean;
  isPlaying: boolean;
  currentGenre: MusicGenre | null;
  volume: number;
  /** 장르 전체 타임라인 기준 현재 재생 위치(초) */
  currentTime: number;
  /** 장르 전체 길이(초) */
  duration: number;
  /** 장르 선택 시 정해지는 랜덤 시작 위치(초) — 컴포넌트가 적용 */
  startAt: number;
  /**
   * 장르 선택 시 증가하는 토큰. 컴포넌트는 변경을 감지해
   * 파트 로드 + 랜덤 시작 위치 적용을 1회 수행한다.
   */
  loadToken: number;

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

  openMusicSheet: () => void;
  closeMusicSheet: () => void;
  toggleVolume: () => void;

  /** 전체 종료 (audio 정지 + UI 닫기) */
  close: () => void;
}

export const useMusicPlayer = create<MusicPlayerState>((set) => ({
  isVisible: false,
  isPlaying: false,
  currentGenre: null,
  volume: 0.35,
  currentTime: 0,
  duration: 0,
  startAt: 0,
  loadToken: 0,
  isMusicSheetOpen: false,
  isVolumeOpen: false,

  selectGenre: (genre) =>
    set((s) => ({
      currentGenre: genre,
      isVisible: true,
      isPlaying: true,
      // 끝부분 8% 여유 두고 랜덤 시작 → 랜덤 재생처럼 느껴지게
      startAt: Math.random() * genre.durationSeconds * 0.92,
      currentTime: 0,
      duration: genre.durationSeconds,
      loadToken: s.loadToken + 1,
    })),

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setVolume: (vol) => set({ volume: Math.max(0, Math.min(1, vol)) }),
  updateTime: (current, dur) =>
    set((s) => ({ currentTime: current, duration: dur ?? s.duration })),

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
      isVolumeOpen: false,
    }),
}));
