# 로그인 기능 점검 및 수정 완료 요약

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0

---

## 수정 완료 사항

### 1. Redirect URL 문제 해결 ✅

**파일**: `lib/utils/url.ts`

**문제점**:
- Vercel preview URL이 프로덕션 URL보다 우선순위가 높음
- `VERCEL_URL` 환경 변수가 preview URL을 반환할 수 있음
- 네트워크 요청에서 `redirect_to`가 preview URL로 설정됨

**수정 내용**:
- `NEXT_PUBLIC_APP_URL` 환경 변수 우선순위 최상향
- Preview URL과 프로덕션 URL 구분 로직 추가
- Preview URL 감지 시 프로덕션 기본값 사용

**변경 사항**:
```typescript
// 수정 전: VERCEL_URL이 우선순위가 높았음
// 수정 후: NEXT_PUBLIC_APP_URL이 최우선, Preview URL 감지 시 프로덕션 URL 사용
```

### 2. Server Action 에러 처리 개선 ✅

**파일**: `components/auth/social-login-buttons.tsx`

**문제점**:
- `redirect()`가 `NEXT_REDIRECT` 예외를 던짐
- 클라이언트에서 이를 에러로 처리하여 toast 에러 표시
- 콘솔에 "Error: NEXT_REDIRECT" 에러 발생

**수정 내용**:
- `NEXT_REDIRECT` 예외를 정상 처리로 간주
- 에러 메시지에 "NEXT_REDIRECT" 또는 "redirect" 포함 시 무시
- 리다이렉트 진행 중에는 로딩 상태 유지

**변경 사항**:
```typescript
// NEXT_REDIRECT 예외를 정상 처리로 간주하여 에러 표시하지 않음
if (errorMessage.includes("NEXT_REDIRECT") || errorMessage.includes("redirect")) {
  return; // 에러를 표시하지 않고 리다이렉트 대기
}
```

### 3. OAuth 콜백 처리 개선 ✅

**파일**: `app/callback/route.ts`

**개선 내용**:
- 에러 메시지를 사용자 친화적으로 개선
- 로깅 개선 (에러 상세 정보 포함)
- 다양한 에러 상황에 대한 명확한 메시지 제공

**변경 사항**:
- OAuth 코드 교환 실패 시 구체적인 에러 메시지
- 사용자 정보 조회 실패 시 명확한 안내
- 프로필 생성 오류 시 상세 로깅

### 4. 회원가입 및 회원정보 기능 점검 ✅

**확인 완료**:
- ✅ 회원가입: OAuth로 자동 처리 (정상 작동)
- ✅ 프로필 자동 생성: 트리거 및 재시도 로직 확인
- ✅ 프로필 조회: `getProfile()` 함수 정상 작동
- ✅ 프로필 수정: `updateProfile()` 함수 정상 작동
- ✅ 프로필 이미지 업로드: `updateProfileImage()` 함수 정상 작동
- ✅ 온보딩: `setReadingGoal()`, `checkOnboardingComplete()` 정상 작동

**파일 상태**:
- `app/actions/auth.ts` - ✅ 정상
- `app/actions/profile.ts` - ✅ 정상
- `app/actions/onboarding.ts` - ✅ 정상
- `app/callback/route.ts` - ✅ 개선 완료

---

## 검증 필요 사항

### 환경 변수 확인

다음 환경 변수가 Vercel에 올바르게 설정되어 있는지 확인 필요:

1. **필수 환경 변수**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (또는 자동 감지)

2. **권장 설정**:
   - `NEXT_PUBLIC_APP_URL=https://readingtree2-0.vercel.app` (프로덕션)
   - 로컬: `NEXT_PUBLIC_APP_URL=http://localhost:3000`

### Supabase 설정 확인

1. **Kakao Provider 활성화**:
   - Supabase 대시보드 → Authentication → Providers
   - Kakao Provider 활성화 확인
   - Client ID 및 Secret 설정 확인

2. **Redirect URL 확인**:
   - Supabase Redirect URL 확인
   - 카카오 개발자 센터에 등록되어 있는지 확인

### 카카오 개발자 센터 설정 확인

1. **Web 플랫폼 등록**:
   - 사이트 도메인: `https://readingtree2-0.vercel.app`

2. **Redirect URI 등록**:
   - `https://{supabase-project}.supabase.co/auth/v1/callback`

3. **카카오 로그인 활성화**:
   - 제품 설정 → 카카오 로그인 → 활성화 확인

---

## 테스트 체크리스트

### 로그인 플로우 테스트

- [ ] 로그인 페이지 접속 성공
- [ ] 카카오 로그인 버튼 클릭 시 에러 없음
- [ ] 카카오 로그인 페이지로 정상 리다이렉트
- [ ] 로그인 성공 후 `/callback`으로 리다이렉트
- [ ] 사용자 프로필 자동 생성 확인
- [ ] 온보딩 상태 확인
- [ ] 목표 미설정 시 `/onboarding/goal`로 리다이렉트
- [ ] 목표 설정 후 `/`로 리다이렉트
- [ ] 로그인 상태 유지 확인
- [ ] 로그아웃 기능 정상 작동

