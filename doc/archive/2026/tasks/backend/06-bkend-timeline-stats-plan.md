# TASK-06: 타임라인 및 통계 백엔드

**작업 ID:** TASK-06  
**우선순위:** P0 (Must Have)  
**예상 소요 시간:** 1일  
**의존성:** TASK-00, TASK-03  
**다음 작업:** 없음

---

## 작업 개요

타임라인 및 통계 관련 Server Actions를 검증하고 개선합니다. 데이터베이스 함수 활용을 포함합니다.

---

## 작업 범위

### 포함 사항
- ✅ `app/actions/stats.ts` 검증 및 개선
- ✅ 데이터베이스 함수 검증 및 개선
- ✅ 프론트엔드 연동 확인

### 제외 사항
- ❌ 프론트엔드 타임라인 UI (이미 구현됨)

---

## 상세 작업 목록

### 1. 통계 Server Actions 검증 및 개선

**파일:** `app/actions/stats.ts`

**기능:**
- `getTimeline()`: 타임라인 조회 (정렬 옵션, 페이지네이션)
- `getReadingStats()`: 독서 통계 조회 (이번 주, 올해)
- `getGoalProgress()`: 목표 진행률 조회
- `getMonthlyStats()`: 월별 기록 통계 조회

**확인 사항:**
- 정렬 옵션이 올바른지 확인
- 페이지네이션 로직 확인
- 통계 계산 로직 확인
- 데이터베이스 함수 활용 확인

### 2. 데이터베이스 함수 검증 및 개선

**파일:** `doc/database/schema.sql` (TASK-00에서 생성)

**기능:**
- `get_user_completed_books_count()`: 올해 완독 책 수
- `get_user_notes_count_this_week()`: 이번 주 기록 수

**확인 사항:**
- 함수가 올바르게 작동하는지 확인
- 성능 최적화 확인

---

## 프론트엔드 연동 확인

### 연동 페이지
- `app/(main)/page.tsx` (대시보드)
  - `getReadingStats()` 호출
  - `getGoalProgress()` 호출
  - `getMonthlyStats()` 호출
- `app/(main)/timeline/page.tsx`
  - `getTimeline()` 호출

### 연동 컴포넌트
- `components/dashboard/dashboard-content.tsx`
  - 통계 표시
- `components/timeline/timeline-content.tsx`
  - 타임라인 표시

---

## 개발 프롬프트

```
@doc/software_design.md (4.3.2 섹션) @doc/tasks/front/08-task-timeline-stats-plan.md 참고하여 
타임라인 및 통계 백엔드를 검증하고 개선해주세요.

작업 내용:
1. app/actions/stats.ts 파일 검증 및 개선:
   - getTimeline() 함수의 정렬 옵션 확인 (latest, oldest, book)
   - 페이지네이션 로직 확인
   - JOIN 쿼리 확인
   - getReadingStats() 함수의 통계 계산 확인
   - getGoalProgress() 함수의 진행률 계산 확인
   - getMonthlyStats() 함수의 월별 통계 확인

2. 데이터베이스 함수 검증 (TASK-00에서 생성):
   - get_user_completed_books_count() 함수 확인
   - get_user_notes_count_this_week() 함수 확인
   - 함수 성능 확인

3. 프론트엔드 연동 확인:
   - 대시보드 페이지에서 통계 Server Actions 호출 확인
   - 타임라인 페이지에서 getTimeline() 호출 확인
   - 에러 처리 및 로딩 상태 확인
```

---

## 참고 문서

### 필수 참고 문서
- `doc/software_design.md` (4.3.2 섹션)
  - 독서 통계 함수
- `doc/tasks/front/08-task-timeline-stats-plan.md`
  - 프론트엔드 타임라인 및 통계 구현 상세

### 관련 프론트엔드 파일
- `app/(main)/page.tsx`
- `app/(main)/timeline/page.tsx`
- `components/dashboard/dashboard-content.tsx`
- `components/timeline/timeline-content.tsx`

---

## 검증 체크리스트

### 타임라인 기능
- [x] 타임라인 조회가 정상 작동하는지 확인
  - ✅ getTimeline() 함수로 타임라인 조회
  - ✅ JOIN 쿼리로 notes와 books 정보 조회
  - ✅ user_id로 필터링하여 사용자별 데이터만 조회
  - ✅ 페이지네이션 지원 (20개/페이지)
