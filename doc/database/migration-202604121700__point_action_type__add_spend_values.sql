-- ============================================
-- Migration: point_action_type enum에 spend 값 추가
-- Date: 2026-04-12
-- Description: 포인트 소비 기능에 필요한 enum 값이 DB에 누락되어 추가
--   group_create_spend, group_join_spend, bookshelf_create_spend, note_create_spend
-- ============================================

ALTER TYPE point_action_type ADD VALUE IF NOT EXISTS 'group_create_spend';
ALTER TYPE point_action_type ADD VALUE IF NOT EXISTS 'group_join_spend';
ALTER TYPE point_action_type ADD VALUE IF NOT EXISTS 'bookshelf_create_spend';
ALTER TYPE point_action_type ADD VALUE IF NOT EXISTS 'note_create_spend';
