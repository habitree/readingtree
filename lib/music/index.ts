/**
 * 음악 데이터 진입점 (개별 곡 재생 — 병합 스트림 폐기, 2026-07-24)
 *
 * 음악 3채널(scripts/build-music.ts 생성 ./genres) + 백색소음 4채널
 * (scripts/build-ambience.ts 생성 ./ambience)을 합쳐 노출한다.
 * 병합 스트림 시절의 타임라인 이진탐색(findCueAt/findPartIndexAt 등)은
 * 곡=파일 구조에서 불필요하므로 제거했다.
 */

import type { MusicGenre, MusicTrack } from "@/types/music";
import { MUSIC_GENRES as MUSIC_ONLY_GENRES } from "./genres";
import { AMBIENCE_GENRES } from "./ambience";

/** 전체 채널 — 음악 다음에 백색소음 순서 */
export const MUSIC_GENRES: MusicGenre[] = [...MUSIC_ONLY_GENRES, ...AMBIENCE_GENRES];

export { AMBIENCE_GENRES };
export type { MusicGenre, MusicTrack };

/** ID로 장르 조회 */
export function getGenreById(id: string): MusicGenre | undefined {
  return MUSIC_GENRES.find((g) => g.id === id);
}
