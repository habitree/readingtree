-- =============================================================================
-- Migration: notes에 reading_log_id 연결 + detail_kind 분류 추가
-- Description: 기록 기능 전면 개편 (Phase 1 / 7)
--              상세기록(필사·구절·긴 생각)을 reading_logs 세션에 연결할 수 있도록
--              notes.reading_log_id FK 추가. 자유 상세(D3)는 reading_log_id NULL.
--              detail_kind는 새 통합 분류 라벨 (quote|memo|transcription).
--              기존 notes.type은 호환을 위해 그대로 유지 (Phase 6에서 photo·progress 차단).
-- Plan: doc/update/기록기획/01-data-model.md §3, 02-migration.md §M3
-- Date: 2026-05-04
-- Idempotent: ADD COLUMN IF NOT EXISTS / DO $$ ... duplicate_object 보호
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. reading_log_id FK (세션 ↔ 상세 N:1)
--    ON DELETE SET NULL: 세션이 삭제되어도 상세기록은 보존(자유 상세화)
-- -----------------------------------------------------------------------------
ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS reading_log_id UUID
    REFERENCES reading_logs(id) ON DELETE SET NULL;

COMMENT ON COLUMN notes.reading_log_id IS
  '연결된 reading_logs.id. NULL = 자유 상세 (D3). 세션 삭제 시 SET NULL.';

-- -----------------------------------------------------------------------------
-- 2. detail_kind — 상세기록 분류 (quote|memo|transcription)
--    NULL = legacy (기존 photo/progress 등 5종 type)
-- -----------------------------------------------------------------------------
ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS detail_kind TEXT;

DO $$ BEGIN
  ALTER TABLE notes
    ADD CONSTRAINT notes_detail_kind_check
    CHECK (detail_kind IS NULL OR detail_kind IN ('quote','memo','transcription'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN notes.detail_kind IS
  'quote | memo | transcription. NULL = legacy (photo/progress 등).';

-- -----------------------------------------------------------------------------
-- 3. 인덱스 — 세션별 상세 조회용
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notes_reading_log_id
  ON notes (reading_log_id)
  WHERE reading_log_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 4. RLS — 정책 추가 없음 (기존 정책이 user_id 기반으로 자동 보호)
-- -----------------------------------------------------------------------------

-- =============================================================================
-- END OF MIGRATION
-- 롤백:
--   DROP INDEX IF EXISTS idx_notes_reading_log_id;
--   ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_detail_kind_check;
--   ALTER TABLE notes DROP COLUMN IF EXISTS detail_kind;
--   ALTER TABLE notes DROP COLUMN IF EXISTS reading_log_id;
-- =============================================================================
