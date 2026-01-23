-- ============================================
-- books 테이블 description_summary 컬럼 길이 확장
-- varchar(50) → varchar(80)
-- ============================================
--
-- 변경 요약:
--   - description_summary 컬럼 타입을 VARCHAR(50)에서 VARCHAR(80)으로 확장
--   - 50~70자 이내의 완결된 평서문 저장을 위한 공간 확보
--
-- 영향 테이블: books
-- 작성 일시: 2026-01-23 14:00
--
-- 실행 방법:
--   1. Supabase 대시보드 → SQL Editor
--   2. 이 파일의 내용을 복사하여 실행
-- ============================================

-- description_summary 컬럼 길이 확장 (Idempotent)
-- 이미 80자 이상인 경우 무시됨
DO $$
BEGIN
    -- 컬럼이 존재하고 길이가 80 미만인 경우에만 변경
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'books'
        AND column_name = 'description_summary'
        AND character_maximum_length < 80
    ) THEN
        ALTER TABLE books
        ALTER COLUMN description_summary TYPE varchar(80);
        RAISE NOTICE 'description_summary 컬럼이 varchar(80)으로 확장되었습니다.';
    ELSE
        RAISE NOTICE 'description_summary 컬럼이 이미 80자 이상이거나 존재하지 않습니다.';
    END IF;
END $$;

-- 변경 확인 쿼리 (필요 시 주석 해제하여 실행)
-- SELECT column_name, data_type, character_maximum_length
-- FROM information_schema.columns
-- WHERE table_name = 'books' AND column_name = 'description_summary';
