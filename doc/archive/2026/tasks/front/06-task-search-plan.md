# TASK-06: 검색 기능

**작업 ID:** TASK-06  
**우선순위:** P0 (Must Have)  
**예상 소요 시간:** 2일  
**의존성:** TASK-01, TASK-02, TASK-03, TASK-05  
**다음 작업:** 없음

---

## 작업 개요

전체 텍스트 검색 및 다양한 필터 기능을 구현합니다. 기록 기능이 완료된 후 구현 가능합니다.

---

## 작업 범위

### 포함 사항
- ✅ 전체 텍스트 검색
- ✅ 책 제목 필터
- ✅ 날짜 필터
- ✅ 태그 필터
- ✅ 기록 유형 필터
- ✅ 검색 결과 표시

### 제외 사항
- ❌ 기록 작성/수정 (TASK-05)
- ❌ 공유 기능 (TASK-07)

---

## 상세 작업 목록

### 1. 검색 페이지

**파일:**
- `app/(main)/search/page.tsx` - 검색 페이지

**기능:**
- 검색 입력 필드
- 필터 옵션 (책 제목, 날짜, 태그, 유형)
- 검색 결과 표시
- 검색어 하이라이트
- 페이지네이션

### 2. 검색 API

**파일:**
- `app/api/search/route.ts` - 검색 API

**기능:**
- Full-text Search (Supabase)
- 필터 적용
- 결과 반환

### 3. 검색 Hooks

**파일:**
- `hooks/use-search.ts` - 검색 관련 커스텀 훅

---

## 파일 구조

```
app/
├── (main)/
│   └── search/
│       └── page.tsx
└── api/
    └── search/
        └── route.ts

hooks/
└── use-search.ts
```

---

## API 인터페이스

### API Routes

```typescript
// app/api/search/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q'); // 검색어
  const bookId = searchParams.get('bookId'); // 책 필터
  const startDate = searchParams.get('startDate'); // 시작일
  const endDate = searchParams.get('endDate'); // 종료일
  const tags = searchParams.get('tags'); // 태그 (쉼표 구분)
  const types = searchParams.get('types'); // 유형 (쉼표 구분)
  const page = searchParams.get('page'); // 페이지 번호
  
  // Full-text Search + 필터 적용
  // 반환: { results: Note[], total: number, page: number }
}
```

### Hooks

```typescript
// hooks/use-search.ts
export function useSearch() {
  return {
    search: (params: SearchParams) => Promise<SearchResults>;
    isLoading: boolean;
    error: Error | null;
  };
}
```

---

## 사용자 스토리 매핑

- US-019: 전체 텍스트 검색
- US-020: 책 제목으로 검색
- US-021: 날짜로 검색
- US-022: 태그로 검색
- US-023: 검색 결과 필터링

---

## 검증 체크리스트

- [x] 전체 텍스트 검색이 정상 작동함
- [x] 책 제목 필터가 정상 작동함
- [x] 날짜 필터가 정상 작동함
- [x] 태그 필터가 정상 작동함
- [x] 유형 필터가 정상 작동함
- [x] 검색어 하이라이트가 정상 작동함
- [x] 페이지네이션이 정상 작동함
- [x] 검색 결과가 1초 이내에 표시됨

---

## 개발 프롬프트

```
다음 문서들을 참고하여 검색 기능을 구현해주세요.

참고 문서:
- doc/user_stories.md (US-019~US-023)
- doc/software_design.md (4.2.4 Notes - Full-text Search 인덱스)
- doc/Habitree-Reading-Hub-PRD.md (4.1.4 검색 기능)
- doc/review_issues.md (6. Full-text Search 한글 지원)

작업 내용:
1. 검색 페이지 구현:
   - 검색 입력 필드
   - 필터 옵션 (책 제목, 날짜, 태그, 유형)
   - 검색 결과 표시
   - 검색어 하이라이트
   - 페이지네이션
2. 검색 API 구현 (app/api/search/route.ts):
   - Full-text Search (Supabase)
   - 필터 적용
   - 결과 반환
3. 검색 Hooks 구현

주의사항:
- review_issues.md의 6번 이슈 참고: 한글 검색 지원
- PostgreSQL 'simple' 텍스트 검색은 한글 형태소 분석 미지원
- pg_trgm 확장 사용 또는 ILIKE 패턴 매칭 고려
- 검색 결과는 1초 이내 표시 목표
- 페이지네이션: 한 페이지당 20개

완료 후:
- 각 함수에 JSDoc 주석 추가
- 에러 처리 로직 추가
- 로딩 상태 처리
```

---

## 참고 문서

### 필수 참고
- [user_stories.md](../../user_stories.md) - US-019~US-023
- [software_design.md](../../software_design.md) - 4.2.4 Notes
- [review_issues.md](../../review_issues.md) - 6. Full-text Search 한글 지원

### 추가 참고
- [PostgreSQL Full-text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [Supabase Full-text Search](https://supabase.com/docs/guides/database/full-text-search)

---

**문서 끝**

