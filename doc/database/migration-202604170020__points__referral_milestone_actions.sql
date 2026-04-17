-- =========================================================================
-- Migration: points / referral milestone actions
-- Date: 2026-04-17
--
-- 레퍼럴 보상을 3단계로 분할해 행동을 유도한다.
--   (1) 가입:      피추천인 +100P (referral_bonus, 기존 50→100)
--   (2) 첫 책:     양쪽 +100P (referral_book_referrer / referral_book_referred)
--   (3) 첫 기록:   추천인 +200P (referral_success, 기존 100→200)
--                  피추천인 +100P (referral_note_referred)
--
-- 기존 사용자는 point_action_type enum 확장 + point_action_configs 업서트로만 영향.
-- =========================================================================

-- 1) enum 값 추가 (IF NOT EXISTS로 idempotent)
ALTER TYPE point_action_type ADD VALUE IF NOT EXISTS 'referral_book_referrer';
ALTER TYPE point_action_type ADD VALUE IF NOT EXISTS 'referral_book_referred';
ALTER TYPE point_action_type ADD VALUE IF NOT EXISTS 'referral_note_referred';

-- 2) point_action_configs 업서트
-- NOTE: 스키마가 프로젝트마다 조금 다를 수 있으므로 최소 컬럼만 건드린다.
--       컬럼명이 없는 경우에는 NOTICE만 발생하고 진행한다.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'point_action_configs') THEN
    -- 기존 보상액 조정
    UPDATE public.point_action_configs
       SET base_points = 100, description = '추천 가입 보너스', updated_at = NOW()
     WHERE action_type = 'referral_bonus';

    UPDATE public.point_action_configs
       SET base_points = 200, description = '친구 추천 보상 (첫 기록)', updated_at = NOW()
     WHERE action_type = 'referral_success';

    -- 신규 액션 등록 (없을 때만)
    INSERT INTO public.point_action_configs (action_type, base_points, description, category, is_repeatable, daily_limit, is_active)
    SELECT 'referral_book_referrer', 100, '친구가 첫 책을 등록했어요 (추천인)', 'social', true, NULL, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.point_action_configs WHERE action_type = 'referral_book_referrer'
    );

    INSERT INTO public.point_action_configs (action_type, base_points, description, category, is_repeatable, daily_limit, is_active)
    SELECT 'referral_book_referred', 100, '첫 책을 등록했어요 (피추천인 추가 보너스)', 'special', false, NULL, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.point_action_configs WHERE action_type = 'referral_book_referred'
    );

    INSERT INTO public.point_action_configs (action_type, base_points, description, category, is_repeatable, daily_limit, is_active)
    SELECT 'referral_note_referred', 100, '첫 기록을 작성했어요 (피추천인 추가 보너스)', 'special', false, NULL, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.point_action_configs WHERE action_type = 'referral_note_referred'
    );

    RAISE NOTICE '[referral milestones] point_action_configs 업데이트 완료';
  ELSE
    RAISE NOTICE '[referral milestones] point_action_configs 테이블이 없어 업데이트를 건너뜁니다';
  END IF;
END $$;

-- 3) referrals 테이블에 milestone 추적 컬럼 추가 (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'referrals' AND column_name = 'book_milestone_granted') THEN
    ALTER TABLE public.referrals ADD COLUMN book_milestone_granted BOOLEAN NOT NULL DEFAULT FALSE;
    RAISE NOTICE '[referrals] book_milestone_granted 컬럼 추가 완료';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'referrals' AND column_name = 'note_milestone_granted') THEN
    ALTER TABLE public.referrals ADD COLUMN note_milestone_granted BOOLEAN NOT NULL DEFAULT FALSE;
    RAISE NOTICE '[referrals] note_milestone_granted 컬럼 추가 완료';
  END IF;
END $$;

COMMENT ON COLUMN public.referrals.book_milestone_granted IS '첫 책 등록 보상(양쪽 100P) 지급 여부';
COMMENT ON COLUMN public.referrals.note_milestone_granted IS '첫 기록 작성 보상(피추천인 +100P) 지급 여부. 추천인 200P는 referrer_points_granted 기준.';
