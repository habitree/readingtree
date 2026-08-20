# Vercel 배포 상태 확인 및 문제 해결

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0  
**도메인:** `readingtree2-0.vercel.app`

---

## 🔍 현재 상태 분석

### 도메인 설정 상태
- ✅ **도메인:** `readingtree2-0.vercel.app`
- ✅ **도메인 구성:** 올바르게 설정됨 (파란색 체크 표시)
- ⚠️ **배포 상태:** "No Deployment" (프로덕션 배포 없음)
- ✅ **환경:** Production으로 설정됨

### 문제점
**"No Deployment" 상태**는 다음을 의미합니다:
- 도메인은 올바르게 설정되었지만
- 실제 프로덕션 배포가 없어서 사이트가 작동하지 않음
- `main` 브랜치에 푸시하거나 `vercel --prod` 명령어로 배포 필요

---

## 🛠️ 해결 방법

### 방법 1: main 브랜치에 푸시 (권장)

```bash
# main 브랜치로 전환
git checkout main

# 변경사항 커밋 및 푸시123 45
git add .
git commit -m "배포 준비 완료"
git push origin main
```

GitHub Actions 워크플로우가 자동으로 실행되어 Vercel에 배포됩니다.

### 방법 2: Vercel CLI로 직접 배포

```bash
# Vercel CLI 설치 (없는 경우)
npm i -g vercel

# 로그인
vercel login

# 프로덕션 배포
vercel --prod
```

### 방법 3: Vercel Dashboard에서 수동 배포

1. Vercel Dashboard → 프로젝트 선택
2. **Deployments** 탭 이동
3. 최신 배포 찾기
4. **⋮** 메뉴 → **Promote to Production** 클릭

---

## ⚙️ 확인해야 할 설정

### 1. 환경 변수 확인

Vercel Dashboard → Settings → Environment Variables에서 다음 변수들이 설정되어 있는지 확인:

**필수 환경 변수:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NAVER_CLIENT_ID`
- [ ] `NAVER_CLIENT_SECRET`
- [ ] `GEMINI_API_KEY`
- [ ] `NEXT_PUBLIC_KAKAO_APP_KEY` (선택사항)

**선택적 환경 변수:**
- [ ] `NEXT_PUBLIC_APP_URL` (자동 감지되므로 선택사항)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (현재 미사용)

**환경 설정:**
- 각 변수가 **Production**, **Preview**, **Development** 환경에 모두 설정되어 있는지 확인

### 2. 프로젝트 설정 확인

Vercel Dashboard → Settings → General에서 확인:

- [ ] **Framework Preset:** Next.js
- [ ] **Build Command:** `npm run build` (또는 자동 감지)
- [ ] **Output Directory:** `.next` (또는 자동 감지)
- [ ] **Install Command:** `npm install` (또는 자동 감지)
- [ ] **Root Directory:** (프로젝트 루트면 비워둠)

### 3. Git 연결 확인

Vercel Dashboard → Settings → Git에서 확인:

- [ ] GitHub 저장소가 연결되어 있는지
- [ ] Production Branch가 `main`으로 설정되어 있는지
- [ ] 자동 배포가 활성화되어 있는지

### 4. 도메인 설정 확인

현재 확인된 정보:
- ✅ 도메인: `readingtree2-0.vercel.app`
- ✅ Production 환경으로 설정됨
- ⚠️ 배포가 없음

**추가 확인:**
- [ ] 커스텀 도메인이 있다면 추가 설정 필요
- [ ] SSL 인증서가 자동으로 발급되었는지 확인

---

## 🔧 코드 수정 필요 사항

### 도메인 기본값 수정

현재 `lib/utils/url.ts`의 기본값이 실제 도메인과 다릅니다:

**현재 코드:**
```typescript
return process.env.NODE_ENV === "production"
  ? "https://readingtree.vercel.app" // ❌ 잘못된 도메인
  : "http://localhost:3000";
```

**수정 필요:**
```typescript
return process.env.NODE_ENV === "production"
  ? "https://readingtree2-0.vercel.app" // ✅ 실제 도메인
  : "http://localhost:3000";
```

또는 `NEXT_PUBLIC_APP_URL` 환경 변수를 Vercel에 설정하여 자동으로 사용하도록 할 수 있습니다.

---

## 📋 배포 체크리스트

배포 전 확인사항:

### 코드 준비
- [ ] 모든 변경사항 커밋
- [ ] `npm run build` 로컬에서 성공 확인
- [ ] TypeScript 오류 없음 확인
- [ ] ESLint 경고 해결

### 환경 변수
- [ ] Vercel Dashboard에 모든 필수 환경 변수 설정
- [ ] Production 환경에 변수 설정 확인
- [ ] 변수 값이 올바른지 확인

### Git 설정
- [ ] `main` 브랜치에 최신 코드 푸시
- [ ] GitHub Actions 워크플로우 활성화 확인

### 배포 후 확인
- [ ] 배포 완료 확인 (Vercel Dashboard)
- [ ] `https://readingtree2-0.vercel.app` 접속 테스트
- [ ] OAuth 로그인 테스트
- [ ] 주요 기능 동작 확인
- [ ] 브라우저 콘솔 오류 확인

---

## 🐛 예상되는 문제 및 해결

### 문제 1: "No Deployment" 상태

**증상:**
- 도메인은 설정되었지만 사이트가 작동하지 않음
- "No Deployment" 배지 표시

**해결:**
- `main` 브랜치에 푸시하여 자동 배포 트리거
- 또는 Vercel CLI로 수동 배포

### 문제 2: 환경 변수 누락

**증상:**
- 빌드는 성공하지만 런타임 오류 발생
- "Missing environment variables" 오류

**해결:**
- Vercel Dashboard → Settings → Environment Variables 확인
- 모든 필수 변수가 Production 환경에 설정되었는지 확인

### 문제 3: 빌드 실패

**증상:**
- 배포가 실패하고 빌드 로그에 오류 표시

**해결:**
- 로컬에서 `npm run build` 실행하여 오류 재현
- 빌드 로그 확인하여 구체적인 오류 파악
- 의존성 문제인 경우 `package.json` 확인

---

## 📚 참고 자료

- [Vercel 배포 가이드](https://vercel.com/docs/concepts/deployments/overview)
- [Vercel 환경 변수 설정](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Vercel 배포](https://nextjs.org/docs/deployment)

---

**문서 끝**

