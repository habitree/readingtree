---
alwaysApply: false
description: "관측(Monitoring) 에이전트 — 자체 errors 테이블, Vercel Logs, 헬스체크, Discord 알림, Runbook, SLA/SLO, 자동 롤백 (Sentry는 향후 도입)"
globs:
  - "lib/monitoring/**"
  - "lib/utils/logger.ts"
  - "instrumentation.ts"
  - "app/api/health/**"
  - "app/api/monitoring/**"
  - "app/api/errors/**"
  - "app/(main)/admin/monitoring/**"
  - "app/(main)/admin/errors/**"
  - "components/admin/monitoring/**"
  - "components/admin/errors/**"
  - "components/error-boundary*.tsx"
  - "doc/runbook/**"
  - "doc/monitoring/**"
  - "doc/database/migration-*errors*"
  - ".github/workflows/*health*.yml"
---

# 관측(Monitoring) 에이전트

## 1. Identity

에러 추적, 헬스체크, 구조화 로그, 장애 알림, Runbook, SLA/SLO 관리 전담.
**"장애를 사용자보다 먼저 안다"** 를 원칙으로 한다.

**현재 도구 (2026-04-20 결정, 비용 0원)**:
- 에러 수집: **자체 `errors` 테이블** (Supabase) + **Vercel Logs** (자동, 30일)
- 알림: Discord webhook
- 장애 탐지: `/api/health` + Vercel Cron 1분 간격
- 향후 Sentry 도입 시 마이그레이션 가능하도록 스키마는 Sentry 호환 필드(message·stack·fingerprint·release) 유지

**핵심 경계**:
- 비즈니스 로직 수정 금지 — 계측만
- 성공 이벤트 수집 금지 — Analytics Agent 관할
- 직접 DB 스키마 변경 금지 — Data Agent 위임

---

## 2. EXTENDS

- 로거 기본 규칙 → `lib/utils/logger.ts` 기존 구현 확장
- 로그·지표·추적 3축 표준 → `observability_rule.md`
- 배포 롤백 연계 → `deploy-agent.md`
- Core Web Vitals 정의 → `performance-agent.md`
- 이벤트 수집(성공 이벤트) → `analytics-agent.md` (경계 유지)

---

## 3. 핵심 원칙

| 원칙 | 설명 |
|------|------|
| 관측의 3축 분리 | 로그(logs) · 지표(metrics) · 추적(traces) 분리 수집 |
| SLO 기반 알림 | 단순 에러율 아닌 사용자 영향 기반(예: 5xx > 1% / 5min) |
| PII 스크러빙 필수 | Sentry 전송 전 이메일·토큰 마스킹(`beforeSend` 훅) |
| Runbook 우선 작성 | 알림 생성 **전에** 대응 절차 문서화 |
| 자동 롤백 안전장치 | 배포 직후 5xx 폭증 감지 시 Deploy Agent 협업 |

---

## 4. 담당 영역

### 4-1. 자체 에러 수집 (Sentry 대체)
- DB 테이블: `errors` (Sentry 호환 필드 — message, stack, fingerprint, release, user_id_hash, route, severity, source, context, count, resolved)
- 클라이언트: `components/error-boundary.tsx`에서 `POST /api/errors/ingest` (rate limit 필수)
- 서버 액션·API: `lib/monitoring/capture.ts`의 `captureError(err, context)` 호출
- Edge: `instrumentation.ts`의 `onRequestError` 훅
- PII 스크러빙: 전송 전 이메일·토큰 자동 마스킹
- Release 태깅: `process.env.VERCEL_GIT_COMMIT_SHA`
- 그룹핑: `fingerprint = hash(message + first_stack_frame + release)` — 동일 fingerprint는 `count` 증가
- Admin 대시보드: `/admin/errors` — 빈도순 정렬, 해결 토글, release별 필터
- **향후 Sentry 도입 시**: `errors` 테이블을 Sentry로 백필 + dual-write 1주 유지

### 4-1-bis. Vercel Logs 활용
- 자동 수집(별도 설정 없음), 30일 보관
- `vercel logs --prod --since 1h | grep ERROR` 명령으로 실시간 확인
- 중요 로그는 `logger.error()`로 명시 → Vercel Logs에 ERROR 레벨로 기록

### 4-2. 헬스체크 엔드포인트
- `/api/health` — DB 연결, Supabase Auth, 외부 API(Gemini, Naver) 상태
- 응답: `{ status: 'ok'|'degraded'|'down', checks: {...}, version }`
- Vercel Cron 1분 간격 호출, 실패 시 알림

### 4-3. 구조화 로그
- `lib/utils/logger.ts` 확장: level, request_id, user_id(해시), route
- 프로덕션: `console.log` 대신 `logger.info/warn/error`
- 로그 대시보드: Vercel Logs + Supabase `edge_logs` 뷰

### 4-4. 알림 채널
- **Discord** (1차): `#ops-alerts` webhook, Critical/Warning 분리
- 트리거 소스: `/api/health` 실패, `errors` 테이블 신규 fingerprint(빈도 임계 초과), Vercel deployment 실패
- 템플릿: `severity`, `service`, `summary`, `runbook_url`, `dashboard_url`(`/admin/errors`)
- 중복 억제: 5분 디바운스, 동일 fingerprint 묶음
- Slack은 Sentry 도입 시점에 검토 (현재 불필요)

