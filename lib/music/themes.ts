import type { MusicThemeGroup } from "@/types/music";

/** 테마 그룹 (UI 섹션용) */
export const MUSIC_THEME_GROUPS: MusicThemeGroup[] = [
  {
    id: "mood",
    name: "기분별",
    emoji: "🎭",
    playlists: ["mood-focus", "mood-relaxing", "mood-contemplative", "mood-emotional"],
  },
  {
    id: "time",
    name: "시간대별",
    emoji: "🕐",
    playlists: ["time-morning", "time-afternoon", "time-evening", "time-night"],
  },
  {
    id: "era",
    name: "시대별",
    emoji: "📜",
    playlists: ["era-baroque", "era-classical", "era-romantic", "era-impressionist"],
  },
  {
    id: "instrument",
    name: "악기별",
    emoji: "🎵",
    playlists: ["inst-piano", "inst-strings"],
  },
  {
    id: "reading",
    name: "독서 장르별",
    emoji: "📖",
    playlists: ["read-study", "read-novel"],
  },
];
