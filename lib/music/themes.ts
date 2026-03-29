import type { MusicThemeGroup } from "@/types/music";

/** 테마 그룹 (UI 섹션용) */
export const MUSIC_THEME_GROUPS: MusicThemeGroup[] = [
  {
    id: "reading-mood",
    name: "독서 분위기",
    emoji: "📖",
    playlists: ["comfortable", "night", "energetic", "calm"],
  },
];
