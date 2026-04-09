# ReadTree 비용 & 포인트 마스터 문서

> **최종 갱신**: 2026-04-09
> **버전**: v1.0
> **상태**: 코드 SSoT 기준 확정
> **SSoT 원칙**: 이 문서의 모든 수치는 코드에서 직접 추출. 코드 변경 시 이 문서도 함께 갱신 필수.

---

## 1. 현재 포인트 체계

### 1-1. 무료 한도 (코드: `lib/subscription/gates.ts`)

| 기능 | 한도 | 주기 | 초과 시 포인트 비용 | countMethod |
|------|------|------|-------------------|-------------|
| AI 채팅 | 10회 | 월 | 40P/회 | point_transactions |
| OCR 필사 | 3회 | 월 | 25P/회 | point_transactions |
| AI 리포트 | 1회 | 월 | 100P/회 | point_transactions |
| 노트 작성 | 100개 | 월 | - | table_count |
| 모임 생성 | 5개 | 누적 | - | table_count |
| 모임 참여 | 5개 | 누적 | - | membership_count |
| 책장 생성 | 10개 | 누적 | - | table_count |
| 고급 통계 | 무제한 | - | - | boolean |
| 데이터 내보내기 | 무제한 | - | - | boolean |

> 베타 모드(`lib/subscription/beta.ts`): 현재 **OFF**. ON 시 AI 기능 한도 9999, 포인트 비용 0.

### 1-2. 포인트 소비 비용 (코드: `types/points.ts` POINT_SPEND_COSTS)

| 기능 | 포인트 비용 | PointActionType |
|------|-----------|-----------------|
| AI 채팅 | 40P | ai_chat_spend |
| OCR 처리 | 25P | ocr_spend |
| AI 리포트 | 100P | ai_report_spend |

### 1-3. 포인트 적립 체계 (코드: `types/points.ts` POINT_ACTION_DEFAULTS)

**독서 활동**:

| 활동 | 포인트 | 반복 | 일일 한도 |
|------|--------|------|----------|
| 노트 작성 (note_create) | 10P | O | - |
| 인용구 (note_quote) | 15P | O | - |
| 메모 (note_memo) | 10P | O | - |
| 사진 기록 (note_photo) | 12P | O | - |
| 필사 (note_transcription) | 15P | O | - |
| 진행률 (note_progress) | 5P | O | - |
| 책 등록 (book_add) | 8P | O | - |
| 완독 (book_complete) | 60P | O | - |

**연속 기록 & 일일**:

| 활동 | 포인트 | 비고 |
|------|--------|------|
| 일일 첫 활동 (daily_first_activity) | 8P | 매일 1회 |
| 7일 스트릭 (streak_7_days) | 50P | 마일스톤 |
| 30일 스트릭 (streak_30_days) | 200P | 마일스톤 |
| 100일 스트릭 (streak_100_days) | 500P | 마일스톤 |

**미션 & 특별**:

| 활동 | 포인트 | 비고 |
|------|--------|------|
| 미션 완료 (mission_complete) | 12P | 일일 미션별 |
| 전체 미션 완료 (all_missions_complete) | 40P | 3개 미션 모두 |
| 첫 책 등록 (first_book) | 35P | 일회성 |
| 첫 노트 작성 (first_note) | 50P | 일회성 |
| 프로필 완성 (profile_complete) | 50P | 일회성 |
| 추천 성공 (referral_success) | 100P | - |
| 추천 보너스 (referral_bonus) | 50P | - |
| 웰컴 보너스 (welcome_bonus) | 200P | 가입 시 |

### 1-4. 레벨 시스템 (코드: `types/points.ts` LEVEL_DEFAULTS)

| 레벨 | 이름 | 필요 누적P | 이모지 |
|------|------|-----------|--------|
| 1 | 씨앗 | 0 | - |
| 2 | 새싹 | 50 | - |
| 3 | 떡잎 | 150 | - |
| 4 | 어린나무 | 350 | - |
| 5 | 나무 | 650 | - |
| 6 | 큰나무 | 1,100 | - |
| 7 | 꽃나무 | 1,800 | - |
| 8 | 열매나무 | 2,800 | - |
| 9 | 세계수 | 4,200 | - |
| 10 | 황금숲 | 6,500 | - |

> lifetime_points 기준. 소비해도 레벨 유지.

### 1-5. 일일 적립 시나리오

| 사용자 유형 | 활동 예시 | 일 획득 |
|------------|---------|:------:|
| 캐주얼 | 노트 2 + 인용 1 + 첫활동 | ~43P |
| 일반 | 노트 3 + 인용 2 + 미션 + 첫활동 | ~80P |
| 활발 | 노트 5 + 인용 3 + 메모 2 + 전체미션 | ~147P |

---

## 2. 충전 패키지 (코드: `lib/subscription/pricing-data.ts`)

