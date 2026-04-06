-- 메모 없이 저장 시 누락된 진행 기록 소급 생성
-- handleSaveProgressOnly가 createNote()를 호출하지 않아 누락된 32건 보정
-- created_at은 user_books.updated_at 기준으로 타임라인 정합성 유지

INSERT INTO notes (user_id, book_id, type, content, page_number, is_public, status, created_at, updated_at)
SELECT
  ub.user_id,
  ub.book_id,
  'progress',
  NULL,
  ub.current_page,
  true,
  'published',
  ub.updated_at,
  ub.updated_at
FROM user_books ub
WHERE ub.current_page > 0
  AND NOT EXISTS (
    SELECT 1 FROM notes n
    WHERE n.book_id = ub.book_id
      AND n.user_id = ub.user_id
      AND n.type = 'progress'
  )
ON CONFLICT DO NOTHING;
