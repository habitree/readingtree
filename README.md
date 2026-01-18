# Habitree Reading Hub

독서 기록 및 공유 플랫폼

## 프로젝트 개요

Habitree Reading Hub는 독서를 좋아하는 사람들이 인상 깊었던 문장을 다시 찾고, 흩어진 기록을 한 곳에서 관리하며, 쉽게 공유할 수 있게 해주는 책 전용 기록·공유 플랫폼입니다.

## 기술 스택

- **프레임워크**: Next.js 14+ (App Router)
- **언어**: TypeScript 5+
- **스타일링**: Tailwind CSS 3+
- **UI 라이브러리**: shadcn/ui
- **데이터베이스**: Supabase (PostgreSQL)
- **인증**: Supabase Authentication
- **폼 관리**: React Hook Form + Zod
- **아이콘**: Lucide React

## 시작하기

### 필수 요구사항

- Node.js 18+ 
- npm 또는 yarn
- Supabase 프로젝트

### 설치 방법

1. 저장소 클론
```bash
git clone https://github.com/habitree/readingtree.git
cd readingtree_v4.0.0
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Naver API
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# Google Vision API (OCR)
# 방법 1: API 키 사용
GOOGLE_VISION_API_KEY=your_vision_api_key

# 방법 2: 서비스 계정 JSON 파일 경로 사용
# GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account-key.json

# 방법 3: 서비스 계정 JSON 문자열 사용 (Vercel 등에서 권장)
# GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"..."}

# Kakao
NEXT_PUBLIC_KAKAO_APP_KEY=your_kakao_app_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

```
app/                          # Next.js App Router
├── (auth)/                   # 인증 관련 페이지 그룹
├── (main)/                   # 메인 앱 페이지 그룹
├── api/                      # API Routes
├── share/                    # 공유 페이지
├── layout.tsx                # 루트 레이아웃
├── globals.css               # 전역 스타일
└── error.tsx                 # 에러 페이지

components/                   # 컴포넌트
├── layout/                   # 레이아웃 컴포넌트
├── auth/                     # 인증 컴포넌트
├── books/                    # 책 관련 컴포넌트
├── notes/                    # 기록 관련 컴포넌트
├── groups/                   # 모임 관련 컴포넌트
├── timeline/                 # 타임라인 컴포넌트
├── share/                    # 공유 컴포넌트
└── ui/                       # shadcn/ui 컴포넌트

lib/                          # 라이브러리 및 유틸리티
├── supabase/                 # Supabase 클라이언트
├── api/                      # API 클라이언트
├── utils/                    # 유틸리티 함수
└── validations/              # Zod 스키마

hooks/                        # Custom Hooks
types/                        # TypeScript 타입 정의
contexts/                     # React Context
public/                       # 정적 자산
```

## 주요 스크립트

- `npm run dev` - 개발 서버 실행
- `npm run build` - 프로덕션 빌드
- `npm run start` - 프로덕션 서버 실행
- `npm run lint` - ESLint 실행
- `npm run format` - Prettier 포맷팅

## Supabase 클라이언트 사용법

### 클라이언트 사이드
```typescript
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
```

### 서버 사이드
```typescript
import { createServerSupabaseClient } from "@/lib/supabase/server";

const supabase = await createServerSupabaseClient();
```

### 미들웨어
미들웨어는 자동으로 세션을 갱신하고 보호된 경로를 확인합니다.

## 참고 문서

- [프로젝트 설정 가이드](./doc/tasks/front/01-task-project-setup-plan.md)
- [소프트웨어 디자인 문서](./doc/software_design.md)
- [PRD 문서](./doc/Habitree-Reading-Hub-PRD.md)

## 라이선스

ISC