| 패키지 | KRW | USD | 기본P | 보너스P | 합계P | P당 원가 | 첫충전 보너스 |
|--------|-----|-----|-------|--------|-------|---------|-------------|
| 라이트 | ₩1,900 | $1.49 | 500 | 0 | 500 | 3.80원 | +500P |
| 스탠다드 | ₩3,900 | $2.99 | 1,200 | 200 | 1,400 | 2.79원 | +1,200P |
| 프리미엄 | ₩6,900 | $4.99 | 3,000 | 800 | 3,800 | 1.82원 | +3,000P |

**첫 충전 시 실질 P당 원가**:
| 패키지 | 합계P (첫충전) | 실질 P당 원가 |
|--------|-------------|-------------|
| 라이트 | 1,000P | 1.90원 |
| 스탠다드 | 2,600P | 1.50원 |
| 프리미엄 | 6,800P | 1.01원 |

---

## 3. AI API 원가 분석

> 기준: Gemini 2.0 Flash (현재 기본 모델), $1 = 1,350원

| AI 기능 | 모델 | 요청당 원가 | 포인트 비용 | 환산 가격(라이트) | 마진율 |
|---------|------|-----------|-----------|----------------|--------|
| AI 채팅 | Gemini 2.0 Flash | ~0.5원 | 40P | ~152원 | 99.7% |
| OCR AI 보정 | GPT-4o-mini | ~2.7원 | 25P | ~95원 | 97.2% |
| AI 리포트 | Gemini 2.0 Flash | ~1.5원 | 100P | ~380원 | 99.6% |
| 자동 태깅 | Gemini 2.0 Flash | ~0.08원 | 무료 | - | - |
| 책 요약 | Gemini 2.0 Flash | ~0.05원 | 무료 | - | - |

> OCR AI 보정을 Gemini로 전환 시 원가 ~1.4원으로 48% 절감 가능.

### 월간 비용 시뮬레이션

| 규모 | 무료 사용자 | 유료 전환 | 월간 API 비용 | 인프라 포함 총비용 |
|------|:---------:|:--------:|:----------:|:--------------:|
| 100명 | 90 | 10 | ~25,000원 | ~86,000원 |
| 500명 | 450 | 50 | ~120,000원 | ~181,000원 |
| 1,000명 | 900 | 100 | ~240,000원 | ~320,000원 |

> 인프라: Supabase Free + Vercel Hobby = 0원. 성장 시 Supabase Pro($25) + Vercel Pro($20) 전환 필요.

---

## 4. 결제 수단 현황

| 결제 수단 | 상태 | 대상 | 수수료 | 비고 |
|----------|------|------|--------|------|
| Polar | 활성 (sandbox) | 국제 사용자 | 2.5% | 한화 결제도 지원 |
| 토스페이먼츠 | **비활성** | 한국 사용자 | 2.0~2.5% | 사업자 등록 후 재활성화 예정 |

> 토스페이먼츠 비활성화: `lib/payment/config.ts`의 `IS_TOSS_ENABLED = false`
> 코드는 보존되어 있으며, 플래그 전환만으로 재활성화 가능.

---

## 5. 코드 SSoT 파일 매핑

| 데이터 | SSoT 파일 |
|--------|----------|
| 포인트 적립/소비 값 | `types/points.ts` |
| 기능별 무료 한도 | `lib/subscription/gates.ts` |
| 충전 패키지 가격 | `lib/subscription/pricing-data.ts` |
| 베타 모드 플래그 | `lib/subscription/beta.ts` |
| 토스 활성화 플래그 | `lib/payment/config.ts` |
| 포인트 적립 로직 | `app/actions/points.ts` |
| 포인트 소비 로직 | `app/actions/points.ts` (spendPoints) |
| 기능 접근 제어 | `app/actions/subscription.ts` (checkFeatureAccess) |
| Atomic RPC | `earn_points_atomic`, `spend_points_atomic`, `charge_payment_points` |

---

## 6. 관련 문서

| 문서 | 상태 | 용도 |
|------|------|------|
| `doc/business/PROFITABILITY_REVIEW_2026Q2.md` | 최신 | 수익성 검토 + 고도화 기획 |
| `doc/business/financial-dashboard.html` | 최신 | 재무 대시보드 (시각화) |
| `doc/business/point-economy-overview.html` | 최신 | 포인트 경제 구조 (시각화) |
| `doc/business/AI_PRICING_PLAN.md` | DEPRECATED | v1.0 비용 분석 (이력 보존) |
| `doc/business/MONETIZATION_STRATEGY.md` | DEPRECATED | 구독 모델 시절 전략 (이력) |
| `doc/business/SUBSCRIPTION_3TIER.md` | DEPRECATED | 3티어 구독 구조 (이력) |
| `doc/point-strategy/` | 갱신됨 | 포인트 전략/경제학/마케팅 |
