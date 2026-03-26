import type { MusicTrack, MusicMoodTag, MusicPlaylist } from "@/types/music";
import { MUSIC_TRACKS } from "./tracks";
import { MUSIC_PLAYLISTS } from "./playlists";

/** mood 태그 → 이모지 + 한글명 매핑 */
export const MOOD_LABELS: Record<MusicMoodTag, { emoji: string; name: string }> = {
  focus: { emoji: "🎯", name: "집중" },
  relaxing: { emoji: "🌿", name: "편안" },
  contemplative: { emoji: "🌙", name: "사색" },
  emotional: { emoji: "💧", name: "감성" },
  peaceful: { emoji: "☁️", name: "평화" },
  bright: { emoji: "☀️", name: "밝은" },
  energetic: { emoji: "🔥", name: "신나는" },
};

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

/** 기본 플레이리스트 (깊은 집중) 트랙 반환 */
export function getDefaultPlaylistTracks(): MusicTrack[] {
  return getPlaylistTracks("mood-focus");
}

/** 플레이리스트 ID로 플레이리스트 조회 */
export function getPlaylistById(id: string): MusicPlaylist | undefined {
  return MUSIC_PLAYLISTS.find((p) => p.id === id);
}

/** 트랙의 대표 mood 라벨 반환 */
export function getTrackMoodLabel(track: MusicTrack) {
  const primary = track.moods[0];
  return primary ? MOOD_LABELS[primary] : MOOD_LABELS.focus;
}
