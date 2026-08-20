# Habitree Reading Hub v4.0.0 - Claude Code Rules

> `.agent/rules/`가 작업 관련 규칙을 자동 로드합니다. 전체 규칙 참조가 필요하면 `doc/claude/RULES.md`를 확인하세요.

---

## 필수 규칙 파일

**상세 규칙**: `doc/claude/RULES.md` (통합 레퍼런스)

`.agent/rules/`가 조건부 자동 로드되므로 별도 참조 불필요. 전체 규칙 확인 시만 열람.

---

## 작업 원칙

> 흔한 LLM 코딩 실수를 줄이기 위한 행동 규칙. **속도보다 신중함**에 무게를 둔다.
> 타이포 수정처럼 사소한 작업은 판단에 따라 생략 가능.

### 1. 코딩 전에 생각 — 넘겨짚지 말고, 혼란을 숨기지 말 것

- 가정은 명시적으로 밝힌다. 불확실하면 질문한다.
- 요청의 해석이 여러 개면 임의로 고르지 말고 선택지를 제시한다.
- 더 단순한 방법이 있으면 말한다. 근거가 있으면 반대 의견도 낸다.
- 불명확한 게 있으면 멈추고, 무엇이 헷갈리는지 짚은 뒤 질문한다.

### 2. 단순함 우선 — 문제를 푸는 최소한의 코드만

- 요청하지 않은 기능 추가 금지
- 1회용 코드에 추상화 금지
- 요청하지 않은 "유연성"·"설정 가능성" 금지
- 발생 불가능한 시나리오에 대한 에러 처리 금지
- 200줄을 썼는데 50줄로 될 일이면 다시 쓴다

판단 기준: **"시니어 개발자가 과하다고 할까?"** → 그렇다면 단순화한다.

### 3. 외과적 변경 — 꼭 필요한 곳만 건드린다

- 주변 코드·주석·포맷을 덤으로 "개선"하지 않는다
- 망가지지 않은 것을 리팩터링하지 않는다
- 내 취향과 달라도 기존 스타일에 맞춘다
- 관련 없는 죽은 코드를 발견하면 언급만 하고 지우지 않는다
- 단, **내 변경 때문에** 미아가 된 import·변수·함수는 내가 제거한다

판단 기준: **변경된 모든 줄이 요청과 직접 연결**되어야 한다.

### 4. 목표 기반 실행 — 성공 기준을 정하고 검증될 때까지 반복

작업을 검증 가능한 목표로 바꾼다.

- "검증 추가" → "잘못된 입력에 대한 테스트를 쓰고 통과시킨다"
- "버그 수정" → "버그를 재현하는 테스트를 쓰고 통과시킨다"
- "X 리팩터링" → "변경 전후로 테스트가 통과하는지 확인한다"

다단계 작업은 짧은 계획을 먼저 밝힌다.

```
1. [단계] → 검증: [확인 방법]
2. [단계] → 검증: [확인 방법]
```

성공 기준이 뚜렷하면 스스로 반복해서 끝낼 수 있고, "되게 해줘" 같은 약한 기준은 계속 되묻게 만든다.

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

## 프롬프트 로그

- 위치: `doc/log/` (README.md, milestone.md, 월별 로그)
- 의미 있는 작업 완료 시 해당 월 로그(`doc/log/YYYY-MM.md`)에 엔트리 추가
- P0 엔트리는 `doc/log/milestone.md`에도 반영
- 단순 타이포/커밋 메시지로 충분한 작업은 기록하지 않음

---

## 참고 문서

- 상세 규칙: `doc/claude/RULES.md`
- 데이터 모델: `doc/database/DATA_MODEL.md`
- 타입 정의: `types/database.ts`
- 프롬프트 로그 가이드: `doc/log/README.md`
- 인프라 과금 현황·점검: `doc/cost/README.md` (실제 청구서 / 포인트·구독 원가는 `doc/business/`)

---

## 작업 요청 관리

- 신규 요청·기획은 **`.backlog/`** 에서 REQ 문서로 관리한다 (운영 방식은 backlog Skill).
- 완료·폐기된 과거 기획 문서는 `doc/archive/2026/` 에 있다. **현행 코드와 다를 수 있으므로
  이 문서들을 근거로 코드를 고치지 않는다** — 배경 확인용으로만 읽는다.
- `doc/` 에 새 기획 문서를 만들지 않는다. `.backlog/` 를 쓴다.

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

