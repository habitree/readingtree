-- ==========================================================================
-- Monthly Recaps 테이블 생성
-- 사용자의 월간 독서결산 스냅샷을 저장하고 공유하는 테이블
--
-- 설계 노트:
--  - 스냅샷 모델: 공개 페이지/OG 봇이 원본(notes/reading_logs) 변경·삭제 후에도
--    불변·안정 데이터를 렌더해야 하므로 집계 결과를 JSONB로 동결 저장한다.
--  - share_id: 공개 URL 토큰. user_id/year/month enumerate 방지(ai_generated_reports 선례).
--  - share_version: 재생성 시 +1 → 카카오/FB OG 캐시 무효화(?v=)에 사용.
--  - ai_caption: AI 한줄평. 크론 대량 호출 방지 위해 인앱 첫 조회 시 지연 생성·캐시.
-- ==========================================================================

-- 1. 테이블 생성 (idempotent)
CREATE TABLE IF NOT EXISTS monthly_recaps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year          INTEGER NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  month         INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  share_id      UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  stats         JSONB NOT NULL DEFAULT '{}'::jsonb,
  highlights    JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_caption    TEXT,
  is_public     BOOLEAN NOT NULL DEFAULT false,
  share_version INTEGER NOT NULL DEFAULT 1,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, year, month)
);

-- 2. RLS 활성화
ALTER TABLE monthly_recaps ENABLE ROW LEVEL SECURITY;

-- 3. RLS 정책: SELECT - 공개 결산 또는 본인 결산 (anon 공유 페이지/OG 위해 공개행 노출)
DROP POLICY IF EXISTS "monthly_recaps_select" ON monthly_recaps;
CREATE POLICY "monthly_recaps_select"
  ON monthly_recaps
  FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

-- 4. RLS 정책: INSERT - 본인만
DROP POLICY IF EXISTS "monthly_recaps_insert" ON monthly_recaps;
CREATE POLICY "monthly_recaps_insert"
  ON monthly_recaps
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. RLS 정책: UPDATE - 본인만
DROP POLICY IF EXISTS "monthly_recaps_update" ON monthly_recaps;
CREATE POLICY "monthly_recaps_update"
  ON monthly_recaps
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. RLS 정책: DELETE - 본인만
DROP POLICY IF EXISTS "monthly_recaps_delete" ON monthly_recaps;
CREATE POLICY "monthly_recaps_delete"
  ON monthly_recaps
  FOR DELETE
  USING (auth.uid() = user_id);

-- 7. 인덱스
CREATE INDEX IF NOT EXISTS idx_monthly_recaps_user ON monthly_recaps(user_id, year DESC, month DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_recaps_share_id ON monthly_recaps(share_id);

-- 8. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_monthly_recaps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_monthly_recaps_updated_at ON monthly_recaps;
CREATE TRIGGER trigger_monthly_recaps_updated_at
  BEFORE UPDATE ON monthly_recaps
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_recaps_updated_at();
