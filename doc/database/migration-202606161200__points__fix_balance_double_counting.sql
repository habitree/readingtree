-- 포인트 잔액 이중 관리(트리거 + RPC) 해소 + 음수 방지 + 원장 기준 백필
--
-- 배경(점검: doc/planning/point-settlement-audit-2026-06-16.md):
--   trigger_update_user_points 가 point_transactions INSERT 마다 user_points.total_points 를
--   final_points 만큼 상대 가감한다. 그런데 모든 RPC(earn/spend/charge/refund)도 각자
--   user_points 를 직접 갱신하므로 잔액이 "이중 관리"된다.
--     - earn/spend_points_atomic: 절대값 덮어쓰기 → 단건은 우연히 정상, 동시 처리 시 손실
--     - charge/refund_payment_points: 상대값 증감 → 트리거와 합쳐 정확히 2배(환불은 음수 가능)
--   실측: 사용자 21명 중 13명 캐시-원장 불일치, 동시 INSERT 경합 8건, 결제 거래는 아직 0건.
--
-- 해결: 잔액의 단일 소유자를 "RPC"로 일원화하기 위해 트리거를 제거한다.
--   (point_transactions 에 INSERT 만 하고 user_points 를 직접 갱신하지 않는 '트리거 의존'
--    경로는 코드 전수 점검 결과 없음 → 트리거 제거로 모든 적립/차감/충전/환불이 정상화)
--
-- 추가 발견(B6): 레벨 트리거 update_user_level() 가 배율 시스템 제거 후에도
--   존재하지 않는 컬럼(point_levels.streak_bonus, user_points.streak_bonus_multiplier)을
--   참조한다. 레벨이 바뀌는 user_points UPDATE 마다 에러 → 레벨업 시점 적립이 통째 롤백되어
--   "포인트가 안 쌓이는" 증상을 유발. 배율 참조를 제거한 버전으로 교체한다.
--
-- 주의: 프로덕션 단일 DB 운영 중. 반드시 백업/스냅샷 후 적용할 것.
-- 본 스크립트는 idempotent 하다(여러 번 실행해도 결과 동일).

BEGIN;

-- =====================================================
-- 1) 잔액 이중 관리 트리거 제거 (B1 / B2 / B3 근본 해결)
-- =====================================================
DROP TRIGGER IF EXISTS trigger_update_user_points ON point_transactions;

-- 트리거 함수는 다른 곳에서 호출하지 않으므로 함께 제거(존재할 때만).
DROP FUNCTION IF EXISTS update_user_points_on_transaction();

-- =====================================================
-- 1-2) 레벨 트리거 함수 정상화 (B6: 제거된 배율 컬럼 참조 삭제)
--      백필이 lifetime 변경 시 이 트리거를 발동하므로 백필보다 먼저 교체한다.
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
DECLARE
  new_level INTEGER;
BEGIN
  SELECT COALESCE(MAX(level), 1)
  INTO new_level
  FROM point_levels
  WHERE required_points <= NEW.lifetime_points;

  IF new_level <> NEW.current_level THEN
    NEW.current_level := new_level;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2) 음수 잔액 방지 CHECK 제약 (B2 환불 음수·차감 음수 원천 차단)
--    기존 데이터에 음수 잔액 없음(점검 시 0명) → 안전하게 추가
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.user_points'::regclass
      AND conname = 'user_points_total_points_non_negative'
  ) THEN
    ALTER TABLE public.user_points
      ADD CONSTRAINT user_points_total_points_non_negative
      CHECK (total_points >= 0);
  END IF;
END $$;

-- =====================================================
-- 3) 원장 기준 백필 (B3 손실 복구 + 누적 불일치 정정)
--    - 원장(point_transactions)이 있는 사용자만 대상(데모/시드 계정 보존)
--    - total_points  = 원장 합(음수 방지 GREATEST 0)
--    - lifetime_points = max(현재값, 원장 양수합)  ← 레벨 하락 방지(누적은 줄이지 않음)
-- =====================================================
WITH ledger AS (
  SELECT
    user_id,
    GREATEST(0, SUM(final_points))                              AS total_sum,
    COALESCE(SUM(final_points) FILTER (WHERE final_points > 0), 0) AS lifetime_sum
  FROM point_transactions
  GROUP BY user_id
)
UPDATE user_points up
SET total_points    = l.total_sum,
    lifetime_points = GREATEST(up.lifetime_points, l.lifetime_sum),
    updated_at      = NOW()
FROM ledger l
WHERE up.user_id = l.user_id
  AND (
    up.total_points    <> l.total_sum
    OR up.lifetime_points < l.lifetime_sum
  );

COMMIT;

-- =====================================================
-- 검증(적용 후 수동 실행 권장): 0행이어야 정상
-- =====================================================
-- WITH ledger AS (
--   SELECT user_id, COALESCE(SUM(final_points),0) AS ledger_sum
--   FROM point_transactions GROUP BY user_id
-- )
-- SELECT up.user_id, up.total_points AS cached, l.ledger_sum,
--        up.total_points - l.ledger_sum AS diff
-- FROM user_points up
-- JOIN ledger l ON l.user_id = up.user_id
-- WHERE up.total_points <> l.ledger_sum;
--
-- SELECT user_id, total_points FROM user_points WHERE total_points < 0;
