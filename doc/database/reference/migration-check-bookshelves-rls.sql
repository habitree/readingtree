-- ============================================
-- 마이그레이션: bookshelves RLS 정책 확인 및 수정
-- 날짜: 2026-01-15
-- 작성자: 시스템
-- ============================================
-- 
-- 변경 사항:
-- 1. bookshelves 테이블의 RLS 활성화 확인
-- 2. RLS 정책 확인 및 재생성 (idempotent)
-- 3. 권한 문제 해결
--
-- 영향받는 테이블:
-- - bookshelves
--
-- 참고:
-- - 일반 사용자가 서재를 추가할 수 없는 문제 해결
-- ============================================

-- 1. RLS 활성화 확인 및 활성화
ALTER TABLE bookshelves ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 삭제 (idempotent)
DROP POLICY IF EXISTS "Users can view own bookshelves or public bookshelves" ON bookshelves;
DROP POLICY IF EXISTS "Users can insert own bookshelves" ON bookshelves;
DROP POLICY IF EXISTS "Users can update own bookshelves" ON bookshelves;
DROP POLICY IF EXISTS "Users can delete own bookshelves" ON bookshelves;

-- 3. RLS 정책 재생성

-- SELECT: 자신의 서재 또는 공개 서재 조회 가능
CREATE POLICY "Users can view own bookshelves or public bookshelves"
    ON bookshelves FOR SELECT
    USING (
        auth.uid() = user_id 
        OR is_public = TRUE
    );

-- INSERT: 자신의 서재만 생성 가능
CREATE POLICY "Users can insert own bookshelves"
    ON bookshelves FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: 자신의 서재만 수정 가능
CREATE POLICY "Users can update own bookshelves"
    ON bookshelves FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: 자신의 서재만 삭제 가능 (메인 서재는 삭제 불가)
CREATE POLICY "Users can delete own bookshelves"
    ON bookshelves FOR DELETE
    USING (
        auth.uid() = user_id 
        AND is_main = FALSE
    );

-- 4. RLS 정책 확인 쿼리 (실행 후 확인용)
-- SELECT 
--     schemaname,
--     tablename,
--     policyname,
--     permissive,
--     roles,
--     cmd,
--     qual,
--     with_check
-- FROM pg_policies
-- WHERE schemaname = 'public' 
--     AND tablename = 'bookshelves'
-- ORDER BY policyname;
