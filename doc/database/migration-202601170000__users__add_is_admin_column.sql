-- ============================================
-- 마이그레이션: users - is_admin 컬럼 추가
-- 날짜: 2026-01-17 00:00
-- 작성자: 시스템
-- ============================================
-- 
-- 변경 사항:
-- 1. users 테이블에 is_admin 컬럼 추가 (BOOLEAN, DEFAULT FALSE)
-- 2. is_admin 인덱스 추가 (관리자 조회 최적화)
-- 3. 기존 관리자 이메일(cdhnaya@kakao.com)에 is_admin = TRUE 설정
-- 4. is_admin_user() 함수 수정 (이메일 하드코딩 제거, users.is_admin 사용)
--
-- 영향받는 테이블:
-- - users (수정)
--
-- 영향받는 함수:
-- - is_admin_user() (수정)
--
-- 참고:
-- - 관리자 권한을 데이터베이스에서 직접 관리 가능
-- - 코드에 하드코딩된 이메일 제거
-- ============================================

-- 1. users 테이블에 is_admin 컬럼 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. 인덱스 추가 (관리자 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;

-- 3. 기존 관리자 설정 (마이그레이션용)
UPDATE users 
SET is_admin = TRUE 
WHERE email = 'cdhnaya@kakao.com';

-- 4. is_admin_user() 함수 수정
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND is_admin = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
