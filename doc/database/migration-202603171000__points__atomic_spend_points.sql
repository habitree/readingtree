-- 포인트 차감 원자성 보장 (TOCTOU Race Condition 방지)
--
-- 문제: spendPoints()에서 잔액 확인(SELECT) → 트랜잭션 삽입(INSERT) → 잔액 업데이트(UPDATE)가 비원자적
--       동시 요청 시 음수 잔액 또는 이중 차감 가능
-- 해결: FOR UPDATE 잠금 + 단일 트랜잭션 내 잔액 확인/차감/기록

CREATE OR REPLACE FUNCTION spend_points_atomic(
  p_user_id UUID,
  p_action_type point_action_type,
  p_cost INT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_user_points RECORD;
  v_new_total INT;
BEGIN
  -- 1. Lock user_points row
  SELECT * INTO v_user_points
  FROM user_points
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_user_points IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '포인트 정보를 찾을 수 없습니다.',
      'points_spent', 0,
      'new_total', 0
    );
  END IF;

  -- 2. 잔액 확인 (잠금 상태에서)
  IF v_user_points.total_points < p_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '포인트가 부족합니다.',
      'points_spent', 0,
      'new_total', v_user_points.total_points
    );
  END IF;

  -- 3. 새 잔액 계산
  v_new_total := v_user_points.total_points - p_cost;

  -- 4. 트랜잭션 기록 삽입
  INSERT INTO point_transactions (
    user_id, action_type, points, final_points,
    description, balance_after, metadata
  )
  VALUES (
    p_user_id, p_action_type, -p_cost, -p_cost,
    COALESCE(p_description, p_action_type::TEXT || ' 포인트 차감'),
    v_new_total, p_metadata
  );

  -- 5. 잔액 업데이트 (원자적)
  UPDATE user_points
  SET total_points = v_new_total,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'points_spent', p_cost,
    'new_total', v_new_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
