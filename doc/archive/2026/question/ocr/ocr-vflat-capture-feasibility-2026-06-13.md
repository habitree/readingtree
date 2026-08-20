# vFlat급 책페이지 캡처 고도화 — 타당성 검토 기획서

> 작성일: 2026-06-13
> 분석 관점: 프로덕트 + 기술 타당성(Feasibility)
> 대상 기능: 책페이지 촬영 → OCR → 필사/발췌 기록 (현 OCR 파이프라인 고도화)
> 결론 요약: **단계적 균형 전략 권장 — Tier1(브라우저 전처리) 즉시 도입 + 한 기록당 최대 3페이지 스캔 기본 지원, Tier2/3는 효과 검증 후 단계 확대**

---

## 0. 개요(한눈에 보기)

| 항목 | 내용 |
|------|------|
| 벤치마크 | **vFlat(브이플랫)** — VoyagerX의 책 스캐너 앱 (질문의 "VPLAT") |
| 핵심 발견 | ReadTree는 **이미 OCR 엔진을 완비**. vFlat과의 격차는 OCR이 아니라 **"촬영 전처리 품질"** |
| 결정적 제약 | ReadTree = **Next.js PWA 웹앱**, vFlat = **네이티브 앱**(온디바이스 GPU ML). 직접 연동 불가(vFlat 공개 API/SDK 없음) → 적용 범위가 **티어(Tier)** 로 갈림 |
| 권장 전략 | **단계적 균형** — Tier1 즉시 → Tier2/3 검증 후 확대 |
| 1차 적용 범위 | **필사·발췌 품질 개선 중심** + **한 기록(항목)당 스캔 페이지 최대 3페이지 기본 지원** |
| 비용 핵심 | Tier1은 **오픈소스(라이선스 0)**, OCR 단가는 페이지당 수 원 이하. 고품질(Tier3 상용 SDK)은 연 정액 라이선스(견적 필요) |

---

## 1. 배경 (왜 검토하는가)

사용자 요청: "VPLAT(=vFlat)이라는 책페이지를 캡처해주는 모바일 서비스의 내용·기능·품질을 분석하고, 그 방식을 ReadTree에 적용하기 위한 방법을 디테일하게 기획. 적용 전 검토사항·비용·방식을 자세히 검토하여 적용 가능 범위를 문서화하고 HTML 보고서로 생성."

검토를 통해 드러난 핵심 전제:

1. **ReadTree는 이미 OCR을 한다.** 캡처 사진 → Supabase Storage → **Google Cloud Run OCR** → 선택적 **AI 텍스트 보정**(GPT/Gemini/Claude) → `transcriptions` 테이블 저장. 통계·쿼터·레이트리밋·캐시·배치 보정까지 운영 중. (근거: `app/api/ocr/process/route.ts`, `lib/api/cloud-run-ocr.ts`, `lib/ai/ocr-correction.ts`)
2. **격차는 "전처리"다.** 현재 캡처는 가장 단순한 웹 방식 — `<input type="file" accept="image/*" capture="environment">` 로 정지 사진 1장을 받고 `smartCompressImage`로 압축만 한다. **곡면 보정·손가락 제거·테두리 인식·자동 촬영이 전혀 없다.** (근거: `components/records/record-photo-strip.tsx`) → 곡면·기울기·그림자·손가락이 그대로 OCR 입력으로 들어가 인식률을 떨어뜨린다.
3. **vFlat의 본질은 캡처 전처리다.** vFlat이 "전문 북스캐너처럼" 보이는 이유는 OCR 엔진이 아니라, 촬영 순간의 **AI 곡면 보정·손가락 자동 제거·테두리 자동 크롭·자동 촬영**이다.

따라서 본 검토의 질문은 한 문장으로:
> **"네이티브 앱 vFlat의 캡처 전처리 품질을, 웹앱인 ReadTree에서 어디까지·어떻게·얼마의 비용으로 따라잡을 수 있는가?"**

---

## 2. 현황 분석 (As-Is)

### 2.1 현재 캡처 → OCR 파이프라인

