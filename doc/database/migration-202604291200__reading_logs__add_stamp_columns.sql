-- =============================================================================
-- Migration: reading_logs 스탬프 컬럼 추가
-- Description: 인스타 스탬프 형태의 독서 기록(사진+페이지 구간+페이스) 도입.
--              사진 1장 + start_page/end_page + 자동 계산된 분/페이지 페이스를
--              한 행으로 모아 "스탬프"의 정본 테이블로 reading_logs를 승격.
--              UX 통합으로 기존 notes(type='progress')는 점진적 deprecate 예정.
-- Date: 2026-04-29
-- Idempotent: ADD COLUMN IF NOT EXISTS, CREATE INDEX IF NOT EXISTS, 백필도 NULL 검사
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. 컬럼 추가
--    image_url       : Supabase images 버킷 경로. NULL이면 일반 세션 로그.
--    start_page      : 구간 시작 페이지 (직전 end_page 자동승계). NULL 허용.
--    end_page        : 구간 종료 페이지 (page_number와 미러링 유지).
-- -----------------------------------------------------------------------------
ALTER TABLE reading_logs
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS start_page INTEGER CHECK (start_page IS NULL OR start_page >= 0),
  ADD COLUMN IF NOT EXISTS end_page   INTEGER CHECK (end_page   IS NULL OR end_page   >= 0);

COMMENT ON COLUMN reading_logs.image_url IS '스탬프 사진 URL (Supabase images 버킷). NULL이면 사진 없는 세션.';
COMMENT ON COLUMN reading_logs.start_page IS '구간 시작 페이지 (직전 reading_logs.end_page 자동승계).';
COMMENT ON COLUMN reading_logs.end_page IS '구간 종료 페이지 (page_number와 동일 값으로 미러링).';

-- -----------------------------------------------------------------------------
-- 2. 기존 데이터 백필: page_number → end_page (NULL일 때만)
-- -----------------------------------------------------------------------------
UPDATE reading_logs
   SET end_page = page_number
 WHERE end_page IS NULL AND page_number IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 3. 페이스 자동 계산 (생성 컬럼)
--    - 정렬·필터·차트에 SQL ORDER BY 가능하도록 STORED.
--    - end_page > start_page 이고 시간이 0보다 클 때만 계산.
-- -----------------------------------------------------------------------------
ALTER TABLE reading_logs
  ADD COLUMN IF NOT EXISTS pace_seconds_per_page NUMERIC GENERATED ALWAYS AS (
    CASE
      WHEN end_page IS NOT NULL
       AND start_page IS NOT NULL
       AND end_page > start_page
       AND reading_duration_seconds > 0
      THEN reading_duration_seconds::NUMERIC / (end_page - start_page)
      ELSE NULL
    END
  ) STORED;

COMMENT ON COLUMN reading_logs.pace_seconds_per_page IS '페이지당 평균 초 (생성 컬럼, end_page > start_page 일 때만 계산).';

-- -----------------------------------------------------------------------------
-- 4. 인덱스
--    - 스탬프 그리드(image_url IS NOT NULL) 전용 부분 인덱스
--    - 사용자별 시간순 정렬 최적화
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_reading_logs_has_image
  ON reading_logs (user_id, created_at DESC)
  WHERE image_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reading_logs_book_has_image
  ON reading_logs (user_book_id, created_at DESC)
  WHERE image_url IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 5. RLS 검증 (정책 추가 없음 — 기존 4개 정책으로 image_url/start_page/end_page도 보호됨)
--    행 단위 정책은 컬럼 무관하게 user_id로 동작하므로 추가 정책 불필요.
-- -----------------------------------------------------------------------------

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
