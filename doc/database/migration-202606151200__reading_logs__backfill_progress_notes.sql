-- migration-202606151200__reading_logs__backfill_progress_notes.sql
-- 기록 기획 13 §11 ③ — 진행율 기록(notes.type='progress')을 reading_logs(페이지-only, 시간 0)로 백필.
--
-- ⚠️⚠️ 게이트(수동 적용): 이 파일은 자동 적용 대상이 아니다. ⚠️⚠️
--   1) 먼저 NEXT_PUBLIC_PROGRESS_IN_LOGS=1 로 신규 진행 쓰기를 reading_logs로 전환하고,
--      프리뷰/스테이징에서 여정·캘린더·스트릭·대시보드·포인트를 실데이터로 검증한다.
--   2) 검증 통과 후 본 1단계(백필, 비파괴)를 실행한다.
--   3) 백필 후 dual-source 이중 표시를 막기 위해 2단계(레거시 notes 삭제, 파괴적)를 별도로 실행한다.
--      (2단계 실행 전 반드시 백업/PITR 확인)
--
-- Idempotent: 동일 (user_book_id, end_page, created_at)의 progress reading_log이 있으면 skip.

-- ── 1단계: 백필 (비파괴) ──
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
  AND n.page_number ~ '^[0-9]+$'                 -- 숫자 페이지만 (비숫자 page_number 제외)
  AND NOT EXISTS (
    SELECT 1 FROM reading_logs rl
    WHERE rl.user_id = n.user_id
      AND rl.user_book_id = ub.id
      AND rl.reading_duration_seconds = 0
      AND rl.image_url IS NULL
      AND rl.end_page = (n.page_number)::int
      AND rl.created_at = n.created_at
  );

-- ── 2단계: 레거시 progress 노트 제거 (파괴적 — 검증 통과 + 백업 확인 후 수동 실행) ──
-- 백필로 reading_logs에 진행 기록이 옮겨졌고 모든 리더가 reading_logs를 읽는 것을 확인한 뒤 주석 해제.
-- DELETE FROM notes WHERE type = 'progress';
