-- =====================================================
-- 포인트 시스템 마이그레이션
-- 작성일: 2025-01-25
-- 설명: 사용자 포인트 적립/사용 시스템
-- =====================================================

-- 1. 포인트 액션 타입 ENUM
DO $$ BEGIN
    CREATE TYPE point_action_type AS ENUM (
        -- 독서 활동
        'note_create',           -- 노트 작성
        'note_quote',            -- 인용구 기록
        'note_memo',             -- 메모 작성
        'note_photo',            -- 사진 기록
        'note_transcription',    -- 필사
        'book_add',              -- 책 추가
        'book_complete',         -- 책 완독
        'book_progress_update',  -- 진행률 업데이트

        -- 스트릭/습관
        'daily_first_activity',  -- 오늘 첫 활동
        'streak_3_days',         -- 3일 연속
        'streak_7_days',         -- 7일 연속 (1주)
        'streak_14_days',        -- 14일 연속 (2주)
        'streak_30_days',        -- 30일 연속 (1달)
        'streak_100_days',       -- 100일 연속
        'streak_365_days',       -- 365일 연속 (1년)

        -- 미션/챌린지
        'mission_complete',      -- 일일 미션 완료
        'all_missions_complete', -- 모든 일일 미션 완료

        -- 소셜 활동
        'group_join',            -- 모임 가입
        'group_create',          -- 모임 생성
        'note_share',            -- 노트 공유

        -- 특별 보상
        'first_book',            -- 첫 번째 책 등록
        'first_note',            -- 첫 번째 노트 작성
        'monthly_goal_achieve',  -- 월간 목표 달성
        'yearly_goal_achieve',   -- 연간 목표 달성

        -- 차감/사용
        'point_used',            -- 포인트 사용
        'point_expired',         -- 포인트 만료
        'admin_adjust'           -- 관리자 조정
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. 사용자 포인트 테이블 (총 포인트 캐시)
CREATE TABLE IF NOT EXISTS user_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_points INTEGER NOT NULL DEFAULT 0,      -- 총 보유 포인트
    lifetime_points INTEGER NOT NULL DEFAULT 0,   -- 누적 획득 포인트 (레벨 계산용)
    current_level INTEGER NOT NULL DEFAULT 1,     -- 현재 레벨
    streak_bonus_multiplier DECIMAL(3,2) DEFAULT 1.00, -- 스트릭 보너스 배율
    last_activity_date DATE,                      -- 마지막 활동 날짜 (스트릭 계산용)
    current_streak INTEGER NOT NULL DEFAULT 0,    -- 현재 연속 일수
    longest_streak INTEGER NOT NULL DEFAULT 0,    -- 최장 연속 일수
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. 포인트 거래 내역 테이블
CREATE TABLE IF NOT EXISTS point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type point_action_type NOT NULL,
    points INTEGER NOT NULL,                       -- 양수: 적립, 음수: 차감
    multiplier DECIMAL(3,2) DEFAULT 1.00,         -- 적용된 배율
    final_points INTEGER NOT NULL,                -- 배율 적용 후 최종 포인트
    description TEXT,                              -- 설명 (예: "사피엔스 완독")
    reference_id UUID,                             -- 참조 ID (book_id, note_id 등)
    reference_type TEXT,                           -- 참조 타입 ('book', 'note', 'group' 등)
    balance_after INTEGER NOT NULL,               -- 거래 후 잔액
    metadata JSONB,                                -- 추가 메타데이터
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. 포인트 액션 설정 테이블 (관리자 설정 가능)
CREATE TABLE IF NOT EXISTS point_action_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type point_action_type NOT NULL UNIQUE,
    base_points INTEGER NOT NULL,                 -- 기본 포인트
    description TEXT NOT NULL,                    -- 액션 설명
    category TEXT NOT NULL,                       -- 카테고리 ('reading', 'streak', 'mission', 'social', 'special')
    is_repeatable BOOLEAN NOT NULL DEFAULT true,  -- 반복 가능 여부
    daily_limit INTEGER,                          -- 일일 획득 제한 (NULL = 무제한)
    is_active BOOLEAN NOT NULL DEFAULT true,      -- 활성화 여부
    icon TEXT,                                    -- 아이콘 이름
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. 레벨 설정 테이블
CREATE TABLE IF NOT EXISTS point_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level INTEGER NOT NULL UNIQUE,
    required_points INTEGER NOT NULL,             -- 레벨 도달에 필요한 누적 포인트
    title TEXT NOT NULL,                          -- 레벨 명칭
    description TEXT,                             -- 레벨 설명
    badge_icon TEXT,                              -- 뱃지 아이콘
    streak_bonus DECIMAL(3,2) DEFAULT 1.00,       -- 레벨별 스트릭 보너스 배율
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. 일일 미션 상태 테이블
CREATE TABLE IF NOT EXISTS daily_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    mission_type TEXT NOT NULL,                   -- 'first_read', 'note', 'streak'
    status TEXT NOT NULL DEFAULT 'pending',       -- 'pending', 'completed'
    points_earned INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date, mission_type)
);

