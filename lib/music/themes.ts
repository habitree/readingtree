import type { MusicThemeGroup } from "@/types/music";

/** 테마 그룹 (UI 섹션용) */
export const MUSIC_THEME_GROUPS: MusicThemeGroup[] = [
  {
    id: "reading-mood",
    name: "클래식",
    emoji: "🎻",
    playlists: ["comfortable", "night", "energetic", "calm"],
  },
  {
    id: "genre",
    name: "재즈",
    emoji: "🎷",
    playlists: ["jazz-comfortable", "jazz-night", "jazz-swing", "jazz-focus"],
  },
];
