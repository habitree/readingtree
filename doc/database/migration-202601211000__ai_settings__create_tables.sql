-- =============================================================================
-- AI 설정 테이블 생성
-- 파일명: migration-202601211000__ai_settings__create_tables.sql
-- 설명: AI 챗봇 시스템 설정을 관리하는 테이블 및 사용자 AI 메모리 테이블 생성
-- =============================================================================

-- AI 설정 테이블 생성
-- 관리자가 AI 챗봇의 모델, 프롬프트, 동작 방식을 설정할 수 있습니다.
CREATE TABLE IF NOT EXISTS public.ai_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 모델 설정
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('openai', 'google', 'anthropic')),
    model_id VARCHAR(100) NOT NULL,

    -- 프롬프트 설정
    system_prompt_template TEXT NOT NULL,
    welcome_message TEXT NOT NULL,

    -- 컨텍스트 설정 (JSONB)
    -- {
    --   maxHistoryMessages: number,
    --   includePersona: boolean,
    --   includeRecentBooks: boolean,
    --   includeRecentNotes: boolean,
    --   includeReadingGoal: boolean,
    --   maxRecentBooks: number,
    --   maxRecentNotes: number
    -- }
    context_settings JSONB NOT NULL DEFAULT '{
        "maxHistoryMessages": 10,
        "includePersona": true,
        "includeRecentBooks": true,
        "includeRecentNotes": true,
        "includeReadingGoal": true,
        "maxRecentBooks": 5,
        "maxRecentNotes": 10
    }'::jsonb,

    -- 생성 파라미터 (JSONB)
    -- {
    --   temperature: number,
    --   maxOutputTokens: number,
    --   topP: number,
    --   frequencyPenalty: number,
    --   presencePenalty: number
    -- }
    generation_settings JSONB NOT NULL DEFAULT '{
        "temperature": 0.7,
        "maxOutputTokens": 2048,
        "topP": 1.0,
        "frequencyPenalty": 0.0,
        "presencePenalty": 0.0
    }'::jsonb,

    -- 메모리 설정 (JSONB)
    -- {
    --   enableLongTermMemory: boolean,
    --   memoryUpdatePrompt: string,
    --   maxMemoryItems: number
    -- }
    memory_settings JSONB NOT NULL DEFAULT '{
        "enableLongTermMemory": false,
        "memoryUpdatePrompt": "",
        "maxMemoryItems": 50
    }'::jsonb,

    -- 상태
    is_active BOOLEAN NOT NULL DEFAULT false,

    -- 타임스탬프
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_ai_settings_is_active ON public.ai_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_settings_provider ON public.ai_settings(provider);

-- 코멘트
COMMENT ON TABLE public.ai_settings IS 'AI 챗봇 시스템 설정 테이블';
COMMENT ON COLUMN public.ai_settings.provider IS 'AI 제공자 (openai, google, anthropic)';
COMMENT ON COLUMN public.ai_settings.model_id IS 'AI 모델 ID (예: gpt-4o, gemini-1.5-flash)';
COMMENT ON COLUMN public.ai_settings.system_prompt_template IS '시스템 프롬프트 템플릿';
COMMENT ON COLUMN public.ai_settings.welcome_message IS '환영 메시지';
COMMENT ON COLUMN public.ai_settings.context_settings IS '컨텍스트 설정 (히스토리 개수, 포함할 정보 등)';
COMMENT ON COLUMN public.ai_settings.generation_settings IS '생성 파라미터 (temperature, max_tokens 등)';
COMMENT ON COLUMN public.ai_settings.memory_settings IS '메모리 설정 (장기 메모리, 메모리 프롬프트 등)';
COMMENT ON COLUMN public.ai_settings.is_active IS '현재 활성화된 설정 여부';

-- =============================================================================
-- 사용자 AI 메모리 테이블 생성
-- AI가 각 사용자에 대해 기억하는 정보를 저장합니다.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_ai_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- 메모리 내용
    memory_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,

    -- 메타데이터 (JSONB)
    -- 추출 소스, 신뢰도 등 추가 정보
    metadata JSONB,

    -- 타임스탬프
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_ai_memories_user_id ON public.user_ai_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_memories_memory_type ON public.user_ai_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_user_ai_memories_created_at ON public.user_ai_memories(created_at DESC);

