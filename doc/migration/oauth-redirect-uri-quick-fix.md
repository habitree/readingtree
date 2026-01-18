# OAuth Redirect URI 빠른 수정 가이드

**문제:** `redirect_uri_mismatch` 오류 (400 오류)  
**원인:** 
1. 새 Supabase 프로젝트의 Redirect URI가 등록되지 않음
2. `getAppUrl()` 함수가 프로덕션에서 `localhost:3000` 반환 (✅ 수정 완료)

## 즉시 해야 할 작업

### 0. Vercel 환경 변수 설정 (최우선 - 필수!)

**Vercel Dashboard:**
1. https://vercel.com → 프로젝트 `readingtree` 선택
2. **Settings** → **Environment Variables**
3. 다음 환경 변수 추가:
   ```
   NEXT_PUBLIC_APP_URL=https://readingtree.vercel.app
   ```
4. **모든 환경에 적용** (Production, Preview, Development)
5. **저장**
6. **재배포 필수!** (Deployments → 최신 배포 → "..." → "Redeploy" → "Use existing Build Cache" 체크 해제)

### 1. 새 Supabase Redirect URI 확인

**Supabase Dashboard:**
1. https://app.supabase.com → 새 프로젝트 `pkdhhtfomhhuiirzurhs` 선택
2. **Authentication** → **URL Configuration**
3. **Redirect URLs**에서 다음 URL 복사:
   ```
   https://pkdhhtfomhhuiirzurhs.supabase.co/auth/v1/callback
   ```

### 2. 카카오 개발자 센터 설정

1. **https://developers.kakao.com/** 접속
2. **내 애플리케이션** 선택
3. **제품 설정** → **카카오 로그인**
4. **Redirect URI** 섹션 → **URI 추가**
5. 다음 URL 입력:
   ```
   https://pkdhhtfomhhuiirzurhs.supabase.co/auth/v1/callback
   ```
6. **저장** 클릭

### 3. Google Cloud Console 설정

1. **https://console.cloud.google.com/** 접속
2. **APIs & Services** → **Credentials**
3. **OAuth 2.0 Client ID** 선택
4. **Authorized redirect URIs** → **+ ADD URI**
5. 다음 URL 입력:
   ```
   https://pkdhhtfomhhuiirzurhs.supabase.co/auth/v1/callback
   ```
6. **SAVE** 클릭

### 4. Supabase OAuth Provider 설정

**Supabase Dashboard:**
1. **Authentication** → **Providers**
2. **Kakao Provider:**
   - ✅ **Enable Kakao provider** 활성화
   - **Client ID** 입력 (기존 값과 동일)
   - **Client Secret** 입력 (기존 값과 동일)
   - **Save**
3. **Google Provider:**
   - ✅ **Enable Google provider** 활성화
   - **Client ID** 입력 (기존 값과 동일)
   - **Client Secret** 입력 (기존 값과 동일)
   - **Save**

### 5. 테스트

1. **Vercel 재배포 완료 확인**
2. 프로덕션 URL 접속: `https://readingtree.vercel.app/login`
3. 브라우저 개발자 도구 (F12) → Network 탭
4. 카카오 로그인 버튼 클릭
5. 요청 URL에서 `redirect_to` 파라미터 확인:
   - ✅ 올바른 값: `https://readingtree.vercel.app/callback`
   - ❌ 잘못된 값: `http://localhost:3000/callback`
6. 정상 작동 확인

## 중요 사항

- ✅ **Vercel 환경 변수 설정이 가장 중요합니다!** (`NEXT_PUBLIC_APP_URL`)
- ✅ **재배포 필수!** (환경 변수 변경 후 반드시 재배포)
- ✅ Redirect URI는 **정확히 동일**해야 합니다 (대소문자, 슬래시 등)
- ✅ 카카오 개발자 센터 저장 후 **몇 분 대기** (반영 시간 필요)
- ✅ Google Cloud Console은 **즉시 반영**됩니다

## 문제가 계속되면

1. **Vercel 환경 변수 확인**
   - `NEXT_PUBLIC_APP_URL`이 설정되어 있는지 확인
   - 재배포가 완료되었는지 확인

2. **브라우저 개발자 도구 확인**
   - Network 탭에서 `redirect_to` 파라미터 확인
   - `localhost:3000`이면 Vercel 환경 변수 문제

3. **브라우저 캐시 클리어** (Ctrl + Shift + R)
4. **시크릿 모드에서 테스트**
5. **Redirect URI 정확히 확인** (Supabase Dashboard에서 복사)

자세한 내용은 `doc/migration/oauth-redirect-uri-fix.md` 참조
