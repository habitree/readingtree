# OAuth Redirect URI 불일치 오류 해결 가이드

**작성일:** 2026-01-18  
**문제:** `redirect_uri_mismatch` 오류 (400 오류)  
**원인:** 새 Supabase 프로젝트의 Redirect URI가 등록되지 않음 + `getAppUrl()` 함수가 localhost 반환

## 문제 원인

새 Supabase 프로젝트 (`https://pkdhhtfomhhuiirzurhs.supabase.co`)로 마이그레이션하면서:
1. **새 Supabase Redirect URI**가 카카오/구글 개발자 센터에 등록되지 않음
2. **Supabase Dashboard에서 OAuth Provider 설정**이 새 프로젝트에 적용되지 않음
3. **`getAppUrl()` 함수가 프로덕션에서 `localhost:3000`을 반환** (주요 원인)

## 발견된 문제

브라우저에서 확인한 결과:
- 카카오 로그인 버튼 클릭 시 URL에 `redirect_to=http://localhost:3000/callback` 포함
- 이는 `getAppUrl()` 함수가 프로덕션 환경에서 `localhost:3000`을 반환하고 있음을 의미
- Vercel 환경 변수가 제대로 감지되지 않거나, 함수 로직에 문제가 있음

## 해결 방법

### 1단계: Vercel 환경 변수 설정 (필수)

**Vercel Dashboard:**
1. https://vercel.com → 프로젝트 `readingtree` 선택
2. **Settings** → **Environment Variables**
3. 다음 환경 변수 추가/수정:
   ```
   NEXT_PUBLIC_APP_URL=https://readingtree.vercel.app
   ```
4. **모든 환경에 적용** (Production, Preview, Development)
5. **저장**

### 2단계: 코드 수정 완료

`lib/utils/url.ts`의 `getAppUrl()` 함수를 수정했습니다:
- Vercel 환경에서 실제 배포된 URL을 우선 사용
- Preview URL도 실제 URL 사용 (OAuth 리다이렉트를 위해)
- 기본값을 `https://readingtree.vercel.app`로 변경

### 3단계: Vercel 재배포 (필수)

환경 변수 설정 및 코드 수정 후:
1. **Deployments 탭** → 최신 배포의 **"..."** 메뉴 → **"Redeploy"**
2. **"Use existing Build Cache" 체크 해제**
3. **"Redeploy" 클릭**
4. 배포 완료 대기 (약 2-3분)

### 4단계: 새 Supabase 프로젝트의 Redirect URI 확인

1. **Supabase Dashboard 접속**
   - https://app.supabase.com 접속
   - 새 프로젝트 선택: `pkdhhtfomhhuiirzurhs`

2. **Authentication → URL Configuration 이동**
   - 왼쪽 메뉴 → **Authentication** → **URL Configuration**

3. **Redirect URLs 확인**
   - **Site URL**: `https://readingtree.vercel.app` (또는 실제 도메인)
   - **Redirect URLs** 섹션에서 다음 URL 확인:
     ```
     https://pkdhhtfomhhuiirzurhs.supabase.co/auth/v1/callback
     ```
   - 이 URL을 복사해두세요 (카카오/구글 개발자 센터에 등록해야 함)

### 5단계: Supabase OAuth Provider 설정

#### 5.1 Kakao OAuth 설정

1. **Supabase Dashboard → Authentication → Providers**
2. **Kakao Provider 찾기**
3. **Enable Kakao provider** 토글 활성화
4. **설정 입력:**
   - **Kakao Client ID (REST API 키)**: 기존 프로젝트와 동일한 값 사용
   - **Kakao Client Secret**: 기존 프로젝트와 동일한 값 사용
5. **Save** 클릭

#### 5.2 Google OAuth 설정

1. **Supabase Dashboard → Authentication → Providers**
2. **Google Provider 찾기**
3. **Enable Google provider** 토글 활성화
4. **설정 입력:**
   - **Google Client ID**: 기존 프로젝트와 동일한 값 사용
   - **Google Client Secret**: 기존 프로젝트와 동일한 값 사용
5. **Save** 클릭

### 6단계: 카카오 개발자 센터 Redirect URI 등록

1. **카카오 개발자 센터 접속**
   - https://developers.kakao.com/ 접속
   - 로그인

2. **내 애플리케이션 선택**
   - 기존에 사용하던 카카오 앱 선택

3. **제품 설정 → 카카오 로그인 이동**
   - 왼쪽 메뉴 → **제품 설정** → **카카오 로그인**

4. **Redirect URI 추가**
   - **Redirect URI** 섹션에서 **URI 추가** 클릭
   - 다음 URL 추가:
     ```
     https://pkdhhtfomhhuiirzurhs.supabase.co/auth/v1/callback
     ```
   - **저장** 클릭

5. **기존 Redirect URI 확인**
   - 기존 프로젝트의 Redirect URI는 테스트 기간 동안 유지 권장
   - 예: `https://tpourpuxuqsorohlydug.supabase.co/auth/v1/callback`

### 7단계: Google Cloud Console Redirect URI 등록

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/ 접속
   - 로그인

2. **프로젝트 선택**
   - 기존에 사용하던 Google Cloud 프로젝트 선택

3. **APIs & Services → Credentials 이동**
   - 왼쪽 메뉴 → **APIs & Services** → **Credentials**

