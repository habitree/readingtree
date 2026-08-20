# TASK-03: 인증 시스템 (로그인/온보딩)

**작업 ID:** TASK-03  
**우선순위:** P0 (Must Have)  
**예상 소요 시간:** 2일  
**의존성:** TASK-01, TASK-02  
**다음 작업:** 모든 기능 작업

---

## 작업 개요

소셜 로그인(카카오톡, 구글)과 온보딩 플로우를 구현합니다. 이 작업은 다른 모든 기능의 전제조건이므로 조기에 완료되어야 합니다.

---

## 작업 범위

### 포함 사항
- ✅ 소셜 로그인 (카카오톡, 구글)
- ✅ 인증 콜백 처리
- ✅ 온보딩 플로우 (목표 설정, 튜토리얼)
- ✅ 인증 미들웨어
- ✅ 인증 Context 및 Hooks
- ✅ 로그인/회원가입 페이지

### 제외 사항
- ❌ 프로필 관리 (TASK-10)
- ❌ 다른 기능 구현

---

## 상세 작업 목록

### 1. 인증 페이지 구현

**파일:**
- `app/(auth)/login/page.tsx` - 로그인 페이지
- `app/(auth)/callback/route.ts` - OAuth 콜백 처리

**기능:**
- 카카오톡 로그인 버튼
- 구글 로그인 버튼
- OAuth 콜백 처리

### 2. 인증 컴포넌트

**파일:**
- `components/auth/login-form.tsx`
- `components/auth/social-login-buttons.tsx`

### 3. 인증 Context 및 Hooks

**파일:**
- `contexts/auth-context.tsx` - 인증 상태 관리
- `hooks/use-auth.ts` - 인증 관련 커스텀 훅

### 4. 인증 미들웨어

**파일:**
- `middleware.ts` - 라우트 보호

**기능:**
- 보호된 라우트 확인
- 인증되지 않은 사용자 리다이렉트
- 세션 새로고침

### 5. 온보딩 플로우

**파일:**
- `app/(auth)/onboarding/page.tsx` - 온보딩 메인
- `app/(auth)/onboarding/goal/page.tsx` - 목표 설정
- `app/(auth)/onboarding/tutorial/page.tsx` - 튜토리얼

**기능:**
- 독서 목표 설정 (1-100)
- 튜토리얼 (3-4개 화면)
- 완료 후 메인으로 이동

### 6. Server Actions

**파일:**
- `app/actions/auth.ts` - 인증 관련 Server Actions
- `app/actions/onboarding.ts` - 온보딩 관련 Server Actions

---

## 파일 구조

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   ├── onboarding/
│   │   ├── page.tsx
│   │   ├── goal/
│   │   │   └── page.tsx
│   │   └── tutorial/
│   │       └── page.tsx
│   └── callback/
│       └── route.ts
├── middleware.ts

components/
└── auth/
    ├── login-form.tsx
    └── social-login-buttons.tsx

contexts/
└── auth-context.tsx

hooks/
└── use-auth.ts

app/
└── actions/
    ├── auth.ts
    └── onboarding.ts
```

---

## API 인터페이스

### Server Actions

```typescript
// app/actions/auth.ts
export async function signInWithKakao() {
  // 카카오톡 로그인
}

export async function signInWithGoogle() {
  // 구글 로그인
}

export async function signOut() {
  // 로그아웃
}

// app/actions/onboarding.ts
export async function setReadingGoal(goal: number) {
  // 독서 목표 설정
}

export async function completeOnboarding() {
  // 온보딩 완료 처리
}
```

### Hooks

```typescript
// hooks/use-auth.ts
export function useAuth() {
  return {
    user: User | null;
    isLoading: boolean;
    signIn: (provider: 'kakao' | 'google') => Promise<void>;
    signOut: () => Promise<void>;
  };
}
```

---

## 사용자 스토리 매핑

- US-001: 카카오톡 소셜 로그인
- US-002: 구글 소셜 로그인
- US-003: 독서 목표 설정
- US-004: 온보딩 튜토리얼

---

## 검증 체크리스트

- [ ] 카카오톡 로그인이 정상 작동함
- [ ] 구글 로그인이 정상 작동함
- [ ] OAuth 콜백이 정상 처리됨
- [ ] 미들웨어가 보호된 라우트를 정확히 보호함
- [ ] 온보딩 플로우가 정상 작동함
- [ ] 목표 설정이 데이터베이스에 저장됨
- [ ] 튜토리얼 완료 후 메인으로 이동함
- [ ] 인증 상태가 Context를 통해 전역으로 관리됨

---

## 개발 프롬프트

```
다음 문서들을 참고하여 인증 시스템을 구현해주세요.

참고 문서:
- doc/user_stories.md (US-001, US-002, US-003, US-004)
- doc/software_design.md (7. 보안 설계, 6.4 미들웨어 설계)
- doc/Habitree-Reading-Hub-PRD.md (4.1.1 사용자 인증 및 온보딩)
- doc/review_issues.md (9. 미들웨어 인증 방식 - @supabase/ssr 사용)

작업 내용:
1. 소셜 로그인 구현:
   - 카카오톡 OAuth (Supabase Auth 활용)
   - 구글 OAuth (Supabase Auth 활용)
   - OAuth 콜백 처리
2. 인증 미들웨어 구현 (middleware.ts)
   - 보호된 라우트 확인
   - 인증되지 않은 사용자 리다이렉트
   - 세션 새로고침
3. 인증 Context 및 Hooks 구현
4. 온보딩 플로우:
   - 목표 설정 페이지 (1-100 범위)
   - 튜토리얼 페이지 (3-4개 화면, Swiper 사용)
   - 완료 처리
5. Server Actions 구현

주의사항:
- @supabase/ssr 패키지 사용 (구식 auth-helpers 아님)
- review_issues.md의 9번 이슈 참고
- 미들웨어는 software_design.md 6.4 참고
- 온보딩은 로컬 스토리지에 완료 여부 저장
- 사용자 프로필은 Supabase 트리거로 자동 생성됨 (백엔드)

완료 후:
- 각 함수에 JSDoc 주석 추가
- 에러 처리 로직 추가
```

---

## 참고 문서

### 필수 참고
- [user_stories.md](../../user_stories.md) - US-001~US-004
- [software_design.md](../../software_design.md) - 6.4 미들웨어, 7. 보안 설계
- [review_issues.md](../../review_issues.md) - 9. 미들웨어 인증 방식

### 추가 참고
- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

**문서 끝**

