# Identity Module (인증/권한)

> **Module Key**: `identity`
> **Layer**: A. 도메인 모듈
> **Last Updated**: 2025-01-25

---

## 1. 개요

사용자 인증, 회원가입, 온보딩, 권한 관리를 담당하는 핵심 도메인 모듈입니다.

### 1.1 주요 기능

- 소셜 로그인 (카카오, 구글, 네이버)
- 이메일 인증
- 사용자 온보딩 프로세스
- 세션 관리
- 권한 검증

---

## 2. 파일 구조

```
app/
├── (auth)/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── verify-email/page.tsx
│   └── onboarding/page.tsx
├── actions/
│   ├── auth.ts
│   └── onboarding.ts
└── callback/route.ts

components/
├── auth/
│   ├── signup-form.tsx
│   └── social-login-buttons.tsx
└── onboarding/
    ├── onboarding-wizard.tsx
    └── steps/

hooks/
└── use-auth.ts

contexts/
└── auth-context.tsx

lib/
└── supabase/
    ├── client.ts
    ├── server.ts
    └── middleware.ts

types/
└── user.ts
```

---

## 3. 데이터 모델

### 3.1 테이블

| 테이블 | 설명 |
|--------|------|
| `users` | 사용자 기본 정보, 프로필, 설정 |

### 3.2 주요 필드

```typescript
interface User {
  id: string
  email: string
  name: string | null
  profile_image: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}
```

---

## 4. 핵심 함수

### 4.1 Server Actions

| 함수 | 파일 | 설명 |
|------|------|------|
| `getCurrentUser()` | `app/actions/auth.ts` | 현재 로그인 사용자 조회 |
| `signIn()` | `app/actions/auth.ts` | 로그인 처리 |
| `signOut()` | `app/actions/auth.ts` | 로그아웃 처리 |
| `signUp()` | `app/actions/auth.ts` | 회원가입 처리 |
| `completeOnboarding()` | `app/actions/onboarding.ts` | 온보딩 완료 |

### 4.2 Hooks

| Hook | 설명 |
|------|------|
| `useAuth()` | 인증 상태 관리 |

---

## 5. 의존성

### 5.1 이 모듈이 사용하는 것

- `shared`: UI 컴포넌트, 유틸리티

### 5.2 이 모듈을 사용하는 것

- `library`: 사용자 확인
- `records`: 사용자 확인
- `groups`: 사용자 확인
- `profile`: 사용자 정보 표시
- `admin`: 사용자 관리
- `home`: 로그인 상태 표시

---

## 6. 보안 고려사항

### 6.1 인증 규칙

```typescript
// ✅ 올바른 사용
const user = await getCurrentUser()
if (!user) {
  redirect('/login')
}

// ❌ 금지: 직접 getUser 호출
const { data: { user } } = await supabase.auth.getUser() // 사용 금지!
```

### 6.2 RLS 정책

- 사용자는 자신의 데이터만 접근 가능
- `auth.uid() = user_id` 패턴 적용

---

## 7. 참고 문서

- [AUTH_SESSION_RULES.md](../../governance/AUTH_SESSION_RULES.md)
- [RULES.md](../../claude/RULES.md)
