# completed_dates와 reading_reason 컬럼 복원 요약

**작성일:** 2025-01-18  
**목적:** user_books 테이블에 completed_dates와 reading_reason 컬럼 추가 및 코드 복원

---

## 실행 요약

### ✅ 완료된 작업

1. **스키마 마이그레이션 생성 및 적용** ✅
   - `completed_dates` 컬럼 추가 (JSONB 배열)
   - `reading_reason` 컬럼 추가 (VARCHAR(500))
   - GIN 인덱스 생성 (completed_dates 검색 최적화)

2. **코드 복원** ✅
   - `app/actions/books.ts`에서 컬럼 조회 복원
   - `getUserBooksWithNotes()` 함수 수정
   - `getBookDetail()` 함수 수정
   - `updateBookInfo()` 함수 수정

3. **마이그레이션 스크립트 수정** ✅
   - `completed_dates`와 `reading_reason` 필터링 제거
   - 기존 데이터가 정상적으로 이관되도록 수정

---

## 1. 스키마 변경 사항

### 1.1 추가된 컬럼

| 컬럼명 | 데이터 타입 | Nullable | 기본값 | 설명 |
|--------|------------|----------|--------|------|
| `completed_dates` | JSONB | YES | `[]` | 여러 번 완독한 날짜 배열 |
| `reading_reason` | VARCHAR(500) | YES | NULL | 책을 읽는 이유 |

### 1.2 생성된 인덱스

- `idx_user_books_completed_dates`: GIN 인덱스 (JSONB 배열 검색 최적화)

### 1.3 마이그레이션 파일

**파일명:** `doc/database/migration-202501181800__user_books__add_completed_dates_reading_reason.sql`

**내용:**
- Idempotent하게 작성 (여러 번 실행해도 안전)
- 컬럼 존재 여부 확인 후 추가
- 인덱스 자동 생성

---

## 2. 코드 수정 사항

### 2.1 `app/actions/books.ts`

#### `getUserBooksWithNotes()` 함수

**수정 내용:**
- `completed_dates` 컬럼 조회 복원
- `reading_reason` 컬럼 조회 복원

```typescript
.select(`
  id,
  status,
  completed_at,
  completed_dates,  // ✅ 복원
  started_at,
  reading_reason,    // ✅ 복원
  bookshelf_id,
  created_at,
  books (...)
`)
```

#### `getBookDetail()` 함수

**수정 내용:**
- `completed_dates` 컬럼 조회 복원

```typescript
.select(`
  *,
  completed_dates,  // ✅ 복원
  books (...)
`)
```

#### `updateBookInfo()` 함수

**수정 내용:**
- `reading_reason` 업데이트 로직 복원
- `completed_dates` 업데이트 로직 복원

```typescript
const updateData: {
  reading_reason?: string | null;  // ✅ 복원
  started_at?: string | null;
  completed_dates?: any;           // ✅ 복원
} = {};

if (readingReason !== undefined) {
  updateData.reading_reason = readingReason?.trim() || null;
}

if (completedDates !== undefined) {
  updateData.completed_dates = completedDates && completedDates.length > 0 
    ? completedDates 
    : null;
}
```

### 2.2 `scripts/migrate-supabase-data.js`

**수정 내용:**
- `completed_dates`와 `reading_reason` 필터링 제거
- 기존 데이터가 정상적으로 이관되도록 수정

```javascript
// 수정 전
if (tableName === 'user_books') {
  const columnsToRemove = ['completed_dates', 'reading_reason'];
  for (const col of columnsToRemove) {
    if (cleaned.hasOwnProperty(col)) {
      delete cleaned[col];
    }
  }
}

// 수정 후
// user_books 테이블: completed_dates와 reading_reason 컬럼은 유지
// 마이그레이션 후 스키마에 추가되므로 필터링하지 않음
```

### 2.3 `doc/database/schema.sql`

**수정 내용:**
- `reading_reason` 컬럼 추가 로직 추가

```sql
-- reading_reason 컬럼 추가
IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'user_books' 
    AND column_name = 'reading_reason'
) THEN
    ALTER TABLE user_books 
    ADD COLUMN reading_reason VARCHAR(500);
END IF;
```

---

## 3. 마이그레이션 결과

### 3.1 스키마 확인

✅ `completed_dates` 컬럼: 추가 완료 (JSONB, 기본값 `[]`)  
✅ `reading_reason` 컬럼: 추가 완료 (VARCHAR(500), NULL 허용)  
✅ 인덱스: `idx_user_books_completed_dates` 생성 완료

### 3.2 데이터 이관 결과

- ✅ `user_books`: 191개 레코드 이관 완료
- ✅ `completed_dates`: 모든 레코드에 컬럼 존재 (기본값 `[]`)
- ✅ `reading_reason`: 컬럼 존재 (기존 데이터에 값이 없었음)

---

## 4. 다음 단계

### 4.1 즉시 확인 사항

1. **코드 배포**
   - 수정된 `app/actions/books.ts` 파일 배포
   - Vercel에 자동 배포되거나 수동 배포

2. **애플리케이션 테스트**
   - 서재 페이지에서 책 목록이 정상적으로 표시되는지 확인
   - `completed_dates`와 `reading_reason` 기능이 정상 작동하는지 확인

### 4.2 선택적 확인 사항

3. **기존 데이터 확인**
   - 기존 프로젝트에서 `completed_dates`와 `reading_reason` 데이터가 있었는지 확인
   - 있었다면 마이그레이션 스크립트를 다시 실행하여 데이터 이관

---

## 5. 참고 사항

### 5.1 컬럼 타입

- **`completed_dates`**: JSONB 배열
  - 예: `["2024-01-15", "2024-03-20"]`
  - 빈 배열: `[]`
  - NULL: 완독일이 없음

- **`reading_reason`**: VARCHAR(500)
  - 최대 500자
  - NULL 허용

### 5.2 인덱스

- `idx_user_books_completed_dates`: GIN 인덱스
  - JSONB 배열 검색 최적화
  - `@>` 연산자 사용 시 성능 향상

---

**수정 완료:** `completed_dates`와 `reading_reason` 컬럼 추가 및 코드 복원 완료
