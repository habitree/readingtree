-- ============================================
-- 마이그레이션: user_books - completed_dates와 reading_reason 컬럼 추가
-- 날짜: 2025-01-18 18:00
-- 작성자: 마이그레이션 스크립트
-- ============================================
-- 
-- 변경 사항:
-- 1. completed_dates 컬럼 추가 (JSONB 배열 - 여러 번 완독한 날짜 저장)
-- 2. reading_reason 컬럼 추가 (VARCHAR(500) - 책을 읽는 이유)
--
-- 영향받는 테이블:
-- - user_books
--
-- 참고:
-- - 기존 프로젝트에서 사용하던 컬럼을 새 프로젝트에도 추가
-- - Idempotent하게 작성되어 여러 번 실행해도 안전
-- ============================================

-- completed_dates 컬럼 추가 (JSONB 배열)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_books' 
        AND column_name = 'completed_dates'
    ) THEN
        ALTER TABLE user_books 
        ADD COLUMN completed_dates JSONB DEFAULT '[]'::jsonb;
        
        -- JSONB 배열 검색 최적화를 위한 GIN 인덱스 생성
        CREATE INDEX IF NOT EXISTS idx_user_books_completed_dates 
        ON user_books USING gin (completed_dates);
        
        RAISE NOTICE 'completed_dates 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'completed_dates 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- reading_reason 컬럼 추가 (VARCHAR)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_books' 
        AND column_name = 'reading_reason'
    ) THEN
        ALTER TABLE user_books 
        ADD COLUMN reading_reason VARCHAR(500);
        
        RAISE NOTICE 'reading_reason 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'reading_reason 컬럼이 이미 존재합니다.';
    END IF;
END $$;
