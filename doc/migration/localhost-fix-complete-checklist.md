# localhost 리다이렉트 문제 완전 해결 체크리스트

**작성일:** 2026-01-18  
**목적:** Vercel 환경 변수 설정 및 재배포 후에도 문제가 지속되는 경우, 모든 가능한 원인을 단계별로 확인

## 🔴 최우선 확인 사항 (반드시 확인!)

### 1. Vercel 환경 변수 값 정확히 확인

**Vercel Dashboard:**
1. https://vercel.com → 프로젝트 `readingtree` 선택
2. **Settings** → **Environment Variables**
3. `NEXT_PUBLIC_APP_URL` 변수 클릭

**✅ 올바른 값:**
```
https://readingtree.vercel.app
```

**❌ 잘못된 값들:**
- `http://readingtree.vercel.app` (http 사용)
- `https://readingtree.vercel.app/` (끝에 슬래시)
- ` https://readingtree.vercel.app` (앞에 공백)
- `https://readingtree.vercel.app ` (뒤에 공백)
- `"https://readingtree.vercel.app"` (따옴표 포함)
- `http://localhost:3000`
- `https://readingtree-i2zd5zgdx-cdhrichs-projects.vercel.app` (Preview URL)

**확인 방법:**
1. 변수 값을 **복사**
2. 텍스트 에디터에 **붙여넣기**
3. 앞뒤 공백, 따옴표 확인
4. http vs https 확인

**수정 방법:**
1. 변수 **삭제**
2. **새로 추가** (값을 직접 입력)
3. **저장**

### 2. 환경 적용 범위 확인

**각 환경 변수의 "Environment" 컬럼 확인:**

- [ ] **Production** 체크됨 (필수!)
- [ ] **Preview** 체크됨 (권장)
- [ ] **Development** 체크됨 (선택)

**문제:** Production에만 적용되고 Preview에 적용 안 된 경우:
- Preview 배포에서 문제 발생
- **해결:** 모든 환경에 적용

### 3. 재배포 시 빌드 캐시 해제 확인

**중요:** `NEXT_PUBLIC_*` 변수는 **빌드 타임**에 주입됩니다!

**재배포 단계:**
1. **Deployments** 탭 이동
2. 최신 배포의 **"..."** 메뉴 클릭
3. **"Redeploy"** 선택
4. ⚠️ **"Use existing Build Cache" 체크 해제** (매우 중요!)
5. **"Redeploy"** 클릭
6. 배포 완료 대기 (약 2-3분)

**확인 사항:**
- [ ] "Use existing Build Cache" 체크 해제했는가?
- [ ] 배포 상태가 "Ready" (녹색)인가?
- [ ] 배포 시간이 환경 변수 저장 시간 이후인가?

### 4. Supabase Site URL 확인 (매우 중요!)

**Supabase Dashboard:**
1. https://app.supabase.com → 새 프로젝트 `pkdhhtfomhhuiirzurhs` 선택
2. **Authentication** → **URL Configuration**
3. **Site URL** 확인:

**✅ 올바른 값:**
```
https://readingtree.vercel.app
```

**❌ 잘못된 값:**
```
http://localhost:3000  ← 문제!
http://readingtree.vercel.app  ← http 사용
https://readingtree.vercel.app/  ← 끝에 슬래시
```

**중요:** Site URL이 `localhost`로 설정되어 있으면:
- Supabase가 OAuth 인증 후 localhost로 리다이렉트할 수 있습니다
- 코드가 올바르더라도 Supabase 설정이 우선할 수 있습니다

**수정 방법:**
1. Site URL을 `https://readingtree.vercel.app`로 변경
2. **Save** 클릭

## 🟡 2순위 확인 사항

### 5. Vercel 로그 확인 (가장 확실한 방법)

**Vercel Dashboard:**
1. 프로젝트 → **Deployments**
2. 최신 배포 클릭
3. **Functions** 탭 또는 **Logs** 탭
4. 카카오 로그인 버튼 클릭
5. 로그 확인

**확인할 로그:**

**로그 1: `[getAppUrl]`**
```
[getAppUrl] 환경 변수 확인: {
  NEXT_PUBLIC_APP_URL: "...",
  VERCEL: "...",
  VERCEL_ENV: "...",
  VERCEL_URL: "...",
  NEXT_PUBLIC_VERCEL_URL: "...",
  NODE_ENV: "..."
}
```

