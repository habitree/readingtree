# ReadTree v4.0.0 기능별 파일 매핑

> **최종 업데이트**: 2026-01-29
> **목적**: 기능 영역별 관련 파일 매핑 및 현황 파악

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기능별 파일 매핑](#2-기능별-파일-매핑)
3. [공통 모듈](#3-공통-모듈)
4. [정리 필요 항목](#4-정리-필요-항목)

---

## 1. 프로젝트 개요

### 1.1 통계 요약

| 항목 | 수량 | 비고 |
|------|------|------|
| 페이지 | 42개 | `/test`, `/onboarding/consent` 제거 필요 |
| 컴포넌트 | ~150개 | Deprecated 5개 정리 필요 |
| Server Actions | 25개 | 메인 19개 + AI 6개 |
| Types | 11개 | Deprecated 3개 정리 필요 |
| Hooks | 11개 | 활성 사용 중 |
| 마이그레이션 | 58개+ | 참고용 파일 분리 필요 |

### 1.2 디렉토리 구조

```
readingtree_v4.0.0/
├── app/
│   ├── actions/           # Server Actions (25개)
│   │   ├── ai/            # AI 관련 Actions (6개)
│   │   └── *.ts           # 도메인별 Actions (19개)
│   ├── api/               # API Routes
│   ├── (auth)/            # 인증 관련 페이지
│   ├── (main)/            # 메인 기능 페이지
│   └── ...
├── components/            # UI 컴포넌트 (~150개)
│   ├── ai/                # AI 기능 컴포넌트
│   ├── auth/              # 인증 컴포넌트
│   ├── books/             # 책 관리 컴포넌트
│   ├── notes/             # 기록 컴포넌트
│   ├── groups/            # 독서모임 컴포넌트
│   ├── ui/                # shadcn/ui 컴포넌트
│   └── ...
├── hooks/                 # Custom Hooks (11개)
├── types/                 # TypeScript 타입 (11개)
├── lib/                   # 유틸리티 및 API 래퍼
└── doc/                   # 문서
```

---

## 2. 기능별 파일 매핑

### 2.1 인증 (Auth)

사용자 로그인, 회원가입, 온보딩 기능

| 구분 | 파일 |
|------|------|
| **Pages** | |
| 로그인 | `app/(auth)/login/page.tsx` |
| 회원가입 | `app/(auth)/signup/page.tsx` |
| 이메일 인증 | `app/(auth)/verify-email/page.tsx` |
| 온보딩 메인 | `app/(auth)/onboarding/page.tsx` |
| 목표 설정 | `app/(auth)/onboarding/goal/page.tsx` |
| 튜토리얼 | `app/(auth)/onboarding/tutorial/page.tsx` |
| ~~동의~~ | `app/(auth)/onboarding/consent/page.tsx` (삭제 예정) |
| **Components** | |
| 로그인 폼 | `components/auth/login-form.tsx` |
| 회원가입 폼 | `components/auth/signup-form.tsx` |
| 소셜 로그인 | `components/auth/social-login-buttons.tsx` |
| 온보딩 단계 | `components/onboarding/steps/*.tsx` |
| 진행 표시 | `components/onboarding/progress-indicator.tsx` |
| **Actions** | |
| 인증 | `app/actions/auth.ts` |
| 온보딩 | `app/actions/onboarding.ts` |
| **Hooks** | |
| 인증 상태 | `hooks/use-auth.ts` |
| **Types** | |
| 사용자 타입 | `types/user.ts` |

---

### 2.2 책 관리 (Books)

내 서재, 책 추가/검색, 독서 상태 관리

| 구분 | 파일 |
|------|------|
| **Pages** | |
| 내 서재 | `app/(main)/books/page.tsx` |
| 책 상세 | `app/(main)/books/[id]/page.tsx` |
| 책 검색 | `app/(main)/books/search/page.tsx` |
| 서재 목록 | `app/(main)/bookshelves/page.tsx` |
| 서재 상세 | `app/(main)/bookshelves/[id]/page.tsx` |
| 서재 편집 | `app/(main)/bookshelves/[id]/edit/page.tsx` |
| **Components** | |
| 책 목록 | `components/books/book-list-view.tsx` |
| 책 테이블 | `components/books/book-table.tsx` |
| 책 카드 | `components/books/book-card.tsx` |
| 책 상세 | `components/books/book-detail.tsx` |
| 책 검색 | `components/books/book-search-input.tsx` |
| 책 통계 | `components/books/book-stats-cards.tsx` |
| 상태 필터 | `components/books/status-filter.tsx` |
| 보기 모드 | `components/books/view-mode-toggle.tsx` |
| 서재 선택 | `components/bookshelves/bookshelf-selector.tsx` |
| 서재 목록 | `components/bookshelves/bookshelf-list.tsx` |
| 서재 카드 | `components/bookshelves/bookshelf-card.tsx` |
| 서재 통계 | `components/bookshelves/bookshelf-stats.tsx` |
| **Actions** | |
| 책 관리 | `app/actions/books.ts` |
| 서재 관리 | `app/actions/bookshelves.ts` |
| 책 관계 | `app/actions/book-relations.ts` |
| **Hooks** | |
| 책 상태 | `hooks/use-books.ts` |
| **Types** | |
| 책 타입 | `types/book.ts` |
| 서재 타입 | `types/bookshelf.ts` |

---

### 2.3 기록 관리 (Notes)

인용구, 메모, 사진, 필사(OCR) 기록 관리

| 구분 | 파일 |
|------|------|
| **Pages** | |
| 기록 목록 | `app/(main)/notes/page.tsx` |
| 기록 상세 | `app/(main)/notes/[id]/page.tsx` |
| 기록 작성 | `app/(main)/notes/new/page.tsx` |
| 기록 편집 | `app/(main)/notes/[id]/edit/page.tsx` |
| 기록 공유 | `app/share/notes/[id]/page.tsx` |
| **Components** | |
| 기록 카드 | `components/notes/note-card.tsx` |
| 기록 폼 | `components/notes/note-form.tsx` |
| 기록 목록 | `components/notes/note-list.tsx` |
| 기록 유형 탭 | `components/notes/note-type-tabs.tsx` |
| 태그 입력 | `components/notes/tag-input.tsx` |
| 삭제 버튼 | `components/notes/note-delete-button.tsx` |
| 이미지 뷰어 | `components/notes/image-lightbox.tsx` |
| OCR 상태 | `components/notes/ocr-status-badge.tsx` |
| OCR 체크 | `components/notes/ocr-status-checker.tsx` |
| 텍스트 미리보기 | `components/notes/text-preview-dialog.tsx` |
| 책 멘션 | `components/notes/book-mention-input.tsx` |
| 책 연결 | `components/notes/book-link-manager.tsx` |
| 관련 책 | `components/notes/related-books-manager.tsx` |
| **Actions** | |
| 기록 관리 | `app/actions/notes.ts` |
| OCR 처리 | `app/actions/ocr.ts` (삭제 예정 → `app/actions/ai/ocr.ts` 사용) |
| **Hooks** | |
| 기록 상태 | `hooks/use-notes.ts` |
| 기록 폼 | `hooks/use-note-form.ts` |
| OCR 상태 | `hooks/use-ocr-status.ts` |
| **Types** | |
| 기록 타입 | `types/note.ts` |

---

### 2.4 독서모임 (Groups)

그룹 생성, 멤버 관리, 기록 공유

| 구분 | 파일 |
|------|------|
| **Pages** | |
| 모임 목록 | `app/(main)/groups/page.tsx` |
| 모임 상세 | `app/(main)/groups/[id]/page.tsx` |
| 모임 생성 | `app/(main)/groups/new/page.tsx` |
| 모임 설정 | `app/(main)/groups/[id]/settings/page.tsx` |
| 모임 책 상세 | `app/(main)/groups/[id]/books/[bookId]/page.tsx` |
| **Components** | |
| 모임 목록 | `components/groups/groups-content.tsx` |
| 모임 카드 | `components/groups/group-card.tsx` |
| 모임 대시보드 | `components/groups/group-dashboard.tsx` |
| 멤버 목록 | `components/groups/member-list.tsx` |
| 멤버 진행 | `components/groups/member-progress.tsx` |
| 책 관리 | `components/groups/group-books-manager.tsx` |
| 공유 기록 | `components/groups/group-note-card.tsx` |
| **Actions** | |
| 모임 관리 | `app/actions/groups.ts` |
| **Hooks** | |
| 모임 상태 | `hooks/use-groups.ts` |
| **Types** | |
| 모임 타입 | `types/group.ts` |

---

### 2.5 AI 기능

AI 채팅, 페르소나 분석, OCR, 요약

| 구분 | 파일 |
|------|------|
| **Pages** | |
| AI 채팅 | `app/(main)/chat/page.tsx` |
| 페르소나 | `app/(main)/persona/page.tsx` |
| AI 설정 (관리자) | `app/(main)/admin/ai-settings/page.tsx` |
| **Components** | |
| 채팅 인터페이스 | `components/ai/chat/chat-interface.tsx` |
| 채팅 입력 | `components/ai/chat/chat-input.tsx` |
| 채팅 메시지 | `components/ai/chat/chat-message.tsx` |
| 채팅 사이드바 | `components/ai/chat/chat-sidebar.tsx` |
| AI 설정 패널 | `components/ai/admin/ai-settings-panel.tsx` |
| 페르소나 카드 | `components/persona/persona-card.tsx` |
| 독서 통계 | `components/persona/reading-stats.tsx` |
| ~~구 채팅~~ | `components/chat/*.tsx` (삭제 예정) |
| ~~구 설정~~ | `components/admin/ai-settings-panel.tsx` (삭제 예정) |
| **Actions (AI)** | |
| 채팅 | `app/actions/ai/chat.ts` |
| 페르소나 | `app/actions/ai/persona.ts` |
| OCR | `app/actions/ai/ocr.ts` |
| 설정 | `app/actions/ai/settings.ts` |
| 요약 | `app/actions/ai/summarization.ts` |
| 인덱스 | `app/actions/ai/index.ts` |
| ~~구 채팅~~ | `app/actions/chat.ts` (삭제 예정) |
| ~~구 페르소나~~ | `app/actions/persona.ts` (삭제 예정) |
| ~~구 설정~~ | `app/actions/ai-settings.ts` (삭제 예정) |
| ~~구 OCR~~ | `app/actions/ocr.ts` (삭제 예정) |
| **Types** | |
| ~~채팅 타입~~ | `types/chat.ts` (삭제 예정) |
| ~~페르소나 타입~~ | `types/persona.ts` (삭제 예정) |
| ~~설정 타입~~ | `types/ai-settings.ts` (삭제 예정) |

---

### 2.6 대시보드 & 통계

홈 대시보드, 타임라인, 통계

| 구분 | 파일 |
|------|------|
| **Pages** | |
| 홈 (대시보드) | `app/(main)/page.tsx` |
| 타임라인 | `app/(main)/timeline/page.tsx` |
| **Components** | |
| 대시보드 스켈레톤 | `components/dashboard/dashboard-skeleton.tsx` |
| 로그인 토스트 | `components/dashboard/login-success-toast.tsx` |
| 월간 차트 | `components/dashboard/monthly-chart.tsx` |
| 최근 기록 | `components/dashboard/recent-notes.tsx` |
| 통계 카드 | `components/dashboard/sections/stats-cards-section.tsx` |
| 월간 통계 | `components/dashboard/sections/monthly-stats-section.tsx` |
| 인기 책 | `components/dashboard/sections/top-books-section.tsx` |
| 타임라인 콘텐츠 | `components/timeline/timeline-content.tsx` |
| 타임라인 그룹 | `components/timeline/timeline-group.tsx` |
| 타임라인 아이템 | `components/timeline/timeline-item.tsx` |
| **Actions** | |
| 통계 | `app/actions/stats.ts` |
| **Hooks** | |
| 통계 | `hooks/use-stats.ts` |

---

### 2.7 프로필 & 설정

사용자 프로필, 계정 관리

| 구분 | 파일 |
|------|------|
| **Pages** | |
| 내 프로필 | `app/(main)/profile/page.tsx` |
| 다른 사용자 프로필 | `app/(main)/profile/[id]/page.tsx` |
| **Components** | |
| 프로필 헤더 | `components/profile/profile-header.tsx` |
| 계정 삭제 | `components/profile/delete-account-section.tsx` |
| **Actions** | |
| 프로필 관리 | `app/actions/profile.ts` |

---

### 2.8 검색

통합 검색 기능

| 구분 | 파일 |
|------|------|
| **Pages** | |
| 검색 | `app/(main)/search/page.tsx` |
| **Components** | |
| 검색 결과 | `components/search/search-result-card.tsx` |
| 페이지네이션 | `components/search/pagination.tsx` |
| **Actions** | |
| 검색 | `app/actions/search.ts` |
| **Hooks** | |
| 검색 | `hooks/use-search.ts` |

---

### 2.9 기능 요청

사용자 기능 요청 게시판

| 구분 | 파일 |
|------|------|
| **Pages** | |
| 요청 목록 | `app/(main)/feature-requests/page.tsx` |
| 요청 상세 | `app/(main)/feature-requests/[id]/page.tsx` |
| 요청 작성 | `app/(main)/feature-requests/new/page.tsx` |
| 요청 편집 | `app/(main)/feature-requests/[id]/edit/page.tsx` |
| **Components** | |
| 요청 폼 | `components/feature-requests/feature-request-form.tsx` |
| **Actions** | |
| 기능 요청 | `app/actions/feature-requests.ts` |
| **Types** | |
| 기능 요청 타입 | `types/feature-request.ts` |

---

### 2.10 관리자

관리자 대시보드, 통계

| 구분 | 파일 |
|------|------|
| **Pages** | |
| 관리자 대시보드 | `app/(main)/admin/page.tsx` |
| API 정보 | `app/(main)/admin/api-info/page.tsx` |
| AI 설정 | `app/(main)/admin/ai-settings/page.tsx` |
| **Components** | |
| 관리자 대시보드 | `components/admin/admin-dashboard.tsx` |
| 통계 카드 | `components/admin/admin-stats-card.tsx` |
| API 정보 | `components/admin/api-integration-info.tsx` |
| 배치 OCR | `components/admin/batch-ocr-button.tsx` |
| OCR 진행 | `components/admin/batch-ocr-progress-dialog.tsx` |
| **Actions** | |
| 관리자 | `app/actions/admin.ts` |

---

### 2.11 공유 & 공개

기록 공유, 공개 페이지

| 구분 | 파일 |
|------|------|
| **Pages** | |
| 공유 기록 | `app/share/notes/[id]/page.tsx` |
| **Components** | |
| 공유 다이얼로그 | `components/share/simple-share-dialog.tsx` |
| **Actions** | |
| 공유 | `app/actions/share.ts` |

---

### 2.12 랜딩 & 정적 페이지

랜딩 페이지, 약관, 개인정보처리방침

| 구분 | 파일 |
|------|------|
| **Pages** | |
| 소개 | `app/(main)/about/page.tsx` |
| 이용약관 | `app/terms/page.tsx` |
| 개인정보처리방침 | `app/privacy/page.tsx` |
| 샘플 | `app/(main)/sample/page.tsx` |
| ~~테스트~~ | `app/test/page.tsx` (삭제 예정) |
| **Components** | |
| 랜딩 페이지 | `components/landing/landing-page.tsx` |
| 히어로 섹션 | `components/landing/hero-section.tsx` |
| 문제 섹션 | `components/landing/problem-section.tsx` |
| 솔루션 섹션 | `components/landing/solution-section.tsx` |
| 혜택 섹션 | `components/landing/benefits-section.tsx` |
| 사회적 증거 | `components/landing/social-proof-section.tsx` |
| CTA 섹션 | `components/landing/cta-section.tsx` |
| 샘플 책장 | `components/books/sample-bookshelf-content.tsx` |
| 샘플 기록 | `components/notes/sample-notes-list.tsx` |
| **Actions** | |
| 샘플 | `app/actions/sample.ts` |

---

## 3. 공통 모듈

### 3.1 UI 컴포넌트 (shadcn/ui)

| 컴포넌트 | 파일 |
|----------|------|
| Alert | `components/ui/alert.tsx` |
| Alert Dialog | `components/ui/alert-dialog.tsx` |
| Avatar | `components/ui/avatar.tsx` |
| Badge | `components/ui/badge.tsx` |
| Button | `components/ui/button.tsx` |
| Card | `components/ui/card.tsx` |
| Checkbox | `components/ui/checkbox.tsx` |
| Dialog | `components/ui/dialog.tsx` |
| Dropdown Menu | `components/ui/dropdown-menu.tsx` |
| Form | `components/ui/form.tsx` |
| Input | `components/ui/input.tsx` |
| Label | `components/ui/label.tsx` |
| Progress | `components/ui/progress.tsx` |
| Scroll Area | `components/ui/scroll-area.tsx` |
| Select | `components/ui/select.tsx` |
| Separator | `components/ui/separator.tsx` |
| Sheet | `components/ui/sheet.tsx` |
| Skeleton | `components/ui/skeleton.tsx` |
| Sonner | `components/ui/sonner.tsx` |
| Stepper | `components/ui/stepper.tsx` |
| Switch | `components/ui/switch.tsx` |
| Table | `components/ui/table.tsx` |
| Tabs | `components/ui/tabs.tsx` |
| Textarea | `components/ui/textarea.tsx` |
| Tooltip | `components/ui/tooltip.tsx` |

### 3.2 레이아웃 컴포넌트

| 컴포넌트 | 파일 |
|----------|------|
| Footer | `components/layout/footer.tsx` |
| Mobile Nav | `components/layout/mobile-nav.tsx` |
| Bookshelf Tree | `components/layout/bookshelf-tree.tsx` |

### 3.3 테마 컴포넌트

| 컴포넌트 | 파일 |
|----------|------|
| Theme Provider | `components/theme/theme-provider.tsx` |
| Theme Selector | `components/theme/theme-selector.tsx` |

### 3.4 공통 유틸리티

| 컴포넌트 | 파일 |
|----------|------|
| Error Boundary | `components/error-boundary.tsx` |

### 3.5 Database Types

| 파일 | 설명 |
|------|------|
| `types/database.ts` | Supabase 자동 생성 타입 |

### 3.6 포인트 시스템

| 구분 | 파일 |
|------|------|
| **Actions** | `app/actions/points.ts` |
| **Types** | `types/points.ts` |

---

## 4. 정리 필요 항목

### 4.1 삭제 예정 파일

#### Deprecated 컴포넌트
- `components/chat/chat-input.tsx`
- `components/chat/chat-interface.tsx`
- `components/chat/chat-message.tsx`
- `components/chat/chat-sidebar.tsx`
- `components/admin/ai-settings-panel.tsx`

#### Deprecated Actions
- `app/actions/ai-settings.ts`
- `app/actions/chat.ts`
- `app/actions/ocr.ts`
- `app/actions/persona.ts`

#### Deprecated Types
- `types/ai-settings.ts`
- `types/chat.ts`
- `types/persona.ts`

#### 불필요한 페이지
- `app/test/page.tsx`
- `app/(auth)/onboarding/consent/page.tsx`

### 4.2 마이그레이션 파일 정리 필요

규칙 위반 파일 (reference 폴더로 이동):
- `verification-queries.sql`
- `sample-data.sql`
- `schema.sql`
- `check-*.sql`
- `verify-*.sql`

---

## 참고 문서

| 문서 | 경로 |
|------|------|
| 프로젝트 규칙 | `doc/claude/RULES.md` |
| 데이터 모델 | `doc/database/DATA_MODEL.md` |
| 의존성 규칙 | `doc/architecture/DEPENDENCY_RULES.md` |
| 모듈 맵 | `doc/architecture/MODULE_MAP.md` |

---

**이 문서는 프로젝트 기능별 파일 매핑 기준 문서입니다.**
