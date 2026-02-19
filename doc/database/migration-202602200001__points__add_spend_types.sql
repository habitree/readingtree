-- Migration: 포인트 소비 타입 추가
-- 파일명: migration-202602200001__points__add_spend_types.sql
-- 설명: point_action_type ENUM에 소비/환불 타입 추가

-- Idempotent: 이미 존재하면 무시
DO $$
BEGIN
  -- ai_chat_spend 추가
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'ai_chat_spend'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'point_action_type')
  ) THEN
    ALTER TYPE point_action_type ADD VALUE 'ai_chat_spend';
  END IF;

  -- ocr_spend 추가
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'ocr_spend'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'point_action_type')
  ) THEN
    ALTER TYPE point_action_type ADD VALUE 'ocr_spend';
  END IF;

  -- point_refund 추가
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'point_refund'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'point_action_type')
  ) THEN
    ALTER TYPE point_action_type ADD VALUE 'point_refund';
  END IF;
END $$;

-- 소비 액션 설정 추가 (idempotent)
INSERT INTO point_action_configs (action_type, base_points, description, category, is_repeatable, daily_limit, is_active, icon)
VALUES
  ('ai_chat_spend', -500, 'AI 채팅 포인트 차감', 'system', true, null, true, 'MessageSquare'),
  ('ocr_spend', -300, 'OCR 처리 포인트 차감', 'system', true, null, true, 'ScanText'),
  ('point_refund', 0, '포인트 환불', 'system', true, null, true, 'RotateCcw')
ON CONFLICT (action_type) DO NOTHING;
