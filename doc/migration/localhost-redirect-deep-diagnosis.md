# localhost 리다이렉트 문제 심층 진단 및 해결 가이드

**작성일:** 2026-01-18  
**문제:** Vercel 환경 변수 설정 및 재배포 후에도 `localhost:3000` 리다이렉트 발생  
**목적:** 누락된 설정이나 잘못된 설정을 단계별로 확인

## 문제 증상

- 카카오 로그인 버튼 클릭 후 `ERR_CONNECTION_REFUSED`
- `localhost:3000/?code=...`로 리다이렉트 시도
- Vercel 환경 변수 설정 완료, 재배포 완료했으나 문제 지속

## 단계별 진단 체크리스트

### 1단계: Vercel 환경 변수 확인 (가장 중요!)

#### 1.1 환경 변수 존재 여부 확인

**Vercel Dashboard:**
1. https://vercel.com → 프로젝트 `readingtree` 선택
2. **Settings** → **Environment Variables**
3. 다음 변수들이 **정확히** 존재하는지 확인:

```
✅ NEXT_PUBLIC_APP_URL
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**확인 사항:**
- [ ] 변수 이름이 정확히 일치하는가? (대소문자, 언더스코어)
- [ ] 변수가 삭제되지 않았는가?
- [ ] 변수 값이 비어있지 않은가?

#### 1.2 환경 변수 값 확인

**`NEXT_PUBLIC_APP_URL` 값:**
- ✅ 올바른 값: `https://readingtree.vercel.app`
- ❌ 잘못된 값: `http://readingtree.vercel.app` (http 사용)
- ❌ 잘못된 값: `https://readingtree.vercel.app/` (끝에 슬래시)
- ❌ 잘못된 값: `http://localhost:3000`
- ❌ 잘못된 값: 공백 포함 (`https://readingtree.vercel.app `)

**확인 방법:**
- Vercel Dashboard에서 변수 값을 복사하여 텍스트 에디터에 붙여넣기
- 앞뒤 공백, 따옴표 등이 없는지 확인

#### 1.3 환경 적용 범위 확인

**중요:** 각 환경 변수는 다음 중 하나 이상에 적용되어야 합니다:

- [ ] **Production** 환경에 적용됨
- [ ] **Preview** 환경에 적용됨
- [ ] **Development** 환경에 적용됨

**확인 방법:**
- Vercel Dashboard에서 각 변수의 "Environment" 컬럼 확인
- Production, Preview, Development 중 하나 이상에 체크되어 있어야 함

**권장:** 모든 환경에 적용 (Production, Preview, Development 모두 체크)

#### 1.4 환경 변수 저장 확인

- [ ] 환경 변수 추가/수정 후 **"Save"** 버튼을 클릭했는가?
- [ ] 저장 후 "Environment Variables saved" 메시지가 표시되었는가?

### 2단계: Vercel 재배포 확인

#### 2.1 재배포 실행 확인

**Vercel Dashboard:**
1. **Deployments** 탭 이동
2. 최신 배포 확인
3. 재배포 실행:

**중요한 단계:**
- [ ] 최신 배포의 **"..."** (점 3개) 메뉴 클릭
- [ ] **"Redeploy"** 선택
- [ ] **"Use existing Build Cache" 체크 해제** (매우 중요!)
- [ ] **"Redeploy"** 버튼 클릭
- [ ] 배포 상태가 "Building" → "Ready"로 변경되는지 확인

#### 2.2 배포 완료 확인

- [ ] 배포 상태가 **"Ready"** (녹색)인가?
- [ ] 배포 시간이 환경 변수 저장 시간 이후인가?
- [ ] 배포 로그에 오류가 없는가?

**확인 방법:**
- Deployments 탭에서 최신 배포 클릭
- "Build Logs" 또는 "Function Logs" 확인
- 오류 메시지가 없는지 확인

#### 2.3 빌드 캐시 문제

**문제:** "Use existing Build Cache"를 체크한 경우:
- 환경 변수가 빌드 타임에 주입되지 않을 수 있음
- `NEXT_PUBLIC_*` 변수는 빌드 타임에 주입되므로 캐시를 사용하면 안 됨

**해결:**
- 반드시 **"Use existing Build Cache" 체크 해제** 후 재배포

### 3단계: Supabase 설정 확인

#### 3.1 Supabase Site URL 확인

**Supabase Dashboard:**
1. https://app.supabase.com → 새 프로젝트 `pkdhhtfomhhuiirzurhs` 선택
2. **Authentication** → **URL Configuration**
3. **Site URL** 확인:

**올바른 값:**
```
https://readingtree.vercel.app
```

**잘못된 값:**
```
http://localhost:3000
http://readingtree.vercel.app
https://readingtree.vercel.app/
```

**중요:** Site URL이 `localhost`로 설정되어 있으면 Supabase가 localhost로 리다이렉트할 수 있습니다.

#### 3.2 Supabase Redirect URLs 확인

**Authentication** → **URL Configuration** → **Redirect URLs**:

