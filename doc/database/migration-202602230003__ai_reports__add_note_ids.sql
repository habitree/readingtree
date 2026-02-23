-- ==========================================================================
-- AI Generated Reports: note_ids, include_notes 컬럼 추가
-- 리포트 공유 시 사용된 기록도 함께 공유하기 위한 컬럼
-- ==========================================================================

ALTER TABLE ai_generated_reports
  ADD COLUMN IF NOT EXISTS note_ids UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS include_notes BOOLEAN NOT NULL DEFAULT true;
