-- A-1: 결제 포인트 충전/환불 원자성 보장
-- B-3: 멱등성 컬럼 추가
--
-- 문제: confirm/webhook에서 SELECT total_points -> UPDATE가 비원자적
--       더블클릭/웹훅 재시도 시 포인트 이중 충전 가능
-- 해결: RPC 함수 + points_charged_at 기반 멱등성 보장

-- 멱등성 보장용 컬럼 추가
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS points_charged_at TIMESTAMPTZ;

-- 결제 포인트 충전 RPC (멱등성 보장)
CREATE OR REPLACE FUNCTION charge_payment_points(
  p_order_id TEXT,
  p_user_id UUID,
  p_total_points INT,
  p_description TEXT,
  p_metadata JSONB DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_new_total INT;
BEGIN
  -- 1. Lock the order row for idempotency
  SELECT id, points_charged_at
  INTO v_order
  FROM payment_orders
  WHERE order_id = p_order_id
  FOR UPDATE;

  IF v_order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- Idempotency: already charged -> skip
  IF v_order.points_charged_at IS NOT NULL THEN
    SELECT total_points INTO v_new_total FROM user_points WHERE user_id = p_user_id;
    RETURN jsonb_build_object(
      'success', true,
      'already_charged', true,
      'points_charged', 0,
      'new_balance', COALESCE(v_new_total, 0)
    );
  END IF;

  -- 2. Mark order as points charged
  UPDATE payment_orders
  SET points_charged_at = NOW()
  WHERE id = v_order.id;

  -- 3. Upsert user_points with atomic increment
  INSERT INTO user_points (user_id, total_points, lifetime_points, current_level, current_streak, longest_streak)
  VALUES (p_user_id, p_total_points, p_total_points, 1, 0, 0)
  ON CONFLICT (user_id) DO UPDATE
  SET total_points = user_points.total_points + p_total_points,
      lifetime_points = user_points.lifetime_points + p_total_points,
      updated_at = NOW();

  -- Get new balance
  SELECT total_points INTO v_new_total FROM user_points WHERE user_id = p_user_id;

  -- 4. Insert point transaction
  INSERT INTO point_transactions (
    user_id, action_type, points, final_points,
    description, reference_type, balance_after, metadata
  )
  VALUES (
    p_user_id, 'point_purchase', p_total_points, p_total_points,
    p_description, 'payment', v_new_total, p_metadata
  );

  RETURN jsonb_build_object(
    'success', true,
    'already_charged', false,
    'points_charged', p_total_points,
    'new_balance', v_new_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 결제 포인트 환불 RPC (멱등성 보장)
CREATE OR REPLACE FUNCTION refund_payment_points(
  p_order_id TEXT,
  p_user_id UUID,
  p_total_points INT
) RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_new_total INT;
BEGIN
  -- Lock order row
  SELECT id, points_charged_at
  INTO v_order
  FROM payment_orders
  WHERE order_id = p_order_id
  FOR UPDATE;

  IF v_order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- Only refund if points were charged
  IF v_order.points_charged_at IS NULL THEN
    RETURN jsonb_build_object('success', true, 'already_refunded', true, 'refunded_points', 0);
  END IF;

  -- Atomic decrement (floor at 0)
  UPDATE user_points
  SET total_points = GREATEST(0, total_points - p_total_points),
      updated_at = NOW()
  WHERE user_id = p_user_id;

  SELECT total_points INTO v_new_total FROM user_points WHERE user_id = p_user_id;
  v_new_total := COALESCE(v_new_total, 0);

  -- Insert refund transaction
  INSERT INTO point_transactions (
    user_id, action_type, points, final_points,
    description, reference_type, balance_after
  )
  VALUES (
    p_user_id, 'point_refund', -p_total_points, -p_total_points,
    '결제 취소 포인트 회수', 'payment_cancel', v_new_total
  );

  -- Clear charged_at to prevent double refund
  UPDATE payment_orders
  SET points_charged_at = NULL
  WHERE id = v_order.id;

  RETURN jsonb_build_object(
    'success', true,
    'already_refunded', false,
    'refunded_points', p_total_points,
    'new_balance', v_new_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
