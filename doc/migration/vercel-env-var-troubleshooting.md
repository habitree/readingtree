# Vercel 환경 변수 문제 해결 가이드

**작성일:** 2026-01-18  
**문제:** 환경 변수 설정 및 재배포 후에도 localhost 리다이렉트 발생  
**목적:** 누락되거나 잘못된 설정을 단계별로 확인

## 즉시 확인해야 할 사항

### 1. Vercel 환경 변수 정확한 값 확인

**Vercel Dashboard:**
1. https://vercel.com → 프로젝트 `readingtree` 선택
2. **Settings** → **Environment Variables**
3. `NEXT_PUBLIC_APP_URL` 변수 클릭하여 값 확인

**확인 사항:**
- ✅ 값: `https://readingtree.vercel.app` (정확히 일치)
- ❌ 잘못된 값: `http://readingtree.vercel.app` (http)
- ❌ 잘못된 값: `https://readingtree.vercel.app/` (끝에 슬래시)
- ❌ 잘못된 값: ` https://readingtree.vercel.app` (앞에 공백)
- ❌ 잘못된 값: `https://readingtree.vercel.app ` (뒤에 공백)
- ❌ 잘못된 값: `"https://readingtree.vercel.app"` (따옴표 포함)
- ❌ 잘못된 값: `http://localhost:3000`

**수정 방법:**
1. 변수 삭제
2. 다시 추가 (값을 직접 입력, 복사-붙여넣기 시 공백 주의)
3. 저장

### 2. 환경 적용 범위 확인

**각 환경 변수의 "Environment" 컬럼 확인:**

- [ ] **Production** 체크됨
- [ ] **Preview** 체크됨 (선택사항이지만 권장)
- [ ] **Development** 체크됨 (선택사항)

**문제:** Production에만 적용되고 Preview에 적용 안 된 경우:
- Preview 배포에서 문제 발생 가능
- 모든 환경에 적용하는 것을 권장

### 3. 재배포 확인

**중요한 단계:**

1. **Deployments** 탭 이동
2. 최신 배포의 **"..."** (점 3개) 메뉴 클릭
3. **"Redeploy"** 선택
4. ⚠️ **"Use existing Build Cache" 체크 해제** (매우 중요!)
5. **"Redeploy"** 클릭
6. 배포 완료 대기

**확인 사항:**
- [ ] "Use existing Build Cache" 체크 해제했는가?
- [ ] 배포 상태가 "Ready" (녹색)인가?
- [ ] 배포 시간이 환경 변수 저장 시간 이후인가?

### 4. Supabase Site URL 확인

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
http://localhost:3000  ← 문제!
http://readingtree.vercel.app  ← http 사용
https://readingtree.vercel.app/  ← 끝에 슬래시
```

**수정 방법:**
1. Site URL을 `https://readingtree.vercel.app`로 변경
2. **Save** 클릭

### 5. Vercel 로그 확인 (가장 확실한 방법)

**Vercel Dashboard:**
1. 프로젝트 → **Deployments**
2. 최신 배포 클릭
3. **Functions** 탭 또는 **Logs** 탭
4. 카카오 로그인 버튼 클릭
5. 로그 확인

**확인할 로그:**

```
[getAppUrl] 환경 변수 확인: {
  NEXT_PUBLIC_APP_URL: "...",
  VERCEL: "...",
  VERCEL_ENV: "...",
  VERCEL_URL: "...",
  ...
}

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

**문제가 있는 경우:**
```json
{
  "NEXT_PUBLIC_APP_URL": undefined,  ← 환경 변수 미설정
  "VERCEL": "1",
  "appUrl": "https://readingtree.vercel.app",  ← 기본값 사용
  "redirectTo": "https://readingtree.vercel.app/callback"
}
```

또는

```json
{
  "NEXT_PUBLIC_APP_URL": "http://localhost:3000",  ← 잘못된 값
  "VERCEL": "1",
  "appUrl": "https://readingtree.vercel.app",  ← localhost 무시하고 기본값 사용
  "redirectTo": "https://readingtree.vercel.app/callback"
}
```

## 단계별 해결 방법

### 방법 1: 환경 변수 재설정 (가장 확실)

1. **Vercel Dashboard → Settings → Environment Variables**
2. `NEXT_PUBLIC_APP_URL` 변수 **삭제**
3. **새로 추가:**
   - Key: `NEXT_PUBLIC_APP_URL`
   - Value: `https://readingtree.vercel.app` (직접 입력, 복사-붙여넣기 주의)
   - Environment: **Production, Preview, Development 모두 체크**