**로그 2: `[signInWithKakao]`**
```
[signInWithKakao] OAuth redirectTo: {
  appUrl: "...",
  redirectTo: "...",
  ...
}
```

**예상 값 (올바른 경우):**
```json
{
  "NEXT_PUBLIC_APP_URL": "https://readingtree.vercel.app",
  "VERCEL": "1",
  "VERCEL_ENV": "production",
  "VERCEL_URL": "readingtree.vercel.app",
  "appUrl": "https://readingtree.vercel.app",
  "redirectTo": "https://readingtree.vercel.app/callback"
}
```

**문제가 있는 경우들:**

**케이스 A: 환경 변수 미설정**
```json
{
  "NEXT_PUBLIC_APP_URL": undefined,
  "VERCEL": "1",
  "appUrl": "https://readingtree.vercel.app",  // 기본값 사용
  "redirectTo": "https://readingtree.vercel.app/callback"
}
```
→ 환경 변수 설정 후 재배포 필요

**케이스 B: 환경 변수 값이 localhost**
```json
{
  "NEXT_PUBLIC_APP_URL": "http://localhost:3000",
  "VERCEL": "1",
  "appUrl": "https://readingtree.vercel.app",  // localhost 무시하고 기본값 사용
  "redirectTo": "https://readingtree.vercel.app/callback"
}
```
→ 환경 변수 값 수정 필요

**케이스 C: VERCEL 환경 변수가 없음**
```json
{
  "NEXT_PUBLIC_APP_URL": "https://readingtree.vercel.app",
  "VERCEL": undefined,  // 문제!
  "appUrl": "http://localhost:3000",  // 문제!
  "redirectTo": "http://localhost:3000/callback"  // 문제!
}
```
→ Vercel 환경에서 실행되지 않음 (로컬에서 테스트 중일 수 있음)

### 6. 브라우저 Network 탭 확인

**브라우저 개발자 도구:**
1. F12 → **Network** 탭
2. 카카오 로그인 버튼 클릭
3. OAuth 요청 찾기 (Supabase 또는 Kakao 도메인)
4. 요청 URL의 `redirect_to` 파라미터 확인

**확인 사항:**
- `redirect_to` 파라미터 값이 무엇인가?
- ✅ 올바른 값: `https://readingtree.vercel.app/callback`
- ❌ 잘못된 값: `http://localhost:3000/callback`

## 🟢 3순위 확인 사항

### 7. 브라우저 캐시

- [ ] 브라우저 캐시 클리어 (Ctrl + Shift + R)
- [ ] 시크릿 모드에서 테스트
- [ ] 다른 브라우저에서 테스트

### 8. Supabase Redirect URLs 확인

**Supabase Dashboard:**
- **Authentication** → **URL Configuration** → **Redirect URLs**

다음 URL이 등록되어 있어야 합니다:
```
https://readingtree.vercel.app/callback
https://readingtree.vercel.app/**
```

**확인 사항:**
- [ ] `https://readingtree.vercel.app/callback` 등록됨
- [ ] `localhost:3000` 관련 URL이 있으면 제거 권장

## 문제 해결 우선순위

### 1순위: Supabase Site URL 확인

**가장 가능성 높은 원인:**
- Supabase Site URL이 `localhost:3000`으로 설정되어 있음
- 이 경우 코드가 올바르더라도 Supabase가 localhost로 리다이렉트

**해결:**
1. Supabase Dashboard → Authentication → URL Configuration
2. Site URL을 `https://readingtree.vercel.app`로 변경
3. Save

### 2순위: Vercel 환경 변수 값 확인

**가능한 원인:**
- 환경 변수 값에 공백, 따옴표, http 등이 포함됨

**해결:**
1. 변수 삭제
2. 값 직접 입력: `https://readingtree.vercel.app`
3. 저장
4. 재배포 (빌드 캐시 해제)

### 3순위: 빌드 캐시 문제

**가능한 원인:**
- 재배포 시 빌드 캐시를 사용하여 환경 변수가 반영되지 않음

**해결:**
- "Use existing Build Cache" 체크 해제 후 재배포

## 완전한 해결 절차

### Step 1: Supabase Site URL 확인 및 수정

