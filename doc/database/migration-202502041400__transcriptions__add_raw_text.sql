-- ============================================================
-- Migration: transcriptions 테이블에 원본 OCR 텍스트 컬럼 추가
-- 생성일: 2025-02-04
-- 설명: GPT 보정 전 원본 OCR 텍스트를 별도 저장하여 원문 보기 기능 지원
-- ============================================================

-- raw_extracted_text 컬럼 추가 (원본 OCR 텍스트)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transcriptions' AND column_name = 'raw_extracted_text'
  ) THEN
    ALTER TABLE transcriptions ADD COLUMN raw_extracted_text TEXT;
  END IF;
END $$;

-- 코멘트 추가
COMMENT ON COLUMN transcriptions.raw_extracted_text IS 'OCR 원본 텍스트 (GPT 보정 전)';
COMMENT ON COLUMN transcriptions.extracted_text IS 'OCR 추출 텍스트 (GPT 보정 후, 또는 보정 미적용 시 원본)';

-- 기존 데이터: extracted_text 값을 raw_extracted_text에도 복사 (백필)
-- 기존 데이터는 보정 여부를 알 수 없으므로 동일하게 설정
UPDATE transcriptions
SET raw_extracted_text = extracted_text
WHERE raw_extracted_text IS NULL AND extracted_text IS NOT NULL;

-- ============================================================
-- Migration Complete
-- ============================================================
