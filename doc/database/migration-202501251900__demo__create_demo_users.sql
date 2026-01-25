-- =====================================================
-- 데모 사용자 생성 마이그레이션 (하위 레벨만)
-- 작성일: 2025-01-25
-- 설명: 랭킹 시스템 테스트를 위한 하위 레벨 데모 사용자
--       실제 사용자들이 경쟁심을 느낄 수 있도록 낮은 레벨만 포함
-- 실행: Supabase SQL Editor에서 실행
-- =====================================================

-- 주의: 이 스크립트는 Supabase SQL Editor에서 postgres 권한으로 실행해야 합니다.

-- =====================================================
-- STEP 1: auth.users에 데모 사용자 생성 (하위 레벨 10명)
-- =====================================================

INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
)
SELECT 
    id,
    '00000000-0000-0000-0000-000000000000'::UUID,
    'authenticated',
    'authenticated',
    email,
    crypt('demo_password_not_used', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::JSONB,
    jsonb_build_object('name', name, 'is_demo', true),
    created_at,
    NOW()
FROM (VALUES
    -- 레벨 1~3 하위 사용자 10명
    ('de000021-0000-0000-0000-000000000021'::UUID, 'demo21@readingtree.demo', '새싹독서 민아', NOW() - INTERVAL '15 days'),
    ('de000022-0000-0000-0000-000000000022'::UUID, 'demo22@readingtree.demo', '책읽기시작 준혁', NOW() - INTERVAL '14 days'),
    ('de000023-0000-0000-0000-000000000023'::UUID, 'demo23@readingtree.demo', '독서입문 서현', NOW() - INTERVAL '13 days'),
    ('de000024-0000-0000-0000-000000000024'::UUID, 'demo24@readingtree.demo', '필사초보 지민', NOW() - INTERVAL '12 days'),
    ('de000025-0000-0000-0000-000000000025'::UUID, 'demo25@readingtree.demo', '기록시작 윤서', NOW() - INTERVAL '11 days'),
    ('de000026-0000-0000-0000-000000000026'::UUID, 'demo26@readingtree.demo', '책벗 시아', NOW() - INTERVAL '10 days'),
    ('de000027-0000-0000-0000-000000000027'::UUID, 'demo27@readingtree.demo', '기록천하 승우', NOW() - INTERVAL '9 days'),
    ('de000028-0000-0000-0000-000000000028'::UUID, 'demo28@readingtree.demo', '책과함께 지유', NOW() - INTERVAL '7 days'),
    ('de000029-0000-0000-0000-000000000029'::UUID, 'demo29@readingtree.demo', '독서일상 은우', NOW() - INTERVAL '5 days'),
    ('de000030-0000-0000-0000-000000000030'::UUID, 'demo30@readingtree.demo', '필사일기 다은', NOW() - INTERVAL '3 days')
) AS t(id, email, name, created_at)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 2: users 테이블에 데모 사용자 생성
-- =====================================================
INSERT INTO users (id, email, name, avatar_url, reading_goal, terms_agreed, privacy_agreed, consent_date, created_at, updated_at)
VALUES
    ('de000021-0000-0000-0000-000000000021', 'demo21@readingtree.demo', '새싹독서 민아', NULL, 12, true, true, NOW(), NOW() - INTERVAL '15 days', NOW()),
    ('de000022-0000-0000-0000-000000000022', 'demo22@readingtree.demo', '책읽기시작 준혁', NULL, 12, true, true, NOW(), NOW() - INTERVAL '14 days', NOW()),
    ('de000023-0000-0000-0000-000000000023', 'demo23@readingtree.demo', '독서입문 서현', NULL, 12, true, true, NOW(), NOW() - INTERVAL '13 days', NOW()),
    ('de000024-0000-0000-0000-000000000024', 'demo24@readingtree.demo', '필사초보 지민', NULL, 12, true, true, NOW(), NOW() - INTERVAL '12 days', NOW()),
    ('de000025-0000-0000-0000-000000000025', 'demo25@readingtree.demo', '기록시작 윤서', NULL, 12, true, true, NOW(), NOW() - INTERVAL '11 days', NOW()),
    ('de000026-0000-0000-0000-000000000026', 'demo26@readingtree.demo', '책벗 시아', NULL, 12, true, true, NOW(), NOW() - INTERVAL '10 days', NOW()),
    ('de000027-0000-0000-0000-000000000027', 'demo27@readingtree.demo', '기록천하 승우', NULL, 12, true, true, NOW(), NOW() - INTERVAL '9 days', NOW()),
    ('de000028-0000-0000-0000-000000000028', 'demo28@readingtree.demo', '책과함께 지유', NULL, 12, true, true, NOW(), NOW() - INTERVAL '7 days', NOW()),
    ('de000029-0000-0000-0000-000000000029', 'demo29@readingtree.demo', '독서일상 은우', NULL, 12, true, true, NOW(), NOW() - INTERVAL '5 days', NOW()),
    ('de000030-0000-0000-0000-000000000030', 'demo30@readingtree.demo', '필사일기 다은', NULL, 12, true, true, NOW(), NOW() - INTERVAL '3 days', NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();

-- =====================================================
-- STEP 3: user_points 테이블에 하위 레벨 포인트 데이터 삽입
-- 사용자들이 "나도 할 수 있다"고 느낄 수 있는 낮은 포인트
-- =====================================================
INSERT INTO user_points (user_id, total_points, lifetime_points, current_level, streak_bonus_multiplier, last_activity_date, current_streak, longest_streak, created_at, updated_at)
VALUES
    -- 레벨 3 (300~400점): 조금 열심히 하면 따라잡을 수 있는 수준
    ('de000021-0000-0000-0000-000000000021', 380, 400, 3, 1.05, CURRENT_DATE - INTERVAL '1 day', 5, 7, NOW(), NOW()),
    ('de000022-0000-0000-0000-000000000022', 320, 350, 3, 1.05, CURRENT_DATE - INTERVAL '2 days', 3, 5, NOW(), NOW()),
    
    -- 레벨 2 (100~299점): 며칠만 기록하면 따라잡을 수 있는 수준
    ('de000023-0000-0000-0000-000000000023', 280, 300, 2, 1.00, CURRENT_DATE - INTERVAL '1 day', 4, 6, NOW(), NOW()),
    ('de000024-0000-0000-0000-000000000024', 220, 250, 2, 1.00, CURRENT_DATE - INTERVAL '3 days', 2, 4, NOW(), NOW()),
    ('de000025-0000-0000-0000-000000000025', 180, 200, 2, 1.00, CURRENT_DATE - INTERVAL '2 days', 3, 3, NOW(), NOW()),
    ('de000026-0000-0000-0000-000000000026', 150, 170, 2, 1.00, CURRENT_DATE - INTERVAL '4 days', 1, 2, NOW(), NOW()),
    
    -- 레벨 1 (0~99점): 바로 앞지를 수 있는 수준
    ('de000027-0000-0000-0000-000000000027', 90, 100, 1, 1.00, CURRENT_DATE - INTERVAL '5 days', 0, 2, NOW(), NOW()),
    ('de000028-0000-0000-0000-000000000028', 60, 70, 1, 1.00, CURRENT_DATE - INTERVAL '6 days', 0, 1, NOW(), NOW()),
    ('de000029-0000-0000-0000-000000000029', 30, 40, 1, 1.00, NULL, 0, 0, NOW(), NOW()),
    ('de000030-0000-0000-0000-000000000030', 10, 15, 1, 1.00, NULL, 0, 0, NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE SET
    total_points = EXCLUDED.total_points,
    lifetime_points = EXCLUDED.lifetime_points,
    current_level = EXCLUDED.current_level,
    streak_bonus_multiplier = EXCLUDED.streak_bonus_multiplier,
    last_activity_date = EXCLUDED.last_activity_date,
    current_streak = EXCLUDED.current_streak,
    longest_streak = EXCLUDED.longest_streak,
    updated_at = NOW();

-- =====================================================
-- STEP 4: 확인 쿼리
-- =====================================================

-- 데모 사용자 랭킹 확인
SELECT 
    ROW_NUMBER() OVER (ORDER BY up.total_points DESC) as rank,
    u.name,
    up.total_points as points,
    up.current_level as level,
    up.current_streak as streak
FROM users u
JOIN user_points up ON u.id = up.user_id
WHERE u.email LIKE '%@readingtree.demo'
ORDER BY up.total_points DESC;
