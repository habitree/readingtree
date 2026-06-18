-- =========================================================================
-- Migration: notifications / drop_table
-- Date: 2026-06-18
--
-- 인앱 알림 시스템 제거. migration-202604180001 (notifications/create_table) 역방향.
--   1) supabase_realtime publication 에서 notifications 제거
--   2) public.notifications 테이블 제거 (인덱스 + RLS 4정책 동반 삭제)
--   3) public.users.notification_prefs 컬럼 제거
--
-- Idempotent: 모든 단계 IF EXISTS 가드.
-- 주의: 프로덕션 단일 DB. 적용 시 알림 데이터 영구 삭제(복구 불가).
-- =========================================================================

-- 1) Realtime publication 에서 제거 (테이블 DROP 전, 존재 시)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'notifications'
     ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;
  END IF;
END $$;

-- 2) 테이블 제거 (CASCADE: 인덱스 idx_notifications_*, RLS 4정책, FK 동반 삭제)
DROP TABLE IF EXISTS public.notifications CASCADE;

-- 3) users.notification_prefs (알림 타입별 토글) 컬럼 제거
ALTER TABLE public.users DROP COLUMN IF EXISTS notification_prefs;
