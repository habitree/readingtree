-- =====================================================
-- 마이그레이션: users 테이블 약관 동의 컬럼 추가
-- 파일명: migration-202601241500__users__add_consent_columns.sql
-- 설명: 프로그레시브 온보딩을 위한 약관 동의 관련 컬럼 추가
-- =====================================================

-- 1. terms_agreed 컬럼 추가 (이용약관 동의 여부)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS terms_agreed BOOLEAN DEFAULT FALSE;

-- 2. privacy_agreed 컬럼 추가 (개인정보처리방침 동의 여부)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS privacy_agreed BOOLEAN DEFAULT FALSE;

-- 3. consent_date 컬럼 추가 (약관 동의 일시)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS consent_date TIMESTAMPTZ;

-- 4. 기존 사용자 데이터 업데이트 (이미 가입한 사용자는 동의한 것으로 처리)
-- 주석 처리: 실제 운영 시 필요에 따라 실행
-- UPDATE users
-- SET terms_agreed = TRUE,
--     privacy_agreed = TRUE,
--     consent_date = created_at
-- WHERE terms_agreed IS NULL OR terms_agreed = FALSE;

-- 5. 인덱스 추가 (약관 동의 여부 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_users_consent
ON users(terms_agreed, privacy_agreed)
WHERE terms_agreed = FALSE OR privacy_agreed = FALSE;

-- =====================================================
-- 검증 쿼리
-- =====================================================
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'users' AND column_name IN ('terms_agreed', 'privacy_agreed', 'consent_date');
