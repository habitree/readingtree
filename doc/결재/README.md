# Google Cloud 결제 점검 (해빗트리 / ReadingTree)

> **점검일**: 2026-05-04
> **점검 대상**: Google Cloud 결제 계정 `4785-5207-0517-4345`
> **GCP 프로젝트**: `habitree-f49e1`

---

## 한 줄 요약

> **현재 비용은 Cloud Run에 직접 호스팅한 OCR 함수(`extractTextFromImage`)가 내부적으로 호출하는 Google Vision API에서 대부분 발생한다.** Cloud Run 자체는 무료 티어 안에 있을 가능성이 높고, 진짜 과금 항목은 **Vision API 호출 건수**다.

---

## 🔴 코드 점검에서 발견한 결정적 원인 (2026-05-04 추가)

> "사용자도 적은데 OCR이 너무 많이 발생하는 것 같다"는 직감이 정확했습니다.

**`/admin/api-info` 페이지가 진입 시마다 자동으로 `testOcrConnection()`을 호출하고, 이 함수가 1x1 PNG를 진짜 Cloud Run에 보내서 Vision API를 호출**합니다. 게다가 이 호출은 `recordOcrSuccess/Failure`를 안 거치므로 **`ocr_logs` 통계에 잡히지 않습니다 (사일런트 과금)**.

| 비정상 호출 경로 | 통계에 잡힘? | 비용 영향 |
|---|---|---|
| 🔴 admin 페이지 자동 `testOcrConnection` | ❌ | **매우 큼 (1순위)** |
| 🟠 `batchProcessOCR` failed 노트 반복 처리 | ✅ | 큼 |
| 🟡 결과 캐시 부재로 동일 이미지 재호출 | ✅ | 중간 |
| 🟡 Cloud Run 함수 unauthenticated 의심 | ❌ | 잠재적 큼 |

→ 상세 분석·즉시 패치 코드는 **`보안점검.md`** 참조.

---

## 4월 결제 명세 (PDF 기반)

| 항목 | 값 |
|------|----|
| Cloud 계정 ID | `01349E-055D19-62E105` |
| 결제 계정 ID | `4785-5207-0517-4345` |
| 명세서 발행일 | 2026-04-30 |
| 4월 1일 시작 잔액 | **₩7,558** *(3월 사용분, 4월 1일 카드 결제됨)* |
| 4월 새 작업 합계 | **₩7,462** *(4월 사용분 → 5월 결제 예정)* |
| 4월 1일 카드 청구 | -₩7,558 *(American Express 9680)* |
| 최종 잔액 (KRW) | **₩7,462** |

> ⚠️ PDF 명세서에는 서비스(SKU)별 내역이 없다. 정확한 서비스별 비용은 Cloud Console 비용 보고서에서 확인해야 한다 → `https://console.cloud.google.com/billing/01349E-055D19-62E105/reports`

---

## 비용 발생 구조

```
사용자가 책 사진 업로드
    ↓
Next.js 서버 (Vercel)
    ↓ google-auth-library로 ID 토큰 발급
    ↓
Cloud Run 함수: extracttextfromimage-236647437750.us-central1.run.app
    ↓
Google Cloud Vision API (실제 과금 지점)
    ↓
추출된 텍스트 반환 → Gemini가 책 정보로 정제
```

| 레이어 | 서비스 | 4월 추정 비용 비중 | 비고 |
|------|------|------------|----|
| 호스팅 | Cloud Run (`us-central1`) | 매우 적음 (~₩0~수백) | 200만 요청/월 무료 티어 |
| 인식 엔진 | Cloud Vision API (`TEXT_DETECTION` 추정) | **대부분** (~₩6,000~7,000) | 1,000건/월 무료 후 $1.50/1,000건 |
| 인증 | Service Account 토큰 | ₩0 | 무료 |
| 외부 송신 | Egress (Vision 응답) | 매우 적음 | 1GB/월 무료 |
| 별도 | Gemini API | 별도 결제 (AI Studio API, 이 명세서엔 미포함 가능) | 무료 티어 큼 |

> **추정**: 4월 OCR 약 **5,000~5,500 호출** 또는 (Vision API 단가 기준) 무료 티어 1,000건 초과분이 비용의 거의 전부.

---

## 폴더 안내

| 파일 | 내용 |
|------|------|
| `README.md` | (이 문서) 전체 요약 + 정리 인덱스 |
| `google-cloud-비용분석.md` | 비용 발생 항목·코드·환경변수·관측 포인트 상세 |
| `비용대체방안.md` | OCR 비용을 줄이거나 대체할 5가지 방안 비교 |
| **`보안점검.md`** | **🔥 비정상 OCR 호출 4건 발견 + 즉시 패치 코드** |
| `index.html` | 위 내용을 한 페이지로 본 HTML 리포트 |

---

## 즉시 점검할 액션 (우선순위 순서)

1. 🔴 **`/admin/api-info` 자동 `testOcrConnection` 제거** (`보안점검.md` 1순위) — 패치 한 줄로 비용 80%+ 감소 가능
2. **Cloud Console 비용 보고서 확인** — 위 URL 접속 → 4월 SKU별 분해. Vision API 비중 확인
3. **Cloud Run IAM 점검** — `gcloud run services get-iam-policy extracttextfromimage`로 `allUsers` 노출 여부 확인 (`보안점검.md` 4순위)
4. **예산 알림 설정** — 월 ₩10,000 도달 시 이메일 발송 (현재 미설정 추정, 3분 작업)
5. **OCR 결과 캐시 추가** — `ocr_cache` 테이블로 같은 이미지 중복 호출 방지 (`보안점검.md` 3순위)
6. **대체 방안 검토** — `비용대체방안.md` 옵션 B(Gemini Vision) PoC

---

## 결론

- **금액은 작지만(월 ₩7~8천) 사용량 증가 시 선형 증가**한다. 사용자가 100명 → 10,000명으로 늘면 단순 비례로 ~₩75만/월.
- Vision API는 **무료 티어 1,000건/월 초과분만 과금**된다. 즉 호출량 자체가 늘면 비용은 가파르게 증가.
- Gemini API key가 이미 발급되어 있고 Gemini 2.0의 멀티모달이 OCR을 충분히 대체할 수 있으므로, **`Gemini Vision으로 통합 → Cloud Run 함수 폐기`** 가 가장 현실적인 비용 0원 경로.
