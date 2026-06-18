# 포인트 정산 시스템 점검 · 정리 · 개선 기획 (2026-06-16)

> 작성: 포인트가 "쌓이는 구조인데 빠지는" 증상 조사 의뢰에 따른 전수 점검.
> 결론: **잔액(`user_points.total_points`)을 트리거와 코드가 이중으로 관리**하는 구조 결함이 근본 원인.
> 실측: 프로덕션 사용자 21명 중 **13명 캐시-원장 불일치**, 실사용자 손실 거래 확인, 결제 경로는 **첫 결제 시 2배 적립/차감이 즉시 터지는 잠복 치명 버그**.

---

## 0. 한눈에 보는 결론

> **✅ 2026-06-16 1차 적용 완료** — `migration-202606161200__points__fix_balance_double_counting.sql`을 프로덕션에 적용(Supabase MCP). 적용 후 검증: 캐시-원장 불일치 실사용자 **13 → 0명**, 총 차액 0, 음수 잔액 0. B1·B2·B3·B6 해결.
>
> **✅ 2026-06-16 2차 적용 완료(클린 스타트)** — 결제 실충전 0건 확인 후 **포인트·결제 데이터 완전 초기화** + **적립/차감 규칙 SSoT 통일**(`migration-202606161400__points__reset_and_unify_ssot.sql`). B4 해결. 상세 §10.

| # | 문제 | 심각도 | 상태 | 영향 |
|---|------|--------|------|------|
| B1 | **잔액 이중 관리** (트리거 `trigger_update_user_points` + 각 RPC의 직접 UPDATE) | 🔴 치명 | ✅ 해결 | 결제 2배·동시성 손실의 공통 뿌리 |
| B2 | **결제 충전/환불 2배 적용** (`charge/refund_payment_points`가 트리거와 중복) | 🔴 치명 | ✅ 해결(무사고) | 첫 결제 시 충전 2배 적립 / 환불 2배 차감·음수 |
| B3 | **동시 적립 시 포인트 손실** (절대값 덮어쓰기가 트리거 누적분을 덮어씀) | 🟠 높음 | ✅ 해결+복구 | 실사용자 잔액 < 원장 (−10P 등), 경합 8건 |
| B6 | **레벨 트리거의 유령 컬럼 참조** (`update_user_level()`이 제거된 `point_levels.streak_bonus`·`user_points.streak_bonus_multiplier` 참조) | 🔴 치명 | ✅ 해결 | **레벨업 시점 적립이 통째 롤백 → 포인트 안 쌓임**(간헐) |
| B4 | **적립/차감 금액 SSoT 3중 불일치** (`types/points.ts` ↔ DB `point_action_configs` ↔ `POINT_SPEND_COSTS`) | 🟠 높음 | ✅ 해결 | UI 표시값 ≠ 실제 적립값 (예: 완독 60P 표시·50P 적립) |
| B5 | **레거시 배율 잔재** (`final_points ≠ points` 24건) | 🟡 중간 | ✅ 해소(초기화) | 원장 해석 혼란, 감사 신뢰도 저하 |

핵심 수정: **트리거 1개 제거로 잔액 관리를 "코드(RPC) 단일 소유"로 일원화** + **레벨 트리거 유령 컬럼 참조 제거** → B1·B2·B3·B6 동시 해결. 이어서 SSoT 정리(B4)는 후속 코드 작업.

> B6은 본 마이그레이션 적용(백필 UPDATE) 도중 발견됨: 백필이 `user_points`를 갱신하자 레벨 트리거가 존재하지 않는 `point_levels.streak_bonus`를 참조해 실패 → 함수를 배율 참조 없는 버전으로 교체. 레벨업 시점의 적립이 그동안 간헐적으로 롤백되어 온 또 다른 "안 쌓임" 원인이었음.

---

## 1. 포인트 정산 구조 개요

### 1.1 핵심 테이블
| 테이블 | 역할 |
|--------|------|
| `user_points` | **캐시 잔액**. `total_points`(현재 사용가능), `lifetime_points`(누적, 레벨 계산용), `current_level`, 스트릭 |
| `point_transactions` | **원장(불변 기록)**. `points`(원값), `final_points`(실제 반영값), `balance_after`(거래 후 잔액 스냅샷), `action_type`, `reference_id/type` |
| `point_action_configs` | **적립 기준값 SSoT**. `base_points`, `daily_limit`, `is_repeatable`, `is_active` |
| `point_levels` | 누적 포인트 → 레벨 매핑 |

