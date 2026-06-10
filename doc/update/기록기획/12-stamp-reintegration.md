# 12 — 스탬프 재통합 + 내 기록 통합 뷰 (설계서)

> 작성일: 2026-06-10 · 상위: `00-master.md` · 선행 기획: `stamp-integration-plan.html`(2026-04-30, legacy 기반)
> HTML 기획서: `doc/update/스탬프재통합_기록통합_기획_2026-06-10.html`
> 범위 결정: **스탬프 재통합 중심 + 정리 맵 요약** / legacy 정리 **점진적**(패리티→카나리 ON→제거) / 내 기록 통합 뷰 = **`reading-speed-detail.tsx` 확장**

---

## 0. 왜 (문제 정의)

`stamp-integration-plan.html`(2026-04-30)은 "기록은 항상 남고, 사진을 더하면 스탬프가 된다"는 멘탈 모델을 이미 그렸다. 그러나 그 기획은 **legacy 경로**(`StampCaptureSheet` + `progress.ts::createReadingStamp`/`saveReadingSession`) 위에서 설계됐고, 그 **이후에** 세션모델(`RecordSheet` 3-step + `sessions.ts`)이 Phase 1~5로 도입됐다.

결과: 스탬프를 **새 세션모델 위에서 재통합**하는 작업이 `11-next-steps-design.md` 로드맵(묶음1~5)에 **누락**되어 있다. 본 문서가 그 갭을 메운다.

### 확인된 누락 배선 (근거)
- `RecordSheet`에 **attach(사후 사진 첨부) 모드 없음** — attach는 legacy `StampCaptureSheet` 전용.
- `record-end-step.tsx` 종료 토스트에 "공유"만 있고 **"사진 추가" 진입점 미연결** (`lib/utils/stamp-toast.ts`에 `onAddPhoto` 슬롯은 존재).
- `getRecentRecordsForAttach`(progress.ts) **호출처 0건** — 미배선.
- `reading-time-tab.tsx::openEditSheet`가 legacy `useStampCaptureStore.openAttach`만 호출 (카나리 분기 없음).

---

## 1. 통합 멘탈 모델 — "스탬프는 새 개념이 아니라 세션의 한 상태"

`reading_logs` 한 행이 네 축의 1차 소스(SSOT)다.

| 축 | SSOT | reading_logs와의 관계 |
|---|---|---|
| ⏱ 독서시간 | `reading_duration_seconds` 합 | 세션 직접 속성. pace = `lib/reading/pace.ts` |
| 📊 진행률 | `user_books.current_page` | `endReadingSession`이 `updateBookProgress(end_page)`로 동기화 |
| 🧭 여정 | 시간순 reading_logs 뷰 | end_page 전진 세션 = 여정 점 (DEC-6) |
| 🏅 스탬프 | `image_url IS NOT NULL AND promoted_at IS NOT NULL` 행 | **같은 세션의 사진 승격 상태** (별도 테이블 아님) |

### 단일 흐름
```
startReadingSession → in_progress
  (start_page = max(current_page, 직전 end_page) 자동 승계)
        │
endReadingSession(end_page, memo, image_urls?)
  ├─ 사진 있음 → DB 트리거가 image_url 미러 + promoted_at 즉시 설정 → "스탬프"
  └─ 사진 없음 → 시간·페이지만 저장 + updateBookProgress(진행률 동기화)
        │
[사후 승격] attachStampToLog(logId, {image_urls, start_page?, end_page?, memo?})
  └─ promoted_at 첫 전환 (사진 없이 저장한 세션에 나중에 사진 추가)
        │
[관리] /stamps · /share/stamps/[id] · 내 기록 통합 뷰
  └─ 필터 = image_url≠NULL (정의 불변)
```

**이원화 종식의 의미**: legacy `createReadingStamp`는 스탬프를 "또 다른 행"처럼 만들었다. 신규 모델에서는 **모든 세션이 같은 행이고 사진 첨부 여부만 다르다**. 따라서 "스탬프 재통합" = 모든 경로를 **`endReadingSession`(생성·즉시승격) + `attachStampToLog`(사후승격) 두 경로로 수렴**시키는 것.

---

## 2. 스탬프 재통합 설계 (Phase B — 메인)

### 2.1 종료 시 즉시 승격 — 이미 구현, 정식 경로로 확정
`record-end-step.tsx` → `endReadingSession({ image_urls })` → DB 트리거 승격. 추가 작업 불필요.

