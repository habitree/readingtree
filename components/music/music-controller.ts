"use client";

/**
 * 음악 컨트롤러 레지스트리 (경량 모듈).
 *
 * MusicMiniPlayer(무거운 오디오 엔진 청크)가 마운트되면 컨트롤러를 등록하고,
 * 헤더 토글 버튼·음악 시트 등 가벼운 소비자는 본 모듈만 import 한다.
 * 이렇게 분리해야 헤더가 music-mini-player(오디오 로직 + 채널 데이터) 전체를
 * 메인 번들로 끌어오지 않는다.
 */

import type { MusicGenre } from "@/types/music";

/** 사용자 클릭 컨텍스트에서 재생을 시작/제어하기 위한 컨트롤러 */
export interface MusicController {
  startGenre: (genre: MusicGenre) => void;
  resume: () => void;
  pauseAudio: () => void;
}

let controller: MusicController | null = null;

export function getMusicController(): MusicController | null {
  return controller;
}

export function setMusicController(next: MusicController | null): void {
  controller = next;
}
