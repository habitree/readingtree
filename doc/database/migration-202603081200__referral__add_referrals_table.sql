-- ============================================================
-- Referral (추천인) 테이블
-- 콘텐츠 공유를 통한 자연스러운 레퍼럴 추적
-- ============================================================

-- 1. referrals 테이블 생성
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL DEFAULT 'note', -- 'note' | 'report'
  source_id UUID, -- 공유된 기록/리포트 ID (nullable)
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'completed'
  referrer_points_granted BOOLEAN NOT NULL DEFAULT FALSE,
  referred_points_granted BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 인덱스
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

-- 3. 유니크 제약 (동일 피추천인 중복 방지)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_referrals_referred_id'
  ) THEN
    ALTER TABLE public.referrals ADD CONSTRAINT uq_referrals_referred_id UNIQUE (referred_id);
  END IF;
END $$;

-- 4. RLS 활성화
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 (4가지)
-- SELECT: 본인이 추천인이거나 피추천인인 경우만
DROP POLICY IF EXISTS "referrals_select_own" ON public.referrals;
CREATE POLICY "referrals_select_own" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- INSERT: 서비스 역할만 (서버 액션에서 admin client 사용)
DROP POLICY IF EXISTS "referrals_insert_service" ON public.referrals;
CREATE POLICY "referrals_insert_service" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referred_id);

-- UPDATE: 서비스 역할만
DROP POLICY IF EXISTS "referrals_update_service" ON public.referrals;
CREATE POLICY "referrals_update_service" ON public.referrals
  FOR UPDATE USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- DELETE: 불가
DROP POLICY IF EXISTS "referrals_delete_none" ON public.referrals;
CREATE POLICY "referrals_delete_none" ON public.referrals
  FOR DELETE USING (false);
