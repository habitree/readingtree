-- ============================================================================
-- 독서모임 공유 기록 댓글 테이블
-- 1depth 대댓글 지원 (parent_id)
-- ============================================================================

CREATE TABLE IF NOT EXISTS group_note_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_note_id UUID NOT NULL REFERENCES group_notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  parent_id UUID REFERENCES group_note_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_group_note_comments_group_note_id
  ON group_note_comments(group_note_id);
CREATE INDEX IF NOT EXISTS idx_group_note_comments_user_id
  ON group_note_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_group_note_comments_parent_id
  ON group_note_comments(parent_id);

-- RLS 활성화
ALTER TABLE group_note_comments ENABLE ROW LEVEL SECURITY;

-- SELECT: 모임 멤버만 조회
CREATE POLICY group_note_comments_select ON group_note_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_notes gn
      JOIN group_members gm ON gm.group_id = gn.group_id
      WHERE gn.id = group_note_comments.group_note_id
        AND gm.user_id = auth.uid()
        AND gm.status = 'approved'
    )
  );

-- INSERT: 인증된 사용자가 자신의 댓글 추가
CREATE POLICY group_note_comments_insert ON group_note_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: 본인 댓글만 수정
CREATE POLICY group_note_comments_update ON group_note_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: 본인 또는 모임 리더가 삭제
CREATE POLICY group_note_comments_delete ON group_note_comments
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM group_notes gn
      JOIN groups g ON g.id = gn.group_id
      WHERE gn.id = group_note_comments.group_note_id
        AND g.leader_id = auth.uid()
    )
  );
