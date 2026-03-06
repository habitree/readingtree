-- =====================================================
-- 결제 시스템 테이블 마이그레이션
-- 토스페이먼츠 연동을 위한 payment_orders, payment_history
-- =====================================================
-- 주의: ALTER TYPE ADD VALUE는 트랜잭션 블록 밖에서 실행해야 함
-- Supabase SQL Editor에서 이 파일을 2단계로 나눠 실행하세요:
--   1단계: "ENUM 확장" 섹션만 먼저 실행
--   2단계: 나머지 전체 실행

-- ============================================================
-- 1단계: ENUM 확장 (이 부분만 먼저 별도 실행)
-- ============================================================
-- point_action_type에 'point_purchase' 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'point_purchase'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'point_action_type')
  ) THEN
    ALTER TYPE point_action_type ADD VALUE 'point_purchase';
  END IF;
END $$;

-- ============================================================
-- 2단계: 테이블 생성 (ENUM 확장 후 실행)
-- ============================================================

-- 2. payment_orders 테이블 (결제 주문)
CREATE TABLE IF NOT EXISTS payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id text UNIQUE NOT NULL,
  package_id text NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  points integer NOT NULL CHECK (points > 0),
  bonus_points integer NOT NULL DEFAULT 0,
  first_purchase_bonus integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled', 'expired')),
  payment_key text,
  payment_method text,
  failure_code text,
  failure_message text,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- payment_orders 인덱스
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON payment_orders(created_at);

-- 3. payment_history 테이블 (감사 로그)
CREATE TABLE IF NOT EXISTS payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- payment_history 인덱스
CREATE INDEX IF NOT EXISTS idx_payment_history_order_id ON payment_history(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);

-- 4. updated_at 트리거
CREATE OR REPLACE FUNCTION update_payment_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_payment_orders_updated_at ON payment_orders;
CREATE TRIGGER set_payment_orders_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_orders_updated_at();

-- 5. is_first_purchase 함수
CREATE OR REPLACE FUNCTION is_first_purchase(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM payment_orders
    WHERE user_id = p_user_id
      AND status = 'confirmed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS 활성화 및 정책

-- payment_orders RLS
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- 본인 주문 조회
DO $$ BEGIN
  CREATE POLICY "payment_orders_select_own" ON payment_orders
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 본인 주문 생성
DO $$ BEGIN
  CREATE POLICY "payment_orders_insert_own" ON payment_orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 본인 주문 수정 (상태 업데이트)
DO $$ BEGIN
  CREATE POLICY "payment_orders_update_own" ON payment_orders
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 관리자 전체 조회
DO $$ BEGIN
  CREATE POLICY "payment_orders_admin_select" ON payment_orders
    FOR SELECT USING (is_admin_user());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- payment_history RLS
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- 본인 이력 조회
DO $$ BEGIN
  CREATE POLICY "payment_history_select_own" ON payment_history
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 본인 이력 생성
DO $$ BEGIN
  CREATE POLICY "payment_history_insert_own" ON payment_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 관리자 전체 조회
DO $$ BEGIN
  CREATE POLICY "payment_history_admin_select" ON payment_history
    FOR SELECT USING (is_admin_user());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 7. Service Role용 정책 (웹훅에서 사용)
-- service_role은 RLS를 우회하므로 별도 정책 불필요
