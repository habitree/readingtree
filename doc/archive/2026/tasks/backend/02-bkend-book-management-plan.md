# TASK-02: 책 관리 백엔드

**작업 ID:** TASK-02  
**우선순위:** P0 (Must Have)  
**예상 소요 시간:** 1일  
**의존성:** TASK-00  
**다음 작업:** TASK-03

---

## 작업 개요

책 관리 관련 Server Actions와 API Routes를 검증하고 개선합니다. 네이버 검색 API 연동 및 ISBN 중복 처리 로직을 포함합니다.

---

## 작업 범위

### 포함 사항
- ✅ `app/actions/books.ts` 검증 및 개선
- ✅ `app/api/books/search/route.ts` 검증 및 개선
- ✅ `lib/api/naver.ts` 검증 및 개선
- ✅ 프론트엔드 연동 확인

### 제외 사항
- ❌ 기록 기능 (TASK-03)
- ❌ 검색 기능 (TASK-04)

---

## 상세 작업 목록

### 1. 책 관리 Server Actions 검증 및 개선

**파일:** `app/actions/books.ts`

**기능:**
- `addBook()`: 책 추가 (ISBN 중복 체크 및 재사용)
- `updateBookStatus()`: 독서 상태 변경
- `getUserBooks()`: 사용자 책 목록 조회
- `getBookDetail()`: 책 상세 조회

**확인 사항:**
- ISBN이 있으면 기존 책 재사용 로직 확인
- 중복 책 추가 방지 확인
- 완독 시 `completed_at` 자동 기록 확인
- RLS 정책 준수 확인

### 2. 책 검색 API Route 검증 및 개선

**파일:** `app/api/books/search/route.ts`

**기능:**
- 네이버 검색 API 연동
- 검색 결과 캐싱 (1시간)
- 에러 처리

**확인 사항:**
- 네이버 API 호출이 올바른지 확인
- 캐싱 전략이 적절한지 확인
- 에러 처리가 적절한지 확인

### 3. 네이버 API 클라이언트 검증 및 개선

**파일:** `lib/api/naver.ts`

**기능:**
- 네이버 검색 API 클라이언트
- 응답 데이터 변환

**확인 사항:**
- API 키 환경 변수 사용 확인
- 응답 데이터 변환이 올바른지 확인

---

## 프론트엔드 연동 확인

### 연동 페이지
- `app/(main)/books/page.tsx`
  - `getUserBooks()` 호출
  - 상태 필터 적용
- `app/(main)/books/search/page.tsx`
  - `/api/books/search` 호출
- `app/(main)/books/[id]/page.tsx`
  - `getBookDetail()` 호출
  - `updateBookStatus()` 호출

### 연동 컴포넌트
- `components/books/book-search.tsx`
  - 검색 API 호출
- `components/books/book-status-selector.tsx`
  - `updateBookStatus()` 호출

---

## 개발 프롬프트

```
@doc/software_design.md (6.2.1 섹션) @doc/tasks/front/04-task-book-management-plan.md 
@doc/review_issues.md (Issue 5) 참고하여 책 관리 백엔드를 검증하고 개선해주세요.

작업 내용:
1. app/actions/books.ts 파일 검증 및 개선:
   - addBook() 함수의 ISBN 중복 체크 및 재사용 로직 확인 (review_issues.md Issue 5 참고)
   - 중복 책 추가 방지 확인 (user_id, book_id UNIQUE 제약조건)
   - updateBookStatus() 함수의 completed_at 자동 기록 확인
   - getUserBooks() 함수의 JOIN 쿼리 확인
   - getBookDetail() 함수의 권한 확인

2. app/api/books/search/route.ts 파일 검증 및 개선:
   - 네이버 API 호출이 올바른지 확인
   - 검색어 유효성 검사 확인
   - 캐싱 전략 확인 (1시간)
   - 에러 처리 확인

3. lib/api/naver.ts 파일 검증 및 개선:
   - 환경 변수 사용 확인 (NAVER_CLIENT_ID, NAVER_CLIENT_SECRET)
   - 응답 데이터 변환이 올바른지 확인
   - 에러 처리 확인

4. 프론트엔드 연동 확인:
   - app/(main)/books/page.tsx에서 getUserBooks() 호출 확인
   - app/(main)/books/search/page.tsx에서 검색 API 호출 확인
   - app/(main)/books/[id]/page.tsx에서 getBookDetail(), updateBookStatus() 호출 확인
   - 각 페이지에서 에러 처리 및 로딩 상태 확인
```

