# 배포 연결 (Vercel)

연결 정보 단일 참고: [README](README.md) | 환경 변수: [05-env-variables](05-env-variables.md)

---

## 배포 경로

1. **Git 저장소 → Vercel Git 연동**  
   - Vercel에서 GitHub 저장소 연결 시 push마다 자동 빌드·배포 (Vercel이 환경 변수 사용)

2. **GitHub Actions → Vercel**  
   - [.github/workflows/deploy-production.yml](../../.github/workflows/deploy-production.yml): `main` push 또는 수동 실행 시 Production 배포  
   - [.github/workflows/deploy-preview.yml](../../.github/workflows/deploy-preview.yml): PR 생성 시 Preview 배포  
   - `amondnet/vercel-action` 사용, Secrets에서 `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` 전달

---

## Vercel 측 설정

- **프로젝트 연결**: Dashboard → Add New → Project → GitHub 저장소 선택
- **Environment Variables**: 프로젝트 → Settings → Environment Variables  
  - Production / Preview 별도 설정 가능. 빌드에 필요한 변수는 [05-env-variables](05-env-variables.md) 참고
- **도메인**: Settings → Domains
- **프로젝트 ID·Org ID**: Settings → General 에서 확인 (GitHub Secrets에 넣는 값)

---

## GitHub Actions Secrets

저장소 → **Settings** → **Secrets and variables** → **Actions** 에서 설정.

### 빌드 시 사용 (deploy-production.yml env)

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`
- `GOOGLE_VISION_API_KEY`, `GOOGLE_SERVICE_ACCOUNT_JSON` (선택)
- `KAKAO_APP_KEY`, `NEXT_PUBLIC_APP_URL`

### Vercel 배포용

- `VERCEL_TOKEN`: Vercel Dashboard → Settings → Tokens 에서 생성
- `VERCEL_ORG_ID`: 팀/계정 설정 → General
- `VERCEL_PROJECT_ID`: 프로젝트 → Settings → General

자세한 목록·얻는 방법: [.github/workflows/README.md](../../.github/workflows/README.md)

---

## 로컬 .vercel/project.json

- **역할**: 로컬에서 `vercel` / `vercel deploy` 실행 시, 어느 Vercel 프로젝트로 배포할지 지정
- **생성**: `npx vercel link` 실행 후 프로젝트 선택 시 생성
- **Git**: `.gitignore`에 포함되어 커밋되지 않음
- **계정/프로젝트 변경 시**: `.vercel` 삭제 후 `vercel link` 다시 실행

---

## 연결 확인

- `main` push 또는 workflow_dispatch 후 GitHub Actions 성공 여부 확인
- Vercel Dashboard → Deployments 에서 배포 상태·로그 확인
- 배포된 URL에서 로그인·데이터 조회 동작 확인
