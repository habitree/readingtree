import type { MusicPlaylist } from "@/types/music";

/** 큐레이션 플레이리스트 (4개 카테고리, 검증된 34곡) */
export const MUSIC_PLAYLISTS: MusicPlaylist[] = [
  {
    id: "comfortable",
    name: "편안한 독서",
    description: "따뜻하고 부드러운 선율로 여유롭게 읽기",
    emoji: "🌿",
    trackIds: [
      "track-012", "track-013", "track-019", "track-027", "track-028",
      "track-029", "track-031", "track-046", "track-049", "track-055",
    ],
  },
  {
    id: "night",
    name: "밤 독서",
    description: "고요하고 몽환적인 야상곡, 깊은 밤의 독서",
    emoji: "🌙",
    trackIds: [
      "track-002", "track-008", "track-010", "track-016", "track-017",
      "track-020", "track-021", "track-030",
    ],
  },
  {
    id: "energetic",
    name: "신나는 독서",
    description: "빠르고 활기찬 클래식으로 에너지 충전",
    emoji: "🔥",
    trackIds: [
      "track-014", "track-061", "track-062", "track-063",
      "track-064", "track-065", "track-066",
    ],
  },
  {
    id: "calm",
    name: "차분한 독서",
    description: "규칙적이고 집중력을 높이는 차분한 선율",
    emoji: "🎯",
    trackIds: [
      "track-001", "track-003", "track-004", "track-009", "track-015",
      "track-026", "track-047", "track-056", "track-058",
    ],
  },
];
