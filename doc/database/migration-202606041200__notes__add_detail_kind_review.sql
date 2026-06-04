-- ============================================================================
-- migration-202606041200__notes__add_detail_kind_review
-- 출력(독후감/리뷰) 항목 추가 (C9 · DEC-7)
--
-- detail_kind에 'review'를 허용한다. review는 note_type ENUM이 아닌
-- detail_kind 확장으로 추가한다 (저장 시 type='memo' + detail_kind='review').
-- 기존 CHECK 제약(notes_detail_kind_check)을 교체한다.
--
-- Idempotent: DROP IF EXISTS 후 ADD (재실행 안전). RLS·컬럼 변경 없음.
-- ============================================================================

ALTER TABLE public.notes DROP CONSTRAINT IF EXISTS notes_detail_kind_check;

ALTER TABLE public.notes
  ADD CONSTRAINT notes_detail_kind_check
  CHECK (
    detail_kind IS NULL
    OR detail_kind IN ('quote', 'memo', 'transcription', 'review')
  );
