-- ============================================================
-- Migration: OCR 보정 설정 테이블 및 로그 확장
-- 생성일: 2025-02-04
-- 설명: OCR 텍스트 보정 기능의 관리자 설정 및 비용 추적 기능 추가
-- ============================================================

-- ------------------------------------------------------------
-- 1. OCR 보정 설정 테이블 생성
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ocr_correction_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'openai',
  model_id TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  generation_settings JSONB NOT NULL DEFAULT '{"temperature": 0.3, "maxOutputTokens": 2048}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 코멘트 추가
COMMENT ON TABLE ocr_correction_settings IS 'OCR 텍스트 보정 설정 (관리자 전용)';
COMMENT ON COLUMN ocr_correction_settings.provider IS 'AI 프로바이더 (openai, google, anthropic)';
COMMENT ON COLUMN ocr_correction_settings.model_id IS '사용할 모델 ID';
COMMENT ON COLUMN ocr_correction_settings.generation_settings IS '생성 파라미터 (temperature, maxOutputTokens)';
COMMENT ON COLUMN ocr_correction_settings.is_active IS '활성화 여부';

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_ocr_correction_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ocr_correction_settings_timestamp ON ocr_correction_settings;
CREATE TRIGGER update_ocr_correction_settings_timestamp
  BEFORE UPDATE ON ocr_correction_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_ocr_correction_settings_updated_at();

-- ------------------------------------------------------------
-- 2. RLS 정책 (관리자만 접근)
-- ------------------------------------------------------------
ALTER TABLE ocr_correction_settings ENABLE ROW LEVEL SECURITY;

-- 기존 정책 제거 (재실행 시 오류 방지)
DROP POLICY IF EXISTS "관리자만 조회" ON ocr_correction_settings;
DROP POLICY IF EXISTS "관리자만 생성" ON ocr_correction_settings;
DROP POLICY IF EXISTS "관리자만 수정" ON ocr_correction_settings;
DROP POLICY IF EXISTS "관리자만 삭제" ON ocr_correction_settings;

-- 관리자 확인 함수 (존재하지 않으면 생성)
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 관리자만 접근 가능
CREATE POLICY "관리자만 조회" ON ocr_correction_settings
  FOR SELECT USING (is_admin_user());

CREATE POLICY "관리자만 생성" ON ocr_correction_settings
  FOR INSERT WITH CHECK (is_admin_user());

CREATE POLICY "관리자만 수정" ON ocr_correction_settings
  FOR UPDATE USING (is_admin_user());

CREATE POLICY "관리자만 삭제" ON ocr_correction_settings
  FOR DELETE USING (is_admin_user());

-- ------------------------------------------------------------
-- 3. ocr_logs 테이블 확장 (비용 추적)
-- ------------------------------------------------------------
-- 모델 ID 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ocr_logs' AND column_name = 'model_id'
  ) THEN
    ALTER TABLE ocr_logs ADD COLUMN model_id TEXT;
  END IF;
END $$;

-- 입력 토큰 수 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ocr_logs' AND column_name = 'input_tokens'
  ) THEN
    ALTER TABLE ocr_logs ADD COLUMN input_tokens INTEGER;
  END IF;
END $$;

-- 출력 토큰 수 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ocr_logs' AND column_name = 'output_tokens'
  ) THEN
    ALTER TABLE ocr_logs ADD COLUMN output_tokens INTEGER;
  END IF;
END $$;

-- 예상 비용 컬럼 추가 (USD)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ocr_logs' AND column_name = 'estimated_cost_usd'
  ) THEN
    ALTER TABLE ocr_logs ADD COLUMN estimated_cost_usd DECIMAL(10,8);
  END IF;
END $$;

-- 프로바이더 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ocr_logs' AND column_name = 'provider'
  ) THEN
    ALTER TABLE ocr_logs ADD COLUMN provider TEXT;
  END IF;
END $$;

-- 코멘트 추가
COMMENT ON COLUMN ocr_logs.model_id IS '사용된 AI 모델 ID';
COMMENT ON COLUMN ocr_logs.input_tokens IS '입력 토큰 수';
COMMENT ON COLUMN ocr_logs.output_tokens IS '출력 토큰 수';
COMMENT ON COLUMN ocr_logs.estimated_cost_usd IS '예상 비용 (USD)';
COMMENT ON COLUMN ocr_logs.provider IS 'AI 프로바이더 (openai, google, anthropic)';

-- ------------------------------------------------------------
-- 4. 인덱스 추가
-- ------------------------------------------------------------
-- ocr_logs 생성일 인덱스 (월별 통계 쿼리 최적화)
CREATE INDEX IF NOT EXISTS idx_ocr_logs_created_at
  ON ocr_logs (created_at);

-- ocr_correction_settings 활성 설정 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_ocr_correction_settings_is_active
  ON ocr_correction_settings (is_active) WHERE is_active = true;

-- ------------------------------------------------------------
-- 5. 기본 설정 삽입 (없는 경우에만)
-- ------------------------------------------------------------
INSERT INTO ocr_correction_settings (provider, model_id, generation_settings, is_active)
SELECT 'openai', 'gpt-4o-mini', '{"temperature": 0.3, "maxOutputTokens": 2048}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM ocr_correction_settings);

-- ============================================================
-- Migration Complete
-- ============================================================