### 2.2 RecordSheet에 `attach` 모드 신설
- `hooks/use-record-sheet.ts`: `RecordSheetMode`에 `"attach"` 추가 + `openAttach(logId, options)` 액션. 상태에 `targetLogId`, `attachContext`(book, start_page, end_page) 보관.
- 신규 `components/records/record-attach-step.tsx`: legacy `StampCaptureSheet`(attach 모드) 로직 이식 — 사진/페이지/메모 입력 → 사진 있으면 `attachStampToLog`, 사진 없이 페이지/메모만이면 `updateReadingLogEntry`.
- `components/records/record-sheet.tsx`: `mode === "attach"` 라우팅 추가.

### 2.3 종료 후 "사진 추가" 진입점 배선
`record-end-step.tsx::handleSave`에서 **사진 없이 저장된 경우** 토스트 action에 `{ label: "사진 추가", onClick: () => openAttach(result.sessionId, { book }) }` 연결. 사진 있으면 기존 "공유하기" 유지. (`stamp-toast.ts`의 `onAddPhoto` 슬롯 사용)

### 2.4 reading-time-tab attach 카나리 분기
`components/books/reading-time-tab.tsx::openEditSheet`를 `isRecordV2Enabled()`로 분기: ON → `useRecordSheetStore.openAttach(logId, ...)`, OFF → 기존 `useStampCaptureStore.openAttach` 유지.

### 2.5 `getRecentRecordsForAttach` 활성화
미배선 액션을 내 기록 통합 뷰·책 시간탭의 "최근 기록에 사진 추가" 진입에 연결.

### 2.6 legacy 정리 — 카나리 ON 검증 후 (Phase C)
`lazy-overlays.tsx`에서 `StampCaptureSheet` mount 제거 → `hooks/use-stamp-capture.ts`/`components/stamps/stamp-capture-sheet.tsx` 삭제 → `createReadingStamp`/`saveReadingSession`은 `endReadingSession` 위임 thin wrapper 또는 제거. **(스탬프 조회/공유 컴포넌트 — `stamp-collection-grid`, `stamp-share-*`, `/stamps`, `/share/stamps/[id]` — 는 모두 유지)**

---

## 3. 내 기록 통합 뷰 (Phase D — 요구 7번)

`components/profile/reading-speed-detail.tsx`의 paced/timeOnly 관리 UI를 확장해 **시간·페이지·스탬프(사진)·메모를 한 곳에서** 관리.

- **데이터**: `getPaceSessions`(progress.ts) select에 `memo, image_url, image_urls, promoted_at, status` 추가. `types/progress.ts::PaceSession` 확장. paced/timeOnly 분류는 유지.
- **UI**:
  - (a) 세션 카드에 사진 썸네일 / 스탬프 배지. 없으면 "📷 사진 추가" 칩 → `openAttach(logId)`.
  - (b) 메모 인라인 편집 → `updateReadingLogEntry({ memo })` (기존 지원).
  - (c) timeOnly → paced "페이지 추가" (기존 기능 유지).
  - (d) `[전체 / 시간만 / 스탬프]` 세그먼트 필터.
  - Lightbox: `components/stamps/photo-gallery.tsx` 재사용.
- **분리 옵션**: 속도 분석(가이드/이상치) 책임이 비대해지면 통합 관리 뷰만 별도 컴포넌트로 추출 가능. 1차는 확장으로 시작.

---

## 4. 정리 맵 — "묶어서 정리" (기존 로드맵과 정합)

| 정리 항목 | 기존 로드맵 매핑 | 본 기획 처리 |
|---|---|---|
| 스탬프 재통합 (attach / 종료후 진입점 / 통합뷰) | **로드맵에 없음 (신규 갭)** | 본 기획의 메인 — Phase B/D |
| 세션모델 단일화 · 카나리 ON · legacy 제거 | Phase 5~6, A4 | 점진적 — 패리티 후 ON |
| 시간통계 3함수 분산 → `lib/reading/time-stats.ts` | (신규 정리) | 저위험 선행 후보 (Phase A) |
| 진행률 % 계산 3중복 → `computeProgressPercent` | **A5** | 기존 묶음1 참조 (중복 회피) |
| 집계 코어 `computeReadingMetrics` | **A3** | 기존 묶음1 참조 |
| notes 타입 축소 (photo 0건 차단, progress 이관) | **B1** | 기존 로드맵 참조 — 사진경로 이관 후 |
| 캘린더 출처 이중화 (notes vs reading_logs) | **C3** | 기존 로드맵 참조 |
| 3축 통합 뷰 / 페이지별 페이스 | **C8 / C7** | 기존 로드맵 참조 |

> **메시지**: 이번 기획의 신규 기여는 **"스탬프 재통합 + 내 기록 통합 뷰"**이며, 나머지 정리는 `11-next-steps-design.md`의 묶음1~5에 이미 설계돼 있어 **중복 작성하지 않고 연결만 한다.**

---

## 5. 단계별 실행 계획 (점진적)

