-- ============================================================
-- custom_api_services 테이블 생성
-- 관리자가 수동 등록하는 외부 API 서비스 관리
-- ============================================================

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS public.custom_api_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  endpoint_url TEXT DEFAULT '',
  api_key_encrypted TEXT DEFAULT '',
  api_key_preview TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'custom',
  is_active BOOLEAN NOT NULL DEFAULT true,
  icon TEXT NOT NULL DEFAULT 'plug',
  external_doc_url TEXT DEFAULT '',
  features TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 코멘트
COMMENT ON TABLE public.custom_api_services IS '관리자가 수동 등록한 외부 API 서비스';
COMMENT ON COLUMN public.custom_api_services.api_key_encrypted IS '원본 API 키 (서버 전용, 클라이언트 노출 금지)';
COMMENT ON COLUMN public.custom_api_services.api_key_preview IS '마스킹된 키 미리보기 (예: sk-...abc)';

-- 3. RLS 활성화
ALTER TABLE public.custom_api_services ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책
-- service_role: 전체 접근
CREATE POLICY "service_role_full_access"
  ON public.custom_api_services
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- authenticated: SELECT만 허용 (api_key_encrypted는 뷰/서버에서 제외)
CREATE POLICY "authenticated_select"
  ON public.custom_api_services
  FOR SELECT
  TO authenticated
  USING (true);

-- 5. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION public.update_custom_api_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_custom_api_services_updated_at ON public.custom_api_services;
CREATE TRIGGER trg_custom_api_services_updated_at
  BEFORE UPDATE ON public.custom_api_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_custom_api_services_updated_at();

-- 6. 인덱스
CREATE INDEX IF NOT EXISTS idx_custom_api_services_is_active
  ON public.custom_api_services (is_active);
