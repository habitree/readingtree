import type {
  MusicTrack,
  MusicMoodTag,
  MusicPlaylist,
  MusicThemeGroup,
} from "@/types/music";
import { fetchTracks, fetchPlaylists, fetchThemeGroups } from "./queries";

// ── 모듈 레벨 캐시 ──
let _tracks: MusicTrack[] = [];
let _playlists: MusicPlaylist[] = [];
let _themeGroups: MusicThemeGroup[] = [];
let _loaded = false;
let _loading: Promise<void> | null = null;

// ── localStorage 캐시 ──
const CACHE_KEY = "music-cache-v6";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간

interface MusicCache {
  tracks: MusicTrack[];
  playlists: MusicPlaylist[];
  themeGroups: MusicThemeGroup[];
  timestamp: number;
}

function loadLocalCache(): MusicCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as MusicCache;
    if (Date.now() - cache.timestamp > CACHE_TTL) return null;
    if (!cache.tracks?.length || !cache.playlists?.length) return null;
    return cache;
  } catch {
    return null;
  }
}

function saveLocalCache(data: Omit<MusicCache, "timestamp">): void {
  if (typeof window === "undefined") return;
  try {
    const cache: MusicCache = { ...data, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage 용량 초과 등 무시
  }
}

/** mood 태그 → 이모지 + 한글명 매핑 */
export const MOOD_LABELS: Record<
  MusicMoodTag,
  { emoji: string; name: string }
> = {
  focus: { emoji: "🎯", name: "집중" },
  relaxing: { emoji: "🌿", name: "편안" },
  contemplative: { emoji: "🌙", name: "사색" },
  emotional: { emoji: "💧", name: "감성" },
  peaceful: { emoji: "☁️", name: "평화" },
  bright: { emoji: "☀️", name: "밝은" },
  energetic: { emoji: "🔥", name: "신나는" },
};

/** Supabase에서 fetch 후 메모리 + localStorage 캐시 갱신 */
async function fetchAndUpdate(): Promise<void> {
  const [tracks, playlists, themeGroups] = await Promise.all([
    fetchTracks(),
    fetchPlaylists(),
    fetchThemeGroups(),
  ]);
  _tracks = tracks;
  _playlists = playlists;
  _themeGroups = themeGroups;
  _loaded = true;
  saveLocalCache({ tracks, playlists, themeGroups });
}

/** 하드코딩 폴백 데이터 로드 */
async function loadFallback(): Promise<void> {
  const [{ MUSIC_TRACKS }, { MUSIC_PLAYLISTS }, { MUSIC_THEME_GROUPS }] =
    await Promise.all([
      import("./tracks"),
      import("./playlists"),
      import("./themes"),
    ]);
  _tracks = MUSIC_TRACKS;
  _playlists = MUSIC_PLAYLISTS;
  _themeGroups = MUSIC_THEME_GROUPS;
  _loaded = true;
}

/**
 * 음악 데이터 초기화 (앱 시작 시 1회 호출)
 *
 * 1) localStorage 캐시 히트 → 즉시 로드 + 백그라운드 revalidate
 * 2) Supabase fetch 시도 → 성공 시 캐시 저장
 * 3) 실패 시 하드코딩 폴백 (tracks.ts 등)
 */
export async function initMusicData(): Promise<void> {
  if (_loaded) return;
  if (_loading) return _loading;

  _loading = (async () => {
    try {
      // 1) localStorage 캐시
      const cached = loadLocalCache();
      if (cached) {
        _tracks = cached.tracks;
        _playlists = cached.playlists;
        _themeGroups = cached.themeGroups;
        _loaded = true;
        // 백그라운드 revalidate (에러 무시)
        fetchAndUpdate().catch(() => {});
        return;
      }

      // 2) Supabase fetch
      await fetchAndUpdate();
    } catch (err) {
      // 3) 하드코딩 폴백
      console.warn("[Music] DB 실패, 하드코딩 폴백 사용:", err);
      await loadFallback();
    } finally {
      _loading = null;
    }
  })();

  return _loading;
}

/** 데이터 로드 완료 여부 */
export function isMusicDataLoaded(): boolean {
  return _loaded;
}

/** 캐시된 전체 트랙 반환 */
export function getAllTracks(): MusicTrack[] {
  return _tracks;
}

/** 캐시된 전체 플레이리스트 반환 */
export function getPlaylists(): MusicPlaylist[] {
  return _playlists;
}

/** 캐시된 전체 테마 그룹 반환 */
export function getThemeGroups(): MusicThemeGroup[] {
  return _themeGroups;
}

/** ID로 트랙 조회 */
export function getTrackById(id: string): MusicTrack | undefined {
  return _tracks.find((t) => t.id === id);
}

/** 플레이리스트의 트랙 목록 반환 */
export function getPlaylistTracks(playlistId: string): MusicTrack[] {
  const playlist = _playlists.find((p) => p.id === playlistId);
  if (!playlist) return [];
  return playlist.trackIds
    .map((id) => getTrackById(id))
    .filter((t): t is MusicTrack => t !== undefined);
}

/** 기본 플레이리스트 (깊은 집중) 트랙 반환 */
export function getDefaultPlaylistTracks(): MusicTrack[] {
  return getPlaylistTracks("comfortable");
}

/** 플레이리스트 ID로 플레이리스트 조회 */
export function getPlaylistById(id: string): MusicPlaylist | undefined {
  return _playlists.find((p) => p.id === id);
}

/** 트랙의 대표 mood 라벨 반환 */
export function getTrackMoodLabel(track: MusicTrack) {
  const primary = track.moods[0];
  return primary ? MOOD_LABELS[primary] : MOOD_LABELS.focus;
}
