# 카카오톡 로그인 검증 테스트 가이드

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0  
**관련 작업:** TASK-01 (인증 및 온보딩 백엔드)

---

## 📋 테스트 전 확인사항

### 1. Supabase 설정 확인

#### 1.1 Supabase 프로젝트 설정

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **Authentication → Providers 이동**
   - 왼쪽 메뉴에서 **Authentication** → **Providers** 클릭

3. **Kakao Provider 활성화**
   - **Kakao** 찾기
   - **Enable Kakao provider** 토글 활성화

4. **Kakao 설정 입력**
   - **Kakao Client ID (REST API 키)**: 카카오 개발자 센터에서 확인
   - **Kakao Client Secret**: 카카오 개발자 센터에서 확인
   - **Redirect URL**: Supabase가 자동으로 생성 (예: `https://{project-ref}.supabase.co/auth/v1/callback`)

#### 1.2 Supabase Redirect URL 확인

**중요:** Supabase가 생성한 Redirect URL을 카카오 개발자 센터에 등록해야 합니다.

1. Supabase 대시보드 → **Authentication** → **URL Configuration**
2. **Redirect URLs** 섹션에서 확인
3. 예시: `https://xxxxx.supabase.co/auth/v1/callback`

---

### 2. 카카오 개발자 센터 설정 확인

#### 2.1 앱 정보 확인

1. **카카오 개발자 센터 접속**
   - https://developers.kakao.com/
   - 로그인

2. **내 애플리케이션 선택**
   - 앱 이름: **readingtree2.0**
   - 앱 ID: **1359530**

3. **앱 키 확인**
   - 왼쪽 메뉴 → **앱 키**
   - **REST API 키** 복사 (Supabase Client ID로 사용)
   - **Client Secret** 확인 (Supabase Client Secret로 사용)

#### 2.2 플랫폼 설정

1. **플랫폼 등록**
   - 왼쪽 메뉴 → **앱 설정** → **플랫폼**
   - **Web 플랫폼 등록** 클릭
   - 사이트 도메인 입력:
     - 로컬: `http://localhost:3000`
     - 프로덕션: `https://readingtree2-0.vercel.app` (또는 실제 도메인)

2. **리다이렉트 URI 등록**
   - 왼쪽 메뉴 → **제품 설정** → **카카오 로그인**
   - **Redirect URI** 섹션에서 **URI 추가** 클릭
   - 다음 URI 추가:
     ```
     https://{project-ref}.supabase.co/auth/v1/callback
     ```
   - 예시: `https://xxxxx.supabase.co/auth/v1/callback`
   - **저장** 클릭

#### 2.3 카카오 로그인 활성화

1. **제품 설정 → 카카오 로그인**
   - **활성화 설정** → **ON**으로 설정
   - **동의항목** 설정 (필요한 정보 선택)
   - **저장** 클릭

---

### 3. 환경 변수 확인

#### 3.1 로컬 환경 변수 (`.env.local`)

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# 애플리케이션 URL (로컬)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**주의:** 카카오 OAuth는 Supabase를 통해 처리되므로 `NEXT_PUBLIC_KAKAO_APP_KEY`는 필요 없습니다. (공유 기능에만 필요)

#### 3.2 Vercel 환경 변수

1. **Vercel Dashboard 접속**
2. 프로젝트 선택 → **Settings** → **Environment Variables**
3. 다음 변수 확인:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (또는 Vercel 자동 감지)

---

## 🧪 테스트 절차

### 단계 1: 로컬 환경 테스트

#### 1.1 개발 서버 실행

```bash
npm run dev
```

#### 1.2 로그인 페이지 접속

1. 브라우저에서 `http://localhost:3000/login` 접속
2. **"카카오톡으로 시작하기"** 버튼 확인

#### 1.3 카카오 로그인 테스트

1. **"카카오톡으로 시작하기"** 버튼 클릭
2. 예상 동작:
   - 카카오 로그인 페이지로 리다이렉트
   - 카카오 계정으로 로그인
   - `/callback`으로 리다이렉트
   - 사용자 프로필 자동 생성 확인
   - 온보딩 상태 확인:
     - 목표 미설정 → `/onboarding/goal`로 리다이렉트
     - 목표 설정됨 → `/`로 리다이렉트

#### 1.4 콘솔 확인

브라우저 개발자 도구 (F12) → **Console** 탭에서 에러 확인:

```javascript
// 에러가 없어야 함
// OAuth 관련 에러가 있으면 Supabase 설정 확인
```

#### 1.5 네트워크 확인

브라우저 개발자 도구 → **Network** 탭에서:

1. `/callback` 요청 확인
2. 상태 코드 확인 (200 OK)
3. 리다이렉트 확인

---

### 단계 2: 프로덕션 환경 테스트

#### 2.1 Vercel 배포 확인

1. Vercel Dashboard에서 최신 배포 확인
2. 배포 URL 확인 (예: `https://readingtree2-0.vercel.app`)

#### 2.2 프로덕션 로그인 테스트

1. 배포된 URL에서 `/login` 접속
2. 카카오 로그인 버튼 클릭
3. 로그인 플로우 확인

#### 2.3 카카오 개발자 센터 로그 확인

1. 카카오 개발자 센터 → **내 애플리케이션** → **통계**
2. 로그인 요청 수 확인
3. 에러 로그 확인

---

## ✅ 검증 체크리스트

### Supabase 설정
- [ ] Kakao Provider 활성화됨
- [ ] Kakao Client ID (REST API 키) 설정됨
- [ ] Kakao Client Secret 설정됨
- [ ] Supabase Redirect URL 확인됨

