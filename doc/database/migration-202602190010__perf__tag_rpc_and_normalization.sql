-- =====================================================
-- 태그 집계 RPC + 배치 삭제 RPC + 정규화 트리거
-- 202602190010__perf__tag_rpc_and_normalization.sql
-- =====================================================

-- 1. 인기 태그 집계 RPC (공개 노트 대상)
CREATE OR REPLACE FUNCTION get_explore_tags(p_limit INT DEFAULT 15)
RETURNS TABLE(tag TEXT, cnt BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT unnest(tags) AS tag, COUNT(*) AS cnt
  FROM notes
  WHERE is_public = TRUE AND type != 'progress' AND tags IS NOT NULL
  GROUP BY tag
  ORDER BY cnt DESC
  LIMIT p_limit;
$$;

-- 2. 사용자별 태그 목록 RPC (중복 제거, 정렬)
CREATE OR REPLACE FUNCTION get_user_tags(p_user_id UUID)
RETURNS TABLE(tag TEXT)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT unnest(tags) AS tag
  FROM notes
  WHERE user_id = p_user_id AND tags IS NOT NULL
  ORDER BY tag;
$$;

-- 3. 사용자별 태그 빈도 RPC
CREATE OR REPLACE FUNCTION get_user_tags_with_count(p_user_id UUID)
RETURNS TABLE(tag TEXT, cnt BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT unnest(tags) AS tag, COUNT(*) AS cnt
  FROM notes
  WHERE user_id = p_user_id AND tags IS NOT NULL
  GROUP BY tag
  ORDER BY cnt DESC;
$$;

-- 4. 태그 배치 삭제 RPC (N+1 제거)
CREATE OR REPLACE FUNCTION delete_tag_from_notes(p_user_id UUID, p_tag TEXT)
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count INT;
BEGIN
  UPDATE notes
  SET tags = array_remove(tags, p_tag), updated_at = NOW()
  WHERE user_id = p_user_id AND tags @> ARRAY[p_tag]::text[];
  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- 빈 배열은 NULL로 정리
  UPDATE notes
  SET tags = NULL
  WHERE user_id = p_user_id AND tags = '{}';

  RETURN v_count;
END;
$$;

-- 5. 태그 정규화 트리거 (공백 trim + 중복 제거 + 빈 배열 → NULL)
CREATE OR REPLACE FUNCTION normalize_tags()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tags IS NOT NULL THEN
    NEW.tags := (
      SELECT ARRAY_AGG(DISTINCT TRIM(tag))
      FROM UNNEST(NEW.tags) AS tag
      WHERE TRIM(tag) != ''
    );
    IF array_length(NEW.tags, 1) IS NULL THEN
      NEW.tags := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notes_normalize_tags ON notes;
CREATE TRIGGER trg_notes_normalize_tags
  BEFORE INSERT OR UPDATE OF tags ON notes
  FOR EACH ROW EXECUTE FUNCTION normalize_tags();

-- 6. 기존 데이터 정리 (태그 정규화 일괄 적용)
UPDATE notes SET tags = (
  SELECT ARRAY_AGG(DISTINCT TRIM(tag))
  FROM UNNEST(tags) AS tag
  WHERE TRIM(tag) != ''
) WHERE tags IS NOT NULL;

UPDATE notes SET tags = NULL WHERE tags = '{}';
