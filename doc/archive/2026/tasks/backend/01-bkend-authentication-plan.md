# TASK-01: 인증 및 온보딩 백엔드

**작업 ID:** TASK-01  
**우선순위:** P0 (Must Have)  
**예상 소요 시간:** 1일  
**의존성:** TASK-00  
**다음 작업:** 없음 (독립적)

---

## 작업 개요

인증 및 온보딩 관련 Server Actions와 API Routes를 검증하고 개선합니다. 프론트엔드의 인증 플로우와 완벽하게 연동되어야 합니다.

**작업 상태:** ✅ 검증 및 개선 완료

---

## 작업 범위

### 포함 사항
- ✅ `app/actions/auth.ts` 검증 및 개선
- ✅ `app/actions/onboarding.ts` 검증 및 개선
- ✅ `app/callback/route.ts` 검증 및 개선
- ✅ 프론트엔드 연동 확인

### 제외 사항
- ❌ 프론트엔드 컴포넌트 (이미 구현됨)
- ❌ 미들웨어 (이미 구현됨)

---

## 상세 작업 목록

### 1. 인증 Server Actions 검증 및 개선

**파일:** `app/actions/auth.ts`

**기능:**
- `signInWithKakao()`: 카카오톡 OAuth 로그인
- `signInWithGoogle()`: 구글 OAuth 로그인
- `signOut()`: 로그아웃
- `getCurrentUser()`: 현재 사용자 조회

**확인 사항:**
- OAuth 리다이렉트 URL이 `getAppUrl()`을 사용하는지 확인
- 에러 처리가 적절한지 확인
- 로그아웃 후 리다이렉트가 올바른지 확인

### 2. 온보딩 Server Actions 검증 및 개선

**파일:** `app/actions/onboarding.ts`

**기능:**
- `setReadingGoal(goal)`: 독서 목표 설정 (1-100)
- `checkOnboardingComplete()`: 온보딩 완료 확인

**확인 사항:**
- 목표 값 유효성 검사 (1-100)
- 사용자 프로필 업데이트가 올바른지 확인
- 온보딩 상태 확인 로직이 정확한지 확인

### 3. OAuth 콜백 Route 검증 및 개선

**파일:** `app/callback/route.ts`

**기능:**
- OAuth 코드 교환
- 사용자 프로필 자동 생성 확인
- 온보딩 상태 확인 및 리다이렉트

**확인 사항:**
- Supabase Auth 코드 교환이 올바른지 확인
- 사용자 프로필이 자동 생성되는지 확인 (TASK-00의 트리거)
- 온보딩 미완료 시 `/onboarding/goal`로 리다이렉트
- 온보딩 완료 시 `/`로 리다이렉트

---

## 프론트엔드 연동 확인

### 연동 페이지
- `app/(auth)/login/page.tsx`
  - `signInWithKakao()` 호출
  - `signInWithGoogle()` 호출
- `app/(auth)/onboarding/goal/page.tsx`
  - `setReadingGoal()` 호출
- `app/(auth)/onboarding/page.tsx`
  - `checkOnboardingComplete()` 호출

### 연동 컴포넌트
- `components/auth/social-login-buttons.tsx`
  - `signInWithKakao()`, `signInWithGoogle()` 호출
- `components/auth/login-form.tsx`
  - 인증 상태 확인

---

## 개발 프롬프트

```
@doc/software_design.md (6.4 섹션) @doc/tasks/front/03-task-authentication-plan.md 참고하여 
인증 및 온보딩 백엔드를 검증하고 개선해주세요.

작업 내용:
1. app/actions/auth.ts 파일 검증 및 개선:
   - signInWithKakao(), signInWithGoogle() 함수가 getAppUrl()을 사용하여 리다이렉트 URL을 생성하는지 확인
   - 에러 처리가 적절한지 확인 (명확한 에러 메시지)
   - signOut() 후 리다이렉트가 /login으로 올바르게 되는지 확인
   - getCurrentUser()가 null을 적절히 반환하는지 확인

2. app/actions/onboarding.ts 파일 검증 및 개선:
   - setReadingGoal() 함수의 유효성 검사 (1-100) 확인
   - 사용자 프로필 업데이트가 올바른지 확인
   - checkOnboardingComplete() 로직이 정확한지 확인 (reading_goal이 설정되어 있으면 완료)

3. app/callback/route.ts 파일 검증 및 개선:
   - OAuth 코드 교환이 올바른지 확인
   - 사용자 프로필 자동 생성 확인 (TASK-00의 handle_new_user 트리거)
   - 온보딩 상태 확인 로직:
     - reading_goal이 없으면 /onboarding/goal로 리다이렉트
     - reading_goal이 있으면 /로 리다이렉트
   - 에러 처리 및 예외 상황 처리

4. 프론트엔드 연동 확인:
   - app/(auth)/login/page.tsx에서 Server Actions 호출 확인
   - app/(auth)/onboarding/goal/page.tsx에서 setReadingGoal() 호출 확인
   - app/(auth)/onboarding/page.tsx에서 checkOnboardingComplete() 호출 확인
   - 각 페이지에서 에러 처리 및 로딩 상태 확인

5. 테스트:
   - 카카오톡 로그인 플로우 테스트
   - 구글 로그인 플로우 테스트
   - 온보딩 플로우 테스트 (목표 설정 → 튜토리얼 → 메인)
   - 로그아웃 플로우 테스트
```