-- =====================================================
-- RLS 정책
-- =====================================================

-- user_points RLS
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_points_select_own" ON user_points;
CREATE POLICY "user_points_select_own" ON user_points
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_points_insert_own" ON user_points;
CREATE POLICY "user_points_insert_own" ON user_points
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_points_update_own" ON user_points;
CREATE POLICY "user_points_update_own" ON user_points
    FOR UPDATE USING (auth.uid() = user_id);

-- point_transactions RLS
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "point_transactions_select_own" ON point_transactions;
CREATE POLICY "point_transactions_select_own" ON point_transactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "point_transactions_insert_own" ON point_transactions;
CREATE POLICY "point_transactions_insert_own" ON point_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- point_action_configs RLS (모든 사용자 읽기 가능)
ALTER TABLE point_action_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "point_action_configs_select_all" ON point_action_configs;
CREATE POLICY "point_action_configs_select_all" ON point_action_configs
    FOR SELECT USING (true);

-- point_levels RLS (모든 사용자 읽기 가능)
ALTER TABLE point_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "point_levels_select_all" ON point_levels;
CREATE POLICY "point_levels_select_all" ON point_levels
    FOR SELECT USING (true);

-- daily_missions RLS
ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_missions_select_own" ON daily_missions;
CREATE POLICY "daily_missions_select_own" ON daily_missions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_missions_insert_own" ON daily_missions;
CREATE POLICY "daily_missions_insert_own" ON daily_missions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_missions_update_own" ON daily_missions;
CREATE POLICY "daily_missions_update_own" ON daily_missions
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 인덱스
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON point_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_transactions_action_type ON point_transactions(action_type);
CREATE INDEX IF NOT EXISTS idx_daily_missions_user_date ON daily_missions(user_id, date);

-- =====================================================
-- 기본 데이터 삽입: 포인트 액션 설정
-- =====================================================

INSERT INTO point_action_configs (action_type, base_points, description, category, is_repeatable, daily_limit, icon) VALUES
    -- 독서 활동 (기본)
    ('note_create', 10, '노트 작성', 'reading', true, 20, 'PenLine'),
    ('note_quote', 15, '인용구 기록', 'reading', true, 10, 'Quote'),
    ('note_memo', 10, '메모 작성', 'reading', true, 20, 'FileText'),
    ('note_photo', 12, '사진 기록', 'reading', true, 10, 'Camera'),
    ('note_transcription', 20, '필사 기록', 'reading', true, 5, 'PenTool'),
    ('book_add', 5, '책 추가', 'reading', true, 10, 'BookPlus'),
    ('book_complete', 50, '책 완독', 'reading', true, NULL, 'BookCheck'),
    ('book_progress_update', 3, '진행률 업데이트', 'reading', true, 5, 'TrendingUp'),

    -- 스트릭/습관 (일회성 보너스)
    ('daily_first_activity', 5, '오늘 첫 활동', 'streak', true, 1, 'Sun'),
    ('streak_3_days', 20, '3일 연속 달성', 'streak', false, NULL, 'Flame'),
    ('streak_7_days', 50, '7일 연속 달성', 'streak', false, NULL, 'Flame'),
    ('streak_14_days', 100, '14일 연속 달성', 'streak', false, NULL, 'Flame'),
    ('streak_30_days', 200, '30일 연속 달성', 'streak', false, NULL, 'Flame'),
    ('streak_100_days', 500, '100일 연속 달성', 'streak', false, NULL, 'Trophy'),
    ('streak_365_days', 1000, '365일 연속 달성', 'streak', false, NULL, 'Crown'),

    -- 미션/챌린지
    ('mission_complete', 10, '일일 미션 완료', 'mission', true, 3, 'Target'),
    ('all_missions_complete', 30, '모든 일일 미션 완료', 'mission', true, 1, 'Sparkles'),

    -- 소셜 활동
    ('group_join', 10, '모임 가입', 'social', true, 3, 'Users'),
    ('group_create', 30, '모임 생성', 'social', true, 1, 'UserPlus'),
    ('note_share', 5, '노트 공유', 'social', true, 10, 'Share2'),

    -- 특별 보상 (일회성)
    ('first_book', 30, '첫 번째 책 등록', 'special', false, NULL, 'BookOpen'),
    ('first_note', 20, '첫 번째 노트 작성', 'special', false, NULL, 'Pencil'),
    ('monthly_goal_achieve', 100, '월간 목표 달성', 'special', true, 1, 'Calendar'),
    ('yearly_goal_achieve', 500, '연간 목표 달성', 'special', true, 1, 'Award'),

    -- 차감/관리
    ('point_used', 0, '포인트 사용', 'system', true, NULL, 'MinusCircle'),
    ('point_expired', 0, '포인트 만료', 'system', true, NULL, 'Clock'),
    ('admin_adjust', 0, '관리자 조정', 'system', true, NULL, 'Settings')
