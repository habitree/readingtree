-- ============================================
-- Migration: group_book_bundles에 links 컬럼 추가
-- Date: 2026-04-12
-- Description: 컬렉션에 참고 링크(JSONB) 추가
-- ============================================

ALTER TABLE group_book_bundles ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::jsonb;
