-- ============================================
-- 마이그레이션: feature_requests - 외래키 수정
-- 날짜: 2026-01-29 16:00
-- ============================================
--
-- 변경 사항:
-- 1. user_id 외래키를 auth.users에서 public.users로 변경
--    (PostgREST가 public.users와의 관계 쿼리를 수행할 수 있도록)
--
-- 원인:
-- - auth.users를 참조하면 PostgREST 관계 쿼리(예: users(id,name,avatar_url))가 작동하지 않음
-- - public.users를 참조해야 Supabase JS 클라이언트에서 관계 쿼리 가능
--
-- 영향받는 테이블:
-- - feature_requests
-- - feature_request_votes
-- - feature_request_comments
-- ============================================

-- 1. feature_requests 테이블의 FK 수정
ALTER TABLE public.feature_requests
DROP CONSTRAINT IF EXISTS feature_requests_user_id_fkey;

ALTER TABLE public.feature_requests
ADD CONSTRAINT feature_requests_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 2. feature_request_votes 테이블의 FK 수정
ALTER TABLE public.feature_request_votes
DROP CONSTRAINT IF EXISTS feature_request_votes_user_id_fkey;

ALTER TABLE public.feature_request_votes
ADD CONSTRAINT feature_request_votes_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 3. feature_request_comments 테이블의 FK 수정
ALTER TABLE public.feature_request_comments
DROP CONSTRAINT IF EXISTS feature_request_comments_user_id_fkey;

ALTER TABLE public.feature_request_comments
ADD CONSTRAINT feature_request_comments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
