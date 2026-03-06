-- C-1: 서재 통계 N+1 제거
--
-- 문제: 각 서재마다 별도 쿼리 실행 (N+1 패턴)
-- 해결: 단일 쿼리로 모든 서재의 상태별 카운트 반환

CREATE OR REPLACE FUNCTION get_bookshelves_with_stats(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name VARCHAR,
  description TEXT,
  is_main BOOLEAN,
  "order" INT,
  is_public BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  book_count BIGINT,
  reading_count BIGINT,
  completed_count BIGINT,
  paused_count BIGINT,
  not_started_count BIGINT,
  rereading_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.user_id,
    b.name,
    b.description,
    b.is_main,
    b."order",
    b.is_public,
    b.created_at,
    b.updated_at,
    COUNT(ub.id)::BIGINT AS book_count,
    COUNT(CASE WHEN ub.status = 'reading' THEN 1 END)::BIGINT AS reading_count,
    COUNT(CASE WHEN ub.status = 'completed' THEN 1 END)::BIGINT AS completed_count,
    COUNT(CASE WHEN ub.status = 'paused' THEN 1 END)::BIGINT AS paused_count,
    COUNT(CASE WHEN ub.status = 'not_started' THEN 1 END)::BIGINT AS not_started_count,
    COUNT(CASE WHEN ub.status = 'rereading' THEN 1 END)::BIGINT AS rereading_count
  FROM bookshelves b
  LEFT JOIN user_books ub ON ub.bookshelf_id = b.id
  WHERE b.user_id = p_user_id
  GROUP BY b.id, b.user_id, b.name, b.description, b.is_main, b."order", b.is_public, b.created_at, b.updated_at
  ORDER BY b.is_main DESC, b."order" ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
