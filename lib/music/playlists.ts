import type { MusicPlaylist } from "@/types/music";

/** 큐레이션 플레이리스트 (8개 카테고리: 클래식 4 + 재즈 4, 검증된 69곡) */
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
  {
    id: "jazz-comfortable",
    name: "편안한 재즈",
    description: "따뜻하고 부드러운 재즈로 여유롭게",
    emoji: "🌿",
    trackIds: [
      "track-147", "track-148", "track-149", "track-150", "track-152",
      "track-163", "track-165", "track-169", "track-175", "track-178",
    ],
  },
  {
    id: "jazz-night",
    name: "밤 재즈",
    description: "고요한 밤, 감성적인 재즈와 함께",
    emoji: "🌙",
    trackIds: [
      "track-153", "track-155", "track-156", "track-158", "track-162",
      "track-171", "track-172", "track-173", "track-176", "track-177",
    ],
  },
  {
    id: "jazz-swing",
    name: "스윙 재즈",
    description: "신나고 활기찬 스윙과 펑키 재즈",
    emoji: "🔥",
    trackIds: [
      "track-160", "track-164", "track-166", "track-167",
      "track-170", "track-174", "track-179", "track-180",
    ],
  },
  {
    id: "jazz-focus",
    name: "집중 재즈",
    description: "일정한 리듬의 스무스 재즈로 집중",
    emoji: "🎯",
    trackIds: [
      "track-151", "track-154", "track-157", "track-159", "track-161",
      "track-168", "track-176", "track-165", "track-181",
    ],
  },
];
