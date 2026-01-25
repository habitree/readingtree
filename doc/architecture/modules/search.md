# Search Module (검색)

> **Module Key**: `search`
> **Layer**: B. 플랫폼/지원 모듈
> **Last Updated**: 2025-01-25

---

## 1. 개요

책 검색, 내부 콘텐츠 검색을 담당하는 플랫폼 모듈입니다.

### 1.1 주요 기능

- 네이버 책 검색 API 연동
- 내 서재 검색
- 노트 검색
- 검색 결과 페이지네이션

---

## 2. 파일 구조

```
app/
├── (main)/
│   ├── search/page.tsx
│   └── books/
│       └── search/page.tsx
├── actions/
│   └── search.ts
└── api/
    └── search/

components/
└── search/
    ├── search-results.tsx
    ├── search-result-card.tsx
    └── pagination.tsx

hooks/
└── use-search.ts

lib/
├── api/
│   └── naver.ts
└── utils/
    └── search.ts
```

---

## 3. 외부 API

### 3.1 네이버 책 검색 API

| 항목 | 내용 |
|------|------|
| API | 네이버 Open API - 책 검색 |
| 인증 | Client ID / Secret |
| Rate Limit | 25,000 calls/day |

### 3.2 응답 형식

```typescript
interface NaverBookSearchResult {
  lastBuildDate: string
  total: number
  start: number
  display: number
  items: NaverBook[]
}

interface NaverBook {
  title: string
  link: string
  image: string
  author: string
  discount: string
  publisher: string
  pubdate: string
  isbn: string
  description: string
}
```

---

## 4. 핵심 함수

### 4.1 Server Actions

| 함수 | 파일 | 설명 |
|------|------|------|
| `searchBooks()` | `app/actions/search.ts` | 네이버 API로 책 검색 |
| `searchMyBooks()` | `app/actions/search.ts` | 내 서재에서 검색 |
| `searchNotes()` | `app/actions/search.ts` | 내 노트에서 검색 |

### 4.2 Hooks

| Hook | 설명 |
|------|------|
| `useSearch()` | 검색 상태 및 디바운싱 |

### 4.3 유틸리티

| 함수 | 파일 | 설명 |
|------|------|------|
| `searchNaverBooks()` | `lib/api/naver.ts` | 네이버 API 호출 |
| `normalizeSearchQuery()` | `lib/utils/search.ts` | 검색어 정규화 |

---

## 5. 의존성

### 5.1 이 모듈이 사용하는 것

- `identity`: 사용자 확인
- `library`: 책 정보 참조
- `records`: 노트 정보 참조
- `shared`: UI 컴포넌트, 유틸리티

### 5.2 이 모듈을 사용하는 것

- `library`: 책 추가 시 검색
- `home`: 통합 검색 (선택적)

---

## 6. 검색 흐름

### 6.1 책 검색 (외부)

```
1. 사용자 검색어 입력
   ↓
2. 디바운싱 (300ms)
   ↓
3. 네이버 API 호출
   ↓
4. 결과 표시
   ↓
5. 책 선택 → 서재에 추가
```

### 6.2 내부 검색

```
1. 사용자 검색어 입력
   ↓
2. Supabase 텍스트 검색
   ↓
3. 결과 필터링/정렬
   ↓
4. 결과 표시
```

---

## 7. 환경 변수

```env
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret
```

---

## 8. 에러 처리

| 상황 | 처리 |
|------|------|
| 네이버 API 오류 | 재시도 3회, 이후 에러 메시지 |
| Rate Limit | 잠시 후 재시도 안내 |
| 검색 결과 없음 | 빈 결과 UI 표시 |

---

## 9. 참고 문서

- [06-task-search-plan.md](../../tasks/front/06-task-search-plan.md)
- [search-function-fix.md](../../question/search-function-fix.md)
