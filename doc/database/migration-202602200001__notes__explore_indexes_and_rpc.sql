-- =====================================================
-- 탐색 기능 인덱스 + 좋아요 RPC
-- 202602200001__notes__explore_indexes_and_rpc.sql
-- =====================================================

-- 1. 공개 노트 최신순 조회용 partial index
CREATE INDEX IF NOT EXISTS idx_notes_public_recent
  ON notes (created_at DESC)
  WHERE is_public = TRUE AND type != 'progress';

-- 2. 공개 노트 인기순 조회용 partial index
CREATE INDEX IF NOT EXISTS idx_notes_public_popular
  ON notes (like_count DESC, created_at DESC)
  WHERE is_public = TRUE AND type != 'progress';

-- 3. 태그 GIN 인덱스
CREATE INDEX IF NOT EXISTS idx_notes_tags_gin
  ON notes USING GIN(tags)
  WHERE tags IS NOT NULL;

-- 4. 원자적 좋아요 토글 RPC
CREATE OR REPLACE FUNCTION toggle_note_like(
  p_note_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_public BOOLEAN;
  v_existing_id UUID;
  v_new_count INT;
BEGIN
  -- 공개 노트 여부 확인
  SELECT is_public INTO v_is_public
    FROM notes
    WHERE id = p_note_id;

  IF v_is_public IS NULL THEN
    RAISE EXCEPTION 'Note not found';
  END IF;

  IF NOT v_is_public THEN
    RAISE EXCEPTION 'Only public notes can be liked';
  END IF;

  -- 기존 좋아요 확인
  SELECT id INTO v_existing_id
    FROM note_likes
    WHERE note_id = p_note_id AND user_id = p_user_id;

  IF v_existing_id IS NOT NULL THEN
    -- 좋아요 취소
    DELETE FROM note_likes WHERE id = v_existing_id;

    UPDATE notes
      SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
      WHERE id = p_note_id
      RETURNING like_count INTO v_new_count;

    RETURN jsonb_build_object('liked', FALSE, 'like_count', v_new_count);
  ELSE
    -- 좋아요 추가
    INSERT INTO note_likes (note_id, user_id)
      VALUES (p_note_id, p_user_id);

    UPDATE notes
      SET like_count = COALESCE(like_count, 0) + 1
      WHERE id = p_note_id
      RETURNING like_count INTO v_new_count;

    RETURN jsonb_build_object('liked', TRUE, 'like_count', v_new_count);
  END IF;
END;
$$;
