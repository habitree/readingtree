-- ============================================================
-- 마이그레이션: external_popular_books 테이블 삭제
-- 사유: 인기대출도서(data4library) 기능 전체 제거
-- ============================================================

-- 헬퍼 함수 삭제
DROP FUNCTION IF EXISTS cleanup_expired_popular_books();

-- 테이블 삭제 (RLS 정책, 인덱스 자동 삭제)
DROP TABLE IF EXISTS external_popular_books;
