# Google 로그인 연결 설정 완전 가이드

**작성일:** 2026-01-18  
**문제:** `오류 400: redirect_uri_mismatch` - Google OAuth 리다이렉트 URI 불일치  
**해결:** Google Cloud Console에 Supabase Redirect URI 등록

## 발견된 문제

**오류 메시지:**
```
오류 400: redirect_uri_mismatch
앱이 Google의 OAuth 2.0 정책을 준수하지 않기 때문에 앱에 로그인할 수 없습니다.
앱 개발자라면 Google Cloud Console에서 리디렉션 URI를 등록하세요.
```

**요청된 Redirect URI:**
```
https://pkdhhtfomhhuiirzurhs.supabase.co/auth/v1/callback
```

**원인:**
- Google Cloud Console의 OAuth 2.0 Client ID에 위 Redirect URI가 등록되지 않음
- Supabase가 Google 인증 후 리다이렉트할 URI가 Google에 승인되지 않음

## 해결 방법 (단계별)

### 1단계: Google Cloud Console 접속

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/ 접속
   - 로그인

2. **프로젝트 선택**
   - 상단의 프로젝트 선택 드롭다운 클릭
   - 기존에 사용하던 Google Cloud 프로젝트 선택
   - (기존 Supabase 프로젝트에서 사용하던 Google OAuth 프로젝트와 동일한 프로젝트 사용)

### 2단계: OAuth 2.0 Client ID 확인

1. **APIs & Services → Credentials 이동**
   - 왼쪽 메뉴 → **APIs & Services** → **Credentials**

2. **OAuth 2.0 Client ID 찾기**
   - "OAuth 2.0 Client IDs" 섹션에서 기존 Client ID 찾기
   - 일반적으로 "Web client" 또는 "웹 클라이언트" 이름으로 생성됨
   - Client ID 클릭하여 편집 화면으로 이동

### 3단계: Authorized redirect URIs 추가 (가장 중요!)

**OAuth 2.0 Client ID 편집 화면:**

1. **"Authorized redirect URIs" 섹션 찾기**
   - 스크롤하여 "Authorized redirect URIs" 섹션 찾기

2. **"+ ADD URI" 클릭**

3. **다음 URI 추가:**
   ```
   https://pkdhhtfomhhuiirzurhs.supabase.co/auth/v1/callback
   ```
   - **정확히** 위 URL을 입력 (복사-붙여넣기 권장)
   - 앞뒤 공백 없음
   - `https://` 필수 (http 사용 금지)
   - 끝에 슬래시(`/`) 없음

4. **추가 URI 확인:**
   - 기존 프로젝트의 URI도 확인:
     ```
     https://tpourpuxuqsorohlydug.supabase.co/auth/v1/callback
     ```
   - 이 URI는 테스트 기간 동안 유지 권장

5. **"SAVE" 클릭**
   - 변경 사항 저장
   - 저장 완료 메시지 확인

### 4단계: Supabase Google Provider 설정 확인

**Supabase Dashboard:**
1. https://app.supabase.com → 새 프로젝트 `pkdhhtfomhhuiirzurhs` 선택
2. **Authentication** → **Providers**
3. **Google Provider 찾기**

**확인 사항:**
- [ ] **"Enable Google provider"** 토글이 **활성화**되어 있는가?
- [ ] **Client ID (Google)** 필드에 Google Cloud Console의 Client ID가 입력되어 있는가?
- [ ] **Client Secret (Google)** 필드에 Google Cloud Console의 Client Secret이 입력되어 있는가?

**설정이 없으면:**
1. **"Enable Google provider"** 토글 활성화
2. **Client ID 입력:**
   - Google Cloud Console → OAuth 2.0 Client ID → Client ID 복사
   - Supabase에 붙여넣기
3. **Client Secret 입력:**
   - Google Cloud Console → OAuth 2.0 Client ID → Client Secret 복사
   - Supabase에 붙여넣기
4. **"Save" 클릭**

### 5단계: Supabase URL Configuration 확인

**Supabase Dashboard:**
1. **Authentication** → **URL Configuration**

**확인 사항:**

**Site URL:**
- ✅ 올바른 값: `https://readingtree.vercel.app`
- ❌ 잘못된 값: `http://localhost:3000`

**Redirect URLs:**
다음 URL들이 등록되어 있어야 합니다:
```
https://readingtree.vercel.app/callback
https://readingtree.vercel.app/**
https://pkdhhtfomhhuiirzurhs.supabase.co/auth/v1/callback
```

**확인:**
- [ ] `https://readingtree.vercel.app/callback` 등록됨
- [ ] `https://readingtree.vercel.app/**` 등록됨 (와일드카드)
- [ ] `localhost:3000` 관련 URL이 있으면 제거 권장

### 6단계: Vercel 환경 변수 확인

**Vercel Dashboard:**
1. https://vercel.com → 프로젝트 `readingtree` 선택
2. **Settings** → **Environment Variables**

**확인 사항:**
- [ ] `NEXT_PUBLIC_APP_URL` = `https://readingtree.vercel.app` (정확히 일치)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://pkdhhtfomhhuiirzurhs.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = 새 프로젝트의 anon key
- [ ] 모든 환경 변수가 **Production, Preview, Development**에 적용됨

### 7단계: 테스트

**테스트 절차:**
1. **프로덕션 URL 접속:**
   - https://readingtree.vercel.app/login

2. **브라우저 개발자 도구 열기:**
   - F12 → **Network** 탭

3. **구글 로그인 버튼 클릭**

