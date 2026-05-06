-- =============================================================================
-- migration-202605061200__user_books__add_pin_columns.sql
--
-- 목적:
--   user_books 에 즐겨찾기(핀) 컬럼 추가.
--   - is_pinned BOOLEAN: 핀 여부 플래그
--   - pinned_at TIMESTAMPTZ: 핀 고정 시각 (정렬키 — 최근 핀이 위)
--
-- 활용:
--   - 메인 대시보드 "이어읽기" 카드에서 핀된 책을 최상단으로 정렬.
--   - 서재 카드 / 메인 카드 우상단의 별 아이콘 토글로 추가/해제.
--
-- RLS:
--   user_books 의 SELECT/INSERT/UPDATE/DELETE 정책이 이미 존재하며
--   이 컬럼들은 그대로 user_id 기반 권한 검증을 따름. 별도 정책 추가 불필요.
--
-- Idempotent:
--   IF NOT EXISTS 가드로 재실행 안전.
-- =============================================================================

-- 1) 컬럼 추가 (idempotent)
ALTER TABLE public.user_books
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.user_books
  ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ NULL;

-- 2) 정렬·필터 인덱스 (핀된 행만 부분 인덱스)
--    "최근 핀이 위" 쿼리: WHERE is_pinned = TRUE ORDER BY pinned_at DESC
CREATE INDEX IF NOT EXISTS idx_user_books_pinned
  ON public.user_books (user_id, pinned_at DESC)
  WHERE is_pinned = TRUE;

-- 3) 데이터 정합성 가드(선택):
--    is_pinned=TRUE 인데 pinned_at 이 NULL 이면 정렬 키가 사라짐 → CHECK 보장.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_books_pinned_at_required'
  ) THEN
    ALTER TABLE public.user_books
      ADD CONSTRAINT user_books_pinned_at_required
      CHECK (is_pinned = FALSE OR pinned_at IS NOT NULL);
  END IF;
END $$;

-- 4) 코멘트
COMMENT ON COLUMN public.user_books.is_pinned IS
  '메인 대시보드 즐겨찾기(핀) 여부. TRUE 인 행은 이어읽기 목록 최상단 고정.';
COMMENT ON COLUMN public.user_books.pinned_at IS
  '핀 고정 시각. is_pinned=TRUE 일 때만 NOT NULL. 정렬키(최근 핀 우선).';