```
[모바일 카메라/앨범]
   │  <input type="file" capture="environment">  ← 정지 사진 1장, 전처리 없음
   ▼
smartCompressImage (lib/utils/image.ts)           ← 압축만 (1MB/1920px)
   ▼
POST /api/upload (app/api/upload/route.ts)         ← 검증 + sharp 재압축 + Supabase Storage('images')
   ▼  public URL
POST /api/ocr (app/api/ocr/route.ts)               ← 쿼터/레이트리밋(15/min)/소유검증 → after() 백그라운드
   ▼
POST /api/ocr/process                              ← maxDuration 60s
   ├─ extractTextFromImage (lib/api/cloud-run-ocr.ts) → Google Cloud Run OCR
   ├─ correctOcrText (lib/ai/ocr-correction.ts)       → 선택적 AI 보정(키 있을 때)
   └─ createOrUpdateTranscription                     → transcriptions (note 1:1, status)
   ▼
[필사/발췌] 사용자 편집 → quote_content / memo_content
```

### 2.2 보유 vs 부재 기능

| 구분 | 기능 | 상태 | 근거 |
|------|------|------|------|
| OCR 엔진 | 텍스트 추출 | ✅ 보유 | `lib/api/cloud-run-ocr.ts` (동적 토큰·55분 캐시·이미지 해시 캐시) |
| OCR 후처리 | AI 텍스트 보정(오탈자·깨진 글자) | ✅ 보유 | `lib/ai/ocr-correction.ts` (OpenAI/Gemini/Anthropic 폴백) |
| 운영 | 쿼터·구독 게이트·포인트 차감 | ✅ 보유 | `app/api/ocr/route.ts` |
| 운영 | 레이트리밋(15/min) | ✅ 보유 | `app/api/ocr/route.ts` |
| 운영 | 통계·로그·실패 추적 | ✅ 보유 | `ocr_logs`, `ocr_usage_stats`, `app/actions/ai/ocr.ts` |
| 운영 | 관리자 배치 OCR·무효 이미지 정리 | ✅ 보유 | `app/actions/admin/ocr.ts` |
| 업로드 | 클라이언트/서버 이중 압축·파일 검증 | ✅ 보유 | `lib/utils/image.ts`, `lib/security/file-validation.ts` |
| **캡처 전처리** | **테두리 자동 인식·크롭** | ❌ **부재** | — |
| **캡처 전처리** | **원근/기울기 보정(deskew)** | ❌ **부재** | — |
| **캡처 전처리** | **곡면 보정(dewarp)** | ❌ **부재** | — |
| **캡처 전처리** | **손가락 자동 제거** | ❌ **부재** | — |
| **캡처 전처리** | **자동 촬영(대상 인식 후 자동 셔터)** | ❌ **부재** | — |
| **캡처 전처리** | **양면 동시 촬영 + 자동 분할** | ❌ **부재** | — |
| 다중 페이지 | 한 기록에 여러 스캔 페이지 | △ 부분(사진 첨부 ≤5장은 가능, OCR 다중연결은 미흡) | `record-photo-strip.tsx`(max 5), `transcriptions.note_id` UNIQUE |

> **핵심 갭: "캡처 전처리 = 0".** OCR·운영 인프라는 성숙했으나, 입력 이미지 품질을 끌어올리는 단계가 통째로 비어 있다. 이것이 vFlat 대비 인식률 격차의 1차 원인이다.

---

## 3. vFlat(VPLAT) 분석

### 3.1 정체 및 포지션

- **제품**: vFlat Scan — PDF Scanner, OCR (개발사 **VoyagerX**, 패키지 `com.voyagerx.scanner`)
- **형태**: 네이티브 iOS/Android 앱. 무료 + 인앱결제(OCR 100페이지 한도 후 크레딧/광고)
- **공개 API/SDK**: **없음.** 소비자 앱 전용 → ReadTree가 "직접 연동"하는 방식은 **불가능**. "방식 차용(replicate)"만 가능.
- **기술 기반**: 온디바이스 딥러닝. TensorFlow Lite **GPU delegate**로 실시간 추론(책 검출·보정)을 단말에서 수행. (출처: TensorFlow 공식 블로그)

### 3.2 핵심 기능 6가지 (= 따라잡아야 할 품질 항목)