4. **OAuth 2.0 Client ID 선택**
   - 기존에 사용하던 OAuth 2.0 Client ID 클릭

5. **Authorized redirect URIs에 새 URI 추가**
   - **Authorized redirect URIs** 섹션에서 **+ ADD URI** 클릭
   - 다음 URL 추가:
     ```
     https://pkdhhtfomhhuiirzurhs.supabase.co/auth/v1/callback
     ```
   - **SAVE** 클릭

6. **기존 Redirect URI 확인**
   - 기존 프로젝트의 Redirect URI는 테스트 기간 동안 유지 권장
   - 예: `https://tpourpuxuqsorohlydug.supabase.co/auth/v1/callback`

### 8단계: 설정 확인 및 테스트

1. **Vercel 재배포 완료 확인**
   - Deployments 탭에서 배포 상태가 "Ready"인지 확인

2. **프로덕션 URL 접속**
   - https://readingtree.vercel.app/login

3. **브라우저 개발자 도구 확인**
   - F12 → Console 탭
   - Network 탭에서 요청 URL 확인
   - `redirect_to` 파라미터가 `https://readingtree.vercel.app/callback`인지 확인

4. **카카오 로그인 테스트**
   - 카카오 로그인 버튼 클릭
   - 카카오 로그인 페이지로 정상 이동 확인
   - 로그인 완료 후 정상 리다이렉트 확인

5. **구글 로그인 테스트**
   - 구글 로그인 버튼 클릭
   - 구글 로그인 페이지로 정상 이동 확인
   - 로그인 완료 후 정상 리다이렉트 확인

## 중요 사항

### Redirect URI 형식

**올바른 형식:**
```
https://pkdhhtfomhhuiirzurhs.supabase.co/auth/v1/callback
```

**잘못된 형식:**
```
https://pkdhhtfomhhuiirzurhs.supabase.co/auth/v1/callback/  # 끝에 슬래시 있음
https://pkdhhtfomhhuiirzurhs.supabase.co/callback  # /auth/v1/ 경로 누락
http://pkdhhtfomhhuiirzurhs.supabase.co/auth/v1/callback  # http 사용 (https 필수)
```

### OAuth 흐름

1. 사용자가 로그인 버튼 클릭
2. 앱 → Supabase Auth (`/auth/v1/authorize`)
3. Supabase → 카카오/구글 로그인 페이지
4. 사용자 로그인 완료
5. 카카오/구글 → Supabase (`/auth/v1/callback`) ← **이 URI가 등록되어 있어야 함**
6. Supabase → 앱 (`/callback`) ← **이 URL이 올바른 프로덕션 URL이어야 함**
7. 세션 생성 완료

### Chrome 브라우저 경고

Chrome DevTools에서 `pkdhhtfomhhuiirzurhs.supabase.co`가 "potentially tracking website"로 표시되는 것은 정상입니다. OAuth 흐름에서 Supabase는 중간 리다이렉트 역할을 하기 때문입니다. 이 경고는 로그인 기능에 영향을 주지 않습니다.

## 체크리스트

- [ ] Vercel에 `NEXT_PUBLIC_APP_URL=https://readingtree.vercel.app` 설정
- [ ] Vercel 재배포 완료
- [ ] Supabase Dashboard에서 새 프로젝트의 Redirect URI 확인
- [ ] Supabase Dashboard에서 Kakao Provider 활성화 및 설정
- [ ] Supabase Dashboard에서 Google Provider 활성화 및 설정
- [ ] 카카오 개발자 센터에 새 Redirect URI 등록
- [ ] Google Cloud Console에 새 Redirect URI 등록
- [ ] 카카오 로그인 테스트 성공
- [ ] 구글 로그인 테스트 성공

## 문제 해결

### 여전히 `redirect_uri_mismatch` 오류가 발생하는 경우

1. **Redirect URI 정확히 확인**
   - Supabase Dashboard → Authentication → URL Configuration에서 정확한 URL 복사
   - 카카오/구글 개발자 센터에 정확히 동일하게 입력 (대소문자, 슬래시 등)

2. **`redirect_to` 파라미터 확인**
   - 브라우저 개발자 도구 → Network 탭
   - 카카오/구글 로그인 요청의 `redirect_to` 파라미터 확인
   - `https://readingtree.vercel.app/callback`인지 확인
   - `http://localhost:3000/callback`이면 Vercel 환경 변수 문제

3. **캐시 클리어**
   - 브라우저 캐시 클리어 (Ctrl + Shift + R)
   - 시크릿 모드에서 테스트

4. **설정 저장 확인**
   - 카카오 개발자 센터: 저장 후 몇 분 대기 (반영 시간 필요)
   - Google Cloud Console: 저장 즉시 반영

5. **Supabase OAuth Provider 설정 확인**
   - Client ID와 Client Secret이 올바르게 입력되었는지 확인
   - Provider가 활성화되어 있는지 확인

## 참고

- 기존 프로젝트의 Redirect URI는 테스트 기간 동안 유지하는 것을 권장합니다
- 모든 설정이 완료되면 기존 Redirect URI를 제거할 수 있습니다
- `getAppUrl()` 함수 수정으로 프로덕션 환경에서 올바른 URL이 반환됩니다
