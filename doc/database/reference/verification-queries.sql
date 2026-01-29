-- ============================================
-- 스키마 검증 쿼리
-- ============================================
-- 이 파일의 쿼리들을 Supabase SQL Editor에서 실행하여
-- 스키마가 올바르게 적용되었는지 확인하세요.
-- ============================================

-- ============================================
-- 1. ENUM 타입 확인
-- ============================================
SELECT typname, typtype 
FROM pg_type 
WHERE typtype = 'e' 
AND typname IN ('reading_status', 'note_type', 'member_role', 'member_status')
ORDER BY typname;

-- 예상 결과: 4개의 ENUM 타입이 반환되어야 합니다.

-- ============================================
-- 2. 테이블 확인
-- ============================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'books', 'user_books', 'notes', 'groups', 'group_members', 'group_books', 'group_notes')
ORDER BY table_name;

-- 예상 결과: 8개의 테이블이 반환되어야 합니다.

-- ============================================
-- 3. 인덱스 확인
-- ============================================
-- 기본 인덱스 확인
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Full-text Search 인덱스 확인
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname IN ('idx_books_title_fts', 'idx_books_author_fts', 'idx_notes_content_fts');

-- 태그 인덱스 확인
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname = 'idx_notes_tags';

-- ============================================
-- 4. RLS 정책 확인
-- ============================================
-- 모든 RLS 정책 확인
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- 테이블별 RLS 활성화 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'books', 'user_books', 'notes', 'groups', 'group_members', 'group_books', 'group_notes')
ORDER BY tablename;

-- 예상 결과:
-- - users: rls_enabled = true
-- - books: rls_enabled = false (공개 데이터)
-- - user_books: rls_enabled = true
-- - notes: rls_enabled = true
-- - groups: rls_enabled = true
-- - group_members: rls_enabled = true
-- - group_books: rls_enabled = true
-- - group_notes: rls_enabled = true

-- ============================================
-- 5. 함수 확인
-- ============================================
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
AND routine_name IN (
    'update_updated_at_column',
    'handle_new_user',
    'get_user_completed_books_count',
    'get_user_notes_count_this_week'
)
ORDER BY routine_name;

-- 예상 결과: 4개의 함수가 반환되어야 합니다.

-- ============================================
-- 6. 트리거 확인
-- ============================================
SELECT 
    trigger_name, 
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name IN (
    'update_users_updated_at',
    'update_books_updated_at',
    'update_user_books_updated_at',
    'update_notes_updated_at',
    'update_groups_updated_at',
    'on_auth_user_created'
)
ORDER BY event_object_table, trigger_name;

-- 예상 결과: 6개의 트리거가 반환되어야 합니다.

-- ============================================
-- 7. 외래 키 제약조건 확인
-- ============================================
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- 8. 통계 확인
-- ============================================
-- 전체 테이블 수
SELECT COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- 전체 인덱스 수
SELECT COUNT(*) as total_indexes
FROM pg_indexes 
WHERE schemaname = 'public';

-- 전체 RLS 정책 수
SELECT COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public';

-- 전체 함수 수
SELECT COUNT(*) as total_functions
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';

-- 전체 트리거 수
SELECT COUNT(*) as total_triggers
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- ============================================
-- 검증 완료
-- ============================================
-- 위 쿼리들을 모두 실행하여 예상 결과와 일치하는지 확인하세요.
-- 모든 항목이 예상대로 반환되면 스키마가 올바르게 적용된 것입니다.
-- ============================================

