# ReadTree 과금 현황

> **최종 갱신**: 2026-07-24
> **확인 방법**: 각 서비스 콘솔 직접 조회 (경로는 `README.md` 참조)
> **SSoT 원칙**: 추정치 금지. 콘솔에서 읽은 실제 청구값만 기입하고, 추정이면 `(추정)` 표기.

---

## 1. 한눈에 보기

| 서비스 | 플랜 | 월 비용 | 상태 |
|---|---|---|---|
| **GCP Cloud Run** (OCR) | 종량제 | ~~₩6,940~~ → **₩0 예상** | ✅ 2026-07-24 조치 완료 |
| **Supabase** ×3 조직 | Free | ₩0 | ✅ 정상 |
| **Vercel** | 미확인 | ₩0 또는 $20 | ⚠️ 플랜 확인 필요 |
| **OpenAI** | 종량제 | ₩0 | ✅ 2026-04 이후 미사용 |
| **Gemini API** | 무료 티어 | ₩0 | ✅ 정상 |
| **Anthropic** | 미설정 | ₩0 | ✅ 키 미등록 |
| **Polar** | sandbox | ₩0 | ✅ 결제 0건 |
| **토스페이먼츠** | 비활성 | ₩0 | ✅ `IS_TOSS_ENABLED=false` |
| **GCP Firebase 계정** | 종량제 | ₩10 (연 ₩73) | 🔸 잔여 리소스, 정리 대기 |
| 무료 API 5종 | - | ₩0 | ✅ 정상 |

**조치 전 연환산 약 ₩83,000 → 조치 후 사실상 ₩0** (Vercel 플랜 확인 시 갱신 필요)

---

## 2. GCP — 결제계정 `readtree`

```
결제 계정 ID : 01349E-055D19-62E105
프로젝트     : gen-lang-client-0287655743 (표시명 readingtree, 번호 236647437750)
                └ Google AI Studio가 자동 생성한 프로젝트
서비스       : extracttextfromimage (us-central1)
호출부       : lib/api/cloud-run-ocr.ts → lib/api/ocr.ts (관리자 OCR 전용)
```

### 2-1. 2026년 1~7월 누적: **₩37,969** (무료 크레딧 -₩53,810 차감 후)

| SKU | 사용량 | 사용 비용 | 절감 | 소계 |
|---|---|---|---|---|
| Services **Min Instance** Memory | 8,309,672 GiB-초 | ₩30,587 | -₩9,277 | **₩21,310** |
| Services **Min Instance** CPU | 16,619,344 vCPU-초 | ₩61,174 | -₩44,520 | **₩16,655** |
| Services CPU (요청 처리) | 493.95 초 | ₩17 | -₩13 | ₩4 |
| Services Memory (요청 처리) | 163.45 GiB-초 | ₩1 | -₩0 | ₩0 |
| Requests | **342 건** | ₩0 | ₩0 | ₩0 |
| Gemini API 이미지 토큰 (in/out) | 각 1 count | ₩0 | ₩0 | ₩0 |
| Cloud Run 인터넷 egress | 0 GiB | ₩0 | ₩0 | ₩0 |
| Artifact Registry 저장/egress | 0.05 GiB-월 | ₩0 | ₩0 | ₩0 |

**요청당 단가 ₩111** (₩37,969 ÷ 342건). 비용의 **99.99%가 유휴 상태 과금**이고, 실제 요청 처리 비용은 연 ₩4다.

### 2-2. 2026년 7월 1~22일: ₩3,082 (전기간 대비 -54%)

| SKU | 사용량 | 소계 |
|---|---|---|
| Min Instance Memory | 963,610 GiB-초 | ₩2,316 |
| Min Instance CPU | 1,927,221 vCPU-초 | ₩766 |
| 실제 요청 처리 (CPU+메모리+요청 6건) | 38.75초 / 10.75 GiB-초 | ₩0 |

7월 전체 예상 청구액 ₩6,940 → 연환산 약 ₩83,000.

### 2-3. 무료 티어와 초과 구조

