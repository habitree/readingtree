-- ============================================
-- 통합 마이그레이션: AI 독서 도우미 전체 테이블
-- 날짜: 2026-01-20
-- ============================================
-- Supabase SQL Editor에서 이 파일 전체를 실행하세요
-- ============================================

-- ================================================
-- PART 1: 채팅 테이블 (chat_sessions, chat_messages)
-- ================================================

-- 1. chat_sessions 테이블 생성
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(200),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. chat_messages 테이블 생성
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    context_books UUID[],
    context_notes UUID[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message_at ON chat_sessions(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- 4. RLS 활성화
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 5. chat_sessions RLS 정책
DROP POLICY IF EXISTS "select_own_chat_sessions" ON chat_sessions;
CREATE POLICY "select_own_chat_sessions" ON chat_sessions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_chat_sessions" ON chat_sessions;
CREATE POLICY "insert_own_chat_sessions" ON chat_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_chat_sessions" ON chat_sessions;
CREATE POLICY "update_own_chat_sessions" ON chat_sessions FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_chat_sessions" ON chat_sessions;
CREATE POLICY "delete_own_chat_sessions" ON chat_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- 6. chat_messages RLS 정책
DROP POLICY IF EXISTS "select_own_chat_messages" ON chat_messages;
CREATE POLICY "select_own_chat_messages" ON chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "insert_own_chat_messages" ON chat_messages;
CREATE POLICY "insert_own_chat_messages" ON chat_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "update_own_chat_messages" ON chat_messages;
CREATE POLICY "update_own_chat_messages" ON chat_messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "delete_own_chat_messages" ON chat_messages;
CREATE POLICY "delete_own_chat_messages" ON chat_messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- 7. updated_at 트리거
CREATE OR REPLACE FUNCTION update_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_sessions_updated_at();

-- ================================================
-- PART 2: 페르소나 테이블 (user_personas)
-- ================================================

-- 1. user_personas 테이블 생성
CREATE TABLE IF NOT EXISTS user_personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    reading_pace VARCHAR(20),
    note_style VARCHAR(30),
    activity_pattern VARCHAR(20),
    group_engagement VARCHAR(20),
    reading_stats JSONB DEFAULT '{}'::jsonb,
    category_preferences JSONB DEFAULT '[]'::jsonb,
    persona_summary TEXT,
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
DROP POLICY IF EXISTS "select_own_persona" ON user_personas;
CREATE POLICY "select_own_persona" ON user_personas FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_persona" ON user_personas;
CREATE POLICY "insert_own_persona" ON user_personas FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_persona" ON user_personas;
CREATE POLICY "update_own_persona" ON user_personas FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_persona" ON user_personas;
CREATE POLICY "delete_own_persona" ON user_personas FOR DELETE
    USING (auth.uid() = user_id);

-- 5. updated_at 트리거
CREATE OR REPLACE FUNCTION update_user_personas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_personas_updated_at ON user_personas;
CREATE TRIGGER update_user_personas_updated_at
    BEFORE UPDATE ON user_personas
    FOR EACH ROW
    EXECUTE FUNCTION update_user_personas_updated_at();

-- ================================================
-- PART 3: books 테이블 AI 메타데이터 컬럼 추가
-- ================================================

ALTER TABLE books ADD COLUMN IF NOT EXISTS table_of_contents TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS full_description TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS keywords TEXT[];
ALTER TABLE books ADD COLUMN IF NOT EXISTS author_info TEXT;

CREATE INDEX IF NOT EXISTS idx_books_keywords ON books USING GIN (keywords);

-- ============================================
-- 마이그레이션 완료!
-- ============================================