다음 URL이 등록되어 있어야 합니다:
```
https://readingtree.vercel.app/callback
https://readingtree.vercel.app/**
```

**확인 사항:**
- [ ] `https://readingtree.vercel.app/callback` 등록됨
- [ ] `localhost:3000` 관련 URL이 있으면 제거 권장
- [ ] URL 형식이 정확한가? (https, 슬래시 등)

### 4단계: 코드 레벨 확인

#### 4.1 `getAppUrl()` 함수 동작 확인

현재 `getAppUrl()` 함수는 다음과 같이 동작합니다:

1. `NEXT_PUBLIC_APP_URL` 확인 (localhost 제외)
2. `VERCEL` 환경 감지
3. `VERCEL_URL` 사용
4. 기본값: `https://readingtree.vercel.app`

**문제 가능성:**
- `NEXT_PUBLIC_APP_URL`이 `localhost`를 포함하면 무시됨
- `VERCEL` 환경 변수가 없으면 다음 단계로 진행
- 모든 조건이 실패하면 기본값 사용

#### 4.2 런타임 vs 빌드 타임

**중요:** `NEXT_PUBLIC_*` 변수는 **빌드 타임**에 주입됩니다.

**문제:**
- 환경 변수를 설정한 후 재배포하지 않으면 빌드 타임에 주입되지 않음
- 빌드 캐시를 사용하면 이전 빌드가 사용되어 환경 변수가 반영되지 않음

**해결:**
- 환경 변수 설정 후 반드시 재배포
- 빌드 캐시 해제 후 재배포

### 5단계: Vercel 로그 확인 (가장 확실한 방법)

#### 5.1 Functions 로그 확인

**Vercel Dashboard:**
1. 프로젝트 → **Deployments**
2. 최신 배포 클릭
3. **Functions** 탭 또는 **Logs** 탭
4. 카카오 로그인 버튼 클릭 후 로그 확인

**확인할 로그:**
```
[signInWithKakao] OAuth redirectTo: {
  appUrl: "...",
  redirectTo: "...",
  VERCEL: "...",
  VERCEL_ENV: "...",
  VERCEL_URL: "...",
  NEXT_PUBLIC_APP_URL: "...",
  NODE_ENV: "..."
}
```

**예상 값 (올바른 경우):**
```json
{
  "appUrl": "https://readingtree.vercel.app",
  "redirectTo": "https://readingtree.vercel.app/callback",
  "VERCEL": "1",
  "VERCEL_ENV": "production",
  "VERCEL_URL": "readingtree.vercel.app",
  "NEXT_PUBLIC_APP_URL": "https://readingtree.vercel.app",
  "NODE_ENV": "production"
}
```

**문제가 있는 경우:**
```json
{
  "appUrl": "http://localhost:3000",  ← 문제!
  "redirectTo": "http://localhost:3000/callback",  ← 문제!
  "VERCEL": undefined,  ← Vercel 환경 변수가 없음
  "NEXT_PUBLIC_APP_URL": undefined,  ← 환경 변수가 설정되지 않음
  "NODE_ENV": "production"
}
```

#### 5.2 로그 해석

**케이스 1: `NEXT_PUBLIC_APP_URL`이 `undefined`**
- 원인: 환경 변수가 설정되지 않았거나 재배포가 안 됨
- 해결: 환경 변수 설정 후 빌드 캐시 해제하고 재배포

**케이스 2: `VERCEL`이 `undefined`**
- 원인: Vercel 환경에서 실행되지 않음 (로컬에서 테스트 중일 수 있음)
- 해결: 프로덕션 URL에서 테스트

**케이스 3: `appUrl`이 `localhost:3000`**
- 원인: `getAppUrl()` 함수가 localhost를 반환
- 해결: 위의 로그 값들을 확인하여 원인 파악

### 6단계: 추가 확인 사항

#### 6.1 브라우저 캐시

- [ ] 브라우저 캐시 클리어 (Ctrl + Shift + R)
- [ ] 시크릿 모드에서 테스트
- [ ] 다른 브라우저에서 테스트

#### 6.2 네트워크 요청 확인

**브라우저 개발자 도구 → Network 탭:**
1. 카카오 로그인 버튼 클릭
2. OAuth 요청 찾기 (Supabase 또는 Kakao 도메인)
3. 요청 URL의 `redirect_to` 파라미터 확인

**확인 사항:**
- `redirect_to` 파라미터 값이 무엇인가?
- `https://readingtree.vercel.app/callback`인가?
- `http://localhost:3000/callback`인가?

#### 6.3 Supabase 클라이언트 초기화 확인

`lib/supabase/server.ts`에서 환경 변수를 제대로 읽는지 확인:

- [ ] `process.env.NEXT_PUBLIC_SUPABASE_URL`이 올바른 값인가?
- [ ] `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`가 올바른 값인가?

### 7단계: 강제 해결 방법

위의 모든 단계를 확인했는데도 문제가 계속되면:

