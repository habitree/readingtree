-- ============================================================
-- 리포트 템플릿 시스템 마이그레이션
-- 2026-04-07: report_templates 테이블 + 설정 확장 + 시드 데이터
-- ============================================================

-- 1. report_templates 테이블 생성
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  tone TEXT NOT NULL DEFAULT 'friendly',
  target_length TEXT NOT NULL DEFAULT 'medium',
  include_stats BOOLEAN NOT NULL DEFAULT true,
  multi_read_aware BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_system BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_report_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_report_templates_updated_at ON report_templates;
CREATE TRIGGER trg_report_templates_updated_at
  BEFORE UPDATE ON report_templates
  FOR EACH ROW EXECUTE FUNCTION update_report_templates_updated_at();

-- RLS
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_select_authenticated"
  ON report_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "templates_admin_insert"
  ON report_templates FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "templates_admin_update"
  ON report_templates FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "templates_admin_delete"
  ON report_templates FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- 2. ai_report_settings 확장
ALTER TABLE ai_report_settings
  ADD COLUMN IF NOT EXISTS min_notes_threshold INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS max_notes_for_analysis INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS enable_multi_reading BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS note_type_weights JSONB NOT NULL DEFAULT '{"quote":1,"memo":1,"transcription":1,"progress":1,"photo":1}'::jsonb,
  ADD COLUMN IF NOT EXISTS default_template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL;

-- 3. ai_generated_reports 확장
ALTER TABLE ai_generated_reports
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS generation_time_ms INTEGER,
  ADD COLUMN IF NOT EXISTS token_usage JSONB;

