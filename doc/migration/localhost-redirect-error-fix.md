# localhost 리다이렉트 오류 해결 가이드

**작성일:** 2026-01-18  
**문제:** OAuth 로그인 후 `ERR_CONNECTION_REFUSED` - localhost 연결 실패  
**원인:** `getAppUrl()` 함수가 Vercel 환경에서도 `localhost:3000` 반환  
**해결:** Vercel 환경 변수 확인 및 `getAppUrl()` 함수 개선

## 문제 원인

### 발견된 증상

1. **브라우저 오류:**
   - `ERR_CONNECTION_REFUSED`
   - "localhost에서 연결을 거부했습니다"
   - OAuth 인증 후 앱으로 리다이렉트 시도 시 발생

2. **Chrome Issues 탭:**
   - `pkdhhtfomhhuiirzurhs.supabase.co`가 "potentially tracking website"로 표시
   - OAuth 리다이렉트 체인에서 중간 사이트로 감지됨

### 근본 원인

`getAppUrl()` 함수가 Vercel 환경에서도 `localhost:3000`을 반환하는 경우:

1. **Vercel 환경 변수 미설정:**
   - `NEXT_PUBLIC_APP_URL`이 설정되지 않음
   - `VERCEL_URL`이 Preview URL이거나 설정되지 않음
   - `VERCEL_ENV`가 `production`이 아님

2. **함수 로직 문제:**
   - Vercel 환경 감지가 제대로 작동하지 않음
   - 환경 변수 우선순위가 잘못됨

## 해결 방법

### 1단계: Vercel 환경 변수 확인 (최우선)

**Vercel Dashboard:**
1. https://vercel.com → 프로젝트 `readingtree` 선택
2. **Settings** → **Environment Variables**
3. 다음 환경 변수 확인/설정:

```
NEXT_PUBLIC_APP_URL=https://readingtree.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://pkdhhtfomhhuiirzurhs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**중요:**
- 모든 환경 변수를 **모든 환경에 적용** (Production, Preview, Development)
- **저장** 클릭

### 2단계: Vercel 재배포 (필수!)

환경 변수 설정 후 **반드시 재배포**해야 합니다:

1. **Deployments** 탭 이동
2. 최신 배포의 **"..."** 메뉴 클릭
3. **"Redeploy"** 선택
4. **"Use existing Build Cache" 체크 해제** (중요!)
5. **"Redeploy"** 클릭
6. 배포 완료 대기 (약 2-3분)

### 3단계: `getAppUrl()` 함수 개선

현재 함수는 이미 개선되어 있지만, 추가 안전장치를 추가할 수 있습니다:

**현재 로직:**
1. `NEXT_PUBLIC_APP_URL` (최우선)
2. `VERCEL` 환경 감지
3. `VERCEL_ENV === "production"` 체크
4. `VERCEL_URL` 사용
5. 기본값: `https://readingtree.vercel.app`

**추가 개선 사항:**
- Vercel 환경에서는 절대 `localhost`를 반환하지 않도록 보장
- 환경 변수가 없어도 프로덕션 URL 반환

## 확인 방법

### 1. Vercel 환경 변수 확인

Vercel Dashboard에서:
- [ ] `NEXT_PUBLIC_APP_URL` 설정됨
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 설정됨
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정됨
- [ ] 모든 환경에 적용됨

### 2. 재배포 확인

- [ ] 재배포 완료됨
- [ ] 배포 상태가 "Ready"
- [ ] "Use existing Build Cache" 체크 해제 후 재배포

### 3. 브라우저 테스트

1. 프로덕션 URL 접속: `https://readingtree.vercel.app/login`
2. 브라우저 개발자 도구 (F12) → Console 탭
3. 카카오 로그인 버튼 클릭
4. 확인 사항:
   - ✅ `localhost`로 리다이렉트되지 않음
   - ✅ `https://readingtree.vercel.app/callback`로 리다이렉트됨
   - ✅ OAuth 인증 완료 후 정상 리다이렉트

