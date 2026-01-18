# Vercel 배포 가이드

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0

---

## 📋 개요

이 가이드는 Habitree Reading Hub를 Vercel에 배포하는 방법을 안내합니다.

---

## 🔧 사전 준비

### 1. Vercel 계정 생성

1. [Vercel](https://vercel.com)에 접속
2. GitHub 계정으로 로그인
3. 프로젝트 권한 부여

### 2. GitHub 저장소 확인

- 저장소: `https://github.com/habitree/readingtree.git`
- 브랜치: `main`

---

## 🚀 배포 단계

### 1단계: Vercel 프로젝트 생성

1. Vercel Dashboard → "Add New..." → "Project"
2. GitHub 저장소 선택: `habitree/readingtree`
3. 프로젝트 설정:
   - **Framework Preset**: Next.js (자동 감지)
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build` (기본값)
   - **Output Directory**: `.next` (기본값)
   - **Install Command**: `npm install` (기본값)

### 2단계: 환경 변수 설정 (중요!)

Vercel Dashboard → 프로젝트 → Settings → Environment Variables

다음 환경 변수들을 **모두 설정**해야 합니다:

#### 필수 환경 변수

```env
# Supabase 설정 (필수)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Naver 검색 API (필수)
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# Kakao OAuth (필수)
NEXT_PUBLIC_KAKAO_APP_KEY=your_kakao_app_key

# App URL (필수)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

#### 선택적 환경 변수

```env
# Google Vision API (OCR) - 다음 중 하나만 설정
# 방법 1: API 키 사용
GOOGLE_VISION_API_KEY=your_vision_api_key

# 방법 2: 서비스 계정 JSON 문자열 (Vercel에서 권장)
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"..."}

# Gemini API (선택사항)
GEMINI_API_KEY=your_gemini_api_key
```

#### 환경 변수 적용 범위

각 환경 변수에 대해 적용 범위를 선택합니다:
- ✅ **Production** (프로덕션)
- ✅ **Preview** (프리뷰)
- ✅ **Development** (개발)

**권장**: 모든 환경에 동일한 값 적용

### 3단계: 배포 실행

1. "Deploy" 버튼 클릭
2. 빌드 진행 상황 확인
3. 배포 완료 후 URL 확인

---

## ⚠️ 빌드 오류 해결

### 오류: "Missing Supabase environment variables"

**원인:**
- 환경 변수가 설정되지 않았거나
- 빌드 타임에 환경 변수를 읽을 수 없음

**해결 방법:**
1. Vercel Dashboard → Settings → Environment Variables 확인
2. 모든 필수 환경 변수가 설정되어 있는지 확인
3. 환경 변수 적용 범위 확인 (Production, Preview, Development)
4. 재배포 실행

**참고:**
- 코드는 빌드 타임에 더미 클라이언트를 사용하도록 수정되어 있습니다
- 하지만 **런타임에는 환경 변수가 필수**입니다
- 환경 변수가 없으면 앱이 정상 작동하지 않습니다

### 오류: "Build failed"

**확인 사항:**
1. `package.json`의 빌드 스크립트 확인
2. TypeScript 오류 확인
3. 의존성 설치 오류 확인
4. Vercel 빌드 로그 확인

---

## 🔍 배포 후 확인 사항

### 1. 환경 변수 확인

배포된 앱에서 다음을 확인:
- 로그인 기능 정상 작동
- Supabase 연결 정상
- API 호출 정상

### 2. 로그 확인

Vercel Dashboard → 프로젝트 → Logs
- 런타임 오류 확인
- 환경 변수 관련 오류 확인

### 3. 성능 모니터링

Vercel Dashboard → 프로젝트 → Analytics
- 페이지 로드 시간
- API 응답 시간
- 에러율

---

## 🔄 재배포

### 자동 배포

- `main` 브랜치에 푸시하면 자동으로 배포됩니다
- Pull Request 생성 시 Preview 배포가 자동 생성됩니다

### 수동 재배포

1. Vercel Dashboard → 프로젝트 → Deployments
2. 원하는 배포 선택
3. "Redeploy" 클릭

### 환경 변수 변경 후 재배포

1. Settings → Environment Variables에서 변경
2. 자동으로 재배포되거나 수동으로 재배포 실행

---

## 📝 환경 변수 체크리스트

배포 전 다음을 확인하세요:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` 설정
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 설정
- [ ] `NAVER_CLIENT_ID` 설정
- [ ] `NAVER_CLIENT_SECRET` 설정
- [ ] `NEXT_PUBLIC_KAKAO_APP_KEY` 설정
- [ ] `NEXT_PUBLIC_APP_URL` 설정 (프로덕션 URL)
- [ ] `GOOGLE_VISION_API_KEY` 또는 `GOOGLE_SERVICE_ACCOUNT_JSON` 설정 (OCR 사용 시)
- [ ] 모든 환경 변수의 적용 범위 확인 (Production, Preview, Development)

---

## 🔒 보안 주의사항

### 환경 변수 보안

- **절대** 환경 변수를 코드에 하드코딩하지 마세요
- Service Role Key는 **절대** 클라이언트에서 사용하지 마세요
- 환경 변수는 Vercel Dashboard에서만 관리하세요

### OAuth 리다이렉트 URL 설정

Vercel 배포 후 다음 URL을 OAuth 제공자에 등록해야 합니다:

- **Kakao**: `https://your-app.vercel.app/callback`
- **Google**: `https://your-app.vercel.app/callback`

---

## 📚 참고 문서

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [환경 변수 설정 가이드](./environment-variables-checklist.md)
- [빌드 오류 해결 가이드](../question/build-error-fix.md)

---

## 🆘 문제 해결

### 배포가 계속 실패하는 경우

1. **로컬에서 빌드 테스트**
   ```bash
   npm run build
   ```

2. **환경 변수 확인**
   - `.env.local` 파일과 Vercel 환경 변수 비교
   - 모든 필수 변수가 설정되어 있는지 확인

3. **Vercel 지원팀 문의**
   - Vercel Dashboard → Help → Contact Support

---

**문서 끝**
