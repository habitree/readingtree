-- ============================================
-- 마이그레이션: member_role ENUM에 moderator 추가
-- 날짜: 2026-01-29 20:00
-- ============================================
--
-- 변경 사항:
-- 1. member_role ENUM에 'moderator' 값 추가
--    - 기존: 'leader', 'member'
--    - 변경: 'leader', 'moderator', 'member'
--
-- 목적:
-- - 부리더(moderator) 역할 지원
-- - 리더 외에도 멤버 관리 권한을 가진 역할 필요
--
-- 영향받는 테이블:
-- - group_members (role 컬럼)
-- ============================================

-- member_role ENUM에 'moderator' 값 추가
-- PostgreSQL에서 ENUM에 새 값을 추가하는 방법
DO $$
BEGIN
    -- 'moderator' 값이 없는 경우에만 추가
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'moderator'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'member_role')
    ) THEN
        ALTER TYPE member_role ADD VALUE 'moderator' AFTER 'leader';
    END IF;
END $$;

-- ============================================
-- 주의사항:
-- - ENUM 값 추가는 트랜잭션 내에서 즉시 사용 불가
-- - 마이그레이션 적용 후 별도 커밋 필요
-- ============================================
