-- ============================================
-- 마이그레이션: books 테이블에 AI 메타데이터 컬럼 추가
-- 날짜: 2026-01-20 10:20
-- ============================================
--
-- 변경 사항:
-- 1. table_of_contents 컬럼 추가 (목차)
-- 2. full_description 컬럼 추가 (상세 설명)
-- 3. keywords 컬럼 추가 (AI 키워드)
-- 4. author_info 컬럼 추가 (저자 정보)
--
-- 영향받는 테이블:
-- - books
-- ============================================

-- 1. table_of_contents 컬럼 추가 (목차)
ALTER TABLE books ADD COLUMN IF NOT EXISTS table_of_contents TEXT;

-- 2. full_description 컬럼 추가 (상세 설명)
ALTER TABLE books ADD COLUMN IF NOT EXISTS full_description TEXT;

-- 3. keywords 컬럼 추가 (AI 키워드 배열)
ALTER TABLE books ADD COLUMN IF NOT EXISTS keywords TEXT[];

-- 4. author_info 컬럼 추가 (저자 정보)
ALTER TABLE books ADD COLUMN IF NOT EXISTS author_info TEXT;

-- 5. keywords 배열 검색용 GIN 인덱스
CREATE INDEX IF NOT EXISTS idx_books_keywords ON books USING GIN (keywords);
