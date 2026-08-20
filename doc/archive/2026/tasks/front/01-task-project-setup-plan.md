# TASK-01: 프로젝트 초기화 및 인프라 설정

**작업 ID:** TASK-01  
**우선순위:** P0 (Must Have)  
**예상 소요 시간:** 1일  
**의존성:** 없음  
**다음 작업:** TASK-02, TASK-03

---

## 작업 개요

Next.js 14 기반 프로젝트를 초기화하고, 개발에 필요한 모든 인프라와 설정을 구성합니다. 이 작업은 모든 후속 작업의 기반이 되므로 가장 먼저 완료되어야 합니다.

---

## 작업 범위

### 포함 사항
- ✅ Next.js 14 프로젝트 초기화 (App Router)
- ✅ TypeScript 설정
- ✅ Tailwind CSS 설정
- ✅ shadcn/ui 설치 및 초기 설정
- ✅ Supabase 클라이언트 설정 (클라이언트/서버/미들웨어)
- ✅ 환경 변수 설정
- ✅ 기본 폴더 구조 생성
- ✅ ESLint, Prettier 설정
- ✅ Git 설정 및 .gitignore

### 제외 사항
- ❌ 실제 기능 구현 (TASK-02 이후)
- ❌ 데이터베이스 스키마 생성 (백엔드 작업)
- ❌ API 구현 (각 기능 작업에서)

---

## 기술 스택

| 항목 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js | 14+ |
| 언어 | TypeScript | 5+ |
| 스타일링 | Tailwind CSS | 3+ |
| UI 라이브러리 | shadcn/ui | latest |
| 데이터베이스 클라이언트 | @supabase/ssr | latest |
| 폼 관리 | React Hook Form | 7+ |
| 검증 | Zod | 3+ |
| 아이콘 | Lucide React | latest |
| 개발 도구 | ESLint, Prettier | latest |

---

## 상세 작업 목록

### 1. 프로젝트 초기화

```bash
# Next.js 프로젝트 생성
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"

# 필요한 패키지 설치
npm install @supabase/ssr @supabase/supabase-js
npm install react-hook-form zod @hookform/resolvers
npm install lucide-react
npm install date-fns
npm install clsx tailwind-merge
```

### 2. shadcn/ui 초기화

```bash
# shadcn/ui 초기화
npx shadcn-ui@latest init

# 기본 컴포넌트 설치 (나중에 TASK-02에서 추가 설치)
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
```

### 3. Supabase 클라이언트 설정

**파일 구조:**
```
lib/
├── supabase/
│   ├── client.ts          # 클라이언트 사이드
│   ├── server.ts          # 서버 사이드
│   └── middleware.ts      # 미들웨어
```

### 4. 환경 변수 설정

`.env.example` 파일 생성:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Naver API
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Kakao
NEXT_PUBLIC_KAKAO_APP_KEY=your_kakao_app_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. 기본 폴더 구조 생성

```
app/
├── (auth)/
├── (main)/
├── api/
├── share/
├── layout.tsx
├── globals.css
└── error.tsx

components/
├── layout/
├── auth/
├── books/
├── notes/
├── groups/
├── timeline/
├── share/
└── ui/

lib/
├── supabase/
├── api/
├── utils/
└── validations/

hooks/
types/
contexts/
public/
```

### 6. TypeScript 설정

`tsconfig.json`에 path alias 설정 확인:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 7. ESLint 및 Prettier 설정

`.eslintrc.json`, `.prettierrc` 파일 생성 및 설정

---

## 파일 구조

### 생성해야 할 파일

```
.
├── .env.example
├── .env.local (로컬에서만, gitignore)
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── components.json (shadcn/ui)
├── middleware.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   └── utils/
│       └── cn.ts
└── app/
    ├── layout.tsx
    ├── globals.css
    └── error.tsx
```

---

## API 인터페이스

이 작업에서는 API를 구현하지 않지만, Supabase 클라이언트 인터페이스를 정의합니다.

### Supabase 클라이언트 타입

```typescript
// lib/supabase/client.ts
export function createClient() {
  // 클라이언트 사이드 Supabase 클라이언트 반환
}

// lib/supabase/server.ts
export function createServerClient() {
  // 서버 사이드 Supabase 클라이언트 반환
}

// lib/supabase/middleware.ts
export function createMiddlewareClient() {
  // 미들웨어용 Supabase 클라이언트 반환
}
```

---

## 검증 체크리스트

작업 완료 후 다음을 확인하세요:

- [ ] `npm run dev`로 프로젝트가 정상 실행됨
- [ ] TypeScript 컴파일 오류 없음
- [ ] Tailwind CSS가 정상 작동함
- [ ] shadcn/ui 컴포넌트가 정상 렌더링됨
- [ ] Supabase 클라이언트가 정상 연결됨 (환경 변수 설정 후)
- [ ] ESLint, Prettier가 정상 작동함
- [ ] 모든 폴더 구조가 생성됨

---

## 개발 프롬프트

다음 프롬프트를 사용하여 이 작업을 수행하세요:

```
다음 문서들을 참고하여 Next.js 14 기반 프로젝트를 초기화하고 인프라를 설정해주세요.

참고 문서:
- doc/software_design.md (기술 스택, 폴더 구조)
- doc/Habitree-Reading-Hub-PRD.md (전체 요구사항)
- doc/review_issues.md (주의사항)

작업 내용:
1. Next.js 14 프로젝트 초기화 (App Router, TypeScript, Tailwind CSS)
2. shadcn/ui 설치 및 초기 설정
3. Supabase 클라이언트 설정 (클라이언트/서버/미들웨어)
4. 환경 변수 파일 생성 (.env.example)
5. 기본 폴더 구조 생성 (software_design.md의 5.1 섹션 참고)
6. ESLint, Prettier 설정
7. 필수 패키지 설치 (React Hook Form, Zod, Lucide React 등)

주의사항:
- software_design.md의 폴더 구조를 정확히 따를 것
- Supabase는 @supabase/ssr 패키지 사용 (구식 auth-helpers 아님)
- 모든 설정 파일은 문서화할 것
- .env.local은 .gitignore에 포함할 것

완료 후:
- README.md에 프로젝트 설정 방법 문서화
- 각 설정 파일에 주석 추가
```

---

## 참고 문서

### 필수 참고
- [software_design.md](../../software_design.md) - 2.2 기술 스택, 5.1 폴더 구조
- [Habitree-Reading-Hub-PRD.md](../../Habitree-Reading-Hub-PRD.md) - 6. 기술 스택
- [review_issues.md](../../review_issues.md) - 9. 미들웨어 인증 방식

### 추가 참고
- [Next.js 공식 문서](https://nextjs.org/docs)
- [Supabase SSR 가이드](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [shadcn/ui 문서](https://ui.shadcn.com/)

---

## 다음 작업 준비

이 작업 완료 후:
1. TASK-02 작업자에게 프로젝트 구조 공유
2. TASK-03 작업자에게 Supabase 클라이언트 사용법 안내
3. 환경 변수는 각자 로컬에서 설정하도록 안내

---

**문서 끝**

