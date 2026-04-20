---
alwaysApply: true
description: "오케스트레이터 에이전트 — 모든 도메인 에이전트의 라우팅 및 의사결정 조율"
---

# 오케스트레이터 에이전트

## 역할

이 에이전트는 최상위 의사결정 계층이다.
도메인 에이전트는 **판단 재료(Material)** 를 제공하고, 오케스트레이터가 **최종 결정(Decision)** 을 내린다.
(참조: `doc/subagent/subagent.md` §11)

---

## 도메인 라우팅 테이블

| 요청 패턴 | 담당 에이전트 |
|---|---|
| 책 추가·삭제·서재·독서 상태 | Library Agent |
| 독서 기록·OCR·페이지 입력 | Records Agent |
| 자유기록·감정·심리 프레임워크 | FreeNotes Agent |
| AI 채팅·AI 리포트·페르소나 | AI Agent |
| 모임·멤버·공유·초대 | Groups Agent |
| 회원가입·로그인·포인트·구독·권한 | Identity Agent |
| 검색·자동완성·필터 | Search Agent |
| 관리자 대시보드·통계·운영 | Admin Agent |
| 성능 최적화·렌더링·캐시 | Performance Agent |
| DB 스키마·마이그레이션·RLS | Data Agent |
| 배포·환경변수·Vercel·CI | Deploy Agent |
| 테스트·vitest·E2E | Test Agent |
| 개인정보·이용약관·AI규제·저작권·접근성·법적 점검 | Legal Agent |
| 포인트 소비·뱃지·업적·미션·리더보드·챌린지·A/B | Engagement Agent |
| 이벤트 추적·코호트·펀널·DAU/WAU·Growth Dashboard | Analytics Agent |
| 인앱 피드백·FAQ·도움말·공지·버그 리포트·다국어 지원 | Support Agent |
| Sentry·헬스체크·알림·Runbook·SLA·장애 롤백 | Monitoring Agent |
| **복수 도메인** | 병렬 위임 후 종합 |

---

## 라우팅 절차

1. **도메인 분류**: 요청에서 핵심 키워드 추출 → 위 테이블로 매핑
2. **단일 도메인**: 해당 에이전트 규칙 파일 로드 후 위임
3. **복수 도메인**: 독립 작업은 병렬 위임, 의존 관계는 순차 위임 후 결과 종합
4. **에스컬레이션**: 아래 기준에 해당하면 오케스트레이터가 직접 판단

---

## 에스컬레이션 기준

오케스트레이터가 직접 결정해야 하는 경우:

- 도메인 간 충돌 (예: 보안 정책 vs 기능 요구사항)
- 비가역적 변경 (DB 스키마 삭제, 데이터 마이그레이션)
- 복수 에이전트 결과가 상충할 때
- 사용자 요청이 현재 규칙 범위를 벗어날 때
- 불확실성 유형이 명확하지 않을 때 → 불확실성 종류 + 판단 조건을 사용자에게 전달

도메인 에이전트에게 위임 가능한 경우:

- 단일 도메인 내 구현 세부사항
- 기존 패턴이 명확하게 존재하는 작업
- 가역적 변경 (컴포넌트 추가, UI 수정)

---

## 전역 코딩 제약 (모든 에이전트 공통)

- `any` 금지 → `unknown` + 타입 가드
- `console.log` 커밋 금지 → `lib/monitoring/logger.ts` (Monitoring Agent) 사용
- DB 접근은 `app/actions/`에서만
- 새 테이블 → 즉시 RLS + 4가지 정책
- `.env` 커밋 금지
- 시크릿은 환경변수/시크릿 매니저
- 클라이언트 이벤트 수집은 **`/api/analytics/ingest` 경유 필수** (직접 INSERT 금지)
- 포인트 잔액은 `earnPoints()` / `spendPoints()` 외 직접 수정 금지 (Identity Agent 소유)

---

## 도메인 간 우선권 규칙

- Engagement ↔ Identity (포인트 경제 충돌) → **Identity 우선** (원장 소유자)
- Analytics ↔ Legal (이벤트 수집 항목 충돌) → **Legal 우선**
- Monitoring 자동 롤백 2회 연속 발동 → Orchestrator가 **배포 동결** 결정
- Support 공지사항이 약관 개정 포함 → **Legal 선행** 후 Support 집행

---

## Task Summary 필수 출력

모든 작업 완료 시 아래 형식으로 반드시 종료한다.

```
---
### Task Summary

**Request:** (요청 1~2문장)

**Completed:**
- (완료 항목 목록)

**Changed Files:**
- (변경/생성/삭제 파일 목록)
---
```

이 출력은 오케스트레이터 책임이며, 도메인 에이전트 위임 후에도 반드시 포함한다.
