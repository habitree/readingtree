-- ============================================================================
-- Migration: Supabase 기반 Rate Limit 테이블 + RPC
-- 작성일: 2026-04-20
-- 작업자: Monitoring Agent
--
-- 배경:
--   Upstash Redis 도입 검토 중 인프라 region 분석 결과 Supabase(Seoul) 기반으로
--   전환이 더 빠르고(5-10ms vs Redis Tokyo 30-40ms) 간결하다고 판단.
--   Wave 4 Rate Limit 인프라를 Supabase 기반으로 최종 확정.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS, CREATE OR REPLACE FUNCTION 사용
-- ============================================================================

-- ─── 1. rate_limits 테이블 ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rate_limits (
  token      TEXT PRIMARY KEY,
  count      INT NOT NULL DEFAULT 1,
  reset_at   TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.rate_limits IS
  'Rate limit counters. service_role 전용. token = "${ipOrUserId}:${routePath}"';

-- 정리용 인덱스 (reset_at < NOW() 효율 삭제)
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at
  ON public.rate_limits (reset_at);

-- ─── 2. RLS ─────────────────────────────────────────────────────────────────
-- service_role만 접근 (일반 사용자·anon 모두 차단)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- 기존 정책 제거 (idempotent)
DROP POLICY IF EXISTS "rate_limits_no_access" ON public.rate_limits;

-- 빈 정책 — service_role은 RLS 우회, 그 외는 모두 차단
CREATE POLICY "rate_limits_no_access"
  ON public.rate_limits
  FOR ALL
  TO authenticated, anon
  USING (FALSE)
  WITH CHECK (FALSE);

-- ─── 3. Atomic Rate Limit Check RPC ─────────────────────────────────────────
-- 반환: { success, remaining, reset_at, count }
-- 윈도우: p_window_seconds (기본 60)
-- 동작: token이 처음이거나 reset_at < NOW()면 count=1 + reset 갱신,
--       아니면 count++ (reset_at 유지). 원자적 UPSERT로 race 방지.

CREATE OR REPLACE FUNCTION public.rate_limit_check(
  p_token TEXT,
  p_limit INT,
  p_window_seconds INT DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now   TIMESTAMPTZ := NOW();
  v_count INT;
  v_reset TIMESTAMPTZ;
BEGIN
  INSERT INTO public.rate_limits (token, count, reset_at)
  VALUES (p_token, 1, v_now + (p_window_seconds || ' seconds')::INTERVAL)
  ON CONFLICT (token) DO UPDATE
  SET
    count = CASE
      WHEN public.rate_limits.reset_at < v_now THEN 1
      ELSE public.rate_limits.count + 1
    END,
    reset_at = CASE
      WHEN public.rate_limits.reset_at < v_now
        THEN v_now + (p_window_seconds || ' seconds')::INTERVAL
      ELSE public.rate_limits.reset_at
    END
  RETURNING count, reset_at INTO v_count, v_reset;

  RETURN jsonb_build_object(
    'success',   v_count <= p_limit,
    'remaining', GREATEST(0, p_limit - v_count),
    'reset_at',  v_reset,
    'count',     v_count
  );
END;
$$;

COMMENT ON FUNCTION public.rate_limit_check IS
  'Atomic rate limit counter. token별 sliding window. service_role 전용.';

-- ─── 4. 정리 RPC (Vercel Cron으로 일일 실행 예정) ─────────────────────────
CREATE OR REPLACE FUNCTION public.rate_limit_cleanup()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM public.rate_limits
  WHERE reset_at < NOW() - INTERVAL '1 hour';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

COMMENT ON FUNCTION public.rate_limit_cleanup IS
  '만료된 rate_limits 항목 정리. 1시간 이상 지난 것 삭제. Vercel Cron 일일 실행 권장.';

-- ─── 5. 권한 ────────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.rate_limit_check(TEXT, INT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.rate_limit_cleanup() TO service_role;

-- 일반 사용자는 RPC 호출 불가
REVOKE ALL ON FUNCTION public.rate_limit_check(TEXT, INT, INT) FROM authenticated, anon, public;
REVOKE ALL ON FUNCTION public.rate_limit_cleanup() FROM authenticated, anon, public;