4. **확인 사항:**
   - ✅ Google 로그인 페이지로 정상 이동
   - ✅ 로그인 완료 후 `https://readingtree.vercel.app/callback`로 리다이렉트
   - ✅ `redirect_uri_mismatch` 오류 없음
   - ✅ 정상적으로 로그인 완료

## 중요 사항

### Redirect URI 형식

**올바른 형식:**
```
https://pkdhhtfomhhuiirzurhs.supabase.co/auth/v1/callback
```

**잘못된 형식:**
```
https://pkdhhtfomhhuiirzurhs.supabase.co/auth/v1/callback/  # 끝에 슬래시
https://pkdhhtfomhhuiirzurhs.supabase.co/callback  # /auth/v1/ 경로 누락
http://pkdhhtfomhhuiirzurhs.supabase.co/auth/v1/callback  # http 사용 (https 필수)
```

### OAuth 흐름

1. 사용자가 구글 로그인 버튼 클릭
2. 앱 → Supabase Auth (`/auth/v1/authorize`)
3. Supabase → Google 로그인 페이지
4. 사용자 로그인 완료
5. Google → Supabase (`/auth/v1/callback`) ← **이 URI가 Google에 등록되어 있어야 함**
6. Supabase → 앱 (`/callback`) ← **이 URL이 올바른 프로덕션 URL이어야 함**
7. 세션 생성 완료

### Google Cloud Console 설정 주의사항

1. **URI 정확성:**
   - URI는 정확히 일치해야 함 (대소문자, 슬래시 등)
   - 복사-붙여넣기 권장

2. **저장 시간:**
   - URI 추가 후 저장하면 즉시 적용됨
   - 추가 대기 시간 없음

3. **기존 URI 유지:**
   - 기존 프로젝트의 URI는 테스트 기간 동안 유지 권장
   - 나중에 제거 가능

## 체크리스트

### Google Cloud Console
- [ ] Google Cloud Console 접속
- [ ] 올바른 프로젝트 선택
- [ ] OAuth 2.0 Client ID 찾기
- [ ] Authorized redirect URIs에 `https://pkdhhtfomhhuiirzurhs.supabase.co/auth/v1/callback` 추가
- [ ] 저장 완료

### Supabase 설정
- [ ] Google Provider 활성화됨
- [ ] Client ID 입력됨 (Google Cloud Console과 일치)
- [ ] Client Secret 입력됨 (Google Cloud Console과 일치)
- [ ] Site URL = `https://readingtree.vercel.app`
- [ ] Redirect URLs에 `https://readingtree.vercel.app/callback` 등록됨

### Vercel 환경 변수
- [ ] `NEXT_PUBLIC_APP_URL` = `https://readingtree.vercel.app`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://pkdhhtfomhhuiirzurhs.supabase.co`
- [ ] 모든 환경에 적용됨

### 테스트
- [ ] 구글 로그인 버튼 클릭
- [ ] Google 로그인 페이지로 정상 이동
- [ ] 로그인 완료 후 정상 리다이렉트
- [ ] `redirect_uri_mismatch` 오류 없음

## 문제 해결

### 여전히 `redirect_uri_mismatch` 오류가 발생하는 경우

1. **Google Cloud Console URI 재확인**
   - Authorized redirect URIs에 정확히 등록되었는지 확인
   - URI 형식이 정확한지 확인 (https, 슬래시 등)
   - 저장했는지 확인

2. **Supabase Google Provider 설정 재확인**
   - Client ID와 Client Secret이 Google Cloud Console과 일치하는지 확인
   - Provider가 활성화되어 있는지 확인

3. **브라우저 캐시 클리어**
   - Ctrl + Shift + R (강력 새로고침)
   - 시크릿 모드에서 테스트

4. **Vercel 재배포**
   - 환경 변수 변경 후 재배포 필요할 수 있음
   - "Use existing Build Cache" 체크 해제 후 재배포

### Google Cloud Console에서 Client ID/Secret 찾기

**Client ID:**
1. Google Cloud Console → APIs & Services → Credentials
2. OAuth 2.0 Client ID 클릭
3. "Client ID" 필드의 값 복사

**Client Secret:**
1. 같은 화면에서 "Client secret" 필드 확인
2. 값이 보이지 않으면 "RESET" 클릭하여 새로 생성
3. 생성된 값 복사 (한 번만 표시되므로 주의!)

## 참고

### 기존 프로젝트와의 차이

**기존 Supabase 프로젝트:**
- Redirect URI: `https://tpourpuxuqsorohlydug.supabase.co/auth/v1/callback`

**새 Supabase 프로젝트:**
- Redirect URI: `https://pkdhhtfomhhuiirzurhs.supabase.co/auth/v1/callback`

**중요:** 두 URI 모두 Google Cloud Console에 등록되어 있어야 합니다.

### Google OAuth 동의 화면

Google OAuth를 처음 사용하는 경우:
1. **OAuth consent screen** 설정 필요
2. APIs & Services → OAuth consent screen
3. 앱 정보 입력 (앱 이름, 사용자 지원 이메일 등)
4. 테스트 사용자 추가 (개발 중인 경우)

**참고:** 이미 기존 프로젝트에서 Google OAuth를 사용했다면 이 단계는 건너뛰어도 됩니다.

## 다음 단계

위의 모든 체크리스트를 완료한 후:

1. **프로덕션 URL에서 테스트**
   - https://readingtree.vercel.app/login
   - 구글 로그인 버튼 클릭
   - 정상 작동 확인

2. **문제가 계속되면:**
   - Google Cloud Console 스크린샷 제공 요청
   - Supabase Provider 설정 스크린샷 제공 요청
   - 브라우저 Network 탭 스크린샷 제공 요청

이 정보를 바탕으로 더 정확한 진단이 가능합니다.
