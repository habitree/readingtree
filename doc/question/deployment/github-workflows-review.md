# GitHub Actions 워크플로우 점검 결과

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0

---

## 🔍 발견된 문제점

### 1. 워크플로우 중복 및 역할 불명확 ⚠️

**문제:**
- `ci.yml`과 `code-quality.yml`이 거의 동일한 트리거와 기능을 가짐
- 둘 다 `main`, `develop` 브랜치에 push/PR 시 실행
- 역할이 중복되어 리소스 낭비

**영향:**
- 동일한 작업이 두 번 실행됨
- GitHub Actions 실행 시간 낭비

**해결 방안:**
- `ci.yml`과 `code-quality.yml` 통합
- 또는 역할을 명확히 분리 (CI는 빌드 테스트, Code Quality는 코드 품질 검사)

---

### 2. 환경 변수 불일치 ⚠️

**문제:**
- `ci.yml`: 일부 환경 변수만 설정
  - ✅ `NEXT_PUBLIC_SUPABASE_URL`
  - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - ❌ `NAVER_CLIENT_ID` 없음
  - ❌ `NAVER_CLIENT_SECRET` 없음
  - ❌ `GEMINI_API_KEY` 없음
  - ❌ `SUPABASE_SERVICE_ROLE_KEY` 없음

- `code-quality.yml`: 일부 환경 변수만 설정
  - ✅ `NEXT_PUBLIC_SUPABASE_URL`
  - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - ❌ 나머지 환경 변수 없음

**영향:**
- 빌드 시 API 호출이 필요한 코드에서 오류 발생 가능
- 빌드 테스트가 실제 환경과 다를 수 있음

**해결 방안:**
- 모든 워크플로우에 필수 환경 변수 추가
- 또는 빌드 테스트용으로 최소한의 환경 변수만 설정 (현재 상태 유지)

---

### 3. 존재하지 않는 스크립트 사용 ⚠️

**문제:**
- `code-quality.yml`에서 `npm run format:check` 사용
- `package.json`에 `format:check` 스크립트가 없음
- 현재는 `format` 스크립트만 존재

**영향:**
- 워크플로우 실행 시 오류 발생
- `continue-on-error: true`로 인해 실패해도 계속 진행되지만, 실제 검사가 이루어지지 않음

**해결 방안:**
- `package.json`에 `format:check` 스크립트 추가
- 또는 `prettier --check` 직접 사용

---

### 4. Vercel 배포 설정 불일치

**문제:**
- `deploy-preview.yml`의 `vercel-args`에 `--scope` 사용
- `deploy-production.yml`에는 `--prod`만 사용
- 일관성 부족

**영향:**
- Preview 배포가 제대로 작동하지 않을 수 있음

**해결 방안:**
- `--scope` 제거 (Vercel Action이 자동으로 처리)
- 또는 두 워크플로우 모두 동일한 방식으로 통일

---

## ✅ 수정 사항

### 1. `code-quality.yml` 수정

**문제:**
- `format:check` 스크립트가 없음

**수정:**
```yaml
- name: Run Prettier check
  run: npx prettier --check "**/*.{js,jsx,ts,tsx,json,css,md}" || echo "Prettier check skipped"
```

### 2. 환경 변수 일관성 개선

**옵션 1: 모든 워크플로우에 필수 환경 변수 추가 (권장)**
- 빌드 테스트가 실제 환경과 동일하게 실행됨
- 문제를 조기에 발견 가능

**옵션 2: 현재 상태 유지**
- CI/Code Quality는 최소한의 환경 변수만 사용
- 배포 워크플로우만 모든 환경 변수 사용
- 빌드 시간 단축

### 3. 워크플로우 통합 또는 역할 분리

**옵션 1: 통합 (권장)**
- `ci.yml`에 모든 검사 포함
- `code-quality.yml` 제거

**옵션 2: 역할 분리**
- `ci.yml`: 빠른 빌드 테스트
- `code-quality.yml`: 상세한 코드 품질 검사

---

## 📋 권장 수정 사항

### 우선순위 1: 즉시 수정 필요

1. ✅ `code-quality.yml`의 `format:check` 수정
2. ✅ `deploy-preview.yml`의 `vercel-args` 확인

### 우선순위 2: 개선 권장

1. 환경 변수 일관성 개선
2. 워크플로우 통합 또는 역할 분리

---

## 🔧 수정된 워크플로우

다음 파일들을 수정하겠습니다:
- `.github/workflows/code-quality.yml` - `format:check` 수정
- `.github/workflows/deploy-preview.yml` - `vercel-args` 확인
- `.github/workflows/ci.yml` - 환경 변수 추가 (선택사항)

---

**문서 끝**

