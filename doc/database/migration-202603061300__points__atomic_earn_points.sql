-- A-2: 포인트 적립 원자성 보장 (일일 한도 + 중복 방지)
--
-- 문제: 일일 한도 체크(SELECT count) -> INSERT가 비원자적
--       동시 요청 시 한도 우회 가능, 비반복 액션 중복 적립 가능
-- 해결: FOR UPDATE 잠금 + 단일 트랜잭션 내 모든 검증/삽입

CREATE OR REPLACE FUNCTION earn_points_atomic(
  p_user_id UUID,
  p_action_type point_action_type,
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_config RECORD;
  v_daily_count INT;
  v_existing_id UUID;
  v_user_points RECORD;
  v_base_points INT;
  v_new_total INT;
  v_new_lifetime INT;
  v_today_start TIMESTAMPTZ;
  v_today_end TIMESTAMPTZ;
BEGIN
  -- 1. Get action config
  SELECT * INTO v_config
  FROM point_action_configs
  WHERE action_type = p_action_type AND is_active = true;

  IF v_config IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action', 'points_earned', 0, 'new_total', 0);
  END IF;

  v_base_points := v_config.base_points;

  -- 2. Lock user_points row (upsert to ensure it exists)
  INSERT INTO user_points (user_id, total_points, lifetime_points, current_level, current_streak, longest_streak)
  VALUES (p_user_id, 0, 0, 1, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_user_points
  FROM user_points
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- 3. Daily limit check (KST timezone)
  IF v_config.daily_limit IS NOT NULL THEN
    v_today_start := date_trunc('day', NOW() AT TIME ZONE 'Asia/Seoul') AT TIME ZONE 'Asia/Seoul';
    v_today_end := v_today_start + INTERVAL '1 day' - INTERVAL '1 second';

    SELECT COUNT(*) INTO v_daily_count
    FROM point_transactions
    WHERE user_id = p_user_id
      AND action_type = p_action_type
      AND created_at >= v_today_start
      AND created_at <= v_today_end;

    IF v_daily_count >= v_config.daily_limit THEN
      RETURN jsonb_build_object('success', false, 'error', 'Daily limit reached.', 'points_earned', 0, 'new_total', v_user_points.total_points);
    END IF;
  END IF;

  -- 4. Non-repeatable check
  IF NOT v_config.is_repeatable THEN
    SELECT id INTO v_existing_id
    FROM point_transactions
    WHERE user_id = p_user_id AND action_type = p_action_type
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Already claimed.', 'points_earned', 0, 'new_total', v_user_points.total_points);
    END IF;
  END IF;

  -- 5. Calculate new totals
  v_new_total := v_user_points.total_points + v_base_points;
  v_new_lifetime := v_user_points.lifetime_points + v_base_points;

  -- 6. Insert transaction
  INSERT INTO point_transactions (
    user_id, action_type, points, final_points,
    description, reference_id, reference_type,
    balance_after, metadata
  )
  VALUES (
    p_user_id, p_action_type, v_base_points, v_base_points,
    COALESCE(p_description, v_config.description),
    p_reference_id, p_reference_type,
    v_new_total, p_metadata
  );

  -- 7. Update user_points (trigger_update_user_level handles level automatically)
  UPDATE user_points
  SET total_points = v_new_total,
      lifetime_points = v_new_lifetime,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'points_earned', v_base_points,
    'new_total', v_new_total,
    'new_lifetime', v_new_lifetime,
    'old_level', v_user_points.current_level
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
