# 페이지 번호 TEXT 변경 완료

**날짜:** 2026년 1월 11일  
**작업:** 페이지 번호 필드를 INTEGER에서 TEXT로 변경

---

## 변경 사항

### 1. 데이터베이스 스키마 변경

**마이그레이션 파일:** `doc/database/migration-202601112030__notes__change_page_number_to_text.sql`

```sql
-- notes 테이블의 page_number 컬럼 타입 변경
ALTER TABLE notes 
ALTER COLUMN page_number TYPE TEXT 
USING page_number::TEXT;
```

### 2. 타입 정의 변경

**파일:** `types/note.ts`

- `Note.page_number`: `number | null` → `string | null`
- `CreateNoteInput.page_number`: `number` → `string`
- `UpdateNoteInput.page_number`: `number` → `string`

### 3. 폼 컴포넌트 변경

#### 기록 수정 폼 (`components/notes/note-edit-form.tsx`)
- `Input` → `Textarea`로 변경 (rows=2)
- 스키마 검증: `z.number()` → `z.string().max(200)`
- 플레이스홀더: "예: 123 또는 10-20 또는 10, 15, 20"

#### 기록 생성 폼 (`components/notes/note-form-new.tsx`)
- 스키마 검증: 정수 검증 제거 → `z.string().max(200)`
- 페이지별 다중 기록 생성 로직 제거
- 단일 기록에 텍스트로 저장

---

## 사용법

### 기록 생성/수정 시 페이지 번호 입력 예시

1. **단일 페이지**: `123`
2. **페이지 범위**: `10-20`
3. **여러 페이지**: `10, 15, 20`
4. **여러 줄**:
   ```
   10페이지
   15페이지
   중요 부분
   ```

---

## Supabase 마이그레이션 실행 방법

### 방법 1: Supabase 대시보드 (권장)

1. Supabase 대시보드 접속
2. **SQL Editor** 메뉴 클릭
3. 다음 SQL 실행:

```sql
-- notes 테이블의 page_number 컬럼 타입 변경
ALTER TABLE notes 
ALTER COLUMN page_number TYPE TEXT 
USING page_number::TEXT;
```

4. **Run** 버튼 클릭
5. 성공 메시지 확인

### 방법 2: Supabase CLI (선택)

```bash
# 마이그레이션 파일을 supabase/migrations 폴더로 복사
cp doc/database/migration-202601112030__notes__change_page_number_to_text.sql supabase/migrations/

# 마이그레이션 실행
supabase db push
```

---

## 검증

마이그레이션 실행 후 다음을 확인하세요:

1. **테이블 구조 확인**:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notes' AND column_name = 'page_number';
```

예상 결과: `data_type = 'text'`

2. **기존 데이터 확인**:
```sql
SELECT id, page_number 
FROM notes 
WHERE page_number IS NOT NULL 
LIMIT 5;
```

기존 숫자 데이터가 문자열로 변환되어 있는지 확인

---

## 주의 사항

- 기존 INTEGER 값은 자동으로 TEXT로 변환됩니다 (`123` → `"123"`)
- 인덱스 (`idx_notes_page_number`)는 그대로 유지됩니다
- RLS 정책에는 영향이 없습니다

---

## 완료

- ✅ 마이그레이션 SQL 파일 생성
- ✅ 타입 정의 변경 (`types/note.ts`)
- ✅ 기록 수정 폼 변경 (`note-edit-form.tsx`)
- ✅ 기록 생성 폼 변경 (`note-form-new.tsx`)
- ✅ 스키마 검증 변경
- ✅ **Supabase 마이그레이션 실행 완료 (2026-06-12)**
- ✅ `createNote` 정수 검증 → 텍스트 길이 검증으로 정정 (`app/actions/notes.ts`)
- ✅ `types/database.ts` notes.page_number `number` → `string` 정정

---

## 사후 기록 (2026-06-12)

**증상:** 책 기록 저장 시 "An error occurred in the Server Components render…" 에러.

**근본 원인:** 위 마이그레이션이 **프로덕션에 미실행**된 채로 코드/폼/타입만 string으로 선행 변경됨.
페이지 칸에 비숫자 값(예: `25p`, `10-20`)을 입력하면 `notes` INSERT가
`invalid input syntax for type integer: "25p"`(HTTP 400)로 실패. 프로덕션 Next.js가
서버액션 에러를 가려 "Server Components render" 메시지로 표시.

**확인 근거:** Supabase api 로그 `POST | 400 | /rest/v1/notes`, postgres 로그
`invalid input syntax for type integer: "25p"` 다수(동일 사용자 3회 재시도).

**조치:** `ALTER TABLE notes ALTER COLUMN page_number TYPE TEXT`(idempotent) 적용 →
컬럼 타입 `text` 확정, 기존 294개 페이지값 무손실 보존(`"291"` 등).
