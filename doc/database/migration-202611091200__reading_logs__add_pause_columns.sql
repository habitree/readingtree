-- =============================================================================
-- Migration: reading_logs에 일시정지 컬럼 추가 (REQ-0013)
-- Description: 진행 중 세션을 음악처럼 일시정지/재개.
--              활성 독서시간 = (paused_at ?? now) - started_at - paused_seconds
--              일시정지를 쓰지 않으면 paused_seconds=0 → 기존 계산과 동일.
-- Date: 2026-11-09
-- Idempotent: ADD COLUMN IF NOT EXISTS, CHECK는 DO 블록으로 중복 보호
-- RLS: 기존 reading_logs 정책(auth.uid() = user_id)이 그대로 적용 — 신규 정책 불필요
-- =============================================================================

ALTER TABLE reading_logs
  ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paused_seconds INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN reading_logs.paused_at IS
  '현재 일시정지 시작 시각. NULL=진행 중(또는 종료됨)';
COMMENT ON COLUMN reading_logs.paused_seconds IS
  '지금까지 누적된 일시정지 시간(초). 현재 진행 중인 일시정지 구간은 미포함';

DO $$ BEGIN
  ALTER TABLE reading_logs
    ADD CONSTRAINT reading_logs_paused_seconds_check
    CHECK (paused_seconds >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- END OF MIGRATION
-- 롤백:
--   ALTER TABLE reading_logs DROP CONSTRAINT IF EXISTS reading_logs_paused_seconds_check;
--   ALTER TABLE reading_logs DROP COLUMN IF EXISTS paused_seconds;
--   ALTER TABLE reading_logs DROP COLUMN IF EXISTS paused_at;
-- =============================================================================
