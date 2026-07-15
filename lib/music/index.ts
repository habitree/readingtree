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

/** 타임라인 위의 구간(파트·큐 공통) */
interface Ranged {
  start: number;
  duration: number;
}

/**
 * 구간의 종료 경계.
 *
 * 파트·큐는 하나의 연속 타임라인을 나눈 것이므로 "다음 구간의 start" 가 정확한 경계다.
 * genres.ts 는 start 와 duration 을 각각 ms 로 반올림해 생성하므로 start+duration 은
 * 다음 구간의 start 와 ±0.001s 어긋나고(파트 누적 오차는 ~1e-12), 이를 경계로 쓰면
 * 경계에 정확히 걸친 곡이 앞 구간으로 잘못 매칭된다. 실제로 103곡 중 15곡이 앞 곡으로,
 * 2곡이 앞 파트(=파일 끝)로 매칭되어 재생이 끊기던 원인이었다.
 * 마지막 구간만 start+duration 을 쓴다.
 */
function rangeEndAt(items: Ranged[], index: number): number {
  const next = items[index + 1];
  return next ? next.start : items[index].start + items[index].duration;
}

/**
 * 타임라인 위치(초)에 해당하는 구간 인덱스 이진 탐색.
 * 범위 밖이면 가장 가까운 구간으로 클램프.
 */
function findIndexAt(items: Ranged[], time: number): number {
  if (items.length === 0) return -1;
  let lo = 0;
  let hi = items.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (time < items[mid].start) hi = mid - 1;
    else if (time >= rangeEndAt(items, mid)) lo = mid + 1;
    else return mid;
  }
  return Math.min(items.length - 1, Math.max(0, lo - 1));
}

/** 장르 전체 재생 위치(초)에 해당하는 곡(큐) 반환. */
export function findCueAt(cues: MusicCue[], time: number): MusicCue | null {
  const idx = findIndexAt(cues, time);
  return idx < 0 ? null : (cues[idx] ?? null);
}

/**
 * 장르 전체 재생 위치(초)에 해당하는 곡(큐) 인덱스 반환.
 * 범위 밖이면 가장 가까운 큐로 클램프.
 */
export function findCueIndexAt(cues: MusicCue[], time: number): number {
  return findIndexAt(cues, time);
}

/**
 * 장르 전체 재생 위치(초)에 해당하는 파트 인덱스 반환.
 * 범위 밖이면 가장 가까운 파트로 클램프.
 */
export function findPartIndexAt(parts: MusicPart[], time: number): number {
  return findIndexAt(parts, time);
}