ON CONFLICT (action_type) DO UPDATE SET
    base_points = EXCLUDED.base_points,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    is_repeatable = EXCLUDED.is_repeatable,
    daily_limit = EXCLUDED.daily_limit,
    icon = EXCLUDED.icon,
    updated_at = NOW();

-- =====================================================
-- 기본 데이터 삽입: 레벨 설정
-- =====================================================

INSERT INTO point_levels (level, required_points, title, description, badge_icon, streak_bonus) VALUES
    (1, 0, '새싹 독서가', '독서 여정을 시작한 새싹', 'Sprout', 1.00),
    (2, 100, '호기심 독서가', '독서에 흥미를 느끼기 시작', 'Sparkles', 1.05),
    (3, 300, '성장하는 독서가', '꾸준히 성장하는 중', 'TrendingUp', 1.10),
    (4, 600, '열정 독서가', '독서에 대한 열정이 가득', 'Flame', 1.15),
    (5, 1000, '숙련 독서가', '독서 습관이 자리잡음', 'Star', 1.20),
    (6, 1500, '마스터 독서가', '독서의 즐거움을 아는 마스터', 'Crown', 1.25),
    (7, 2500, '전문 독서가', '깊이 있는 독서를 즐김', 'Award', 1.30),
    (8, 4000, '현자 독서가', '지혜가 쌓인 독서가', 'BookOpen', 1.35),
    (9, 6000, '대가 독서가', '독서의 대가', 'Trophy', 1.40),
    (10, 10000, '전설의 독서가', '전설적인 독서 기록', 'Gem', 1.50)
ON CONFLICT (level) DO UPDATE SET
    required_points = EXCLUDED.required_points,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    badge_icon = EXCLUDED.badge_icon,
    streak_bonus = EXCLUDED.streak_bonus;

-- =====================================================
-- 트리거: 포인트 거래 시 user_points 자동 업데이트
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_points_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- user_points 레코드가 없으면 생성
    INSERT INTO user_points (user_id, total_points, lifetime_points)
    VALUES (NEW.user_id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    -- 포인트 업데이트
    UPDATE user_points
    SET
        total_points = total_points + NEW.final_points,
        lifetime_points = CASE
            WHEN NEW.final_points > 0 THEN lifetime_points + NEW.final_points
            ELSE lifetime_points
        END,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_user_points ON point_transactions;
CREATE TRIGGER trigger_update_user_points
    AFTER INSERT ON point_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_points_on_transaction();

-- =====================================================
-- 트리거: 레벨 자동 업데이트
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
DECLARE
    new_level INTEGER;
BEGIN
    -- 새로운 레벨 계산
    SELECT COALESCE(MAX(level), 1)
    INTO new_level
    FROM point_levels
    WHERE required_points <= NEW.lifetime_points;

    -- 레벨 업데이트
    IF new_level != NEW.current_level THEN
        NEW.current_level := new_level;

        -- 레벨에 따른 스트릭 보너스 배율 업데이트
        SELECT streak_bonus
        INTO NEW.streak_bonus_multiplier
        FROM point_levels
        WHERE level = new_level;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_level ON user_points;
CREATE TRIGGER trigger_update_user_level
    BEFORE UPDATE ON user_points
    FOR EACH ROW
    EXECUTE FUNCTION update_user_level();

-- =====================================================
-- 함수: 일일 포인트 획득 횟수 조회
-- =====================================================

CREATE OR REPLACE FUNCTION get_daily_point_count(
    p_user_id UUID,
    p_action_type point_action_type,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
    count_result INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO count_result
    FROM point_transactions
    WHERE user_id = p_user_id
      AND action_type = p_action_type
      AND DATE(created_at) = p_date;

    RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
