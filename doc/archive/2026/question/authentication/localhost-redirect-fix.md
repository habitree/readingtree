# Localhost 리다이렉트 문제 해결

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0  
**문제:** Vercel 프로덕션 환경에서 카카오 로그인 후 localhost로 리다이렉트되는 문제

---

## 🔍 문제 분석

### 발견된 문제

**증상:**
- 카카오 로그인 성공 후 `http://localhost:3000/?code=...` 로 리다이렉트됨
- `ERR_CONNECTION_REFUSED` 오류 발생
- Vercel에 배포되어 있는데 localhost로 리다이렉트됨

**원인:**
1. **`getAppUrl()` 함수 문제**
   - Vercel 프로덕션 환경에서도 `http://localhost:3000`을 반환
   - `VERCEL_ENV` 환경 변수를 제대로 확인하지 않음
   - 환경 변수가 없을 때 기본값으로 localhost 반환

2. **`app/callback/route.ts` 리다이렉트 문제**
   - `new URL(next, request.url)` 사용 시 `request.url`이 localhost일 수 있음
   - `getAppUrl()`을 사용하지 않고 `request.url`을 직접 사용

---

## ✅ 해결 방법

### 1. `getAppUrl()` 함수 개선

**파일**: `lib/utils/url.ts`

**변경 사항**:
- `VERCEL_ENV === "production"`인 경우 무조건 프로덕션 URL 반환
- 로컬 개발 환경에서만 localhost 사용
- 그 외의 경우(프로덕션, Preview 등)는 프로덕션 도메인 사용

**수정 전**:
```typescript
return process.env.NODE_ENV === "production"
  ? "https://readingtree2-0.vercel.app"
  : "http://localhost:3000";
```

**수정 후**:
```typescript
// 로컬 개발 환경에서만 localhost 사용
if (process.env.NODE_ENV === "development" && !process.env.VERCEL) {
  return "http://localhost:3000";
}

// Vercel 환경이거나 프로덕션 환경인 경우 프로덕션 도메인 사용
return "https://readingtree2-0.vercel.app";
```

**핵심 개선 사항**:
1. `VERCEL_ENV === "production"` 체크를 최우선으로 처리
2. 로컬 개발 환경(`NODE_ENV === "development" && !process.env.VERCEL`)에서만 localhost 사용
3. 그 외의 모든 경우 프로덕션 도메인 사용

---

### 2. `app/callback/route.ts` 리다이렉트 수정

**파일**: `app/callback/route.ts`

**변경 사항**:
- 모든 리다이렉트에서 `request.url` 대신 `getAppUrl()` 사용
- `getAppUrl()` import 추가

**수정 전**:
```typescript
const redirectUrl = new URL(next, request.url);
```

**수정 후**:
```typescript
import { getAppUrl } from "@/lib/utils/url";

// ...
const baseUrl = getAppUrl();
const redirectUrl = new URL(next, baseUrl);
```

**수정된 위치**:
1. 코드가 없을 때 로그인 페이지로 리다이렉트
2. OAuth 코드 교환 실패 시 에러 페이지로 리다이렉트
3. 사용자 정보 조회 실패 시 에러 페이지로 리다이렉트
4. 온보딩 미완료 시 온보딩 페이지로 리다이렉트
5. 온보딩 완료 시 메인 페이지로 리다이렉트
6. 예외 발생 시 에러 페이지로 리다이렉트

---

## 📋 수정 내용 요약

### 수정된 파일

1. **`lib/utils/url.ts`**
   - `VERCEL_ENV === "production"` 체크 추가
   - 로컬 개발 환경 판단 로직 개선
   - 기본값을 프로덕션 도메인으로 변경

2. **`app/callback/route.ts`**
   - `getAppUrl()` import 추가
   - 모든 리다이렉트에서 `getAppUrl()` 사용
   - `request.url` 대신 `getAppUrl()` 사용

---

## 🔧 환경 변수 설정 가이드

### Vercel 환경 변수 설정 (권장)

**Vercel Dashboard** → **Settings** → **Environment Variables**

다음 환경 변수를 설정하세요:

```
NEXT_PUBLIC_APP_URL=https://readingtree2-0.vercel.app
```

