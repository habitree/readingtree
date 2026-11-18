-- ==========================================================================
-- Yearly Recaps 테이블 생성 (REQ-0014 연간 독서 결산)
-- 사용자의 연간 독서결산 스냅샷을 저장하고 공유하는 테이블. monthly_recaps 미러.
--
-- 설계 노트:
--  - 스냅샷 모델: 12월 중에는 조회할 때마다 재계산해 갱신하고, 다음 해 1월 1일(KST) 이후
--    처음 조회될 때 한 번 더 계산한 뒤 확정한다(앱에서 generated_at 으로 판단).
--  - share_id: 공개 URL 토큰. user_id/year enumerate 방지.
--  - share_version: 재생성 시 +1 → 카카오/FB OG 캐시 무효화(?v=)에 사용.
-- ==========================================================================

-- 1. 테이블 생성 (idempotent)
CREATE TABLE IF NOT EXISTS yearly_recaps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year          INTEGER NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  share_id      UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  stats         JSONB NOT NULL DEFAULT '{}'::jsonb,
  highlights    JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public     BOOLEAN NOT NULL DEFAULT false,
  share_version INTEGER NOT NULL DEFAULT 1,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, year)
);

-- 2. RLS 활성화
ALTER TABLE yearly_recaps ENABLE ROW LEVEL SECURITY;

-- 3. RLS 정책: SELECT - 공개 결산 또는 본인 결산 (anon 공유 페이지/OG 위해 공개행 노출)
DROP POLICY IF EXISTS "yearly_recaps_select" ON yearly_recaps;
CREATE POLICY "yearly_recaps_select"
  ON yearly_recaps
  FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

-- 4. RLS 정책: INSERT - 본인만
DROP POLICY IF EXISTS "yearly_recaps_insert" ON yearly_recaps;
CREATE POLICY "yearly_recaps_insert"
  ON yearly_recaps
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. RLS 정책: UPDATE - 본인만
DROP POLICY IF EXISTS "yearly_recaps_update" ON yearly_recaps;
CREATE POLICY "yearly_recaps_update"
  ON yearly_recaps
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. RLS 정책: DELETE - 본인만
DROP POLICY IF EXISTS "yearly_recaps_delete" ON yearly_recaps;
CREATE POLICY "yearly_recaps_delete"
  ON yearly_recaps
  FOR DELETE
  USING (auth.uid() = user_id);

-- 7. 인덱스 (share_id 는 UNIQUE 제약이, (user_id, year) 는 UNIQUE 제약이 인덱스를 만든다)

-- 8. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_yearly_recaps_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_yearly_recaps_updated_at ON yearly_recaps;
CREATE TRIGGER trigger_yearly_recaps_updated_at
  BEFORE UPDATE ON yearly_recaps
  FOR EACH ROW
  EXECUTE FUNCTION update_yearly_recaps_updated_at();
