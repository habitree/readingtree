# Vercel 프로덕션에서 Localhost 리다이렉트 문제 디버깅

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0  
**문제:** 배포된 Vercel 사이트에서 카카오 로그인 후 localhost로 리다이렉트되는 문제

---

## 🔍 문제 증상

**증상:**
- 배포된 사이트: `https://readingtree2-0.vercel.app/login`
- 카카오 로그인 버튼 클릭
- 로그인 성공 후 `http://localhost:3000/?code=...`로 리다이렉트
- `ERR_CONNECTION_REFUSED` 오류 발생

---

## 🔧 수정 내용

### 1. `getAppUrl()` 함수 개선

**핵심 변경 사항:**

1. **VERCEL 환경 변수 우선 체크**
   ```typescript
   // VERCEL 환경 변수가 있으면 무조건 Vercel 환경으로 판단
   if (process.env.VERCEL) {
     // 프로덕션 또는 Preview 모두 프로덕션 도메인 사용
     return "https://readingtree2-0.vercel.app";
   }
   ```

2. **로컬 환경 판단 강화**
   ```typescript
   // 명확하게 로컬 개발 환경인지 확인
   if (process.env.NODE_ENV === "development" && !process.env.VERCEL) {
     return "http://localhost:3000";
   }
   ```

3. **안전한 기본값**
   ```typescript
   // 그 외의 모든 경우 프로덕션 도메인 사용
   return "https://readingtree2-0.vercel.app";
   ```

**변경 이유:**
- Vercel 환경에서는 `process.env.VERCEL`이 자동으로 설정됨
- 이 변수를 우선 체크하여 확실하게 Vercel 환경을 판단
- 환경 변수가 없어도 프로덕션 도메인을 기본값으로 사용하여 안전성 확보

---

### 2. `app/actions/auth.ts` 디버깅 로그 추가

**추가된 로그:**
```typescript
// 프로덕션에서만 로그 출력
if (process.env.VERCEL || process.env.VERCEL_ENV === "production") {
  console.log("[signInWithKakao] OAuth redirectTo:", {
    appUrl,
    redirectTo,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
  });
}
```

**목적:**
- Vercel 로그에서 실제로 어떤 URL이 사용되는지 확인
- 환경 변수 값 확인
- 문제 발생 시 원인 파악 용이

---

## 📋 수정된 파일

1. **`lib/utils/url.ts`**
   - `process.env.VERCEL` 우선 체크 추가
   - 로컬 환경 판단 로직 개선
   - 기본값을 프로덕션 도메인으로 변경

2. **`app/actions/auth.ts`**
   - 디버깅 로그 추가
   - `redirectTo` URL 명시적으로 변수로 저장

---

## 🧪 검증 방법

### 1. Vercel 로그 확인

1. Vercel Dashboard → **Deployments** → 최신 배포
2. **Functions** 탭 클릭
3. 카카오 로그인 버튼 클릭 후 로그 확인
4. 다음 로그가 출력되는지 확인:
   ```
   [signInWithKakao] OAuth redirectTo: {
     appUrl: "https://readingtree2-0.vercel.app",
     redirectTo: "https://readingtree2-0.vercel.app/callback",
     VERCEL: "1",
     VERCEL_ENV: "production",
     ...
   }
   ```

**예상 결과:**
- `appUrl`이 `https://readingtree2-0.vercel.app`로 출력되어야 함
- `redirectTo`가 `https://readingtree2-0.vercel.app/callback`로 출력되어야 함
- `localhost`가 포함되지 않아야 함

---

### 2. 실제 테스트

1. `https://readingtree2-0.vercel.app/login` 접속
2. 카카오 로그인 버튼 클릭
3. 카카오 로그인 완료
4. 리다이렉트 확인

**예상 결과:**
- `https://readingtree2-0.vercel.app/callback`로 리다이렉트
- localhost로 리다이렉트되지 않음
- 정상적으로 로그인 완료

---

## 🔍 문제가 계속 발생하는 경우

### 1. 환경 변수 확인

**Vercel Dashboard에서 확인:**
- `NEXT_PUBLIC_APP_URL` 설정 여부
- `VERCEL_ENV` 값 (production이어야 함)
- `VERCEL` 환경 변수 존재 여부

**설정 방법:**
1. Vercel Dashboard → **Settings** → **Environment Variables**
2. `NEXT_PUBLIC_APP_URL` 추가:
   - Key: `NEXT_PUBLIC_APP_URL`
   - Value: `https://readingtree2-0.vercel.app`
   - Environment: Production, Preview, Development 모두 선택

---

### 2. 코드 재배포 확인

1. 수정된 코드가 Git에 푸시되었는지 확인
2. Vercel이 자동 배포를 완료했는지 확인
3. 최신 배포가 성공했는지 확인

---

### 3. Supabase 설정 확인

**Supabase Dashboard에서 확인:**
- Authentication → **URL Configuration**
- **Site URL** 설정 확인
- **Redirect URLs** 확인

**설정 방법:**
1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. **Site URL** 설정:
   - `https://readingtree2-0.vercel.app`
3. **Redirect URLs** 확인:
   - `https://readingtree2-0.vercel.app/**` 포함되어야 함

---

## ✅ 최종 검증 체크리스트

### 코드 수정 확인
- [x] `lib/utils/url.ts` 수정 완료
- [x] `app/actions/auth.ts` 디버깅 로그 추가
- [x] 린터 에러 없음

### 환경 변수 확인
- [ ] Vercel Dashboard에서 `NEXT_PUBLIC_APP_URL` 설정 확인
- [ ] Vercel 로그에서 환경 변수 값 확인

### 테스트 확인
- [ ] Vercel에 재배포 완료
- [ ] 프로덕션 환경에서 카카오 로그인 테스트
- [ ] localhost로 리다이렉트되지 않음
- [ ] 프로덕션 URL로 정상 리다이렉트
- [ ] 로그인 플로우 정상 작동

---

## 📝 참고 사항

### 왜 이 문제가 발생했나요?

1. **환경 변수 미설정**
   - `NEXT_PUBLIC_APP_URL`이 설정되지 않음
   - `VERCEL_ENV`가 제대로 감지되지 않음

2. **로컬 환경 판단 로직 부족**
   - `NODE_ENV === "development"`만으로는 부족
   - `process.env.VERCEL` 체크가 없었음

3. **기본값이 localhost**
   - 환경 변수가 없을 때 localhost를 반환
   - Vercel 환경에서도 localhost 반환 가능

### 해결 방법의 장점

1. **확실한 Vercel 환경 감지**
   - `process.env.VERCEL` 우선 체크
   - Vercel 환경에서는 무조건 프로덕션 도메인 사용

2. **안전한 기본값**
   - 환경 변수가 없어도 프로덕션 도메인 사용
   - localhost로 잘못 리다이렉트되는 문제 방지

3. **디버깅 용이**
   - 로그를 통해 실제 사용되는 URL 확인 가능
   - 문제 발생 시 원인 파악 빠름

---

## 🔗 관련 문서

- [Localhost 리다이렉트 문제 해결](./localhost-redirect-fix.md)
- [로그인 기능 점검 및 수정 완료 요약](./login-function-fix-summary.md)
- [OAuth 소셜 로그인 시스템 가이드](./oauth-login-system-guide.md)

---

**문서 끝**

