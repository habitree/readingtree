-- ============================================
-- Migration: groups 테이블에 content, links 컬럼 추가
-- Date: 2026-04-12
-- Description: 독서모임 개요에 텍스트 내용 + 참고 링크 기능 추가
-- ============================================

ALTER TABLE groups ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::jsonb;
