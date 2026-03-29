/**
 * 음악 데이터 마이그레이션 스크립트
 * 기존 하드코딩된 음악 데이터를 Music Supabase 프로젝트로 이전
 *
 * 실행: npx tsx scripts/migrate-music-to-supabase.ts
 *
 * 필요한 환경변수:
 *   NEXT_PUBLIC_SUPABASE_MUSIC_URL
 *   SUPABASE_MUSIC_SERVICE_ROLE_KEY
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { MUSIC_TRACKS } from "../lib/music/tracks";
import { MUSIC_PLAYLISTS } from "../lib/music/playlists";
import { MUSIC_THEME_GROUPS } from "../lib/music/themes";

const url = process.env.NEXT_PUBLIC_SUPABASE_MUSIC_URL;
const serviceRoleKey = process.env.SUPABASE_MUSIC_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "환경변수 누락:\n" +
      "  NEXT_PUBLIC_SUPABASE_MUSIC_URL\n" +
      "  SUPABASE_MUSIC_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey);

async function migrateTracks() {
  console.log(`\n[1/4] tracks 마이그레이션 (${MUSIC_TRACKS.length}곡)...`);

  const rows = MUSIC_TRACKS.map((t, i) => ({
    id: t.id,
    title: t.title,
    composer: t.composer,
    performer: t.performer,
    source_url: t.sourceUrl,
    is_external: t.isExternal,
    duration_seconds: t.durationSeconds,
    moods: t.moods,
    era: t.era,
    instruments: t.instruments,
    intensity: t.intensity,
    sort_order: i,
  }));

  const { error } = await supabase.from("tracks").upsert(rows);
  if (error) throw new Error(`tracks INSERT 실패: ${error.message}`);
  console.log(`  ✓ ${rows.length}곡 완료`);
}

async function migratePlaylists() {
  console.log(
    `\n[2/4] playlists 마이그레이션 (${MUSIC_PLAYLISTS.length}개)...`
  );

  const playlistRows = MUSIC_PLAYLISTS.map((p, i) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    emoji: p.emoji,
    sort_order: i,
  }));

  const { error: plError } = await supabase
    .from("playlists")
    .upsert(playlistRows);
  if (plError) throw new Error(`playlists INSERT 실패: ${plError.message}`);
  console.log(`  ✓ ${playlistRows.length}개 플레이리스트 완료`);
}

async function migratePlaylistTracks() {
  console.log("\n[3/4] playlist_tracks 마이그레이션...");

  const ptRows: { playlist_id: string; track_id: string; position: number }[] =
    [];
  for (const p of MUSIC_PLAYLISTS) {
    for (let i = 0; i < p.trackIds.length; i++) {
      ptRows.push({
        playlist_id: p.id,
        track_id: p.trackIds[i],
        position: i,
      });
    }
  }

  const { error } = await supabase.from("playlist_tracks").upsert(ptRows);
  if (error) throw new Error(`playlist_tracks INSERT 실패: ${error.message}`);
  console.log(`  ✓ ${ptRows.length}개 관계 완료`);
}

async function migrateThemeGroups() {
  console.log(
    `\n[4/4] theme_groups 마이그레이션 (${MUSIC_THEME_GROUPS.length}개)...`
  );

  const tgRows = MUSIC_THEME_GROUPS.map((g, i) => ({
    id: g.id,
    name: g.name,
    emoji: g.emoji,
    sort_order: i,
  }));

  const { error: tgError } = await supabase
    .from("theme_groups")
    .upsert(tgRows);
  if (tgError) throw new Error(`theme_groups INSERT 실패: ${tgError.message}`);

  const tgpRows: {
    theme_group_id: string;
    playlist_id: string;
    position: number;
  }[] = [];
  for (const g of MUSIC_THEME_GROUPS) {
    for (let i = 0; i < g.playlists.length; i++) {
      tgpRows.push({
        theme_group_id: g.id,
        playlist_id: g.playlists[i],
        position: i,
      });
    }
  }

  const { error: tgpError } = await supabase
    .from("theme_group_playlists")
    .upsert(tgpRows);
  if (tgpError)
    throw new Error(
      `theme_group_playlists INSERT 실패: ${tgpError.message}`
    );
  console.log(
    `  ✓ ${tgRows.length}개 테마 + ${tgpRows.length}개 관계 완료`
  );
}

async function main() {
  console.log("=== Music Supabase 데이터 마이그레이션 시작 ===");
  console.log(`대상: ${url}`);

  await migrateTracks();
  await migratePlaylists();
  await migratePlaylistTracks();
  await migrateThemeGroups();

  console.log("\n=== 마이그레이션 완료! ===");
  console.log(
    `  tracks: ${MUSIC_TRACKS.length}곡\n` +
      `  playlists: ${MUSIC_PLAYLISTS.length}개\n` +
      `  theme_groups: ${MUSIC_THEME_GROUPS.length}개`
  );
}

main().catch((err) => {
  console.error("\n마이그레이션 실패:", err);
  process.exit(1);
});