---

## 참고 문서

### 필수 참고 문서
- `doc/software_design.md` (6.2.1 섹션)
  - 네이버 검색 API 연동
- `doc/tasks/front/04-task-book-management-plan.md`
  - 프론트엔드 책 관리 구현 상세
- `doc/review_issues.md` (Issue 5)
  - Books 테이블 ISBN 제약조건

### 관련 프론트엔드 파일
- `app/(main)/books/page.tsx`
- `app/(main)/books/search/page.tsx`
- `app/(main)/books/[id]/page.tsx`
- `components/books/book-search.tsx`
- `components/books/book-status-selector.tsx`

---

## 검증 체크리스트

### 책 관리 기능
- [x] 책 추가가 정상 작동하는지 확인
- [x] ISBN 중복 체크 및 재사용 로직 확인
- [x] 중복 책 추가 방지 확인
- [x] 독서 상태 변경이 정상 작동하는지 확인
- [x] 완독 시 completed_at 자동 기록 확인
- [x] 책 목록 조회가 정상 작동하는지 확인
- [x] 책 상세 조회가 정상 작동하는지 확인

### 검색 기능
- [x] 네이버 검색 API 호출이 정상 작동하는지 확인
- [x] 검색 결과 캐싱 확인 (1시간, next.revalidate: 3600)
- [x] 검색 결과 변환이 올바른지 확인

### 에러 처리
- [x] 책 추가 에러 시 적절한 에러 메시지 표시
- [x] 검색 에러 시 적절한 에러 메시지 표시
- [x] 예외 상황 처리 확인

### 프론트엔드 연동
- [x] 책 목록 페이지에서 Server Actions 호출 확인 (app/(main)/books/page.tsx)
- [x] 책 검색 페이지에서 API 호출 확인 (app/(main)/books/search/page.tsx)
- [x] 책 상세 페이지에서 Server Actions 호출 확인 (app/(main)/books/[id]/page.tsx)
- [x] 에러 처리 및 로딩 상태 확인

---

## 개선 사항 요약

### 2025년 12월 검증 및 개선 작업 완료

#### 1. app/actions/books.ts 개선
- ✅ ISBN 중복 체크 로직 개선: `.single()` → `.maybeSingle()` 변경하여 PGRST116 에러 방지
- ✅ 중복 책 추가 방지: UNIQUE 제약조건과 함께 명시적 체크 로직 추가
- ✅ 완독 시 `completed_at` 자동 기록: 이미 구현되어 있음 확인
- ✅ JOIN 쿼리: `user_books`와 `books` 테이블 조인 정상 작동 확인
- ✅ 권한 확인: `getBookDetail()` 함수에서 사용자 권한 확인 로직 정상 작동

#### 2. app/api/books/search/route.ts 개선
- ✅ 검색어 유효성 검사 강화: 최소 2자, 최대 100자 제한 추가
- ✅ display, start 파라미터 유효성 검사: 1-100 범위로 제한
- ✅ 네이버 API 응답 형식 검증 추가
- ✅ 에러 처리 개선: JSON 파싱 실패 시 텍스트로 처리

#### 3. lib/api/naver.ts 개선
- ✅ 환경 변수 확인 메시지 개선
- ✅ 에러 처리 개선: JSON 파싱 실패 시 텍스트로 처리
- ✅ 응답 형식 검증 추가: items 배열이 없으면 빈 배열로 초기화
- ✅ ISBN 정규화: 하이픈 및 공백 제거
- ✅ 데이터 정규화: HTML 태그 제거 및 공백 제거

#### 4. 프론트엔드 연동 확인
- ✅ `app/(main)/books/page.tsx`: `getUserBooks()` 호출 확인, Suspense로 로딩 처리
- ✅ `app/(main)/books/search/page.tsx`: 검색 API 호출 확인, 에러 처리 및 로딩 상태 확인
- ✅ `app/(main)/books/[id]/page.tsx`: `getBookDetail()`, `updateBookStatus()` 호출 확인, 에러 처리 확인

---

## 다음 단계

책 관리 백엔드 완료 후:
1. TASK-03 (기록 관리 백엔드) 시작 가능

---

**문서 끝**

