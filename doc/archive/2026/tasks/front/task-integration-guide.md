# 프론트엔드 개발 작업 통합 가이드

**버전:** 1.0  
**작성일:** 2025년 12월  
**프로젝트:** Habitree Reading Hub  
**관련 문서:**
- [Habitree-Reading-Hub-PRD.md](../../Habitree-Reading-Hub-PRD.md)
- [software_design.md](../../software_design.md)
- [user_stories.md](../../user_stories.md)

---

## 목차
1. [작업 개요](#작업-개요)
2. [작업 순서 및 의존성](#작업-순서-및-의존성)
3. [작업 단위별 상세](#작업-단위별-상세)
4. [통합 가이드라인](#통합-가이드라인)
5. [공통 규칙](#공통-규칙)

---

## 작업 개요

프론트엔드 개발을 **10개의 독립적인 작업 단위**로 분리하여 병렬 개발이 가능하도록 구성했습니다. 각 작업은 명확한 인터페이스와 의존성을 가지며, 최종 통합 시 충돌 없이 병합할 수 있습니다.

### 작업 단위 목록

| 순서 | 작업 ID | 작업명 | 우선순위 | 예상 소요 시간 |
|------|---------|--------|----------|---------------|
| 1 | TASK-01 | 프로젝트 초기화 및 인프라 설정 | P0 | 1일 |
| 2 | TASK-02 | 공통 컴포넌트 및 레이아웃 | P0 | 2일 |
| 3 | TASK-03 | 인증 시스템 (로그인/온보딩) | P0 | 2일 |
| 4 | TASK-04 | 책 관리 기능 | P0 | 3일 |
| 5 | TASK-05 | 기록 기능 (CRUD) | P0 | 4일 |
| 6 | TASK-06 | 검색 기능 | P0 | 2일 |
| 7 | TASK-07 | 공유 기능 | P0 | 3일 |
| 8 | TASK-08 | 타임라인 및 통계 | P0 | 2일 |
| 9 | TASK-09 | 독서모임 기능 | P0 | 3일 |
| 10 | TASK-10 | 프로필 관리 | P1 | 1일 |

---

## 작업 순서 및 의존성

### 의존성 다이어그램

```
TASK-01 (프로젝트 초기화)
    ↓
TASK-02 (공통 컴포넌트/레이아웃)
    ↓
TASK-03 (인증 시스템) ──┐
    ↓                    │
TASK-04 (책 관리) ───────┤
    ↓                    │
TASK-05 (기록 기능) ─────┤
    ↓                    │
TASK-06 (검색) ──────────┤
TASK-07 (공유) ─────────┤
TASK-08 (타임라인) ─────┤
TASK-09 (독서모임) ─────┤
TASK-10 (프로필) ───────┘
```

### 병렬 작업 가능 구간

- **Phase 1**: TASK-01 → TASK-02 (순차)
- **Phase 2**: TASK-03 (독립)
- **Phase 3**: TASK-04 → TASK-05 (순차)
- **Phase 4**: TASK-06, TASK-07, TASK-08, TASK-09, TASK-10 (병렬 가능)

---

## 작업 단위별 상세

### TASK-01: 프로젝트 초기화 및 인프라 설정

**의존성:** 없음  
**다음 작업:** TASK-02, TASK-03

**작업 내용:**
- Next.js 14 프로젝트 초기화 (App Router)
- TypeScript 설정
- Tailwind CSS 설정
- shadcn/ui 설치 및 초기 설정
- Supabase 클라이언트 설정
- 환경 변수 설정
- 기본 폴더 구조 생성

**출력물:**
- 프로젝트 기본 구조
- 설정 파일들 (tsconfig.json, tailwind.config.ts 등)
- Supabase 클라이언트 유틸리티

**상세 문서:** [01-task-project-setup-plan.md](./01-task-project-setup-plan.md)

---

### TASK-02: 공통 컴포넌트 및 레이아웃

**의존성:** TASK-01  
**다음 작업:** 모든 기능 작업

**작업 내용:**
- 레이아웃 컴포넌트 (Header, Sidebar, Mobile Nav, Footer)
- 공통 UI 컴포넌트 (shadcn/ui 기반)
- 유틸리티 함수 (cn, date, image 등)
- 타입 정의 (database, book, note, group)
- 전역 스타일 및 테마 설정

**출력물:**
- `components/layout/` 폴더
- `components/ui/` 폴더
- `lib/utils/` 폴더
- `types/` 폴더
- `app/layout.tsx`, `app/globals.css`

**상세 문서:** [02-task-common-components-plan.md](./02-task-common-components-plan.md)

---

### TASK-03: 인증 시스템 (로그인/온보딩)

**의존성:** TASK-01, TASK-02  
**다음 작업:** 모든 기능 작업

**작업 내용:**
- 소셜 로그인 (카카오톡, 구글)
- 온보딩 플로우 (목표 설정, 튜토리얼)
- 인증 미들웨어
- 인증 Context 및 Hooks
- 로그인/회원가입 페이지

**출력물:**
- `app/(auth)/` 폴더
- `components/auth/` 폴더
- `hooks/use-auth.ts`
- `contexts/auth-context.tsx`
- `middleware.ts`

**상세 문서:** [03-task-authentication-plan.md](./03-task-authentication-plan.md)

---

### TASK-04: 책 관리 기능

**의존성:** TASK-01, TASK-02, TASK-03  
**다음 작업:** TASK-05

**작업 내용:**
- 책 검색 (네이버 API 연동)
- 책 추가
- 책 목록 조회
- 책 상세 조회
- 독서 상태 관리
- Server Actions 및 API Routes

**출력물:**
- `app/(main)/books/` 폴더
- `components/books/` 폴더
- `app/api/books/` 폴더
- `lib/api/books.ts`, `lib/api/naver.ts`
- `hooks/use-books.ts`
- `app/actions/books.ts`

**상세 문서:** [04-task-book-management-plan.md](./04-task-book-management-plan.md)

---

### TASK-05: 기록 기능 (CRUD)

**의존성:** TASK-01, TASK-02, TASK-03, TASK-04  
**다음 작업:** TASK-06, TASK-07, TASK-08

**작업 내용:**
- 기록 작성 (필사, 사진, 메모)
- 이미지 업로드
- OCR 처리 연동 (비동기)
- 기록 조회 및 수정/삭제
- 기록 목록 표시
- Server Actions 및 API Routes

**출력물:**
- `app/(main)/notes/` 폴더
- `components/notes/` 폴더
- `app/api/upload/`, `app/api/ocr/` 폴더
- `lib/api/notes.ts`
- `hooks/use-notes.ts`
- `app/actions/notes.ts`

**상세 문서:** [05-task-notes-crud-plan.md](./05-task-notes-crud-plan.md)

---

### TASK-06: 검색 기능

**의존성:** TASK-01, TASK-02, TASK-03, TASK-05  
**다음 작업:** 없음

**작업 내용:**
- 전체 텍스트 검색
- 책 제목 필터
- 날짜 필터
- 태그 필터
- 기록 유형 필터
- 검색 결과 표시

**출력물:**
- `app/(main)/search/` 폴더
- `components/search/` 폴더 (필요시)
- `hooks/use-search.ts`
- `app/api/search/` 폴더

**상세 문서:** [06-task-search-plan.md](./06-task-search-plan.md)

---

### TASK-07: 공유 기능

**의존성:** TASK-01, TASK-02, TASK-03, TASK-05  
**다음 작업:** 없음

**작업 내용:**
- 카드뉴스 생성
- 템플릿 선택
- 인스타그램 공유
- 카카오톡 공유
- 공유 링크 생성
- 공유 페이지

**출력물:**
- `components/share/` 폴더
- `app/api/share/` 폴더
- `app/share/` 폴더

**상세 문서:** [07-task-share-plan.md](./07-task-share-plan.md)

---

### TASK-08: 타임라인 및 통계

**의존성:** TASK-01, TASK-02, TASK-03, TASK-05  
**다음 작업:** 없음

**작업 내용:**
- 타임라인 조회
- 타임라인 정렬
- 독서 통계
- 목표 진행률
- 차트 시각화

**출력물:**
- `app/(main)/timeline/` 폴더
- `components/timeline/` 폴더
- `app/(main)/page.tsx` (대시보드)

**상세 문서:** [08-task-timeline-stats-plan.md](./08-task-timeline-stats-plan.md)

---

### TASK-09: 독서모임 기능

**의존성:** TASK-01, TASK-02, TASK-03, TASK-05  
**다음 작업:** 없음

**작업 내용:**
- 모임 생성
- 모임 참여 신청
- 모임 참여 승인/거부
- 모임 대시보드
- 구성원 진행 상황
- 모임 내 기록 공유

**출력물:**
- `app/(main)/groups/` 폴더
- `components/groups/` 폴더
- `lib/api/groups.ts`
- `hooks/use-groups.ts`
- `app/actions/groups.ts`

**상세 문서:** [09-task-groups-plan.md](./09-task-groups-plan.md)

---

### TASK-10: 프로필 관리

**의존성:** TASK-01, TASK-02, TASK-03  
**다음 작업:** 없음

**작업 내용:**
- 프로필 조회
- 프로필 수정
- 프로필 이미지 업로드
- 독서 목표 수정

**출력물:**
- `app/(main)/profile/` 폴더
- `components/profile/` 폴더 (필요시)
- `app/actions/profile.ts`

**상세 문서:** [10-task-profile-plan.md](./10-task-profile-plan.md)

---

## 통합 가이드라인

### 1. 브랜치 전략

각 작업은 별도의 feature 브랜치에서 진행:

```
main
├── feature/task-01-project-setup
├── feature/task-02-common-components
├── feature/task-03-authentication
├── feature/task-04-book-management
├── feature/task-05-notes-crud
├── feature/task-06-search
├── feature/task-07-share
├── feature/task-08-timeline-stats
├── feature/task-09-groups
└── feature/task-10-profile
```

### 2. 병합 순서

1. **Phase 1**: TASK-01 → main
2. **Phase 2**: TASK-02 → main
3. **Phase 3**: TASK-03 → main
4. **Phase 4**: TASK-04 → main
5. **Phase 5**: TASK-05 → main
6. **Phase 6**: TASK-06, TASK-07, TASK-08, TASK-09, TASK-10 → main (병렬 병합 가능)

### 3. 충돌 방지 규칙

- **파일 경로 분리**: 각 작업은 명확히 분리된 폴더에 파일 생성
- **공통 파일 수정 금지**: TASK-02에서 생성한 공통 컴포넌트는 다른 작업에서 수정하지 않음
- **타입 정의**: `types/` 폴더의 타입은 TASK-02에서 정의하고, 다른 작업에서는 확장만 가능
- **API 인터페이스**: 각 작업의 API는 명확한 인터페이스로 정의

### 4. 테스트 전략

- 각 작업 완료 후 해당 기능의 단위 테스트 작성
- 통합 전 E2E 테스트 수행
- 병렬 작업 시 서로의 기능에 영향 없는지 확인

---

## 공통 규칙

### 1. 코딩 컨벤션

- **언어**: TypeScript (strict mode)
- **스타일**: ESLint + Prettier
- **컴포넌트**: React Server Components 우선, 필요시 Client Components
- **스타일링**: Tailwind CSS + shadcn/ui
- **상태 관리**: React Server Actions 우선, 필요시 React Context

### 2. 파일 명명 규칙

- **컴포넌트**: kebab-case (예: `book-card.tsx`)
- **페이지**: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- **API Routes**: `route.ts`
- **Server Actions**: `actions/` 폴더, kebab-case
- **Hooks**: `use-{name}.ts`
- **타입**: `{name}.ts`

### 3. 폴더 구조 준수

각 작업은 `software_design.md`의 폴더 구조를 엄격히 준수해야 합니다.

### 4. 환경 변수

모든 환경 변수는 `.env.example`에 문서화하고, 실제 값은 `.env.local`에 저장합니다.

### 5. 문서화

각 작업 완료 후:
- README.md에 작업 내용 요약 추가
- 주요 컴포넌트에 JSDoc 주석 추가
- 복잡한 로직은 인라인 주석 추가

---

## 다음 단계

각 작업을 시작하기 전에 해당 작업의 상세 계획 문서를 반드시 확인하세요:

1. [TASK-01: 프로젝트 초기화](./01-task-project-setup-plan.md)
2. [TASK-02: 공통 컴포넌트](./02-task-common-components-plan.md)
3. [TASK-03: 인증 시스템](./03-task-authentication-plan.md)
4. [TASK-04: 책 관리](./04-task-book-management-plan.md)
5. [TASK-05: 기록 기능](./05-task-notes-crud-plan.md)
6. [TASK-06: 검색 기능](./06-task-search-plan.md)
7. [TASK-07: 공유 기능](./07-task-share-plan.md)
8. [TASK-08: 타임라인 및 통계](./08-task-timeline-stats-plan.md)
9. [TASK-09: 독서모임](./09-task-groups-plan.md)
10. [TASK-10: 프로필 관리](./10-task-profile-plan.md)

---

**문서 끝**

