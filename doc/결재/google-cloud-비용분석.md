# Google Cloud 비용 발생 항목 상세 분석

> **참조**: PDF 명세서 `4785520705174345_20260430.pdf` (4월 분, ₩7,462 새 작업)
> **분석 시점**: 2026-05-04

---

## 1. 결제 계정 정보

| 항목 | 값 |
|------|----|
| 받는사람 | 최동혁 / 해빗트리 |
| Cloud 계정 ID | `01349E-055D19-62E105` |
| 결제 계정 ID | `4785-5207-0517-4345` |
| 결제 프로필 ID | `7419-2075-3602` |
| 결제 카드 | American Express •••• 9680 |
| 청구 사이클 | 매월 1일 (전월 사용분) |
| 통화 | KRW |

---

## 2. 코드 베이스에서 확인된 GCP 사용

### 2-A. Cloud Run OCR 함수 (핵심 비용 지점)

| 항목 | 값 |
|------|----|
| 엔드포인트 | `https://extracttextfromimage-236647437750.us-central1.run.app` |
| 리전 | `us-central1` (북미 아이오와) |
| GCP 프로젝트 | `habitree-f49e1` |
| 서비스 계정 | `readtree-vision-api-service@habitree-f49e1.iam.gserviceaccount.com` |
| 클라이언트 코드 | `lib/api/cloud-run-ocr.ts` |
| 인증 방식 | 서비스 계정 키 → 동적 ID 토큰 (1시간 캐싱) |
| 호출 위치 | 책 사진 업로드 → 표지/내지 텍스트 추출 |

**연관 환경 변수**
- `CLOUD_RUN_OCR_URL`
- `GOOGLE_SERVICE_ACCOUNT_KEY` (JSON 한 줄, `private_key` 줄바꿈은 `\n`)
- `CLOUD_RUN_OCR_AUTH_TOKEN` (선택, 정적 토큰 fallback)

### 2-B. Gemini API (AI Studio)

| 항목 | 값 |
|------|----|
| 사용 모델 | `gemini-2.0-flash` |
| 클라이언트 코드 | `lib/ai/providers/gemini.ts`, `app/api/ai/chat/route.ts` |
| 의존성 | `@google/generative-ai@^0.21.0` |
| 인증 | `GEMINI_API_KEY` (AI Studio에서 발급) |
| 용도 | 챗봇 응답, 책 요약, 텍스트 정제, AI 추천 |

> 🔑 **중요**: Gemini API는 `ai.google.dev` (AI Studio) 키로 호출하므로, **이 명세서의 GCP 결제 계정과 분리**될 수 있다. AI Studio 무료 티어(분당 15 RPM, 일 1,500 RPD)를 안 넘으면 ₩0. 만약 Vertex AI Gemini를 썼다면 GCP 결제로 넘어옴 — 코드상으로는 **AI Studio 경로**라 결제 청구에 안 잡힐 가능성이 높음.

### 2-C. Google Books API (보조 도서 메타데이터)

| 항목 | 값 |
|------|----|
| 환경 변수 | `GOOGLE_BOOKS_API_KEY` |
| 클라이언트 코드 | `lib/api/book-page-count.ts` |
| 우선순위 | 3순위 (국립중앙도서관 → 알라딘 → Google Books) |
| 비용 | **무료** (1,000 요청/일, 키만 필요) |

### 2-D. Google OAuth 로그인

| 항목 | 값 |
|------|----|
| 위치 | Supabase Auth provider 경유 |
| 코드 | `app/actions/auth.ts:53-73`, `components/auth/social-login-buttons.tsx` |
| 비용 | **무료** (OAuth는 과금 대상이 아님) |

---

## 3. 의심되는 4월 비용 분해 (가설)

> 정확한 분해는 Cloud Console 비용 보고서가 있어야 확정된다. 아래는 **단가 기반 추정치**.

### 3-1. Cloud Vision API (강력 후보)

- **무료 티어**: `TEXT_DETECTION` 1,000 호출/월
- **초과 단가**: $1.50 / 1,000 호출 = 약 **₩2,000 / 1,000 호출** (환율 1,330 가정)
- **4월 예상 호출 수** (₩7,462 ≈ $5.5 기준):
  - 무료 1,000건 + 추가 약 3,500~4,000건 → **총 4,500~5,000 호출**
