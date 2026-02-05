-- ============================================
-- 마이그레이션: data4library - 외부 인기도서 캐시 테이블
-- 날짜: 2026-02-05 12:00
-- ============================================
--
-- 변경 사항:
-- 1. external_popular_books 테이블 생성 (인기도서/추천도서 캐시)
-- 2. 인덱스 생성 (조회 최적화)
-- 3. RLS 정책 설정 (공개 읽기 허용)
--
-- 영향받는 테이블:
-- - external_popular_books (신규)
-- ============================================

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS external_popular_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- 데이터 출처 (확장 가능)
    source VARCHAR(50) NOT NULL DEFAULT 'data4library',
    -- 카테고리: popular(인기), trending(급상승), recommended(추천), mania(마니아)
    category VARCHAR(50) NOT NULL,
    -- 도서 정보
    isbn13 VARCHAR(13) NOT NULL,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(500),
    publisher VARCHAR(300),
    -- 통계 정보
    loan_count INTEGER,
    ranking INTEGER,
    -- 지역 필터 (null = 전국)
    region_code VARCHAR(10),
    -- 캐시 관리
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    -- 추가 메타데이터 (표지 URL, 출판년도, 분류명 등)
    metadata JSONB,
    -- 복합 유니크 제약조건 (중복 방지)
    CONSTRAINT unique_source_category_isbn_region
        UNIQUE (source, category, isbn13, region_code)
);

-- 2. 인덱스 생성
-- 카테고리별 조회 최적화
CREATE INDEX IF NOT EXISTS idx_external_popular_books_category
    ON external_popular_books(category);

-- 만료 시간 기준 정리용
CREATE INDEX IF NOT EXISTS idx_external_popular_books_expires_at
    ON external_popular_books(expires_at);

-- 소스+카테고리 복합 인덱스 (메인 조회용)
CREATE INDEX IF NOT EXISTS idx_external_popular_books_source_category
    ON external_popular_books(source, category);

-- 랭킹순 정렬용
CREATE INDEX IF NOT EXISTS idx_external_popular_books_ranking
    ON external_popular_books(category, ranking);

-- ISBN 검색용 (특정 도서 존재 확인)
CREATE INDEX IF NOT EXISTS idx_external_popular_books_isbn13
    ON external_popular_books(isbn13);

-- 3. RLS 활성화
ALTER TABLE external_popular_books ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 (공개 읽기 허용 - 로그인 없이 조회 가능)
DROP POLICY IF EXISTS "allow_public_read" ON external_popular_books;
CREATE POLICY "allow_public_read" ON external_popular_books
    FOR SELECT
    USING (true);

-- INSERT/UPDATE/DELETE는 서버 액션(service role)에서만 가능
-- 일반 사용자는 수정 불가

-- 5. 만료된 데이터 정리용 함수 (선택적)
CREATE OR REPLACE FUNCTION cleanup_expired_popular_books()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM external_popular_books
    WHERE expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- 6. 코멘트 추가 (문서화)
COMMENT ON TABLE external_popular_books IS '도서관 정보나루 API 등 외부 소스의 인기/추천 도서 캐시';
COMMENT ON COLUMN external_popular_books.source IS '데이터 출처 (data4library, aladin 등)';
COMMENT ON COLUMN external_popular_books.category IS '도서 분류 (popular, trending, recommended, mania)';
COMMENT ON COLUMN external_popular_books.expires_at IS '캐시 만료 시간 (이후 재조회 필요)';
COMMENT ON COLUMN external_popular_books.metadata IS '표지URL, 출판년도, 주제분류 등 추가 정보 (JSON)';
