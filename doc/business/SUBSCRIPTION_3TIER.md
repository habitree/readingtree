> **DEPRECATED** — 3단계 구독 티어는 포인트 소비 모델로 대체되었습니다.
> 현행 구조: [`COST_AND_POINT_MASTER.md`](./COST_AND_POINT_MASTER.md)

# 3단계 구독 티어 구현 문서

> **작성일**: 2026-03-01
> **버전**: v1.0
> **상태**: ~~코드 반영 완료~~ DEPRECATED (2026-04-09) — 포인트 소비 모델로 전환

---

## 1. 개요

### 배경

- 기존: free/premium 2단계 구조
- 문제: `checkFeatureAccess()`가 어디서도 호출되지 않아 실제 기능 제한 미작동
- 핵심 기능(노트, 서재, 그룹)이 무제한 → 유료 전환 동기 부족

### 목표

3단계 티어(free/reader/reader_master)로 확장하고, 무료 사용자에게 핵심 기능 제한을 적용하여 유료 전환 트리거 생성

---

## 2. 티어 구조

| 기능 | 무료 | 독서가 ₩3,900/월 | 독서마스터 ₩6,900/월 |
|------|:----:|:----:|:----:|
| 노트 생성 | 월 30개 | 무제한 | 무제한 |
| AI 채팅 | 3회/일 | 15회/일 | 무제한 |
| OCR | 3회/일 | 15회/일 | 무제한 |
| AI 리포트 | 불가 | 3회/월 | 무제한 |
| 서재 | 3개 | 무제한 | 무제한 |
| 그룹 참여 | 1개 | 3개 | 무제한 |
| 그룹 생성 | 2개 | 무제한 | 무제한 |
| 고급 통계 | 불가 | 기본 | 전체 |
| 데이터 내보내기 | 불가 | CSV | CSV+PDF |

### 티어 코드명

| 표시명 | 코드명 | DB name 필드 |
|--------|--------|-------------|
| 무료 | free | `free` |
| 독서가 | reader | `reader` |
| 독서마스터 | reader_master | `reader_master` |

---

## 3. 구현 아키텍처

### 핵심 흐름

```
사용자 액션 → checkFeatureAccess(featureKey) → 허용/차단
                     ↓
              getUserTier() → DB subscription_tiers 조회
                     ↓
              getLimitForTier(gate, tier) → 한도 결정
                     ↓
              countMethod별 사용량 조회 → 비교 → 결과 반환
```

### 카운트 방식 (countMethod)

| 방식 | 대상 기능 | 설명 |
|------|----------|------|
| `point_transactions` | ai_chat, ocr, ai_report | point_transactions 테이블에서 action_type별 카운트 |
| `table_count` | notes_create, bookshelf_create, groups_create | 실제 테이블(notes, bookshelves, groups) 직접 카운트 |
| `membership_count` | groups_join | group_members 테이블에서 approved 멤버십 카운트 |
| `boolean` | advanced_stats, data_export | limit > 0이면 허용, 0이면 차단 |

---

## 4. 변경 파일 목록

### 핵심 로직

| 파일 | 변경 내용 |
|------|----------|
| `lib/subscription/gates.ts` | TierName 3단계 타입, FeatureKey 9개, countMethod, getLimitForTier() |
| `app/actions/subscription.ts` | getUserTier() 타입 변경, getTableCount/getMembershipCount, checkFeatureAccess 분기 |

### 게이트 연동 (6개 파일)

| 파일 | 함수 | 게이트 | 에러 메시지 |
|------|------|--------|------------|
| `app/actions/notes.ts` | createNote() | notes_create | "이번 달 기록 한도(30개)에 도달했습니다." |
| `app/actions/bookshelves.ts` | createBookshelf() | bookshelf_create | "서재 한도(3개)에 도달했습니다." |
| `app/actions/groups/members.ts` | joinGroup() | groups_join | "모임 참여 한도(1개)에 도달했습니다." |
| `app/actions/ai/report.ts` | generateReadingReport() | ai_report | "AI 리포트는 독서가 이상 구독에서 사용할 수 있습니다." |
| `app/api/ai/chat/route.ts` | POST handler | ai_chat | "오늘의 AI 채팅 한도(3회)에 도달했습니다." |
| `app/api/ocr/route.ts` | POST handler | ocr | "오늘의 OCR 한도(3회)에 도달했습니다." |

### DB / 문서

| 파일 | 변경 내용 |
|------|----------|
| `doc/database/migration-202603011300__subscription__add_3tier.sql` | 신규 마이그레이션 |
| `doc/database/DATA_MODEL.md` | subscription_tiers 섹션 3티어 업데이트 |

---

## 5. DB 마이그레이션

### 적용 방법

**Supabase 대시보드 SQL Editor에서 실행:**