| Phase | 내용 | 변경 파일 | 마이그 | 리스크 |
|---|---|---|---|---|
| **A** | 시간통계 통합 (선행, 저위험) | 신규 `lib/reading/time-stats.ts` + `progress.ts` re-export 위임 | 없음 | 0 (순수 이전) |
| **B** ★ | 스탬프 재통합 | `use-record-sheet.ts`, 신규 `record-attach-step.tsx`, `record-sheet.tsx`, `record-end-step.tsx`, `reading-time-tab.tsx` | 없음 | attach 페이지/메모/promoted_at 1회성 회귀 |
| **C** | 단일화 · 카나리 ON | `lib/feature-flags.ts` ON → 분기 5곳 고정 → `lazy-overlays.tsx`/`use-stamp-capture`/`stamp-capture-sheet` 제거, legacy 액션 wrapper화 | (선택) orphan close + B6 cron | 진입점 회귀 → 1주 모니터링 |
| **D** | 내 기록 통합 뷰 | `reading-speed-detail.tsx`, `getPaceSessions`/`PaceSession` 확장 | 없음 | 표시 회귀 |

- **카나리 ON 시점**: Phase B로 신규 모델이 legacy 패리티(생성·즉시승격·사후첨부) 달성한 뒤 Phase C에서 ON.
- **legacy 제거 게이트**: ON 검증(신규 photo/progress 0건, in_progress orphan 0, 차단 에러 0 — `phase-6-cleanup.md` SQL) 통과 후.
- **마이그레이션**: 본 기획 핵심 범위는 **신규 마이그레이션 불필요**(`promoted_at` 이미 존재). C9(review)·notes 정리는 기존 로드맵의 마이그레이션 항목.

---

## 6. 결정 정합성 (기존 ADR/DEC와 충돌 없음)

- **D2** (in_progress 1개): attach는 완료 세션 대상이라 무관.
- **D4** (포인트 종료 1회): `attachStampToLog`는 **추가 적립 없음** — 불변 유지.
- **DEC-6** (여정 편입 기준): 스탬프 승격은 여정 점 판정(end_page 전진)과 독립 — 충돌 없음.
- 스탬프 정의(`image_url≠NULL AND promoted_at≠NULL`) `00-master.md`와 동일하게 유지.

---

## 7. 체크리스트 (구현 현황 — 2026-06-10)

### Phase A ✅
- [x] `lib/reading/time-stats.ts::summarizeReadingTime`(순수) 신설 — DB 접근은 액션 유지(레이어 규칙)
- [x] `getUserReadingTimeStats`·`getReadingTimeStats`(progress.ts) 합산 로직 위임(중복 제거, 동작 보존)
- [x] `tsc` 통과

### Phase B ✅
- [x] `use-record-sheet.ts` `"attach"` 모드 + `openAttach(logId)` + `targetLogId`
- [x] `record-attach-step.tsx` 신설 (사진 → `attachStampToLog` / 페이지·메모 → `updateReadingLogEntry`)
- [x] `record-sheet.tsx` attach 라우팅 (`key={targetLogId}` 재마운트)
- [x] `record-end-step.tsx` 종료 토스트 — 사진 없이 저장 시 "사진 추가"→openAttach
- [x] `reading-time-tab.tsx` attach 카나리 분기 (ON→RecordSheet, OFF→legacy)
- [ ] e2e: 종료(사진없음) → 사진추가 → 승격 확인 (실기기 수동 검증 권장)

### Phase C ◑ (기본 ON 전환 완료, legacy 제거는 검증 게이트 이후)
- [x] `feature-flags.ts` 기본값 ON 전환 + `NEXT_PUBLIC_RECORD_V2=0` 킬 스위치 보존
- [ ] 분기 5곳 1주 모니터링 + `phase-6-cleanup.md` 검증 SQL 통과 **(운영 게이트)**
- [ ] `lazy-overlays.tsx` StampCaptureSheet 제거 · legacy 시트/훅/액션 정리 **(게이트 통과 후 별도 PR)**

### Phase D ✅
- [x] `getPaceSessions`/`PaceSession`에 `memo·image_url·image_urls·promoted_at` 필드 확장
- [x] `reading-speed-detail.tsx` 사진 썸네일·스탬프 배지·"사진 추가" 칩(→openAttach)·`[전체/시간만/스탬프]` 필터·메모 인라인 편집·`Lightbox` 재사용
- [x] `attachStampToLog`에 `/profile/reading-speed` revalidate 추가
- [ ] dev `/profile/reading-speed` 실기기 수동 확인

---

> **구현 완료(2026-06-10):** Phase A·B·D 전체 + Phase C 기본 ON 전환. legacy 물리 삭제만 ON 1주 검증 게이트 이후로 보류(점진 방침). 검증: `tsc` ✅ · ESLint ✅. 로그: `doc/log/2026-06.md` 2026-06-10 엔트리.
