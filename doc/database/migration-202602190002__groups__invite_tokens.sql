-- Migration: group_invite_tokens 테이블 생성
-- 토큰 기반 독서모임 초대 링크 지원
-- Idempotent: 여러 번 실행해도 안전

CREATE TABLE IF NOT EXISTS group_invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_uses INTEGER DEFAULT NULL,
  use_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_group_invite_tokens_token ON group_invite_tokens(token) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_group_invite_tokens_group_id ON group_invite_tokens(group_id);

-- RLS 활성화
ALTER TABLE group_invite_tokens ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 그룹 리더/모더레이터만 토큰 관리 가능
DROP POLICY IF EXISTS "group_invite_tokens_select" ON group_invite_tokens;
CREATE POLICY "group_invite_tokens_select" ON group_invite_tokens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_invite_tokens.group_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('leader', 'moderator')
        AND gm.status = 'approved'
    )
    OR
    -- 토큰으로 조회할 때는 누구나 읽기 가능 (is_active=true인 경우)
    (is_active = TRUE AND expires_at > NOW())
  );

DROP POLICY IF EXISTS "group_invite_tokens_insert" ON group_invite_tokens;
CREATE POLICY "group_invite_tokens_insert" ON group_invite_tokens
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_invite_tokens.group_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('leader', 'moderator')
        AND gm.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "group_invite_tokens_update" ON group_invite_tokens;
CREATE POLICY "group_invite_tokens_update" ON group_invite_tokens
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_invite_tokens.group_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('leader', 'moderator')
        AND gm.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "group_invite_tokens_delete" ON group_invite_tokens;
CREATE POLICY "group_invite_tokens_delete" ON group_invite_tokens
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_invite_tokens.group_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('leader', 'moderator')
        AND gm.status = 'approved'
    )
  );
