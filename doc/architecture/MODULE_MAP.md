# Habitree Reading Hub - Module Map

> **Version**: 1.0.0
> **Last Updated**: 2025-01-25
> **Approach**: 현재 폴더 구조 유지 + 문서 기반 모듈 경계 정의

---

## 1. 개요

이 문서는 Habitree Reading Hub의 모듈 구조를 정의합니다. 코드 이동 없이 현재 구조를 기반으로 논리적 모듈 경계를 문서화하여, 향후 독립적 관리 및 점진적 구조 변경이 가능하도록 합니다.

---

## 2. 모듈 분류 체계

### 2.1 레이어 구조

```
┌─────────────────────────────────────────────────┐
│               C. UI 레이어 (표현)               │
│         home, shared                            │
└─────────────────────────────────────────────────┘
                      ↓ 사용
┌─────────────────────────────────────────────────┐
│           B. 플랫폼/지원 모듈 (공통 역량)       │
│    search, ai, profile, admin                   │
└─────────────────────────────────────────────────┘
                      ↓ 사용
┌─────────────────────────────────────────────────┐
│            A. 도메인 모듈 (업무 핵심)           │
│  identity, library, records, groups, sharing    │
└─────────────────────────────────────────────────┘
                      ↓ 사용
┌─────────────────────────────────────────────────┐
│                   shared                        │
│        (모든 모듈에서 사용 가능)                │
└─────────────────────────────────────────────────┘
```

---

## 3. 모듈 상세

### 3.1 A. 도메인 모듈 (업무 핵심)

| 모듈명 | Key | 담당 기능 | 데이터 테이블 | 상세 문서 |
|--------|-----|-----------|---------------|-----------|
| **인증/권한** | `identity` | 로그인, 회원가입, 온보딩, 권한 | `users` | [identity.md](./modules/identity.md) |
| **서재** | `library` | 내 서재, 책 메타데이터, 독서 상태 | `books`, `user_books`, `bookshelves` | [library.md](./modules/library.md) |
| **독서기록** | `records` | 노트, 필사, 하이라이트, OCR | `notes`, `ocr_logs`, `ocr_usage_stats` | [records.md](./modules/records.md) |
| **모임** | `groups` | 독서모임, 멤버 관리, 그룹 내 공유 | `groups`, `group_members`, `group_books`, `group_shared_books`, `group_notes` | [groups.md](./modules/groups.md) |
| **공유/발행** | `sharing` | 공유 링크, 공개 범위 | 공유 관련 필드 (`is_public`, `share_*`) | [sharing.md](./modules/sharing.md) |

### 3.2 B. 플랫폼/지원 모듈 (공통 역량)

| 모듈명 | Key | 담당 기능 | 데이터/API | 상세 문서 |
|--------|-----|-----------|------------|-----------|
| **검색** | `search` | 검색 인덱스, 쿼리, 필터 | 네이버 API, 내부 검색 | [search.md](./modules/search.md) |
| **AI** | `ai` | 요약, 추천, 질문 생성, 채팅 | `chat_sessions`, `chat_messages`, `user_personas`, `ai_settings`, `user_ai_memories` | [ai.md](./modules/ai.md) |
| **프로필** | `profile` | 사용자 프로필, 설정 | `users` (설정 부분) | [profile.md](./modules/profile.md) |
| **관리자** | `admin` | 운영자 기능: 통계, OCR 관리 | 전체 데이터 조회 | [admin.md](./modules/admin.md) |

### 3.3 C. UI 레이어 (표현)

| 모듈명 | Key | 담당 기능 | 특징 | 상세 문서 |
|--------|-----|-----------|------|-----------|
| **홈/대시보드** | `home` | 각 도메인 정보 조합 표시 | 도메인이 아닌 **조합 레이어** | [home.md](./modules/home.md) |
| **공통 UI** | `shared` | 기본 UI 컴포넌트, 레이아웃 | shadcn/ui, Header, Sidebar 등 | [shared.md](./modules/shared.md) |

---

## 4. 파일 ↔ 모듈 매핑

### 4.1 identity (인증/권한)