-- 4. 기본 템플릿 시드 데이터
INSERT INTO report_templates (name, description, slug, sections, tone, target_length, include_stats, multi_read_aware, is_default, is_system, sort_order)
VALUES
-- 기본 리포트
(
  '기본 리포트',
  '균형 잡힌 6섹션 기본 독서 리포트',
  'standard',
  '[
    {"key":"overview","title":"책 개요","promptInstruction":"책의 기본 정보와 독서 기간을 정리","maxLength":null,"required":true,"sortOrder":1,"config":{}},
    {"key":"insights","title":"핵심 인사이트","promptInstruction":"노트에서 추출한 3~5개의 핵심 주제를 도출하고 각 주제에 대한 간단한 설명 포함","maxLength":null,"required":true,"sortOrder":2,"config":{"insightCount":5}},
    {"key":"quotes","title":"인상깊은 구절","promptInstruction":"인용(quote) 노트에서 핵심 구절을 선별하고 마크다운 인용문 블록(>) 형식 사용, 페이지 번호 포함","maxLength":null,"required":true,"sortOrder":3,"config":{}},
    {"key":"thoughts","title":"나의 생각 정리","promptInstruction":"사용자가 작성한 메모/감상의 원문 표현과 어투를 최대한 살려서 정리. 원문의 핵심 문장은 그대로 인용하고 자연스러운 흐름으로 연결. 과도한 요약·재해석·의역을 지양","maxLength":null,"required":true,"sortOrder":4,"config":{}},
    {"key":"journey","title":"독서 여정","promptInstruction":"시간순으로 독서 진행 과정 요약, 독서 패턴이나 특이사항 언급, 완독 시 시작일~완독일 기간과 완독 성과를 강조","maxLength":null,"required":true,"sortOrder":5,"config":{}},
    {"key":"summary","title":"종합 요약","promptInstruction":"이 책이 독자에게 준 핵심 가치를 2~3문장으로 정리","maxLength":null,"required":true,"sortOrder":6,"config":{}}
  ]'::jsonb,
  'friendly', 'medium', true, false, true, true, 1
),
-- 심층 분석
(
  '심층 분석',
  '학술적 깊이의 8섹션 상세 분석 리포트',
  'deep-analysis',
  '[
    {"key":"overview","title":"책 개요","promptInstruction":"책의 기본 정보, 저자 배경, 출판 맥락을 포함한 상세 개요","maxLength":null,"required":true,"sortOrder":1,"config":{}},
    {"key":"insights","title":"핵심 인사이트","promptInstruction":"노트에서 추출한 5~7개의 핵심 주제를 도출하고 각 주제에 대한 심층 분석과 근거 제시","maxLength":null,"required":true,"sortOrder":2,"config":{"insightCount":7}},
    {"key":"quotes","title":"인상깊은 구절","promptInstruction":"인용 노트에서 핵심 구절을 선별하고 각 구절의 의미와 맥락을 분석","maxLength":null,"required":true,"sortOrder":3,"config":{}},
    {"key":"thoughts","title":"나의 생각 정리","promptInstruction":"사용자의 메모/감상을 원문 그대로 살리되 주제별로 체계적으로 분류하여 정리","maxLength":null,"required":true,"sortOrder":4,"config":{}},
    {"key":"concept_map","title":"핵심 개념 관계도","promptInstruction":"책의 주요 개념들 간의 관계를 텍스트 기반으로 정리. 상위 개념과 하위 개념, 인과관계 등을 구조화","maxLength":null,"required":true,"sortOrder":5,"config":{}},
    {"key":"journey","title":"독서 여정","promptInstruction":"시간순 독서 진행 과정과 이해도 변화를 상세하게 분석","maxLength":null,"required":true,"sortOrder":6,"config":{}},
    {"key":"action_items","title":"실천 항목","promptInstruction":"이 책에서 얻은 인사이트를 바탕으로 실천할 수 있는 구체적 행동 3~5가지 제안","maxLength":null,"required":true,"sortOrder":7,"config":{}},
    {"key":"summary","title":"종합 요약","promptInstruction":"책의 핵심 가치와 독자의 성장 포인트를 3~5문장으로 깊이 있게 정리","maxLength":null,"required":true,"sortOrder":8,"config":{}}
  ]'::jsonb,
  'academic', 'long', true, false, false, true, 2
),
-- 독서 모임용
(
  '독서 모임용',
  '토론과 공유에 최적화된 독서 모임 리포트',
  'book-club',
  '[
    {"key":"overview","title":"책 소개","promptInstruction":"독서 모임 참가자들을 위한 간결한 책 소개 (스포일러 주의)","maxLength":null,"required":true,"sortOrder":1,"config":{}},
    {"key":"insights","title":"핵심 인사이트","promptInstruction":"모임에서 논의할 만한 3~5개 핵심 주제 도출","maxLength":null,"required":true,"sortOrder":2,"config":{"insightCount":5}},
    {"key":"quotes","title":"함께 읽고 싶은 구절","promptInstruction":"모임에서 함께 읽고 토론하기 좋은 구절 선별","maxLength":null,"required":true,"sortOrder":3,"config":{}},
    {"key":"discussion","title":"토론 질문","promptInstruction":"독서 모임에서 활용할 수 있는 깊이 있는 토론 질문 5~7개 생성. 단답형이 아닌 열린 질문으로 작성","maxLength":null,"required":true,"sortOrder":4,"config":{}},
    {"key":"thoughts","title":"나의 감상","promptInstruction":"사용자의 개인적 감상을 원문 그대로 살려 공유용으로 정리","maxLength":null,"required":true,"sortOrder":5,"config":{}},
    {"key":"summary","title":"한줄 추천","promptInstruction":"이 책을 아직 읽지 않은 사람에게 추천하는 한줄 멘트","maxLength":100,"required":true,"sortOrder":6,"config":{}}
  ]'::jsonb,
  'friendly', 'medium', false, false, false, true, 3
),
-- SNS 공유용
(
  'SNS 공유용',
  '짧고 임팩트 있는 SNS 공유 최적화 리포트',
  'social-share',
  '[
    {"key":"social_snippet","title":"한줄 서평","promptInstruction":"SNS에 공유하기 좋은 임팩트 있는 한줄 서평 작성. 해시태그 2~3개 포함","maxLength":280,"required":true,"sortOrder":1,"config":{}},
    {"key":"quotes","title":"공유하고 싶은 구절","promptInstruction":"SNS에 올리기 좋은 짧고 인상적인 구절 1~2개 선별","maxLength":null,"required":true,"sortOrder":2,"config":{}},
    {"key":"insights","title":"핵심 포인트","promptInstruction":"이 책의 핵심을 3줄로 요약. 이모지 활용 가능","maxLength":null,"required":true,"sortOrder":3,"config":{"insightCount":3}}
  ]'::jsonb,
  'casual', 'short', false, false, false, true, 4
),
-- 학습 노트
(
  '학습 노트',
  '체계적 학습과 실천을 위한 구조화된 노트',
  'study-notes',
  '[
    {"key":"overview","title":"학습 개요","promptInstruction":"이 책에서 학습할 핵심 내용 개요","maxLength":null,"required":true,"sortOrder":1,"config":{}},
    {"key":"insights","title":"핵심 학습 포인트","promptInstruction":"가장 중요한 학습 포인트 5개를 번호 매겨 정리. 각 포인트에 실제 적용 예시 포함","maxLength":null,"required":true,"sortOrder":2,"config":{"insightCount":5}},
    {"key":"concept_map","title":"개념 구조","promptInstruction":"핵심 개념들의 관계와 계층 구조를 텍스트로 정리","maxLength":null,"required":true,"sortOrder":3,"config":{}},
    {"key":"action_items","title":"실천 계획","promptInstruction":"학습 내용을 일상에 적용할 수 있는 구체적 실천 계획 3~5개. 기간과 측정 방법 포함","maxLength":null,"required":true,"sortOrder":4,"config":{}},
    {"key":"summary","title":"학습 정리","promptInstruction":"전체 학습 내용을 한 단락으로 압축 정리","maxLength":null,"required":true,"sortOrder":5,"config":{}}
  ]'::jsonb,
  'formal', 'medium', true, false, false, true, 5
),
-- 다회독 비교
(
  '다회독 비교',
  '여러 번 읽은 책의 독서 성장과 관점 변화 분석',
  'multi-read',
  '[
    {"key":"overview","title":"책 개요","promptInstruction":"책의 기본 정보와 전체 다회독 이력(회독 수, 각 독서 기간) 정리","maxLength":null,"required":true,"sortOrder":1,"config":{}},
    {"key":"comparison","title":"회독별 비교","promptInstruction":"각 회독에서 주로 기록한 노트 유형과 주제를 비교 분석. 동일 구절에 대한 다른 반응이 있다면 강조. 시간 경과에 따른 독자의 관점 변화를 포착","maxLength":null,"required":true,"sortOrder":2,"config":{}},
    {"key":"growth","title":"독서 성장 분석","promptInstruction":"1회독과 최근 회독을 비교하여 독서 관점의 변화 분석. 주목하는 주제, 감정적 반응, 이해 깊이의 변화 관찰. 재독을 통해 얻은 새로운 인사이트","maxLength":null,"required":true,"sortOrder":3,"config":{}},
    {"key":"insights","title":"통합 인사이트","promptInstruction":"모든 회독을 종합하여 도출한 핵심 인사이트 5개. 각 인사이트가 어느 회독에서 발견되었는지 표시","maxLength":null,"required":true,"sortOrder":4,"config":{"insightCount":5}},
    {"key":"quotes","title":"시간을 견딘 구절","promptInstruction":"여러 회독에 걸쳐 반복적으로 주목한 구절이나 가장 인상 깊었던 구절 선별","maxLength":null,"required":true,"sortOrder":5,"config":{}},
    {"key":"thoughts","title":"나의 생각 변화","promptInstruction":"사용자의 메모/감상을 회독별로 구분하여 원문 그대로 정리. 생각의 변화와 성숙 과정이 드러나도록 배치","maxLength":null,"required":true,"sortOrder":6,"config":{}},
    {"key":"journey","title":"전체 독서 여정","promptInstruction":"첫 독서부터 현재까지의 전체 독서 여정을 타임라인으로 정리. 각 회독의 동기와 계기 포함","maxLength":null,"required":true,"sortOrder":7,"config":{}},
    {"key":"summary","title":"다회독 종합","promptInstruction":"여러 번 읽으며 이 책이 독자에게 준 총체적 가치와 성장을 3~5문장으로 정리","maxLength":null,"required":true,"sortOrder":8,"config":{}}
  ]'::jsonb,
  'friendly', 'long', true, true, false, true, 6
)
ON CONFLICT (slug) DO NOTHING;