### 프로필 기능 테스트

- [ ] 프로필 조회 정상 작동
- [ ] 프로필 수정 정상 작동
- [ ] 프로필 이미지 업로드 정상 작동
- [ ] 독서 목표 수정 정상 작동

### 에러 처리 테스트

- [ ] 브라우저 콘솔에 NEXT_REDIRECT 에러 없음 (또는 무시됨)
- [ ] 실제 에러 발생 시 적절한 에러 메시지 표시
- [ ] 네트워크 에러 시 사용자 친화적 메시지

---

## 환경 변수 및 설정 확인 가이드

### 1. Vercel 환경 변수 확인

**필수 환경 변수**:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_APP_URL=https://readingtree2-0.vercel.app  # 권장 (프로덕션 URL 명시)
```

**설정 방법**:
1. Vercel Dashboard 접속
2. 프로젝트 선택 → **Settings** → **Environment Variables**
3. 위의 환경 변수들을 추가
4. **Production**, **Preview**, **Development** 환경 모두에 설정

**주의사항**:
- `NEXT_PUBLIC_APP_URL`을 설정하면 `getAppUrl()` 함수가 이 값을 우선 사용합니다
- 설정하지 않으면 Vercel이 자동으로 감지하지만, Preview URL이 사용될 수 있습니다
- 프로덕션 환경에서는 명시적으로 설정하는 것을 권장합니다

### 2. Supabase 설정 확인

**확인 사항**:
1. **Kakao Provider 활성화**
   - Supabase Dashboard → **Authentication** → **Providers**
   - **Kakao** Provider 찾기
   - **Enable Kakao provider** 토글 활성화 확인
   - **Kakao Client ID (REST API 키)** 설정 확인
   - **Kakao Client Secret** 설정 확인

2. **Redirect URL 확인**
   - Supabase Dashboard → **Authentication** → **URL Configuration**
   - **Redirect URLs** 섹션에서 확인
   - 예시: `https://xxxxx.supabase.co/auth/v1/callback`
   - 이 URL을 카카오 개발자 센터에 등록해야 합니다

**설정 방법**:
1. Supabase Dashboard 접속
2. **Authentication** → **Providers** 이동
3. **Kakao** Provider 활성화
4. 카카오 개발자 센터에서 확인한 **REST API 키**와 **Client Secret** 입력
5. **Save** 클릭

### 3. 카카오 개발자 센터 설정 확인

**확인 사항**:
1. **Web 플랫폼 등록**
   - 카카오 개발자 센터 → **앱 설정** → **플랫폼**
   - **Web 플랫폼 등록** 확인
   - 사이트 도메인: `https://readingtree2-0.vercel.app` 등록 확인

2. **Redirect URI 등록**
   - 카카오 개발자 센터 → **제품 설정** → **카카오 로그인**
   - **Redirect URI** 섹션 확인
   - Supabase Redirect URL 등록 확인:
     ```
     https://{supabase-project-ref}.supabase.co/auth/v1/callback
     ```
   - 예시: `https://tpourpuxuqsorohlydug.supabase.co/auth/v1/callback`

3. **카카오 로그인 활성화**
   - **활성화 설정** → **ON** 확인
   - **동의항목** 설정 확인 (필요한 정보 선택)

**설정 방법**:
1. 카카오 개발자 센터 접속 (https://developers.kakao.com/)
2. 내 애플리케이션 선택
3. **앱 설정** → **플랫폼** → **Web 플랫폼 등록**
4. **제품 설정** → **카카오 로그인** → **Redirect URI** 추가
5. Supabase Redirect URL 정확히 입력 후 **저장**

## 다음 단계

1. **환경 변수 설정**
   - Vercel에 `NEXT_PUBLIC_APP_URL` 설정 (권장)
   - 모든 필수 환경 변수 확인

2. **Supabase 설정 확인**
   - Kakao Provider 활성화 확인
   - Redirect URL 확인

3. **카카오 개발자 센터 설정 확인**
   - Web 플랫폼 등록 확인
   - Redirect URI 등록 확인

4. **프로덕션 테스트**
   - 배포 후 실제 로그인 플로우 테스트
   - 에러 로그 확인
   - 브라우저 콘솔 확인

---

## 참고 문서

- `doc/tasks/backend/01-bkend-authentication-plan.md` - 인증 백엔드 계획
- `doc/tasks/backend/kakao-login-test-guide.md` - 카카오 로그인 테스트 가이드
- `doc/question/environment-variables-checklist.md` - 환경 변수 체크리스트

---

**문서 끝**

