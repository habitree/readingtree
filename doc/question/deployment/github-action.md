# GitHub와 GitHub Actions 가이드

**작성일:** 2025년 12월  
**프로젝트:** Habitree Reading Hub  
**관련 저장소:** [https://github.com/habitree/readingtree4.0.git](https://github.com/habitree/readingtree4.0.git)

---

## 목차
1. [GitHub 기본 개념](#github-기본-개념)
2. [GitHub Actions 기본 개념](#github-actions-기본-개념)
3. [GitHub Actions 설정 방법](#github-actions-설정-방법)
4. [Next.js 프로젝트용 GitHub Actions 예제](#nextjs-프로젝트용-github-actions-예제)
5. [실전 설정 가이드](#실전-설정-가이드)

---

## GitHub 기본 개념

### 1.1 GitHub란?

**GitHub**는 Git 버전 관리 시스템을 기반으로 한 웹 기반 호스팅 서비스입니다. 코드 저장, 협업, 프로젝트 관리를 위한 플랫폼을 제공합니다.

**주요 기능:**
- **코드 저장소 (Repository)**: 프로젝트 코드를 저장하고 관리
- **버전 관리**: Git을 통한 코드 변경 이력 추적
- **협업 도구**: Pull Request, Issue, Discussion
- **CI/CD**: GitHub Actions를 통한 자동화
- **코드 리뷰**: Pull Request를 통한 코드 검토
- **프로젝트 관리**: Projects, Milestones, Labels

### 1.2 Git vs GitHub

| 구분 | Git | GitHub |
|------|-----|--------|
| **정의** | 분산 버전 관리 시스템 | Git을 사용하는 웹 서비스 |
| **설치** | 로컬에 설치 필요 | 웹 브라우저로 접근 |
| **저장소** | 로컬 저장소 | 원격 저장소 (클라우드) |
| **협업** | 직접 설정 필요 | 웹 인터페이스 제공 |

**비유:**
- **Git** = 도구 (예: 텍스트 에디터)
- **GitHub** = 서비스 (예: Google Docs)

### 1.3 GitHub 저장소 구조

```
repository/
├── .git/              # Git 메타데이터 (숨김 폴더)
├── .github/          # GitHub 설정
│   └── workflows/     # GitHub Actions 워크플로우
├── .gitignore         # Git에서 무시할 파일 목록
├── README.md          # 프로젝트 설명서
├── package.json       # 프로젝트 설정 (Node.js)
└── src/               # 소스 코드
```

### 1.4 GitHub 기본 명령어

```bash
# 저장소 초기화
git init

# 원격 저장소 연결
git remote add origin https://github.com/habitree/readingtree4.0.git

# 파일 추가
git add .

# 커밋
git commit -m "커밋 메시지"

# 푸시 (원격 저장소에 업로드)
git push origin main

# 풀 (원격 저장소에서 다운로드)
git pull origin main

# 상태 확인
git status

# 브랜치 생성
git checkout -b feature/new-feature

# 브랜치 전환
git checkout main
```

---

## GitHub Actions 기본 개념

### 2.1 GitHub Actions란?

**GitHub Actions**는 GitHub 저장소에서 자동화된 워크플로우를 실행할 수 있게 해주는 CI/CD (Continuous Integration/Continuous Deployment) 플랫폼입니다.

**주요 용도:**
- **자동 테스트**: 코드 변경 시 자동으로 테스트 실행
- **자동 빌드**: 코드를 빌드하고 배포 가능한 형태로 생성
- **자동 배포**: 테스트 통과 시 자동으로 배포
- **코드 품질 검사**: 린트, 포맷팅, 보안 검사
- **알림**: 이메일, Slack 등으로 알림 전송

### 2.2 GitHub Actions 핵심 개념

#### 2.2.1 Workflow (워크플로우)

**워크플로우**는 하나 이상의 Job으로 구성된 자동화된 프로세스입니다. YAML 파일로 정의하며, `.github/workflows/` 폴더에 저장합니다.

**예시:**
```yaml
name: CI  # 워크플로우 이름

on:       # 트리거 (언제 실행할지)
  push:
    branches: [ main ]

jobs:     # 작업들
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm test
```

#### 2.2.2 Event (이벤트)

**이벤트**는 워크플로우를 트리거하는 활동입니다.

**주요 이벤트:**
- `push`: 코드 푸시 시
- `pull_request`: Pull Request 생성/업데이트 시
- `schedule`: 일정에 따라 (크론 표현식)
- `workflow_dispatch`: 수동 실행
- `release`: 릴리스 생성 시

#### 2.2.3 Job (작업)

**Job**은 같은 러너에서 실행되는 Step들의 집합입니다. 여러 Job은 병렬 또는 순차적으로 실행할 수 있습니다.

**예시:**
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run build
```

#### 2.2.4 Step (단계)

**Step**은 Job 내에서 실행되는 개별 작업입니다. Action을 사용하거나 명령어를 실행할 수 있습니다.

**예시:**
```yaml
steps:
  - name: Checkout code
    uses: actions/checkout@v3  # Action 사용
  
  - name: Run command
    run: npm test  # 명령어 실행
```

#### 2.2.5 Action (액션)

**Action**은 재사용 가능한 워크플로우 단위입니다. GitHub Marketplace에서 공유되거나 직접 만들 수 있습니다.

**인기 있는 Actions:**
- `actions/checkout@v3`: 코드 체크아웃
- `actions/setup-node@v3`: Node.js 환경 설정
- `actions/setup-python@v4`: Python 환경 설정
- `vercel/action`: Vercel 배포

#### 2.2.6 Runner (러너)

**Runner**는 워크플로우를 실행하는 서버입니다.

**종류:**
- **GitHub-hosted runners**: GitHub에서 제공하는 무료 러너
  - `ubuntu-latest` (Ubuntu 22.04)
  - `windows-latest` (Windows Server 2022)
  - `macos-latest` (macOS 12)
- **Self-hosted runners**: 자신의 서버에서 실행하는 러너

---

## GitHub Actions 설정 방법

### 3.1 기본 설정 절차

#### 1단계: 워크플로우 파일 생성

프로젝트 루트에 `.github/workflows/` 폴더를 생성하고 YAML 파일을 만듭니다.

```bash
mkdir -p .github/workflows
touch .github/workflows/ci.yml
```

#### 2단계: 워크플로우 작성

`.github/workflows/ci.yml` 파일을 편집합니다.

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run linter
      run: npm run lint
```

#### 3단계: 커밋 및 푸시

```bash
git add .github/workflows/ci.yml
git commit -m "Add CI workflow"
git push origin main
```

#### 4단계: GitHub에서 확인

GitHub 저장소의 **Actions** 탭에서 워크플로우 실행 상태를 확인할 수 있습니다.

### 3.2 환경 변수 설정

#### Secrets 설정

민감한 정보(API 키, 비밀번호 등)는 GitHub Secrets에 저장합니다.

**설정 방법:**
1. GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** 클릭
3. 이름과 값 입력
4. 워크플로우에서 사용:

```yaml
- name: Use secret
  env:
    API_KEY: ${{ secrets.API_KEY }}
  run: echo "API key is set"
```

**주요 Secrets (이 프로젝트용):**
- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_ANON_KEY`: Supabase Anon Key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role Key
- `NAVER_CLIENT_ID`: 네이버 API Client ID
- `NAVER_CLIENT_SECRET`: 네이버 API Client Secret
- `GEMINI_API_KEY`: Gemini API Key
- `KAKAO_APP_KEY`: 카카오 앱 키

### 3.3 워크플로우 파일 구조

```yaml
name: Workflow Name          # 워크플로우 이름

on:                          # 트리거
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:                         # 환경 변수 (전역)
  NODE_VERSION: '18'

jobs:                        # 작업들
  job-name:                  # 작업 이름
    runs-on: ubuntu-latest   # 러너
    
    env:                     # 작업별 환경 변수
      CUSTOM_VAR: 'value'
    
    steps:                   # 단계들
      - name: Step name
        uses: action@version
        with:
          input: value
      
      - name: Run command
        run: command
```

---

## Next.js 프로젝트용 GitHub Actions 예제

### 4.1 기본 CI 워크플로우

`.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

### 4.2 Vercel 자동 배포 워크플로우

`.github/workflows/deploy.yml`

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 4.3 Preview 배포 워크플로우

`.github/workflows/preview.yml`

```yaml
name: Preview Deployment

on:
  pull_request:
    branches: [ main ]

jobs:
  preview:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Deploy Preview
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 4.4 코드 품질 검사 워크플로우

`.github/workflows/code-quality.yml`

```yaml
name: Code Quality

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  quality:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
      
      - name: Run Prettier check
        run: npm run format:check
      
      - name: Type check
        run: npm run type-check
      
      - name: Check build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

---

## 실전 설정 가이드

### 5.1 Habitree Reading Hub 프로젝트 설정

#### 5.1.1 필수 Secrets 설정

GitHub 저장소에서 다음 Secrets를 설정해야 합니다:

1. **GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret**

| Secret 이름 | 설명 | 예시 |
|------------|------|------|
| `SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Anon Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NAVER_CLIENT_ID` | 네이버 API Client ID | `your_naver_client_id` |
| `NAVER_CLIENT_SECRET` | 네이버 API Client Secret | `your_naver_client_secret` |
| `GEMINI_API_KEY` | Gemini API Key | `your_gemini_api_key` |
| `KAKAO_APP_KEY` | 카카오 앱 키 | `your_kakao_app_key` |
| `VERCEL_TOKEN` | Vercel 배포 토큰 | `your_vercel_token` |
| `VERCEL_ORG_ID` | Vercel 조직 ID | `your_org_id` |
| `VERCEL_PROJECT_ID` | Vercel 프로젝트 ID | `your_project_id` |

#### 5.1.2 기본 CI 워크플로우 생성

`.github/workflows/ci.yml` 파일을 생성합니다:

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
        continue-on-error: true
      
      - name: Run type check
        run: npm run type-check || npx tsc --noEmit
        continue-on-error: true
      
      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_APP_URL: https://readingtree.vercel.app
```

#### 5.1.3 Vercel 배포 워크플로우 생성

`.github/workflows/deploy.yml` 파일을 생성합니다:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_APP_URL: https://readingtree.vercel.app
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 5.2 Vercel 토큰 및 ID 얻기

#### Vercel 토큰 생성

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. **Settings** → **Tokens** 이동
3. **Create Token** 클릭
4. 토큰 이름 입력 후 생성
5. 생성된 토큰을 GitHub Secrets에 추가

#### Vercel Org ID 및 Project ID 얻기

1. Vercel 프로젝트 페이지 접속
2. **Settings** → **General** 이동
3. **Project ID** 확인
4. **Team ID** 또는 **User ID** 확인 (Org ID)

또는 Vercel CLI 사용:

```bash
npm i -g vercel
vercel login
vercel link
# .vercel/project.json 파일에서 확인 가능
```

### 5.3 워크플로우 테스트

#### 로컬에서 테스트

GitHub Actions는 로컬에서 직접 테스트할 수 없지만, [act](https://github.com/nektos/act) 도구를 사용할 수 있습니다:

```bash
# act 설치 (Windows)
choco install act-cli

# 워크플로우 실행
act push
```

#### GitHub에서 테스트

1. 워크플로우 파일을 커밋하고 푸시
2. GitHub 저장소의 **Actions** 탭에서 확인
3. 워크플로우가 자동으로 실행됨
4. 각 단계의 로그를 확인하여 문제 해결

### 5.4 일반적인 문제 해결

#### 문제 1: Secrets를 찾을 수 없음

**에러:**
```
Error: Secret not found: SUPABASE_URL
```

**해결:**
- GitHub 저장소 → Settings → Secrets에서 Secret이 올바르게 설정되었는지 확인
- Secret 이름이 대소문자를 정확히 일치하는지 확인

#### 문제 2: 빌드 실패

**에러:**
```
Error: Command "npm run build" exited with code 1
```

**해결:**
- 로컬에서 `npm run build` 실행하여 문제 확인
- 환경 변수가 모두 설정되었는지 확인
- `.env.local` 파일이 필요하면 `.env.example` 생성

#### 문제 3: Vercel 배포 실패

**에러:**
```
Error: Vercel deployment failed
```

**해결:**
- Vercel 토큰이 유효한지 확인
- Org ID와 Project ID가 올바른지 확인
- Vercel 프로젝트가 이미 연결되어 있는지 확인

### 5.5 워크플로우 최적화

#### 캐싱 활용

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'  # npm 캐시 자동 사용
```

#### 병렬 작업

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [...]
  
  test:
    runs-on: ubuntu-latest
    steps: [...]
  
  build:
    runs-on: ubuntu-latest
    needs: [lint, test]  # lint와 test 완료 후 실행
    steps: [...]
```

#### 조건부 실행

```yaml
- name: Deploy
  if: github.ref == 'refs/heads/main'  # main 브랜치에서만 실행
  run: npm run deploy
```

---

## 추가 리소스

### 공식 문서
- [GitHub Actions 공식 문서](https://docs.github.com/en/actions)
- [GitHub Actions 워크플로우 문법](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub Actions 예제](https://github.com/actions/starter-workflows)

### 유용한 Actions
- [actions/checkout](https://github.com/actions/checkout): 코드 체크아웃
- [actions/setup-node](https://github.com/actions/setup-node): Node.js 설정
- [vercel/action](https://github.com/amondnet/vercel-action): Vercel 배포
- [peaceiris/actions-gh-pages](https://github.com/peaceiris/actions-gh-pages): GitHub Pages 배포

### 학습 자료
- [GitHub Actions 시작하기](https://docs.github.com/en/actions/quickstart)
- [GitHub Actions로 CI/CD 구축하기](https://docs.github.com/en/actions/guides)

---

## 체크리스트

프로젝트에 GitHub Actions를 설정할 때 다음을 확인하세요:

- [ ] `.github/workflows/` 폴더 생성
- [ ] CI 워크플로우 파일 생성
- [ ] 필요한 Secrets 설정
- [ ] 워크플로우 파일 커밋 및 푸시
- [ ] GitHub Actions 탭에서 실행 확인
- [ ] 빌드 및 테스트가 정상 작동하는지 확인
- [ ] 배포 워크플로우 설정 (필요시)
- [ ] Preview 배포 설정 (필요시)

---

**문서 끝**