### 1.2 잔액 산정 방식 — 하이브리드 (캐시 + 원장)
- 현재 잔액 = `user_points.total_points` (읽기 캐시)
- 진실(ground truth) = `SUM(point_transactions.final_points)` (원장 합)
- **정상 시스템이라면 둘은 항상 일치해야 함.** 본 점검의 핵심 지표가 이 일치 여부.

### 1.3 잔액이 바뀌는 모든 경로
```
[적립]  earnPoints()        → RPC earn_points_atomic()      → point_transactions INSERT(+) + user_points UPDATE(절대값)
[차감]  spendPoints()       → RPC spend_points_atomic()     → point_transactions INSERT(-) + user_points UPDATE(절대값)
[환불]  refundPoints()      → RPC spend_points_atomic(음수) → (정상 경로) / fallback: 직접 INSERT + 직접 UPDATE
[충전]  결제 confirm/webhook → RPC charge_payment_points()   → user_points UPDATE(상대값 +=) + point_transactions INSERT(+)
[취소]  결제 webhook        → RPC refund_payment_points()    → user_points UPDATE(상대값 -=) + point_transactions INSERT(-)
        + 모든 INSERT는 트리거 trigger_update_user_points 발동 → user_points UPDATE(상대값 += final_points)  ★중복★
```

---

## 2. 빠지는 포인트 / 쌓이는 포인트 정확한 정리

> **기준값 출처 주의:** 실제 적립은 `earn_points_atomic`이 **DB `point_action_configs.base_points`** 를 사용한다(코드 상수 아님). 실제 차감은 `spend_points_atomic(p_cost)`로 처리되며 `p_cost`는 **코드 `POINT_SPEND_COSTS`** 에서 온다(DB config의 음수값은 미사용·죽은 값). 아래 표는 **DB 실측값 기준**이며, 코드 상수와의 차이는 §4(B4)에 정리.

### 2.1 쌓이는 포인트 (적립) — DB `point_action_configs` 실측 (활성만)

| 카테고리 | action_type | 적립 | 반복 | 일일한도 |
|----------|-------------|------|------|----------|
| 독서 | `book_complete` (완독) | **50** | O | 무제한 |
| 독서 | `note_quote` (인용) | 15 | O | 10 |
| 독서 | `note_photo` (사진) | 12 | O | 10 |
| 독서 | `note_create` (기록) | 10 | O | 20 |
| 독서 | `note_memo` (메모) | 10 | O | 20 |
| 독서 | `book_add` (책 추가) | 5 | O | 10 |
| 스트릭 | `streak_100_days` | 500 | X | - |
| 스트릭 | `streak_30_days` | 200 | X | - |
| 스트릭 | `streak_7_days` | 50 | X | - |
| 스트릭 | `daily_first_activity` (첫 활동) | 5 | O | 1 |
| 미션 | `all_missions_complete` | 30 | O | 1 |
| 미션 | `mission_complete` | 10 | O | 3 |
| 소셜 | `referral_success` (추천 성공) | 200 | O | - |
| 소셜 | `referral_book_referrer` | 100 | O | - |
| 소셜 | `note_share` | 5 | O | 10 |
| 특별 | `welcome_bonus` (가입) | **300** | X | - |
| 특별 | `referral_bonus` | 100 | X | - |
| 특별 | `referral_book_referred` | 100 | X | - |
| 특별 | `referral_note_referred` | 100 | X | - |
| 특별 | `first_book` | 30 | X | - |
| 특별 | `first_note` | 20 | X | - |
| 커뮤니티 | `feature_request_adopted` | 50 | O | - |
| 커뮤니티 | `feature_request_create` | 10 | O | 3 |
| 커뮤니티 | `feature_request_vote` | 2 | O | 10 |

**비활성(`is_active=false`) — 정의는 있으나 적립 안 됨:** `note_transcription`(20), `book_progress_update`(3), `group_create`(30), `group_join`(10), `streak_365/14/3_days`, `yearly_goal_achieve`(500), `monthly_goal_achieve`(100)

### 2.2 빠지는 포인트 (차감) — 실제 차감 단가는 `POINT_SPEND_COSTS`

