-- ============================================
-- completed_dates 컬럼 확인 쿼리
-- ============================================
-- 
-- 이 쿼리를 Supabase SQL Editor에서 실행하여
-- 마이그레이션이 제대로 적용되었는지 확인하세요.
-- ============================================

-- 1. 컬럼 존재 여부 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_books'
  AND column_name = 'completed_dates';

-- 2. 인덱스 확인
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'user_books'
  AND indexname = 'idx_user_books_completed_dates';

-- 3. 샘플 데이터 확인 (completed_dates가 있는 레코드)
SELECT 
    id,
    user_id,
    completed_at,
    completed_dates,
    jsonb_typeof(completed_dates) as dates_type,
    jsonb_array_length(completed_dates) as dates_count
FROM user_books
WHERE completed_dates IS NOT NULL
LIMIT 5;

-- 4. 모든 user_books 레코드의 completed_dates 상태 확인
SELECT 
    COUNT(*) as total_records,
    COUNT(completed_dates) as has_completed_dates,
    COUNT(CASE WHEN completed_dates = '[]'::jsonb THEN 1 END) as empty_dates,
    COUNT(CASE WHEN jsonb_array_length(completed_dates) > 0 THEN 1 END) as has_dates
FROM user_books;