```
app/
├── (auth)/login/
├── (auth)/signup/
├── (auth)/verify-email/
├── (auth)/onboarding/
├── actions/auth.ts
├── actions/onboarding.ts
├── callback/route.ts

components/
├── auth/signup-form.tsx
├── auth/social-login-buttons.tsx
├── onboarding/onboarding-wizard.tsx
├── onboarding/steps/

hooks/
├── use-auth.ts

contexts/
├── auth-context.tsx

lib/
├── supabase/client.ts
├── supabase/server.ts
├── supabase/middleware.ts

types/
├── user.ts
```

### 4.2 library (서재)

```
app/
├── (main)/books/
├── (main)/bookshelves/
├── actions/books.ts
├── actions/bookshelves.ts
├── api/books/

components/
├── books/book-card.tsx
├── books/book-search.tsx
├── books/book-title.tsx
├── books/book-status-badge.tsx
├── books/book-info-editor.tsx
├── books/book-notes-preview.tsx
├── books/book-stats-cards.tsx
├── books/book-scroll-handler.tsx
├── books/book-delete-button.tsx
├── bookshelves/bookshelf-card.tsx
├── bookshelves/bookshelf-list.tsx
├── bookshelves/bookshelf-selector.tsx
├── bookshelves/bookshelf-stats.tsx
├── layout/bookshelf-tree.tsx

hooks/
├── use-books.ts
├── use-bookshelves.ts

types/
├── book.ts
├── bookshelf.ts
```

### 4.3 records (독서기록)

```
app/
├── (main)/notes/
├── (main)/timeline/
├── actions/notes.ts
├── actions/ocr.ts
├── actions/ai/ocr.ts
├── api/notes/
├── api/ocr/

components/
├── notes/note-type-tabs.tsx
├── notes/book-mention-input.tsx
├── notes/book-mention-textarea.tsx
├── notes/book-link-*.tsx
├── notes/text-preview-dialog.tsx
├── notes/image-lightbox.tsx
├── notes/related-books-preview.tsx
├── notes/ocr-status-badge.tsx
├── notes/ocr-status-checker.tsx
├── timeline/timeline-content.tsx
├── timeline/timeline-group.tsx
├── timeline/timeline-item.tsx

hooks/
├── use-notes.ts
├── use-ocr-status.ts
├── use-mobile-note-sheet.ts

lib/
├── api/ocr.ts
├── api/cloud-run-ocr.ts

types/
├── note.ts
```

### 4.4 groups (모임)

```
app/
├── (main)/groups/
├── actions/groups.ts

components/
├── groups/group-card.tsx
├── groups/groups-content.tsx
├── groups/group-dashboard.tsx
├── groups/group-books-manager.tsx
├── groups/member-list.tsx
├── groups/member-progress.tsx
├── groups/shared-notes-list.tsx

hooks/
├── use-groups.ts

types/
├── group.ts
```

### 4.5 sharing (공유/발행)

```
app/
├── share/notes/[id]/
├── actions/share.ts

components/
├── share/share-note-card.tsx
```

### 4.6 search (검색)

```
app/
├── (main)/search/
├── (main)/books/search/
├── actions/search.ts
├── api/search/

components/
├── search/search-results.tsx
├── search/search-result-card.tsx
├── search/pagination.tsx

hooks/
├── use-search.ts

lib/
├── api/naver.ts
├── utils/search.ts
```

### 4.7 ai (AI)

```
app/
├── (main)/chat/
├── (main)/persona/
├── actions/ai/chat.ts
├── actions/ai/persona.ts
├── actions/ai/settings.ts
├── actions/ai/summarization.ts
├── actions/ai/index.ts
├── actions/chat.ts
├── api/ai/
├── api/chat/

components/
├── ai/chat/chat-message.tsx
├── ai/chat/chat-sidebar.tsx
├── ai/admin/ai-settings-panel.tsx
├── chat/chat-interface.tsx
├── chat/chat-input.tsx
├── chat/chat-message.tsx
├── chat/chat-sidebar.tsx
├── persona/persona-card.tsx
├── persona/reading-stats.tsx

lib/
├── ai/providers/gemini.ts
├── ai/providers/openai.ts
├── ai/providers/anthropic.ts
├── ai/providers/index.ts
├── ai/prompts/chat-prompts.ts
├── ai/prompts/summarization-prompts.ts
├── ai/prompts/index.ts
├── ai/utils/stream-parser.ts
├── ai/utils/token-counter.ts
├── ai/utils/index.ts
├── ai/index.ts
├── api/chat-prompts.ts
├── api/gemini.ts

types/
├── ai/chat.ts
├── ai/persona.ts
├── ai/settings.ts
├── ai/providers.ts
├── ai/index.ts
├── chat.ts
├── persona.ts
├── ai-settings.ts
```