1. Supabase Dashboard 접속
2. 새 프로젝트 선택
3. Authentication → URL Configuration
4. Site URL 확인
5. `localhost`이면 `https://readingtree.vercel.app`로 변경
6. Save

### Step 2: Vercel 환경 변수 재설정

1. Vercel Dashboard → Settings → Environment Variables
2. `NEXT_PUBLIC_APP_URL` 변수 삭제
3. 새로 추가:
   - Key: `NEXT_PUBLIC_APP_URL`
   - Value: `https://readingtree.vercel.app` (직접 입력)
   - Environment: Production, Preview, Development 모두 체크
4. Save

### Step 3: Vercel 재배포

1. Deployments 탭
2. 최신 배포 → "..." → "Redeploy"
3. **"Use existing Build Cache" 체크 해제**
4. "Redeploy" 클릭
5. 배포 완료 대기

### Step 4: Vercel 로그 확인

1. 배포 완료 후 Functions 로그 확인
2. 카카오 로그인 버튼 클릭
3. `[getAppUrl]` 로그 확인
4. `[signInWithKakao]` 로그 확인
5. 실제 반환값 확인

### Step 5: 테스트

1. 프로덕션 URL 접속: `https://readingtree.vercel.app/login`
2. 브라우저 개발자 도구 → Network 탭
3. 카카오 로그인 버튼 클릭
4. `redirect_to` 파라미터 확인
5. 정상 작동 확인

## 예상 원인별 해결 방법

### 원인 1: Supabase Site URL이 localhost

**증상:**
- 코드는 올바르지만 Supabase가 localhost로 리다이렉트

**확인:**
- Supabase Dashboard → Authentication → URL Configuration → Site URL

**해결:**
- Site URL을 `https://readingtree.vercel.app`로 변경

### 원인 2: 환경 변수 값에 공백 포함

**증상:**
- 환경 변수가 설정되어 있지만 값이 올바르지 않음

**확인:**
- Vercel Dashboard에서 변수 값 복사하여 확인

**해결:**
- 변수 삭제 후 다시 추가 (값 직접 입력)

### 원인 3: 빌드 캐시 사용

**증상:**
- 재배포했지만 환경 변수가 반영되지 않음

**확인:**
- 재배포 시 "Use existing Build Cache" 체크 여부

**해결:**
- 빌드 캐시 해제 후 재배포

### 원인 4: 환경 변수가 특정 환경에만 적용

**증상:**
- Production에는 적용되었지만 Preview에는 적용 안 됨

**확인:**
- Vercel Dashboard에서 각 변수의 "Environment" 컬럼 확인

**해결:**
- 모든 환경에 적용 (Production, Preview, Development)

## 최종 체크리스트

### Supabase 설정
- [ ] Site URL = `https://readingtree.vercel.app`
- [ ] Site URL에 localhost 없음
- [ ] Redirect URLs에 `https://readingtree.vercel.app/callback` 등록됨

### Vercel 환경 변수
- [ ] `NEXT_PUBLIC_APP_URL` 변수 존재
- [ ] 값 = `https://readingtree.vercel.app` (정확히 일치)
- [ ] 앞뒤 공백 없음
- [ ] 따옴표 없음
- [ ] http가 아닌 https
- [ ] Production 환경에 적용됨
- [ ] Preview 환경에 적용됨 (권장)
- [ ] 저장 완료

### Vercel 재배포
- [ ] 재배포 실행됨
- [ ] "Use existing Build Cache" 체크 해제됨
- [ ] 배포 상태가 "Ready"
- [ ] 배포 시간이 환경 변수 저장 시간 이후

### 테스트
- [ ] 브라우저 캐시 클리어
- [ ] 시크릿 모드에서 테스트
- [ ] Vercel 로그 확인
- [ ] Network 탭에서 `redirect_to` 확인
- [ ] 카카오 로그인 정상 작동

## 다음 단계

위의 모든 체크리스트를 확인한 후에도 문제가 계속되면:

1. **Vercel 로그 스크린샷** 제공 요청
   - `[getAppUrl]` 로그
   - `[signInWithKakao]` 로그

2. **Vercel 환경 변수 스크린샷** 제공 요청
   - Environment Variables 페이지

3. **Supabase Site URL 스크린샷** 제공 요청
   - Authentication → URL Configuration 페이지

이 정보를 바탕으로 더 정확한 진단이 가능합니다.
