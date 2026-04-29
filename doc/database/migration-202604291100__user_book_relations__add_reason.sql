-- =============================================
-- 마이그레이션: user_book_relations.reason 컬럼 추가
-- 버전: 202604291100
-- 설명: 관리자가 입력하는 연결 사유를 저장하기 위한 컬럼.
--       사용자측 UI는 변경 없음(NULL 허용). admin 전용으로 운영.
-- =============================================

ALTER TABLE user_book_relations
    ADD COLUMN IF NOT EXISTS reason TEXT;

COMMENT ON COLUMN user_book_relations.reason IS '관리자가 입력한 연결 사유 (admin 전용, NULL 허용)';