### 카카오 개발자 센터 설정
- [ ] Web 플랫폼 등록됨
- [ ] 사이트 도메인 등록됨 (로컬 + 프로덕션)
- [ ] Redirect URI 등록됨 (Supabase URL)
- [ ] 카카오 로그인 활성화됨
- [ ] 동의항목 설정됨

### 환경 변수
- [ ] 로컬 `.env.local` 파일에 Supabase 설정 있음
- [ ] Vercel 환경 변수 설정됨
- [ ] `NEXT_PUBLIC_APP_URL` 설정됨 (또는 Vercel 자동 감지)

### 로컬 테스트
- [ ] 개발 서버 실행 성공
- [ ] 로그인 페이지 접속 성공
- [ ] 카카오 로그인 버튼 클릭 시 카카오 로그인 페이지로 이동
- [ ] 카카오 로그인 성공
- [ ] `/callback`으로 리다이렉트 성공
- [ ] 사용자 프로필 자동 생성 확인
- [ ] 온보딩 상태에 따른 리다이렉트 확인
- [ ] 브라우저 콘솔에 에러 없음

### 프로덕션 테스트
- [ ] Vercel 배포 성공
- [ ] 프로덕션 로그인 페이지 접속 성공
- [ ] 카카오 로그인 성공
- [ ] 프로덕션 환경에서 온보딩 플로우 정상 작동

---

## 🐛 문제 해결

### 문제 1: "Invalid redirect URI" 에러

**증상:**
- 카카오 로그인 페이지에서 "Invalid redirect URI" 에러 발생

**원인:**
- 카카오 개발자 센터에 Supabase Redirect URI가 등록되지 않음

**해결:**
1. Supabase 대시보드에서 Redirect URL 확인
2. 카카오 개발자 센터 → **제품 설정** → **카카오 로그인** → **Redirect URI**에 추가
3. 정확한 URL 입력 (예: `https://xxxxx.supabase.co/auth/v1/callback`)

### 문제 2: "OAuth provider not enabled" 에러

**증상:**
- Supabase에서 "OAuth provider not enabled" 에러 발생

**원인:**
- Supabase에서 Kakao Provider가 활성화되지 않음

**해결:**
1. Supabase 대시보드 → **Authentication** → **Providers**
2. **Kakao** 찾기
3. **Enable Kakao provider** 토글 활성화
4. Client ID와 Client Secret 입력
5. **Save** 클릭

### 문제 3: 로그인 후 프로필이 생성되지 않음

**증상:**
- 카카오 로그인은 성공하지만 사용자 프로필이 생성되지 않음

**원인:**
- TASK-00의 `handle_new_user` 트리거가 작동하지 않음
- 또는 데이터베이스 스키마가 적용되지 않음

**해결:**
1. Supabase SQL Editor에서 다음 쿼리 실행:
   ```sql
   -- 트리거 확인
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   
   -- 함수 확인
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name = 'handle_new_user';
   ```
2. 트리거가 없으면 `doc/database/schema.sql` 다시 실행
3. 수동으로 프로필 생성 테스트:
   ```sql
   -- 테스트 사용자 프로필 확인
   SELECT * FROM users WHERE email = 'test@example.com';
   ```

### 문제 4: 리다이렉트 URL 오류

**증상:**
- 로그인 후 잘못된 페이지로 리다이렉트됨

**원인:**
- `getAppUrl()` 함수가 잘못된 URL 반환
- 환경 변수 설정 오류

**해결:**
1. `lib/utils/url.ts` 확인
2. 로컬: `NEXT_PUBLIC_APP_URL=http://localhost:3000` 설정
3. 프로덕션: Vercel 자동 감지 또는 `NEXT_PUBLIC_APP_URL` 설정
4. `app/actions/auth.ts`에서 `getAppUrl()` 반환값 확인

### 문제 5: CORS 에러

**증상:**
- 브라우저 콘솔에 CORS 관련 에러 발생

**원인:**
- 카카오 개발자 센터에 사이트 도메인이 등록되지 않음

**해결:**
1. 카카오 개발자 센터 → **앱 설정** → **플랫폼**
2. **Web 플랫폼 등록**
3. 사이트 도메인 추가:
   - 로컬: `http://localhost:3000`
   - 프로덕션: `https://readingtree2-0.vercel.app`

---

## 📝 테스트 결과 기록

### 테스트 일시
- 날짜: ___________
- 테스터: ___________
- 환경: [ ] 로컬 [ ] 프로덕션

### 테스트 결과

#### 로그인 플로우
- [ ] 카카오 로그인 버튼 클릭 성공
- [ ] 카카오 로그인 페이지 이동 성공
- [ ] 카카오 계정 로그인 성공
- [ ] `/callback` 리다이렉트 성공
- [ ] 사용자 프로필 자동 생성 확인
- [ ] 온보딩 상태 확인 성공
- [ ] 최종 리다이렉트 성공

#### 에러 확인
- [ ] 브라우저 콘솔 에러 없음
- [ ] 네트워크 에러 없음
- [ ] Supabase 로그 에러 없음

#### 기능 확인
- [ ] 로그아웃 기능 정상 작동
- [ ] 세션 유지 확인
- [ ] 새로고침 후 로그인 상태 유지

### 발견된 문제
1. ___________
2. ___________
3. ___________

### 해결 방법
1. ___________
2. ___________
3. ___________

---

## 🔗 참고 링크

- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
- [카카오 로그인 가이드](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api)
- [카카오 개발자 센터](https://developers.kakao.com/)
- [프로젝트 인증 문서](../01-bkend-authentication-plan.md)

---

**문서 끝**

