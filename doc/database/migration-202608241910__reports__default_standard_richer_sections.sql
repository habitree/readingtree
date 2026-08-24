-- =============================================================================
-- AI 리포트 본문 고도화 — 기본 템플릿 전환 + standard 섹션 지시문 상세화
-- =============================================================================
-- 배경:
--   ai_report_settings 가 비어 있어 getDefaultTemplate()(is_default=true)이 실효 기본이며,
--   그 플래그가 '카드 요약'(card-summary-v2, 4섹션·short)에 걸려 있었다.
--   → 생성 리포트가 4개 섹션(Book/Data/Key Records/For You?)만으로 얇게 나와
--     표준 6섹션을 전제로 한 이미지 공유 카드 5종의 인사이트·나의 생각 슬롯이 빈다.
-- 조치:
--   1) is_default 를 '기본 리포트'(standard, 표준 6섹션)로 이동
--   2) standard 섹션별 promptInstruction 을 상세 버전으로 갱신
--      (구절 쪽수·해설, 인사이트 근거 연결, 여정 서사화·% 금지, 요약 마지막 공유 한 줄)
--      — 다른 필드(config 등)는 보존하기 위해 promptInstruction 만 jsonb_set 으로 교체
-- Idempotent: 반복 실행해도 결과 동일
-- =============================================================================

UPDATE report_templates SET is_default = false WHERE is_default = true AND slug <> 'standard';
UPDATE report_templates SET is_default = true  WHERE slug = 'standard' AND is_default = false;

UPDATE report_templates t
SET sections = (
  SELECT jsonb_agg(
    CASE elem->>'key'
      WHEN 'overview' THEN jsonb_set(elem, '{promptInstruction}',
        to_jsonb('책의 기본 정보와 독서 기간을 정리하고, 이어서 이 책이 어떤 책이고 독자가 왜 읽게 됐는지 소개하는 서술 2~3문장을 반드시 포함'::text))
      WHEN 'insights' THEN jsonb_set(elem, '{promptInstruction}',
        to_jsonb('노트에서 3~5개의 핵심 주제를 도출. 각 주제는 **굵은 제목** + 2~3문장 설명으로 쓰고, 설명에는 독자의 기록·구절에서 찾은 근거를 연결'::text))
      WHEN 'quotes' THEN jsonb_set(elem, '{promptInstruction}',
        to_jsonb('인용 노트에서 핵심 구절 2~3개를 blockquote(>)로 선별하고 쪽수를 아는 구절은 끝에 (p.쪽수) 표기. 각 인용 아래에 이 구절이 왜 인상적인지 1문장 해설을 일반 문단으로 덧붙임'::text))
      WHEN 'thoughts' THEN jsonb_set(elem, '{promptInstruction}',
        to_jsonb('사용자가 작성한 메모/감상의 원문 표현과 어투를 최대한 살려 따옴표로 인용하고, 각 인용에 짧은 맥락 1문장을 이어붙여 자연스럽게 연결'::text))
      WHEN 'journey' THEN jsonb_set(elem, '{promptInstruction}',
        to_jsonb('날짜와 기록 시점을 근거로 시간순 여정을 짧은 서사처럼 3~4문장으로 작성. 독서 패턴·완독 성과를 강조하되 진행률 퍼센트(%) 수치는 언급하지 않음'::text))
      WHEN 'summary' THEN jsonb_set(elem, '{promptInstruction}',
        to_jsonb('이 책이 독자에게 준 핵심 가치를 2~3문장으로 정리하고, 마지막 줄은 그대로 공유하고 싶어질 한 문장(여운 있는 질문 또는 선언)으로 마무리'::text))
      ELSE elem
    END
    ORDER BY COALESCE((elem->>'sortOrder')::int, 999)
  )
  FROM jsonb_array_elements(t.sections) AS elem
),
updated_at = now()
WHERE t.slug = 'standard';
