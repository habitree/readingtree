-- =============================================================================
-- Migration: reading_logs 시간 추적 컬럼 추가
-- Description: 독서 타이머 연동 — 시작시간, 종료시간, 총 독서시간 저장
-- Date: 2026-03-25
-- =============================================================================

ALTER TABLE reading_logs
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reading_duration_seconds INTEGER DEFAULT 0;

COMMENT ON COLUMN reading_logs.started_at IS '독서 시작 시간';
COMMENT ON COLUMN reading_logs.ended_at IS '독서 종료 시간';
COMMENT ON COLUMN reading_logs.reading_duration_seconds IS '독서 시간 (초)';

CREATE INDEX IF NOT EXISTS idx_reading_logs_duration
  ON reading_logs (user_book_id, reading_duration_seconds)
  WHERE reading_duration_seconds > 0;

CREATE INDEX IF NOT EXISTS idx_reading_logs_started_at
  ON reading_logs (user_id, started_at DESC)
  WHERE started_at IS NOT NULL;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
