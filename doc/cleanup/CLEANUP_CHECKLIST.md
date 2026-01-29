# ReadTree v4.0.0 정리 체크리스트

> **최종 업데이트**: 2026-01-29
> **목적**: 프로젝트 정리 작업 추적 및 체크리스트

---

## 목차

1. [Deprecated 파일 삭제](#1-deprecated-파일-삭제)
2. [불필요한 페이지 삭제](#2-불필요한-페이지-삭제)
3. [마이그레이션 파일 정리](#3-마이그레이션-파일-정리)
4. [doc/question 정리](#4-docquestion-정리)
5. [검증 체크리스트](#5-검증-체크리스트)

---

## 1. Deprecated 파일 삭제

### 1.1 Deprecated 컴포넌트

새로운 `components/ai/chat/` 컴포넌트로 대체됨.

| 상태 | 파일 | 대체 파일 | 비고 |
|------|------|----------|------|
| [ ] | `components/chat/chat-input.tsx` | `components/ai/chat/chat-input.tsx` | 구 채팅 입력 |
| [ ] | `components/chat/chat-interface.tsx` | `components/ai/chat/chat-interface.tsx` | 구 채팅 인터페이스 |
| [ ] | `components/chat/chat-message.tsx` | `components/ai/chat/chat-message.tsx` | 구 채팅 메시지 |
| [ ] | `components/chat/chat-sidebar.tsx` | `components/ai/chat/chat-sidebar.tsx` | 구 채팅 사이드바 |
| [ ] | `components/admin/ai-settings-panel.tsx` | `components/ai/admin/ai-settings-panel.tsx` | 구 AI 설정 패널 |

**삭제 전 확인사항:**
```bash
# 의존성 확인
grep -r "from.*components/chat/" --include="*.tsx" --include="*.ts"
grep -r "components/admin/ai-settings-panel" --include="*.tsx" --include="*.ts"
```

### 1.2 Deprecated Actions

새로운 `app/actions/ai/` Actions로 대체됨.

| 상태 | 파일 | 대체 파일 | 비고 |
|------|------|----------|------|
| [ ] | `app/actions/ai-settings.ts` | `app/actions/ai/settings.ts` | 구 AI 설정 |
| [ ] | `app/actions/chat.ts` | `app/actions/ai/chat.ts` | 구 채팅 |
| [ ] | `app/actions/ocr.ts` | `app/actions/ai/ocr.ts` | 구 OCR |
| [ ] | `app/actions/persona.ts` | `app/actions/ai/persona.ts` | 구 페르소나 |

**삭제 전 확인사항:**
```bash
# 의존성 확인
grep -r "from.*app/actions/chat" --include="*.tsx" --include="*.ts"
grep -r "from.*app/actions/ai-settings" --include="*.tsx" --include="*.ts"
grep -r "from.*app/actions/ocr" --include="*.tsx" --include="*.ts"
grep -r "from.*app/actions/persona" --include="*.tsx" --include="*.ts"
```

### 1.3 Deprecated Types

| 상태 | 파일 | 대체 | 비고 |
|------|------|------|------|
| [ ] | `types/ai-settings.ts` | `types/database.ts` 또는 inline | AI 설정 타입 |
| [ ] | `types/chat.ts` | `types/database.ts` 또는 inline | 채팅 타입 |
| [ ] | `types/persona.ts` | `types/database.ts` 또는 inline | 페르소나 타입 |

**삭제 전 확인사항:**
```bash
# 의존성 확인
grep -r "from.*types/ai-settings" --include="*.tsx" --include="*.ts"
grep -r "from.*types/chat" --include="*.tsx" --include="*.ts"
grep -r "from.*types/persona" --include="*.tsx" --include="*.ts"
```

---

## 2. 불필요한 페이지 삭제

| 상태 | 페이지 | 경로 | 삭제 이유 |
|------|--------|------|----------|
| [ ] | 테스트 페이지 | `app/test/page.tsx` | 개발용 테스트 페이지 |
| [ ] | 동의 페이지 | `app/(auth)/onboarding/consent/page.tsx` | 불필요 (온보딩 메인에 통합) |

**삭제 전 확인사항:**
```bash
# 참조 확인
grep -r "/test" --include="*.tsx" --include="*.ts"
grep -r "onboarding/consent" --include="*.tsx" --include="*.ts"
```

---

## 3. 마이그레이션 파일 정리

### 3.1 참고용 파일 분리

`doc/database/reference/` 폴더로 이동할 파일들:

| 상태 | 파일 | 이유 |
|------|------|------|
| [ ] | `verification-queries.sql` | 검증 쿼리 (실행용 아님) |
| [ ] | `sample-data.sql` | 샘플 데이터 (참고용) |
| [ ] | `schema.sql` | 스키마 덤프 (참고용) |
| [ ] | `check-completed-dates.sql` | 확인 쿼리 |
| [ ] | `verify-reading-status-enum.sql` | 확인 쿼리 |
| [ ] | `migration-check-bookshelves-rls.sql` | 확인 쿼리 |

**작업:**
```bash
# reference 폴더 생성
mkdir -p doc/database/reference

# 파일 이동
mv doc/database/verification-queries.sql doc/database/reference/
mv doc/database/sample-data.sql doc/database/reference/
mv doc/database/schema.sql doc/database/reference/
mv doc/database/check-*.sql doc/database/reference/
mv doc/database/verify-*.sql doc/database/reference/
mv doc/database/migration-check-*.sql doc/database/reference/
```

### 3.2 마이그레이션 파일명 검토

규칙: `migration-YYYYMMDDHHmm__<기능명>__<변경내용>.sql`

규칙 위반 파일 (리네임 또는 이동):
| 상태 | 현재 파일명 | 문제 |
|------|------------|------|
| [ ] | `migration-add-sample-data.sql` | 타임스탬프 없음 |
| [ ] | `migration-fix-users-rls.sql` | 타임스탬프 없음 |
| [ ] | `migration-make-schema-idempotent.sql` | 타임스탬프 없음 |
| [ ] | `migration-fix-group-members-rls-recursion.sql` | 타임스탬프 없음 |
| [ ] | `migration-fix-groups-rls-members.sql` | 타임스탬프 없음 |

---

## 4. doc/question 정리

### 4.1 현재 상태

약 67개 파일이 `doc/question/` 폴더에 혼재되어 있음.

### 4.2 카테고리 분류 계획

```
doc/question/
├── deployment/          # 배포 관련
├── bug-fixes/           # 버그 수정
├── performance/         # 성능 최적화
├── authentication/      # 인증 관련
├── ocr/                 # OCR 관련
├── migration/           # 마이그레이션 관련
└── archived/            # 더 이상 관련 없는 문서
```

### 4.3 파일 분류

| 카테고리 | 파일 패턴 | 예시 |
|----------|----------|------|
| deployment | `deployment-*`, `github-*`, `vercel-*`, `manifest-*` | deployment-error-analysis.md |
| bug-fixes | `*-fix.md`, `*-troubleshooting.md` | book-404-error-debugging.md |
| authentication | `login-*`, `kakao-*`, `localhost-*` | kakao-login-fix-checklist.md |
| ocr | `ocr-*` | ocr-403-forbidden-troubleshooting.md |
| migration | `notion-*`, `migration-*` | notion-migration-plan.md |
| archived | 완료된 작업 관련 문서 | - |

---

## 5. 검증 체크리스트

### 5.1 삭제 전 검증

- [ ] TypeScript 컴파일 확인: `npx tsc --noEmit`
- [ ] 빌드 테스트: `npm run build`
- [ ] 의존성 검사 완료 (grep 명령 실행)

### 5.2 삭제 후 검증

- [ ] TypeScript 컴파일 성공: `npx tsc --noEmit`
- [ ] 빌드 성공: `npm run build`
- [ ] 개발 서버 정상 실행: `npm run dev`
- [ ] 주요 페이지 접근 테스트:
  - [ ] 홈 (`/`)
  - [ ] 로그인 (`/login`)
  - [ ] 내 서재 (`/books`)
  - [ ] 기록 (`/notes`)
  - [ ] 독서모임 (`/groups`)
  - [ ] AI 채팅 (`/chat`)
  - [ ] 페르소나 (`/persona`)
  - [ ] 프로필 (`/profile`)

### 5.3 Git 백업

- [ ] 작업 전 브랜치 생성: `git checkout -b backup/v4.0.0-pre-cleanup`
- [ ] 백업 브랜치 푸시: `git push origin backup/v4.0.0-pre-cleanup`

---

## 작업 로그

| 날짜 | 작업 | 상태 |
|------|------|------|
| 2026-01-29 | 체크리스트 문서 생성 | 완료 |
| | Deprecated 파일 의존성 확인 | 대기 |
| | Deprecated 파일 삭제 | 대기 |
| | 불필요한 페이지 삭제 | 대기 |
| | 마이그레이션 파일 정리 | 대기 |
| | doc/question 정리 | 대기 |
| | 빌드 검증 | 대기 |

---

**이 체크리스트를 따라 순차적으로 정리 작업을 수행하세요.**
