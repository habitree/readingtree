-- =============================================================================
-- Migration: 기록 세션 이벤트 트래킹 테이블
-- Description: 기록 기능 전면 개편 (Phase 7 / 7)
--              4종 이벤트(record_started/ended/abandoned/detail_added) 수집.
--              share_events와 동일 패턴 — 무음 실패 + RLS service_role 전용.
-- Plan: doc/update/기록기획/phases/phase-7-polishing.md
-- Date: 2026-05-04
-- Idempotent: CREATE TABLE / INDEX / POLICY IF NOT EXISTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS record_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event       TEXT NOT NULL,
  session_id  UUID,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE record_events
    ADD CONSTRAINT record_events_event_check
    CHECK (event IN ('record_started','record_ended','record_abandoned','detail_added'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON TABLE record_events IS '기록 기능 세션 이벤트 (Phase 7 텔레메트리)';
COMMENT ON COLUMN record_events.event IS 'record_started | record_ended | record_abandoned | detail_added';
COMMENT ON COLUMN record_events.session_id IS '연결된 reading_logs.id (detail_added는 옵션)';
COMMENT ON COLUMN record_events.metadata IS '이벤트별 컨텍스트 (duration_s, pages_read, photo_count 등)';

-- 인덱스 — 분석 쿼리용
CREATE INDEX IF NOT EXISTS idx_record_events_user_event_created
  ON record_events (user_id, event, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_record_events_event_created
  ON record_events (event, created_at DESC);

-- RLS — service_role 전용 (서버 액션에서 admin 클라이언트로 INSERT)
--      클라이언트에서 직접 접근 차단 (개인정보 흐름 추적용)
ALTER TABLE record_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY record_events_service_only_select ON record_events
    FOR SELECT TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY record_events_service_only_insert ON record_events
    FOR INSERT TO service_role WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 인증 사용자가 본인 이벤트는 조회 가능 (선택 — 디버깅·통계용)
DO $$ BEGIN
  CREATE POLICY record_events_select_own ON record_events
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- END OF MIGRATION
-- 롤백:
--   DROP POLICY IF EXISTS record_events_select_own ON record_events;
--   DROP POLICY IF EXISTS record_events_service_only_insert ON record_events;
--   DROP POLICY IF EXISTS record_events_service_only_select ON record_events;
--   DROP TABLE IF EXISTS record_events;
-- =============================================================================
