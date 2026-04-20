# 관측(Observability) 규칙

> 주 소유자: Monitoring Agent
> 공동 참조: Deploy Agent, Performance Agent, Legal Agent

---

## 1. 관측의 3축 분리

| 축 | 목적 | 현재 저장소 | 향후 저장소 | 보유 기간 |
|----|------|-----------|------------|----------|
| **Logs** | 이벤트 기록, 디버깅 | Vercel Logs(자동) | (유지) | 30일 |
| **Errors** | 예외 추적·그룹핑 | Supabase `errors` 테이블 | Sentry (MAU 5K↑) | 180일 |
| **Metrics** | SLO·Web Vitals 수치 | `vitals` 테이블 | Sentry Metrics | 90일 |
| **Traces** | 요청 흐름 추적 | (Phase 2 도입 시) | Sentry Performance | 14일 |

**원칙**: 세 축을 혼합 저장하지 않는다. 각 축의 쿼리 패턴과 비용 구조가 다르다.

**Sentry 도입 보류 (2026-04-20)**: 비용($26+/mo) 부담으로 자체 수집부터 시작. 트리거: MAU 5,000 또는 월 errors 1,000건 초과 시 도입 검토.

---

## 2. 로그 레벨

| 레벨 | 사용처 | Sentry 전송 |
|------|--------|:----------:|
| `debug` | 개발 중 일시 디버깅 | ❌ (로컬만) |
| `info` | 주요 흐름 체크포인트 | ❌ |
| `warn` | 예상 가능한 실패, 복구 성공 | ✅ `errors` (severity=warn) |
| `error` | 처리 불가 예외, 사용자 영향 | ✅ `errors` (severity=error) |
| `fatal` | 서비스 차단 수준 장애 | ✅ `errors` + Discord 즉시 알림 |

**프로덕션 `console.log` 금지** — ESLint 규칙으로 강제.
**전송 대상**: 현재는 Supabase `errors` 테이블, 향후 Sentry 도입 시 동시 전송(dual-write 1주) 후 Sentry로 전환.

---

## 3. PII 스크러빙

### 3-1. `lib/monitoring/scrub.ts` 필수 처리

자체 `errors` 테이블에 INSERT하기 전 또는 향후 Sentry `beforeSend` 훅에서 동일 로직 적용:

```typescript
export function scrub<T>(payload: T): T {
  // 이메일
  // 정규식: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g → ***@***

  // 토큰
  const scrubKeys = ['access_token', 'refresh_token', 'session_id', 'api_key', 'authorization'];

  // 전화번호: /\d{2,3}-?\d{3,4}-?\d{4}/g → ***-****-****

  // user_id는 sha256 hash → user_id_hash로 저장
  return scrubbed;
}
```

### 3-2. 구조화 로그

- `user_id`는 **해시**하여 로그에 기록 (`user_id_hash`)
- 원본 `user_id`는 쿼리 용도로만 서버 내부에서 사용
- 이메일·이름·프로필 사진 URL → 로그 전면 금지

### 3-3. errors 테이블 RLS

- service_role만 INSERT 가능 (`/api/errors/ingest` 경유)
- admin 권한 사용자만 SELECT 가능
- 일반 사용자 접근 금지

---

## 4. SLO 임계치

### 4-1. 서비스 레벨 목표 (월간)

| 지표 | 목표 | 측정 도구 |
|------|------|----------|
| 가용성 | 99.5% | `/api/health` success rate |
| 5xx 에러율 | < 0.5% | `errors` 테이블 + Vercel Logs |
| P50 응답 | < 500ms | Vercel Analytics |
| P95 응답 | < 2000ms | Vercel Analytics |
| LCP p75 | < 2.5s | Web Vitals RUM |
| INP p75 | < 200ms | Web Vitals RUM |
| CLS p75 | < 0.1 | Web Vitals RUM |
| 배포 롤백 시간 | < 5분 | 내부 측정 |

### 4-2. 알림 임계치

- **Critical**: 즉시 알림 (Discord `@here`) — `/api/health` 연속 3회 실패, `errors` 신규 fingerprint 폭증(>10/min), 배포 직후 5xx 폭증
- **Warning**: 10분 디바운스 — 에러율 > 1% (5min 윈도우), Web Vitals 임계 초과
- **Info**: 일일 요약만 — 신규 fingerprint TOP 5, 미해결 errors count

---

## 5. 헬스체크 설계

```
GET /api/health
Response: {
  status: 'ok' | 'degraded' | 'down',
  checks: {
    db: { status, latency_ms },
    auth: { status },
    ai_gemini: { status },
    external_book_api: { status }
  },
  version: "vercel-git-commit-sha",
  uptime_seconds: number
}
```

**규칙**:
- 인증 불필요
- 3초 이내 응답 (외부 API 타임아웃 포함)
- 외부 API 실패는 `degraded`, DB 실패는 `down`

---

## 6. 알림 메시지 포맷

```
[Critical] Habitree - 5xx spike detected
Service: web
Rate: 3.2% (last 5 min)
Threshold: 2%
Runbook: https://.../runbook-sentry-500-spike.md
Dashboard: https://.../sentry-issues
```

**필수 필드**: severity, service, summary, **runbook_url**, dashboard_url

---

## 7. Runbook 구조

```markdown
# Runbook: <알림명>

## 증상
- (관찰되는 현상)

## 1차 확인
1. (대시보드 확인 단계)
2. (로그 확인 단계)

## 원인 후보
| 원인 | 확인 방법 |
|------|----------|
| ... | ... |

## 조치
### 즉시 대응
- (stop the bleeding)

### 영구 수정
- (root cause fix)

## 롤백 절차
- (이전 배포로 복구 절차)

## 에스컬레이션
- 30분 내 미해결 → @oncall-engineer
```

---

## 8. Release 태깅

- `errors.release` 필드: `process.env.VERCEL_GIT_COMMIT_SHA`
- Vercel Logs는 deployment ID 자동 포함
- 향후 Sentry 도입 시: 소스맵 업로드 자동화(`@sentry/nextjs` 처리), Sentry deployment 이벤트 기록

---

## 9. 변경 로그

| 날짜 | 내용 |
|------|------|
| 2026-04-20 | 초기 생성 — 3축 분리, 로그 레벨, PII 스크러빙, SLO 임계치, 헬스체크·Runbook 표준 |
| 2026-04-20 | Sentry 보류 결정 반영 — 자체 `errors` 테이블 + `lib/monitoring/scrub.ts` 우선. 4축 분리(Logs/Errors/Metrics/Traces)로 확장. Sentry 도입 트리거 조건 명시 |
