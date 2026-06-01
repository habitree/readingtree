-- =============================================================================
-- Migration: reading_logs 공개 공유 정책 추가
-- Description:
--   "스탬프 단위 공유 기능" 추가에 따라 reading_logs 의 SELECT 정책을 확장.
--   기존: 본인(auth.uid() = user_id) 만 SELECT
--   추가: is_public = true 인 행은 익명 사용자도 SELECT 가능
--
--   비공개 기록은 종전처럼 본인만 접근. 사용자가 공유 다이얼로그에서 명시적으로
--   "공개" 토글 시 is_public=true 로 UPDATE 되어 anon 클라이언트가 카드/페이지를
--   조회할 수 있게 된다.
--
-- Date: 2026-05-08
-- Idempotent: 정책 DROP IF EXISTS → CREATE
-- =============================================================================

ALTER TABLE reading_logs ENABLE ROW LEVEL SECURITY;

-- 기존 SELECT 정책 제거 후 재생성
DROP POLICY IF EXISTS "reading_logs_select_own" ON reading_logs;
DROP POLICY IF EXISTS "reading_logs_select_own_or_public" ON reading_logs;

-- SELECT: 본인 기록 OR 공개된 스탬프 (anon 포함)
CREATE POLICY "reading_logs_select_own_or_public" ON reading_logs
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR is_public = true
    );

-- INSERT/UPDATE/DELETE 정책은 기존대로 유지 (본인만 가능)
-- migration-202602041000__notes__create_reading_logs.sql 의 정의가 그대로 유효.

COMMENT ON POLICY "reading_logs_select_own_or_public" ON reading_logs IS
    '본인 기록 또는 is_public=true 인 공개 스탬프는 익명 사용자도 조회 가능. 공유 페이지/OG 이미지에서 사용.';

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
