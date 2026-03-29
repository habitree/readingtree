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

/**
 * 음악 데이터 초기화 (앱 시작 시 1회 호출)
 * Music Supabase에서 tracks, playlists, themeGroups를 fetch하여 캐시
 */
export async function initMusicData(): Promise<void> {
  if (_loaded) return;
  if (_loading) return _loading;

  _loading = (async () => {
    try {
      const [tracks, playlists, themeGroups] = await Promise.all([
        fetchTracks(),
        fetchPlaylists(),
        fetchThemeGroups(),
      ]);
      _tracks = tracks;
      _playlists = playlists;
      _themeGroups = themeGroups;
      _loaded = true;
    } catch (err) {
      console.error("[Music] 데이터 초기화 실패:", err);
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
  return getPlaylistTracks("mood-focus");
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
