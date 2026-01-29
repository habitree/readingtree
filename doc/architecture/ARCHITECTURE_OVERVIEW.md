# ReadTree v4.0.0 아키텍처 개요

> **최종 업데이트**: 2026-01-29
> **목적**: 프로젝트 전체 아키텍처 및 기술 스택 문서화

---

## 목차

1. [기술 스택](#1-기술-스택)
2. [프로젝트 구조](#2-프로젝트-구조)
3. [데이터 흐름](#3-데이터-흐름)
4. [인증 아키텍처](#4-인증-아키텍처)
5. [데이터베이스 설계](#5-데이터베이스-설계)
6. [주요 기능 아키텍처](#6-주요-기능-아키텍처)
7. [배포 환경](#7-배포-환경)

---

## 1. 기술 스택

### 1.1 프론트엔드

| 기술 | 버전 | 용도 |
|------|------|------|
| **Next.js** | 15.x | React 프레임워크 (App Router) |
| **React** | 19.x | UI 라이브러리 |
| **TypeScript** | 5.x | 타입 안전성 |
| **Tailwind CSS** | 3.x | 스타일링 |
| **shadcn/ui** | - | UI 컴포넌트 라이브러리 |
| **Lucide Icons** | - | 아이콘 |
| **Recharts** | - | 차트 라이브러리 |

### 1.2 백엔드 & 데이터베이스

| 기술 | 용도 |
|------|------|
| **Supabase** | BaaS (Backend as a Service) |
| **PostgreSQL** | 관계형 데이터베이스 |
| **Row Level Security (RLS)** | 데이터 접근 제어 |
| **Supabase Auth** | 인증 (OAuth, Email) |
| **Supabase Storage** | 파일 저장 (이미지) |

### 1.3 외부 API

| API | 용도 |
|-----|------|
| **Naver 도서 API** | 책 검색 및 정보 조회 |
| **Gemini API** | AI 기능 (채팅, 요약, 페르소나) |
| **Google Cloud Vision** | OCR (광학 문자 인식) |
| **Kakao OAuth** | 소셜 로그인 |

### 1.4 배포 & 인프라

| 기술 | 용도 |
|------|------|
| **Vercel** | 프론트엔드 배포 |
| **Supabase Cloud** | 데이터베이스 호스팅 |
| **GitHub Actions** | CI/CD |

---

## 2. 프로젝트 구조

```
readingtree_v4.0.0/
├── app/                          # Next.js App Router
│   ├── actions/                  # Server Actions
│   │   ├── ai/                   # AI 관련 Actions
│   │   │   ├── chat.ts           # AI 채팅
│   │   │   ├── persona.ts        # 페르소나 분석
│   │   │   ├── ocr.ts            # OCR 처리
│   │   │   ├── settings.ts       # AI 설정
│   │   │   ├── summarization.ts  # 요약
│   │   │   └── index.ts          # 인덱스
│   │   ├── auth.ts               # 인증
│   │   ├── books.ts              # 책 관리
│   │   ├── bookshelves.ts        # 서재 관리
│   │   ├── notes.ts              # 기록 관리
│   │   ├── groups.ts             # 독서모임
│   │   ├── profile.ts            # 프로필
│   │   ├── stats.ts              # 통계
│   │   ├── search.ts             # 검색
│   │   ├── share.ts              # 공유
│   │   └── ...
│   ├── api/                      # API Routes
│   │   ├── auth/                 # OAuth 콜백
│   │   ├── chat/                 # AI 채팅 스트리밍
│   │   ├── ocr/                  # OCR 처리
│   │   └── ...
│   ├── (auth)/                   # 인증 페이지 그룹
│   │   ├── login/
│   │   ├── signup/
│   │   ├── verify-email/
│   │   └── onboarding/
│   ├── (main)/                   # 메인 기능 페이지 그룹
│   │   ├── books/
│   │   ├── bookshelves/
│   │   ├── notes/
│   │   ├── groups/
│   │   ├── chat/
│   │   ├── persona/
│   │   ├── profile/
│   │   ├── timeline/
│   │   ├── search/
│   │   ├── admin/
│   │   └── ...
│   ├── share/                    # 공개 공유 페이지
│   └── layout.tsx                # 루트 레이아웃
│
├── components/                   # UI 컴포넌트
│   ├── ai/                       # AI 기능
│   │   ├── chat/                 # 채팅 컴포넌트
│   │   └── admin/                # AI 관리자 컴포넌트
│   ├── auth/                     # 인증 컴포넌트
│   ├── books/                    # 책 관련 컴포넌트
│   ├── bookshelves/              # 서재 컴포넌트
│   ├── notes/                    # 기록 컴포넌트
│   ├── groups/                   # 독서모임 컴포넌트
│   ├── dashboard/                # 대시보드 컴포넌트
│   ├── timeline/                 # 타임라인 컴포넌트
│   ├── search/                   # 검색 컴포넌트
│   ├── profile/                  # 프로필 컴포넌트
│   ├── persona/                  # 페르소나 컴포넌트
│   ├── admin/                    # 관리자 컴포넌트
│   ├── landing/                  # 랜딩 페이지 컴포넌트
│   ├── onboarding/               # 온보딩 컴포넌트
│   ├── layout/                   # 레이아웃 컴포넌트
│   ├── theme/                    # 테마 컴포넌트
│   ├── share/                    # 공유 컴포넌트
│   ├── ui/                       # shadcn/ui 컴포넌트
│   └── error-boundary.tsx        # 에러 바운더리
│
├── hooks/                        # Custom Hooks
│   ├── use-auth.ts               # 인증 상태
│   ├── use-books.ts              # 책 데이터
│   ├── use-notes.ts              # 기록 데이터
│   ├── use-groups.ts             # 모임 데이터
│   ├── use-stats.ts              # 통계 데이터
│   ├── use-search.ts             # 검색
│   ├── use-note-form.ts          # 기록 폼
│   ├── use-ocr-status.ts         # OCR 상태
│   ├── use-style.ts              # 스타일 유틸
│   ├── use-media-query.ts        # 반응형
│   └── use-mobile-note-sheet.ts  # 모바일 시트
│
├── types/                        # TypeScript 타입 정의
│   ├── database.ts               # Supabase 자동 생성 타입
│   ├── user.ts                   # 사용자 타입
│   ├── book.ts                   # 책 타입
│   ├── bookshelf.ts              # 서재 타입
│   ├── note.ts                   # 기록 타입
│   ├── group.ts                  # 모임 타입
│   ├── points.ts                 # 포인트 타입
│   └── feature-request.ts        # 기능 요청 타입
│
├── lib/                          # 유틸리티 및 설정
│   ├── supabase/                 # Supabase 클라이언트
│   │   ├── client.ts             # 브라우저 클라이언트
│   │   ├── server.ts             # 서버 클라이언트
│   │   ├── middleware.ts         # 미들웨어 클라이언트
│   │   └── admin.ts              # Admin 클라이언트
│   ├── api/                      # 외부 API 래퍼
│   │   ├── naver.ts              # Naver 도서 API
│   │   ├── gemini.ts             # Gemini API
│   │   └── ocr.ts                # Google Cloud Vision
│   └── utils/                    # 유틸리티 함수
│
├── contexts/                     # React Context
│   └── auth-context.tsx          # 인증 컨텍스트
│
├── middleware.ts                 # Next.js 미들웨어
│
├── doc/                          # 문서
│   ├── architecture/             # 아키텍처 문서
│   ├── database/                 # DB 스키마, 마이그레이션
│   ├── claude/                   # Claude Code 규칙
│   ├── cleanup/                  # 정리 문서
│   ├── operations/               # 운영 문서
│   ├── roadmap/                  # 로드맵
│   └── question/                 # Q&A 아카이브
│
└── .agent/                       # Agent 규칙 (원본)
    └── rules/
```

---

## 3. 데이터 흐름

### 3.1 레이어 분리 원칙

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ components/ │  │   hooks/    │  │   contexts/     │  │
│  │ (화면 렌더링) │  │ (상태 관리)  │  │ (전역 상태)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│         │                │                  │           │
│         └────────────────┼──────────────────┘           │
│                          ↓                              │
├─────────────────────────────────────────────────────────┤
│                   Action Layer                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              app/actions/                         │   │
│  │        (Server Actions - DB 접근 유일 지점)         │   │
│  └──────────────────────────────────────────────────┘   │
│                          ↓                              │
├─────────────────────────────────────────────────────────┤
│                   Data Layer                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │              lib/supabase/                        │   │
│  │           (Supabase 클라이언트)                    │   │
│  └──────────────────────────────────────────────────┘   │
│                          ↓                              │
├─────────────────────────────────────────────────────────┤
│                   Database                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Supabase (PostgreSQL + RLS)             │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 3.2 데이터 흐름 규칙

| 레이어 | 허용 | 금지 |
|--------|------|------|
| **components/** | hooks 사용, UI 렌더링 | Supabase 직접 접근, 테이블명 노출 |
| **hooks/** | Server Actions 호출, 상태 관리 | Supabase 직접 접근 |
| **app/actions/** | Supabase 쿼리, 타입 명시 | React hooks, 브라우저 API |
| **lib/supabase/** | 클라이언트 생성 | 쿼리 함수 작성 |

### 3.3 코드 예시

```typescript
// ✅ 올바른 데이터 흐름

// 1. Server Action (app/actions/books.ts)
"use server";
export async function getBooks() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("books").select("*");
  return data;
}

// 2. Hook (hooks/use-books.ts)
export function useBooks() {
  const [books, setBooks] = useState([]);
  useEffect(() => {
    getBooks().then(setBooks);
  }, []);
  return { books };
}

// 3. Component (components/books/book-list.tsx)
export function BookList() {
  const { books } = useBooks();
  return <ul>{books.map(book => <li>{book.title}</li>)}</ul>;
}
```

---

## 4. 인증 아키텍처

### 4.1 인증 흐름

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  Supabase   │────▶│   Kakao     │
│  (브라우저)   │     │    Auth     │     │   OAuth     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │◀──────────────────┘
       │                   │     (토큰 반환)
       │◀──────────────────┘
       │     (세션 쿠키 설정)
       │
       ▼
┌─────────────┐
│  middleware │ (세션 갱신)
└─────────────┘
```

### 4.2 세션 관리 원칙

```
✅ 세션 읽기 → app/actions/auth.ts의 getCurrentUser()
✅ 세션 갱신 → lib/supabase/middleware.ts (자동)
✅ 클라이언트 → 서버에서 받은 정보만 표시
❌ 클라이언트에서 getUser() 직접 호출 금지
```

### 4.3 인증 코드 패턴

```typescript
// Server Component / Server Actions
import { getCurrentUser } from "@/app/actions/auth";
const user = await getCurrentUser();

// Client Component
import { useAuth } from "@/hooks/use-auth";
const { user } = useAuth();
```

---

## 5. 데이터베이스 설계

### 5.1 주요 테이블

| 테이블 | 설명 | 소유 구조 |
|--------|------|----------|
| `users` | 사용자 프로필 | 개인 |
| `books` | 책 정보 | 공개 |
| `user_books` | 사용자-책 관계 | 개인 |
| `bookshelves` | 서재 | 개인 |
| `notes` | 기록 | 개인/공개 |
| `groups` | 독서모임 | 그룹 |
| `group_members` | 모임 멤버 | 그룹 |
| `group_books` | 모임 책 | 그룹 |
| `group_notes` | 공유 기록 | 그룹 |
| `chat_sessions` | AI 채팅 세션 | 개인 |
| `chat_messages` | 채팅 메시지 | 개인 |
| `user_personas` | 페르소나 | 개인 |

### 5.2 RLS (Row Level Security) 원칙

```sql
-- 모든 테이블에 적용되는 기본 패턴
-- SELECT: 자신의 데이터만 조회
CREATE POLICY "select_own" ON table_name FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: 자신의 데이터만 생성
CREATE POLICY "insert_own" ON table_name FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: 자신의 데이터만 수정
CREATE POLICY "update_own" ON table_name FOR UPDATE
    USING (auth.uid() = user_id);

-- DELETE: 자신의 데이터만 삭제
CREATE POLICY "delete_own" ON table_name FOR DELETE
    USING (auth.uid() = user_id);
```

### 5.3 ER 다이어그램 (간략)

```
auth.users (Supabase Auth)
    ↓ (1:1)
users
    ├──→ user_books ←──→ books
    │         ↓
    │    bookshelves
    │
    ├──→ notes ←──→ books
    │         ↓
    │    group_notes
    │
    ├──→ groups
    │         ↓
    │    group_members
    │         ↓
    │    group_books ←──→ books
    │
    ├──→ chat_sessions
    │         ↓
    │    chat_messages
    │
    └──→ user_personas
```

---

## 6. 주요 기능 아키텍처

### 6.1 AI 채팅

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  채팅 UI    │────▶│  API Route  │────▶│  Gemini API │
│             │     │ (스트리밍)   │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   ▼
       │            ┌─────────────┐
       │            │  Supabase   │
       │            │ (대화 저장)  │
       │            └─────────────┘
       │                   │
       └───────────────────┘
              (실시간 응답)
```

### 6.2 OCR 처리

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  이미지 업로드 │────▶│  Supabase   │────▶│ Cloud Vision│
│             │     │   Storage   │     │    (OCR)    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   notes     │◀────│ transcriptions│
                    │  (기록 저장) │     │ (텍스트 저장) │
                    └─────────────┘     └─────────────┘
```

### 6.3 독서모임 기록 공유

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  개인 기록   │────▶│ group_notes │────▶│  모임 피드   │
│   (notes)   │     │  (공유 연결) │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                           ↑
                    ┌─────────────┐
                    │   groups    │
                    │  (모임 정보) │
                    └─────────────┘
```

---

## 7. 배포 환경

### 7.1 환경 구성

| 환경 | URL | 용도 |
|------|-----|------|
| Production | `habitree.vercel.app` | 프로덕션 |
| Preview | `*.vercel.app` | PR 미리보기 |
| Development | `localhost:3000` | 로컬 개발 |

### 7.2 환경 변수

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# External APIs
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
GEMINI_API_KEY=
GOOGLE_CLOUD_VISION_API_KEY=

# Kakao OAuth
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
```

### 7.3 CI/CD 파이프라인

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   GitHub    │────▶│   Vercel    │────▶│  Production │
│   (Push)    │     │   (Build)   │     │   (Deploy)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐
│   GitHub    │
│   Actions   │
│ (Lint, Test)│
└─────────────┘
```

---

## 참고 문서

| 문서 | 경로 |
|------|------|
| 프로젝트 규칙 | `doc/claude/RULES.md` |
| 데이터 모델 | `doc/database/DATA_MODEL.md` |
| 기능별 파일 매핑 | `doc/architecture/FEATURE_MAP.md` |
| 의존성 규칙 | `doc/architecture/DEPENDENCY_RULES.md` |
| 모듈 맵 | `doc/architecture/MODULE_MAP.md` |

---

**이 문서는 프로젝트 아키텍처 기준 문서입니다.**
