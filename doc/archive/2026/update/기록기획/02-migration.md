# 02 — 마이그레이션 (5종)

> 모든 마이그레이션은 **idempotent** (재실행 안전), **데이터 무손실** (ADD COLUMN/INDEX 위주), **단독 롤백 가능**.

## 실행 순서

```
M1 (컬럼) → M2 (트리거) → M3 (notes 컬럼) → M4 (백필) → [Phase 6] M5 (orphan 정리)
```

---

## M1 — `migration-202605040100__reading_logs__add_session_columns.sql`

### 목적
`reading_logs`에 세션·북마크·다중사진·멱등 컬럼 추가 + 부분 인덱스 3종.

### SQL (요약)
```sql
-- =============================================================================
-- Migration: reading_logs 세션 컬럼 추가
-- Description: 세션 상태(status), 북마크, 다중 사진, 멱등키 도입
-- Date: 2026-05-04
-- =============================================================================

ALTER TABLE reading_logs
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed';

ALTER TABLE reading_logs
  ADD COLUMN IF NOT EXISTS bookmark_text TEXT;

ALTER TABLE reading_logs
  ADD COLUMN IF NOT EXISTS bookmark_page INTEGER;

ALTER TABLE reading_logs
  ADD COLUMN IF NOT EXISTS image_urls JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE reading_logs
  ADD COLUMN IF NOT EXISTS client_session_id UUID;

ALTER TABLE reading_logs
  ADD COLUMN IF NOT EXISTS app_version TEXT;

-- CHECK 제약
DO $$ BEGIN
  ALTER TABLE reading_logs ADD CONSTRAINT reading_logs_status_check
    CHECK (status IN ('in_progress','completed','abandoned'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE reading_logs ADD CONSTRAINT reading_logs_bookmark_text_len
    CHECK (bookmark_text IS NULL OR char_length(bookmark_text) <= 200);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE reading_logs ADD CONSTRAINT reading_logs_image_urls_count
    CHECK (jsonb_typeof(image_urls) = 'array' AND jsonb_array_length(image_urls) <= 5);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 부분 인덱스
CREATE INDEX IF NOT EXISTS idx_reading_logs_in_progress
  ON reading_logs (user_id, started_at DESC)
  WHERE status = 'in_progress';

CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_logs_one_active
  ON reading_logs (user_id)
  WHERE status = 'in_progress';

CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_logs_client_session_id
  ON reading_logs (user_id, client_session_id)
  WHERE client_session_id IS NOT NULL;

COMMENT ON COLUMN reading_logs.status IS 'in_progress | completed | abandoned (세션 상태)';
COMMENT ON COLUMN reading_logs.bookmark_text IS '다음 시작점 한 줄 메모 (≤200)';
COMMENT ON COLUMN reading_logs.bookmark_page IS '북마크 페이지 (≥0)';
COMMENT ON COLUMN reading_logs.image_urls IS '사진 URL 배열 (≤5, 첫 장 = image_url)';
COMMENT ON COLUMN reading_logs.client_session_id IS '클라이언트 멱등키 (사용자별 유니크)';
```

### Dry-run 절차
1. Supabase staging에 적용 (`supabase migration up --linked`).
2. 적용 직후 `\d+ reading_logs` 확인.
3. 기존 행 무변경 검증: `SELECT count(*), status FROM reading_logs GROUP BY status` → 모두 `'completed'`.
4. INSERT 회귀 테스트 (기존 코드).

### 롤백
```sql
DROP INDEX IF EXISTS idx_reading_logs_in_progress;
DROP INDEX IF EXISTS idx_reading_logs_one_active;
DROP INDEX IF EXISTS idx_reading_logs_client_session_id;
ALTER TABLE reading_logs DROP CONSTRAINT IF EXISTS reading_logs_image_urls_count;
ALTER TABLE reading_logs DROP CONSTRAINT IF EXISTS reading_logs_bookmark_text_len;
ALTER TABLE reading_logs DROP CONSTRAINT IF EXISTS reading_logs_status_check;
ALTER TABLE reading_logs DROP COLUMN IF EXISTS app_version;
ALTER TABLE reading_logs DROP COLUMN IF EXISTS client_session_id;
ALTER TABLE reading_logs DROP COLUMN IF EXISTS image_urls;
ALTER TABLE reading_logs DROP COLUMN IF EXISTS bookmark_page;
ALTER TABLE reading_logs DROP COLUMN IF EXISTS bookmark_text;
ALTER TABLE reading_logs DROP COLUMN IF EXISTS status;
```

---

## M2 — `migration-202605040200__reading_logs__image_urls_sync_trigger.sql`

### 목적
`image_urls[0] ⇄ image_url` 양방향 동기화 + `image_url NULL→NOT NULL` 첫 전환 시 `promoted_at` 자동 설정.

### SQL
`01-data-model.md §2.4` 참조 (그대로 사용).

