-- Migration: 탐색/좋아요 시스템 제거 + "Readtree 기록" 시스템 책 추가
-- 실행 전: 코드 배포 완료 후 실행 (like_count 참조 코드 제거 후)

-- 1) "Readtree 기록" 시스템 책 생성 (well-known UUID)
INSERT INTO books (id, title, author, isbn, cover_image_url, is_sample, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Readtree 기록',
  NULL, NULL, NULL, false, now(), now()
) ON CONFLICT (id) DO NOTHING;

-- 2) 기존 book_id IS NULL 노트 소유자에 대해 user_books 자동 생성
INSERT INTO user_books (id, user_id, book_id, status, created_at, updated_at)
SELECT gen_random_uuid(), n.user_id, '00000000-0000-0000-0000-000000000001', 'reading', now(), now()
FROM notes n
WHERE n.book_id IS NULL
GROUP BY n.user_id
ON CONFLICT (user_id, book_id) DO NOTHING;

-- 3) 기존 book_id IS NULL 노트에 Readtree 기록 book_id 할당
UPDATE notes
SET book_id = '00000000-0000-0000-0000-000000000001', updated_at = now()
WHERE book_id IS NULL;

-- 4) Like 시스템 정리
DROP TABLE IF EXISTS note_likes CASCADE;
DROP FUNCTION IF EXISTS toggle_note_like(UUID, UUID);
ALTER TABLE notes DROP COLUMN IF EXISTS like_count;

-- 5) 탐색 전용 RPC/인덱스 정리
DROP FUNCTION IF EXISTS get_explore_tags(INT);
DROP INDEX IF EXISTS idx_notes_public_recent;
DROP INDEX IF EXISTS idx_notes_public_popular;