- [x] 정렬 옵션이 정상 작동하는지 확인
  - ✅ latest: created_at DESC (최신순)
  - ✅ oldest: created_at ASC (오래된순)
  - ✅ book: book_id ASC, created_at DESC (책별)
  - ✅ 정렬 옵션이 올바르게 적용됨
- [x] 페이지네이션이 정상 작동하는지 확인
  - ✅ range() 메서드로 페이지네이션 구현
  - ✅ ITEMS_PER_PAGE = 20으로 설정
  - ✅ totalPages 계산 및 반환
  - ✅ 프론트엔드에서 페이지네이션 UI 제공

### 통계 기능
- [x] 독서 통계 조회가 정상 작동하는지 확인
  - ✅ getReadingStats() 함수로 통계 조회
  - ✅ 이번 주 기록 수: get_user_notes_count_this_week() 함수 활용
  - ✅ 올해 완독한 책 수: get_user_completed_books_count() 함수 활용
  - ✅ 올해 작성한 기록 수: 직접 쿼리
  - ✅ 가장 많이 기록한 책 Top 5: 집계 및 정렬
- [x] 목표 진행률 조회가 정상 작동하는지 확인
  - ✅ getGoalProgress() 함수로 진행률 조회
  - ✅ users 테이블에서 reading_goal 조회
  - ✅ 올해 완독한 책 수: get_user_completed_books_count() 함수 활용
  - ✅ 진행률 계산: (completed / goal) * 100
  - ✅ 100% 초과 방지 (Math.min)
  - ✅ remaining 계산: goal - completed
- [x] 월별 기록 통계 조회가 정상 작동하는지 확인
  - ✅ getMonthlyStats() 함수로 월별 통계 조회
  - ✅ 최근 6개월간의 기록 수 집계
  - ✅ 월별로 그룹화하여 반환
  - ✅ 날짜 범위 쿼리 (gte, lt) 사용
- [x] 데이터베이스 함수 활용 확인
  - ✅ get_user_completed_books_count() 함수 활용
  - ✅ get_user_notes_count_this_week() 함수 활용
  - ✅ supabase.rpc() 메서드로 함수 호출
  - ✅ 에러 처리 및 기본값 설정

### 에러 처리
- [x] 통계 에러 시 적절한 에러 메시지 표시
  - ✅ try-catch로 에러 처리
  - ✅ 인증 실패 시 "로그인이 필요합니다." 메시지
  - ✅ 사용자 정보 조회 실패 시 "사용자 정보를 찾을 수 없습니다." 메시지
  - ✅ 데이터베이스 함수 호출 실패 시 기본값(0) 반환
- [x] 예외 상황 처리 확인
  - ✅ 인증되지 않은 사용자 처리
  - ✅ 사용자 정보 없음 처리
  - ✅ 데이터베이스 함수 호출 실패 처리
  - ✅ 목표가 0인 경우 진행률 0% 반환

### 프론트엔드 연동
- [x] 대시보드 페이지에서 Server Actions 호출 확인
  - ✅ app/(main)/page.tsx에서 DashboardContent 컴포넌트 사용
  - ✅ components/dashboard/dashboard-content.tsx에서 Server Actions 호출
  - ✅ getGoalProgress(), getReadingStats(), getMonthlyStats() 호출
  - ✅ Promise.all()로 병렬 호출하여 성능 최적화
  - ✅ Suspense로 로딩 상태 처리
- [x] 타임라인 페이지에서 Server Actions 호출 확인
  - ✅ app/(main)/timeline/page.tsx에서 TimelineContent 컴포넌트 사용
  - ✅ components/timeline/timeline-content.tsx에서 getTimeline() 호출
  - ✅ 정렬 옵션 변경 시 URL 파라미터 업데이트
  - ✅ 페이지네이션 처리
- [x] 에러 처리 및 로딩 상태 확인
  - ✅ isLoading 상태 관리
  - ✅ Loader2 컴포넌트로 로딩 표시
  - ✅ console.error로 에러 로깅
  - ✅ try-catch로 에러 처리

### 개선 사항
- ✅ 데이터베이스 함수 활용으로 성능 최적화
  - get_user_notes_count_this_week() 함수 활용
  - get_user_completed_books_count() 함수 활용
- ✅ 에러 처리 개선
  - 데이터베이스 함수 호출 실패 시 기본값 반환
  - 명확한 에러 메시지 제공

---

**문서 끝**

