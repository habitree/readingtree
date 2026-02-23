-- ==========================================================================
-- AI Generated Reports: 독서 진행률 컬럼 추가
-- 공유 리포트에서 완독 전 진행 상황(현재 페이지 / 전체 페이지)을 표시하기 위해
-- 리포트 저장 시점의 current_page, total_pages를 스냅샷으로 보존
-- ==========================================================================

-- 1. 컬럼 추가 (멱등성)
ALTER TABLE ai_generated_reports
  ADD COLUMN IF NOT EXISTS current_page INTEGER;

ALTER TABLE ai_generated_reports
  ADD COLUMN IF NOT EXISTS total_pages INTEGER;
