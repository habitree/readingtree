# 01 — 데이터 모델

> 본 문서는 **물리 모델만** 기술한다. UX·진입점은 `03-ux-flow.md` 참조.

## 1. 핵심 테이블 변경 요약

```
reading_logs   → 신규 컬럼 6 + 부분 인덱스 2 + 트리거 1
notes          → 신규 컬럼 2 (FK + detail_kind)
transcriptions → 변경 없음
group_notes    → 변경 없음
```

---

## 2. `reading_logs` 확장 (정본 = 세션)

### 2.1 신규 컬럼

| 컬럼 | 타입 | NULL | DEFAULT | 의미 |
|---|---|---|---|---|
| `status` | TEXT | NO | `'completed'` | 세션 상태 (`in_progress` / `completed` / `abandoned`) |
| `bookmark_text` | TEXT (≤200) | YES | NULL | 다음 시작점 한 줄 메모 (D1) |
| `bookmark_page` | INTEGER | YES | NULL | 북마크 페이지 (D1, ≥0) |
| `image_urls` | JSONB | NO | `'[]'::jsonb` | 사진 URL 배열 (≤5, 첫 장 = 대표) |
| `client_session_id` | UUID | YES | NULL | 멱등키 (사용자별 유니크) |
| `app_version` | TEXT | YES | NULL | 진단용 (`web@1.4.2` 등) |

### 2.2 CHECK 제약

```sql
ALTER TABLE reading_logs
  ADD CONSTRAINT reading_logs_status_check
    CHECK (status IN ('in_progress','completed','abandoned'));

ALTER TABLE reading_logs
  ADD CONSTRAINT reading_logs_bookmark_text_len
    CHECK (bookmark_text IS NULL OR char_length(bookmark_text) <= 200);

ALTER TABLE reading_logs
  ADD CONSTRAINT reading_logs_image_urls_count
    CHECK (jsonb_typeof(image_urls) = 'array' AND jsonb_array_length(image_urls) <= 5);
```

### 2.3 인덱스 (부분 인덱스)

```sql
-- 진행 중 세션 조회 가속 (Active Pill, getActiveSession)
CREATE INDEX IF NOT EXISTS idx_reading_logs_in_progress
  ON reading_logs (user_id, started_at DESC)
  WHERE status = 'in_progress';

-- D2: 사용자당 진행 중 세션 1개 강제
CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_logs_one_active
  ON reading_logs (user_id)
  WHERE status = 'in_progress';

-- 멱등키 — 사용자별 유니크 (NULL 허용)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_logs_client_session_id
  ON reading_logs (user_id, client_session_id)
  WHERE client_session_id IS NOT NULL;
```

기존 인덱스는 변경 없음 — `idx_reading_logs_has_image`, `idx_reading_logs_book_has_image`, `idx_reading_logs_promoted_at` 그대로 유지.

### 2.4 트리거 — `image_urls` ↔ `image_url` 동기화

```sql
CREATE OR REPLACE FUNCTION reading_logs_sync_image_url()
RETURNS TRIGGER AS $$
BEGIN
  -- image_urls가 비어 있지 않으면 첫 장을 image_url로 미러링
  IF jsonb_typeof(NEW.image_urls) = 'array' AND jsonb_array_length(NEW.image_urls) > 0 THEN
    NEW.image_url := NEW.image_urls->>0;
  ELSIF NEW.image_url IS NOT NULL AND
        (NEW.image_urls IS NULL OR jsonb_array_length(NEW.image_urls) = 0) THEN
    -- 호환: image_url만 set한 경우 image_urls도 1장으로 미러링
    NEW.image_urls := jsonb_build_array(NEW.image_url);
  END IF;

  -- image_url NULL → NOT NULL 첫 전환 시 promoted_at 자동 설정 (DB 안전망)
  IF (TG_OP = 'UPDATE') AND OLD.image_url IS NULL AND NEW.image_url IS NOT NULL
     AND NEW.promoted_at IS NULL THEN
    NEW.promoted_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reading_logs_sync_image_url ON reading_logs;
CREATE TRIGGER trg_reading_logs_sync_image_url
  BEFORE INSERT OR UPDATE OF image_urls, image_url ON reading_logs
  FOR EACH ROW EXECUTE FUNCTION reading_logs_sync_image_url();
```

→ 클라이언트는 `image_urls`만 set해도 `/stamps` 쿼리(`WHERE image_url IS NOT NULL`)가 그대로 동작. 코드의 `attachStampToLog` 분기를 DB로 이중화 → 회귀 안전망.

### 2.5 RLS

기존 4개 정책(`select_own`/`insert_own`/`update_own`/`delete_own`)이 신규 컬럼을 자동 보호. 추가 정책 불필요.

