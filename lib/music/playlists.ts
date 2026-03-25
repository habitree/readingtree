import type { MusicPlaylist } from "@/types/music";

/** 큐레이션 플레이리스트 (16개) */
export const MUSIC_PLAYLISTS: MusicPlaylist[] = [
  // ─── 기분별 ───
  {
    id: "mood-focus",
    name: "깊은 집중",
    description: "규칙적인 바로크/고전 피아노로 집중력 향상",
    emoji: "🎯",
    trackIds: [
      "track-001", "track-003", "track-004", "track-005",
      "track-009", "track-026", "track-027", "track-031",
      "track-054", "track-055",
    ],
  },
  {
    id: "mood-relaxing",
    name: "편안한 독서",
    description: "부드러운 현악과 서정적 선율",
    emoji: "🌿",
    trackIds: [
      "track-006", "track-011", "track-013", "track-025",
      "track-028", "track-029", "track-033", "track-036",
      "track-044", "track-048", "track-049",
    ],
  },
  {
    id: "mood-contemplative",
    name: "고요한 사색",
    description: "느린 템포와 깊은 울림, 내면의 여행",
    emoji: "🌙",
    trackIds: [
      "track-002", "track-007", "track-010", "track-016",
      "track-017", "track-020", "track-021", "track-022",
      "track-030", "track-035", "track-038", "track-039",
    ],
  },
  {
    id: "mood-emotional",
    name: "감성 충전",
    description: "서정적 낭만파 명곡으로 감성 채우기",
    emoji: "💧",
    trackIds: [
      "track-012", "track-014", "track-015", "track-018",
      "track-023", "track-024", "track-034", "track-040",
      "track-041", "track-042", "track-045", "track-051",
    ],
  },

  // ─── 시간대별 ───
  {
    id: "time-morning",
    name: "아침 독서",
    description: "밝고 상쾌한 선율로 하루 시작",
    emoji: "🌅",
    trackIds: [
      "track-004", "track-006", "track-009", "track-019",
      "track-026", "track-033", "track-037", "track-043",
      "track-046", "track-055",
    ],
  },
  {
    id: "time-afternoon",
    name: "오후 독서",
    description: "편안하면서 집중력을 유지하는 오후의 선율",
    emoji: "🌤️",
    trackIds: [
      "track-001", "track-003", "track-005", "track-011",
      "track-018", "track-027", "track-029", "track-031",
      "track-044", "track-049",
    ],
  },
  {
    id: "time-evening",
    name: "저녁 독서",
    description: "하루를 마무리하는 서정적 곡들",
    emoji: "🌆",
    trackIds: [
      "track-010", "track-013", "track-025", "track-028",
      "track-034", "track-036", "track-040", "track-041",
      "track-047", "track-051",
    ],
  },
  {
    id: "time-night",
    name: "밤 독서",
    description: "잔잔하고 몽환적인 야상곡",
    emoji: "🌜",
    trackIds: [
      "track-002", "track-008", "track-012", "track-016",
      "track-020", "track-021", "track-022", "track-023",
      "track-030", "track-035", "track-038", "track-045",
      "track-059",
    ],
  },

  // ─── 시대별 ───
  {
    id: "era-baroque",
    name: "바로크 정원",
    description: "바흐, 헨델, 비발디의 균형 잡힌 선율",
    emoji: "🏛️",
    trackIds: [
      "track-001", "track-002", "track-003", "track-004",
      "track-005", "track-026", "track-027", "track-031",
      "track-032", "track-037", "track-054", "track-055",
    ],
  },
  {
    id: "era-classical",
    name: "고전의 품격",
    description: "모차르트, 하이든, 베토벤의 우아한 선율",
    emoji: "🎭",
    trackIds: [
      "track-006", "track-007", "track-008", "track-039",
      "track-044", "track-048", "track-049", "track-050",
      "track-056",
    ],
  },
  {
    id: "era-romantic",
    name: "낭만의 숲",
    description: "쇼팽, 슈베르트, 브람스의 감성적 이야기",
    emoji: "🌹",
    trackIds: [
      "track-009", "track-010", "track-011", "track-012",
      "track-013", "track-014", "track-015", "track-016",
      "track-017", "track-018", "track-023", "track-024",
      "track-025", "track-028", "track-029", "track-030",
      "track-040", "track-041", "track-042", "track-045",
      "track-051", "track-052", "track-059",
    ],
  },
  {
    id: "era-impressionist",
    name: "인상주의 물결",
    description: "드뷔시, 사티의 몽환적 색채",
    emoji: "🎨",
    trackIds: [
      "track-019", "track-020", "track-021", "track-022",
    ],
  },

  // ─── 악기별 ───
  {
    id: "inst-piano",
    name: "피아노 독주",
    description: "피아노만의 순수한 울림",
    emoji: "🎹",
    trackIds: [
      "track-001", "track-002", "track-003", "track-004",
      "track-005", "track-006", "track-007", "track-008",
      "track-009", "track-010", "track-011", "track-012",
      "track-013", "track-014", "track-015", "track-016",
      "track-017", "track-018", "track-019", "track-020",
      "track-021", "track-022", "track-023", "track-024",
      "track-025", "track-045", "track-059", "track-060",
    ],
  },
  {
    id: "inst-strings",
    name: "현악의 숲",
    description: "현악 사중주와 오케스트라의 따뜻한 울림",
    emoji: "🎻",
    trackIds: [
      "track-026", "track-027", "track-028", "track-029",
      "track-030", "track-031", "track-032", "track-033",
      "track-034", "track-035", "track-036", "track-037",
      "track-038", "track-039", "track-040", "track-041",
      "track-042", "track-043", "track-044",
    ],
  },

  // ─── 독서별 ───
  {
    id: "read-study",
    name: "공부 집중",
    description: "바로크/고전 위주의 규칙적인 리듬",
    emoji: "📚",
    trackIds: [
      "track-001", "track-003", "track-004", "track-005",
      "track-006", "track-008", "track-009", "track-021",
      "track-026", "track-027", "track-031", "track-054",
    ],
  },
  {
    id: "read-novel",
    name: "소설 읽기",
    description: "감성적이면서 방해하지 않는 배경음악",
    emoji: "📖",
    trackIds: [
      "track-010", "track-011", "track-012", "track-013",
      "track-020", "track-023", "track-025", "track-028",
      "track-029", "track-030", "track-035", "track-040",
      "track-049",
    ],
  },
];