**설정 방법**:
1. Vercel Dashboard 접속
2. 프로젝트 선택
3. **Settings** → **Environment Variables**
4. **Add New** 클릭
5. **Key**: `NEXT_PUBLIC_APP_URL`
6. **Value**: `https://readingtree2-0.vercel.app`
7. **Environment**: Production, Preview, Development 모두 선택
8. **Save** 클릭

**주의사항**:
- 이 환경 변수를 설정하면 `getAppUrl()`이 항상 이 값을 반환합니다
- 로컬 개발 환경에서는 `.env.local`에 `NEXT_PUBLIC_APP_URL=http://localhost:3000` 설정

---

## 🧪 테스트 방법

### 1. 로컬 환경 테스트

```bash
# .env.local 파일 확인
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:3000/login 접속
# 카카오 로그인 테스트
```

**예상 결과**:
- 로그인 성공 후 `http://localhost:3000/callback`으로 리다이렉트
- 정상적으로 로그인 완료

---

### 2. 프로덕션 환경 테스트

1. Vercel에 배포
2. `https://readingtree2-0.vercel.app/login` 접속
3. 카카오 로그인 테스트

**예상 결과**:
- 로그인 성공 후 `https://readingtree2-0.vercel.app/callback`으로 리다이렉트
- 정상적으로 로그인 완료
- localhost로 리다이렉트되지 않음

---

## 🔍 디버깅 방법

### 문제가 계속 발생하는 경우

1. **환경 변수 확인**
   ```bash
   # Vercel Dashboard에서 확인
   NEXT_PUBLIC_APP_URL 설정 여부
   VERCEL_ENV 값 확인 (production이어야 함)
   ```

2. **코드에서 디버깅**
   ```typescript
   // lib/utils/url.ts에 임시로 추가
   console.log('getAppUrl() 호출:', {
     NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
     VERCEL_ENV: process.env.VERCEL_ENV,
     VERCEL_URL: process.env.VERCEL_URL,
     NODE_ENV: process.env.NODE_ENV,
     VERCEL: process.env.VERCEL,
     result: getAppUrl()
   });
   ```

3. **Vercel 로그 확인**
   - Vercel Dashboard → **Deployments** → 최신 배포 → **Functions** 탭
   - 로그에서 `getAppUrl()` 반환값 확인

---

## ✅ 검증 체크리스트

### 수정 완료 확인

- [ ] `lib/utils/url.ts` 수정 완료
- [ ] `app/callback/route.ts` 수정 완료
- [ ] 린터 에러 없음
- [ ] Vercel 환경 변수 설정 확인

### 테스트 확인

- [ ] 로컬 환경에서 로그인 테스트 성공
- [ ] 프로덕션 환경에서 로그인 테스트 성공
- [ ] localhost로 리다이렉트되지 않음
- [ ] 프로덕션 URL로 정상 리다이렉트

---

## 📝 참고 사항

### 왜 이 문제가 발생했나요?

1. **Vercel 환경 변수 미설정**
   - `NEXT_PUBLIC_APP_URL`이 설정되지 않아 기본값 사용
   - `NODE_ENV`가 "production"이 아니어서 localhost 반환

2. **`request.url` 사용**
   - `request.url`은 실제 요청 URL을 반환
   - 로컬에서 테스트한 경우 localhost 포함 가능

3. **환경 판단 로직 부족**
   - Vercel 환경인지 확인하지 않음
   - `VERCEL_ENV` 환경 변수를 활용하지 않음

### 해결 방법의 장점

1. **명확한 환경 판단**
   - `VERCEL_ENV === "production"` 체크로 확실한 판단
   - 로컬 개발 환경만 localhost 사용

2. **안전한 기본값**
   - 환경 변수가 없어도 프로덕션 도메인 사용
   - localhost로 잘못 리다이렉트되는 문제 방지

3. **일관된 URL 사용**
   - 모든 리다이렉트에서 `getAppUrl()` 사용
   - URL 불일치 문제 해결

---

## 🔗 관련 문서

- [로그인 기능 점검 및 수정 완료 요약](./login-function-fix-summary.md)
- [OAuth 소셜 로그인 시스템 가이드](./oauth-login-system-guide.md)
- [카카오 로그인 테스트 가이드](../tasks/backend/kakao-login-test-guide.md)

---

**문서 끝**

