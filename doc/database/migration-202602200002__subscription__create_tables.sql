-- Migration: 구독 시스템 테이블 생성
-- 파일명: migration-202602200002__subscription__create_tables.sql

-- 1. subscription_tiers 테이블
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

-- RLS
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'subscription_tiers_public_read' AND tablename = 'subscription_tiers') THEN
    CREATE POLICY subscription_tiers_public_read ON subscription_tiers FOR SELECT USING (true);
  END IF;
END $$;

-- 2. user_subscriptions 테이블
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

-- RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 본인만 읽기
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

-- 3. 시드 데이터
INSERT INTO subscription_tiers (name, display_name, price_monthly, features)
VALUES
  ('free', '무료', 0, '{"ai_chat_daily": 3, "ocr_daily": 5, "groups_create": 2}'),
  ('premium', '프리미엄', 4900, '{"ai_chat_daily": -1, "ocr_daily": -1, "groups_create": -1}')
ON CONFLICT (name) DO NOTHING;