| # | vFlat 기능 | 효과 | ReadTree 적용 시 필요한 기술 | 웹 난이도 |
|---|-----------|------|------------------------------|-----------|
| 1 | **테두리 자동 인식 + 크롭** | 어느 각도에서도 페이지만 깔끔 추출 | 윤곽선 검출 + 코너 추정 (OpenCV.js `findContours`) | 중 |
| 2 | **원근/기울기 보정(deskew)** | 비스듬히 찍어도 정면처럼 | 원근 변환 `warpPerspective` | 중 |
| 3 | **곡면 보정(dewarp)** | 책 가운데 휜 면을 펼침 | 딥러닝 dewarp 모델(DewarpNet/DocTr류) | **상(웹 비현실적)** |
| 4 | **손가락 자동 제거** | 책 누른 손가락을 지움 | 세그멘테이션 + 인페인팅 모델 | **상(웹 비현실적)** |
| 5 | **자동 촬영** | 대상 안정화 시 자동 셔터 → 대량 촬영 빠름 | 실시간 프레임 분석 + 코너 안정화 판정 | 중 |
| 6 | **양면 동시 촬영 + 자동 분할** | 펼친 책 한 번에 두 페이지 | 중앙 분할 + 페이지별 보정 | 중~상 |
| (보조) | OCR / TTS / PDF·TXT 내보내기 | 텍스트화·낭독·내보내기 | OCR은 **ReadTree 이미 보유** | — |

> **통찰**: 1·2·5(테두리·원근·자동촬영)는 **브라우저에서 오픈소스로 상당 부분 재현 가능**. 3·4(곡면·손가락 제거)는 **딥러닝 모델이 필요해 웹 단독으로는 비현실적** — 이 두 가지가 "웹앱이 네이티브를 100% 따라가지 못하는 경계선"이다.

---

## 4. 결정적 제약 — 웹앱 아키텍처

ReadTree는 **Next.js PWA 웹앱**이다. 브라우저 카메라는 두 가지뿐:

| 방식 | 설명 | 전처리 가능성 |
|------|------|---------------|
| `<input capture>` (현행) | 네이티브 카메라 호출 → **정지 사진 1장** 반환 | 촬영 후 후처리만(라이브 가이드 불가) |
| `getUserMedia()` | **라이브 카메라 스트림**을 `<video>`/`<canvas>`로 받음 | 실시간 프레임 분석·자동촬영·테두리 가이드 가능 |

**핵심 제약 사항**
- **HTTPS 필수**: `getUserMedia`는 보안 컨텍스트에서만 동작 (ReadTree는 Vercel HTTPS → 충족).
- **iOS Safari 제약**: 모바일 Safari의 카메라 권한·자동재생·백그라운드 처리에 제약이 있어 UX 예외처리 필요.
- **온디바이스 GPU ML 실시간 처리는 비현실적**: vFlat의 dewarp/손가락 제거 같은 무거운 딥러닝을 브라우저에서 실시간으로 돌리는 것은 성능·번들 측면에서 사실상 불가. (WASM/WebGL로 일부 가능하나 저사양 모바일에서 발열·지연 심각)
- **번들 비용**: OpenCV.js WASM은 ~8MB로 페이지 로드를 막을 수 있어 **지연 로드(동적 import)** 필수.

> 결론: "vFlat을 그대로 웹에 이식"은 불가능. **현실적 목표는 "테두리·원근·자동촬영"을 웹으로 재현해 OCR 입력 품질을 크게 끌어올리는 것**이며, 곡면·손가락 제거가 필요하면 클라우드(Tier2) 또는 상용 SDK(Tier3)로 보완한다.

---

## 5. 적용 옵션 — Tier 0~4 비교

