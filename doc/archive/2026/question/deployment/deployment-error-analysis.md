# 배포 오류 분석 및 해결 가이드

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0

---

## 🔍 발견된 잠재적 문제점123

### 1. VERCEL_URL 환경 변수 접근 문제 ⚠️

**문제:**
- `lib/utils/url.ts`의 `getAppUrl()` 함수에서 `VERCEL_URL`을 사용하고 있음
- `VERCEL_URL`은 Vercel에서 자동으로 제공하지만, 빌드 타임과 런타임에서 다를 수 있음
- `generateMetadata`는 빌드 타임에 실행될 수 있어 `VERCEL_URL`이 없을 수 있음

**영향:**
- `app/share/notes/[id]/page.tsx`의 `generateMetadata`에서 `getAppUrl()` 사용
- 빌드 타임에 메타데이터 생성 시 URL이 잘못될 수 있음

**해결 방법:**
- `NEXT_PUBLIC_VERCEL_URL` 사용 (빌드 타임에 주입됨)
- 또는 런타임에 `headers()`를 사용하여 동적으로 URL 가져오기

---

### 2. 환경 변수 누락 가능성

**문제:**
- GitHub Actions 워크플로우에서 빌드 시 일부 환경 변수가 누락될 수 있음
- `VERCEL_URL`은 Vercel 배포 시에만 제공되므로, GitHub Actions 빌드 단계에서는 없을 수 있음

**확인 필요:**
- `.github/workflows/deploy-production.yml`의 빌드 단계
- `.github/workflows/deploy-preview.yml`의 빌드 단계

---

### 3. Server Actions에서의 URL 사용

**현재 상태:**
- `app/actions/auth.ts`에서 `getAppUrl()` 사용
- Server Actions는 런타임에 실행되므로 `VERCEL_URL` 접근 가능
- 하지만 빌드 타임에 정적으로 분석될 수 있음

---

## 🛠️ 수정 방안

### 방안 1: NEXT_PUBLIC_VERCEL_URL 사용 (권장)

Vercel은 빌드 타임에 `NEXT_PUBLIC_VERCEL_URL`을 자동으로 주입합니다.

```typescript
// lib/utils/url.ts
export function getAppUrl(): string {
  // Vercel에서 빌드 타임에 주입하는 환경 변수 우선 사용
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  // 런타임 VERCEL_URL (서버 사이드에서만 사용 가능)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 수동 설정된 URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // 기본값
  return process.env.NODE_ENV === "production"
    ? "https://readingtree.vercel.app"
    : "http://localhost:3000";
}
```

### 방안 2: 런타임에 동적으로 URL 가져오기 (Server Components용)

```typescript
// lib/utils/url.ts
import { headers } from "next/headers";

export async function getAppUrl(): Promise<string> {
  // Server Component에서 사용할 때
  if (typeof window === "undefined") {
    const headersList = await headers();
    const host = headersList.get("host");
    const protocol = headersList.get("x-forwarded-proto") || "https";
    
    if (host) {
      return `${protocol}://${host}`;
    }
  }

  // 기존 로직
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  
  // ... 나머지 로직
}
```

**주의:** 이 방법은 `generateMetadata`에서 사용할 수 없습니다 (비동기 함수이므로).

### 방안 3: generateMetadata에서만 별도 처리

```typescript
// app/share/notes/[id]/page.tsx
export async function generateMetadata({ params }: { params: { id: string } }) {
  // ... 기존 코드 ...
  
  // generateMetadata는 빌드 타임에 실행되므로 NEXT_PUBLIC_ 접두사 변수만 사용
  const baseUrl = 
    process.env.NEXT_PUBLIC_VERCEL_URL 
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || "https://readingtree.vercel.app";
  
  // ... 나머지 코드 ...
}
```

---

## 📋 체크리스트

배포 전 확인사항:

### 환경 변수 확인
- [ ] Vercel Dashboard에서 모든 환경 변수 설정 확인
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 설정 확인
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정 확인
- [ ] `NEXT_PUBLIC_APP_URL` 설정 확인 (선택사항)

### 빌드 확인
- [ ] 로컬에서 `npm run build` 성공 확인
- [ ] GitHub Actions 빌드 로그 확인
- [ ] Vercel 빌드 로그 확인

### 런타임 확인
- [ ] 배포된 사이트 접속 확인
- [ ] OAuth 로그인 테스트
- [ ] 공유 페이지 메타 태그 확인
- [ ] 브라우저 콘솔 오류 확인

---

## 🐛 일반적인 배포 오류

### 오류 1: "Missing Supabase environment variables"

**원인:**
- Vercel 환경 변수가 설정되지 않음

**해결:**
1. Vercel Dashboard → Settings → Environment Variables
2. `NEXT_PUBLIC_SUPABASE_URL` 추가
3. `NEXT_PUBLIC_SUPABASE_ANON_KEY` 추가
4. 재배포

### 오류 2: "Invalid redirect URL"

**원인:**
- OAuth 리다이렉트 URL이 잘못됨
- `getAppUrl()`이 잘못된 URL 반환

**해결:**
1. `lib/utils/url.ts` 확인
2. Vercel 환경 변수 확인
3. Supabase Dashboard에서 리다이렉트 URL 설정 확인

### 오류 3: "Failed to fetch"

**원인:**
- API Route 오류
- CORS 문제
- 환경 변수 누락

**해결:**
1. 브라우저 개발자 도구 → Network 탭 확인
2. 오류 응답 확인
3. 서버 로그 확인 (Vercel Dashboard → Functions)

---

## 🔧 즉시 적용 가능한 수정

가장 안전한 방법은 `NEXT_PUBLIC_VERCEL_URL`을 우선 사용하는 것입니다:

```typescript
// lib/utils/url.ts 수정
export function getAppUrl(): string {
  // 1. 빌드 타임에 주입되는 Vercel URL (가장 안정적)
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  // 2. 런타임 Vercel URL (서버 사이드)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3. 수동 설정
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // 4. 기본값
  return process.env.NODE_ENV === "production"
    ? "https://readingtree.vercel.app"
    : "http://localhost:3000";
}
```

---

## 📚 참고 자료

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel System Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables/system-environment-variables)

---

**문서 끝**

