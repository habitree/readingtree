-- ============================================================
-- 마이그레이션: 구독 티어 비활성화 + 포인트 충전 패키지 테이블
-- 날짜: 2026-03-02
-- 설명: 3단계 구독 티어를 비활성화하고 포인트 충전 패키지 테이블 생성
-- ============================================================

-- 1. 기존 subscription_tiers 비활성화 (삭제 안 함 - 데이터 무결성)
-- UPDATE subscription_tiers SET is_active = false WHERE is_active = true;

-- 2. point_packages 테이블 생성 (Idempotent)
CREATE TABLE IF NOT EXISTS point_packages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id text NOT NULL UNIQUE,
  display_name text NOT NULL,
  points integer NOT NULL CHECK (points > 0),
  bonus_points integer NOT NULL DEFAULT 0 CHECK (bonus_points >= 0),
  price integer NOT NULL CHECK (price > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. RLS 활성화
ALTER TABLE point_packages ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책: 누구나 활성 패키지 조회 가능
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'point_packages' AND policyname = 'point_packages_select_active'
  ) THEN
    CREATE POLICY point_packages_select_active ON point_packages
      FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

-- 5. 3개 패키지 데이터 삽입 (Idempotent)
INSERT INTO point_packages (package_id, display_name, points, bonus_points, price)
VALUES
  ('light',    '라이트',    500,  0,   1900),
  ('standard', '스탠다드',  1200, 200, 3900),
  ('premium',  '프리미엄',  3000, 500, 6900)
ON CONFLICT (package_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  points       = EXCLUDED.points,
  bonus_points = EXCLUDED.bonus_points,
  price        = EXCLUDED.price,
  is_active    = true,
  updated_at   = now();

-- 6. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_point_packages_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_point_packages_updated_at ON point_packages;
CREATE TRIGGER trigger_point_packages_updated_at
  BEFORE UPDATE ON point_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_point_packages_updated_at();
