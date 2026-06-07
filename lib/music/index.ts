/**
 * 음악 데이터 진입점 (병합 + 파트 분할 재구성 — 2026-06-08)
 *
 * 정적 2장르(클래식/재즈) 데이터만 노출. DB/캐싱/플레이리스트 로직 제거.
 * 병합 데이터는 scripts/build-combined-music.ts 가 생성하는 ./genres 에 존재.
 */

import type { MusicCue, MusicGenre, MusicPart } from "@/types/music";
import { MUSIC_GENRES } from "./genres";

export { MUSIC_GENRES };
export type { MusicCue, MusicGenre, MusicPart };

/** ID로 장르 조회 */
export function getGenreById(id: string): MusicGenre | undefined {
  return MUSIC_GENRES.find((g) => g.id === id);
}

/**
 * 장르 전체 재생 위치(초)에 해당하는 곡(큐) 반환.
 * start <= time < start+duration 을 이진 탐색.
 */
export function findCueAt(cues: MusicCue[], time: number): MusicCue | null {
  return findByRange(cues, time);
}

/**
 * 장르 전체 재생 위치(초)에 해당하는 파트 인덱스 반환.
 * 범위 밖이면 가장 가까운 파트로 클램프.
 */
export function findPartIndexAt(parts: MusicPart[], time: number): number {
  if (parts.length === 0) return -1;
  let lo = 0;
  let hi = parts.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const p = parts[mid];
    if (time < p.start) hi = mid - 1;
    else if (time >= p.start + p.duration) lo = mid + 1;
    else return mid;
  }
  return Math.min(parts.length - 1, Math.max(0, lo - 1));
}

function findByRange<T extends { start: number; duration: number }>(
  items: T[],
  time: number,
): T | null {
  if (items.length === 0) return null;
  let lo = 0;
  let hi = items.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const c = items[mid];
    if (time < c.start) hi = mid - 1;
    else if (time >= c.start + c.duration) lo = mid + 1;
    else return c;
  }
  return items[Math.min(items.length - 1, Math.max(0, lo - 1))] ?? null;
}
