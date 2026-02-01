-- ============================================================================
-- 마이그레이션: note_type enum에 'progress' 타입 추가
-- 목적: 읽기 진행률 기록을 위한 새로운 노트 타입 추가
-- 작성일: 2026-02-01
-- ============================================================================

-- note_type enum에 'progress' 값 추가
-- PostgreSQL에서 enum에 새 값을 추가하는 방법
DO $$
BEGIN
    -- 'progress' 값이 이미 존재하는지 확인
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'progress'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'note_type')
    ) THEN
        ALTER TYPE note_type ADD VALUE 'progress';
    END IF;
END $$;

-- 확인 쿼리 (실행 후 확인용)
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'note_type');