| 기능 | spendType | 실제 차감(코드) | DB config 음수값(죽은 값) | 트리거 발동 action_type |
|------|-----------|----------------|--------------------------|------------------------|
| AI 채팅 추가 | `ai_chat` | **40** | -100 | `ai_chat_spend` |
| OCR 추가 | `ocr_process` | **25** | -80 | `ocr_spend` |
| AI 리포트 추가 | `ai_report` | **100** | -150 | `ai_report_spend` |
| 모임 생성 | `group_create` | **300** | (config 미사용) | `group_create_spend` |
| 모임 참여 | `group_join` | **200** | - | `group_join_spend` |
| 서재 생성 | `bookshelf_create` | **150** | - | `bookshelf_create_spend` |
| 노트 추가 | `note_create` | **10** | - | `note_create_spend` |

- 차감은 한도 초과분에 대해서만(무료 한도까지는 0P). 구독 등급(reader_v2/master_v2)에 따라 한도·단가 상이 → `lib/subscription/gates.ts`.
- 차감 기록: `point_transactions`에 `points = final_points = -cost`(음수), `balance_after = 차감 후 잔액`.

### 2.3 시스템/정산 action_type
`point_purchase`(결제 충전, +), `point_refund`(환불, 가변), `admin_adjust`(수동 조정, 0 base) — 모두 base_points=0이며 금액은 호출부에서 직접 지정.

### 2.4 프로덕션 실제 적립/차감 분포 (point_transactions 158건)
| action_type | 건수 | 합계(final) | 기간 |
|-------------|------|-------------|------|
| daily_first_activity | 55 | +322 | 01-25~03-29 |
| note_memo | 33 | +338 | 01-28~03-29 |
| **note_create_spend** | 29 | **−290** | 04-15~05-26 |
| book_add | 11 | +55 | |
| mission_complete | 8 | +88 | |
| note_photo | 6 | +74 | |
| all_missions_complete | 6 | +188 | |
| first_book | 6 | +180 | |
| book_complete | 2 | +100 | |
| **group_create_spend** | 1 | **−300** | 04-12 |
| note_quote | 1 | +15 | |

→ **결제 충전/환불(`point_purchase`/`point_refund`) 거래는 0건.** 즉 결제 2배 버그(B2)는 아직 발현 전 = 지금 고치면 무사고로 막을 수 있는 골든타임.

---

## 3. 근본 원인: 잔액 이중 관리 (B1)

### 3.1 트리거는 "상대값 += "로 잔액을 갱신
`doc/database/migration-202501251800__points__create_point_system.sql:272-299`
```sql
CREATE TRIGGER trigger_update_user_points
  AFTER INSERT ON point_transactions FOR EACH ROW
  EXECUTE FUNCTION update_user_points_on_transaction();
-- 함수 본문: UPDATE user_points SET total_points = total_points + NEW.final_points ...
```
→ **`point_transactions`에 INSERT가 들어올 때마다 무조건 `total_points`를 `final_points`만큼 가감**한다. (현재도 활성: `pg_trigger.tgenabled = 'O'` 확인)

### 3.2 그런데 RPC들도 각자 `user_points`를 또 건드린다 — 방식이 제각각

| RPC | user_points 갱신 방식 | 트리거와 결과 |
|-----|----------------------|---------------|
| `earn_points_atomic` | `total_points = v_new_total` (**절대값 덮어쓰기**) | 단건: 트리거 결과를 같은 값으로 덮어써 **우연히 정상**. 동시: §3.4 손실 |
| `spend_points_atomic` | `total_points = v_new_total` (**절대값 덮어쓰기**) | 동일하게 우연히 정상 |
| `charge_payment_points` | `total_points = total_points + p_total_points` (**상대값 증가**) | 트리거가 또 `+= ` → **정확히 2배 적립** |
| `refund_payment_points` | `total_points = GREATEST(0, total_points - p_total_points)` (**상대값 차감**) | 트리거가 또 `+= 음수` → **2배 차감 + 트리거엔 GREATEST 없어 음수 가능** |

### 3.3 결제 2배 시나리오 (B2) — 잔액 100, 500P 충전
```
charge_payment_points:
  ① UPDATE user_points SET total = 100 + 500 = 600          (직접 상대증가)
  ② INSERT point_transactions(final_points = 500)
     → 트리거: UPDATE total = 600 + 500 = 1100              (★ 또 증가)
  결과 잔액 1100  (정상 600이어야 함) → 500P 충전했는데 1000P 적립
  게다가 balance_after에는 600으로 기록 → 캐시(1100) ≠ 원장기록(600) 즉시 붕괴
```
환불은 부호 반대로 동일 → **2배 차감, 음수 잔액 가능.** 결제가 시작되는 순간 모든 충전/취소가 어긋난다.

