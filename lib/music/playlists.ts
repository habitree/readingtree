import type { MusicPlaylist } from "@/types/music";

/** 큐레이션 플레이리스트 (8개 카테고리: 클래식 4 + 재즈 4, 검증된 79곡)
 *
 * 품질 개선: 56/96kbps 트랙 제거 → 128kbps+ 고품질 트랙으로 교체
 * 다양성 강화: 미사용 고품질 파일(320/192/160kbps) 15곡 추가
 */
export const MUSIC_PLAYLISTS: MusicPlaylist[] = [
  {
    id: "comfortable",
    name: "편안한 독서",
    description: "따뜻하고 부드러운 선율로 여유롭게 읽기",
    emoji: "🌿",
    trackIds: [
      "track-012", "track-013", "track-019", "track-028",
      "track-029", "track-031", "track-046", "track-049",
      "track-082", "track-083", "track-084", "track-085",
      "track-088", "track-099", "track-104",
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
      "track-086", "track-087", "track-089", "track-090",
    ],
  },
  {
    id: "energetic",
    name: "신나는 독서",
    description: "빠르고 활기찬 클래식으로 에너지 충전",
    emoji: "🔥",
    trackIds: [
      "track-014", "track-063", "track-064", "track-065", "track-066",
      "track-091", "track-092", "track-093", "track-094", "track-095",
      "track-098",
    ],
  },
  {
    id: "calm",
    name: "차분한 독서",
    description: "규칙적이고 집중력을 높이는 차분한 선율",
    emoji: "🎯",
    trackIds: [
      "track-001", "track-004", "track-009", "track-015",
      "track-026", "track-047", "track-056", "track-058",
      "track-096", "track-097", "track-100",
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
      "track-168", "track-176", "track-181",
    ],
  },
];
