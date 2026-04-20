# 게이미피케이션 이코노미 규칙

> 주 소유자: Engagement Agent
> 공동 참조: Identity Agent, Legal Agent (선불전자지급수단)

---

## 1. 포인트 이코노미 원칙

### 1-1. 인플레이션 방지

모든 신규 보상 추가 시 다음 3단계를 거친다:

1. **경제 시뮬레이션**: 월간 예상 적립량·소비량 추정 (`doc/engagement/economy-simulation.md`)
2. **기존 보상 영향 분석**: 신규 보상이 기존 행동 동기를 약화시키는지 검토
3. **소비처 동시 설계**: 적립만 있고 소비가 없는 보상 금지

### 1-2. 포인트 공급·수요 균형

| 유형 | 예상 적립 (월/유저) | 예상 소비 (월/유저) |
|------|:------------------:|:------------------:|
| 활발 사용자 | 1,500~3,000P | 1,000~2,500P |
| 보통 사용자 | 500~1,500P | 300~800P |
| 저활동 사용자 | 0~500P | 0~200P |

**잉여 포인트 > 3개월치 소비분**이면 인플레이션 경보 → Engagement + Identity 협의

### 1-3. 포인트 소비처 의무

새 포인트 적립 액션 추가 시, 동일 Wave 내에 최소 1개의 소비처가 존재해야 한다.

---

## 2. 남용 방지 (Anti-abuse)

### 2-1. 동일 행동 재적립 차단

```typescript
// ✅ 올바른 예
const existing = await db.point_transactions
  .where({ user_id, action_key, target_id })
  .first();
if (existing) return { error: "ALREADY_EARNED" };
```

### 2-2. Rate Limit 필수

- 동일 action_key: 1분당 최대 N회 (config에 정의)
- 예: `note_created` 1분당 5회 (실제 작성 속도 상한)

### 2-3. 서버 검증 의무

- 클라이언트 판정 금지 — 적립·수여는 반드시 서버 액션
- 트리거 이벤트는 DB 상태 확인 후 판정 (예: 완독은 `books.status='done'` 실제 확인)

---

## 3. A/B 테스트 필수화

### 3-1. 신규 보상은 반드시 실험으로 출시

```typescript
const variant = await getExperimentVariant(user_id, 'weekly_goal_v1');
if (variant === 'control') {
  // 기존 동작
} else if (variant === 'treatment') {
  // 신규 보상 동작
}
```

### 3-2. 실험 정의 없이 릴리즈 금지

- `experiments` 테이블에 등록
- `experiment_key`, `start_at`, `end_at`, `success_metric` 필수
- 종료 조건 없는 실험 금지 (최대 90일 자동 종료)

### 3-3. 결과 판정

- Analytics Agent가 통계 유의성 계산
- p < 0.05, 샘플 크기 ≥ 실험 전 산정값 충족 시 판정
- 유의미한 악화(-10%) 즉시 실험 중단

---

## 4. 포인트 상점 상품 검증

### 4-1. 상품 등록 체크리스트

- [ ] 상품 유형: 가상재화(아바타·테마·한정 해제)만 허용
- [ ] 환급·양도·현금 교환 기능 없음 (선불전자지급수단 재분류 위험)
- [ ] 재고(`stock`) 또는 쿨다운(`cooldown_days`) 설정
- [ ] 한정 상품은 수량 명시
- [ ] Legal Agent 사전 검토 통과

### 4-2. 금지 상품

- 외부 서비스 쿠폰/상품권
- 현금성 환급
- 타 사용자 양도 기능
- 경매·거래소 형태

---

## 5. 접근성 규칙

### 5-1. 필수 준수

- **prefers-reduced-motion**: 완독 축하 애니메이션 축소/제거
- **오디오**: 기본 무음, 설정에서 활성화
- **진동**: 모바일 기본 무진동, 옵트인만

### 5-2. 색상

- 뱃지·레벨 색상은 명도 대비 4.5:1 이상
- 색상 외 텍스트/아이콘 보조 정보 제공

---

## 6. 레벨·스트릭 소유권

- **레벨 임계값 변경 금지** — Identity Agent + 사용자 확인 필수
- **스트릭 계산 로직 변경 금지** — `user_points.streak_days`는 Identity 소유
- Engagement는 **표시·보상**만 담당

---

## 7. 이벤트 송출 표준

모든 게이미피케이션 이벤트는 Analytics Agent로 송출:

```typescript
await track('engagement.achievement_granted', {
  user_id,
  achievement_key: 'first_finish',
  points_reward: 100,
  schema_version: 1,
});
```

네임스페이스: `engagement.*` (참고: `event_schema_rule.md` §1)

---

## 8. 변경 로그

| 날짜 | 내용 |
|------|------|
| 2026-04-20 | 초기 생성 — 인플레이션 방지, 남용 방지, A/B 필수, 상점 상품 검증, 접근성 표준 |
