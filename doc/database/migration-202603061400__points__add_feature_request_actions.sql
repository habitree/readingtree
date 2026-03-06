-- 기능 요청 활동에 대한 포인트 액션 설정 추가
-- feature_request_create: 기능 요청 작성 (10P, 일 3회)
-- feature_request_vote: 기능 요청 투표 (2P, 일 10회)
-- feature_request_adopted: 기능 요청 채택 (50P, 무제한)

-- 1. enum에 새 값 추가
ALTER TYPE point_action_type ADD VALUE IF NOT EXISTS 'feature_request_create';
ALTER TYPE point_action_type ADD VALUE IF NOT EXISTS 'feature_request_vote';
ALTER TYPE point_action_type ADD VALUE IF NOT EXISTS 'feature_request_adopted';

-- 2. point_action_configs에 설정 추가
INSERT INTO point_action_configs (action_type, base_points, description, category, is_repeatable, daily_limit, is_active, icon)
VALUES
  ('feature_request_create', 10, '기능 요청 작성', 'community', true, 3, true, 'MessageSquarePlus'),
  ('feature_request_vote', 2, '기능 요청 투표', 'community', true, 10, true, 'ThumbsUp'),
  ('feature_request_adopted', 50, '기능 요청 채택', 'community', true, NULL, true, 'Award')
ON CONFLICT (action_type) DO UPDATE SET
  base_points = EXCLUDED.base_points,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_repeatable = EXCLUDED.is_repeatable,
  daily_limit = EXCLUDED.daily_limit,
  is_active = EXCLUDED.is_active,
  icon = EXCLUDED.icon;