---

## 참고 문서

### 필수 참고 문서
- `doc/software_design.md` (6.4 섹션)
  - 미들웨어 설계
- `doc/tasks/front/03-task-authentication-plan.md`
  - 프론트엔드 인증 구현 상세
- `doc/Habitree-Reading-Hub-PRD.md` (4.1.1 섹션)
  - 사용자 인증 및 온보딩 요구사항

### 관련 프론트엔드 파일
- `app/(auth)/login/page.tsx`
- `app/(auth)/onboarding/goal/page.tsx`
- `app/(auth)/onboarding/tutorial/page.tsx`
- `app/(auth)/onboarding/page.tsx`
- `components/auth/social-login-buttons.tsx`
- `components/auth/login-form.tsx`
- `app/callback/route.ts`

---

## 검증 체크리스트

### 인증 기능
- [x] 카카오톡 로그인이 정상 작동하는지 확인 (`app/actions/auth.ts` - `signInWithKakao()``)
- [x] 구글 로그인이 정상 작동하는지 확인 (`app/actions/auth.ts` - `signInWithGoogle()`)
- [x] OAuth 콜백이 올바르게 처리되는지 확인 (`app/callback/route.ts`)
- [x] 사용자 프로필이 자동 생성되는지 확인 (TASK-00 트리거 + 재시도 로직)
- [x] 로그아웃이 정상 작동하는지 확인 (`app/actions/auth.ts` - `signOut()`)
- [x] 현재 사용자 조회가 정상 작동하는지 확인 (`app/actions/auth.ts` - `getCurrentUser()`)

**구현 확인:**
- ✅ `signInWithKakao()`, `signInWithGoogle()` 함수가 `getAppUrl()`을 사용하여 리다이렉트 URL 생성
- ✅ `signOut()` 후 `/login`으로 리다이렉트
- ✅ `getCurrentUser()`가 null을 적절히 반환
- ✅ OAuth 콜백에서 프로필 자동 생성 확인 및 재시도 로직 포함

### 온보딩 기능
- [x] 독서 목표 설정이 정상 작동하는지 확인 (`app/actions/onboarding.ts` - `setReadingGoal()`)
- [x] 목표 값 유효성 검사 (1-100) 확인 (서버 및 클라이언트 양쪽 검증)
- [x] 온보딩 완료 확인이 정상 작동하는지 확인 (`app/actions/onboarding.ts` - `checkOnboardingComplete()`)
- [x] 온보딩 미완료 시 올바른 리다이렉트 확인 (`/onboarding/goal`)
- [x] 온보딩 완료 시 올바른 리다이렉트 확인 (`/`)

**구현 확인:**
- ✅ `setReadingGoal()` 함수의 유효성 검사 (1-100) 구현
- ✅ 사용자 프로필 업데이트가 올바르게 구현됨
- ✅ `checkOnboardingComplete()` 로직이 정확함 (reading_goal이 설정되어 있으면 완료)

### 에러 처리
- [x] OAuth 에러 시 적절한 에러 메시지 표시 (`components/auth/social-login-buttons.tsx` - toast 추가)
- [x] 목표 설정 에러 시 적절한 에러 메시지 표시 (`app/(auth)/onboarding/goal/page.tsx`)
- [x] 예외 상황 처리 확인 (`app/callback/route.ts` - try-catch 및 재시도 로직)

**구현 확인:**
- ✅ `social-login-buttons.tsx`에 에러 토스트 추가 완료
- ✅ `callback/route.ts`에 예외 처리 및 프로필 생성 재시도 로직 추가

### 프론트엔드 연동
- [x] 로그인 페이지에서 Server Actions 호출 확인 (`app/(auth)/login/page.tsx` → `components/auth/social-login-buttons.tsx`)
- [x] 온보딩 페이지에서 Server Actions 호출 확인 (`app/(auth)/onboarding/goal/page.tsx`, `app/(auth)/onboarding/page.tsx`)
- [x] 에러 처리 및 로딩 상태 확인 (모든 페이지에 구현됨)

**구현 확인:**
- ✅ `app/(auth)/login/page.tsx`에서 `SocialLoginButtons` 컴포넌트 사용
- ✅ `app/(auth)/onboarding/goal/page.tsx`에서 `setReadingGoal()` 호출
- ✅ `app/(auth)/onboarding/page.tsx`에서 `checkOnboardingComplete()` 호출
- ✅ 각 페이지에서 에러 처리 및 로딩 상태 확인 완료

---

## 작업 완료 요약

### ✅ 완료된 개선 사항

1. **`app/actions/auth.ts`** - 검증 완료
   - ✅ `signInWithKakao()`, `signInWithGoogle()` 함수가 `getAppUrl()` 사용
   - ✅ 에러 처리 적절 (명확한 에러 메시지)
   - ✅ `signOut()` 후 `/login`으로 리다이렉트
   - ✅ `getCurrentUser()`가 null을 적절히 반환

2. **`app/actions/onboarding.ts`** - 검증 완료
   - ✅ `setReadingGoal()` 함수의 유효성 검사 (1-100) 구현
   - ✅ 사용자 프로필 업데이트 올바르게 구현
   - ✅ `checkOnboardingComplete()` 로직 정확 (reading_goal이 설정되어 있으면 완료)

3. **`app/callback/route.ts`** - 개선 완료
   - ✅ OAuth 코드 교환 올바르게 구현
   - ✅ 사용자 프로필 자동 생성 확인 및 재시도 로직 추가 (TASK-00 트리거 대비)
   - ✅ 온보딩 상태 확인 로직 정확:
     - reading_goal이 없으면 `/onboarding/goal`로 리다이렉트
     - reading_goal이 있으면 `/`로 리다이렉트
   - ✅ 에러 처리 및 예외 상황 처리 추가 (try-catch, 재시도 로직)

4. **프론트엔드 연동** - 확인 완료
   - ✅ `app/(auth)/login/page.tsx`에서 Server Actions 호출 확인
   - ✅ `app/(auth)/onboarding/goal/page.tsx`에서 `setReadingGoal()` 호출 확인
   - ✅ `app/(auth)/onboarding/page.tsx`에서 `checkOnboardingComplete()` 호출 확인
   - ✅ 각 페이지에서 에러 처리 및 로딩 상태 확인 완료

5. **에러 처리 개선**
   - ✅ `components/auth/social-login-buttons.tsx`에 에러 토스트 추가 (toast.error)
   - ✅ 모든 Server Actions에 명확한 에러 메시지 포함

### 📝 주요 개선 내용

1. **프로필 자동 생성 안정성 향상**
   - `app/callback/route.ts`에 프로필 생성 재시도 로직 추가
   - TASK-00의 `handle_new_user` 트리거가 즉시 실행되지 않을 경우 대비
   - 최대 3회 재시도 후 수동 생성 시도

2. **에러 처리 개선**
   - `social-login-buttons.tsx`에 toast 에러 메시지 추가
   - 모든 에러 상황에 대한 명확한 사용자 피드백 제공

3. **코드 품질**
   - 모든 함수에 적절한 에러 처리 및 타입 안정성 확보
   - 주석 및 문서화 개선

## 테스트 가이드

카카오톡 로그인 실제 검증 테스트를 수행하려면 다음 문서를 참고하세요:

**`doc/tasks/backend/kakao-login-test-guide.md`**

이 문서에는 다음 내용이 포함되어 있습니다:
- Supabase 설정 확인 방법
- 카카오 개발자 센터 설정 확인 방법
- 로컬 및 프로덕션 환경 테스트 절차
- 문제 해결 가이드
- 검증 체크리스트

---

## 다음 단계

인증 및 온보딩 백엔드 완료 후:
1. TASK-02 (책 관리 백엔드) 시작 가능
2. TASK-08 (프로필 관리 백엔드) 시작 가능

---

**문서 끝**

