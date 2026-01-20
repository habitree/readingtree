-- ============================================
-- 마이그레이션: AI 챗봇 - 채팅 테이블 생성
-- 날짜: 2026-01-20 10:00
-- ============================================
--
-- 변경 사항:
-- 1. chat_sessions 테이블 생성 (채팅 세션)
-- 2. chat_messages 테이블 생성 (채팅 메시지)
-- 3. RLS 정책 설정 (사용자 본인 데이터만 접근)
--
-- 영향받는 테이블:
-- - chat_sessions (신규)
-- - chat_messages (신규)
-- ============================================

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
    context_books UUID[],            -- 참조된 책 ID 배열
    context_notes UUID[],            -- 참조된 기록 ID 배열
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
-- SELECT: 자신의 세션만 조회 가능
DROP POLICY IF EXISTS "select_own_chat_sessions" ON chat_sessions;
CREATE POLICY "select_own_chat_sessions" ON chat_sessions FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: 자신의 세션만 생성 가능
DROP POLICY IF EXISTS "insert_own_chat_sessions" ON chat_sessions;
CREATE POLICY "insert_own_chat_sessions" ON chat_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: 자신의 세션만 수정 가능
DROP POLICY IF EXISTS "update_own_chat_sessions" ON chat_sessions;
CREATE POLICY "update_own_chat_sessions" ON chat_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- DELETE: 자신의 세션만 삭제 가능
DROP POLICY IF EXISTS "delete_own_chat_sessions" ON chat_sessions;
CREATE POLICY "delete_own_chat_sessions" ON chat_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- 6. chat_messages RLS 정책
-- SELECT: 자신의 세션에 속한 메시지만 조회 가능
DROP POLICY IF EXISTS "select_own_chat_messages" ON chat_messages;
CREATE POLICY "select_own_chat_messages" ON chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- INSERT: 자신의 세션에만 메시지 생성 가능
DROP POLICY IF EXISTS "insert_own_chat_messages" ON chat_messages;
CREATE POLICY "insert_own_chat_messages" ON chat_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- UPDATE: 자신의 세션에 속한 메시지만 수정 가능
DROP POLICY IF EXISTS "update_own_chat_messages" ON chat_messages;
CREATE POLICY "update_own_chat_messages" ON chat_messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- DELETE: 자신의 세션에 속한 메시지만 삭제 가능
DROP POLICY IF EXISTS "delete_own_chat_messages" ON chat_messages;
CREATE POLICY "delete_own_chat_messages" ON chat_messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- 7. updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_sessions_updated_at();
