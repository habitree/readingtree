import { createMusicClient } from "@/lib/supabase-music/client";
import type {
  MusicTrack,
  MusicPlaylist,
  MusicThemeGroup,
  MusicMoodTag,
  MusicEraTag,
  MusicInstrumentTag,
} from "@/types/music";

interface TrackRow {
  id: string;
  title: string;
  composer: string;
  performer: string;
  source_url: string;
  is_external: boolean;
  duration_seconds: number;
  moods: string[];
  era: string;
  instruments: string[];
  intensity: number;
  sort_order: number;
}

interface PlaylistRow {
  id: string;
  name: string;
  description: string;
  emoji: string;
  sort_order: number;
  playlist_tracks: { track_id: string; position: number }[];
}

interface ThemeGroupRow {
  id: string;
  name: string;
  emoji: string;
  sort_order: number;
  theme_group_playlists: { playlist_id: string; position: number }[];
}

/** tracks 테이블 전체 조회 → MusicTrack[] 변환 */
export async function fetchTracks(): Promise<MusicTrack[]> {
  const supabase = createMusicClient();
  const { data, error } = await supabase
    .from("tracks")
    .select("*")
    .order("sort_order");

  if (error) throw new Error(`Music tracks 조회 실패: ${error.message}`);

  return (data as TrackRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    composer: row.composer,
    performer: row.performer,
    sourceUrl: row.source_url,
    isExternal: row.is_external,
    durationSeconds: row.duration_seconds,
    moods: row.moods as MusicMoodTag[],
    era: row.era as MusicEraTag,
    instruments: row.instruments as MusicInstrumentTag[],
    intensity: row.intensity as 1 | 2 | 3,
  }));
}

/** playlists + playlist_tracks 조인 조회 → MusicPlaylist[] 변환 */
export async function fetchPlaylists(): Promise<MusicPlaylist[]> {
  const supabase = createMusicClient();
  const { data, error } = await supabase
    .from("playlists")
    .select("*, playlist_tracks(track_id, position)")
    .order("sort_order");

  if (error) throw new Error(`Music playlists 조회 실패: ${error.message}`);

  return (data as PlaylistRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    emoji: row.emoji,
    trackIds: row.playlist_tracks
      .sort((a, b) => a.position - b.position)
      .map((pt) => pt.track_id),
  }));
}

/** theme_groups + theme_group_playlists 조인 조회 → MusicThemeGroup[] 변환 */
export async function fetchThemeGroups(): Promise<MusicThemeGroup[]> {
  const supabase = createMusicClient();
  const { data, error } = await supabase
    .from("theme_groups")
    .select("*, theme_group_playlists(playlist_id, position)")
    .order("sort_order");

  if (error) throw new Error(`Music theme groups 조회 실패: ${error.message}`);

  return (data as ThemeGroupRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    playlists: row.theme_group_playlists
      .sort((a, b) => a.position - b.position)
      .map((tgp) => tgp.playlist_id),
  }));
}