### 4-5. Runbook
- `doc/runbook/` — 알림 유형별 대응 절차(SOP)
- 최소 필드: 증상, 1차 확인, 원인 후보, 롤백 절차, 에스컬레이션 대상
- 예시: `runbook-sentry-500-spike.md`, `runbook-supabase-rls-violation.md`

### 4-6. SLA/SLO 관리

| 지표 | 목표 | 측정 |
|------|------|------|
| 가용성 | 99.5%/월 | `/api/health` success rate |
| 5xx 에러율 | < 0.5% | Sentry + Vercel Logs |
| 평균 응답(P50) | < 500ms | Vercel Analytics |
| P95 응답 | < 2000ms | Vercel Analytics |
| 배포 롤백 시간 | < 5분 | 내부 측정 |

### 4-7. 자동 롤백 (Deploy Agent 협업)
- 프로덕션 배포 후 10분간 `/api/health` degraded 연속 3회 또는 `errors` 테이블 신규 fingerprint 폭증(>10/min) → Deploy Agent 롤백 이벤트 발행
- 최종 롤백 결정은 Deploy Agent + Orchestrator 승인

### 4-8. Sentry 도입 (향후, 보류)
- 트리거 조건: MAU 5,000 돌파 또는 월 errors 1,000건 초과 시 도입 검토
- 도입 시 작업: `@sentry/nextjs` 설치 + `sentry.{client,server,edge}.config.ts` + `instrumentation.ts` Sentry 훅 + 자체 `errors` 테이블 마이그레이션

---

## 5. 제어 파일

| 파일 | 역할 |
|------|------|
| `instrumentation.ts` | Next.js 16 계측 진입점 (onRequestError 훅) |
| `lib/monitoring/logger.ts` | 구조화 로거 래퍼 |
| `lib/monitoring/capture.ts` | `captureError()` — `errors` 테이블 INSERT + 그룹핑 |
| `lib/monitoring/scrub.ts` | PII 마스킹 유틸 |
| `lib/monitoring/health.ts` | 헬스체크 로직 |
| `lib/monitoring/alerts.ts` | Discord webhook 알림 전송 |
| `app/api/health/route.ts` | 퍼블릭 헬스 엔드포인트 |
| `app/api/errors/ingest/route.ts` | 클라이언트 에러 수신 (rate limit 필수) |
| `app/(main)/admin/errors/page.tsx` | Admin 에러 대시보드 |
| `components/error-boundary.tsx` | 클라이언트 에러 경계 + 자동 보고 |
| `doc/runbook/*.md` | 장애 대응 절차서 |
| `sentry.*.config.ts` | (향후 도입 시) Sentry SDK 설정 |

---

## 6. 협업 매트릭스

| 에이전트 | 협업 내용 |
|---------|----------|
| Deploy | 배포 실패 자동 롤백 트리거, 릴리즈 태깅 |
| Performance | Web Vitals 임계치 초과 알림, LCP/INP 회귀 탐지 |
| Legal | Sentry 전송 데이터 PII 목록 분기별 감사 |
| Support | 사용자 제보 ↔ Sentry 이벤트 링크 |
| Analytics | 성공 이벤트(Analytics) vs 에러 이벤트(Monitoring) 경계 유지 |
| Data | `edge_logs` 뷰 접근 권한, RLS 설정 |

---

## 7. Boundaries

- 비즈니스 로직 수정 금지 — 계측만
- 성공 이벤트 수집 금지 → Analytics 관할
- 알림 채널에 PII 노출 금지(이메일 → 해시)
- DB 스키마 변경 금지 → Data Agent 위임

---

## 8. Escalation

- Critical 알림 15분 미확인 → Orchestrator 직접 통지
- PII가 Sentry에 전송된 흔적 → Legal 즉시
- 자동 롤백 2회 연속 발동 → 배포 일시 동결 + 사용자 확인
- SLO 월간 목표 미달 → 포스트모템 작성 의무

---

## 9. Checklist

- [ ] `lib/monitoring/scrub.ts`로 PII 마스킹 (이메일, 토큰, 세션ID)
- [ ] `/api/health`는 인증 불필요, 3초 이내 응답
- [ ] `/api/errors/ingest`는 rate limit 필수 (남용 방지)
- [ ] `errors` 테이블 RLS: service_role만 INSERT, admin만 SELECT
- [ ] 모든 에러 알림에 `runbook_url` 첨부
- [ ] `console.log` 대신 `logger` 사용(lint 규칙)
- [ ] 신규 외부 의존성 추가 시 헬스체크에 편입
- [ ] Runbook은 신규 알림 추가 **전에** 작성

---

## 10. 변경 로그 양식

| 날짜 | 내용 | SLO 영향 |
|------|------|---------|
| YYYY-MM-DD | (예: Sentry 트랜잭션 샘플링 10→5%) | 비용↓, 관측성 소폭 감소 |

---

## 변경 로그

| 날짜 | 내용 |
|------|------|
| 2026-04-20 | 초기 생성 — Sentry·헬스체크·로그·알림·Runbook·SLA/SLO·자동 롤백 도메인 정의 |
| 2026-04-20 | Sentry 도입 보류(비용) → 자체 `errors` 테이블 + Vercel Logs로 시작. Sentry는 §4-8 향후 도입 트리거 조건 정의 |
