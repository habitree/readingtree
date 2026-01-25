-- =====================================================
-- 데모 사용자 30명 생성 마이그레이션
-- 작성일: 2025-01-25
-- 설명: 랭킹 시스템 테스트를 위한 데모 사용자 데이터
-- 실행: Supabase SQL Editor에서 실행
-- =====================================================

-- 주의: 이 스크립트는 Supabase SQL Editor에서 postgres 권한으로 실행해야 합니다.

-- =====================================================
-- STEP 1: auth.users에 데모 사용자 생성
-- =====================================================
-- Supabase의 auth.users 테이블에 직접 삽입
-- instance_id는 실제 프로젝트의 instance_id를 사용해야 함

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
    ('de000001-0000-0000-0000-000000000001'::UUID, 'demo01@readingtree.demo', '책벌레 민준', NOW() - INTERVAL '30 days'),
    ('de000002-0000-0000-0000-000000000002'::UUID, 'demo02@readingtree.demo', '독서광 서연', NOW() - INTERVAL '29 days'),
    ('de000003-0000-0000-0000-000000000003'::UUID, 'demo03@readingtree.demo', '필사왕 지호', NOW() - INTERVAL '28 days'),
    ('de000004-0000-0000-0000-000000000004'::UUID, 'demo04@readingtree.demo', '기록천재 하은', NOW() - INTERVAL '27 days'),
    ('de000005-0000-0000-0000-000000000005'::UUID, 'demo05@readingtree.demo', '다독가 도윤', NOW() - INTERVAL '26 days'),
    ('de000006-0000-0000-0000-000000000006'::UUID, 'demo06@readingtree.demo', '책사랑 서윤', NOW() - INTERVAL '25 days'),
    ('de000007-0000-0000-0000-000000000007'::UUID, 'demo07@readingtree.demo', '독서마니아 시우', NOW() - INTERVAL '24 days'),
    ('de000008-0000-0000-0000-000000000008'::UUID, 'demo08@readingtree.demo', '필독가 지우', NOW() - INTERVAL '23 days'),
    ('de000009-0000-0000-0000-000000000009'::UUID, 'demo09@readingtree.demo', '기록왕 예준', NOW() - INTERVAL '22 days'),
    ('de000010-0000-0000-0000-000000000010'::UUID, 'demo10@readingtree.demo', '책친구 수아', NOW() - INTERVAL '21 days'),
    ('de000011-0000-0000-0000-000000000011'::UUID, 'demo11@readingtree.demo', '독서천재 유준', NOW() - INTERVAL '20 days'),
    ('de000012-0000-0000-0000-000000000012'::UUID, 'demo12@readingtree.demo', '필사고수 지아', NOW() - INTERVAL '19 days'),
    ('de000013-0000-0000-0000-000000000013'::UUID, 'demo13@readingtree.demo', '기록달인 건우', NOW() - INTERVAL '18 days'),
    ('de000014-0000-0000-0000-000000000014'::UUID, 'demo14@readingtree.demo', '책나라 하윤', NOW() - INTERVAL '17 days'),
    ('de000015-0000-0000-0000-000000000015'::UUID, 'demo15@readingtree.demo', '독서귀재 선우', NOW() - INTERVAL '16 days'),
    ('de000016-0000-0000-0000-000000000016'::UUID, 'demo16@readingtree.demo', '필사의달인 예나', NOW() - INTERVAL '15 days'),
    ('de000017-0000-0000-0000-000000000017'::UUID, 'demo17@readingtree.demo', '기록의신 준서', NOW() - INTERVAL '14 days'),
    ('de000018-0000-0000-0000-000000000018'::UUID, 'demo18@readingtree.demo', '책세상 윤아', NOW() - INTERVAL '13 days'),
    ('de000019-0000-0000-0000-000000000019'::UUID, 'demo19@readingtree.demo', '독서명인 지환', NOW() - INTERVAL '12 days'),
    ('de000020-0000-0000-0000-000000000020'::UUID, 'demo20@readingtree.demo', '필사장인 소윤', NOW() - INTERVAL '11 days'),
    ('de000021-0000-0000-0000-000000000021'::UUID, 'demo21@readingtree.demo', '책마을 현우', NOW() - INTERVAL '10 days'),
    ('de000022-0000-0000-0000-000000000022'::UUID, 'demo22@readingtree.demo', '독서대가 이서', NOW() - INTERVAL '9 days'),
    ('de000023-0000-0000-0000-000000000023'::UUID, 'demo23@readingtree.demo', '기록명장 민서', NOW() - INTERVAL '8 days'),
    ('de000024-0000-0000-0000-000000000024'::UUID, 'demo24@readingtree.demo', '책읽는시간 채원', NOW() - INTERVAL '7 days'),
    ('de000025-0000-0000-0000-000000000025'::UUID, 'demo25@readingtree.demo', '독서여행 우진', NOW() - INTERVAL '6 days'),
    ('de000026-0000-0000-0000-000000000026'::UUID, 'demo26@readingtree.demo', '필사여정 서아', NOW() - INTERVAL '5 days'),
    ('de000027-0000-0000-0000-000000000027'::UUID, 'demo27@readingtree.demo', '기록천하 승우', NOW() - INTERVAL '4 days'),
    ('de000028-0000-0000-0000-000000000028'::UUID, 'demo28@readingtree.demo', '책과함께 지유', NOW() - INTERVAL '3 days'),
    ('de000029-0000-0000-0000-000000000029'::UUID, 'demo29@readingtree.demo', '독서일상 은우', NOW() - INTERVAL '2 days'),
    ('de000030-0000-0000-0000-000000000030'::UUID, 'demo30@readingtree.demo', '필사일기 다은', NOW() - INTERVAL '1 day')
) AS t(id, email, name, created_at)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 2: users 테이블에 데모 사용자 생성
-- =====================================================
INSERT INTO users (id, email, name, avatar_url, reading_goal, terms_agreed, privacy_agreed, consent_date, created_at, updated_at)
VALUES
    ('de000001-0000-0000-0000-000000000001', 'demo01@readingtree.demo', '책벌레 민준', NULL, 12, true, true, NOW(), NOW() - INTERVAL '30 days', NOW()),
    ('de000002-0000-0000-0000-000000000002', 'demo02@readingtree.demo', '독서광 서연', NULL, 12, true, true, NOW(), NOW() - INTERVAL '29 days', NOW()),
    ('de000003-0000-0000-0000-000000000003', 'demo03@readingtree.demo', '필사왕 지호', NULL, 12, true, true, NOW(), NOW() - INTERVAL '28 days', NOW()),
    ('de000004-0000-0000-0000-000000000004', 'demo04@readingtree.demo', '기록천재 하은', NULL, 12, true, true, NOW(), NOW() - INTERVAL '27 days', NOW()),
    ('de000005-0000-0000-0000-000000000005', 'demo05@readingtree.demo', '다독가 도윤', NULL, 12, true, true, NOW(), NOW() - INTERVAL '26 days', NOW()),
    ('de000006-0000-0000-0000-000000000006', 'demo06@readingtree.demo', '책사랑 서윤', NULL, 12, true, true, NOW(), NOW() - INTERVAL '25 days', NOW()),
    ('de000007-0000-0000-0000-000000000007', 'demo07@readingtree.demo', '독서마니아 시우', NULL, 12, true, true, NOW(), NOW() - INTERVAL '24 days', NOW()),
    ('de000008-0000-0000-0000-000000000008', 'demo08@readingtree.demo', '필독가 지우', NULL, 12, true, true, NOW(), NOW() - INTERVAL '23 days', NOW()),
    ('de000009-0000-0000-0000-000000000009', 'demo09@readingtree.demo', '기록왕 예준', NULL, 12, true, true, NOW(), NOW() - INTERVAL '22 days', NOW()),
    ('de000010-0000-0000-0000-000000000010', 'demo10@readingtree.demo', '책친구 수아', NULL, 12, true, true, NOW(), NOW() - INTERVAL '21 days', NOW()),
    ('de000011-0000-0000-0000-000000000011', 'demo11@readingtree.demo', '독서천재 유준', NULL, 12, true, true, NOW(), NOW() - INTERVAL '20 days', NOW()),
    ('de000012-0000-0000-0000-000000000012', 'demo12@readingtree.demo', '필사고수 지아', NULL, 12, true, true, NOW(), NOW() - INTERVAL '19 days', NOW()),
    ('de000013-0000-0000-0000-000000000013', 'demo13@readingtree.demo', '기록달인 건우', NULL, 12, true, true, NOW(), NOW() - INTERVAL '18 days', NOW()),
    ('de000014-0000-0000-0000-000000000014', 'demo14@readingtree.demo', '책나라 하윤', NULL, 12, true, true, NOW(), NOW() - INTERVAL '17 days', NOW()),
    ('de000015-0000-0000-0000-000000000015', 'demo15@readingtree.demo', '독서귀재 선우', NULL, 12, true, true, NOW(), NOW() - INTERVAL '16 days', NOW()),
    ('de000016-0000-0000-0000-000000000016', 'demo16@readingtree.demo', '필사의달인 예나', NULL, 12, true, true, NOW(), NOW() - INTERVAL '15 days', NOW()),
    ('de000017-0000-0000-0000-000000000017', 'demo17@readingtree.demo', '기록의신 준서', NULL, 12, true, true, NOW(), NOW() - INTERVAL '14 days', NOW()),
    ('de000018-0000-0000-0000-000000000018', 'demo18@readingtree.demo', '책세상 윤아', NULL, 12, true, true, NOW(), NOW() - INTERVAL '13 days', NOW()),
    ('de000019-0000-0000-0000-000000000019', 'demo19@readingtree.demo', '독서명인 지환', NULL, 12, true, true, NOW(), NOW() - INTERVAL '12 days', NOW()),
    ('de000020-0000-0000-0000-000000000020', 'demo20@readingtree.demo', '필사장인 소윤', NULL, 12, true, true, NOW(), NOW() - INTERVAL '11 days', NOW()),
    ('de000021-0000-0000-0000-000000000021', 'demo21@readingtree.demo', '책마을 현우', NULL, 12, true, true, NOW(), NOW() - INTERVAL '10 days', NOW()),
    ('de000022-0000-0000-0000-000000000022', 'demo22@readingtree.demo', '독서대가 이서', NULL, 12, true, true, NOW(), NOW() - INTERVAL '9 days', NOW()),
    ('de000023-0000-0000-0000-000000000023', 'demo23@readingtree.demo', '기록명장 민서', NULL, 12, true, true, NOW(), NOW() - INTERVAL '8 days', NOW()),
    ('de000024-0000-0000-0000-000000000024', 'demo24@readingtree.demo', '책읽는시간 채원', NULL, 12, true, true, NOW(), NOW() - INTERVAL '7 days', NOW()),
    ('de000025-0000-0000-0000-000000000025', 'demo25@readingtree.demo', '독서여행 우진', NULL, 12, true, true, NOW(), NOW() - INTERVAL '6 days', NOW()),
    ('de000026-0000-0000-0000-000000000026', 'demo26@readingtree.demo', '필사여정 서아', NULL, 12, true, true, NOW(), NOW() - INTERVAL '5 days', NOW()),
    ('de000027-0000-0000-0000-000000000027', 'demo27@readingtree.demo', '기록천하 승우', NULL, 12, true, true, NOW(), NOW() - INTERVAL '4 days', NOW()),
    ('de000028-0000-0000-0000-000000000028', 'demo28@readingtree.demo', '책과함께 지유', NULL, 12, true, true, NOW(), NOW() - INTERVAL '3 days', NOW()),
    ('de000029-0000-0000-0000-000000000029', 'demo29@readingtree.demo', '독서일상 은우', NULL, 12, true, true, NOW(), NOW() - INTERVAL '2 days', NOW()),
    ('de000030-0000-0000-0000-000000000030', 'demo30@readingtree.demo', '필사일기 다은', NULL, 12, true, true, NOW(), NOW() - INTERVAL '1 day', NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();

-- =====================================================
-- STEP 3: user_points 테이블에 포인트 데이터 삽입
-- =====================================================
INSERT INTO user_points (user_id, total_points, lifetime_points, current_level, streak_bonus_multiplier, last_activity_date, current_streak, longest_streak, created_at, updated_at)
VALUES
    -- 상위권 (1~5위)
    ('de000001-0000-0000-0000-000000000001', 12500, 15000, 10, 1.50, CURRENT_DATE, 365, 370, NOW(), NOW()),
    ('de000002-0000-0000-0000-000000000002', 9800, 11760, 9, 1.50, CURRENT_DATE, 180, 185, NOW(), NOW()),
    ('de000003-0000-0000-0000-000000000003', 8750, 10500, 8, 1.50, CURRENT_DATE, 120, 125, NOW(), NOW()),
    ('de000004-0000-0000-0000-000000000004', 7200, 8640, 7, 1.30, CURRENT_DATE, 90, 95, NOW(), NOW()),
    ('de000005-0000-0000-0000-000000000005', 6500, 7800, 7, 1.30, CURRENT_DATE, 75, 80, NOW(), NOW()),
    -- 중상위권 (6~10위)
    ('de000006-0000-0000-0000-000000000006', 5800, 6960, 6, 1.30, CURRENT_DATE, 60, 65, NOW(), NOW()),
    ('de000007-0000-0000-0000-000000000007', 5200, 6240, 6, 1.30, CURRENT_DATE, 45, 50, NOW(), NOW()),
    ('de000008-0000-0000-0000-000000000008', 4800, 5760, 5, 1.15, CURRENT_DATE, 40, 45, NOW(), NOW()),
    ('de000009-0000-0000-0000-000000000009', 4500, 5400, 5, 1.15, CURRENT_DATE, 35, 40, NOW(), NOW()),
    ('de000010-0000-0000-0000-000000000010', 4100, 4920, 5, 1.15, CURRENT_DATE, 30, 35, NOW(), NOW()),
    -- 중위권 (11~15위)
    ('de000011-0000-0000-0000-000000000011', 3800, 4560, 4, 1.15, CURRENT_DATE, 25, 30, NOW(), NOW()),
    ('de000012-0000-0000-0000-000000000012', 3500, 4200, 4, 1.15, CURRENT_DATE, 22, 27, NOW(), NOW()),
    ('de000013-0000-0000-0000-000000000013', 3200, 3840, 4, 1.15, CURRENT_DATE, 20, 25, NOW(), NOW()),
    ('de000014-0000-0000-0000-000000000014', 2900, 3480, 3, 1.05, CURRENT_DATE, 18, 23, NOW(), NOW()),
    ('de000015-0000-0000-0000-000000000015', 2700, 3240, 3, 1.05, CURRENT_DATE, 15, 20, NOW(), NOW()),
    -- 중하위권 (16~20위)
    ('de000016-0000-0000-0000-000000000016', 2500, 3000, 3, 1.05, CURRENT_DATE, 12, 17, NOW(), NOW()),
    ('de000017-0000-0000-0000-000000000017', 2300, 2760, 3, 1.05, CURRENT_DATE, 10, 15, NOW(), NOW()),
    ('de000018-0000-0000-0000-000000000018', 2100, 2520, 2, 1.05, CURRENT_DATE, 8, 13, NOW(), NOW()),
    ('de000019-0000-0000-0000-000000000019', 1900, 2280, 2, 1.05, CURRENT_DATE, 7, 12, NOW(), NOW()),
    ('de000020-0000-0000-0000-000000000020', 1700, 2040, 2, 1.05, CURRENT_DATE, 6, 11, NOW(), NOW()),
    -- 하위권 (21~25위)
    ('de000021-0000-0000-0000-000000000021', 1500, 1800, 2, 1.05, CURRENT_DATE, 5, 10, NOW(), NOW()),
    ('de000022-0000-0000-0000-000000000022', 1300, 1560, 2, 1.05, CURRENT_DATE, 4, 9, NOW(), NOW()),
    ('de000023-0000-0000-0000-000000000023', 1100, 1320, 1, 1.00, CURRENT_DATE, 3, 8, NOW(), NOW()),
    ('de000024-0000-0000-0000-000000000024', 900, 1080, 1, 1.00, CURRENT_DATE, 2, 7, NOW(), NOW()),
    ('de000025-0000-0000-0000-000000000025', 700, 840, 1, 1.00, CURRENT_DATE, 1, 6, NOW(), NOW()),
    -- 신규/초보 (26~30위)
    ('de000026-0000-0000-0000-000000000026', 500, 600, 1, 1.00, NULL, 0, 0, NOW(), NOW()),
    ('de000027-0000-0000-0000-000000000027', 350, 420, 1, 1.00, NULL, 0, 0, NOW(), NOW()),
    ('de000028-0000-0000-0000-000000000028', 200, 240, 1, 1.00, NULL, 0, 0, NOW(), NOW()),
    ('de000029-0000-0000-0000-000000000029', 100, 120, 1, 1.00, NULL, 0, 0, NOW(), NOW()),
    ('de000030-0000-0000-0000-000000000030', 50, 60, 1, 1.00, NULL, 0, 0, NOW(), NOW())
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

-- 데모 사용자 확인
SELECT 
    u.name,
    u.email,
    up.total_points,
    up.current_level,
    up.current_streak,
    up.longest_streak
FROM users u
LEFT JOIN user_points up ON u.id = up.user_id
WHERE u.email LIKE '%@readingtree.demo'
ORDER BY up.total_points DESC NULLS LAST;

-- 랭킹 확인
SELECT 
    ROW_NUMBER() OVER (ORDER BY up.total_points DESC) as rank,
    u.name,
    up.total_points as points,
    up.current_level as level,
    up.current_streak as streak
FROM users u
JOIN user_points up ON u.id = up.user_id
WHERE u.email LIKE '%@readingtree.demo'
ORDER BY up.total_points DESC
LIMIT 30;
