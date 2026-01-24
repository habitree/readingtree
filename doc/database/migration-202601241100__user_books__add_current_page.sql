-- ============================================
-- 읽기 진행률 기능 마이그레이션
-- ============================================
-- 작성일: 2026-01-24
-- 목적: user_books 테이블에 현재 읽은 페이지 추적 컬럼 추가
-- ============================================

-- 1. current_page 컬럼 추가 (현재 읽은 페이지)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_books'
        AND column_name = 'current_page'
    ) THEN
        ALTER TABLE user_books
        ADD COLUMN current_page INTEGER DEFAULT 0;

        -- 음수 값 방지
        ALTER TABLE user_books
        ADD CONSTRAINT user_books_current_page_positive
        CHECK (current_page >= 0);

        COMMENT ON COLUMN user_books.current_page IS '현재 읽은 페이지 (0부터 시작, 진행률 계산에 사용)';
    END IF;
END $$;

-- 2. 인덱스 추가 (진행률 기반 조회용)
CREATE INDEX IF NOT EXISTS idx_user_books_current_page
ON user_books(current_page)
WHERE current_page > 0;

-- 3. 진행률 기반 복합 인덱스 (사용자별 진행 중인 책 조회)
CREATE INDEX IF NOT EXISTS idx_user_books_user_progress
ON user_books(user_id, status, current_page)
WHERE status = 'reading';

-- ============================================
-- 마이그레이션 완료
-- ============================================
--
-- 사용 예시:
-- - 진행률 계산: (current_page / books.total_pages) * 100
-- - 읽기 중인 책 조회: SELECT * FROM user_books WHERE status = 'reading' AND current_page > 0
--
-- 주의사항:
-- - books.total_pages가 NULL인 경우 진행률 표시 불가 (UI에서 처리)
-- - current_page가 total_pages보다 클 수 있음 (증보판 등)
-- ============================================
