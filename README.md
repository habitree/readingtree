# Habitree Reading Hub (ReadTree v4.0.0)

독서 기록 및 공유 플랫폼

## 프로젝트 개요

Habitree의 Read tree는 독서를 좋아하는 사람들이 인상 깊었던 문장을 다시 찾고, 흩어진 기록을 한 곳에서 관리하며, 쉽게 공유할 수 있게 해주는 **책 전용 기록·공유 플랫폼**입니다.

### Why now: AI 시대의 독서와 사유

생성형 AI가 정보를 요약하고 만들어내는 시대일수록, 인간에게 중요한 것은 **'무엇을 믿고 어떻게 판단할지'**입니다.  
ReadTree는 읽고 생각한 흔적을 기록으로 남기고, 다시 찾고, 정리해 **사유를 자산으로 축적**할 수 있게 돕습니다.

### 핵심 가치

- **필사 기록**: 책 속 인상 깊은 문장을 사진으로 찍어 OCR로 텍스트 추출
- **AI 독서 친구**: Gemini 기반 AI 챗봇이 독서 활동을 분석하고 맞춤 추천
- **포인트 & 랭킹**: 기록할수록 성장하는 나무와 레벨 시스템
- **독서 모임**: 함께 읽고 기록을 공유하는 그룹 기능

## 주요 기능

### 독서 기록
- **필사 OCR**: 책 사진을 찍으면 Google Vision API로 텍스트 자동 추출
- **기록 유형**: 인용구, 메모, 사진, 필사 4가지 타입 지원
- **이미지 스탬프**: 날짜/시간 스탬프 자동 삽입
- **책 연결**: `@책제목` 형식으로 다른 책과 연결

### AI 기능
- **AI 챗봇**: Gemini API 기반 독서 상담 및 추천
- **독서 페르소나**: 사용자의 독서 패턴 분석 및 성향 파악
- **책 요약**: AI 기반 책 설명 요약

### 포인트 시스템
- **활동 포인트**: 기록, 독서 완료, 연속 기록 등으로 포인트 획득
- **레벨 시스템**: 포인트에 따른 10단계 레벨
- **랭킹**: 전체 사용자 랭킹 및 경쟁
- **독서 나무**: 성장하는 나무로 시각화

### 서재 관리
- **책 검색**: 네이버 책 API 연동
- **독서 상태**: 읽는 중, 완독, 중단 등 상태 관리
- **책장**: 커스텀 책장으로 책 분류
- **관련 도서**: 책 간 연결 관계 설정

### 독서 모임
- **그룹 생성**: 공개/비공개 독서 모임
- **공유 기록**: 그룹 내 기록 공유
- **진행 현황**: 멤버별 독서 진행 상황

## 기술 스택

### Frontend
- **프레임워크**: Next.js 14+ (App Router)
- **언어**: TypeScript 5+
- **스타일링**: Tailwind CSS 3+
- **UI 라이브러리**: shadcn/ui
- **폼 관리**: React Hook Form + Zod
- **아이콘**: Lucide React
- **애니메이션**: Framer Motion

### Backend & Infrastructure
- **데이터베이스**: Supabase (PostgreSQL)
- **인증**: Supabase Authentication (Kakao, Google OAuth)
- **스토리지**: Supabase Storage
- **배포**: Vercel

### AI & API
- **AI 챗봇**: Google Gemini API
- **OCR**: Google Vision API
- **책 검색**: Naver Books API

## 시작하기

### 필수 요구사항

- Node.js 18+ 
- npm 또는 yarn
- Supabase 프로젝트
- Google Cloud 프로젝트 (Vision API, Gemini API)
- Naver Developers 앱

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

