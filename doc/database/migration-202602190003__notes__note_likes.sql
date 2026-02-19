-- note_likes 테이블 생성 (문장 탐색/큐레이션 피드용)
-- 사용자가 공개 노트에 좋아요를 누를 수 있는 기능

CREATE TABLE IF NOT EXISTS note_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(note_id, user_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_note_likes_note_id ON note_likes(note_id);
CREATE INDEX IF NOT EXISTS idx_note_likes_user_id ON note_likes(user_id);

-- RLS 활성화
ALTER TABLE note_likes ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 자기 좋아요만 관리 가능
CREATE POLICY "note_likes_select_own"
  ON note_likes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "note_likes_insert_own"
  ON note_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "note_likes_delete_own"
  ON note_likes FOR DELETE
  USING (auth.uid() = user_id);

-- 공개 노트의 좋아요 카운트는 누구나 조회 가능 (집계용)
CREATE POLICY "note_likes_select_public_count"
  ON note_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_likes.note_id
      AND notes.is_public = TRUE
    )
  );

-- notes 테이블에 like_count 컬럼 추가 (비정규화, 성능 최적화)
ALTER TABLE notes ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
