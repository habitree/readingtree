-- =============================================================================
-- Migration: reading_logs 세션 컬럼 추가
-- Description: 기록 기능 전면 개편 (Phase 1 / 7)
--              세션 모델로 통합 — 시작/종료 상태(status), 다음 시작점 북마크,
--              다중 사진(image_urls JSONB), 멱등키(client_session_id) 도입.
--              스탬프 정의(image_url IS NOT NULL AND promoted_at IS NOT NULL)는
--              불변 유지. /stamps 쿼리 영향 0.
-- Plan: doc/update/기록기획/01-data-model.md §2, 02-migration.md §M1
-- Date: 2026-05-04
-- Idempotent: ADD COLUMN IF NOT EXISTS / DO $$ ... duplicate_object 보호
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. 세션 상태 컬럼
--    status: in_progress(진행 중) | completed(완료, 기존 행 포함) | abandoned(취소·12h orphan)
-- -----------------------------------------------------------------------------
ALTER TABLE reading_logs
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed';

DO $$ BEGIN
  ALTER TABLE reading_logs
    ADD CONSTRAINT reading_logs_status_check
    CHECK (status IN ('in_progress','completed','abandoned'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN reading_logs.status IS
  '세션 상태: in_progress | completed | abandoned. 기존 행은 모두 completed.';

-- -----------------------------------------------------------------------------
-- 2. 북마크 컬럼 (D1: 다음 시작점 한 줄 메모)
-- -----------------------------------------------------------------------------
ALTER TABLE reading_logs
  ADD COLUMN IF NOT EXISTS bookmark_text TEXT,
  ADD COLUMN IF NOT EXISTS bookmark_page INTEGER;

DO $$ BEGIN
  ALTER TABLE reading_logs
    ADD CONSTRAINT reading_logs_bookmark_text_len
    CHECK (bookmark_text IS NULL OR char_length(bookmark_text) <= 200);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE reading_logs
    ADD CONSTRAINT reading_logs_bookmark_page_check
    CHECK (bookmark_page IS NULL OR bookmark_page >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN reading_logs.bookmark_text IS '다음 시작점 한 줄 메모 (≤200자, D1)';
COMMENT ON COLUMN reading_logs.bookmark_page IS '북마크 페이지 (≥0, D1)';

-- -----------------------------------------------------------------------------
-- 3. 다중 사진 (≤5장, 첫 장 = image_url 미러링은 M2 트리거가 처리)
-- -----------------------------------------------------------------------------
ALTER TABLE reading_logs
  ADD COLUMN IF NOT EXISTS image_urls JSONB NOT NULL DEFAULT '[]'::jsonb;

DO $$ BEGIN
  ALTER TABLE reading_logs
    ADD CONSTRAINT reading_logs_image_urls_count
    CHECK (jsonb_typeof(image_urls) = 'array' AND jsonb_array_length(image_urls) <= 5);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN reading_logs.image_urls IS
  '사진 URL 배열 (≤5장). 첫 장 = 대표 = image_url. M2 트리거가 동기화.';

-- -----------------------------------------------------------------------------
-- 4. 멱등키 + 진단 컬럼
-- -----------------------------------------------------------------------------
ALTER TABLE reading_logs
  ADD COLUMN IF NOT EXISTS client_session_id UUID,
  ADD COLUMN IF NOT EXISTS app_version TEXT;

COMMENT ON COLUMN reading_logs.client_session_id IS
  '클라이언트 멱등키 (사용자별 유니크). 다중 탭 race 방지.';
COMMENT ON COLUMN reading_logs.app_version IS '진단용 앱 버전 (web@1.4.2 등)';

-- -----------------------------------------------------------------------------
-- 5. 부분 인덱스
--    - in_progress 조회 가속 (Active Pill, getActiveSession)
--    - D2: 사용자당 진행 중 1개 강제 (UNIQUE 부분 인덱스)
--    - 멱등키 사용자별 유니크
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_reading_logs_in_progress
  ON reading_logs (user_id, started_at DESC)
  WHERE status = 'in_progress';

CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_logs_one_active
  ON reading_logs (user_id)
  WHERE status = 'in_progress';

CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_logs_client_session_id
  ON reading_logs (user_id, client_session_id)
  WHERE client_session_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 6. RLS — 정책 추가 없음 (기존 4개 정책이 신규 컬럼 자동 보호)
-- -----------------------------------------------------------------------------

-- =============================================================================
-- END OF MIGRATION
-- 롤백: doc/update/기록기획/02-migration.md §M1 롤백 절차 참조
-- =============================================================================
