-- =============================================================================
-- Migration: reading_logs 테이블 생성
-- Description: 진행 기록을 별도 테이블로 분리하여 관리
-- Date: 2026-02-04
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. reading_logs 테이블 생성
-- 진행 체크 기록을 저장하는 전용 테이블
-- 기존 notes 테이블의 progress 타입과 분리하여 관리
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reading_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_book_id UUID NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL CHECK (page_number >= 0),
    memo TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 테이블 코멘트
COMMENT ON TABLE reading_logs IS '독서 진행 기록 테이블 - 페이지 업데이트 시 자동 생성';
COMMENT ON COLUMN reading_logs.id IS '진행 기록 고유 ID';
COMMENT ON COLUMN reading_logs.user_id IS '사용자 ID';
COMMENT ON COLUMN reading_logs.user_book_id IS '사용자 책 ID (user_books 참조)';
COMMENT ON COLUMN reading_logs.page_number IS '기록 시점의 페이지 번호';
COMMENT ON COLUMN reading_logs.memo IS '한줄 메모 (선택)';
COMMENT ON COLUMN reading_logs.is_public IS '공개 여부';
COMMENT ON COLUMN reading_logs.created_at IS '생성 시간';
COMMENT ON COLUMN reading_logs.updated_at IS '수정 시간';

-- -----------------------------------------------------------------------------
-- 2. 인덱스 생성
-- -----------------------------------------------------------------------------
-- 사용자별 진행 기록 조회 최적화
CREATE INDEX IF NOT EXISTS idx_reading_logs_user_id ON reading_logs(user_id);

-- 책별 진행 기록 조회 최적화
CREATE INDEX IF NOT EXISTS idx_reading_logs_user_book_id ON reading_logs(user_book_id);

-- 시간순 조회 최적화
CREATE INDEX IF NOT EXISTS idx_reading_logs_created_at ON reading_logs(created_at DESC);

-- 사용자 + 책 복합 인덱스 (가장 많이 사용되는 쿼리 패턴)
CREATE INDEX IF NOT EXISTS idx_reading_logs_user_book ON reading_logs(user_id, user_book_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 3. RLS (Row Level Security) 활성화
-- -----------------------------------------------------------------------------
ALTER TABLE reading_logs ENABLE ROW LEVEL SECURITY;

-- 기존 정책 제거 (idempotent)
DROP POLICY IF EXISTS "reading_logs_select_own" ON reading_logs;
DROP POLICY IF EXISTS "reading_logs_insert_own" ON reading_logs;
DROP POLICY IF EXISTS "reading_logs_update_own" ON reading_logs;
DROP POLICY IF EXISTS "reading_logs_delete_own" ON reading_logs;

-- 4가지 기본 정책 생성
-- SELECT: 본인 기록만 조회 가능
CREATE POLICY "reading_logs_select_own" ON reading_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: 본인 기록만 생성 가능
CREATE POLICY "reading_logs_insert_own" ON reading_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: 본인 기록만 수정 가능
CREATE POLICY "reading_logs_update_own" ON reading_logs
    FOR UPDATE
    USING (auth.uid() = user_id);

-- DELETE: 본인 기록만 삭제 가능
CREATE POLICY "reading_logs_delete_own" ON reading_logs
    FOR DELETE
    USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 4. updated_at 자동 업데이트 트리거
-- -----------------------------------------------------------------------------
-- 트리거 함수 (이미 존재하면 재사용)
CREATE OR REPLACE FUNCTION update_reading_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (idempotent)
DROP TRIGGER IF EXISTS set_reading_logs_updated_at ON reading_logs;
CREATE TRIGGER set_reading_logs_updated_at
    BEFORE UPDATE ON reading_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_reading_logs_updated_at();

-- -----------------------------------------------------------------------------
-- 5. 기존 progress 타입 데이터 마이그레이션 (선택적)
-- 기존 notes 테이블의 progress 타입 데이터를 reading_logs로 이전
-- 주의: 이 작업은 한 번만 실행해야 합니다.
-- -----------------------------------------------------------------------------
-- 마이그레이션 실행 여부를 확인하는 플래그 테이블 (선택적)
-- CREATE TABLE IF NOT EXISTS migration_flags (
--     migration_name VARCHAR(255) PRIMARY KEY,
--     executed_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- 마이그레이션 실행 (idempotent - 이미 마이그레이션된 경우 스킵)
-- INSERT INTO reading_logs (user_id, user_book_id, page_number, memo, is_public, created_at, updated_at)
-- SELECT
--     n.user_id,
--     ub.id as user_book_id,
--     COALESCE(CAST(NULLIF(n.page_number, '') AS INTEGER), 0) as page_number,
--     CASE
--         WHEN n.content IS NOT NULL AND n.content::jsonb ? 'memo'
--         THEN n.content::jsonb->>'memo'
--         ELSE NULL
--     END as memo,
--     n.is_public,
--     n.created_at,
--     n.updated_at
-- FROM notes n
-- JOIN user_books ub ON ub.book_id = n.book_id AND ub.user_id = n.user_id
-- WHERE n.type = 'progress'
-- AND NOT EXISTS (
--     SELECT 1 FROM reading_logs rl
--     WHERE rl.user_id = n.user_id
--     AND rl.user_book_id = ub.id
--     AND rl.created_at = n.created_at
-- );

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
