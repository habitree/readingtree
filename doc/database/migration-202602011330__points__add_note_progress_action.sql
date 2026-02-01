-- ============================================================================
-- 마이그레이션: point_action_configs에 note_progress 액션 추가
-- 목적: 진행 기록 시 포인트 적립을 위한 액션 설정 추가
-- 작성일: 2026-02-01
-- ============================================================================

-- note_progress 액션 추가 (존재하지 않는 경우에만)
INSERT INTO point_action_configs (action_type, base_points, description, category, is_repeatable, daily_limit, icon)
VALUES ('note_progress', 5, '진행 기록', 'reading', true, 10, 'TrendingUp')
ON CONFLICT (action_type) DO NOTHING;