#### 7.1 `getAppUrl()` 함수 강화

더 강력한 로직으로 수정:

```typescript
export function getAppUrl(): string {
  // Vercel 환경에서는 무조건 프로덕션 URL 반환
  if (process.env.VERCEL || process.env.VERCEL_URL) {
    // NEXT_PUBLIC_APP_URL이 있고 localhost가 아니면 사용
    if (process.env.NEXT_PUBLIC_APP_URL) {
      const url = process.env.NEXT_PUBLIC_APP_URL.trim();
      if (!url.includes("localhost") && url.startsWith("https://")) {
        return url;
      }
    }
    
    // VERCEL_URL 사용
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    
    // 기본값: 프로덕션 URL
    return "https://readingtree.vercel.app";
  }

  // 로컬 개발 환경만 localhost 사용
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  // 그 외의 모든 경우 프로덕션 URL
  return "https://readingtree.vercel.app";
}
```

#### 7.2 환경 변수 하드코딩 (임시)

**주의:** 이 방법은 임시 해결책입니다. 문제 해결 후 제거해야 합니다.

`app/actions/auth.ts`에서:

```typescript
export async function signInWithKakao() {
  const supabase = await createServerSupabaseClient();

  // 임시: 강제로 프로덕션 URL 사용
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
                 (process.env.VERCEL ? "https://readingtree.vercel.app" : "http://localhost:3000");
  const redirectTo = `${appUrl}/callback`;
  
  // ...
}
```

## 체크리스트 (단계별 확인)

### Vercel 환경 변수
- [ ] `NEXT_PUBLIC_APP_URL` 변수 존재
- [ ] 값이 `https://readingtree.vercel.app` (정확히 일치)
- [ ] 앞뒤 공백 없음
- [ ] 따옴표 없음
- [ ] Production 환경에 적용됨
- [ ] Preview 환경에 적용됨 (선택)
- [ ] Development 환경에 적용됨 (선택)
- [ ] 저장 완료

### Vercel 재배포
- [ ] 재배포 실행됨
- [ ] "Use existing Build Cache" 체크 해제됨
- [ ] 배포 상태가 "Ready"
- [ ] 배포 시간이 환경 변수 저장 시간 이후

### Supabase 설정
- [ ] Site URL이 `https://readingtree.vercel.app`
- [ ] Redirect URLs에 `https://readingtree.vercel.app/callback` 등록됨
- [ ] `localhost:3000` 관련 URL 제거됨

### 코드 확인
- [ ] `getAppUrl()` 함수가 최신 버전
- [ ] `app/actions/auth.ts`에서 `getAppUrl()` 사용
- [ ] 하드코딩된 localhost 없음

### 테스트
- [ ] 브라우저 캐시 클리어
- [ ] 시크릿 모드에서 테스트
- [ ] Vercel 로그 확인
- [ ] Network 탭에서 `redirect_to` 확인

## 문제 해결 우선순위

1. **최우선:** Vercel 환경 변수 값 정확히 확인 (공백, 따옴표 등)
2. **2순위:** Vercel 재배포 시 빌드 캐시 해제 확인
3. **3순위:** Supabase Site URL 확인
4. **4순위:** Vercel 로그에서 실제 값 확인

## 예상 원인 및 해결

### 원인 1: 환경 변수 값에 공백이나 따옴표 포함

**증상:**
- 환경 변수가 설정되어 있지만 값이 올바르지 않음

**확인:**
- Vercel Dashboard에서 변수 값을 복사하여 확인
- 텍스트 에디터에 붙여넣어 공백 확인

**해결:**
- 변수 삭제 후 다시 추가 (공백 없이)
- 따옴표 없이 입력

### 원인 2: 빌드 캐시 사용

**증상:**
- 재배포했지만 환경 변수가 반영되지 않음

**확인:**
- 재배포 시 "Use existing Build Cache" 체크 여부

**해결:**
- 빌드 캐시 해제 후 재배포

### 원인 3: Supabase Site URL이 localhost

**증상:**
- 코드는 올바르지만 Supabase가 localhost로 리다이렉트

**확인:**
- Supabase Dashboard → Authentication → URL Configuration → Site URL

**해결:**
- Site URL을 `https://readingtree.vercel.app`로 변경

### 원인 4: 환경 변수가 특정 환경에만 적용

**증상:**
- Production에는 적용되었지만 Preview에는 적용 안 됨

**확인:**
- Vercel Dashboard에서 각 변수의 "Environment" 컬럼 확인

**해결:**
- 모든 환경에 적용 (Production, Preview, Development)

## 다음 단계

위의 체크리스트를 모두 확인한 후에도 문제가 계속되면:

1. **Vercel 로그 스크린샷** 제공 요청
2. **Vercel 환경 변수 스크린샷** 제공 요청
3. **Supabase Site URL 스크린샷** 제공 요청
4. **브라우저 Network 탭 스크린샷** 제공 요청

이 정보를 바탕으로 더 정확한 진단이 가능합니다.
