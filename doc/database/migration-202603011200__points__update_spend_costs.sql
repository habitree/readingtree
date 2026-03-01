-- Migration: 포인트 소비 비용 조정 + 웰컴 보너스 + AI 리포트 게이트
-- Date: 2026-03-01
-- Description:
--   1. point_action_type ENUM에 'ai_report_spend', 'welcome_bonus' 추가
--   2. ai_chat_spend base_points: -500 → -100
--   3. ocr_spend base_points: -300 → -80
--   4. ai_report_spend 신규 INSERT (base_points: -150)
--   5. welcome_bonus 신규 INSERT (base_points: 300)
--   6. subscription_tiers 무료 티어 ocr_daily 5→3, ai_report_monthly 추가
-- Idempotent: 모든 구문은 재실행 안전
-- 주의: ALTER TYPE ADD VALUE는 트랜잭션 블록 밖에서 실행해야 함

-- ============================================================
-- 0. point_action_type ENUM 확장 (트랜잭션 밖에서 실행)
--    ALTER TYPE ADD VALUE는 BEGIN/COMMIT 블록 안에서 실행 불가
--    기존 spend_types 마이그레이션 미적용분도 포함
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'ai_chat_spend'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'point_action_type')
  ) THEN
    ALTER TYPE point_action_type ADD VALUE 'ai_chat_spend';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'ocr_spend'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'point_action_type')
  ) THEN
    ALTER TYPE point_action_type ADD VALUE 'ocr_spend';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'point_refund'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'point_action_type')
  ) THEN
    ALTER TYPE point_action_type ADD VALUE 'point_refund';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'ai_report_spend'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'point_action_type')
  ) THEN
    ALTER TYPE point_action_type ADD VALUE 'ai_report_spend';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'welcome_bonus'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'point_action_type')
  ) THEN
    ALTER TYPE point_action_type ADD VALUE 'welcome_bonus';
  END IF;
END $$;

-- ============================================================
-- 1. 기존 spend_types 시드 데이터 (미적용분 포함, idempotent)
-- ============================================================
INSERT INTO point_action_configs (action_type, base_points, description, category, is_repeatable, daily_limit, is_active, icon)
VALUES
  ('ai_chat_spend', -100, 'AI 채팅 포인트 차감', 'system', true, null, true, 'MessageSquare'),
  ('ocr_spend', -80, 'OCR 처리 포인트 차감', 'system', true, null, true, 'ScanText'),
  ('point_refund', 0, '포인트 환불', 'system', true, null, true, 'RotateCcw')
ON CONFLICT (action_type) DO UPDATE
SET base_points = EXCLUDED.base_points,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ============================================================
-- 3. ai_report_spend 신규 추가 (idempotent)
-- ============================================================
INSERT INTO point_action_configs (
  action_type, base_points, description, category,
  is_repeatable, daily_limit, is_active, icon
)
VALUES (
  'ai_report_spend', -150, 'AI 리포트 포인트 소비', 'system',
  true, NULL, true, NULL
)
ON CONFLICT (action_type) DO UPDATE
SET base_points = EXCLUDED.base_points,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ============================================================
-- 4. welcome_bonus 신규 추가 (idempotent)
-- ============================================================
INSERT INTO point_action_configs (
  action_type, base_points, description, category,
  is_repeatable, daily_limit, is_active, icon
)
VALUES (
  'welcome_bonus', 300, '가입 축하 보너스', 'special',
  false, NULL, true, '🎉'
)
ON CONFLICT (action_type) DO UPDATE
SET base_points = EXCLUDED.base_points,
    description = EXCLUDED.description,
    is_repeatable = EXCLUDED.is_repeatable,
    updated_at = NOW();

-- ============================================================
-- 5. subscription_tiers 테이블 생성 (미적용 시) + 시드 데이터
-- ============================================================
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  price_monthly INTEGER NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'subscription_tiers_public_read' AND tablename = 'subscription_tiers') THEN
    CREATE POLICY subscription_tiers_public_read ON subscription_tiers FOR SELECT USING (true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES subscription_tiers(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_subscriptions_own_read' AND tablename = 'user_subscriptions') THEN
    CREATE POLICY user_subscriptions_own_read ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_subscriptions_own_insert' AND tablename = 'user_subscriptions') THEN
    CREATE POLICY user_subscriptions_own_insert ON user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_subscriptions_own_update' AND tablename = 'user_subscriptions') THEN
    CREATE POLICY user_subscriptions_own_update ON user_subscriptions FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_subscriptions_own_delete' AND tablename = 'user_subscriptions') THEN
    CREATE POLICY user_subscriptions_own_delete ON user_subscriptions FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 시드 데이터: 무료 (ocr_daily:3, ai_report_monthly:2 반영)
INSERT INTO subscription_tiers (name, display_name, price_monthly, features)
VALUES
  ('free', '무료', 0, '{"ai_chat_daily": 3, "ocr_daily": 3, "ai_report_monthly": 2, "groups_create": 2}'),
  ('premium', '프리미엄', 4900, '{"ai_chat_daily": -1, "ocr_daily": -1, "ai_report_monthly": -1, "groups_create": -1}')
ON CONFLICT (name) DO UPDATE
SET features = EXCLUDED.features,
    updated_at = NOW();
