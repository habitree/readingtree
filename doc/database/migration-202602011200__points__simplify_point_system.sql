-- =============================================
-- 포인트 시스템 단순화 마이그레이션
-- =============================================
-- 목적: 스트릭 보너스 배율, 보너스 미션, 물주기 시스템 제거
-- 심리학 원칙: 연속 기록 숫자 자체가 가장 강력한 동기부여
-- =============================================

-- 1. user_points 테이블에서 streak_bonus_multiplier 컬럼 제거
-- (컬럼이 존재하는 경우에만 삭제)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_points'
        AND column_name = 'streak_bonus_multiplier'
    ) THEN
        ALTER TABLE public.user_points DROP COLUMN streak_bonus_multiplier;
        RAISE NOTICE 'user_points.streak_bonus_multiplier 컬럼 삭제 완료';
    ELSE
        RAISE NOTICE 'user_points.streak_bonus_multiplier 컬럼이 이미 없음';
    END IF;
END $$;

-- 2. point_transactions 테이블에서 multiplier 컬럼 제거
-- (컬럼이 존재하는 경우에만 삭제)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'point_transactions'
        AND column_name = 'multiplier'
    ) THEN
        ALTER TABLE public.point_transactions DROP COLUMN multiplier;
        RAISE NOTICE 'point_transactions.multiplier 컬럼 삭제 완료';
    ELSE
        RAISE NOTICE 'point_transactions.multiplier 컬럼이 이미 없음';
    END IF;
END $$;

-- 3. point_levels 테이블에서 streak_bonus 컬럼 제거
-- (컬럼이 존재하는 경우에만 삭제)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'point_levels'
        AND column_name = 'streak_bonus'
    ) THEN
        ALTER TABLE public.point_levels DROP COLUMN streak_bonus;
        RAISE NOTICE 'point_levels.streak_bonus 컬럼 삭제 완료';
    ELSE
        RAISE NOTICE 'point_levels.streak_bonus 컬럼이 이미 없음';
    END IF;
END $$;

-- 4. 불필요한 action_type 비활성화
-- (존재하지 않는 action_type은 무시됨)
UPDATE public.point_action_configs
SET is_active = false, updated_at = NOW()
WHERE action_type IN (
    -- 제거된 스트릭 마일스톤 (3개만 유지: 7일, 30일, 100일)
    'streak_3_days',
    'streak_14_days',
    'streak_365_days',
    -- 제거된 독서 활동
    'note_transcription',
    'book_progress_update',
    -- 제거된 소셜 활동
    'group_join',
    'group_create',
    -- 제거된 목표 달성
    'monthly_goal_achieve',
    'yearly_goal_achieve',
    -- 제거된 시스템 액션
    'point_used',
    'point_expired'
);

-- 5. 유지할 action_type 활성화 확인
UPDATE public.point_action_configs
SET is_active = true, updated_at = NOW()
WHERE action_type IN (
    -- 독서 활동
    'note_create',
    'note_quote',
    'note_memo',
    'note_photo',
    'book_add',
    'book_complete',
    -- 연속 기록
    'daily_first_activity',
    -- 스트릭 마일스톤 (3개)
    'streak_7_days',
    'streak_30_days',
    'streak_100_days',
    -- 미션
    'mission_complete',
    'all_missions_complete',
    -- 소셜
    'note_share',
    -- 특별
    'first_book',
    'first_note',
    -- 시스템
    'admin_adjust'
);

-- 6. 스트릭 마일스톤 포인트 업데이트 (계획에 따라)
-- 7일: 50P, 30일: 200P, 100일: 500P
UPDATE public.point_action_configs
SET base_points = 50, description = '7일 연속 달성', updated_at = NOW()
WHERE action_type = 'streak_7_days';

UPDATE public.point_action_configs
SET base_points = 200, description = '30일 연속 달성', updated_at = NOW()
WHERE action_type = 'streak_30_days';

UPDATE public.point_action_configs
SET base_points = 500, description = '100일 연속 달성', updated_at = NOW()
WHERE action_type = 'streak_100_days';

-- 7. 검증 쿼리 (마이그레이션 후 확인용)
-- user_points 컬럼 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_points'
ORDER BY ordinal_position;

-- point_transactions 컬럼 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'point_transactions'
ORDER BY ordinal_position;

-- point_levels 컬럼 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'point_levels'
ORDER BY ordinal_position;

-- 활성화된 액션 타입 확인
SELECT action_type, base_points, description, is_active
FROM public.point_action_configs
WHERE is_active = true
ORDER BY category, base_points;
