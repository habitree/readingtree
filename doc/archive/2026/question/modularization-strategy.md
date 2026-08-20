# 프로젝트 모듈화 전략 및 향후 진행 방향

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub  
**버전:** 1.0

---

## 목차

1. [현재 프로젝트 상태 분석](#1-현재-프로젝트-상태-분석)
2. [모듈화 전략](#2-모듈화-전략)
3. [향후 진행 전략](#3-향후-진행-전략)
4. [모듈화 마이그레이션 계획](#4-모듈화-마이그레이션-계획)
5. [확장성 고려사항](#5-확장성-고려사항)
6. [문서화 전략](#6-문서화-전략)
7. [결론 및 권장사항](#7-결론-및-권장사항)

---

## 1. 현재 프로젝트 상태 분석

### 1.1 완료된 작업

- ✅ **TASK-00**: 데이터베이스 스키마 설정 완료
  - 모든 테이블, 인덱스, RLS 정책, 함수, 트리거 생성 완료
  - Storage 버킷 설정 완료
  
- ✅ **TASK-01**: 인증 및 온보딩 백엔드 완료
  - 카카오톡/구글 OAuth 로그인 구현
  - 온보딩 플로우 구현
  - OAuth 콜백 처리 완료

### 1.2 진행 중/미완료 작업

- ⏳ **TASK-02**: 책 관리 백엔드
- ⏳ **TASK-03**: 기록 관리 백엔드
- ⏳ **TASK-04**: 검색 백엔드
- ⏳ **TASK-05**: 공유 백엔드
- ⏳ **TASK-06**: 타임라인 및 통계 백엔드
- ⏳ **TASK-07**: 독서모임 백엔드
- ⏳ **TASK-08**: 프로필 관리 백엔드

### 1.3 현재 프로젝트 구조

```
프로젝트 구조:
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 관련 페이지
│   ├── (main)/             # 메인 앱 페이지
│   ├── actions/            # Server Actions (비즈니스 로직)
│   ├── api/                # API Routes (외부 API 연동)
│   └── share/              # 공유 페이지
├── components/             # React 컴포넌트
│   ├── auth/               # 인증 컴포넌트
│   ├── books/              # 책 관련 컴포넌트
│   ├── notes/              # 기록 관련 컴포넌트
│   ├── groups/             # 모임 관련 컴포넌트
│   └── ui/                 # 공통 UI 컴포넌트
├── lib/                    # 라이브러리 및 유틸리티
│   ├── api/                # 외부 API 클라이언트
│   ├── supabase/           # Supabase 클라이언트
│   ├── utils/              # 유틸리티 함수
│   └── templates/          # 템플릿
├── hooks/                  # Custom Hooks
├── types/                  # TypeScript 타입 정의
└── contexts/               # React Context
```

---

## 2. 모듈화 전략

### 2.1 도메인 기반 모듈화 (Domain-Driven Design)

각 기능을 독립적인 도메인 모듈로 분리:

```
modules/
├── auth/                   # 인증 모듈
│   ├── actions/            # auth.ts
│   ├── components/         # login-form.tsx, social-login-buttons.tsx
│   ├── hooks/              # use-auth.ts
│   ├── types/              # auth.types.ts
│   └── utils/              # auth.utils.ts
├── books/                  # 책 관리 모듈
│   ├── actions/            # books.ts
│   ├── api/                # naver.ts
│   ├── components/         # book-card.tsx, book-list.tsx
│   ├── hooks/              # use-books.ts
│   └── types/              # book.ts
├── notes/                  # 기록 모듈
│   ├── actions/            # notes.ts
│   ├── api/                # ocr 관련
│   ├── components/         # note-form.tsx, note-list.tsx
│   ├── hooks/              # use-notes.ts
│   └── types/              # note.ts
├── groups/                 # 독서모임 모듈
│   ├── actions/            # groups.ts
│   ├── components/         # group-card.tsx, group-dashboard.tsx
│   ├── hooks/              # use-groups.ts
│   └── types/              # group.ts
├── search/                 # 검색 모듈
│   ├── api/                # search route
│   ├── components/         # search-filters.tsx, search-results.tsx
│   ├── hooks/              # use-search.ts
│   └── utils/              # search.ts
├── share/                  # 공유 모듈
│   ├── api/                # share/card route
│   ├── components/        # share-dialog.tsx, card-news-generator.tsx
│   └── templates/          # card-news-templates.ts
├── stats/                  # 통계 모듈
│   ├── actions/            # stats.ts
│   ├── components/         # dashboard-content.tsx, monthly-chart.tsx
│   └── hooks/              # use-stats.ts
└── profile/                # 프로필 모듈
    ├── actions/            # profile.ts
    ├── components/         # profile-form.tsx, profile-content.tsx
    └── hooks/              # use-profile.ts
```

### 2.2 레이어 기반 모듈화 (Layered Architecture)

각 모듈을 레이어별로 분리:

```
각 모듈 내부 구조:
├── domain/                 # 도메인 로직 (비즈니스 규칙)
│   ├── entities/           # 엔티티 타입
│   ├── services/           # 도메인 서비스
│   └── validators/         # 검증 로직
├── application/            # 애플리케이션 로직
│   ├── actions/            # Server Actions
│   ├── hooks/              # Custom Hooks
│   └── use-cases/          # Use Cases
├── infrastructure/         # 인프라 계층
│   ├── api/                # API 클라이언트
│   ├── storage/            # Storage 클라이언트
│   └── database/           # Database 클라이언트
└── presentation/           # 프레젠테이션 계층
    ├── components/          # React 컴포넌트
    ├── pages/              # Next.js 페이지
    └── layouts/            # 레이아웃
```

### 2.3 공통 모듈 분리

모든 모듈에서 공통으로 사용하는 기능:

```
shared/
├── ui/                     # 공통 UI 컴포넌트 (shadcn/ui)
├── utils/                  # 공통 유틸리티
│   ├── cn.ts               # className 헬퍼
│   ├── date.ts             # 날짜 포맷
│   ├── validation.ts       # 공통 검증
│   └── url.ts              # URL 유틸리티
├── lib/                    # 공통 라이브러리
│   ├── supabase/           # Supabase 클라이언트
│   └── middleware/         # 미들웨어
└── types/                  # 공통 타입
    └── database.ts         # Supabase 타입
```

---

## 3. 향후 진행 전략

### 3.1 단계별 개발 전략

**Phase 1: 핵심 기능 완성 (MVP)**
1. TASK-02: 책 관리 백엔드 (1일)
2. TASK-03: 기록 관리 백엔드 (2일)
3. TASK-04: 검색 백엔드 (1일)
4. TASK-05: 공유 백엔드 (1일)
5. TASK-06: 타임라인 및 통계 백엔드 (1일)

**Phase 2: 커뮤니티 기능**
6. TASK-07: 독서모임 백엔드 (2일)
7. TASK-08: 프로필 관리 백엔드 (1일)

**Phase 3: 기능 강화 및 최적화**
8. 성능 최적화
9. 에러 처리 개선
10. 사용자 경험 개선

### 3.2 모듈별 개발 우선순위

**우선순위 1 (P0 - Must Have)**
- ✅ 인증 모듈 (완료)
- ⏳ 책 관리 모듈
- ⏳ 기록 모듈
- ⏳ 검색 모듈
- ⏳ 공유 모듈
- ⏳ 통계 모듈

**우선순위 2 (P1 - Should Have)**
- ⏳ 독서모임 모듈
- ⏳ 프로필 모듈

**우선순위 3 (P2 - Nice to Have)**
- 🔮 AI 기반 추천
- 🔮 독서 리포트 자동 생성
- 🔮 크리에이터 기능

### 3.3 모듈 간 의존성 관리

```
의존성 다이어그램:

auth (완료)
  ↓
books (진행 중)
  ↓
notes (의존: books)
  ↓
├── search (의존: notes)
├── share (의존: notes)
├── stats (의존: notes)
└── groups (의존: notes)

profile (독립적, 병렬 가능)
```

### 3.4 코드 재사용 전략

**3.4.1 공통 컴포넌트 라이브러리**
- `components/ui/`: shadcn/ui 기반 공통 컴포넌트
- `components/layout/`: 공통 레이아웃 컴포넌트

**3.4.2 공통 Hooks**
- `hooks/use-auth.ts`: 인증 관련 공통 로직
- `hooks/use-books.ts`: 책 관련 공통 로직
- `hooks/use-notes.ts`: 기록 관련 공통 로직

**3.4.3 공통 유틸리티**
- `lib/utils/`: 재사용 가능한 유틸리티 함수
- `lib/validations/`: 공통 검증 스키마

### 3.5 테스트 전략

**3.5.1 단위 테스트**
- 각 모듈의 핵심 로직에 대한 단위 테스트
- Server Actions 테스트
- 유틸리티 함수 테스트

**3.5.2 통합 테스트**
- 모듈 간 연동 테스트
- API 엔드포인트 테스트
- 데이터베이스 연동 테스트

**3.5.3 E2E 테스트**
- 주요 사용자 시나리오 테스트
- 인증 플로우 테스트
- 기록 생성/수정/삭제 플로우 테스트

---

## 4. 모듈화 마이그레이션 계획

### 4.1 점진적 리팩토링 전략

**Step 1: 새 모듈부터 모듈화 구조 적용**
- 새로 개발하는 모듈(books, notes 등)부터 모듈화 구조로 개발
- 기존 코드는 유지하면서 점진적으로 리팩토링

**Step 2: 공통 모듈 분리**
- 공통으로 사용되는 컴포넌트와 유틸리티를 `shared/` 폴더로 이동
- 각 모듈에서 공통 모듈을 import하여 사용

**Step 3: 기존 모듈 리팩토링**
- 완료된 모듈(auth)부터 모듈화 구조로 리팩토링
- 다른 모듈에 영향을 주지 않도록 주의

### 4.2 모듈 간 통신 규칙

**4.2.1 Server Actions 호출**
```typescript
// 다른 모듈의 Server Action 호출 예시
import { getBookDetail } from '@/modules/books/actions/books';
import { createNote } from '@/modules/notes/actions/notes';
```

**4.2.2 컴포넌트 재사용**
```typescript
// 다른 모듈의 컴포넌트 사용 예시
import { BookCard } from '@/modules/books/components/book-card';
import { NoteForm } from '@/modules/notes/components/note-form';
```

**4.2.3 타입 공유**
```typescript
// 공통 타입은 shared/types에 정의
import { Book, Note } from '@/shared/types';
```

---

## 5. 확장성 고려사항

### 5.1 새로운 기능 추가 시

**5.1.1 새 모듈 추가 절차**
1. `modules/` 폴더에 새 모듈 폴더 생성
2. 모듈 내부에 domain, application, infrastructure, presentation 레이어 구성
3. 필요한 공통 모듈 import
4. 모듈 간 의존성 최소화

**5.1.2 기존 모듈 확장**
1. 기존 모듈의 구조를 유지하면서 확장
2. 새로운 기능은 새로운 파일로 추가
3. 기존 코드 수정 최소화

### 5.2 성능 최적화 전략

**5.2.1 코드 스플리팅**
- 각 모듈을 독립적인 번들로 분리
- Next.js의 동적 import 활용

**5.2.2 캐싱 전략**
- 각 모듈별 캐싱 전략 수립
- Next.js 캐시와 Supabase 캐시 활용

**5.2.3 데이터베이스 최적화**
- 모듈별 인덱스 최적화
- 쿼리 성능 모니터링

---

## 6. 문서화 전략

### 6.1 모듈별 문서화

각 모듈마다 다음 문서 작성:
- `README.md`: 모듈 개요 및 사용법
- `API.md`: API 엔드포인트 문서
- `TYPES.md`: 타입 정의 문서

### 6.2 아키텍처 문서

- 전체 아키텍처 다이어그램
- 모듈 간 의존성 다이어그램
- 데이터 흐름도

---

## 7. 결론 및 권장사항

### 7.1 즉시 적용 가능한 사항

1. **새 모듈부터 모듈화 구조 적용**
   - books, notes 모듈부터 모듈화 구조로 개발 시작
   
2. **공통 모듈 분리**
   - `shared/` 폴더 생성 및 공통 코드 이동
   
3. **모듈별 독립 개발**
   - 각 모듈을 독립적으로 개발하고 테스트

### 7.2 중장기 개선 사항

1. **점진적 리팩토링**
   - 기존 코드를 모듈화 구조로 점진적으로 리팩토링
   
2. **테스트 코드 추가**
   - 각 모듈에 대한 테스트 코드 작성
   
3. **문서화 강화**
   - 모듈별 문서화 및 아키텍처 문서 작성

### 7.3 향후 기능 추가 시 고려사항

1. **모듈화 구조 준수**
   - 새 기능 추가 시 모듈화 구조를 준수하여 개발
   
2. **의존성 최소화**
   - 모듈 간 의존성을 최소화하여 유지보수성 향상
   
3. **재사용성 고려**
   - 공통 기능은 shared 모듈로 분리하여 재사용

---

**문서 끝**

