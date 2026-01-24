-- =============================================================================
-- Migration: users 테이블에 ui_style 컬럼 추가
-- Description: 사용자가 선호하는 UI 스타일(톤앤매너) 저장
-- Date: 2026-01-25
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ui_style 컬럼 추가
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  -- ui_style 컬럼 추가 (없는 경우에만)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'ui_style'
  ) THEN
    ALTER TABLE public.users
    ADD COLUMN ui_style text DEFAULT 'minimal';

    RAISE NOTICE 'Column ui_style added to users table';
  ELSE
    RAISE NOTICE 'Column ui_style already exists';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. 유효성 체크 제약 조건 추가
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  -- 제약 조건이 없는 경우에만 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'users_ui_style_check'
  ) THEN
    ALTER TABLE public.users
    ADD CONSTRAINT users_ui_style_check
    CHECK (ui_style IN ('minimal', 'warm', 'professional', 'poetic'));

    RAISE NOTICE 'Constraint users_ui_style_check added';
  ELSE
    RAISE NOTICE 'Constraint users_ui_style_check already exists';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. 검증 쿼리
-- -----------------------------------------------------------------------------
-- 컬럼 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
AND column_name = 'ui_style';

-- 제약 조건 확인
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'users_ui_style_check';
