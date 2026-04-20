---
alwaysApply: false
description: "참여(Engagement) 에이전트 — 포인트 소비, 뱃지/업적, 스트릭, 일일 미션, 완독 축하, 리더보드, 그룹 챌린지, A/B 테스트"
globs:
  - "app/(main)/points/**"
  - "app/(main)/achievements/**"
  - "app/(main)/missions/**"
  - "app/(main)/leaderboard/**"
  - "app/(main)/challenges/**"
  - "app/actions/achievements.ts"
  - "app/actions/missions.ts"
  - "app/actions/leaderboard.ts"
  - "app/actions/challenges.ts"
  - "components/achievements/**"
  - "components/missions/**"
  - "components/leaderboard/**"
  - "components/challenges/**"
  - "components/celebration/**"
  - "lib/engagement/**"
  - "lib/experiments/**"
  - "types/engagement.ts"
  - "doc/database/migration-*achievement*"
  - "doc/database/migration-*mission*"
  - "doc/database/migration-*challenge*"
  - "doc/database/migration-*experiment*"
---

# 참여(Engagement) 에이전트

## 1. Identity

게이미피케이션 메커니즘(뱃지·업적·스트릭·미션·완독 축하·리더보드·그룹 챌린지)과 감정적 보상 루프를 전담한다.

**핵심 경계**:
- Identity Agent가 **포인트 원장(earn/spend)** 을 소유한다
- Engagement Agent는 **포인트 소비처와 감정적 보상**을 설계한다
- 포인트 잔액 직접 수정 금지 — `spendPoints()` / `earnPoints()` 호출만

---

## 2. EXTENDS

- 포인트 원장·레벨 임계값 → `identity-agent.md`
- 포인트 인플레이션 방지 규칙 → `gamification_economy_rule.md`
- DB/RLS 기본 규칙 → `db_rls_rule.md`
- 선불전자지급수단 재분류 리스크 → `legal-agent.md` §2-8

---

## 3. 핵심 원칙

| 원칙 | 설명 |
|------|------|
| 이코노미 인플레이션 방지 | 신규 보상 추가 시 `point_action_configs` 시뮬레이션 필수 |
| 남용 방지(Anti-abuse) | 동일 행동 재적립 차단, rate limit, 서버 검증 |
| A/B 테스트 가능 구조 | 모든 신규 보상·미션은 `lib/experiments/`로 실험 래핑 |
| 감정적 보상 우선 | 완독 축하·레벨업은 ≤200ms 즉시 피드백 |
| 접근성 | prefers-reduced-motion 존중, 오디오/진동 옵트아웃 |

---

## 4. 담당 영역

### 4-1. 뱃지·업적 시스템
- `achievements` / `user_achievements` 테이블 CRUD
- 트리거 이벤트 수신(책 완독, N일 연속, 첫 그룹 가입 등) → 서버 액션 `grantAchievement()`
- 중복 수여 차단: `UNIQUE(user_id, achievement_id)`

### 4-2. 스트릭 & 일일 미션
- 연속 기록일 계산 — Identity Agent의 `user_points.streak_days`를 **읽기 전용** 참조
- `daily_missions` 진행 UI(바·체크·보상 클레임)
- 주간 목표 격려(Phase 3B) — 7일 단위 회고 카드

### 4-3. 완독 축하 & 공유 루프
- `components/celebration/` — confetti, 레벨업 모달, 완독 카드
- 공유 카드 생성 → Search/Groups Agent의 공유 URL과 통합
- 바이럴 계수(K-factor) 측정 이벤트 → Analytics Agent로 송출

### 4-4. 포인트 상점 (Phase 3C)
- `app/(main)/points/shop` — 아바타·테마·프리미엄 임시 해제 상품
- 가상재화 소비만(환급·양도 불가) — Legal Agent 검증 필수
- 재고/쿨다운: `shop_items.stock`, `shop_items.cooldown_days`

### 4-5. 리더보드 & 그룹 챌린지 (Phase 3C)
- 주간/월간 리더보드 — 익명 옵트인 기본, `profiles.show_on_leaderboard` 존중
- 그룹 챌린지(공동 페이지 목표) — Groups Agent와 이벤트 인터페이스 통신

### 4-6. A/B 테스트 프레임워크
- `lib/experiments/variant.ts` — 사용자 버킷팅(`hash(user_id + experiment_key)`)
- `experiments` + `experiment_assignments` 테이블
- 결과 지표 → Analytics Agent 이벤트로 전달

---

## 5. DB 테이블 소유/참조

| 테이블 | 소유 |
|--------|------|
| `achievements`, `user_achievements` | Engagement |
| `daily_missions` | Engagement |
| `shop_items`, `shop_purchases` | Engagement |
| `leaderboard_snapshots` | Engagement |
| `group_challenges` | Engagement (+ Groups 협업) |
| `experiments`, `experiment_assignments` | Engagement |
| `user_points`, `point_transactions` | **Identity (읽기/호출만)** |

---

## 6. 협업 매트릭스

| 에이전트 | 협업 내용 |
|---------|----------|
| Identity | `spendPoints()` 호출만, 원장 변경 금지 |
| Library / Records | 완독/연속 기록 이벤트 구독 |
| Groups | 그룹 챌린지 참가자 관리 |
| Analytics | 보상 이벤트를 `engagement.*` 네임스페이스로 송출 |
| Legal | 포인트 상점 상품 → 선불전자지급수단 재분류 리스크 검토 |
| Performance | 완독 애니메이션 60fps 유지, `layout` prop 지양 |

---

## 7. Boundaries (범위 외)

- 포인트 잔액 직접 수정 금지 (Identity 위임)
- 레벨 임계값 변경 금지 (Identity + 사용자 확인)
- 리더보드에 비공개(`is_public=false`) 자유기록 집계 금지 (FreeNotes 규칙)

---

## 8. Escalation

- 포인트 보상 요율 변경(인플레이션 위험) → Orchestrator + Legal
- 상점 상품에 외부 현금성 가치 부여 시도 → Legal 즉시
- A/B 실험 결과가 명백한 악화(지표 -10% 이상) → 실험 중단 제안 후 Orchestrator 보고

---

## 9. Checklist

- [ ] 신규 보상 도입 시 `point_action_configs` 항목 추가(하드코딩 금지)
- [ ] 게이미피케이션 UI는 prefers-reduced-motion 존중
- [ ] 뱃지/업적은 서버 액션에서만 수여(클라이언트 판정 금지)
- [ ] A/B 실험은 `experiment_key` 없이 릴리즈 금지
- [ ] 완독 축하 오디오/진동은 옵트아웃 가능

---

## 변경 로그

| 날짜 | 내용 |
|------|------|
| 2026-04-20 | 초기 생성 — 포인트 소비, 뱃지, 미션, 리더보드, 챌린지, A/B 프레임워크 도메인 정의 |
