# TASK-04: 책 관리 기능

**작업 ID:** TASK-04  
**우선순위:** P0 (Must Have)  
**예상 소요 시간:** 3일  
**의존성:** TASK-01, TASK-02, TASK-03  
**다음 작업:** TASK-05

---

## 작업 개요

책 검색, 추가, 조회, 상태 관리 기능을 구현합니다. 이 작업은 기록 기능의 전제조건입니다.

---

## 작업 범위

### 포함 사항
- ✅ 책 검색 (네이버 API 연동)
- ✅ 책 추가
- ✅ 책 목록 조회
- ✅ 책 상세 조회
- ✅ 독서 상태 관리
- ✅ Server Actions 및 API Routes

### 제외 사항
- ❌ 기록 기능 (TASK-05)
- ❌ 검색 기능 (TASK-06)

---

## 상세 작업 목록

### 1. 책 검색 페이지

**파일:**
- `app/(main)/books/search/page.tsx` - 책 검색 페이지

**기능:**
- 검색 입력 필드
- 실시간 검색 (디바운싱 300ms)
- 검색 결과 표시 (표지, 제목, 저자, 출판사)
- 검색 결과 선택

### 2. 책 목록 페이지

**파일:**
- `app/(main)/books/page.tsx` - 내 서재

**기능:**
- 책 목록 그리드 표시
- 상태별 필터 (읽는 중, 완독, 중단)
- 정렬 옵션
- 책 추가 버튼

### 3. 책 상세 페이지

**파일:**
- `app/(main)/books/[id]/page.tsx` - 책 상세

**기능:**
- 책 정보 표시 (표지, 제목, 저자, 출판사, 출판일)
- 독서 상태 표시 및 변경
- 기록 목록 표시 (TASK-05에서 연결)
- 기록 추가 버튼 (TASK-05에서 연결)

### 4. 책 관련 컴포넌트

**파일:**
- `components/books/book-card.tsx` - 책 카드
- `components/books/book-list.tsx` - 책 목록
- `components/books/book-search.tsx` - 검색 컴포넌트
- `components/books/book-status-badge.tsx` - 상태 배지

### 5. API Routes

**파일:**
- `app/api/books/search/route.ts` - 네이버 API 연동

**기능:**
- 네이버 검색 API 호출
- 결과 변환 및 반환
- 캐싱 (1시간)

### 6. Server Actions

**파일:**
- `app/actions/books.ts` - 책 관련 Server Actions

**기능:**
- 책 추가 (Books 테이블에 없으면 생성, UserBooks에 추가)
- 책 상태 변경
- 책 목록 조회
- 책 상세 조회

### 7. API 클라이언트 및 Hooks

**파일:**
- `lib/api/books.ts` - 책 API 클라이언트
- `lib/api/naver.ts` - 네이버 API 클라이언트
- `hooks/use-books.ts` - 책 관련 커스텀 훅

---

## 파일 구조

```
app/
├── (main)/
│   └── books/
│       ├── page.tsx              # 내 서재
│       ├── [id]/
│       │   └── page.tsx          # 책 상세
│       └── search/
│           └── page.tsx          # 책 검색
└── api/
    └── books/
        └── search/
            └── route.ts

components/
└── books/
    ├── book-card.tsx
    ├── book-list.tsx
    ├── book-search.tsx
    └── book-status-badge.tsx

lib/
└── api/
    ├── books.ts
    └── naver.ts

hooks/
└── use-books.ts

app/
└── actions/
    └── books.ts
```

---

## API 인터페이스

### Server Actions

```typescript
// app/actions/books.ts
export async function addBook(bookData: {
  isbn?: string;
  title: string;
  author?: string;
  publisher?: string;
  published_date?: string;
  cover_image_url?: string;
}, status: 'reading' | 'completed' | 'paused' = 'reading') {
  // 책 추가 (Books 테이블에 없으면 생성, UserBooks에 추가)
}

export async function updateBookStatus(
  bookId: string,
  status: 'reading' | 'completed' | 'paused'
) {
  // 독서 상태 변경
}

export async function getUserBooks(status?: 'reading' | 'completed' | 'paused') {
  // 사용자 책 목록 조회
}

export async function getBookDetail(bookId: string) {
  // 책 상세 조회 (책 정보 + 기록 목록)
}
```

### API Routes

```typescript
// app/api/books/search/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  // 네이버 API 호출 및 결과 반환
}
```

### Hooks

```typescript
// hooks/use-books.ts
export function useBooks(status?: 'reading' | 'completed' | 'paused') {
  return {
    books: UserBook[];
    isLoading: boolean;
    error: Error | null;
    addBook: (bookData, status) => Promise<void>;
    updateStatus: (bookId, status) => Promise<void>;
    refetch: () => Promise<void>;
  };
}
```

---

## 사용자 스토리 매핑

- US-006: 책 검색 (네이버 API)
- US-007: 책 추가
- US-008: 책 정보 조회
- US-009: 독서 상태 관리

---

## 검증 체크리스트

- [x] 네이버 API 검색이 정상 작동함
- [x] 검색 결과가 정상 표시됨
- [x] 책 추가가 정상 작동함 (중복 체크 포함)
- [x] 책 목록이 정상 조회됨
- [x] 상태별 필터가 정상 작동함
- [x] 책 상세 페이지가 정상 작동함
- [x] 독서 상태 변경이 정상 작동함
- [x] 완독 시 completed_at이 자동 기록됨

---

## 개발 프롬프트

```
다음 문서들을 참고하여 책 관리 기능을 구현해주세요.

참고 문서:
- doc/user_stories.md (US-006, US-007, US-008, US-009)
- doc/software_design.md (6.2.1 네이버 검색 API, 4.2.2 Books 테이블)
- doc/Habitree-Reading-Hub-PRD.md (4.1.2 책 관리)
- doc/review_issues.md (5. Books 테이블 ISBN 제약조건 - UNIQUE 아님)

작업 내용:
1. 책 검색 페이지 구현:
   - 네이버 API 연동 (app/api/books/search/route.ts)
   - 실시간 검색 (디바운싱 300ms)
   - 검색 결과 표시
2. 책 목록 페이지 구현 (내 서재):
   - 책 그리드 표시
   - 상태별 필터
   - 정렬 옵션
3. 책 상세 페이지 구현:
   - 책 정보 표시
   - 독서 상태 변경
   - 기록 목록 영역 (TASK-05에서 연결)
4. 책 관련 컴포넌트 구현
5. Server Actions 구현:
   - 책 추가 시 ISBN 중복 체크 후 기존 책 재사용
   - 상태 변경
6. API 클라이언트 및 Hooks 구현

주의사항:
- review_issues.md의 5번 이슈 참고: ISBN은 UNIQUE 아님
- 책 추가 시 기존 책이 있으면 재사용하는 로직 구현
- 네이버 API는 환경 변수로 키 관리
- 검색 결과는 1시간 캐싱
- 디바운싱으로 API 호출 최소화

완료 후:
- 각 함수에 JSDoc 주석 추가
- 에러 처리 로직 추가
- 로딩 상태 처리
```

---

## 참고 문서

### 필수 참고
- [user_stories.md](../../user_stories.md) - US-006~US-009
- [software_design.md](../../software_design.md) - 6.2.1 네이버 API, 4.2.2 Books
- [review_issues.md](../../review_issues.md) - 5. Books 테이블 ISBN 제약조건

### 추가 참고
- [네이버 검색 API 문서](https://developers.naver.com/docs/serviceapi/search/book/book.md)

---

**문서 끝**