| 항목 | 월 무료 한도 | 유휴 1인스턴스가 소모하는 양 |
|---|---|---|
| vCPU-초 | 180,000 | **약 2,592,000** (14배 초과) |
| GiB-초 | 360,000 | 약 1,296,000 (3.6배 초과) |
| 요청 | 2,000,000 | 342건/**연** |

min-instance 1개는 아무 요청이 없어도 무료 한도를 매달 14배 초과 소진한다. **요청 기반 과금(request-based billing)이어도 min-instance는 예외** — idle 상태에도 CPU·메모리가 청구된다.

### 2-4. 현재 설정 (2026-07-24 조치 후)

```
확장: 자동(최소: 0개, 최대: 10개)   ← 최소 1개에서 변경
CPU 한도: 1 / 메모리: 512MiB / 동시 실행: 80 / 타임아웃: 300초
결제 방식: 요청 기반 / 시작 CPU 부스트: 사용 설정됨
활성 리비전: extracttextfromimage-00002-9j8 (2026-01-12 배포)
```

상세 경위: [`incidents/2026-07-24-cloudrun-idle-min-instance.md`](incidents/2026-07-24-cloudrun-idle-min-instance.md)

---

## 3. GCP — 결제계정 `Firebase 결제` (별도)

```
결제 계정 ID : 01BA58-1E3E39-F7634B
프로젝트 4개 / 서비스 13개 / SKU 80행
2026년 1~7월 누적: ₩73
```

| SKU | 사용량 | 금액 |
|---|---|---|
| Standard Storage (Seoul) | 1.16 GiB-월 | ₩40 |
| Cloud Firestore PITR Storage | 0.12 GiB-월 | ₩33 |
| Firebase App Hosting egress | 0.02 GiB | ₩0 (무료 차감) |

ReadTree와 **무관한 잔여 리소스**로 보인다. 금액은 무시할 수준이나 쓰지 않는 리소스가 남아 있다는 신호이므로 정리 대상.

---

## 4. Supabase — 전부 Free Plan

| 조직 | 플랜 | 프로젝트 |
|---|---|---|
| cdhrich's projects | Free | - |
| reading_tree | Free | 1개 (메인 DB) |
| star | Free | 1개 (음악 전용) |

**Free 티어 주의점**
- DB 500MB / Storage 1GB / Egress 5GB per month
- 음악 버킷(`jazz-music`)이 v2 정리 후 약 660MB — Storage 한도의 66%
- 프로젝트가 **7일간 요청 0이면 일시정지**된다 (비용이 아닌 가용성 리스크)

---

## 5. Vercel ⚠️ 미확인

```
팀      : cdhrich's projects (team_68xdasf71FoWKx7UlciSs9TX)
프로젝트 : readingtree (prj_4YYwTAL3HGuWYRUbSboHofZbfLv7)
```

플랜 미확인 — Hobby면 ₩0, **Pro면 월 $20(약 ₩28,000)로 현재 최대 고정비**가 된다.

| 사용량 지표 | 값 | 판정 |
|---|---|---|
| 월 페이지뷰 (`access_logs`) | 479~2,551 | Hobby 한도 대비 여유 |
| Cron | 2개 (월 1회 + 일 1회) | Hobby 한도(2개, 일 1회) 내 |

`vercel.json` 크론 설정이 Hobby 제약 안에 있어 기능상 Hobby로 충분하다.

---

## 6. AI 서비스 — 사용량 사실상 0

| Provider | 모델 | 코드 위치 | 2026-04 이후 |
|---|---|---|---|
| OpenAI | `gpt-4o-mini` | `lib/ai/providers/openai.ts` | 0건 |
| OpenAI | `dall-e-3` | `app/api/generate-cover/route.ts` | 0건 |
| Google | `gemini-2.0-flash` | `lib/ai/providers/gemini.ts` | 0건 |
| Anthropic | `claude-opus-4-8` (기본) | `lib/ai/providers/anthropic.ts` | 키 미설정 |

**DALL-E 안전장치**: 관리자 권한 검사 + 기존 파일 존재 시 생성 스킵. 무한 호출 위험 없음.
**Anthropic 주의**: `DEFAULT_MODEL`이 `claude-opus-4-8`(고가 모델)이다. `ANTHROPIC_API_KEY`를 설정하는 순간 비용이 발생하므로, 활성화 전 모델 기본값 재검토 필요.

---

## 7. 결제·외부 API

| 서비스 | 상태 | 근거 |
|---|---|---|
| Polar | sandbox | `POLAR_ENVIRONMENT=sandbox`, `payment_orders` 0행 |
| 토스페이먼츠 | 비활성 | `lib/payment/config.ts` `IS_TOSS_ENABLED = false` |
| 네이버 검색 API | 무료 | - |
| 알라딘 Open API | 무료 | - |
| 국립중앙도서관 ISBN | 무료 | - |
| 카카오 SDK | 무료 | - |
| Google Analytics 4 | 무료 | - |

---

## 8. 기능 사용량 추이 (교차 검증용)

| 월 | ocr_logs | chat_messages | ai_reports | access_logs |
|---|---|---|---|---|
| 2025-12 | 2 | - | - | - |
| 2026-01 | **308** | 22 | - | - |
| 2026-02 | 13 | 83 | 3 | - |
| 2026-03 | 6 | 10 | 3 | 2,461 |
| 2026-04 | 2 | 2 | 1 | 2,551 |
| 2026-05 | **0** | **0** | 0 | 743 |
| 2026-06 | **0** | **0** | 1 | 838 |
| 2026-07 | **0** | **0** | 0 | 479 |

OCR·AI 채팅은 **2026-05부터 완전 미사용**. 그럼에도 Cloud Run 과금은 계속됐다 — 이 표가 낭비를 드러낸 결정적 근거다.

---

## 변경 이력

| 날짜 | 내용 |
|---|---|
| 2026-07-24 | 문서 신설. Cloud Run min-instance 1→0 조치 반영 |
