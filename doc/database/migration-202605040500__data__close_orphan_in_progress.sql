-- =============================================================================
-- Migration: 12시간 이상 in_progress 세션 자동 abandoned 전환
-- Description: 기록 기능 전면 개편 (Phase 6 / 7)
--              사용자가 종료를 누르지 않고 떠난 in_progress 세션을 정리.
--              - D2(사용자당 1세션) unique 인덱스 위반 누적 방지
--              - 인디케이터에 12h 넘은 stale 세션 노출 차단
--              일회성 정리 + 향후 daily cron 후보.
-- Plan: doc/update/기록기획/phases/phase-6-cleanup.md
-- Date: 2026-05-04
-- Idempotent: WHERE 조건으로 재실행 안전 (이미 abandoned면 noop)
-- =============================================================================

UPDATE reading_logs
   SET status = 'abandoned',
       ended_at = COALESCE(ended_at, started_at + INTERVAL '12 hours'),
       updated_at = NOW()
 WHERE status = 'in_progress'
   AND started_at < NOW() - INTERVAL '12 hours';

-- 검증 쿼리 (실행 후 수동):
--   SELECT count(*) FROM reading_logs
--    WHERE status = 'in_progress' AND started_at < NOW() - INTERVAL '12 hours';
--   → 0 이어야 함

-- =============================================================================
-- END OF MIGRATION
-- 롤백: 비파괴 — abandoned 행 식별 후 status='completed' 되돌리기 가능
--   UPDATE reading_logs SET status='completed' WHERE status='abandoned' AND updated_at >= '<적용시각>';
-- =============================================================================
