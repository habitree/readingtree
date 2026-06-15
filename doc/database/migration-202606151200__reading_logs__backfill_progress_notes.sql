-- migration-202606151200__reading_logs__backfill_progress_notes.sql
-- 기록 기획 13 §11 ③ — 진행율 기록(notes.type='progress') → reading_logs(페이지-only, 시간 0) 컷오버.
--
-- ⚠️⚠️ 수동 적용 · 프로덕션 데이터 영구 변경(notes 삭제 포함) ⚠️⚠️
--
-- ▶ 선행 조건 (반드시 충족 후 실행):
--   (1) NEXT_PUBLIC_PROGRESS_IN_LOGS=1 이 대상 환경에 이미 배포되어 있을 것.
--       — 플래그 OFF 상태로 본 마이그레이션을 실행하면 리더(여정·캘린더·스트릭)가 logs를
--         읽지 않아 "진행 기록이 통째로 사라지는" 장애가 발생한다.
--   (2) 플래그 ON 상태에서 신규 진행 기록(reading_logs)이 정상 표시됨을 실데이터로 확인했을 것.
--   (3) DB 백업/PITR 시점을 확인했을 것 (DELETE는 되돌릴 수 없음).
--
-- ▶ 원자성: 백필과 삭제를 한 트랜잭션으로 수행한다.
--   (백필만 하고 삭제를 미루면 notes ⊕ logs 가 둘 다 읽혀 진행 기록이 이중 카운트/이중 표시된다.)
--
-- ▶ Idempotent: 동일 (user_id, user_book_id, end_page, created_at)의 progress reading_log이
--   이미 있으면 INSERT skip. 재실행해도 중복 생성 안 됨.

BEGIN;

-- 1) 백필: notes(type='progress', 숫자 페이지) → reading_logs(페이지-only)
INSERT INTO reading_logs (
  user_id, user_book_id, page_number, end_page, start_page,
  reading_duration_seconds, memo, is_public, status, created_at, updated_at
)
SELECT
  n.user_id,
  ub.id AS user_book_id,
  (n.page_number)::int AS page_number,
  (n.page_number)::int AS end_page,
  NULL::int AS start_page,
  0 AS reading_duration_seconds,
  CASE
    WHEN n.content IS NULL THEN NULL
    WHEN left(btrim(n.content), 1) = '{' THEN (n.content::jsonb ->> 'memo')
    ELSE n.content
  END AS memo,
  COALESCE(n.is_public, true) AS is_public,
  'completed' AS status,
  n.created_at,
  COALESCE(n.updated_at, n.created_at)
FROM notes n
JOIN user_books ub ON ub.book_id = n.book_id AND ub.user_id = n.user_id
WHERE n.type = 'progress'
  AND n.page_number ~ '^[0-9]+$'                 -- 숫자 페이지만
  AND NOT EXISTS (
    SELECT 1 FROM reading_logs rl
    WHERE rl.user_id = n.user_id
      AND rl.user_book_id = ub.id
      AND rl.reading_duration_seconds = 0
      AND rl.image_url IS NULL
      AND rl.end_page = (n.page_number)::int
      AND rl.created_at = n.created_at
  );

-- 2) 레거시 progress 노트 제거 (이중 표시 방지). 같은 트랜잭션에서 원자적으로.
--    숫자가 아니어서 백필되지 못한 progress 노트는 보존하려면 아래 WHERE에 page_number 조건을 맞춰라.
DELETE FROM notes WHERE type = 'progress';

COMMIT;

-- 롤백(같은 트랜잭션 실패 시 자동). 적용 후 되돌리려면 백업/PITR 사용.
