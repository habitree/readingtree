# 책소개 데이터 구조 및 연결 구조 점검

**작성일:** 2026-01-17  
**프로젝트:** Habitree Reading Hub v4.0.0

---

## 📊 데이터 구조

### 테이블: `books`

#### 컬럼
1. **`summary`** (TEXT)
   - 전체 책소개
   - 출판사 제공 또는 Naver API에서 가져온 전체 책소개
   - 마이그레이션: `migration-202601122226__books__add_metadata_columns.sql`
   - **현재 사용 중인 컬럼**

2. **`description_summary`** (VARCHAR(50))
   - 20자 내외 요약 (Gemini API로 생성)
   - 마이그레이션: `migration-202601151300__books__add_description_summary.sql`
   - **현재 사용하지 않음** (하위 호환용으로만 저장)

---

## 🔄 데이터 흐름

### 1. 초기 로드 (페이지 접속 시)

```
1. getUserBooksWithNotes() 호출
   ↓
2. Supabase에서 books 테이블 조회
   SELECT summary, description_summary FROM books
   ↓
3. BookWithNotes 타입으로 반환
   {
     books: {
       summary: string | null,  // ✅ 사용
       description_summary: string | null  // ❌ 사용 안 함
     }
   }
   ↓
4. book-table.tsx에서 받음
   ↓
5. useEffect에서 초기화
   - book.summary가 있으면 bookDescriptions[book.id]에 설정
   - book.summary가 없으면 API 호출 준비
```

### 2. 책소개 로드 (summary가 없는 경우)

```
1. book-table.tsx의 useEffect
   ↓
2. book.summary가 없으면 getBookDescriptionSummary() 호출
   ↓
3. getBookDescriptionSummary() 내부:
   a) DB에서 summary 확인
      SELECT summary FROM books WHERE id = bookId
   b) summary가 있으면 → 반환
   c) summary가 없으면:
      - Naver API로 책소개 조회
      - 전체 description을 summary에 저장
      - description_summary는 20자 요약으로 저장 (하위 호환)
      - 전체 description 반환
   ↓
4. bookDescriptions[book.id]에 저장
   ↓
5. 화면에 표시
```

### 3. DB 저장 구조

```typescript
// getBookDescriptionSummary()에서 저장
updateData = {
  summary: description.trim(),           // ✅ 전체 책소개 (사용)
  description_summary: summary           // ❌ 20자 요약 (하위 호환, 사용 안 함)
}

UPDATE books 
SET summary = ?, description_summary = ?
WHERE id = bookId
```

---

## ✅ 연결 구조 확인

### 1. DB 조회 연결

**위치:** `app/actions/books.ts` - `getUserBooksWithNotes()`

```typescript
// ✅ 정상: summary 조회
.select(`
  books (
    summary,              // ✅ 조회됨
    description_summary,  // 조회되지만 사용 안 함
    ...
  )
`)
```

**타입 정의:**
```typescript
// ✅ 정상: 타입에 summary 포함
books: {
  summary: string | null;  // ✅ 정의됨
  description_summary: string | null;
}
```

**반환 데이터:**
```typescript
// ✅ 정상: summary 반환
books: {
  summary: userBook.books.summary || null,  // ✅ 반환됨
  description_summary: userBook.books.description_summary || null,
}
```

### 2. DB 저장 연결

**위치:** `app/actions/books.ts` - `getBookDescriptionSummary()`

```typescript
// ✅ 정상: summary 조회
.select("summary")
.eq("id", bookId)

// ✅ 정상: summary 확인
if (book?.summary && book.summary.trim().length > 0) {
  return book.summary;
}

// ✅ 정상: summary 저장
updateData.summary = description.trim();
UPDATE books SET summary = ? WHERE id = bookId
```

### 3. 컴포넌트 사용 연결

**위치:** `components/books/book-table.tsx`

```typescript
// ✅ 정상: summary만 초기화
if (book && book.summary && book.summary.trim().length > 0) {
  initialDescriptions[book.id] = book.summary;
}

// ✅ 정상: summary만 확인
if (book.summary || bookDescriptions[book.id] || loadingDescriptions[book.id]) {
  continue;  // API 호출 스킵
}

// ✅ 정상: summary만 표시
{book.summary || bookDescriptions[book.id]}
```

---

## 🔍 점검 결과

### ✅ 정상 동작

1. **DB 조회**: `summary` 컬럼이 정상적으로 조회됨
2. **타입 정의**: `BookWithNotes` 타입에 `summary` 포함됨
3. **데이터 반환**: `getUserBooksWithNotes()`에서 `summary` 반환됨
4. **DB 저장**: `getBookDescriptionSummary()`에서 `summary` 저장됨
5. **컴포넌트 사용**: `book-table.tsx`에서 `summary`만 사용됨

### ⚠️ 주의 사항

1. **기존 데이터**: 
   - 기존 책들 중 `summary`가 없는 경우가 있을 수 있음
   - 이 경우 API를 통해 자동으로 가져와서 저장됨

2. **description_summary**:
   - 현재는 사용하지 않지만, 하위 호환을 위해 저장은 계속됨
   - 향후 제거 고려 가능

---

## 📝 데이터 흐름 다이어그램

```
[Supabase books 테이블]
    summary (TEXT) ←──────────────┐
    description_summary (VARCHAR) │
                                   │
                                   │ 조회
                                   │
[getUserBooksWithNotes]            │
    SELECT summary                 │
    ↓                              │
[BookWithNotes 타입]               │
    books.summary                  │
    ↓                              │
[book-table.tsx]                   │
    book.summary                   │
    ↓                              │
[화면 표시]                        │
                                   │
[summary가 없으면]                 │
    ↓                              │
[getBookDescriptionSummary]       │
    Naver API → description        │
    ↓                              │
    UPDATE books                   │
    SET summary = description ──────┘
```

---

## ✅ 최종 확인

**데이터 구조와 연결 구조는 정상적으로 작동합니다.**

- ✅ `books` 테이블의 `summary` 컬럼 사용
- ✅ 조회 → 반환 → 표시 흐름 정상
- ✅ 저장 로직 정상
- ✅ `summary` 기준으로만 동작

**문제 없음** ✅
