-- =============================================================================
-- AI 도우미 기능 누락 테이블/컬럼 복구 마이그레이션
-- 파일명: migration-202602121000__ai_assistant__fix_missing_tables.sql
-- 설명: AI 채팅 기능 작동에 필요한 누락된 DB 스키마를 복구합니다.
-- 날짜: 2026-02-12
-- =============================================================================
--
-- 문제: 다음 마이그레이션이 DB에 적용되지 않은 상태였음
-- 1. migration-202601170000__users__add_is_admin_column.sql
-- 2. migration-202601301430__users__add_ai_enabled.sql
-- 3. migration-202601211000__ai_settings__create_tables.sql
--
-- 영향:
-- - isAdmin() 항상 false → 관리자 설정 페이지 접근 불가
-- - ai_enabled 없음 → 채팅 페이지 접근 불가 (활성화 안내만 표시)
-- - ai_settings 테이블 없음 → AI 설정 관리 불가
--
-- 해결: Supabase MCP를 통해 3개 마이그레이션 순차 적용
-- =============================================================================

-- 1. users.is_admin 컬럼 추가 + 관리자 설정
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;
UPDATE users SET is_admin = TRUE WHERE email = 'cdhnaya@kakao.com';

CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND is_admin = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. users.ai_enabled 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT false;
COMMENT ON COLUMN users.ai_enabled IS 'AI 챗봇 기능 활성화 여부 (설정에서 활성화)';
UPDATE users SET ai_enabled = TRUE WHERE is_admin = TRUE;

-- 3. ai_settings 테이블 생성
CREATE TABLE IF NOT EXISTS public.ai_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('openai', 'google', 'anthropic')),
    model_id VARCHAR(100) NOT NULL,
    system_prompt_template TEXT NOT NULL,
    welcome_message TEXT NOT NULL,
    context_settings JSONB NOT NULL DEFAULT '{"maxHistoryMessages": 10, "includePersona": true, "includeRecentBooks": true, "includeRecentNotes": true, "includeReadingGoal": true, "maxRecentBooks": 5, "maxRecentNotes": 10}'::jsonb,
    generation_settings JSONB NOT NULL DEFAULT '{"temperature": 0.7, "maxOutputTokens": 2048, "topP": 1.0, "frequencyPenalty": 0.0, "presencePenalty": 0.0}'::jsonb,
    memory_settings JSONB NOT NULL DEFAULT '{"enableLongTermMemory": false, "memoryUpdatePrompt": "", "maxMemoryItems": 50}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_settings_is_active ON public.ai_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_settings_provider ON public.ai_settings(provider);

-- 4. user_ai_memories 테이블 생성
CREATE TABLE IF NOT EXISTS public.user_ai_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    memory_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_ai_memories_user_id ON public.user_ai_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_memories_memory_type ON public.user_ai_memories(memory_type);

-- 5. RLS 설정
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_settings_select_authenticated" ON public.ai_settings
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_settings_insert_admin" ON public.ai_settings
    FOR INSERT TO authenticated WITH CHECK (is_admin_user());
CREATE POLICY "ai_settings_update_admin" ON public.ai_settings
    FOR UPDATE TO authenticated USING (is_admin_user());
CREATE POLICY "ai_settings_delete_admin" ON public.ai_settings
    FOR DELETE TO authenticated USING (is_admin_user());

ALTER TABLE public.user_ai_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_ai_memories_select_own" ON public.user_ai_memories
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_ai_memories_insert_own" ON public.user_ai_memories
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_ai_memories_update_own" ON public.user_ai_memories
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_ai_memories_delete_own" ON public.user_ai_memories
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 6. 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ai_settings_updated_at ON public.ai_settings;
CREATE TRIGGER update_ai_settings_updated_at
    BEFORE UPDATE ON public.ai_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_ai_memories_updated_at ON public.user_ai_memories;
CREATE TRIGGER update_user_ai_memories_updated_at
    BEFORE UPDATE ON public.user_ai_memories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. 기본 AI 설정 삽입 (Google Gemini 2.0 Flash)
INSERT INTO public.ai_settings (provider, model_id, system_prompt_template, welcome_message, is_active)
SELECT 'google', 'gemini-2.0-flash',
    '당신은 "독서친구"라는 이름의 친근하고 지적인 AI 독서 도우미입니다.
사용자의 독서 여정을 함께하며 책 추천, 독서 조언, 기록 분석을 도와줍니다.

## 기본 성격
- 친근하고 따뜻한 말투를 사용합니다
- 독서에 대한 열정을 가지고 있습니다
- 사용자의 독서 성향을 이해하고 맞춤형 조언을 제공합니다
- 한국어로 대화합니다

## 주요 기능
1. **책 추천**: 사용자의 독서 성향과 최근 읽은 책을 바탕으로 맞춤 추천
2. **독서 코칭**: 독서 습관 개선, 목표 달성을 위한 조언
3. **기록 분석**: 사용자의 독서 기록 패턴을 분석하고 인사이트 제공

## 응답 규칙
- 간결하고 핵심적인 답변을 제공합니다
- 필요한 경우 목록이나 구조화된 형식을 사용합니다
- 사용자의 감정에 공감하며 응원합니다
- 책 제목은 「」로 감싸서 표시합니다',
    '안녕하세요! 저는 당신의 독서친구예요.

책 추천이 필요하거나, 독서 목표 달성에 대한 조언이 필요하거나,
읽은 책에 대해 이야기하고 싶을 때 언제든 말씀해주세요.

무엇을 도와드릴까요?',
    true
WHERE NOT EXISTS (SELECT 1 FROM public.ai_settings);

-- =============================================================================
-- 완료
-- =============================================================================