---

## 3. `notes` 확장 (상세기록 분리)

### 3.1 신규 컬럼

| 컬럼 | 타입 | NULL | 의미 |
|---|---|---|---|
| `reading_log_id` | UUID | YES | `reading_logs.id` FK. NULL = 자유 상세 (D3) |
| `detail_kind` | TEXT | YES | `'quote' | 'memo' | 'transcription'`. NULL = legacy (photo/progress) |

### 3.2 FK·CHECK·인덱스

```sql
ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS reading_log_id UUID
    REFERENCES reading_logs(id) ON DELETE SET NULL;

ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS detail_kind TEXT;

ALTER TABLE notes
  ADD CONSTRAINT notes_detail_kind_check
    CHECK (detail_kind IS NULL OR detail_kind IN ('quote','memo','transcription'));

CREATE INDEX IF NOT EXISTS idx_notes_reading_log_id
  ON notes (reading_log_id)
  WHERE reading_log_id IS NOT NULL;
```

### 3.3 5종 type → 2종 매핑

| 기존 `notes.type` | 새 분류 | 신규 작성 가능? | 처리 |
|---|---|---|---|
| `quote` | **상세기록** | ✅ | 그대로 + `detail_kind='quote'` |
| `memo` | **상세기록** | ✅ | 그대로 + `detail_kind='memo'` |
| `transcription` | **상세기록** | ✅ | 그대로 + `detail_kind='transcription'` (transcriptions 1:1 유지) |
| `photo` | **기록의 사진 배열** | ❌ Phase 6부터 | 기존 행 보존 (조회 호환), 신규 차단 |
| `progress` | **기록**(reading_logs) | ❌ Phase 6부터 | 기존 행 보존, 신규 차단 |

---

## 4. ERD (요약)

```
┌──────────────────────┐       ┌──────────────────────┐
│   reading_logs       │  1:N  │       notes          │
│  ───────────────     │ ───── │  ───────────────     │
│  id (PK)             │◄──────│  reading_log_id (FK) │
│  user_id             │       │  detail_kind         │
│  user_book_id        │       │  type (legacy)       │
│  status (NEW)        │       │  content (JSON)      │
│  start_page          │       │  ...                 │
│  end_page            │       └──────────────────────┘
│  page_number         │              │ 1:1 (transcription만)
│  reading_duration_s  │              ▼
│  image_url           │       ┌──────────────────────┐
│  image_urls (NEW)    │       │   transcriptions     │
│  bookmark_text (NEW) │       │  ───────────────     │
│  bookmark_page (NEW) │       │  note_id (FK)        │
│  promoted_at         │       │  extracted_text      │
│  client_session_id   │       │  ...                 │
│  ...                 │       └──────────────────────┘
└──────────────────────┘
```

- `reading_logs.id ←(FK SET NULL)── notes.reading_log_id`
- `notes.id ←(FK CASCADE)── transcriptions.note_id` (기존)
- `reading_logs.image_urls[0] ⇄ image_url` (트리거)

---

## 5. 데이터 분리 원칙

| 데이터 | 저장 위치 | 이유 |
|---|---|---|
| 시간·페이지·간단 메모·북마크 | `reading_logs` | 세션의 정량/요약 |
| 사진 (≤5장) | `reading_logs.image_urls` | 세션과 1:N, 평균 1~5장 |
| 필사·구절·긴 생각 | `notes` (`detail_kind` 라벨) | 텍스트 중심, 검색·정렬·태그 풍부 |
| 자유 상세 (책 없음) | `notes` (`reading_log_id IS NULL`) | `/notes/free` 호환 (D3) |
| OCR 원본·보정본 | `transcriptions` | 기존 1:1 유지 |
| 그룹 공유 | `group_notes` | 기존 N:M 유지 |

---

## 6. 마이그레이션 계획 (개요)

상세 SQL/dry-run/롤백은 `02-migration.md` 참조. 본 문서에서는 파일 목록만:

| Migration | 책임 |
|---|---|
| `migration-202605040100__reading_logs__add_session_columns.sql` | 컬럼 6 + CHECK + 부분 인덱스 3 |
| `migration-202605040200__reading_logs__image_urls_sync_trigger.sql` | 트리거 1 + 함수 1 |
| `migration-202605040300__notes__add_reading_log_link.sql` | 컬럼 2 + FK + CHECK + 인덱스 1 |
| `migration-202605040400__data__backfill_status_and_image_urls.sql` | 백필 (status, image_urls) |
| `migration-202605040500__data__close_orphan_in_progress.sql` (Phase 6) | 12h 이상 in_progress → abandoned |