4. **Save** 클릭
5. **재배포** (빌드 캐시 해제)

### 방법 2: 강제 프로덕션 URL 사용 (임시)

`getAppUrl()` 함수를 더 강력하게 수정했습니다:
- 디버깅 로그 추가
- localhost 체크 강화
- https 체크 추가

이제 Vercel 로그에서 정확한 원인을 확인할 수 있습니다.

### 방법 3: Supabase Site URL 확인

Supabase Site URL이 `localhost`로 설정되어 있으면:
- Supabase가 localhost로 리다이렉트할 수 있음
- Site URL을 `https://readingtree.vercel.app`로 변경

## 체크리스트 (우선순위 순)

### 최우선 (반드시 확인)

1. [ ] **Vercel 환경 변수 값 정확히 확인**
   - `NEXT_PUBLIC_APP_URL` = `https://readingtree.vercel.app` (정확히 일치)
   - 공백, 따옴표 없음
   - http가 아닌 https

2. [ ] **Vercel 재배포 시 빌드 캐시 해제 확인**
   - "Use existing Build Cache" 체크 해제
   - 재배포 완료

3. [ ] **Supabase Site URL 확인**
   - Site URL = `https://readingtree.vercel.app`
   - localhost가 아님

### 2순위

4. [ ] **Vercel 로그 확인**
   - Functions 로그에서 `[getAppUrl]` 로그 확인
   - `[signInWithKakao]` 로그 확인
   - 실제 반환값 확인

5. [ ] **환경 적용 범위 확인**
   - Production 환경에 적용됨
   - Preview 환경에도 적용 권장

### 3순위

6. [ ] **브라우저 캐시 클리어**
   - Ctrl + Shift + R
   - 시크릿 모드에서 테스트

7. [ ] **네트워크 요청 확인**
   - 브라우저 개발자 도구 → Network 탭
   - `redirect_to` 파라미터 확인

## 예상 원인 및 해결

### 원인 1: 환경 변수 값에 공백 포함

**증상:**
- 환경 변수가 설정되어 있지만 값이 ` https://readingtree.vercel.app ` (공백 포함)

**해결:**
- 변수 삭제 후 다시 추가 (값 직접 입력)

### 원인 2: 빌드 캐시 사용

**증상:**
- 재배포했지만 환경 변수가 반영되지 않음

**해결:**
- "Use existing Build Cache" 체크 해제 후 재배포

### 원인 3: Supabase Site URL이 localhost

**증상:**
- 코드는 올바르지만 Supabase가 localhost로 리다이렉트

**해결:**
- Supabase Dashboard → Authentication → URL Configuration
- Site URL을 `https://readingtree.vercel.app`로 변경

### 원인 4: 환경 변수가 특정 환경에만 적용

**증상:**
- Production에는 적용되었지만 Preview에는 적용 안 됨

**해결:**
- 모든 환경에 적용 (Production, Preview, Development)

## 다음 단계

위의 체크리스트를 모두 확인한 후에도 문제가 계속되면:

1. **Vercel 로그 스크린샷** 제공
   - `[getAppUrl]` 로그
   - `[signInWithKakao]` 로그

2. **Vercel 환경 변수 스크린샷** 제공
   - Environment Variables 페이지

3. **Supabase Site URL 스크린샷** 제공
   - Authentication → URL Configuration 페이지

이 정보를 바탕으로 더 정확한 진단이 가능합니다.