### 검증
```sql
-- 신규 INSERT 시 image_urls만 set
INSERT INTO reading_logs (user_id, user_book_id, page_number, image_urls, ...)
VALUES (..., '["https://..."]'::jsonb, ...);
-- 결과: image_url = 'https://...', promoted_at = NOW()

-- 기존 row UPDATE 시 image_urls만 set
UPDATE reading_logs SET image_urls = '["https://..."]'::jsonb WHERE id = '...';
-- 결과: image_url 자동 동기, promoted_at 첫 전환 시만 set
```

### 롤백
```sql
DROP TRIGGER IF EXISTS trg_reading_logs_sync_image_url ON reading_logs;
DROP FUNCTION IF EXISTS reading_logs_sync_image_url();
```

---

## M3 — `migration-202605040300__notes__add_reading_log_link.sql`

### 목적
`notes`를 세션과 연결할 수 있도록 FK + 분류 컬럼 추가.

### SQL
```sql
ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS reading_log_id UUID
    REFERENCES reading_logs(id) ON DELETE SET NULL;

ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS detail_kind TEXT;

DO $$ BEGIN
  ALTER TABLE notes ADD CONSTRAINT notes_detail_kind_check
    CHECK (detail_kind IS NULL OR detail_kind IN ('quote','memo','transcription'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_notes_reading_log_id
  ON notes (reading_log_id)
  WHERE reading_log_id IS NOT NULL;

COMMENT ON COLUMN notes.reading_log_id IS '연결된 reading_logs.id. NULL = 자유 상세 (D3)';
COMMENT ON COLUMN notes.detail_kind IS 'quote | memo | transcription. NULL = legacy';
```

### 검증
- `notes` 행 무변경.
- 기존 INSERT 회귀 (createNote 단위 테스트).

### 롤백
```sql
DROP INDEX IF EXISTS idx_notes_reading_log_id;
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_detail_kind_check;
ALTER TABLE notes DROP COLUMN IF EXISTS detail_kind;
ALTER TABLE notes DROP COLUMN IF EXISTS reading_log_id;
```

---

## M4 — `migration-202605040400__data__backfill_status_and_image_urls.sql`

### 목적
- 모든 기존 `reading_logs` → `status='completed'` 보장 (DEFAULT로 자동 처리되지만 명시).
- 기존 `image_url` 있는 행 → `image_urls = jsonb_build_array(image_url)`.

### SQL
```sql
-- status 백필 (DEFAULT 적용분 외 안전망)
UPDATE reading_logs
SET status = 'completed'
WHERE status IS NULL;

-- image_urls 백필 (image_url 있는 기존 행)
UPDATE reading_logs
SET image_urls = jsonb_build_array(image_url)
WHERE image_url IS NOT NULL
  AND (image_urls IS NULL OR image_urls = '[]'::jsonb);
```

### 검증
```sql
-- 0이어야 함
SELECT count(*) FROM reading_logs WHERE status IS NULL;

-- 0이어야 함 (image_url 있으면 image_urls도 있어야)
SELECT count(*) FROM reading_logs
WHERE image_url IS NOT NULL
  AND (image_urls IS NULL OR jsonb_array_length(image_urls) = 0);
```

### 롤백
- 백필은 의미상 비파괴. 명시적 롤백 불필요.
- M1 롤백 시 컬럼이 사라지므로 자동 정리됨.

---

## M5 — `migration-202605040500__data__close_orphan_in_progress.sql` (Phase 6)

### 목적
12시간 이상 진행 중 상태로 멈춘 세션을 `abandoned`로 자동 전환. 이후 daily cron 후보.

### SQL
```sql
UPDATE reading_logs
SET status = 'abandoned',
    ended_at = COALESCE(ended_at, started_at + INTERVAL '12 hours'),
    updated_at = NOW()
WHERE status = 'in_progress'
  AND started_at < NOW() - INTERVAL '12 hours';
```

### 검증
- 적용 후 `SELECT user_id, count(*) FROM reading_logs WHERE status='in_progress' GROUP BY user_id HAVING count(*) > 1` = 0.
- 적용 후 idle 세션 24시간 모니터링.

### 롤백
- 비파괴(abandoned는 사용자에게 보이지 않음). 필요 시 `UPDATE … SET status='completed' WHERE status='abandoned' AND updated_at >= '<적용시각>'`.

---

## 일괄 검증 SQL (Phase 1 종료 직후)

```sql
-- 컬럼 존재 확인
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'reading_logs'
  AND column_name IN ('status','bookmark_text','bookmark_page','image_urls','client_session_id','app_version');

-- 인덱스 확인
SELECT indexname FROM pg_indexes
WHERE tablename = 'reading_logs'
  AND indexname IN ('idx_reading_logs_in_progress','idx_reading_logs_one_active','idx_reading_logs_client_session_id');

-- 트리거 확인
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table = 'reading_logs'
  AND trigger_name = 'trg_reading_logs_sync_image_url';

-- 기존 데이터 무손실
SELECT count(*) FROM reading_logs WHERE status IS NULL;          -- 0
SELECT count(*) FROM reading_logs WHERE status NOT IN ('in_progress','completed','abandoned');  -- 0
```