| | **Tier 0 (현행)** | **Tier 1 (브라우저 전처리)** | **Tier 2 (클라우드 전처리)** | **Tier 3 (상용 웹 SDK)** | **Tier 4 (네이티브 전환)** |
|---|---|---|---|---|---|
| 방식 | file-input → Cloud Run OCR | getUserMedia + OpenCV.js/jscanify | 서버에 dewarp/finger-removal 모델 | Scanbot / Dynamsoft (WASM) | Capacitor/RN + ML Kit / 네이티브 SDK |
| 테두리·원근 | ❌ | ✅ | ✅ | ✅✅ | ✅✅ |
| 곡면 보정(dewarp) | ❌ | ❌ | ✅(모델) | ✅ | ✅✅ |
| 손가락 제거 | ❌ | ❌ | ✅(모델) | △~✅ | ✅✅ |
| 자동 촬영 | ❌ | ✅ | ✅(클라 측) | ✅✅ | ✅✅ |
| 오프라인 처리 | ❌ | ✅(클라) | ❌ | ✅(클라 WASM) | ✅ |
| 웹앱 적합성 | ✅ | ✅ | ✅ | ✅ | ❌(플랫폼 전환) |
| 예상 품질 | 낮음 | **중상** | 상 | **상~최상** | **최상(vFlat급)** |
| 비용 | 현행 | **거의 0(오픈소스)** | 중(추론/종량) | **고(연 정액 라이선스)** | 최고(개발+스토어) |
| 개발 난이도 | — | 중 | 중상 | 중(SDK 통합) | 상(앱 신규) |
| 리스크 | — | 복잡배경 검출 실패 | 지연·비용 | 라이선스 종속·비용 | 전략 전환·운영부담 |

**옵션 요약**
- **Tier 1** = 비용 거의 0으로 vFlat의 1·2·5(테두리·원근·자동촬영)를 웹에서 재현. 단 dewarp/손가락 제거는 미지원, ~8MB WASM, 복잡 배경에서 검출 실패 가능.
- **Tier 2** = 클라우드에 dewarp/finger-removal 모델을 추가(기존 Cloud Run 확장 또는 Aspose.OCR Cloud 등 종량 API). 품질↑, 지연·비용↑.
- **Tier 3** = Scanbot/Dynamsoft 같은 상용 JS 스캐너 SDK. WASM으로 실시간 엣지·자동촬영·보정 제공 → **웹에서 vFlat급에 가장 근접**. 연 정액 라이선스(견적 필요).
- **Tier 4** = 네이티브 앱으로 전환(Capacitor/React Native 래핑 + Google ML Kit Document Scanner 등). vFlat 완전 패리티지만 **플랫폼 전략 전환** 의제.

---

## 6. 권장 전략 — 단계적 균형 로드맵

```
Phase A (즉시)            Phase B (검증 후)           Phase C (선택)
[Tier 1]        ──게이트──> [Tier 2]        ──게이트──> [Tier 3]
브라우저 전처리            클라우드 전처리             상용 웹 SDK
+ ≤3p 스캔 기본           (dewarp/손가락)            (vFlat급 품질)
비용≈개발공수             중비용·검증 필요            고비용·ROI 판단
```

| Phase | 내용 | 진입 조건 | 탈출/승격 게이트 |
|-------|------|-----------|------------------|
| **A (Tier1)** | 브라우저 스캔 모드(테두리·원근·자동촬영) + **한 기록당 최대 3페이지** | 즉시 착수 | OCR 인식 만족도/재촬영율 측정 |
| **B (Tier2)** | 곡면/손가락이 인식률 저해의 핵심으로 확인되면 클라우드 전처리 추가 | A 측정에서 "곡면/손가락 실패"가 유의미할 때 | 페이지당 추가비용 대비 인식률 개선폭 검토 |
| **C (Tier3)** | 캡처 품질이 핵심 KPI로 격상되면 상용 SDK 무료 트라이얼로 벤치마크 | B로도 부족 + 품질이 전환·리텐션에 직결될 때 | 무료 트라이얼 품질·연 라이선스 ROI 판단 |

> Tier 4(네이티브)는 본 로드맵과 분리한 **별도 플랫폼 전략 의제**로 둔다(앱 출시·스토어 운영은 기능 1건의 범위를 넘어선다).

---

## 7. 상세 적용 방법 — Phase A 구현 설계 (Tier 1)

### 7.1 UX 흐름

1. 기록 작성(RecordSheet의 detail/필사 단계) 또는 노트 작성에서 **"스캔" 진입점** 추가(기존 "카메라/앨범" 옆).
2. "스캔" 탭 → **라이브 카메라(getUserMedia)** 풀스크린. 화면에 **검출된 페이지 테두리 가이드(사각형 오버레이)** 표시.
3. 페이지가 안정적으로 검출되면 **자동 촬영**(또는 수동 셔터). 촬영 즉시 **원근 크롭 + 대비 향상**된 결과 미리보기.
4. **페이지 큐**에 추가(**최대 3페이지**). 각 페이지는 미리보기·재촬영·삭제 가능.
5. "완료" → 각 페이지 압축 → 업로드 → OCR → 추출 텍스트가 필사/발췌 편집기로 전달.

