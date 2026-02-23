-- ==========================================================================
-- AI Generated Reports: view_count 컬럼 추가
-- 공유 리포트 조회수 트래킹
-- ==========================================================================

-- 1. 컬럼 추가 (멱등성)
ALTER TABLE ai_generated_reports
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- 2. 조회수 증가 RPC 함수 (SECURITY DEFINER: 비로그인 사용자도 호출 가능)
CREATE OR REPLACE FUNCTION increment_report_view_count(p_share_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE ai_generated_reports
  SET view_count = view_count + 1
  WHERE share_id = p_share_id
    AND is_public = true;
END;
$$;
