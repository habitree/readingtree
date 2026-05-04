-- =============================================================================
-- Migration: 기존 reading_logs 백필 (status + image_urls)
-- Description: 기록 기능 전면 개편 (Phase 1 / 7)
--              M1 컬럼 추가 후 안전망 백필.
--              - status NULL → 'completed' (DEFAULT가 처리하지만 명시)
--              - image_url 있는 행 → image_urls = jsonb_build_array(image_url)
--              비파괴 (조건부 UPDATE만).
-- Plan: doc/update/기록기획/02-migration.md §M4
-- Date: 2026-05-04
-- Depends on: migration-202605040100 (status·image_urls 컬럼 필요)
-- Idempotent: WHERE 조건으로 재실행 안전
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. status 백필
--    DEFAULT 'completed'로 신규 행은 자동 처리되지만, 만일을 위한 안전망.
-- -----------------------------------------------------------------------------
UPDATE reading_logs
   SET status = 'completed'
 WHERE status IS NULL;

-- -----------------------------------------------------------------------------
-- 2. image_urls 백필
--    image_url이 있고 image_urls가 비어있는 기존 스탬프 행을 1장 배열로 변환.
--    M2 트리거는 INSERT/UPDATE 시점에 동작하므로, 기존 행은 명시적 백필 필요.
-- -----------------------------------------------------------------------------
UPDATE reading_logs
   SET image_urls = jsonb_build_array(image_url)
 WHERE image_url IS NOT NULL
   AND (image_urls IS NULL OR jsonb_array_length(image_urls) = 0);

-- -----------------------------------------------------------------------------
-- 3. 검증 쿼리 (실행 후 수동 확인용)
--    SELECT count(*) FROM reading_logs WHERE status IS NULL;                 -- 0
--    SELECT count(*) FROM reading_logs
--     WHERE image_url IS NOT NULL AND jsonb_array_length(image_urls) = 0;    -- 0
-- -----------------------------------------------------------------------------

-- =============================================================================
-- END OF MIGRATION
-- 롤백: 비파괴 — 명시적 롤백 불필요 (M1 롤백 시 컬럼 자체가 사라짐)
-- =============================================================================
