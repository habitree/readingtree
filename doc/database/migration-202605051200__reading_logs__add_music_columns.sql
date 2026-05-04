-- =============================================================================
-- Migration: reading_logs에 음악 통합 컬럼 추가 (Phase 8.A)
-- Description: 기록 v2 ↔ 음악 플레이어 통합.
--              음악 메타데이터를 reading_logs에 직접 저장 (지금까지는
--              record_events.metadata에만 일부). 모두 NULL 허용 — 음악 없이도
--              기록 가능 (D6: "음악만 듣기" 시트 잔존, 기록은 음악 없이 가능).
-- Plan: ~/.claude/plans/foamy-frolicking-lightning.md (Phase 8.A)
-- Date: 2026-05-05
-- Idempotent: ADD COLUMN IF NOT EXISTS, CHECK는 DO 블록으로 중복 보호
-- =============================================================================

-- 1. 신규 컬럼 4종
ALTER TABLE reading_logs
  ADD COLUMN IF NOT EXISTS target_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS music_playlist_id TEXT,
  ADD COLUMN IF NOT EXISTS music_track_ids JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS music_started_at TIMESTAMPTZ;

COMMENT ON COLUMN reading_logs.target_seconds IS
  '시작 시 선택한 목표 시간(초). 0=무제한, NULL=미설정. 8.A 이전엔 record_events.metadata에만 있었음';
COMMENT ON COLUMN reading_logs.music_playlist_id IS
  '세션 시작/변경 시 선택된 플레이리스트 ID (lib/music/playlists.ts의 id 문자열)';
COMMENT ON COLUMN reading_logs.music_track_ids IS
  '세션 중 재생된 트랙 ID 배열 (분석용). Phase 8.A는 빈 배열, 8.F에서 누적 채움';
COMMENT ON COLUMN reading_logs.music_started_at IS
  '음악 처음 켜진 시각. NULL=음악 미사용. 진행 중 음악 추가 시 그때의 시각';

-- 2. CHECK 제약 (멱등 보호)
DO $$ BEGIN
  ALTER TABLE reading_logs
    ADD CONSTRAINT reading_logs_target_seconds_check
    CHECK (target_seconds IS NULL OR target_seconds >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE reading_logs
    ADD CONSTRAINT reading_logs_music_track_ids_array
    CHECK (music_track_ids IS NULL OR jsonb_typeof(music_track_ids) = 'array');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. 부분 인덱스 — 플레이리스트별 사용 빈도 분석
CREATE INDEX IF NOT EXISTS idx_reading_logs_music_playlist
  ON reading_logs (music_playlist_id)
  WHERE music_playlist_id IS NOT NULL;

-- =============================================================================
-- END OF MIGRATION
-- 롤백:
--   DROP INDEX IF EXISTS idx_reading_logs_music_playlist;
--   ALTER TABLE reading_logs DROP CONSTRAINT IF EXISTS reading_logs_music_track_ids_array;
--   ALTER TABLE reading_logs DROP CONSTRAINT IF EXISTS reading_logs_target_seconds_check;
--   ALTER TABLE reading_logs DROP COLUMN IF EXISTS music_started_at;
--   ALTER TABLE reading_logs DROP COLUMN IF EXISTS music_track_ids;
--   ALTER TABLE reading_logs DROP COLUMN IF EXISTS music_playlist_id;
--   ALTER TABLE reading_logs DROP COLUMN IF EXISTS target_seconds;
-- =============================================================================