### 3.4 동시 적립 손실 시나리오 (B3) — 실측 −10P
구 `earnPoints`(원자적 RPC 도입 2026-03-06 이전, 비원자적 SELECT→INSERT→UPDATE) 시절, 미션 동시 완료 등으로 INSERT가 거의 동시에 2건 들어오면:
```
초기 total = 242
거래A: total 읽기(242)
거래B: total 읽기(242)            ← 둘 다 같은 값 읽음
거래A: INSERT(fp=11) → 트리거 total = 242+11 = 253; 직접 UPDATE total = 242+11 = 253
거래B: INSERT(fp=11) → 트리거 total = 253+11 = 264; 직접 UPDATE total = 242+11 = 253  ★264를 253으로 덮어씀 → 11P 증발
```
- 실측 증거: 같은 `balance_after`로 동시 기록된 거래 **8건**(`balance_after` 중복 그룹 8개), 영향 사용자 잔액이 원장보다 **−10P**.
- 현행 `earn_points_atomic`/`spend_points_atomic`은 `FOR UPDATE` 직렬화로 이 경합은 막혔으나, **트리거+절대값 덮어쓰기 구조가 그대로 남아 언제든 재발 가능**(예: 트리거에만 의존하는 새 경로 추가 시).

---

## 4. 적립/차감 금액 SSoT 3중 불일치 (B4)

같은 액션의 금액이 세 군데에서 서로 다르다. 실제로 어느 값이 쓰이는지 헷갈리고, **UI 표시값과 실제 적립값이 어긋난다.**

| 항목 | `types/points.ts`(표시·참고) | DB `point_action_configs`(실제 적립) | `POINT_SPEND_COSTS`(실제 차감) |
|------|------|------|------|
| 완독 book_complete | 60 | **50** ✅실제 | - |
| 가입 welcome_bonus | 200 | **300** ✅실제 | - |
| 첫 기록 first_note | 50 | **20** ✅실제 | - |
| 첫 활동 daily_first_activity | 8 | **5** ✅실제 | - |
| 첫 책 first_book | 35 | **30** ✅실제 | - |
| AI 채팅 차감 | (ai_chat) | -100 ❌미사용 | **40** ✅실제 |
| OCR 차감 | (ocr) | -80 ❌미사용 | **25** ✅실제 |
| AI 리포트 차감 | (ai_report) | -150 ❌미사용 | **100** ✅실제 |

- **적립 진실 = DB config**, **차감 진실 = `POINT_SPEND_COSTS`**. `types/points.ts`의 적립 금액과 DB config 음수값은 표시·잔재로 신뢰 불가.
- 실측 확인: 완독 거래 `final_points = 50` → DB config(50)가 맞고 `types/points.ts`(60)는 틀림.

---

## 5. 레거시 배율 잔재 (B5)
- 과거 `streak_bonus_multiplier` 배율 시스템 때문에 `final_points ≠ points`인 거래 **24건/158건** 존재 (예: points=12 → final_points=13, points=30 → 32).
- 트리거가 `final_points`로 누적하므로 잔액 자체엔 반영됐으나, "원값 vs 반영값"이 달라 원장 해석·감사 시 혼란. 현재 배율은 제거된 상태이므로 신규 거래는 `points = final_points`.

---

## 6. 데모/시드 데이터 (참고)
- `user_points`에 원장 행 없이 잔액만 있는 11명 중 10명은 `de000021~de000030` **데모 시드 계정**(2026-01-25 일괄 생성, `lifetime > total` 등 임의값). 1명(`7eda…`, 597P)도 원장 없음.
- 실 사용자 정산 이슈가 아니므로 백필에서 **제외(보존)**. 다만 정합성 기준에선 "원장 근거 없는 잔액"으로 분류.

---

## 7. 개선 방안

### 7.1 핵심 — 잔액 관리 단일 소유화 (트리거 제거)
모든 RPC가 이미 `user_points`를 명시적으로 갱신(`FOR UPDATE` 직렬화 포함)하므로, **트리거는 순수 중복원**이다. 트리거를 제거하면:

