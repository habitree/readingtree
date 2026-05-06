-- =============================================================================
-- migration-202605061500__user_books__add_hidden_from_home.sql
--
-- 목적:
--   user_books 에 "홈 화면에서만 숨김" 플래그 추가.
--   - hidden_from_home BOOLEAN: 메인 대시보드 이어읽기 카드에서만 노출 차단.
--
-- 정책:
--   - 책 자체 삭제가 아니므로 서재(/books)에는 그대로 보임.
--   - is_pinned=TRUE 인 책은 hidden_from_home 과 무관하게 홈 노출(우선권).
--     → 사용자 의도가 명시적인 핀이 우선.
--   - 핀 토글로 핀이 켜지면 hidden_from_home 도 함께 FALSE 로 해제됨(server action).
--
-- RLS:
--   기존 user_books 의 SELECT/INSERT/UPDATE/DELETE 정책으로 권한 자동 검증.
--   별도 정책 추가 불필요.
--
-- Idempotent.
-- =============================================================================

-- 1) 컬럼 추가
ALTER TABLE public.user_books
  ADD COLUMN IF NOT EXISTS hidden_from_home BOOLEAN NOT NULL DEFAULT FALSE;

-- 2) 인덱스 — 홈 쿼리 필터에 사용. 숨김된 행만 부분 인덱스(데이터 적은 쪽).
CREATE INDEX IF NOT EXISTS idx_user_books_hidden_from_home
  ON public.user_books (user_id)
  WHERE hidden_from_home = TRUE;

-- 3) 코멘트
COMMENT ON COLUMN public.user_books.hidden_from_home IS
  '메인 대시보드 이어읽기에서 숨김 여부. is_pinned=TRUE 인 행은 이 값과 무관하게 노출. 서재(/books)는 영향 없음.';
