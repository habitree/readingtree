-- ============================================================================
-- 독서모임 공유 기록 리액션 테이블
-- 좋아요/통찰/공감 3종 리액션 지원
-- ============================================================================

-- 리액션 테이블 생성
CREATE TABLE IF NOT EXISTS group_note_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_note_id UUID NOT NULL REFERENCES group_notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like', 'insightful', 'empathy')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_note_id, user_id, reaction_type)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_group_note_reactions_group_note_id
  ON group_note_reactions(group_note_id);
CREATE INDEX IF NOT EXISTS idx_group_note_reactions_user_id
  ON group_note_reactions(user_id);

-- RLS 활성화
ALTER TABLE group_note_reactions ENABLE ROW LEVEL SECURITY;

-- SELECT: 모임 멤버만 조회
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'group_note_reactions_select' AND tablename = 'group_note_reactions'
  ) THEN
    CREATE POLICY group_note_reactions_select ON group_note_reactions
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM group_notes gn
          JOIN group_members gm ON gm.group_id = gn.group_id
          WHERE gn.id = group_note_reactions.group_note_id
            AND gm.user_id = auth.uid()
            AND gm.status = 'approved'
        )
      );
  END IF;
END$$;

-- INSERT: 인증된 사용자가 자신의 리액션 추가 (멤버십은 서버 액션에서 검증)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'group_note_reactions_insert' AND tablename = 'group_note_reactions'
  ) THEN
    CREATE POLICY group_note_reactions_insert ON group_note_reactions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- DELETE: 본인 리액션만 삭제
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'group_note_reactions_delete' AND tablename = 'group_note_reactions'
  ) THEN
    CREATE POLICY group_note_reactions_delete ON group_note_reactions
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END$$;