- **호출당 단가가 일정하므로 다른 API보다 가능성이 가장 높음**.

### 3-2. Cloud Run (소비 추정)

- **무료 티어**: 200만 요청/월, 360,000 vCPU-초/월, 180,000 GiB-초/월
- 함수가 OCR만 한다면 호출이 5,000~10,000 정도여서 **거의 100% 무료 티어 안**
- **추정 비용**: ₩0 ~ 수백 원

### 3-3. Cloud Logging / Monitoring

- 로그가 매우 많으면 ₩수백~수천. `cloud-run-ocr.ts`가 console.log를 많이 찍으니 약간 발생 가능.
- **무료 티어**: 50 GiB 로그/월

### 3-4. Egress (네트워크)

- Vision 응답 텍스트는 매우 작으므로 **₩0에 수렴**.

### 3-5. 기타 (불활성 자원 점검 필요)

체크할 가치가 있는 것:
- 사용 중지하지 않은 **Compute Engine VM** (있다면 큰 비용)
- 미삭제 **Cloud Storage 버킷** (이미지 보관용?) → 코드상으로는 Supabase Storage를 쓰니 GCS는 안 쓸 가능성 큼
- **Artifact Registry / Container Registry**의 Cloud Run 컨테이너 이미지 보관료 (소액)
- **Cloud Build** 빌드 분 (수동 배포면 거의 0)

---

## 4. 실제 비용 확인 절차 (10분 작업)

### Step 1. 비용 보고서

```
https://console.cloud.google.com/billing/01349E-055D19-62E105/reports
```
1. 기간을 "2026년 4월"로 설정
2. **그룹화 → SKU**로 변경
3. 상위 5개 SKU 캡처 → 이 문서 5번 항목에 기록

### Step 2. Vision API 사용량

```
https://console.cloud.google.com/apis/api/vision.googleapis.com/metrics?project=habitree-f49e1
```
- 4월 1일~30일 그래프 → 일별 호출 횟수
- 응답 코드 4xx/5xx 비중 (실패 호출도 과금되는 경우 있음)

### Step 3. Cloud Run 호출 카운트

```
https://console.cloud.google.com/run?project=habitree-f49e1
```
- `extracttextfromimage` 서비스 → Metrics 탭 → "Request count" 4월 합계

### Step 4. 예산 알림 (필수)

```
https://console.cloud.google.com/billing/01349E-055D19-62E105/budgets
```
- 월 ₩10,000 budget 생성 → 50%/90%/100% 이메일 알림
- 100% 도달 시 Pub/Sub로 알림 받아 자동 차단도 가능 (선택)

---

## 5. 4월 실제 비용 분해 (Console 확인 후 채울 자리)

| SKU | 사용량 | 단가 | 비용 (KRW) |
|-----|------|----|--------|
| (예: Cloud Vision API - Text Detection) | (호출 수) | $1.50/1k | (₩) |
| (예: Cloud Run - vCPU 초) | | | |
| (예: Cloud Run - 메모리 GiB·초) | | | |
| (예: Cloud Logging - log volume) | | | |
| **합계** | | | **₩7,462** |

> ☝️ Console에서 확인 후 위 표를 채워 넣을 것.

---

## 6. 위험 신호 체크리스트

- [ ] Vision API에 **무료 티어 1,000건 초과 호출**이 매월 발생하고 있다 → OCR 사용량 증가 추세 확인
- [ ] 동일 사용자가 같은 책을 **여러 번 OCR**해서 중복 호출 발생할 수 있다 → 이미지 hash 기반 캐시 검토
- [ ] **인증 실패한 호출도 과금**될 수 있다 → 4xx 응답률 확인
- [ ] **예산 알림 미설정** → 미사용자 증가 시 폭증 가능
- [ ] Cloud Run 함수가 **공개(unauthenticated)** 일 경우 외부 abuse 가능 → IAM에서 호출 권한 제한 확인

---

## 7. 다음 단계

1. **이 문서의 5번 표를 Cloud Console에서 확인 후 채워 넣기** (5분)
2. `비용대체방안.md` 검토 → 옵션 선택
3. 예산 알림 설정 (3분)
4. 사용량 캐싱·중복 호출 방지 코드 검토 (`lib/api/cloud-run-ocr.ts`에 hash 기반 캐싱 추가)
