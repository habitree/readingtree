# 기록·시간 통합 고도화 — 구현 스펙 (v2 권장안 확정)

> 작성일: 2026-06-04 · 상위 기획: `doc/update/기록시간_통합기획_2026-06-04.html` (v2)
> 본 문서는 v2 의사결정(DEC-1~8)의 **권장안을 확정**하고 P0~P2 구현 작업을 정의한다.
> 「기록기획 v1.0」(`00-master.md`)의 남은 Phase(5·6·7)를 흡수·확장한다.

---

## 0. 핵심 개념 (확정)

독서를 측정·기록하는 **3축**으로 정의한다 (v2 §3).

| 축 | 질문 | 단위 | 정본 데이터 |
|---|---|---|---|
| ⏱ **독서시간** | 얼마나 오래? | 초·분 | `reading_logs.reading_duration_seconds` · `started_at/ended_at` |
| 📊 **읽기진행률** | 어디까지? | 페이지·% | `user_books.current_page ÷ books.total_pages` |
| 🧭 **여정** | 어떻게 걸어왔나? | 변화 이력·회독 | `user_books.completed_dates[]` + `notes(type=progress)` |

- **독서법 = 읽기(입력) + 쓰기(출력)를 한 흐름으로**. 출력형 기록 = `quote · memo · transcription (+ review 신설)`.
- **기록시간(`created_at`) ≠ 독서시간(`reading_duration_seconds`)** — UI에서 라벨로 구분.

---

## 1. 확정된 의사결정 (권장안 채택)

| ID | 결정 | 채택안 |
|---|---|---|
| **DEC-1** | 통계·스트릭 SSOT | **공용 계산 코어 추출** (`computeReadingMetrics`) — 라이브·스냅샷·캐시 공유 |
| **DEC-2** | 레거시 photo/progress 행 | **보존 + 신규만 차단** (데이터 손실 0) |
| **DEC-4** | 진입점 단일화 | **`/notes/free` 존치 + 구형 시트만 제거** |
| **DEC-5** | 3축 통합 뷰(C8) 시점 | **A3·A5 완료 후** 착수 |
| **DEC-6** | 진행률→여정 편입 기준 | 메모 동반=**항상** · 회독완료=**구간경계** · 단순수정=**일 1점 집약** · 후퇴/정정=**제외** |
| **DEC-7** | 출력(독후감) 전용 항목 | **신설** — `detail_kind='review'` 추가 |
| **DEC-8** | 내기록 독서시간 노출 | **기록마다 배지 먼저(C6)**, 페이지별 관리(C7)는 P2 |

---

## 2. 작업 분해 (P0 → P1 → P2)

### P0 — 개념 확정 + 정합성·기반 (착수)
| 코드 | 작업 | 산출물 | 상태 |
|---|---|---|---|
| **A1** | KST 타임존 헬퍼 통합 | `lib/utils/timezone.ts` + 결산/통계 도메인 6파일 위임 | ✅ 완료(tsc green) |
| **A2** | 시간/Duration 포맷 통합 | `lib/utils/duration.ts` + 4개 호출처 위임 | ✅ 완료(tsc green) |
| **B1** | 레거시 photo/progress 신규 차단 | `createNote` 가드 + 진입 UI 제거 | ⏸ **보류** — 아래 ⚠ 참조 |
| **B3** | 스트릭 SSOT (계산식) | `lib/utils/streak.ts` + `stats.ts`·`compute.ts` 위임 | ✅ 완료(tsc green) |
| **C6** | 내 기록에 독서시간 배지 | `getTimeline` 세션 조인 + `note-card` 배지 | ✅ 완료(tsc green · /notes 200 검증) |

> ✅ **B3 1차 완료 (2026-06-04).** 현재/최대 스트릭 **계산 알고리즘**을 `lib/utils/streak.ts`로 통합,
> `getStreakAndTodayData`(stats)와 `computeCurrentStreak/MaxStreak`(recap)이 동일 함수를 공유 → 두 화면 스트릭 일치.
> **잔여(B3-2, P1):** gamification 원장 `user_points.current_streak`(`points.ts updateStreak`, 증가식)을 이 계산값과 정합화할지 결정 —
> 포인트 적립 로직과 얽혀 별도 증분으로 분리. UI 라벨("현재 연속" vs "이달 최대")은 이미 데이터상 분리돼 있음(`RecapHighlights`).

> ⚠ **B1 보류 사유 (2026-06-04 발견).** `app/actions/notes.ts:224-225`에서 사진 업로드 시
> `upload_type === "photo"` → `noteType = "photo"`로 **여전히 활성 생성**된다. 지금 하드 차단하면
> 사진 노트 업로드가 깨진다. v1.0이 의도한 "카나리 사용 데이터 확인 → 차단" 순서를 따라,
> 사진 경로를 `endReadingSession.image_urls`로 이관(또는 사용 0 확인)한 뒤 차단해야 안전하다.
>
> **C6 범위 정정.** `reading_duration_seconds`는 `reading_logs`에만 존재 → 진행로그(`notes`)·이어읽기 카드에
> 독서시간을 노출하려면 서버 액션 쿼리에 duration을 실어 보내는 **데이터 플러밍**이 선행돼야 한다(순수 UI 추가 아님).
> 책 상세 시간탭은 이미 `formatDuration`으로 노출 중. → C6은 dev 서버 띄워 시각 검증과 함께 별도 증분으로.

