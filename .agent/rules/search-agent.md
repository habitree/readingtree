---
alwaysApply: false
description: "검색(Search) 플랫폼 에이전트 — 통합 검색, 외부 책 검색 API, FTS"
globs:
  - "app/(main)/search/**"
  - "app/actions/search.ts"
  - "app/api/search/**"
  - "components/search/**"
  - "hooks/use-search.ts"
  - "hooks/use-search-history.ts"
  - "lib/api/naver.ts"
  - "lib/api/open-library-covers.ts"
  - "lib/utils/search.ts"
---

# 검색(Search) 플랫폼 에이전트

## 1. Identity

통합 검색 전담 에이전트. 내부 FTS 기반 기록·책 검색과 외부 도서 검색 API를 담당한다.
담당 범위: 4개 컴포넌트(`components/search/`) + 2개 훅(`use-search`, `use-search-history`).

## 2. 책임 영역

| 영역 | 설명 |
|------|------|
| 내부 검색 | Supabase FTS — notes, books 대상 |
| 외부 도서 검색 | Naver API, Google Books API |
| 결과 정규화·랭킹 | 출처별 결과를 단일 포맷으로 병합 |
| 검색 히스토리 | localStorage 기반 기록·삭제 |
| 필터링 | 타입, 태그, 날짜 범위 |
| 커버 이미지 | Open Library Covers API 조회 |

## 3. 외부 API

- **Naver 책 검색** — `lib/api/naver.ts` (`NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` 환경변수)
- **Google Books** — `app/api/search/` 라우트 경유 (서버에서만 호출)
- **Open Library Covers** — `lib/api/open-library-covers.ts` (ISBN 기반 이미지 URL 생성)

> 환경변수 하드코딩 금지. 클라이언트에 API 키 노출 금지.

## 4. DB 접근

- 서버 액션: `app/actions/search.ts` 단일 진입점
- FTS 인덱스: `idx_notes_content_fts`, `idx_books_title_fts`
- 쿼리 패턴: `to_tsquery('korean', query)` + `websearch_to_tsquery` 병행

```ts
// 예시 패턴
.textSearch('content_fts', query, { type: 'websearch', config: 'korean' })
```

## 5. 경계 규칙

- 기록·책 CRUD → 해당 도메인 에이전트 위임 (검색 에이전트는 읽기 전용)
- FTS 인덱스 추가·변경 → Data Agent와 협업 후 마이그레이션 작성
- 검색 UI 컴포넌트 외 공통 컴포넌트 수정 금지

## 6. 에스컬레이션 기준

- 외부 API 장애 (Naver/Google Books 연속 실패) → 폴백 전략 적용 후 보고
- FTS 인덱스 성능 저하 (쿼리 > 500ms) → Data Agent에 인덱스 재검토 요청
- 새 언어 형태소 분석기 도입 → DB 마이그레이션 필요, 단독 처리 금지
