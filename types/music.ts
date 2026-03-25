/** 기분/용도 태그 */
export type MusicMoodTag =
  | "focus"
  | "relaxing"
  | "contemplative"
  | "emotional"
  | "peaceful"
  | "bright";

/** 시대 태그 */
export type MusicEraTag = "baroque" | "classical" | "romantic" | "impressionist";

/** 악기 태그 */
export type MusicInstrumentTag =
  | "piano"
  | "strings"
  | "string_quartet"
  | "orchestra"
  | "woodwind"
  | "cello";

/** 음악 트랙 */
export interface MusicTrack {
  id: string;
  title: string;
  composer: string;
  performer: string;
  sourceUrl: string;
  isExternal: boolean;
  durationSeconds: number;
  moods: MusicMoodTag[];
  era: MusicEraTag;
  instruments: MusicInstrumentTag[];
  intensity: 1 | 2 | 3;
}

/** 플레이리스트 */
export interface MusicPlaylist {
  id: string;
  name: string;
  description: string;
  emoji: string;
  trackIds: string[];
}

/** 테마 그룹 */
export interface MusicThemeGroup {
  id: string;
  name: string;
  emoji: string;
  playlists: string[];
}