### P1 — 구조·어휘 통합
| 코드 | 작업 | 상태 |
|---|---|---|
| **A5** | 3축 공용 타입·어휘 (`types/reading-metrics.ts` · `lib/reading/progress.ts`) | ✅ 완료(tsc) |
| **A3** | `computeReadingMetrics` 순수 코어 + vitest → `compute.ts` 위임 | ✅ 완료(tsc·vitest 6/6·/recap·/stats 200) |
| **B3-2** | 표시 스트릭 단일화 — `getWeeklyProgress`도 `computeCurrentStreak` 위임(홈·통계·결산 일치). DB `current_streak`은 게이미피케이션 미션 전용 유지 | ✅ 완료(tsc) |
| **A4** | RecordSheet 단일 진입점, 구형 `progress-record-sheet` deprecate | ⬜ |
| **B6** | `reapOrphanSessions` Vercel Cron 연결 |
| **B2/B4/B5** | deprecated 함수 정리 · 컬럼 의미 `DATA_MODEL.md` 반영 |
| **DEC-6 구현** | 진행률 저장 시 여정 편입 규칙(일 1점 집약 등) 적용 |

### P2 — 신규 가치
| 코드 | 작업 | 상태 |
|---|---|---|
| **C9** | 출력(`review`) 항목 — 마이그레이션(`notes_detail_kind_check`+review) + 저장 매핑(review→type memo) + RecordSheet detail 옵션 + note-card 라벨 | ✅ 완료(마이그 적용·DB insert 검증·tsc·/notes 200) |
| **C7** | 페이지별 독서 페이스 패널(`reading-pace-panel.tsx`, 페이지당 평균·남은 예상) — 시간탭 통합 | ✅ 완료(tsc) |
| **C8** | 3축 통합 뷰 (책 상세) — A3·A5 후 | ⬜ |
| **C1/C2** | 타이머 목표 UI · 페이스 분석(C7로 일부 노출) | ⬜ |
| **C3/C4** | 캘린더 SSOT · 음악-세션 동기화 | ⬜ |

> 📐 **남은 단계 상세 설계 = `11-next-steps-design.md`** (A5·A3·B3-2·C7·C8·C9·B1 + 후순위, 의존성 순서·SQL·체크리스트 포함).
> 핵심 확정: **C9는 CHECK 제약 `notes_detail_kind_check`(quote/memo/transcription만) 때문에 마이그레이션 필수**,
> **B1은 `note.type` ENUM이라 DB 변경 없이 앱 가드만**(단 `notes.ts:224` 사진 경로 이관 선행).

---

## 3. P0 구현 노트 (본 PR 범위)

### A1 `lib/utils/timezone.ts`
- KST(UTC+9) 단일 출처. 순수 모듈("use server" 없음).
- export: `toKSTDateKey · getKSTComponents · toKSTMidnight · getKSTToday · kstMonthStart · kstMonthEnd · kstHour · getKSTYearMonth · isFutureKSTMonth`.
- 위임 완료(**11파일**): `stats.ts`(헬퍼 4+월경계), `recap/compute.ts`(4), `recap/books-list.ts`, `recap/generate.ts`, `api/cron/generate-monthly-recap`, `stats/page.tsx`, `recap/[yearMonth]/page.tsx`, `home-hero-wrapper`, `tertiary-zone-wrapper`, `recap-month-switcher`, `notes.ts`. 모두 동작 보존(공식 동일).
- **잔여 인라인 KST(데모 한정, 후속):** `sample.ts`·`demo-calendar-data.ts` — 게스트 데모/샘플 데이터이며 자체 streak 계산 포함. 앱 실사용 경로 아니므로 차후 일괄 검토.

### B3 `lib/utils/streak.ts`
- export: `computeCurrentStreak(dateKeys, maxLookbackDays?) · computeMaxStreak(dateKeys)`.
- 위임: `stats.ts::getStreakAndTodayData`(현재 스트릭), `recap/compute.ts`(현재/최대 스트릭). 두 화면 계산식 일치.
- 잔여: `sample.ts`의 샘플 스트릭 계산, gamification `points.ts::updateStreak`(증가식) 정합화는 P1.

### A2 `lib/utils/duration.ts`
- export: `formatDuration(s, {rounding, zeroLabel})` · `formatClock(s)`(MM:SS) · `formatTimeRange(a,b)`.
- 위임: `reading-time-tab.tsx`(formatDuration/formatTimeRange) · `music-mini-player.tsx`·`track-list-sheet.tsx`(formatTime→formatClock) · `lib/recap/text.ts::formatReadingTime`(=`formatDuration(s,{rounding:"round",zeroLabel:"0분"})`로 동작 보존).
- `stamp-card.tsx`의 "N분" 배지는 의미가 다른 별도 포맷이므로 본 PR 미변경(별도 검토).

### C6 내 기록에 독서시간 노출 (DEC-8 1차)
- `getTimeline`(stats.ts) select에 `reading_logs ( reading_duration_seconds )` 임베드 추가(게스트·인증 양 경로). `notes.reading_log_id → reading_logs.id` FK(`notes_reading_log_id_fkey`)로 to-one 조인 → 매핑 시 `reading_duration_seconds` 채움.
- `note-card.tsx` 메타라인에 `formatDuration` 독서시간 배지(⏱) — 세션 연결된 기록만. "읽은 시각(created_at)"과 "읽은 시간(duration)" 구분.
- **런타임 검증:** FK 존재 확인(MCP) · 조인 실값 확인(1건, 1337초) · dev 서버 `/notes` 200(임베드 쿼리 정상). 세션-연결 노트가 늘수록 노출 확대(현재 데이터 희소 — 신규 모델 특성).

### 검증
- `npx tsc --noEmit` (타입), 영향 화면 수동 확인(통계/결산/책 시간탭/음악 플레이어/내 기록).

---

## 4. 비고
- 모든 변경은 **동작 보존(behavior-preserving) 리팩토링** 우선 — 화면 출력 숫자 불변.
- 마이그레이션이 필요한 항목(C9 review, B6 cron)은 별도 PR로 분리.
