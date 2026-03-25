-- ============================================================
-- Migration: notes 테이블에 status 컬럼 추가 (2-tier 기록 시스템)
--
-- 목적: Quick Capture(draft) → Full Note(published) 2-tier 워크플로우
-- 날짜: 2026-03-25
-- ============================================================

-- 1. status 컬럼 추가 (draft: 빠른 기록, published: 정식 기록)
ALTER TABLE notes
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
CHECK (status IN ('draft', 'published'));

-- 2. status 인덱스 (draft 필터링 빈번)
CREATE INDEX IF NOT EXISTS idx_notes_status ON notes (user_id, status, created_at DESC);

-- 3. 기존 데이터는 모두 'published' (DEFAULT로 자동 처리)

-- 4. reading_logs 데이터를 notes로 마이그레이션 (type='progress')
-- 주의: 이미 notes에 progress 타입이 존재할 수 있으므로 중복 방지
INSERT INTO notes (
  user_id,
  book_id,
  type,
  content,
  page_number,
  is_public,
  status,
  created_at,
  updated_at
)
SELECT
  rl.user_id,
  ub.book_id,
  'progress'::note_type,
  CASE
    WHEN rl.memo IS NOT NULL AND rl.memo != ''
    THEN jsonb_build_object('memo', rl.memo)::text
    ELSE NULL
  END,
  rl.page_number,
  rl.is_public,
  'published',
  rl.created_at,
  rl.updated_at
FROM reading_logs rl
JOIN user_books ub ON ub.id = rl.user_book_id
WHERE NOT EXISTS (
  -- 같은 user_id + book_id + created_at 조합이 이미 notes에 있으면 스킵
  SELECT 1 FROM notes n
  WHERE n.user_id = rl.user_id
    AND n.book_id = ub.book_id
    AND n.type = 'progress'::note_type
    AND n.created_at = rl.created_at
);

-- 5. reading_logs 테이블 유지 (하위 호환성) - 향후 deprecated 처리
-- DROP TABLE reading_logs; -- Phase 2에서 진행
COMMENT ON TABLE reading_logs IS 'DEPRECATED: notes 테이블의 status/type="progress"로 마이그레이션됨. 하위 호환성을 위해 유지.';
