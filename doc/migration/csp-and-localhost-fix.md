# CSP 오류 및 localhost 리다이렉트 오류 해결 가이드

**작성일:** 2026-01-18  
**문제 1:** Content Security Policy가 `eval()` 사용을 차단  
**문제 2:** 카카오 로그인 후 `localhost:3000`으로 리다이렉트 시도  
**해결:** CSP 설정 수정 및 Vercel 환경 변수 확인

## 발견된 문제

### 문제 1: CSP (Content Security Policy) 오류

**증상:**
- "Content Security Policy of your site blocks the use of 'eval' in JavaScript"
- `VM189 6b6edc51fdeb0dc0.js:1` 파일에서 `script-src` 지시어 위반
- Next.js Turbopack이나 일부 라이브러리가 `eval()` 사용 시도

**원인:**
- `next.config.js`의 프로덕션 CSP에 `unsafe-eval`이 없음
- 개발 환경에는 있지만 프로덕션에는 없어서 차단됨

### 문제 2: localhost 리다이렉트 오류

**증상:**
- 카카오 로그인 버튼 클릭 후 `ERR_CONNECTION_REFUSED`
- `localhost:3000/?code=...`로 리다이렉트 시도
- 프로덕션 환경에서 localhost로 연결 시도

**원인:**
- `getAppUrl()` 함수가 Vercel 환경에서도 `localhost:3000` 반환
- Vercel 환경 변수(`NEXT_PUBLIC_APP_URL`) 미설정 또는 재배포 미완료

## 해결 방법

### 1단계: CSP 설정 수정 (완료)

`next.config.js`의 프로덕션 CSP에 `unsafe-eval`을 추가했습니다:

**변경 전:**
```javascript
"script-src 'self' 'unsafe-inline' https://*.supabase.co ..."
```

**변경 후:**
```javascript
"script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co ..."
```

**참고:**
- `unsafe-eval`은 보안상 위험이 있지만, Next.js Turbopack과 일부 라이브러리가 필요로 할 수 있습니다
- Next.js 생태계에서는 일반적으로 허용됩니다

### 2단계: Vercel 환경 변수 설정 (필수!)

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

### 3단계: Vercel 재배포 (필수!)

환경 변수 설정 및 코드 수정 후 **반드시 재배포**해야 합니다:

1. **Deployments** 탭 이동
2. 최신 배포의 **"..."** 메뉴 클릭
3. **"Redeploy"** 선택
4. **"Use existing Build Cache" 체크 해제** (중요!)
5. **"Redeploy"** 클릭
6. 배포 완료 대기 (약 2-3분)

### 4단계: 확인

재배포 후:
1. 프로덕션 URL 접속: `https://readingtree.vercel.app/login`
2. 브라우저 개발자 도구 (F12) → Console 탭
3. 확인 사항:
   - ✅ CSP 오류 없음
   - ✅ `localhost` 리다이렉트 없음
4. 카카오 로그인 버튼 클릭
5. 확인 사항:
   - ✅ `https://readingtree.vercel.app/callback`로 리다이렉트됨
   - ✅ OAuth 인증 완료 후 정상 리다이렉트

## 수정 완료된 파일

### ✅ `next.config.js`
- 프로덕션 CSP에 `unsafe-eval` 추가
- Next.js Turbopack과 라이브러리 호환성 확보

### ✅ `lib/utils/url.ts`
- Vercel 환경에서 localhost 반환 방지
- 환경 변수 우선순위 개선

## 디버깅

### CSP 오류 확인

브라우저 개발자 도구 → Console 탭:
- CSP 오류가 사라졌는지 확인
- `unsafe-eval` 관련 경고가 없어야 함

### localhost 리다이렉트 확인

브라우저 개발자 도구 → Network 탭:
- OAuth 요청의 `redirect_to` 파라미터 확인
- ✅ 올바른 값: `https://readingtree.vercel.app/callback`
- ❌ 잘못된 값: `http://localhost:3000/callback`

### Vercel 로그 확인

Vercel Dashboard → 프로젝트 → **Deployments** → 최신 배포 → **Functions**:
- `[signInWithKakao] OAuth redirectTo` 로그 확인
- `appUrl`과 `redirectTo` 값 확인

**예상 로그 (올바른 경우):**
```
appUrl: "https://readingtree.vercel.app"
redirectTo: "https://readingtree.vercel.app/callback"
VERCEL: "1"
NEXT_PUBLIC_APP_URL: "https://readingtree.vercel.app"
```

**문제가 있는 경우:**
```
appUrl: "http://localhost:3000"  ← 문제!
redirectTo: "http://localhost:3000/callback"  ← 문제!
NEXT_PUBLIC_APP_URL: undefined  ← 환경 변수 미설정
```

## 문제가 계속되면

### CSP 오류가 계속되는 경우

1. **브라우저 캐시 클리어** (Ctrl + Shift + R)
2. **시크릿 모드에서 테스트**
3. **Vercel 재배포 확인** (CSP 변경사항 반영)

### localhost 리다이렉트가 계속되는 경우

1. **Vercel 환경 변수 재확인**
   - `NEXT_PUBLIC_APP_URL`이 정확히 입력되었는지 확인
   - 공백, 따옴표 등이 없는지 확인
   - 모든 환경에 적용되었는지 확인

2. **Vercel 재배포 확인**
   - 재배포가 완료되었는지 확인
   - "Use existing Build Cache" 체크 해제 후 재배포했는지 확인

3. **브라우저 캐시 클리어**
   - Ctrl + Shift + R (강력 새로고침)
   - 시크릿 모드에서 테스트

4. **Vercel 로그 확인**
   - Functions 로그에서 `getAppUrl()` 반환값 확인
   - 환경 변수가 제대로 읽히는지 확인

## 체크리스트

- [x] `next.config.js` 프로덕션 CSP에 `unsafe-eval` 추가
- [ ] Vercel에 `NEXT_PUBLIC_APP_URL` 설정
- [ ] Vercel에 `NEXT_PUBLIC_SUPABASE_URL` 설정
- [ ] Vercel에 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정
- [ ] 모든 환경 변수를 모든 환경에 적용
- [ ] Vercel 재배포 완료 (Build Cache 해제)
- [ ] 브라우저에서 CSP 오류 없음 확인
- [ ] 브라우저에서 `localhost` 리다이렉트 없음 확인
- [ ] 카카오 로그인 정상 작동 확인

## 참고

### CSP `unsafe-eval`에 대한 설명

- **보안 위험:** `eval()` 사용은 XSS 공격에 취약할 수 있습니다
- **Next.js 필요성:** Next.js Turbopack과 일부 라이브러리가 `eval()`을 사용할 수 있습니다
- **일반적인 관행:** 많은 Next.js 프로젝트에서 `unsafe-eval`을 허용합니다
- **대안:** 가능하면 `unsafe-eval` 없이 작동하도록 라이브러리를 업데이트하거나 대체하는 것이 좋습니다

### localhost 리다이렉트 문제

- 이 문제는 **Vercel 환경 변수 설정과 재배포**로만 해결됩니다
- 코드 수정만으로는 해결되지 않습니다
- 반드시 Vercel Dashboard에서 환경 변수를 설정하고 재배포해야 합니다
