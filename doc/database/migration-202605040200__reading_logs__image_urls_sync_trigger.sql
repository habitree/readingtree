-- =============================================================================
-- Migration: reading_logs image_urls ↔ image_url 동기화 트리거
-- Description: 기록 기능 전면 개편 (Phase 1 / 7)
--              다중 사진(image_urls JSONB)과 단일 사진(image_url)을 양방향
--              동기화. 클라이언트는 image_urls만 set해도 /stamps 쿼리
--              (WHERE image_url IS NOT NULL)가 그대로 동작.
--              image_url NULL→NOT NULL 첫 전환 시 promoted_at 자동 설정
--              (DB 안전망 — 코드의 attachStampToLog 분기 이중화).
-- Plan: doc/update/기록기획/01-data-model.md §2.4, 02-migration.md §M2
-- Date: 2026-05-04
-- Depends on: migration-202605040100 (image_urls 컬럼 필요)
-- Idempotent: CREATE OR REPLACE FUNCTION + DROP/CREATE TRIGGER
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. 동기화 함수
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reading_logs_sync_image_url()
RETURNS TRIGGER AS $$
BEGIN
  -- (A) image_urls가 비어있지 않으면 첫 장을 image_url로 미러링
  IF jsonb_typeof(NEW.image_urls) = 'array' AND jsonb_array_length(NEW.image_urls) > 0 THEN
    NEW.image_url := NEW.image_urls->>0;

  -- (B) image_url만 set한 경우 image_urls도 1장으로 미러링 (호환)
  ELSIF NEW.image_url IS NOT NULL AND
        (NEW.image_urls IS NULL OR jsonb_array_length(NEW.image_urls) = 0) THEN
    NEW.image_urls := jsonb_build_array(NEW.image_url);
  END IF;

  -- (C) image_url NULL → NOT NULL 첫 전환 시 promoted_at 자동 설정
  --     (코드의 attachStampToLog 첫 승격 로직을 DB 안전망으로 이중화)
  IF (TG_OP = 'UPDATE') AND OLD.image_url IS NULL AND NEW.image_url IS NOT NULL
     AND NEW.promoted_at IS NULL THEN
    NEW.promoted_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reading_logs_sync_image_url() IS
  'image_urls[0] ↔ image_url 양방향 동기. image_url 첫 set 시 promoted_at 자동.';

-- -----------------------------------------------------------------------------
-- 2. 트리거 (BEFORE INSERT/UPDATE)
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_reading_logs_sync_image_url ON reading_logs;

CREATE TRIGGER trg_reading_logs_sync_image_url
  BEFORE INSERT OR UPDATE OF image_urls, image_url ON reading_logs
  FOR EACH ROW
  EXECUTE FUNCTION reading_logs_sync_image_url();

-- =============================================================================
-- END OF MIGRATION
-- 롤백:
--   DROP TRIGGER IF EXISTS trg_reading_logs_sync_image_url ON reading_logs;
--   DROP FUNCTION IF EXISTS reading_logs_sync_image_url();
-- =============================================================================
