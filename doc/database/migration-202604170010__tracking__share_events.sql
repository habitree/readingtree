-- =========================================================================
-- Migration: tracking / share_events
-- Date: 2026-04-17
--
-- 공유 이벤트 트래킹 테이블.
-- 완독 카드·노트·리포트 등에서 공유 버튼 클릭 시 기록한다.
-- 바이럴 계수(K), 채널별 CTR, 레퍼럴 전환율 계산의 원천.
--
-- 정책:
--   - SELECT: 본인 기록만 + 관리자 전체
--   - INSERT: 서버 액션 전용 (service_role) or 본인
--   - UPDATE/DELETE: 금지 (append-only)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.share_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('note', 'report', 'completion', 'bookshelf')),
  source_id UUID NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('kakao', 'x', 'copy_link', 'native', 'download', 'instagram')),
  referrer_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_share_events_user_created
  ON public.share_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_share_events_kind_created
  ON public.share_events (kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_share_events_source
  ON public.share_events (source_id);

-- RLS 활성화
ALTER TABLE public.share_events ENABLE ROW LEVEL SECURITY;

-- SELECT: 본인 기록 (로그인 시) — idempotent
DROP POLICY IF EXISTS "share_events_select_own" ON public.share_events;
CREATE POLICY "share_events_select_own"
  ON public.share_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- SELECT: 관리자
DROP POLICY IF EXISTS "share_events_select_admin" ON public.share_events;
CREATE POLICY "share_events_select_admin"
  ON public.share_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- INSERT: 로그인 사용자는 본인 이벤트 + 익명은 user_id NULL
DROP POLICY IF EXISTS "share_events_insert_own_or_anon" ON public.share_events;
CREATE POLICY "share_events_insert_own_or_anon"
  ON public.share_events
  FOR INSERT
  WITH CHECK (
    user_id IS NULL OR auth.uid() = user_id
  );

-- UPDATE/DELETE: 금지 (append-only). 정책을 아예 만들지 않음.

COMMENT ON TABLE public.share_events IS '공유 이벤트 로그 (바이럴·전환율 분석용). append-only.';
COMMENT ON COLUMN public.share_events.kind IS '공유 대상 유형';
COMMENT ON COLUMN public.share_events.source_id IS '원본 리소스 ID (note_id | user_book_id | report_id | bookshelf_id)';
COMMENT ON COLUMN public.share_events.channel IS '공유 채널';
COMMENT ON COLUMN public.share_events.referrer_user_id IS '공유를 받은 사용자 (가입·유입 시)';
