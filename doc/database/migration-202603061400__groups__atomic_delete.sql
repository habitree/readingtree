-- A-3: 그룹 삭제 트랜잭션 보장
--
-- 문제: 5개 테이블 순차 DELETE가 트랜잭션 없이 실행, 중간 실패 시 부분 삭제
-- 해결: FK ON DELETE CASCADE가 이미 설정되어 있으므로
--       groups 삭제만으로 자식 테이블 자동 정리됨
--       RPC는 리더 검증 + 단일 트랜잭션 보장

CREATE OR REPLACE FUNCTION delete_group_atomic(
  p_group_id UUID,
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_leader_id UUID;
BEGIN
  -- Lock and verify
  SELECT leader_id INTO v_leader_id
  FROM groups
  WHERE id = p_group_id
  FOR UPDATE;

  IF v_leader_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Group not found');
  END IF;

  IF v_leader_id != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Delete group (CASCADE handles child tables automatically)
  DELETE FROM groups WHERE id = p_group_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
