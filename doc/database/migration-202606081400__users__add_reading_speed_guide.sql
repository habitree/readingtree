-- ============================================================================
-- migration-202606081400__users__add_reading_speed_guide
-- 독서 속도 가이드(이상치 제외 범위) 사용자 지정값 저장
--
-- 독서 속도 평균 계산 시 "타당 범위(페이지당 최소~최대 초)"를 벗어난 세션을
-- 자동 제외한다(로버스트 집계). 그 범위를 사용자가 직접 지정할 수 있도록
-- JSONB 컬럼을 추가한다. NULL이면 앱 기본값(DEFAULT_PACE_CONSTANTS) 사용.
--   형태: { "minSecPerPage": number, "maxSecPerPage": number }
--
-- Idempotent: ADD COLUMN IF NOT EXISTS. RLS는 users 기존 정책(auth.uid()=id)로 보호.
-- ============================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS reading_speed_guide JSONB;

COMMENT ON COLUMN public.users.reading_speed_guide IS
  '독서 속도 가이드(이상치 제외) 사용자 범위 {minSecPerPage,maxSecPerPage}. NULL이면 앱 기본값.';
