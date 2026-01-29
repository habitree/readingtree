# 검색 화면 깜빡임 및 책 정보 검색 기능 추가

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0  
**문제:** 검색 화면이 계속 깜빡이는 문제 및 책 정보 검색 기능 부재

---

## 🔍 문제 분석

### 발견된 문제

**증상:**
- 검색 화면이 계속 깜빡임
- 검색어 입력 시 화면이 불안정하게 동작
- 책 이름이나 저자로 검색할 수 없음

**원인 분석:**

#### 1. 검색 화면 깜빡임 문제
- `performSearch` 함수가 `search` 함수를 의존성에 포함
- `search` 함수가 `useSearch` 훅에서 매번 새로 생성됨
- `performSearch`가 계속 재생성되어 useEffect가 무한 루프 발생
- `searchParams` 변경 시 여러 useEffect가 동시에 실행되어 충돌

#### 2. 책 정보 검색 기능 부재
- 현재는 `notes.content`에서만 검색
- 책 이름, 저자로 검색할 수 없음
- 사용자가 책 정보로 기록을 찾기 어려움

---

## ✅ 해결 방법

### 1. 검색 화면 깜빡임 문제 수정

**파일**: `app/(main)/search/page.tsx`

**변경 사항**:
- `searchParams`에서 필터 값을 직접 추출하여 의존성 최적화
- `performSearch`의 의존성을 더 구체적으로 변경
- useEffect 의존성을 최적화하여 불필요한 재실행 방지

**수정 내용**:
```typescript
// URL 파라미터에서 필터 값 추출 (의존성 최적화)
const bookId = searchParams.get("bookId");
const startDate = searchParams.get("startDate");
const endDate = searchParams.get("endDate");
const tags = searchParams.get("tags");
const types = searchParams.get("types");
const urlPage = parseInt(searchParams.get("page") || "1", 10);
const urlQuery = searchParams.get("q") || "";

// 검색 실행 함수 (디바운싱)
const performSearch = useCallback(async () => {
  // ... 검색 로직 ...
}, [query, bookId, startDate, endDate, tags, types, currentPage, search]);

// URL 파라미터 변경 시 페이지 번호 업데이트
useEffect(() => {
  if (urlPage !== currentPage) {
    setCurrentPage(urlPage);
  }
}, [urlPage, currentPage]);

// URL 파라미터에서 검색어 동기화
useEffect(() => {
  if (urlQuery !== query) {
    setQuery(urlQuery);
  }
}, [urlQuery, query]);
```

**파일**: `hooks/use-search.ts`

**변경 사항**:
- `search` 함수를 `useCallback`으로 메모이제이션하여 불필요한 재생성 방지

**수정 내용**:
```typescript
const search = useCallback(async (params: URLSearchParams | SearchParams): Promise<SearchResults> => {
  // ... 검색 로직 ...
}, []);
```

### 2. 책 정보 검색 기능 추가

**파일**: `app/api/search/route.ts`

**변경 사항**:
- books 테이블에서 title, author로 검색하여 book_id 목록 얻기
- notes.content에서 검색하거나 matchingBookIds에 포함된 book_id를 가진 notes 검색

**수정 내용**:
```typescript
// 검색어가 있으면 books 테이블에서 title, author로 검색하여 book_id 목록 얻기
let matchingBookIds: string[] = [];
if (sanitizedQuery) {
  // books 테이블에서 title 또는 author로 검색
  const { data: matchingBooks } = await supabase
    .from("books")
    .select("id")
    .or(`title.ilike.%${sanitizedQuery}%,author.ilike.%${sanitizedQuery}%`);
  
  if (matchingBooks) {
    matchingBookIds = matchingBooks.map((book) => book.id);
  }
}

// 검색어 필터 적용
if (sanitizedQuery) {
  // notes.content에서 검색하거나, books.title/author로 검색된 book_id를 가진 notes 검색
  if (matchingBookIds.length > 0) {
    // content에서 검색하거나 matchingBookIds에 포함된 book_id를 가진 notes
    supabaseQuery = supabaseQuery.or(
      `content.ilike.%${sanitizedQuery}%,book_id.in.(${matchingBookIds.join(",")})`
    );
  } else {
    // content에서만 검색 (books에서 매칭된 것이 없을 때)
    supabaseQuery = supabaseQuery.ilike("content", `%${sanitizedQuery}%`);
  }
}
```

---

## 🧪 테스트 방법

### 1. 검색 화면 깜빡임 테스트

1. 검색 페이지로 이동
2. 검색어 입력
3. **확인**: 화면이 깜빡이지 않고 안정적으로 동작하는지 확인
4. **확인**: 검색 결과가 부드럽게 표시되는지 확인

### 2. 책 이름 검색 테스트

1. 검색 페이지에서 책 이름 입력 (예: "해리포터")
2. **확인**: 해당 책의 기록이 검색 결과에 표시되는지 확인
3. **확인**: 검색 결과가 정확한지 확인

### 3. 저자 검색 테스트

1. 검색 페이지에서 저자 이름 입력 (예: "J.K. 롤링")
2. **확인**: 해당 저자의 책에 대한 기록이 검색 결과에 표시되는지 확인
3. **확인**: 검색 결과가 정확한지 확인

### 4. 기록 내용 검색 테스트

1. 검색 페이지에서 기록 내용 검색어 입력
2. **확인**: 기록 내용이 검색되는지 확인
3. **확인**: 책 정보 검색과 함께 작동하는지 확인

### 5. 복합 검색 테스트

1. 책 이름 + 기록 내용 검색
2. 저자 + 기록 내용 검색
3. **확인**: 모든 검색 조건이 정상적으로 작동하는지 확인

---

## 📋 수정된 파일 목록

1. `app/(main)/search/page.tsx` - useEffect 의존성 최적화
2. `hooks/use-search.ts` - search 함수 메모이제이션
3. `app/api/search/route.ts` - 책 정보 검색 기능 추가

---

## 🔗 관련 문서

- [검색 기능 조회 오류 해결](./search-function-fix.md)

---

## 💡 추가 개선 사항

### 향후 개선 가능한 부분

1. **검색 성능 개선**: Full-text Search 인덱스 활용
2. **검색 결과 하이라이트**: 검색어가 포함된 부분 강조 표시
3. **검색 히스토리**: 최근 검색어 저장 기능
4. **검색 범위 확장**: 출판사, ISBN 등으로도 검색 가능하도록

---

**문서 끝**