### 7.2 신규/재사용 컴포넌트

| 구분 | 항목 | 비고 |
|------|------|------|
| 신규 | `components/records/book-page-scanner.tsx` | getUserMedia + `<canvas>` + 검출 오버레이 + 자동촬영 + 3페이지 큐 |
| 신규 | `lib/scan/document-detect.ts` | jscanify/OpenCV.js **동적 import** 래퍼(검출·코너·`warpPerspective`) |
| 재사용 | `lib/utils/image.ts#smartCompressImage` | 캡처본 압축(기존 그대로) |
| 재사용 | `app/api/upload/route.ts` | 업로드(기존 그대로) |
| 재사용 | `app/api/ocr/route.ts` + `/process` | OCR(기존 그대로, `{noteId, imageUrl}`) |
| 재사용 | `lib/ai/ocr-correction.ts` | AI 보정(기존 그대로) |
| 재사용 | `app/actions/ai/ocr.ts` | 통계 기록(기존 그대로) |
| 재사용 | `RecordPhotoStrip` 패턴 | 페이지 큐 썸네일 UI 참조 |

### 7.3 기술 포인트

- **검출 라이브러리**: `jscanify`(OpenCV.js 기반, 문서 검출·코너 추출·`extractPaper`) 또는 OpenCV.js 직접 사용. **동적 import + 지연 로드**로 ~8MB WASM이 초기 로딩을 막지 않게 함. 스캔 모드 진입 시에만 로드.
- **자동 촬영 판정**: 최근 N프레임 동안 코너 좌표가 임계값 내 안정 → 셔터. 코너가 `undefined`(부분 가림/프레임 이탈)면 대기.
- **대비 향상**: 그레이스케일 + 적응형 임계처리(adaptive threshold)로 텍스트 대비를 올려 OCR 친화적 이미지 생성(선택).
- **폴백(graceful degrade)**: `getUserMedia` 미지원/권한 거부/저사양 → **기존 file-input 모드로 자동 전환**(현 `record-photo-strip.tsx`). 핵심 기능 손실 없음.
- **결합/지연 로딩**: 검출 실패가 잦은 환경(어두운 곳·복잡 배경)에서는 "수동 크롭" 보조 UI 제공.

### 7.4 다중 페이지(최대 3) 처리 옵션 — 데이터 모델 결정 필요

| 옵션 | 구조 | 장점 | 단점 |
|------|------|------|------|
| **(a) 페이지당 노트** | 3페이지 → 노트 3개(각 transcription 1:1) | **현 스키마 무변경**, 가장 단순 | "1 기록 = 1 항목" 멘탈모델과 어긋남, 목록이 분산 |
| **(b) 1노트 + 3이미지** | 노트 1개 + 이미지 3장 + `transcriptions` 1:N 확장(`page_index` 추가) | 한 항목에 묶임(요청 의도 부합) | **마이그레이션 필요**(`note_id` UNIQUE 해제 + `page_index`), RLS 재점검 |
| (c) 1노트 + 텍스트 결합 | 3페이지 OCR 결과를 합쳐 단일 `quote_content` | 스키마 최소 변경 | 페이지 경계·재OCR 추적 약함 |

> **권장**: 1차는 **(c) 또는 (a)** 로 스키마 충격 없이 출시 → 사용 패턴 확인 후 필요 시 **(b)** 로 정식 확장. (b) 채택 시 `doc/database/`에 **Idempotent 마이그레이션 + RLS 4종** 필수.
> 참고: `reading_logs.image_urls`는 이미 ≤5장 JSONB 배열을 지원하므로, "사진 첨부(스탬프)" 경로와는 정합. OCR 다중 연결만 위 옵션으로 결정하면 된다.

---

## 8. 비용 분석

### 8.1 단가 기준(앵커)

