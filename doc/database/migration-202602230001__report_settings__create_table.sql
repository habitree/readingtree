-- ============================================================
-- Migration: AI Report Settings 테이블 생성
-- Date: 2026-02-23
-- Description: AI 독서 리포트 생성을 위한 설정 테이블
-- ============================================================

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS ai_report_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'openai',
  model_id TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  system_prompt TEXT NOT NULL DEFAULT '',
  temperature NUMERIC(3,2) NOT NULL DEFAULT 0.7,
  max_output_tokens INTEGER NOT NULL DEFAULT 4096,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_temperature CHECK (temperature >= 0 AND temperature <= 2),
  CONSTRAINT valid_max_output_tokens CHECK (max_output_tokens >= 256 AND max_output_tokens <= 16384)
);

-- 2. 인덱스
CREATE INDEX IF NOT EXISTS idx_ai_report_settings_user_id ON ai_report_settings(user_id);

-- 3. updated_at 트리거
CREATE OR REPLACE FUNCTION update_ai_report_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ai_report_settings_updated_at ON ai_report_settings;
CREATE TRIGGER trg_ai_report_settings_updated_at
  BEFORE UPDATE ON ai_report_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_report_settings_updated_at();

-- 4. RLS 활성화
ALTER TABLE ai_report_settings ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 4개
CREATE POLICY "ai_report_settings_select" ON ai_report_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_report_settings_insert" ON ai_report_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_report_settings_update" ON ai_report_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ai_report_settings_delete" ON ai_report_settings
  FOR DELETE USING (auth.uid() = user_id);
