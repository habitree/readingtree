-- ============================================================
-- 구독 중심 수익 모델 v2.0 마이그레이션
-- subscription_tiers 업데이트 + user_subscriptions 컬럼 추가
-- 적용일: 2026-04-10
-- ============================================================

-- 1) subscription_tiers에 필요한 컬럼 추가 (idempotent)
ALTER TABLE subscription_tiers
  ADD COLUMN IF NOT EXISTS price_yearly integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_points_monthly integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- 2) 기존 구 데이터 비활성화 (is_active = false)
UPDATE subscription_tiers SET is_active = false WHERE name IN ('reader', 'reader_master');

-- 3) free 티어 업데이트 (v2.0 무료 한도 반영)
UPDATE subscription_tiers
SET
  features = jsonb_build_object(
    'ai_chat_monthly', 10,
    'ocr_monthly', 3,
    'ai_report_monthly', 1,
    'notes_monthly', 100,
    'groups_create', 5,
    'groups_join', 5,
    'bookshelf_max', 10,
    'advanced_stats', true,
    'data_export', true
  ),
  bonus_points_monthly = 0,
  price_monthly = 0,
  price_yearly = 0,
  sort_order = 0,
  updated_at = now()
WHERE name = 'free';

-- 4) 독서가 (reader_v2) 추가
INSERT INTO subscription_tiers (name, display_name, price_monthly, price_yearly, bonus_points_monthly, sort_order, features, is_active)
VALUES (
  'reader_v2',
  '독서가',
  4900,
  49000,
  200,
  1,
  jsonb_build_object(
    'ai_chat_monthly', 50,
    'ocr_monthly', 20,
    'ai_report_monthly', 3,
    'notes_monthly', -1,
    'groups_create', 10,
    'groups_join', -1,
    'bookshelf_max', -1,
    'advanced_stats', true,
    'data_export', true
  ),
  true
)
ON CONFLICT DO NOTHING;

-- 5) 독서마스터 (master_v2) 추가
INSERT INTO subscription_tiers (name, display_name, price_monthly, price_yearly, bonus_points_monthly, sort_order, features, is_active)
VALUES (
  'master_v2',
  '독서마스터',
  9900,
  99000,
  500,
  2,
  jsonb_build_object(
    'ai_chat_monthly', -1,
    'ocr_monthly', -1,
    'ai_report_monthly', -1,
    'notes_monthly', -1,
    'groups_create', -1,
    'groups_join', -1,
    'bookshelf_max', -1,
    'advanced_stats', true,
    'data_export', true,
    'daily_soft_cap_chat', 200,
    'daily_soft_cap_ocr', 100
  ),
  true
)
ON CONFLICT DO NOTHING;

-- 6) user_subscriptions에 결제 관련 컬럼 추가
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT 'polar',
  ADD COLUMN IF NOT EXISTS provider_subscription_id text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_reason text;

-- 7) user_subscriptions에 user_id 유니크 인덱스 (활성 구독 1개만)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_active_user
  ON user_subscriptions (user_id)
  WHERE status = 'active';