| 항목 | 단가 | 출처/비고 |
|------|------|-----------|
| Google Vision DOCUMENT_TEXT_DETECTION | 월 1,000건 무료 → 이후 **$1.50/1,000** → 500만 초과 **$0.60/1,000** | cloud.google.com/vision/pricing (Cloud Run이 이를 래핑한다고 가정, Cloud Run 컴퓨트 별도) |
| AI 보정 — gemini-2.0-flash | 입력 $0.075 / 출력 $0.30 (per 1M tok) | 페이지당 수백 토큰 → 극소 |
| AI 보정 — gpt-4o-mini | 입력 $0.15 / 출력 $0.60 | OCR 보정 권장 경량 모델 |
| AI 보정 — claude-haiku-4-5 | 입력 $1 / 출력 $5 | 폴백 옵션 |
| Tier1 오픈소스(OpenCV.js/jscanify) | **라이선스 $0** | 개발 공수 + 번들 ~8MB(1회 로드) |
| Tier3 상용 SDK(Scanbot/Dynamsoft) | **연 정액 라이선스(벤더 견적 필요)** | 통상 연 수천 USD↑ 규모로 알려짐, 무료 트라이얼 제공 |

### 8.2 월 1만 페이지 시나리오(추정)

| Tier | OCR(Vision 부분) | AI 보정 | 전처리/라이선스 | 월 합계(추정) |
|------|------------------|---------|-----------------|----------------|
| Tier 0/1 | 9,000건 × $0.0015 ≈ **$13.5** | ~$2 (gemini-flash 기준) | $0(오픈소스) | **≈ $15 + Cloud Run 컴퓨트** |
| Tier 2 | $13.5 | ~$2 | 클라우드 추론/종량(추정 $수십~수백) | **$30~수백** |
| Tier 3 | $13.5 | ~$2 | 연 라이선스/12 (견적 필요) | **라이선스가 지배적** |

> 주의: 위 OCR 단가는 "Vision DOCUMENT_TEXT_DETECTION 직접 호출" 기준이며, 실제는 **Cloud Run 함수가 OCR을 래핑**하므로 Cloud Run 실행 비용(요청·CPU·메모리)이 추가된다. 정확한 단가는 현 Cloud Run 함수 구현/요금을 별도 확인해야 한다(검토사항).

### 8.3 "한 기록당 최대 3페이지"의 비용·운영 영향

- **OCR 호출이 최대 3배**: 한 기록 저장 시 페이지 수만큼 `/api/ocr` 호출 → 비용·쿼터 소모 ×(1~3).
- **레이트리밋(현 15/min)**: 단일 기록 3페이지는 문제없음. 다만 연속 다건 기록 시 한도 근접 가능 → 한도/메시지 재점검.
- **구독/포인트 게이트**: 페이지 단위 과금 정책과 정합 필요(3페이지를 1회로 볼지, 3회로 볼지).
- **캐시**: 동일 이미지 해시 캐시(`ocr_cache`)가 있어 재시도 비용은 일부 흡수.

---

## 9. 도입 전 검토사항 (Risk & Checklist)

| 영역 | 항목 | 리스크 | 완화책 | 담당(에이전트) |
|------|------|--------|--------|----------------|
| 기술 | `getUserMedia` 호환 | iOS Safari 권한·자동재생 제약 | 권한 가이드 + file-input 폴백 | ai / records |
| 기술 | WASM 번들(~8MB) | 초기 로딩 지연 | 스캔 진입 시 **동적 import** | performance |
| 기술 | 저사양 단말 성능 | 발열·프레임 드랍 | 해상도 다운스케일·프레임 스킵 | performance |
| 기술 | 복잡 배경 검출 실패 | 코너 미검출 | 수동 크롭 보조 + 폴백 | records |
| UX | 자동촬영 오작동 | 흐릿/조기 촬영 | 코너 N프레임 안정화 + 수동 셔터 | records |
| UX | 접근성 | 카메라 못 쓰는 사용자 | 항상 앨범 업로드 경로 유지 | records |
| 비용/쿼터 | OCR 호출 ×3 | 비용·한도 증가 | 페이지 과금정책·레이트리밋 재설계 | identity / engagement |
| **법무** | **책 본문 저장·OCR** | **저작권(본문 대량 복제)·개인정보** | **1차 범위를 ≤3p 발췌로 제한**, 약관·고지, Legal 체크리스트 연계 | **legal** |
| 보안 | 업로드 검증 | 악성 파일 | 기존 `validateUploadFile` 재사용·RLS | identity / admin |
| 데이터 | 다중 페이지 모델 | 스키마/RLS 정합 | 옵션 (c)→(b) 단계 확장, Idempotent 마이그레이션 | data |
| 운영 | 실패율 모니터링 | 무음 실패 | 기존 `ocr_logs`·캐시 적중률 대시보드 | monitoring |

