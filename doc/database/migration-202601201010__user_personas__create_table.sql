-- ============================================
-- 마이그레이션: 사용자 페르소나 테이블 생성
-- 날짜: 2026-01-20 10:10
-- ============================================
--
-- 변경 사항:
-- 1. user_personas 테이블 생성
-- 2. RLS 정책 설정 (사용자 본인 데이터만 접근)
--
-- 영향받는 테이블:
-- - user_personas (신규)
--
-- 참고:
-- - 사용자당 1개의 페르소나만 존재 (UNIQUE user_id)
-- - 24시간 캐싱 후 재분석
-- ============================================

-- 1. user_personas 테이블 생성
CREATE TABLE IF NOT EXISTS user_personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

    -- 독서 성향 분석 결과
    reading_pace VARCHAR(20),                -- fast, steady, slow
    note_style VARCHAR(30),                  -- quote-focused, reflection-focused, visual, balanced
    activity_pattern VARCHAR(20),            -- morning, afternoon, evening, night
    group_engagement VARCHAR(20),            -- leader, active, observer, solo

    -- 상세 통계 (JSONB)
    reading_stats JSONB DEFAULT '{}'::jsonb,
    -- 예: {
    --   "totalBooks": 50,
    --   "completedBooks": 30,
    --   "averageReadingDays": 14,
    --   "averagePagesPerDay": 25,
    --   "totalNotes": 200
    -- }

    -- 카테고리 선호도 (JSONB)
    category_preferences JSONB DEFAULT '[]'::jsonb,
    -- 예: [
    --   { "category": "소설", "count": 15, "percentage": 30 },
    --   { "category": "자기계발", "count": 10, "percentage": 20 }
    -- ]

    -- AI 생성 요약
    persona_summary TEXT,
    -- 예: "당신은 꾸준한 독서 습관을 가진 저녁형 독서가입니다. 소설과 에세이를 즐겨 읽으며,
    --      인상적인 구절을 기록하는 것을 좋아합니다."

    -- 분석 시간
    last_analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_personas_user_id ON user_personas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_personas_last_analyzed_at ON user_personas(last_analyzed_at);

-- 3. RLS 활성화
ALTER TABLE user_personas ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책
-- SELECT: 자신의 페르소나만 조회 가능
DROP POLICY IF EXISTS "select_own_persona" ON user_personas;
CREATE POLICY "select_own_persona" ON user_personas FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: 자신의 페르소나만 생성 가능
DROP POLICY IF EXISTS "insert_own_persona" ON user_personas;
CREATE POLICY "insert_own_persona" ON user_personas FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: 자신의 페르소나만 수정 가능
DROP POLICY IF EXISTS "update_own_persona" ON user_personas;
CREATE POLICY "update_own_persona" ON user_personas FOR UPDATE
    USING (auth.uid() = user_id);

-- DELETE: 자신의 페르소나만 삭제 가능
DROP POLICY IF EXISTS "delete_own_persona" ON user_personas;
CREATE POLICY "delete_own_persona" ON user_personas FOR DELETE
    USING (auth.uid() = user_id);

-- 5. updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_user_personas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_user_personas_updated_at ON user_personas;
CREATE TRIGGER update_user_personas_updated_at
    BEFORE UPDATE ON user_personas
    FOR EACH ROW
    EXECUTE FUNCTION update_user_personas_updated_at();
