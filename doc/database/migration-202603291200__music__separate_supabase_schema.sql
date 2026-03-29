-- =============================================
-- Music Supabase (별도 프로젝트) 스키마
-- 음악 데이터 전용 — 로그인 불필요, anon key 읽기 전용
-- =============================================

-- 1. tracks 테이블
CREATE TABLE IF NOT EXISTS tracks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  composer TEXT NOT NULL,
  performer TEXT NOT NULL DEFAULT 'Musopen',
  source_url TEXT NOT NULL,
  is_external BOOLEAN NOT NULL DEFAULT true,
  duration_seconds INTEGER NOT NULL,
  moods TEXT[] NOT NULL DEFAULT '{}',
  era TEXT NOT NULL,
  instruments TEXT[] NOT NULL DEFAULT '{}',
  intensity SMALLINT NOT NULL DEFAULT 1 CHECK (intensity BETWEEN 1 AND 3),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. playlists 테이블
CREATE TABLE IF NOT EXISTS playlists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. playlist_tracks (N:M 조인 테이블)
CREATE TABLE IF NOT EXISTS playlist_tracks (
  playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (playlist_id, track_id)
);

-- 4. theme_groups 테이블
CREATE TABLE IF NOT EXISTS theme_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 5. theme_group_playlists (N:M 조인 테이블)
CREATE TABLE IF NOT EXISTS theme_group_playlists (
  theme_group_id TEXT NOT NULL REFERENCES theme_groups(id) ON DELETE CASCADE,
  playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (theme_group_id, playlist_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id, position);
CREATE INDEX IF NOT EXISTS idx_theme_group_playlists_theme ON theme_group_playlists(theme_group_id, position);
CREATE INDEX IF NOT EXISTS idx_tracks_era ON tracks(era);
CREATE INDEX IF NOT EXISTS idx_tracks_moods ON tracks USING GIN(moods);

-- RLS: 모든 테이블 읽기 전용 (anon key)
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_group_playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read" ON tracks FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON playlists FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON playlist_tracks FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON theme_groups FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON theme_group_playlists FOR SELECT TO anon USING (true);