1. 접속: https://supabase.com/dashboard/project/pkdhhtfomhhuiirzurhs/sql/new
2. 아래 SQL 붙여넣기 후 **Run** 클릭

```sql
BEGIN;

-- 1. 무료 티어 features 업데이트
UPDATE subscription_tiers
SET
  features = jsonb_build_object(
    'ai_chat_daily', 3,
    'ocr_daily', 3,
    'ai_report_monthly', 0,
    'groups_create', 2,
    'notes_monthly', 30,
    'bookshelf_max', 3,
    'groups_join', 1,
    'advanced_stats', false,
    'data_export', false
  ),
  price_monthly = 0,
  display_name = '무료'
WHERE name = 'free';

-- 2. reader 티어 추가 (중복 시 업데이트)
INSERT INTO subscription_tiers (name, display_name, price_monthly, features)
VALUES (
  'reader', '독서가', 3900,
  jsonb_build_object(
    'ai_chat_daily', 15, 'ocr_daily', 15, 'ai_report_monthly', 3,
    'groups_create', -1, 'notes_monthly', -1, 'bookshelf_max', -1,
    'groups_join', 3, 'advanced_stats', true, 'data_export', 'csv'
  )
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_monthly = EXCLUDED.price_monthly,
  features = EXCLUDED.features;

-- 3. premium → reader_master 변환
UPDATE subscription_tiers
SET name = 'reader_master', display_name = '독서마스터', price_monthly = 6900,
  features = jsonb_build_object(
    'ai_chat_daily', -1, 'ocr_daily', -1, 'ai_report_monthly', -1,
    'groups_create', -1, 'notes_monthly', -1, 'bookshelf_max', -1,
    'groups_join', -1, 'advanced_stats', true, 'data_export', 'csv_pdf'
  )
WHERE name = 'premium';

-- 4. reader_master가 없으면 새로 생성
INSERT INTO subscription_tiers (name, display_name, price_monthly, features)
SELECT 'reader_master', '독서마스터', 6900,
  jsonb_build_object(
    'ai_chat_daily', -1, 'ocr_daily', -1, 'ai_report_monthly', -1,
    'groups_create', -1, 'notes_monthly', -1, 'bookshelf_max', -1,
    'groups_join', -1, 'advanced_stats', true, 'data_export', 'csv_pdf'
  )
WHERE NOT EXISTS (SELECT 1 FROM subscription_tiers WHERE name = 'reader_master');

COMMIT;
```

### 적용 후 검증

```sql
SELECT name, display_name, price_monthly, features
FROM subscription_tiers
ORDER BY price_monthly;
```

**예상 결과 (3행):**

| name | display_name | price_monthly | features |
|------|-------------|:------------:|---------|
| free | 무료 | 0 | {ai_chat_daily: 3, ...} |
| reader | 독서가 | 3900 | {ai_chat_daily: 15, ...} |
| reader_master | 독서마스터 | 6900 | {ai_chat_daily: -1, ...} |

### Idempotent 보장

- `ON CONFLICT` 사용으로 중복 실행 안전
- `WHERE NOT EXISTS` 사용으로 이미 존재하면 스킵
- `BEGIN/COMMIT` 트랜잭션으로 원자성 보장

---

## 6. 기존 구독자 영향

- FK 관계가 UUID 기반이므로 `premium` → `reader_master` 이름 변경 시 기존 구독자 자동 마이그레이션
- `user_subscriptions.tier_id`는 UUID 참조이므로 name 변경에 영향 없음
- 기존 작성된 노트 읽기는 항상 허용 (생성만 제한)

---

## 7. 포인트 연동

한도 초과 시 포인트로 추가 사용 가능한 기능:

| 기능 | 포인트 비용 |
|------|:---------:|
| AI 채팅 | 100P |
| OCR | 80P |
| AI 리포트 | 150P |

나머지 기능(노트, 서재, 그룹 등)은 포인트 사용 불가 → 구독 업그레이드만 가능

---

## 8. 향후 작업

- [x] DB 마이그레이션 Supabase 적용 (2026-03-01)
- [ ] 구독 업그레이드 UI (결제 페이지)
- [ ] 한도 도달 시 업그레이드 유도 모달/토스트
- [ ] 구독 관리 페이지 (마이페이지)
- [ ] 결제 시스템 연동 (토스페이먼츠 등)
- [ ] 고급 통계 / 데이터 내보내기 기능 구현

---

## 9. 관련 문서

- 비용 분석: `doc/business/AI_PRICING_PLAN.md`
- 수익화 전략: `doc/business/MONETIZATION_STRATEGY.md`
- 데이터 모델: `doc/database/DATA_MODEL.md` (4.27 subscription_tiers)
- 마이그레이션 SQL: `doc/database/migration-202603011300__subscription__add_3tier.sql`
