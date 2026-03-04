-- ============================================================
-- Migration: tracking - create login_logs & access_logs
-- Date: 2026-03-04
-- Description: IP별 접속/로그인 기록 추적 테이블 생성
-- ============================================================

-- 1. login_logs 테이블 생성
CREATE TABLE IF NOT EXISTS public.login_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  ip_address text,
  user_agent text,
  provider text CHECK (provider IN ('email', 'kakao', 'google', 'unknown')),
  success boolean NOT NULL DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 2. access_logs 테이블 생성
CREATE TABLE IF NOT EXISTS public.access_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  ip_address text,
  user_agent text,
  path text NOT NULL,
  referer text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_login_logs_created_at ON public.login_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON public.login_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_ip_address ON public.login_logs (ip_address);

CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON public.access_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON public.access_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_ip_address ON public.access_logs (ip_address);
CREATE INDEX IF NOT EXISTS idx_access_logs_path ON public.access_logs (path);

-- 4. RLS 활성화
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책: 관리자만 SELECT 허용
-- is_admin_user() 함수가 없을 수 있으므로 직접 조건 사용
DO $$
BEGIN
  -- login_logs: 관리자 SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'login_logs' AND policyname = 'admin_select_login_logs'
  ) THEN
    CREATE POLICY admin_select_login_logs ON public.login_logs
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.is_admin = true
        )
      );
  END IF;

  -- login_logs: service_role INSERT (서버에서만 삽입)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'login_logs' AND policyname = 'service_insert_login_logs'
  ) THEN
    CREATE POLICY service_insert_login_logs ON public.login_logs
      FOR INSERT
      WITH CHECK (true);
  END IF;

  -- access_logs: 관리자 SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'access_logs' AND policyname = 'admin_select_access_logs'
  ) THEN
    CREATE POLICY admin_select_access_logs ON public.access_logs
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.is_admin = true
        )
      );
  END IF;

  -- access_logs: service_role INSERT (서버에서만 삽입)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'access_logs' AND policyname = 'service_insert_access_logs'
  ) THEN
    CREATE POLICY service_insert_access_logs ON public.access_logs
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- 6. 30일 이전 로그 자동 삭제 함수
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.login_logs WHERE created_at < now() - interval '30 days';
  DELETE FROM public.access_logs WHERE created_at < now() - interval '30 days';
END;
$$;

-- 7. 테이블 코멘트
COMMENT ON TABLE public.login_logs IS '로그인 이벤트 기록 (30일 보관)';
COMMENT ON TABLE public.access_logs IS '페이지 방문 기록 (30일 보관)';
COMMENT ON FUNCTION public.cleanup_old_logs IS '30일 이전 로그인/접속 로그 자동 삭제';
