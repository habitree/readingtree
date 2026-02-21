# Habitree Reading Hub v4.0.0 - Claude Code Rules

> `.agent/rules/`가 작업 관련 규칙을 자동 로드합니다. 전체 규칙 참조가 필요하면 `doc/claude/RULES.md`를 확인하세요.

---

## 필수 규칙 파일

**상세 규칙**: `doc/claude/RULES.md` (통합 레퍼런스)

`.agent/rules/`가 조건부 자동 로드되므로 별도 참조 불필요. 전체 규칙 확인 시만 열람.

---

## 핵심 요약

### 기본
- **언어**: 한국어 응답
- **프레임워크**: Next.js 15 + Supabase
- **배포**: Vercel

### 인증
- `getCurrentUser()` 사용 (직접 getUser 금지)
- 세션 읽기는 서버에서만

### 레이어 분리
```
components/ → hooks/ → app/actions/ → Supabase
```
- DB 접근은 `app/actions/`에서만

### DB/RLS
- 테이블 생성 → 즉시 RLS + 4가지 정책
- `auth.uid() = user_id` 패턴

### 마이그레이션
- 파일명: `migration-YYYYMMDDHHmm__<기능>__<내용>.sql`
- 위치: `doc/database/`
- Idempotent 작성 필수

---

## 룰 동기화

| 원본 | Claude 룰 |
|------|-----------|
| `.agent/rules/` | `doc/claude/RULES.md` |

**`.agent/rules/` 변경 시 `doc/claude/RULES.md`도 함께 업데이트 필수**

---

## 참고 문서

- 상세 규칙: `doc/claude/RULES.md`
- 데이터 모델: `doc/database/DATA_MODEL.md`
- 타입 정의: `types/database.ts`

---

## Completion Summary (Task Report)

Every task completion MUST end with the following summary format:

---
### Task Summary

**Request:** (what the user asked for - 1~2 sentences)

**Completed:**
- (list of completed items as bullet points)

**Changed Files:**
- (list of modified/created/deleted files, if any)
---
