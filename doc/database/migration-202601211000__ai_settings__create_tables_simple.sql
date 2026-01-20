-- =============================================================================
-- AI 설정 테이블 생성 (단순화 버전)
-- Supabase Dashboard SQL Editor에서 실행하세요.
-- =============================================================================

-- 1. AI 설정 테이블 생성
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

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_ai_settings_is_active ON public.ai_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_settings_provider ON public.ai_settings(provider);

-- 3. 사용자 AI 메모리 테이블 생성
CREATE TABLE IF NOT EXISTS public.user_ai_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    memory_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. 메모리 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_ai_memories_user_id ON public.user_ai_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_memories_memory_type ON public.user_ai_memories(memory_type);

-- 5. RLS 활성화
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ai_memories ENABLE ROW LEVEL SECURITY;

-- 6. ai_settings 정책 (모든 인증 사용자 읽기 가능, 수정은 서비스 역할만)
DROP POLICY IF EXISTS "ai_settings_select_all" ON public.ai_settings;
CREATE POLICY "ai_settings_select_all" ON public.ai_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ai_settings_all_service" ON public.ai_settings;
CREATE POLICY "ai_settings_all_service" ON public.ai_settings FOR ALL TO service_role USING (true);

-- 7. user_ai_memories 정책 (사용자 본인만)
DROP POLICY IF EXISTS "user_ai_memories_own" ON public.user_ai_memories;
CREATE POLICY "user_ai_memories_own" ON public.user_ai_memories FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. updated_at 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ai_settings_updated_at ON public.ai_settings;
CREATE TRIGGER update_ai_settings_updated_at BEFORE UPDATE ON public.ai_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_ai_memories_updated_at ON public.user_ai_memories;
CREATE TRIGGER update_user_ai_memories_updated_at BEFORE UPDATE ON public.user_ai_memories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. 기본 설정 삽입
INSERT INTO public.ai_settings (provider, model_id, system_prompt_template, welcome_message, is_active)
SELECT 'google', 'gemini-1.5-flash',
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

-- 완료!
SELECT 'Migration completed successfully!' as result;
