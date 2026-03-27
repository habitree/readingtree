-- =====================================================
-- Migration: 사용자 프로필 확장 (인생책, 좋아하는 문구, 공개/비공개)
-- Date: 2026-03-27
-- =====================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS favorite_book text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS favorite_quote text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_profile_public boolean NOT NULL DEFAULT true;
