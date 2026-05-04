-- =============================================================================
-- Migration: record_events.event CHECK 제약에 'music_attached' 추가 (Phase 8.C)
-- Description: 진행 중 세션에 음악 추가/변경/정지 이벤트 추적.
--              attachMusicToSession 액션 호출 시 발송.
-- Plan: ~/.claude/plans/foamy-frolicking-lightning.md (Phase 8.C)
-- Date: 2026-05-05
-- Idempotent: DROP CONSTRAINT IF EXISTS + 재생성
-- =============================================================================

-- 기존 CHECK 제약 제거
ALTER TABLE record_events
  DROP CONSTRAINT IF EXISTS record_events_event_check;

-- 새 CHECK 제약 (music_attached 추가)
ALTER TABLE record_events
  ADD CONSTRAINT record_events_event_check
  CHECK (event IN (
    'record_started',
    'record_ended',
    'record_abandoned',
    'detail_added',
    'music_attached'
  ));

-- =============================================================================
-- END OF MIGRATION
-- 롤백:
--   ALTER TABLE record_events DROP CONSTRAINT IF EXISTS record_events_event_check;
--   ALTER TABLE record_events
--     ADD CONSTRAINT record_events_event_check
--     CHECK (event IN ('record_started','record_ended','record_abandoned','detail_added'));
--   (기존 music_attached 행이 있으면 DELETE 또는 보존 — Phase 8.C 이전 데이터 없음)
-- =============================================================================
