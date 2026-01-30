-- ============================================
-- 마이그레이션: users - AI 기능 활성화 플래그 추가
-- 날짜: 2026-01-30 14:30
-- ============================================
--
-- 변경 사항:
-- 1. users 테이블에 ai_enabled 컬럼 추가 (기본값: false)
--    - AI 챗봇 기능을 설정에서 활성화한 사용자만 접근 가능
--
-- 영향받는 테이블:
-- - users
-- ============================================

-- AI 기능 활성화 플래그 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT false;

-- 컬럼 코멘트
COMMENT ON COLUMN users.ai_enabled IS 'AI 챗봇 기능 활성화 여부 (설정에서 활성화)';
