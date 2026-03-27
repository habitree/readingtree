-- =====================================================
-- Migration: groups 테이블에 join_type ENUM 추가
-- Date: 2026-03-27
-- Description: is_public boolean → join_type ENUM 전환 (1단계)
--   open: 자유 가입 (누구나 즉시 승인)
--   approval: 승인제 (관리자 승인 필요)
--   private: 완전 비공개 (초대만 가능)
-- =====================================================

-- 1. join_type ENUM 타입 생성
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'join_type') THEN
        CREATE TYPE join_type AS ENUM ('open', 'approval', 'private');
    END IF;
END
$$;

-- 2. groups 테이블에 join_type 컬럼 추가
ALTER TABLE groups ADD COLUMN IF NOT EXISTS join_type join_type NOT NULL DEFAULT 'approval';

-- 3. 기존 데이터 마이그레이션: is_public=true → 'open', is_public=false → 'approval'
UPDATE groups SET join_type = 'open' WHERE is_public = true AND join_type = 'approval';
-- is_public=false인 경우는 이미 default 'approval'이므로 변환 불필요

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_groups_join_type ON groups(join_type);

-- 5. is_public 컬럼은 코드 전환 완료 후 별도 마이그레이션에서 제거
-- (하위 호환성 유지를 위해 이 단계에서는 유지)

-- 6. is_public 컬럼을 join_type과 동기화하는 트리거 (전환 기간용)
CREATE OR REPLACE FUNCTION sync_is_public_from_join_type()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.join_type = 'open' THEN
        NEW.is_public = true;
    ELSE
        NEW.is_public = false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_is_public ON groups;
CREATE TRIGGER trg_sync_is_public
    BEFORE INSERT OR UPDATE OF join_type ON groups
    FOR EACH ROW
    EXECUTE FUNCTION sync_is_public_from_join_type();
