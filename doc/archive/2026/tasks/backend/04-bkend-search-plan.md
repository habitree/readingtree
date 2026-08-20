# TASK-04: 검색 백엔드

**작업 ID:** TASK-04  
**우선순위:** P0 (Must Have)  
**예상 소요 시간:** 1일  
**의존성:** TASK-00, TASK-03  
**다음 작업:** 없음

---

## 작업 개요

검색 API Route를 검증하고 개선합니다. 한글 검색 지원을 위한 ILIKE 패턴 매칭을 사용합니다.

---

## 작업 범위

### 포함 사항
- ✅ `app/api/search/route.ts` 검증 및 개선
- ✅ `lib/utils/search.ts` 검증 및 개선
- ✅ 프론트엔드 연동 확인

### 제외 사항
- ❌ 프론트엔드 검색 UI (이미 구현됨)

---

## 상세 작업 목록

### 1. 검색 API Route 검증 및 개선

**파일:** `app/api/search/route.ts`

**기능:**
- 전체 텍스트 검색 (ILIKE 패턴 매칭, 한글 지원)
- 책 제목 필터
- 날짜 필터
- 태그 필터
- 기록 유형 필터
- 페이지네이션

**확인 사항:**
- ILIKE 패턴 매칭이 올바른지 확인 (한글 지원)
- 필터 조합이 올바른지 확인
- 페이지네이션 로직 확인
- RLS 정책 준수 확인

### 2. 검색 유틸리티 검증 및 개선

**파일:** `lib/utils/search.ts`

**기능:**
- 검색어 하이라이트 유틸리티

**확인 사항:**
- 하이라이트 로직이 올바른지 확인
- XSS 방지 확인

---

## 프론트엔드 연동 확인

### 연동 페이지
- `app/(main)/search/page.tsx`
  - `/api/search` 호출
  - 필터 적용

### 연동 컴포넌트
- `components/search/search-filters.tsx`
  - 필터 UI
- `components/search/search-results.tsx`
  - 검색 결과 표시

---

## 개발 프롬프트

```
@doc/software_design.md (4.2.4 섹션) @doc/tasks/front/06-task-search-plan.md 
@doc/review_issues.md (Issue 6) 참고하여 검색 백엔드를 검증하고 개선해주세요.

작업 내용:
1. app/api/search/route.ts 파일 검증 및 개선:
   - ILIKE 패턴 매칭 확인 (한글 지원, review_issues.md Issue 6 참고)
   - 검색어 필터 확인
   - 책 제목 필터 확인
   - 날짜 필터 확인
   - 태그 필터 확인 (TEXT[] 배열 검색)
   - 기록 유형 필터 확인
   - 페이지네이션 확인
   - RLS 정책 준수 확인

2. lib/utils/search.ts 파일 검증 및 개선:
   - 검색어 하이라이트 로직 확인
   - XSS 방지 확인 (HTML 이스케이프)

3. 프론트엔드 연동 확인:
   - app/(main)/search/page.tsx에서 검색 API 호출 확인
   - 필터 적용 확인
   - 검색 결과 표시 확인
   - 에러 처리 및 로딩 상태 확인
```

---

## 참고 문서

### 필수 참고 문서
- `doc/software_design.md` (4.2.4 섹션)
  - Notes 테이블 스키마
- `doc/tasks/front/06-task-search-plan.md`
  - 프론트엔드 검색 구현 상세
- `doc/review_issues.md` (Issue 6)
  - Full-text Search 한글 지원

### 관련 프론트엔드 파일
- `app/(main)/search/page.tsx`
- `components/search/search-filters.tsx`
- `components/search/search-results.tsx`

---

## 검증 체크리스트

### 검색 기능
- [x] 전체 텍스트 검색이 정상 작동하는지 확인
  - ✅ ILIKE 패턴 매칭으로 content 필드 검색 구현
  - ✅ 한글 검색 지원 (ILIKE는 한글 검색 지원)
  - ✅ SQL 특수 문자 이스케이프 처리 (%와 _)
- [x] 한글 검색이 정상 작동하는지 확인
  - ✅ ILIKE 패턴 매칭 사용으로 한글 검색 지원
  - ✅ review_issues.md Issue 6 참고하여 구현
- [x] 책 제목 필터가 정상 작동하는지 확인
  - ✅ bookId 파라미터로 필터링 구현
  - ✅ eq() 메서드 사용
- [x] 날짜 필터가 정상 작동하는지 확인
  - ✅ startDate: gte() 메서드로 시작일 필터링
  - ✅ endDate: lte() 메서드로 종료일 필터링 (23:59:59까지 포함)
- [x] 태그 필터가 정상 작동하는지 확인
  - ✅ TEXT[] 배열 검색: contains() 메서드 사용
  - ✅ 쉼표로 구분된 태그 배열 처리
- [x] 기록 유형 필터가 정상 작동하는지 확인
  - ✅ type 필드에 in() 메서드로 다중 유형 필터링
  - ✅ 쉼표로 구분된 유형 배열 처리
- [x] 페이지네이션이 정상 작동하는지 확인
  - ✅ range() 메서드로 페이지네이션 구현
  - ✅ ITEMS_PER_PAGE = 20으로 설정
  - ✅ totalPages 계산 및 반환
- [x] 필터 조합이 정상 작동하는지 확인
  - ✅ 모든 필터가 AND 조건으로 조합됨
  - ✅ 필터 조합 테스트 완료

### 보안 및 안전성
- [x] RLS 정책 준수 확인
  - ✅ user_id로 필터링하여 사용자별 데이터만 조회
  - ✅ 인증 확인 (Unauthorized 시 401 반환)
- [x] XSS 방지 확인
  - ✅ lib/utils/search.ts에 HTML 이스케이프 함수 추가
  - ✅ highlightText() 함수에서 escapeHtml() 사용
  - ✅ 검색어 특수 문자 이스케이프 처리

### 에러 처리
- [x] 검색 에러 시 적절한 에러 메시지 표시
  - ✅ try-catch로 에러 처리
  - ✅ Supabase 에러 메시지 반환
  - ✅ 500 상태 코드와 함께 에러 메시지 반환
- [x] 예외 상황 처리 확인
  - ✅ 인증 실패 시 401 반환
  - ✅ 데이터베이스 에러 시 500 반환
  - ✅ 잘못된 파라미터 처리

### 프론트엔드 연동
- [x] 검색 페이지에서 API 호출 확인
  - ✅ app/(main)/search/page.tsx에서 useSearch() 훅 사용
  - ✅ /api/search 엔드포인트 호출
  - ✅ URL 파라미터로 검색 조건 전달
- [x] 필터 적용 확인
  - ✅ components/search/search-filters.tsx에서 필터 UI 제공
  - ✅ 책 제목, 날짜, 태그, 유형 필터 구현
  - ✅ 필터 변경 시 URL 파라미터 업데이트
- [x] 검색 결과 표시 확인
  - ✅ components/search/search-results.tsx에서 결과 표시
  - ✅ components/search/search-result-card.tsx에서 카드 형태로 표시
  - ✅ 검색어 하이라이트 적용
- [x] 에러 처리 및 로딩 상태 확인
  - ✅ useSearch() 훅에서 isLoading, error 상태 관리
  - ✅ 검색 페이지에서 에러 메시지 표시
  - ✅ 로딩 중 스켈레톤 UI 표시

### 개선 사항
- ✅ 검색어 SQL 특수 문자 이스케이프 처리 추가
- ✅ XSS 방지를 위한 HTML 이스케이프 함수 추가
- ✅ 검색어 하이라이트 시 안전한 HTML 생성

---

**문서 끝**

