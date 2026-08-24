-- =============================================================================
-- 공유 리포트에 이미지 카드 템플릿 선택값 저장
-- =============================================================================
-- 배경:
--   리포트 생성 시 선택한 이미지 카드 스타일(newspaper/letter/liner-notes/watercolor/editorial)이
--   저장·공유 경로에 전달되지 않아, 공개 공유 페이지(/share/reports/[id])가 항상
--   구 매거진 뷰로만 렌더되던 문제의 데이터 기반.
-- 조치:
--   ai_generated_reports.card_template (text, nullable) 추가.
--   null = 구 저장분 → 공유 페이지는 기존 매거진 뷰로 폴백 (하위 호환).
-- Idempotent: IF NOT EXISTS
-- =============================================================================

ALTER TABLE ai_generated_reports
  ADD COLUMN IF NOT EXISTS card_template text;

COMMENT ON COLUMN ai_generated_reports.card_template IS
  '이미지 카드 템플릿 슬러그 (newspaper/letter/liner-notes/watercolor/editorial). null=구 저장분(매거진 뷰 폴백)';