-- 코멘트
COMMENT ON TABLE public.user_ai_memories IS '사용자별 AI 장기 메모리 테이블';
COMMENT ON COLUMN public.user_ai_memories.user_id IS '사용자 ID';
COMMENT ON COLUMN public.user_ai_memories.memory_type IS '메모리 유형 (reading_preference, interest, goal 등)';
COMMENT ON COLUMN public.user_ai_memories.content IS '메모리 내용';
COMMENT ON COLUMN public.user_ai_memories.metadata IS '추가 메타데이터';

-- =============================================================================
-- RLS (Row Level Security) 정책
-- =============================================================================

-- ai_settings 테이블 RLS (관리자만 접근 가능)
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

-- 관리자만 모든 작업 가능 (isAdmin 함수 필요)
-- 읽기는 모든 인증된 사용자에게 허용 (설정 조회용)
DROP POLICY IF EXISTS "ai_settings_select_authenticated" ON public.ai_settings;
CREATE POLICY "ai_settings_select_authenticated" ON public.ai_settings
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "ai_settings_insert_admin" ON public.ai_settings;
CREATE POLICY "ai_settings_insert_admin" ON public.ai_settings
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND email IN (
                SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
            )
        )
    );

DROP POLICY IF EXISTS "ai_settings_update_admin" ON public.ai_settings;
CREATE POLICY "ai_settings_update_admin" ON public.ai_settings
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND email IN (
                SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
            )
        )
    );

DROP POLICY IF EXISTS "ai_settings_delete_admin" ON public.ai_settings;
CREATE POLICY "ai_settings_delete_admin" ON public.ai_settings
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND email IN (
                SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
            )
        )
    );

-- user_ai_memories 테이블 RLS (사용자 본인만 접근)
ALTER TABLE public.user_ai_memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_ai_memories_select_own" ON public.user_ai_memories;
CREATE POLICY "user_ai_memories_select_own" ON public.user_ai_memories
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_ai_memories_insert_own" ON public.user_ai_memories;
CREATE POLICY "user_ai_memories_insert_own" ON public.user_ai_memories
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_ai_memories_update_own" ON public.user_ai_memories;
CREATE POLICY "user_ai_memories_update_own" ON public.user_ai_memories
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_ai_memories_delete_own" ON public.user_ai_memories;
CREATE POLICY "user_ai_memories_delete_own" ON public.user_ai_memories
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- =============================================================================
-- 기본 AI 설정 삽입 (최초 1회)
-- =============================================================================

-- 기본 설정이 없을 경우에만 삽입
INSERT INTO public.ai_settings (
    provider,
    model_id,
    system_prompt_template,
    welcome_message,
    context_settings,
    generation_settings,
    memory_settings,
    is_active
)
SELECT
    'google',
    'gemini-1.5-flash',
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
    '{
        "maxHistoryMessages": 10,
        "includePersona": true,
        "includeRecentBooks": true,
        "includeRecentNotes": true,
        "includeReadingGoal": true,
        "maxRecentBooks": 5,
        "maxRecentNotes": 10
    }'::jsonb,
    '{
        "temperature": 0.7,
        "maxOutputTokens": 2048,
        "topP": 1.0,
        "frequencyPenalty": 0.0,
        "presencePenalty": 0.0
    }'::jsonb,
    '{
        "enableLongTermMemory": false,
        "memoryUpdatePrompt": "",
        "maxMemoryItems": 50
    }'::jsonb,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.ai_settings);

-- =============================================================================
-- updated_at 트리거 함수 (공통 사용)
-- =============================================================================

-- 트리거 함수가 없으면 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ai_settings 테이블 트리거
DROP TRIGGER IF EXISTS update_ai_settings_updated_at ON public.ai_settings;
CREATE TRIGGER update_ai_settings_updated_at
    BEFORE UPDATE ON public.ai_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- user_ai_memories 테이블 트리거
DROP TRIGGER IF EXISTS update_user_ai_memories_updated_at ON public.user_ai_memories;
CREATE TRIGGER update_user_ai_memories_updated_at
    BEFORE UPDATE ON public.user_ai_memories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 완료
-- =============================================================================
