# 이벤트 스키마 규칙 (Event Schema Rule)

> 공동 참조: Analytics Agent, Engagement Agent
> 법적 기준: 개인정보보호법(PIPA) 제15조 최소 수집 원칙

---

## 1. 네임스페이스 표준

**형식**: `domain.action` (snake_case, 점 구분)

| 도메인 | 예시 이벤트 |
|--------|------------|
| `identity` | `identity.signed_up`, `identity.subscribed`, `identity.churned` |
| `library` | `library.book_added`, `library.book_finished`, `library.progress_updated` |
| `records` | `records.note_created`, `records.ocr_succeeded`, `records.first_note_created` |
| `engagement` | `engagement.achievement_granted`, `engagement.mission_completed`, `engagement.level_up` |
| `groups` | `groups.joined`, `groups.invite_sent`, `groups.challenge_entered` |
| `ai` | `ai.chat_used`, `ai.report_generated` |
| `support` | `support.ticket_created`, `support.faq_viewed` |
| `monetization` | `monetization.checkout_started`, `monetization.payment_succeeded`, `monetization.subscription_cancelled` |

**금지**:
- CamelCase, 공백, 하이픈
- 과거형이 아닌 현재형 (`create` ❌ → `created` ✅)
- 동사 단독 (`click` ❌ → `cta_clicked` ✅)

---

## 2. 필수 필드

모든 이벤트 row는 아래 필드를 포함해야 한다:

| 필드 | 타입 | 설명 |
|------|------|------|
| `event_key` | text | `domain.action` 형식 |
| `user_id` | uuid? | 로그인 사용자(비로그인 시 null) |
| `session_id` | text | 세션 식별자(Supabase auth session 또는 anonymous uuid) |
| `properties` | jsonb | 이벤트 고유 속성(스키마 버전별) |
| `schema_version` | int | 스키마 버전 (기본 1) |
| `occurred_at` | timestamptz | 이벤트 발생 시각 |
| `ingested_at` | timestamptz | 서버 수신 시각 (default now()) |

---

## 3. PIPA 최소 수집 원칙

### 3-1. 수집 금지 항목
- IP 전체 주소 (해시 후 하위 16bit만 허용)
- 정확한 geo 좌표 (국가 코드 수준만 허용)
- 디바이스 지문(Canvas fingerprint, AudioContext fingerprint 등)
- 이메일, 전화번호, 주소, 생년월일
- 결제 카드 번호, 계좌번호

### 3-2. 수집 허용 항목
- `user_id` (인증된 UUID, PII 아님 — 외래 키로만 사용)
- 이벤트 타임스탬프
- UA의 **디바이스 타입만** (mobile/tablet/desktop)
- 라우트 경로(쿼리 파라미터 제외)
- 서비스 내 선택/토글 상태

### 3-3. PII가 `properties`에 섞인 경우
- 수집 전 **자동 마스킹** 필수 (`lib/analytics/sanitize.ts`)
- 이메일 정규식 매칭 → `***@***`
- 전화번호 정규식 매칭 → `***-****-****`

---

## 4. 스키마 버전 관리

### 4-1. Breaking change 시
- `schema_version` 증가 (1 → 2)
- 구버전 병행 유지 (최소 90일)
- `event_schemas` 테이블에 변경 이력 기록

### 4-2. Non-breaking change (필드 추가)
- 같은 `schema_version` 유지 가능
- 단, 소비 측에서 optional로 처리해야 함

### 4-3. 스키마 문서
- `doc/analytics/EVENT_SCHEMA.md` 단일 기준 문서
- 이벤트 추가 PR은 이 문서 업데이트 필수

---

## 5. 샘플링

### 5-1. 샘플링 대상 이벤트
- viewport scroll, mouse move 등 고빈도 이벤트
- `properties.sampling_rate` 필드에 비율 기록(예: 0.1 = 10%)

### 5-2. 샘플링 금지 이벤트
- 결제·구독·포인트 관련 (정확도 필수)
- 가입·탈퇴 (코호트 분석 정합성)
- 에러 이벤트 (Monitoring Agent 처리)

---

## 6. 옵트아웃

- `profiles.analytics_opted_out = true` 사용자는 **모든 이벤트 기록 차단**
- 클라이언트 트래커는 로드 시 이 플래그 확인
- 서버 `track()` 호출도 이 플래그 체크

---

## 7. 수집 경로

```
[Client Component]
    ↓
client-track.ts (requestIdleCallback 버퍼링)
    ↓
POST /api/analytics/ingest (rate limit 필수)
    ↓
Supabase events INSERT (RLS: service_role만 삽입 가능)

[Server Action / API Route]
    ↓
lib/analytics/track.ts (직접 INSERT)
```

**클라이언트에서 `supabase.from('events').insert()` 직접 호출 금지**

---

## 8. 변경 로그

| 날짜 | 내용 |
|------|------|
| 2026-04-20 | 초기 생성 — 네임스페이스·필수 필드·PIPA 최소 수집·버전 관리·샘플링 표준 |