# Naver API (책 검색)
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# Google Vision API (OCR)
GOOGLE_VISION_API_KEY=your_vision_api_key
# 또는 서비스 계정 사용
# GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account-key.json
# GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Google Gemini API (AI 챗봇)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Kakao OAuth
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
app/
├── (auth)/                   # 인증 관련 페이지
│   ├── login/                # 로그인
│   ├── signup/               # 회원가입
│   └── onboarding/           # 온보딩 (동의, 목표 설정, 튜토리얼)
├── (main)/                   # 메인 앱 페이지
│   ├── page.tsx              # 홈 (대시보드)
│   ├── books/                # 서재
│   ├── notes/                # 기록
│   ├── timeline/             # 타임라인
│   ├── search/               # 검색
│   ├── groups/               # 독서 모임
│   ├── chat/                 # AI 챗봇
│   ├── persona/              # 독서 페르소나
│   ├── bookshelves/          # 책장 관리
│   ├── profile/              # 프로필
│   └── admin/                # 관리자
├── actions/                  # Server Actions (데이터베이스 접근)
│   ├── auth.ts               # 인증
│   ├── books.ts              # 책
│   ├── notes.ts              # 기록
│   ├── points.ts             # 포인트
│   ├── ai/                   # AI 관련 액션
│   └── ...
├── api/                      # API Routes
│   ├── ai/                   # AI API
│   ├── books/                # 책 검색 API
│   ├── ocr/                  # OCR API
│   └── upload/               # 파일 업로드
├── share/                    # 공개 공유 페이지
└── callback/                 # OAuth 콜백

components/
├── ui/                       # shadcn/ui 기본 컴포넌트
├── layout/                   # 레이아웃 (헤더, 사이드바, 네비게이션)
├── dashboard/                # 대시보드 섹션
├── books/                    # 책 관련 컴포넌트
├── notes/                    # 기록 관련 컴포넌트
├── points/                   # 포인트/랭킹 컴포넌트
├── chat/                     # AI 챗봇 컴포넌트
├── groups/                   # 모임 컴포넌트
├── timeline/                 # 타임라인 컴포넌트
├── share/                    # 공유 컴포넌트
└── auth/                     # 인증 컴포넌트

lib/
├── supabase/                 # Supabase 클라이언트
│   ├── client.ts             # 브라우저용
│   ├── server.ts             # 서버용
│   └── middleware.ts         # 미들웨어용
├── ai/                       # AI 관련 유틸리티
│   ├── gemini.ts             # Gemini API 클라이언트
│   ├── prompts/              # AI 프롬프트
│   └── utils/                # AI 유틸리티
├── api/                      # 외부 API 클라이언트
│   ├── naver-books.ts        # 네이버 책 API
│   └── google-vision.ts      # Google Vision API
└── utils/                    # 공통 유틸리티

hooks/                        # Custom React Hooks
├── use-auth.ts               # 인증 상태
├── use-books.ts              # 책 데이터
├── use-notes.ts              # 기록 데이터
└── ...

types/                        # TypeScript 타입 정의
├── database.ts               # Supabase 테이블 타입
├── book.ts                   # 책 타입
├── note.ts                   # 기록 타입
├── points.ts                 # 포인트 타입
└── ai/                       # AI 관련 타입

contexts/                     # React Context
└── auth-context.tsx          # 인증 컨텍스트

doc/                          # 문서
├── database/                 # 데이터베이스 스키마 및 마이그레이션
├── governance/               # 개발 규칙 문서
├── plans/                    # 기능 계획 문서
└── question/                 # Q&A 문서
```

## 데이터 레이어 규칙

이 프로젝트는 **엄격한 레이어 분리**를 따릅니다:

- **UI 레이어** (`components/`): 화면 렌더링만 담당, DB 직접 접근 금지
- **Hooks** (`hooks/`): 상태 관리 및 Server Actions 호출
- **Server Actions** (`app/actions/`): 유일한 DB 접근 레이어
- **lib** (`lib/`): 클라이언트 생성, 유틸리티 (쿼리 함수 금지)

자세한 규칙은 `.cursor/rules/` 폴더의 규칙 파일들을 참조하세요.

## 주요 스크립트

```bash
npm run dev        # 개발 서버 실행
npm run build      # 프로덕션 빌드
npm run start      # 프로덕션 서버 실행
npm run lint       # ESLint 실행
npm run format     # Prettier 포맷팅
```

## 참고 문서

- [데이터 모델](./doc/database/DATA_MODEL.md)
- [소프트웨어 디자인](./doc/software_design.md)
- [PRD 문서](./doc/ReadTree-PRD.md)
- [UI/데이터 접근 규칙](./doc/governance/UI_DATA_ACCESS_RULES.md)
- [인증/세션 규칙](./doc/governance/AUTH_SESSION_RULES.md)

## 라이선스

ISC
