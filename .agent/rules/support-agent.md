---
alwaysApply: false
description: "지원(Support) 에이전트 — 인앱 피드백, FAQ/도움말, 기능 요청, 공지사항, 버그 리포트, 경량 챗 위젯"
globs:
  - "app/(main)/help/**"
  - "app/(main)/faq/**"
  - "app/(main)/feature-requests/**"
  - "app/(main)/announcements/**"
  - "app/(public)/help/**"
  - "app/actions/support.ts"
  - "app/actions/feature-requests.ts"
  - "app/actions/announcements.ts"
  - "app/actions/feedback.ts"
  - "app/api/support/**"
  - "components/support/**"
  - "components/feature-requests/**"
  - "components/feedback-widget/**"
  - "components/help/**"
  - "lib/support/**"
  - "types/support.ts"
  - "doc/support/**"
  - "doc/database/migration-*support*"
  - "doc/database/migration-*ticket*"
  - "doc/database/migration-*announcement*"
  - "doc/database/migration-*faq*"
---

# 지원(Support) 에이전트

## 1. Identity

인앱 피드백·FAQ·버그 리포트·기능 요청·공지사항을 담당하는 사용자 목소리(VoC) 단일 창구.

**핵심 경계**:
- Admin Agent가 **답변·운영**을 담당한다
- Support Agent는 **사용자 측 인입 경로**를 소유한다
- `/help`·`/faq`·`/announcements`는 **비로그인 공개 라우트**

---

## 2. EXTENDS

- 기능 요청 CRUD + 관리자 응답 → `admin-agent.md`
- 인증 전 접근 가능 라우트 → `auth_session_rule.md` §공개 라우트
- i18n 표준 → `i18n_rule.md`
- UGC 처리·공지 법적 고지 → `legal-agent.md`

---

## 3. 핵심 원칙

| 원칙 | 설명 |
|------|------|
| i18n 필수(ko/en) | 모든 지원 UI는 `lib/i18n` 키 기반 |
| 로그인 전 접근 가능 | `/help`·`/faq`·`/announcements`는 공개 라우트 |
| 인증 후 자동 연동 | 로그인 사용자는 `support_tickets`에 자동 user_id 연결 |
| 경량 위젯 | Intercom/Crisp 등 외부 SDK 금지, 자체 컴포넌트(<30KB) |
| AI Agent 재사용 | FAQ 자동 응답은 AI Agent의 Gemini 파이프라인 경유 |

---

## 4. 담당 영역

### 4-1. FAQ / 도움말 센터 (신규)
- `app/(main)/help/` + `app/(public)/help/` 이중 배치
- 카테고리: 시작하기, 책/기록, 그룹, 포인트, 결제, 개인정보
- 마크다운 기반(`doc/support/help/*.md`) → MDX 렌더
- i18n: `help/ko/*.md`, `help/en/*.md`

### 4-2. 인앱 피드백 위젯
- `components/feedback-widget/` — 우하단 고정 버튼, 스크린샷 첨부
- 전송 경로: `app/actions/feedback.ts` → `support_tickets` INSERT + Discord webhook(옵션)
- 스크린샷: `lib/supabase/storage/support-bucket` (RLS 소유자 읽기만)

### 4-3. 기능 요청 게시판 확장 (기존)
- Admin Agent 관할 `/feature-requests` UI·i18n 개선
- 투표·댓글 유지, **다국어 게시글 필드** 추가(`title_ko`, `title_en`)

### 4-4. 공지사항 (신규)
- `announcements` 테이블 + `/announcements` 목록 페이지
- 읽음 상태 `user_announcement_reads`
- 긴급 공지는 전역 배너(레이아웃) 표시

### 4-5. 버그 리포트
- 위젯 카테고리 `bug` 선택 시 추가 필드(재현 단계, 환경)
- 자동 수집: 브라우저, OS, 현재 URL, 세션 ID (PII 제외)
- Monitoring Agent의 Sentry 이벤트와 `ticket_id` 상호 참조

---

## 5. DB 테이블

| 테이블 | 설명 |
|--------|------|
| `support_tickets` | 피드백/버그/문의 통합 |
| `support_ticket_messages` | 티켓 스레드 메시지 |
| `announcements` | 공지사항 |
| `user_announcement_reads` | 읽음 상태 |
| `faq_articles` | 구조화 FAQ(선택, 기본은 MDX 파일) |
| `feature_requests` | **Admin Agent 소유** — 스키마 공유만 |

---

## 6. 접근 제어

| 라우트 | 로그인 필요 | 관리자 필요 |
|--------|:----------:|:-----------:|
| `/help`, `/faq`, `/announcements` | ❌ | ❌ |
| `/help/ticket` (작성) | ❌* | ❌ |
| `/feature-requests` | ✅ | ❌ |
| `/admin/support/*` | ✅ | ✅ |

*비로그인 작성 시 이메일 필수, 로그인 시 자동 user_id 연결

---

## 7. i18n 규약

- 키 네임스페이스: `support.*`, `help.*`, `faq.*`
- 파일: `lib/i18n/locales/{ko,en}/support.json`
- fallback: ko (한국 서비스 우선)
- DB 컬럼 i18n: `{field}_ko`, `{field}_en` 쌍

---

## 8. 협업 매트릭스

| 에이전트 | 협업 내용 |
|---------|----------|
| Admin | 티켓 답변 UI, `requireAdmin()` 공유 |
| Legal | 피드백 수집 항목 PIPA 검토, 공지사항 법적 고지 템플릿 |
| Monitoring | 버그 리포트 ↔ Sentry 이벤트 링크 |
| AI | FAQ 자동 응답(Gemini), 사용자 질문 분류 |
| Identity | 로그인 사용자 자동 연결, 탈퇴 시 티켓 익명화 |
| Performance | 위젯 번들 <30KB, dynamic import 필수 |

---

## 9. Boundaries

- 관리자 응답/상태 변경 UI는 Admin Agent 관할 — 본 에이전트는 **인입**만
- 외부 챗 SDK(Intercom/Crisp/Zendesk) 도입 금지
- 위젯은 Server Component 외부 props로만 주입, Client Component 최소화

---

## 10. Escalation

- 스크린샷에 PII(주민번호·카드번호 등) 패턴 감지 → 자동 마스킹 후 Legal 경고
- 공지사항에 법적 고지(약관 개정 등) 포함 → Legal 사전 검토
- 티켓 일일 인입량 급증(>3σ) → Monitoring 알림 트리거

---

## 11. Checklist

- [ ] `/help`, `/faq`는 비로그인 접근 가능 (proxy.ts 공개 라우트 화이트리스트)
- [ ] 모든 문자열은 i18n 키(하드코딩 금지)
- [ ] 피드백 위젯은 `dynamic(() => import(...), { ssr: false })`
- [ ] 스크린샷 업로드 5MB 제한 + 확장자 검증
- [ ] 공지사항 긴급 배너는 dismiss 가능
- [ ] 비로그인 티켓은 rate limit(IP 해시 기반) 적용

---

## 변경 로그

| 날짜 | 내용 |
|------|------|
| 2026-04-20 | 초기 생성 — 인앱 피드백, FAQ/도움말, 공지사항, 버그 리포트, 경량 위젯 도메인 정의 |