### 4. 네트워크 요청 확인

브라우저 개발자 도구 → Network 탭:
- OAuth 요청의 `redirect_to` 파라미터 확인
- ✅ 올바른 값: `https://readingtree.vercel.app/callback`
- ❌ 잘못된 값: `http://localhost:3000/callback`

## 디버깅

### 로그 확인

`app/actions/auth.ts`에 디버깅 로그가 있습니다:

```typescript
console.log("[signInWithKakao] OAuth redirectTo:", {
  appUrl,
  redirectTo,
  VERCEL: process.env.VERCEL,
  VERCEL_ENV: process.env.VERCEL_ENV,
  VERCEL_URL: process.env.VERCEL_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NODE_ENV: process.env.NODE_ENV,
});
```

Vercel 로그에서 이 정보를 확인할 수 있습니다:
1. Vercel Dashboard → 프로젝트 → **Deployments**
2. 최신 배포 클릭 → **Functions** 탭
3. 로그 확인

### 예상 로그 값

**올바른 경우:**
```
appUrl: "https://readingtree.vercel.app"
redirectTo: "https://readingtree.vercel.app/callback"
VERCEL: "1"
VERCEL_ENV: "production" (또는 "preview")
VERCEL_URL: "readingtree.vercel.app" (또는 Preview URL)
NEXT_PUBLIC_APP_URL: "https://readingtree.vercel.app"
```

**문제가 있는 경우:**
```
appUrl: "http://localhost:3000"  ← 문제!
redirectTo: "http://localhost:3000/callback"  ← 문제!
VERCEL: undefined  ← Vercel 환경 변수가 없음
NEXT_PUBLIC_APP_URL: undefined  ← 환경 변수가 설정되지 않음
```

## 문제가 계속되면

### 1. 환경 변수 재확인

Vercel Dashboard에서:
- 환경 변수가 정확히 입력되었는지 확인 (공백, 따옴표 등)
- 모든 환경에 적용되었는지 확인
- 재배포가 완료되었는지 확인

### 2. 브라우저 캐시 클리어

- Ctrl + Shift + R (강력 새로고침)
- 시크릿 모드에서 테스트

### 3. Vercel 로그 확인

- Functions 로그에서 `getAppUrl()` 반환값 확인
- 환경 변수가 제대로 읽히는지 확인

### 4. 임시 해결책

환경 변수가 제대로 작동하지 않는 경우, `getAppUrl()` 함수를 더 강력하게 수정:

```typescript
export function getAppUrl(): string {
  // Vercel 환경에서는 절대 localhost 반환하지 않음
  if (process.env.VERCEL) {
    // NEXT_PUBLIC_APP_URL이 있으면 우선 사용
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }
    // VERCEL_URL이 있으면 사용
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    // 기본값: 프로덕션 URL
    return "https://readingtree.vercel.app";
  }

  // 로컬 개발 환경에서만 localhost 사용
  if (process.env.NODE_ENV === "development" && !process.env.VERCEL) {
    return "http://localhost:3000";
  }

  // 그 외의 모든 경우 프로덕션 URL
  return "https://readingtree.vercel.app";
}
```

## 체크리스트

- [ ] Vercel에 `NEXT_PUBLIC_APP_URL` 설정
- [ ] Vercel에 `NEXT_PUBLIC_SUPABASE_URL` 설정
- [ ] Vercel에 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정
- [ ] 모든 환경 변수를 모든 환경에 적용
- [ ] Vercel 재배포 완료 (Build Cache 해제)
- [ ] 브라우저에서 `localhost` 리다이렉트 없음 확인
- [ ] OAuth 로그인 정상 작동 확인

## 참고

- Chrome의 "bounce tracking" 경고는 OAuth 흐름에서 정상입니다
- Supabase는 OAuth 리다이렉트의 중간 사이트 역할을 하므로 이 경고가 나타날 수 있습니다
- 이 경고는 로그인 기능에 영향을 주지 않습니다