| 경로 | 트리거 제거 후 동작 | 결과 |
|------|--------------------|------|
| earn_points_atomic | INSERT + 절대값 UPDATE | 정상 (변화 없음) |
| spend_points_atomic | INSERT + 절대값 UPDATE | 정상 |
| charge_payment_points | 상대증가 + INSERT | **정상화** (2배 제거) |
| refund_payment_points | 상대차감 + INSERT | **정상화** (2배·음수 제거) |
| refundPoints fallback | 직접 INSERT + 직접 UPDATE | 정상 |

→ **트리거 1개 제거로 B1·B2·B3 동시 해결, 애플리케이션 코드 변경 불필요.**
(검증: `point_transactions`에 INSERT만 하고 `user_points`를 직접 갱신하지 않는 "트리거 의존" 경로는 코드 전수 grep 결과 없음. 유일한 직접 INSERT인 `refundPoints` fallback도 직접 UPDATE를 동반.)

> 대안(비채택): 트리거를 유일 관리자로 두고 RPC들의 직접 UPDATE를 모두 제거 → SQL 함수 4개 수정 + `balance_after`를 트리거에서 재계산해야 해 변경 범위가 큼. 최소 변경 원칙에 따라 **트리거 제거**를 채택.

### 7.2 안전장치
- `user_points.total_points >= 0` CHECK 제약 추가(차감/환불 음수 잔액 원천 차단). 기존 데이터에 음수 없음(실측 0명) → 즉시 적용 가능.
- `balance_after`는 `FOR UPDATE` 직렬화된 RPC가 기록 → 트리거 제거 후 정확. (구 데이터의 경합 8건은 백필로 일관성 회복.)

### 7.3 데이터 백필 (원장 기준 재계산)
- **원장 있는 유저만** `total_points = GREATEST(0, SUM(final_points))`, `lifetime_points = GREATEST(현재값, SUM(final_points>0))`(레벨 보존)으로 정정.
- cached < ledger(손실) 복구 + cached > ledger(과다) 정정. 데모 시드(원장 없음)는 미대상.

### 7.4 SSoT 정리 (B4) — 후속 코드 작업
- 적립 금액 단일 출처 = DB `point_action_configs`. `types/points.ts`의 적립 상수는 **DB와 동기화**하거나 "표시 전용 + DB가 진실" 주석 명시.
- 차감 단가 = `POINT_SPEND_COSTS` 단일 출처. DB config의 `ai_chat_spend/ocr_spend/ai_report_spend` 음수 base_points는 **미사용임을 주석화하거나 0으로 정리**(혼란 제거).
- UI에 노출되는 금액(완독/가입 등)이 실제 적립과 일치하도록 점검.

### 7.5 운영 모니터링
- 정기 정합성 점검 쿼리(§8) 알림화: `mismatched_users > 0`이면 경보.
- 결제 도입 전 스테이징에서 충전/환불 1회씩 E2E 검증(잔액 = 원장 = balance_after 3자 일치 확인).

---

## 8. 정합성 검증 쿼리 (운영 상시 사용)
```sql
-- 캐시 vs 원장 불일치 사용자 (0이어야 정상)
WITH ledger AS (
  SELECT user_id, COALESCE(SUM(final_points),0) AS ledger_sum
  FROM point_transactions GROUP BY user_id
)
SELECT up.user_id, up.total_points AS cached, l.ledger_sum,
       up.total_points - l.ledger_sum AS diff
FROM user_points up
JOIN ledger l ON l.user_id = up.user_id      -- 원장 있는 실사용자만
WHERE up.total_points <> l.ledger_sum
ORDER BY ABS(up.total_points - l.ledger_sum) DESC;

-- 음수 잔액 (없어야 정상)
SELECT user_id, total_points FROM user_points WHERE total_points < 0;
```

---

## 9. 실행 계획 (체크리스트)
- [x] 1. 마이그레이션 `migration-202606161200__points__fix_balance_double_counting.sql` 작성 (트리거 제거 + 레벨함수 정상화 + CHECK + 백필, idempotent)
- [x] 2. 프로덕션 적용 (Supabase MCP `apply_migration`, 단일 DB) — 적용 중 B6 발견·반영 후 재적용 성공
- [x] 3. 적용 후 §8 검증 — `mismatched_real_users = 0`, total_diff 0, 음수 0, 이중계산 트리거 제거 확인
- [ ] 4. (후속) B4 SSoT 정리 — `types/points.ts` ↔ DB config 동기화, 죽은 음수 config 주석화
- [ ] 5. (후속) 결제 도입 시 충전/환불 E2E 정합성 검증 (충전 1회·환불 1회 → 잔액=원장=balance_after 3자 일치)
- [ ] 6. (후속) `gamification_economy_rule.md`에 "잔액은 RPC 단일 소유, 트리거 이중관리 금지 / 스키마 변경 시 트리거 함수 동반 점검" 원칙 추가

