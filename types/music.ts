/** 음악 카테고리 */
export type MusicCategory = "focus" | "relaxing" | "deep";

/** 음악 트랙 */
export interface MusicTrack {
  id: string;
  title: string;
  composer: string;
  performer: string;
  sourceUrl: string;
  youtubeVideoId: string | null;
  durationSeconds: number;
  category: MusicCategory;
  mood: string;
  instrument: string;
}

/** 플레이리스트 */
export interface MusicPlaylist {
  id: string;
  name: string;
  description: string;
  category: MusicCategory | "mixed";
  trackIds: string[];
  emoji: string;
}

/** 카테고리 정보 */
export interface MusicCategoryInfo {
  id: MusicCategory;
  name: string;
  emoji: string;
  description: string;
}
