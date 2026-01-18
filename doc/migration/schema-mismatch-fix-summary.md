# 스키마 불일치 수정 요약

**작성일:** 2025-01-18  
**목적:** 새 Supabase 프로젝트 스키마와 애플리케이션 코드 간 불일치 수정

---

## 문제 상황

애플리케이션이 새 Supabase 프로젝트의 `user_books` 테이블에서 존재하지 않는 컬럼을 조회하려고 시도하여 오류 발생:

```
Could not find the 'completed_dates' column of 'user_books' in the schema cache
Could not find the 'reading_reason' column of 'user_books' in the schema cache
```

---

## 새 스키마의 user_books 테이블 컬럼

| 컬럼명 | 데이터 타입 | Nullable |
|--------|------------|----------|
| `id` | UUID | NO |
| `user_id` | UUID | NO |
| `book_id` | UUID | NO |
| `status` | reading_status (ENUM) | YES |
| `started_at` | TIMESTAMPTZ | YES |
| `completed_at` | TIMESTAMPTZ | YES |
| `created_at` | TIMESTAMPTZ | YES |
| `updated_at` | TIMESTAMPTZ | YES |
| `bookshelf_id` | UUID | YES |
| `book_format` | VARCHAR | YES |

**제거된 컬럼:**
- ❌ `completed_dates` (JSONB 배열) - 새 스키마에 없음
- ❌ `reading_reason` (VARCHAR) - 새 스키마에 없음

---

## 수정된 파일

### `app/actions/books.ts`

#### 1. `getUserBooksWithNotes()` 함수

**수정 전:**
```typescript
.select(`
  id,
  status,
  completed_at,
  completed_dates,  // ❌ 새 스키마에 없음
  started_at,
  reading_reason,    // ❌ 새 스키마에 없음
  bookshelf_id,
  created_at,
  books (...)
`)
```

**수정 후:**
```typescript
.select(`
  id,
  status,
  completed_at,
  started_at,
  bookshelf_id,
  created_at,
  books (...)
`)
```

**결과 매핑:**
- `completed_dates`와 `reading_reason`을 `null`로 설정

#### 2. `getBookDetail()` 함수

**수정 전:**
```typescript
.select(`
  *,
  completed_dates,  // ❌ 새 스키마에 없음
  books (...)
`)
```

**수정 후:**
```typescript
.select(`
  *,
  books (...)
`)
```

#### 3. `updateBookInfo()` 함수

**수정 전:**
```typescript
const updateData: {
  reading_reason?: string | null;  // ❌ 새 스키마에 없음
  started_at?: string | null;
  completed_dates?: any;           // ❌ 새 스키마에 없음
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

**수정 후:**
```typescript
const updateData: {
  started_at?: string | null;
} = {};

// reading_reason과 completed_dates는 새 스키마에 없으므로 무시
// 주석 처리됨
```

---

## 영향받는 기능

### 제거된 기능

1. **읽는 이유 (`reading_reason`)**
   - 책을 읽는 이유를 저장하는 기능 제거
   - UI에서 해당 필드가 있다면 제거 필요

2. **완독일자 배열 (`completed_dates`)**
   - 여러 번 완독한 날짜를 배열로 저장하는 기능 제거
   - `completed_at` (단일 날짜)만 사용 가능

### 유지된 기능

- ✅ 책 상태 변경 (`status`)
- ✅ 시작일 설정 (`started_at`)
- ✅ 완독일 설정 (`completed_at` - 단일 날짜)
- ✅ 서재 관리 (`bookshelf_id`)

---

## 다음 단계

1. **코드 배포**
   - 수정된 `app/actions/books.ts` 파일 배포
   - Vercel에 자동 배포되거나 수동 배포

2. **UI 확인**
   - `reading_reason` 필드를 사용하는 UI 컴포넌트 확인
   - `completed_dates` 배열을 사용하는 UI 컴포넌트 확인
   - 필요 시 UI 수정

3. **테스트**
   - 서재 페이지에서 책 목록이 정상적으로 표시되는지 확인
   - 책 상세 페이지가 정상적으로 작동하는지 확인

---

## 참고 사항

### 마이그레이션 스크립트 처리

마이그레이션 스크립트(`scripts/migrate-supabase-data.js`)는 이미 이 컬럼들을 자동으로 필터링하도록 수정되었습니다:

```javascript
// user_books 테이블: 새 스키마에 없는 컬럼 제거
if (tableName === 'user_books') {
  const columnsToRemove = ['completed_dates', 'reading_reason'];
  for (const col of columnsToRemove) {
    if (cleaned.hasOwnProperty(col)) {
      delete cleaned[col];
    }
  }
}
```

따라서 기존 데이터에서 이 컬럼들의 값은 자동으로 제거되어 이관되었습니다.

---

**수정 완료:** 스키마 불일치 문제 해결
