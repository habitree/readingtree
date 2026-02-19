---
alwaysApply: false
description: "인증/세션 관리 규칙"
globs:
  - "app/actions/auth.ts"
  - "contexts/auth-context.tsx"
  - "lib/supabase/**"
---

## [인증/세션 관리 규칙]

# 인증/세션 관리 규칙 (Authentication/Session Management Rules)

**프로젝트:** Habitree Reading Hub v4.0.0  
**작성일:** 2025년 12월  
**버전:** 1.0  
**적용 범위:** 전체 프로젝트

**참고:** 상세 문서는 `doc/governance/AUTH_SESSION_RULES.md`를 참조하세요.

---

## 목차

1. [규칙 개요](#1-규칙-개요)
2. [세션 기준](#2-세션-기준)
3. [세션 읽기 규칙](#3-세션-읽기-규칙)
4. [세션 갱신 규칙](#4-세션-갱신-규칙)
5. [로그인/로그아웃 규칙](#5-로그인로그아웃-규칙)
6. [클라이언트 역할](#6-클라이언트-역할)
7. [규칙 위반 시 조치](#7-규칙-위반-시-조치)

---

## 1. 규칙 개요

### 1.1 목적

Next.js + Supabase에서 가장 흔한 장애인 **서버/클라이언트 세션 불일치**를 방지하기 위해, **단일 세션 기준**을 명확히 정의하고 강제합니다.

### 1.2 핵심 원칙

- ✅ **단일 기준**: 서버 중심 (SSR/쿠키 기반)으로 고정
- ✅ **세션 읽기**: 서버에서만 (`app/actions/auth.ts`의 `getCurrentUser()`)
- ✅ **세션 갱신**: 미들웨어에서 자동 처리
- ✅ **클라이언트 역할**: 서버에서 받은 정보만 표시

### 1.3 선택한 방식

**(B) 서버 중심 (SSR/쿠키 기반)** - **고정**

**이유:**
- Next.js App Router의 SSR/SSG 지원
- 보안 강화 (세션 정보가 서버에서 관리)
- 미들웨어를 통한 세션 갱신으로 일관성 보장
- SEO 및 초기 로딩 성능 향상

**⚠️ 경고:**
- 클라이언트 중심과 서버 중심을 혼합하면 안 됩니다
- 어떤 페이지는 로그인으로 보이고, 어떤 페이지는 로그아웃처럼 보이는 상태가 됩니다
- API 호출은 401이 나는 상태가 됩니다

**⚠️ 중요: 한 방식으로 고정하세요. 흔들리면 지옥입니다.**

---

## 2. 세션 기준

### 2.1 세션 소스

**단일 기준: 서버 쿠키 기반 세션**

- 세션 정보는 **쿠키에 저장**됨
- 모든 세션 읽기는 **서버에서만** 수행
- 클라이언트는 서버에서 받은 정보만 사용

### 2.2 세션 흐름

```
1. 사용자 로그인
   ↓
2. OAuth 콜백 (/callback) → 서버에서 세션 생성 (쿠키 저장)
   ↓
3. 미들웨어 → 모든 요청마다 세션 갱신 (쿠키 읽기/쓰기)
   ↓
4. 서버 컴포넌트/Server Actions → getCurrentUser() 호출 (쿠키에서 읽기)
   ↓
5. 클라이언트 → 서버에서 받은 초기 사용자 정보 표시
```

---

## 3. 세션 읽기 규칙

### 3.1 서버에서만 세션 읽기

**허용된 경로:**
- ✅ `app/actions/auth.ts`의 `getCurrentUser()` 함수
- ✅ `lib/supabase/server.ts`의 `createServerSupabaseClient()` (Server Actions 내부에서만)
- ✅ `lib/supabase/middleware.ts` (세션 갱신용)

**금지된 경로:**
- ❌ 클라이언트 컴포넌트에서 `createClient()` → `getUser()` 직접 호출
- ❌ 페이지에서 `createServerSupabaseClient()` + `getUser()` 직접 호출

### 3.2 표준 패턴

**서버 컴포넌트/Server Actions:**

```typescript
// ✅ 올바른 예: getCurrentUser() 사용
import { getCurrentUser } from "@/app/actions/auth";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  // ...
}
```

**클라이언트 컴포넌트:**

```typescript
// ✅ 올바른 예: 서버에서 받은 정보 사용
import { useAuth } from "@/hooks/use-auth";

export function Component() {
  const { user } = useAuth(); // 서버에서 받은 초기 정보
  // ...
}
```

### 3.3 금지된 패턴

```typescript
// ❌ 금지: 클라이언트에서 직접 getUser() 호출
"use client";
import { createClient } from "@/lib/supabase/client";

export function Component() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser(); // 금지!
  // ...
}

// ❌ 금지: 페이지에서 직접 getUser() 호출
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser(); // 금지! getCurrentUser() 사용해야 함
  // ...
}
```

---

## 4. 세션 갱신 규칙

### 4.1 미들웨어에서 자동 갱신

**위치:** `lib/supabase/middleware.ts`

**책임:**
- 모든 요청마다 세션 갱신 (`getSession()`, `getUser()`)
- 세션 만료 시 자동 갱신
- 쿠키 업데이트

**구현:**

```typescript
// lib/supabase/middleware.ts
export async function updateSession(request: NextRequest) {
  const supabase = createServerClient(...);
  
  // 세션 갱신 (명시적 호출)
  await supabase.auth.getSession(); // 세션 읽기로 갱신 트리거
  await supabase.auth.getUser(); // 사용자 정보 갱신
  
  // 쿠키 업데이트는 createServerClient가 자동 처리
}
```

### 4.2 세션 갱신 타이밍

- **자동**: 미들웨어에서 모든 요청마다 처리
- **수동**: 필요 시 `app/actions/auth.ts`에서 `refreshSession()` 호출 가능

---

## 5. 로그인/로그아웃 규칙

### 5.1 로그인

**위치:** `app/actions/auth.ts`

**처리 순서:**
1. `signInWithKakao()` / `signInWithGoogle()` 호출
2. OAuth 리다이렉트
3. `/callback`에서 세션 교환 (`exchangeCodeForSession`)
4. 쿠키에 세션 저장
5. 리다이렉트

**규칙:**
- ✅ 서버 액션으로만 처리
- ✅ 클라이언트에서 직접 `signInWithOAuth()` 호출 금지

### 5.2 로그아웃

**위치:** `app/actions/auth.ts`

**처리 순서:**
1. `signOut()` 호출
2. 서버에서 세션 삭제 (`auth.signOut()`)
3. 쿠키 삭제
4. 리다이렉트

**규칙:**
- ✅ 서버 액션으로만 처리
- ✅ 클라이언트에서 직접 `signOut()` 호출 금지

---

## 6. 클라이언트 역할

### 6.1 AuthContext의 역할

**올바른 패턴:**
```typescript
// ✅ 서버에서 받은 초기 정보 사용
interface AuthProviderProps {
  initialUser: User | null; // 서버에서 받은 초기 사용자 정보
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  
  // onAuthStateChange는 서버 세션과 동기화 확인용으로만 사용
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    return () => subscription.unsubscribe();
  }, []);
}
```

### 6.2 클라이언트에서 허용되는 것

- ✅ 서버에서 받은 초기 사용자 정보 표시
- ✅ `onAuthStateChange`로 실시간 업데이트 감지 (서버 세션과 동기화 확인용)
- ✅ 서버 액션 호출 (`signInWithKakao`, `signOut` 등)

### 6.3 클라이언트에서 금지되는 것

- ❌ `supabase.auth.getUser()` 직접 호출
- ❌ `supabase.auth.getSession()` 직접 호출
- ❌ 클라이언트에서 세션 생성/수정

---

## 7. 규칙 위반 시 조치

### 7.1 발견 시 즉시 수정

규칙 위반 코드를 발견하면:

1. **클라이언트에서 `getUser()` 직접 호출**
   → `getCurrentUser()` 서버 액션 호출로 변경하거나, 서버에서 받은 정보 사용

2. **페이지에서 `getUser()` 직접 호출**
   → `getCurrentUser()` 서버 액션 호출로 변경

3. **혼합 방식 사용**
   → 서버 중심으로 통일

### 7.2 점진적 마이그레이션

기존 코드는 유지하되, 새로운 코드부터 엄격히 적용합니다.

---

## 8. 체크리스트

새로운 기능 개발 시:

- [ ] 클라이언트에서 `getUser()` 직접 호출하지 않음
- [ ] 페이지에서 `getUser()` 직접 호출하지 않음
- [ ] 모든 사용자 정보는 `getCurrentUser()` 서버 액션 사용
- [ ] 로그인/로그아웃은 서버 액션으로만 처리
- [ ] 세션 갱신은 미들웨어에서 자동 처리됨을 신뢰

---

## 9. 참고 사항

### 9.1 Supabase SSR 패키지

이 프로젝트는 `@supabase/ssr` 패키지를 사용합니다:
- `createBrowserClient`: 클라이언트용 (인증 상태 감지용)
- `createServerClient`: 서버용 (쿠키 기반 세션)

### 9.2 세션 불일치 증상

규칙을 위반하면 다음 증상이 발생할 수 있습니다:
- 어떤 페이지는 로그인으로 보이고, 어떤 페이지는 로그아웃처럼 보임
- API 호출이 401 에러 발생
- 새로고침 시 로그인 상태가 사라짐

### 9.3 디버깅

세션 불일치 문제 발생 시:
1. 미들웨어에서 세션 갱신이 정상 동작하는지 확인
2. 쿠키가 정상적으로 설정/전송되는지 확인
3. 서버와 클라이언트에서 읽는 세션이 동일한지 확인

---

**이 규칙은 프로젝트의 인증/세션 관리 규칙 단일 기준입니다. 모든 개발자는 이 규칙을 준수해야 합니다.**

**⚠️ 중요: 한 방식으로 고정하세요. 흔들리면 지옥입니다.**

**상세 문서:** `doc/governance/AUTH_SESSION_RULES.md` 참조