---

## 10. 2026-06-16 2차 조치: 완전 초기화 + SSoT 통일 (완료)

> 결제 실충전 0건(테스트 주문만)이라 잃을 금전가치가 없어, 런칭 전 **클린 스타트**로 결정. 마이그레이션 `migration-202606161400__points__reset_and_unify_ssot.sql`.

### 10.1 데이터 완전 초기화 (비가역)
| 테이블 | 삭제 전 | 삭제 후 |
|--------|--------|--------|
| `point_transactions` (원장) | 158 | 0 |
| `user_points` (잔액, 데모시드 10 포함) | 21 | 0 |
| `daily_missions` | 44 | 0 |
| `payment_orders` (테스트 주문) | 30 | 0 |
| `payment_history` | 51 | 0 |

- **보존:** `referrals`(추천 관계), 구독 테이블 — 포인트와 별개 영역. `point_action_configs`/`point_levels`(정의 데이터) 유지.
- **재가입/재활동 시:** 원장이 비었으므로 `welcome_bonus`·`first_note`·`first_book` 등 비반복 보너스가 다시 지급될 수 있음(의도된 클린 스타트 동작).

### 10.2 적립/차감 SSoT 통일 — 단일 기준 확정
- **적립 SSoT = 코드 `types/points.ts` POINT_ACTION_DEFAULTS** → DB `point_action_configs.base_points`를 여기에 동기화(이제 UI 표시값 = 실제 적립값).
- **차감 SSoT = 코드 `POINT_SPEND_COSTS`** (단일). DB config의 `*_spend` 음수 base_points(-100/-80/-150)는 미사용이므로 0으로 정리.
- 두 상수에 SSoT 주석 추가(코드).

**통일 후 최종 적립 기준 (활성, 코드=DB 일치):**

| action_type | 적립 | | action_type | 적립 |
|---|---|---|---|---|
| book_complete | 60 | | first_note | 50 |
| first_book | 35 | | welcome_bonus | 200 |
| referral_success | 200 | | referral_bonus / book_referrer / book_referred / note_referred | 100 |
| streak_100 / 30 / 7 | 500 / 200 / 50 | | all_missions_complete | 40 |
| note_quote | 15 | | note_photo | 12 |
| mission_complete | 12 | | note_create / note_memo | 10 |
| feature_request_create | 10 | | book_add / note_share / daily_first_activity | 8 |
| feature_request_adopted | 50 | | feature_request_vote | 2 |

**통일 후 차감 기준 (`POINT_SPEND_COSTS`):** AI리포트 100 · 모임생성 300 · 모임참여 200 · 서재생성 150 · AI채팅 40 · OCR 25 · 노트추가 10

### 10.3 검증 결과
- 음수 base_points config **0건**, 활성 적립값 전부 코드와 일치, `user_points`/`point_transactions` **0행**(클린).

---

## 부록 A. 핵심 파일 레퍼런스
- 트리거/테이블 정의: `doc/database/migration-202501251800__points__create_point_system.sql:272-299`
- 적립 RPC: `doc/database/migration-202603061300__points__atomic_earn_points.sql:7-108`
- 차감 RPC: `doc/database/migration-202603171000__points__atomic_spend_points.sql:7-69`
- 결제 충전/환불 RPC: `doc/database/migration-202603061200__payment__atomic_point_charge.sql`
- 적립 진입점: `app/actions/points.ts:95`(earnPoints), `:815`(spendPoints), `:884`(refundPoints)
- 결제 호출부: `app/api/payment/confirm/route.ts:229`, `app/api/payment/webhook/route.ts:123,165`, `app/api/webhook/polar/route.ts:125,185`
- 코드 상수: `types/points.ts`(POINT_VALUES, `POINT_SPEND_COSTS:444`), `lib/subscription/gates.ts`(차감 단가/한도)
