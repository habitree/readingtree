-- ==========================================================================
-- AI Generated Reports 테이블 생성
-- 사용자의 AI 독서 리포트를 저장하고 공유하는 테이블
-- ==========================================================================

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS ai_generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_book_id UUID NOT NULL,
  share_id UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  report_markdown TEXT NOT NULL,
  note_count INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT false,
  book_title TEXT NOT NULL,
  book_author TEXT,
  cover_image_url TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, user_book_id)
);

-- 2. RLS 활성화
ALTER TABLE ai_generated_reports ENABLE ROW LEVEL SECURITY;

-- 3. RLS 정책: SELECT - 공개 리포트 또는 본인 리포트
CREATE POLICY "ai_generated_reports_select"
  ON ai_generated_reports
  FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

-- 4. RLS 정책: INSERT - 본인만
CREATE POLICY "ai_generated_reports_insert"
  ON ai_generated_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. RLS 정책: UPDATE - 본인만
CREATE POLICY "ai_generated_reports_update"
  ON ai_generated_reports
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. RLS 정책: DELETE - 본인만
CREATE POLICY "ai_generated_reports_delete"
  ON ai_generated_reports
  FOR DELETE
  USING (auth.uid() = user_id);

-- 7. 인덱스
CREATE INDEX IF NOT EXISTS idx_ai_generated_reports_user_id ON ai_generated_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_reports_share_id ON ai_generated_reports(share_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_reports_user_book ON ai_generated_reports(user_id, user_book_id);

-- 8. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_ai_generated_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ai_generated_reports_updated_at ON ai_generated_reports;
CREATE TRIGGER trigger_ai_generated_reports_updated_at
  BEFORE UPDATE ON ai_generated_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_generated_reports_updated_at();
