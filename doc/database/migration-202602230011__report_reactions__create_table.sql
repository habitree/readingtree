-- ==========================================================================
-- Report Reactions 테이블 생성
-- 공유 리포트 이모지 반응 (로그인/비로그인 모두 가능)
-- ==========================================================================

-- 1. reaction_type enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_reaction_type') THEN
    CREATE TYPE report_reaction_type AS ENUM ('impressive', 'want_to_read', 'insightful');
  END IF;
END $$;

-- 2. 테이블 생성
CREATE TABLE IF NOT EXISTS report_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES ai_generated_reports(id) ON DELETE CASCADE,
  reaction_type report_reaction_type NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT report_reactions_has_identity
    CHECK (user_id IS NOT NULL OR anonymous_id IS NOT NULL),
  CONSTRAINT report_reactions_unique_user
    UNIQUE NULLS NOT DISTINCT (report_id, reaction_type, user_id, anonymous_id)
);

-- 3. RLS 활성화
ALTER TABLE report_reactions ENABLE ROW LEVEL SECURITY;

-- 4. RLS: SELECT - 공개 리포트의 반응은 누구나 조회
DROP POLICY IF EXISTS "report_reactions_select" ON report_reactions;
CREATE POLICY "report_reactions_select"
  ON report_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_generated_reports
      WHERE ai_generated_reports.id = report_reactions.report_id
        AND ai_generated_reports.is_public = true
    )
  );

-- 5. RLS: INSERT - 로그인 사용자만 직접 삽입 (비로그인은 RPC 사용)
DROP POLICY IF EXISTS "report_reactions_insert" ON report_reactions;
CREATE POLICY "report_reactions_insert"
  ON report_reactions FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM ai_generated_reports
      WHERE ai_generated_reports.id = report_reactions.report_id
        AND ai_generated_reports.is_public = true
    )
  );

-- 6. RLS: DELETE - 본인 반응만 삭제
DROP POLICY IF EXISTS "report_reactions_delete" ON report_reactions;
CREATE POLICY "report_reactions_delete"
  ON report_reactions FOR DELETE
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 7. 인덱스
CREATE INDEX IF NOT EXISTS idx_report_reactions_report_id ON report_reactions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_reactions_user_id ON report_reactions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_report_reactions_anonymous_id ON report_reactions(anonymous_id) WHERE anonymous_id IS NOT NULL;

-- 8. 반응 추가 RPC (SECURITY DEFINER - 비로그인 포함)
CREATE OR REPLACE FUNCTION add_report_reaction(
  p_report_id UUID,
  p_reaction_type report_reaction_type,
  p_user_id UUID DEFAULT NULL,
  p_anonymous_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_user_id IS NULL AND p_anonymous_id IS NULL THEN RETURN FALSE; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM ai_generated_reports
    WHERE id = p_report_id AND is_public = true
  ) THEN RETURN FALSE; END IF;
  INSERT INTO report_reactions (report_id, reaction_type, user_id, anonymous_id)
  VALUES (p_report_id, p_reaction_type, p_user_id, p_anonymous_id)
  ON CONFLICT (report_id, reaction_type, user_id, anonymous_id) DO NOTHING;
  RETURN TRUE;
END;
$$;

-- 9. 반응 삭제 RPC (SECURITY DEFINER - 비로그인 포함)
CREATE OR REPLACE FUNCTION remove_report_reaction(
  p_report_id UUID,
  p_reaction_type report_reaction_type,
  p_user_id UUID DEFAULT NULL,
  p_anonymous_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_user_id IS NULL AND p_anonymous_id IS NULL THEN RETURN FALSE; END IF;
  DELETE FROM report_reactions
  WHERE report_id = p_report_id
    AND reaction_type = p_reaction_type
    AND (
      (p_user_id IS NOT NULL AND user_id = p_user_id)
      OR (p_anonymous_id IS NOT NULL AND anonymous_id = p_anonymous_id AND user_id IS NULL)
    );
  RETURN TRUE;
END;
$$;

-- 10. 반응 집계 RPC
CREATE OR REPLACE FUNCTION get_report_reaction_counts(p_report_id UUID)
RETURNS TABLE(reaction_type report_reaction_type, count BIGINT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM ai_generated_reports WHERE id = p_report_id AND is_public = true
  ) THEN RETURN; END IF;
  RETURN QUERY
  SELECT rr.reaction_type, COUNT(*)::BIGINT
  FROM report_reactions rr
  WHERE rr.report_id = p_report_id
  GROUP BY rr.reaction_type;
END;
$$;

-- 11. 특정 유저 반응 조회 RPC
CREATE OR REPLACE FUNCTION get_user_report_reactions(
  p_report_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_anonymous_id UUID DEFAULT NULL
)
RETURNS TABLE(reaction_type report_reaction_type)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  IF p_user_id IS NULL AND p_anonymous_id IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT rr.reaction_type
  FROM report_reactions rr
  WHERE rr.report_id = p_report_id
    AND (
      (p_user_id IS NOT NULL AND rr.user_id = p_user_id)
      OR (p_anonymous_id IS NOT NULL AND rr.anonymous_id = p_anonymous_id AND rr.user_id IS NULL)
    );
END;
$$;
