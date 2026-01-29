# 검색 기능 조회 오류 해결

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0  
**문제:** 검색 시 제대로 조회되지 않는 오류

---

## 🔍 문제 분석

### 발견된 문제

**증상:**
- 검색어를 입력해도 결과가 조회되지 않음
- 책 필터를 선택해도 해당 책의 기록이 조회되지 않음
- 검색 결과가 제대로 표시되지 않음

**원인 분석:**

#### 1. bookId 필터 ID 불일치 문제
- `search-filters.tsx`에서 `bookId`로 `userBook.id` (user_books.id)를 전달
- `app/api/search/route.ts`에서 `bookId`를 `notes.book_id` (books.id)와 직접 비교
- 결과: `user_books.id`와 `notes.book_id`를 비교하므로 매칭되지 않음

#### 2. 검색 결과 처리 문제
- 검색 결과가 없을 때 에러 처리 부족
- 검색 결과 데이터 구조 확인 필요

#### 3. 검색 조건 로직 문제
- 검색어가 비어있을 때 필터만 있어도 검색이 실행되어야 함
- 현재는 검색어가 없으면 필터만으로는 검색이 안 될 수 있음

---

## ✅ 해결 방법

### 1. 검색 API bookId 필터 수정

**파일**: `app/api/search/route.ts`

**변경 사항**:
- `bookId`가 `user_books.id`인 경우를 처리하도록 수정
- `user_books` 테이블에서 `book_id`를 조회한 후 `notes.book_id`와 비교

**수정 내용**:
```typescript
// bookId가 user_books.id인 경우, books.id를 조회해야 함
let actualBookId = bookId;
if (bookId && isValidUUID(bookId)) {
  const { data: userBook, error: userBookError } = await supabase
    .from("user_books")
    .select("book_id")
    .eq("id", bookId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!userBookError && userBook) {
    // user_books.id를 받았으므로 books.id로 변환
    actualBookId = userBook.book_id;
  }
  // userBook이 없으면 bookId가 이미 books.id일 수 있으므로 그대로 사용
}

// 책 필터
if (actualBookId) {
  supabaseQuery = supabaseQuery.eq("book_id", actualBookId);
}
```

### 2. 검색 페이지 로직 개선

**파일**: `app/(main)/search/page.tsx`

**변경 사항**:
- 검색 조건 확인 로직 개선
- 에러 처리 개선
- 검색 결과 기본값 설정

**수정 내용**:
```typescript
// 검색 실행 함수 (디바운싱)
const performSearch = useCallback(async () => {
  // 검색어나 필터가 하나라도 있으면 검색 실행
  const hasQuery = query.trim().length > 0;
  const hasBookFilter = searchParams.get("bookId");
  const hasDateFilter = searchParams.get("startDate") || searchParams.get("endDate");
  const hasTagFilter = searchParams.get("tags");
  const hasTypeFilter = searchParams.get("types");

  if (!hasQuery && !hasBookFilter && !hasDateFilter && !hasTagFilter && !hasTypeFilter) {
    setResults([]);
    setTotal(0);
    setTotalPages(0);
    return;
  }

  try {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    // ... 필터 추가 ...
    params.set("page", currentPage.toString());

    const data = await search(params);
    setResults(data.results || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 0);
  } catch (err) {
    console.error("검색 오류:", err);
    setResults([]);
    setTotal(0);
    setTotalPages(0);
  }
}, [query, searchParams, currentPage, search]);
```

---

## 🧪 테스트 방법

### 1. 검색어 검색 테스트

1. 검색 페이지에서 검색어 입력 (예: "인상깊은")
2. **확인**: 검색 결과가 표시되는지 확인
3. **확인**: 검색 결과가 정확한지 확인

### 2. 책 필터 검색 테스트

1. 검색 페이지에서 책 필터 선택
2. **확인**: 선택한 책의 기록만 표시되는지 확인
3. **확인**: 검색 결과가 정확한지 확인

### 3. 복합 필터 검색 테스트

1. 검색어 + 책 필터 조합
2. 검색어 + 날짜 필터 조합
3. 검색어 + 태그 필터 조합
4. 검색어 + 유형 필터 조합
5. **확인**: 모든 조합이 정상적으로 작동하는지 확인

### 4. 필터만 사용한 검색 테스트

1. 검색어 없이 책 필터만 선택
2. 검색어 없이 날짜 필터만 선택
3. **확인**: 필터만으로도 검색이 정상적으로 작동하는지 확인

### 5. 검색 결과 없음 테스트

1. 존재하지 않는 검색어 입력
2. **확인**: "검색 결과가 없습니다." 메시지가 표시되는지 확인

---

## 📋 데이터베이스 구조 이해

### 테이블 관계

```
users
  └── user_books (user_id, book_id)
        └── books (id)
              └── notes (book_id)
```

### ID 흐름

1. **검색 필터 시:**
   - 입력: `user_books.id` (예: `uuid-123`)
   - 처리: `user_books`에서 `book_id` 조회 (예: `uuid-456`)
   - 비교: `notes.book_id = uuid-456` ✅ (매칭됨)

2. **검색어 검색 시:**
   - 입력: 검색어 (예: "인상깊은")
   - 처리: `notes.content`에서 ILIKE 패턴 매칭
   - 결과: 검색어가 포함된 기록 반환

---

## 📋 수정된 파일 목록

1. `app/api/search/route.ts` - bookId 필터 수정
2. `app/(main)/search/page.tsx` - 검색 로직 개선

---

## 🔗 관련 문서

- [저장한 기록이 목록에 보이지 않는 문제 해결](./notes-not-appearing-fix.md)
- [데이터베이스 스키마](../database/schema.sql)

---

## 💡 추가 개선 사항

### 향후 개선 가능한 부분

1. **검색 성능 개선**: Full-text Search 인덱스 활용
2. **검색 범위 확장**: 책 제목, 저자명도 검색 가능하도록
3. **검색 결과 하이라이트**: 검색어가 포함된 부분 강조 표시
4. **검색 히스토리**: 최근 검색어 저장 기능

---

**문서 끝**