> **법무 강조**: 책 본문을 페이지 단위로 대량 저장·텍스트화하면 **저작권 복제권** 이슈가 커진다. 1차 범위를 **발췌·소량(≤3페이지)** 으로 제한하는 것은 UX 결정인 동시에 **법적 리스크 완화 장치**다. "전권 디지털화(대량 스캔)"는 의도적으로 1차 범위에서 제외한다. → `doc/legal/LEGAL_CHECKLIST.md` 연계.

---

## 10. 결론 & 다음 단계

- **권장**: **Phase A(Tier1, ≤3페이지 스캔) 즉시 착수.** 비용 거의 0·낮은 리스크로 vFlat 핵심 UX(테두리 자동 인식·자동 촬영·원근 보정)를 상당 부분 확보하고, OCR 입력 품질을 끌어올린다.
- **검증 후 확대**: Phase A 데이터에서 곡면/손가락이 인식률을 유의미하게 떨어뜨리면 Tier2(클라우드 전처리), 품질이 핵심 KPI가 되면 Tier3(상용 SDK) 무료 트라이얼로 벤치마크 후 ROI 판단.
- **분리**: Tier4(네이티브 전환)는 별도 플랫폼 전략 의제로.

### 즉시 액션 3가지
1. **현 Cloud Run OCR 단가·요금 확인** — 8.2 추정의 Cloud Run 컴퓨트 부분 실측(정확한 페이지당 원가 산정).
2. **jscanify/OpenCV.js PoC** — `BookPageScanner` 프로토타입으로 테두리 검출·자동촬영·원근 크롭의 실제 인식률을 모바일에서 측정.
3. **다중 페이지 데이터 모델 결정** — 7.4의 (c)/(a)로 1차 출시할지, (b) 마이그레이션을 선행할지 확정.

---

## 부록 A. 참고 자료(출처)

- vFlat 공식: https://www.vflat.com/en
- vFlat (Google Play): https://play.google.com/store/apps/details?id=com.voyagerx.scanner
- vFlat 기술(TFLite GPU delegate): https://blog.tensorflow.org/2019/08/how-vflat-used-tflite-gpu-delegate-for-realtime-interference-scan-books.html
- Google Cloud Vision 요금: https://cloud.google.com/vision/pricing
- Scanbot JS Document Scanner: https://scanbot.io/developer/javascript-document-scanner/
- Dynamsoft Document Scanner (JS): https://github.com/Dynamsoft/document-scanner-javascript
- Google ML Kit Document Scanner: https://developers.google.com/ml-kit/vision/doc-scanner
- jscanify(브라우저 문서 스캐너): https://github.com/ColonelParrot/jscanify
- Aspose.OCR Cloud Dewarp: https://tutorials.aspose.cloud/ocr/preprocess-image/dewarp-image/

## 부록 B. 관련 파일 경로(현 코드)

- 캡처 UI: `components/records/record-photo-strip.tsx`
- 업로드: `app/api/upload/route.ts`, `lib/utils/image.ts`, `lib/security/file-validation.ts`
- OCR 요청/처리: `app/api/ocr/route.ts`, `app/api/ocr/process/route.ts`
- OCR 엔진/보정: `lib/api/cloud-run-ocr.ts`, `lib/api/ocr.ts`, `lib/ai/ocr-correction.ts`
- OCR 통계/관리: `app/actions/ai/ocr.ts`, `app/actions/admin/ocr.ts`
- 데이터: `types/note.ts`(Transcription), `transcriptions`·`ocr_logs`·`ocr_usage_stats`·`ocr_cache` 테이블
- 법무: `doc/legal/LEGAL_CHECKLIST.md`

## 부록 C. 용어

- **dewarp(곡면 보정)**: 펼친 책의 휜 면을 평면으로 펴는 처리.
- **deskew(기울기 보정)**: 비스듬한 페이지를 정면으로 펴는 원근 변환.
- **getUserMedia**: 브라우저에서 카메라 라이브 스트림을 받는 Web API(HTTPS 필요).
- **Tier**: 본 문서의 적용 수준 구분(0 현행 ~ 4 네이티브).
