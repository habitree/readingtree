import type {
  MusicTrack,
  MusicPlaylist,
  MusicCategoryInfo,
} from "@/types/music";

/** 전체 트랙 목록 (10곡, 62분, MP3 320kbps) */
export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: "track-001",
    title: "골드베르크 변주곡 - Aria",
    composer: "바흐",
    performer: "Musopen",
    sourceUrl: "/music/test/bach-goldberg-aria.mp3",
    youtubeVideoId: null,
    durationSeconds: 292,
    category: "focus",
    mood: "calm",
    instrument: "piano",
  },
  {
    id: "track-002",
    title: "골드베르크 변주곡 - Var.25",
    composer: "바흐",
    performer: "Musopen",
    sourceUrl: "/music/test/bach-goldberg-var25.mp3",
    youtubeVideoId: null,
    durationSeconds: 410,
    category: "deep",
    mood: "contemplative",
    instrument: "piano",
  },
  {
    id: "track-003",
    title: "골드베르크 변주곡 - Aria da Capo",
    composer: "바흐",
    performer: "Musopen",
    sourceUrl: "/music/test/bach-goldberg-ariadacapo.mp3",
    youtubeVideoId: null,
    durationSeconds: 339,
    category: "focus",
    mood: "calm",
    instrument: "piano",
  },
  {
    id: "track-004",
    title: "페르 귄트 - 아침 기분",
    composer: "그리그",
    performer: "Musopen",
    sourceUrl: "/music/test/grieg-morning-mood.mp3",
    youtubeVideoId: null,
    durationSeconds: 229,
    category: "relaxing",
    mood: "bright",
    instrument: "orchestra",
  },
  {
    id: "track-005",
    title: "페르 귄트 - 오세의 죽음",
    composer: "그리그",
    performer: "Musopen",
    sourceUrl: "/music/test/grieg-aases-death.mp3",
    youtubeVideoId: null,
    durationSeconds: 273,
    category: "deep",
    mood: "melancholic",
    instrument: "strings",
  },
  {
    id: "track-006",
    title: "명상곡",
    composer: "수크",
    performer: "Musopen",
    sourceUrl: "/music/test/suk-meditation.mp3",
    youtubeVideoId: null,
    durationSeconds: 405,
    category: "deep",
    mood: "meditative",
    instrument: "strings",
  },
  {
    id: "track-007",
    title: "현악 사중주 2번 - 녹턴",
    composer: "보로딘",
    performer: "Musopen",
    sourceUrl: "/music/test/borodin-nocturne.mp3",
    youtubeVideoId: null,
    durationSeconds: 547,
    category: "relaxing",
    mood: "romantic",
    instrument: "string_quartet",
  },
  {
    id: "track-008",
    title: "아메리칸 사중주 - Lento",
    composer: "드보르작",
    performer: "Musopen",
    sourceUrl: "/music/test/dvorak-lento.mp3",
    youtubeVideoId: null,
    durationSeconds: 471,
    category: "relaxing",
    mood: "peaceful",
    instrument: "string_quartet",
  },
  {
    id: "track-009",
    title: "소나타 D.664 - 1악장",
    composer: "슈베르트",
    performer: "Musopen",
    sourceUrl: "/music/test/schubert-allegro.mp3",
    youtubeVideoId: null,
    durationSeconds: 466,
    category: "focus",
    mood: "gentle",
    instrument: "piano",
  },
  {
    id: "track-010",
    title: "소나타 D.664 - 2악장",
    composer: "슈베르트",
    performer: "Musopen",
    sourceUrl: "/music/test/schubert-andante.mp3",
    youtubeVideoId: null,
    durationSeconds: 290,
    category: "deep",
    mood: "nostalgic",
    instrument: "piano",
  },
];

/** 카테고리 정보 */
export const MUSIC_CATEGORIES: MusicCategoryInfo[] = [
  {
    id: "focus",
    name: "집중 모드",
    emoji: "🎼",
    description: "피아노 독주 — 규칙적, 안정적",
  },
  {
    id: "relaxing",
    name: "편안한 독서",
    emoji: "🌙",
    description: "현악/오케스트라 — 서정적, 부드러운",
  },
  {
    id: "deep",
    name: "깊은 사색",
    emoji: "🏔️",
    description: "감성적 — 깊은 울림, 사색",
  },
];

/** 1시간 통합 플레이리스트 (악기 교차 배치) */
const READING_1H_ORDER = [
  "track-001", // 바흐 Aria (피아노)
  "track-004", // 그리그 아침 기분 (오케스트라)
  "track-007", // 보로딘 녹턴 (현악 4중주)
  "track-009", // 슈베르트 1악장 (피아노)
  "track-006", // 수크 명상곡 (현악)
  "track-002", // 바흐 Var.25 (피아노)
  "track-008", // 드보르작 Lento (현악 4중주)
  "track-005", // 그리그 오세의 죽음 (현악)
  "track-010", // 슈베르트 2악장 (피아노)
  "track-003", // 바흐 Aria da Capo (피아노)
];

/** 플레이리스트 목록 */
export const MUSIC_PLAYLISTS: MusicPlaylist[] = [
  {
    id: "playlist-reading-1h",
    name: "독서 배경음악 1시간",
    description: "독서에 최적화된 클래식 10곡, 62분",
    category: "mixed",
    trackIds: READING_1H_ORDER,
    emoji: "📚",
  },
  {
    id: "playlist-focus",
    name: "집중 모드",
    description: "규칙적이고 안정적인 피아노 선율",
    category: "focus",
    trackIds: ["track-001", "track-003", "track-009"],
    emoji: "🎼",
  },
  {
    id: "playlist-relaxing",
    name: "편안한 독서",
    description: "서정적이고 부드러운 현악/오케스트라",
    category: "relaxing",
    trackIds: ["track-004", "track-007", "track-008"],
    emoji: "🌙",
  },
  {
    id: "playlist-deep",
    name: "깊은 사색",
    description: "감성적이고 깊은 울림의 곡",
    category: "deep",
    trackIds: ["track-002", "track-005", "track-006", "track-010"],
    emoji: "🏔️",
  },
];

/** ID로 트랙 조회 */
export function getTrackById(id: string): MusicTrack | undefined {
  return MUSIC_TRACKS.find((t) => t.id === id);
}

/** 플레이리스트의 트랙 목록 반환 */
export function getPlaylistTracks(playlistId: string): MusicTrack[] {
  const playlist = MUSIC_PLAYLISTS.find((p) => p.id === playlistId);
  if (!playlist) return [];
  return playlist.trackIds
    .map((id) => getTrackById(id))
    .filter((t): t is MusicTrack => t !== undefined);
}

/** 기본 플레이리스트 (1시간 통합) 트랙 반환 */
export function getDefaultPlaylistTracks(): MusicTrack[] {
  return getPlaylistTracks("playlist-reading-1h");
}
