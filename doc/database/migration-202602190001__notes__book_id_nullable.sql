-- Migration: notes.book_id NOT NULL → nullable 전환
-- 책 없이 문장만 저장할 수 있도록 허용
-- Idempotent: 여러 번 실행해도 안전

-- 1. FK 재설정 (nullable 허용)
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_book_id_fkey;
ALTER TABLE notes ALTER COLUMN book_id DROP NOT NULL;
ALTER TABLE notes ADD CONSTRAINT notes_book_id_fkey
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE;

-- 2. 부분 인덱스 재생성
DROP INDEX IF EXISTS idx_notes_book_id;
CREATE INDEX IF NOT EXISTS idx_notes_book_id ON notes(book_id) WHERE book_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notes_no_book ON notes(user_id, created_at DESC) WHERE book_id IS NULL;

-- 3. 출처 컬럼 추가
ALTER TABLE notes ADD COLUMN IF NOT EXISTS source_type TEXT CHECK (
  source_type IN ('book', 'youtube', 'instagram', 'article', 'other')
);
ALTER TABLE notes ADD COLUMN IF NOT EXISTS source_label TEXT;

-- 기존 RLS 정책은 auth.uid() = user_id 패턴이므로 book_id 무관, 변경 불필요
