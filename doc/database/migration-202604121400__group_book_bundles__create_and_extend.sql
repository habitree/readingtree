-- ============================================
-- Migration: group_book_bundles 테이블 생성 + group_books 확장
-- Date: 2026-04-12
-- Description:
--   1. group_book_bundles 테이블 생성 (지정도서 묶음 관리)
--   2. group_books에 description, links, bundle_id, sort_order 컬럼 추가
--   3. RLS 정책 설정
--
-- 영향받는 테이블:
--   - group_book_bundles (신규)
--   - group_books (컬럼 추가)
-- ============================================

-- ============================================
-- 1. group_book_bundles 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS group_book_bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_book_bundles_group_id
    ON group_book_bundles(group_id);

-- ============================================
-- 2. group_books 컬럼 추가
-- ============================================
ALTER TABLE group_books ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE group_books ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::jsonb;
ALTER TABLE group_books ADD COLUMN IF NOT EXISTS bundle_id UUID
    REFERENCES group_book_bundles(id) ON DELETE SET NULL;
ALTER TABLE group_books ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_group_books_bundle_id
    ON group_books(bundle_id) WHERE bundle_id IS NOT NULL;

-- ============================================
-- 3. group_book_bundles RLS
-- ============================================
ALTER TABLE group_book_bundles ENABLE ROW LEVEL SECURITY;

-- SELECT: 리더, 공개 그룹, 승인된 멤버
DROP POLICY IF EXISTS "Members can view group book bundles" ON group_book_bundles;
CREATE POLICY "Members can view group book bundles"
    ON group_book_bundles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM groups
            WHERE id = group_book_bundles.group_id
            AND leader_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM groups
            WHERE id = group_book_bundles.group_id
            AND is_public = TRUE
        )
        OR
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_id = group_book_bundles.group_id
            AND user_id = auth.uid()
            AND status = 'approved'
        )
    );

-- INSERT: 리더만
DROP POLICY IF EXISTS "Leaders can add group book bundles" ON group_book_bundles;
CREATE POLICY "Leaders can add group book bundles"
    ON group_book_bundles FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT leader_id FROM groups WHERE id = group_book_bundles.group_id
        )
    );

-- UPDATE: 리더만
DROP POLICY IF EXISTS "Leaders can update group book bundles" ON group_book_bundles;
CREATE POLICY "Leaders can update group book bundles"
    ON group_book_bundles FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT leader_id FROM groups WHERE id = group_book_bundles.group_id
        )
    );

-- DELETE: 리더만
DROP POLICY IF EXISTS "Leaders can delete group book bundles" ON group_book_bundles;
CREATE POLICY "Leaders can delete group book bundles"
    ON group_book_bundles FOR DELETE
    USING (
        auth.uid() IN (
            SELECT leader_id FROM groups WHERE id = group_book_bundles.group_id
        )
    );
