-- =========================================================================
-- Migration: notifications / create_table
-- Date: 2026-04-18
-- Applied via Supabase MCP: notifications_create_table + users_notification_prefs + notifications_enable_realtime
--
-- 인앱 알림 시스템. 헤더 벨 + Realtime 구독.
-- RLS 4정책: 본인 SELECT / INSERT / UPDATE(read_at) / DELETE
-- Realtime publication(supabase_realtime)에 추가됨.
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN (
    'group_invite',
    'note_comment',
    'points_milestone',
    'level_up',
    'completion_celebration',
    'report_ready',
    'mission_reminder',
    'system'
  )),
  title TEXT NOT NULL,
  body TEXT,
  action_url TEXT,
  reference_id UUID,
  reference_type TEXT,
  read_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, read_at NULLS FIRST, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_reference
  ON public.notifications (reference_type, reference_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
CREATE POLICY "notifications_insert_own"
  ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own_read_status" ON public.notifications;
CREATE POLICY "notifications_update_own_read_status"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own"
  ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- users.notification_prefs (알림 타입별 토글)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'notification_prefs'
  ) THEN
    ALTER TABLE public.users
      ADD COLUMN notification_prefs JSONB NOT NULL DEFAULT jsonb_build_object(
        'group_invite', true,
        'note_comment', true,
        'points_milestone', true,
        'level_up', true,
        'completion_celebration', true,
        'report_ready', true,
        'mission_reminder', false,
        'group_all_comments', false
      );
  END IF;
END $$;

-- Realtime publication에 추가
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

COMMENT ON TABLE public.notifications IS '인앱 알림. Realtime 구독 대상.';
COMMENT ON COLUMN public.users.notification_prefs IS '알림 타입별 수신 설정 (JSONB).';
