---
alwaysApply: false
description: "AI 기능 에이전트 — 채팅, 리포트, 페르소나, 요약, 자동태깅, 3-프로바이더 관리"
globs:
  - "app/(main)/chat/**"
  - "app/(main)/persona/**"
  - "app/actions/ai/**"
  - "app/api/ai/**"
  - "app/api/chat/**"
  - "components/ai/**"
  - "components/persona/**"
  - "lib/ai/**"
  - "types/ai/**"
---

# AI Agent

## 1. Identity

AI 기능 전체를 관할하는 에이전트. 채팅·리포트·페르소나·요약·자동태깅·OCR 보정 설정·토큰 추적을 담당한다.

---

## 2. Provider Fallback Chain

| 순서 | 프로바이더 | 모델 | 비고 |
|------|-----------|------|------|
| Default | Google Gemini | gemini-2.0-flash | 무료 티어 우선 |
| Fallback 1 | OpenAI | gpt-4o-mini | 비용 효율 |
| Fallback 2 | Anthropic | claude-3-5-sonnet | 최후 수단 |
| All fail | — | — | 에러 반환 + Orchestrator 에스컬레이션 |

- 프로바이더 선택 로직은 `lib/ai/providers/index.ts`에서 관리한다.
- 프로바이더는 `ai_settings` 테이블의 설정값에 따라 명시적으로 선택된다.
- 토큰 사용량은 호출마다 `ai_settings` 테이블에 누적한다.

---

## 3. Responsibilities

### 3-1. AI 채팅
- SSE(Server-Sent Events) 스트리밍으로 응답 전송 (`/api/chat`)
- 유저 데이터 기반 동적 system prompt 생성 (섹션 5 참조)
- 세션 단위 대화 기록: `chat_sessions` / `chat_messages`

### 3-2. AI 리포트
- 주간·월간·온디맨드 리포트 생성 (`app/actions/ai/reports.ts`)
- `reading_progress` 데이터 포함
- 생성 결과: `ai_reports` 저장, 반응: `report_reactions`

### 3-3. 페르소나 분석
- 독서 습관 기반 지적 프로필 생성
- 결과: `user_personas` 저장
- 트리거: 완독 5권 이상 또는 온디맨드 요청

### 3-4. 책 설명 요약
- `description_summary` 필드: **25-35자** 이내 한국어 요약
- 신규 책 등록 또는 관리자 요청 시 자동 실행

### 3-5. 자동 태깅
- 엔드포인트: `POST /api/ai/auto-tag`
- 노트 본문 분석 후 관련 태그 3-5개 반환
- 기존 태그 목록 우선 재사용, 없으면 신규 생성 제안

### 3-6. OCR 보정 설정
- `ocr_correction_settings` 테이블에서 보정 규칙 CRUD
- OCR 처리 자체는 **Records Agent** 담당 (이 에이전트 범위 외)

### 3-7. 토큰 사용량 추적
- 모델·호출 유형·토큰 수·비용 추정치를 `ai_settings`에 기록
- 월별 집계 API: `GET /api/ai/usage`

---

## 4. DB Tables

| 테이블 | 용도 |
|--------|------|
| `chat_sessions` | 채팅 세션 |
| `chat_messages` | 메시지 기록 |
| `ai_settings` | 프로바이더 설정 + 토큰 사용량 |
| `ai_generated_reports` | 생성된 리포트 |
| `report_reactions` | 리포트 반응(좋아요 등) |
| `user_personas` | 페르소나 분석 결과 |
| `user_ai_memories` | 유저별 AI 장기 기억 |
| `ai_report_settings` | 리포트 수신 설정 |

모든 테이블은 RLS 필수 (`auth.uid() = user_id` 패턴).

---

## 5. Dynamic Prompt Generation

system prompt 구성 순서:

1. **관리자 설정 base prompt** (`ai_settings.base_prompt`)
2. **유저 페르소나** (`user_personas` 최신 1건)
3. **최근 독서 5권** (완독 기준, 제목·저자·완독일)
4. **최근 노트 10건** (생성일 내림차순, 본문 200자 truncate)
5. **독서 목표** (유저 설정값)

컨텍스트 토큰이 모델 한도의 80%를 초과하면 노트 수를 줄여 조정한다.

---

## 6. Boundaries (범위 외)

| 작업 | 담당 에이전트 |
|------|-------------|
| OCR 이미지 처리 | Records Agent |
| 자유기록 AI 분석 | FreeNotes Agent (협업) |
| 포인트 소비 차감 | Identity Agent |

협업이 필요할 때는 해당 에이전트의 액션을 직접 호출하지 않고 Orchestrator를 통해 위임한다.

---

## 7. Escalation 조건

다음 상황 발생 시 Orchestrator에 즉시 에스컬레이션:

- 전체 프로바이더(Gemini → OpenAI → Anthropic) 동시 장애
- 월간 토큰 비용이 설정 임계값 초과
- system prompt 변경이 다른 도메인(리포트·페르소나 등)에 영향을 줄 경우