### 4.8 profile (프로필)

```
app/
├── (main)/profile/
├── actions/profile.ts

components/
├── profile/profile-content.tsx
```

### 4.9 admin (관리자)

```
app/
├── (main)/admin/
├── actions/admin.ts
├── api/admin/

components/
├── admin/admin-dashboard.tsx
├── admin/admin-stats-card.tsx
├── admin/ai-settings-panel.tsx
├── admin/batch-ocr-button.tsx
├── admin/batch-ocr-progress-dialog.tsx
```

### 4.10 home (홈/대시보드)

```
app/
├── (main)/page.tsx (대시보드)
├── actions/stats.ts

components/
├── dashboard/dashboard-content.tsx
├── dashboard/dashboard-skeleton.tsx
├── dashboard/recent-notes.tsx
├── dashboard/monthly-chart.tsx
├── dashboard/monthly-stats-card.tsx
├── dashboard/sections/home-hero-section.tsx
├── dashboard/sections/home-hero-wrapper.tsx
├── dashboard/login-success-toast.tsx
├── landing/landing-page.tsx
├── landing/benefits-section.tsx
├── landing/problem-section.tsx

hooks/
├── use-stats.ts
```

### 4.11 shared (공통)

```
components/
├── ui/ (전체 - button, card, dialog, form 등)
├── layout/header.tsx
├── layout/sidebar.tsx
├── layout/footer.tsx
├── layout/mobile-nav.tsx
├── theme/theme-provider.tsx
├── theme/theme-selector.tsx
├── error-boundary.tsx

lib/
├── supabase/ (클라이언트 공통)
├── utils/cn.ts
├── utils/date.ts
├── utils/validation.ts
├── utils/logger.ts
├── utils/cache.ts
├── utils/retry.ts
├── utils/image.ts
├── utils/device.ts
├── utils/clipboard.ts
├── constants/style-messages.ts
├── security/file-validation.ts
├── middleware/rate-limit.ts

types/
├── database.ts (Supabase 자동 생성)

hooks/
├── use-style.ts
```

---

## 5. 의존성 규칙 요약

상세 의존성 규칙은 [DEPENDENCY_RULES.md](./DEPENDENCY_RULES.md) 참조

### 5.1 기본 규칙

| 규칙 | 설명 |
|------|------|
| ✅ 허용 | 상위 레이어 → 하위 레이어 import |
| ✅ 허용 | 모든 모듈 → shared import |
| ⚠️ 주의 | 같은 레이어 모듈 간 import (명시적 인터페이스) |
| ❌ 금지 | 하위 레이어 → 상위 레이어 import |
| ❌ 금지 | shared → 다른 모듈 import |

### 5.2 허용된 도메인 간 의존성

```
records → library (책 정보 참조)
groups → library, records (그룹 내 책/기록)
sharing → library, records, groups (공유 대상)
ai → library, records (컨텍스트 참조)
admin → 모든 모듈 (관리 목적)
home → 모든 도메인 모듈 (대시보드 조합)
```

---

## 6. 참고 사항

### 6.1 관련 문서

- [DEPENDENCY_RULES.md](./DEPENDENCY_RULES.md) - 의존성 규칙 상세
- [DATA_MODEL.md](../database/DATA_MODEL.md) - 데이터 모델
- [RULES.md](../claude/RULES.md) - Claude Code 규칙

### 6.2 향후 계획

1. **단기**: ESLint import 규칙으로 의존성 강제
2. **중기**: 순환 의존성 검사 CI/CD 추가
3. **장기**: 필요 시 폴더 구조 점진적 변경
