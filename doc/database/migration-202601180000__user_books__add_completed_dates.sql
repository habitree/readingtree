-- ============================================
-- 마이그레이션: user_books - completed_dates 컬럼 추가
-- 날짜: 2026-01-18
-- 작성자: 시스템
-- ============================================
-- 
-- 변경 사항:
-- 1. user_books 테이블에 completed_dates JSONB 컬럼 추가
-- 2. 여러 개의 완독일자를 배열로 저장할 수 있도록 함
-- 3. 기존 completed_at 컬럼은 유지 (하위 호환성)
--
-- 영향받는 테이블:
-- - user_books
--
-- 참고:
-- - completed_dates는 문자열 배열 형태로 저장 (ISO 8601 형식)
-- - 예: ["2024-01-15T00:00:00Z", "2024-06-20T00:00:00Z"]
-- ============================================

-- completed_dates JSONB 컬럼 추가
ALTER TABLE user_books 
ADD COLUMN IF NOT EXISTS completed_dates JSONB DEFAULT '[]'::jsonb;

-- 인덱스 추가 (JSONB 배열 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_user_books_completed_dates 
ON user_books USING gin (completed_dates);

-- 기존 completed_at 값이 있으면 completed_dates 배열에 추가
UPDATE user_books
SET completed_dates = jsonb_build_array(completed_at::text)
WHERE completed_at IS NOT NULL 
  AND (completed_dates IS NULL OR completed_dates = '[]'::jsonb);
