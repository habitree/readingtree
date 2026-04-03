-- 기능 요청에 기능 영역(feature_area) 컬럼 추가
-- 기능 요청 시 어떤 서비스 메뉴/기능에 대한 요청인지 트리 구조에서 선택한 값을 저장
-- VARCHAR 사용 (ENUM 대신) — 트리 구조 변경 시 DB 마이그레이션 불필요

ALTER TABLE feature_requests
  ADD COLUMN IF NOT EXISTS feature_area VARCHAR(100);

-- 필터링 성능을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_feature_requests_feature_area
  ON feature_requests(feature_area);
