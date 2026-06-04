# 기록·시간 고도화 — 다음 단계 설계서 (A5·A3·B3-2·C7·C8·C9·B1 …)

> 작성일: 2026-06-04 · 상위: `10-implementation-spec.md` · 기획서: `기록시간_통합기획_2026-06-04.html`(v2)
> 완료분(커밋): **A1**(KST 11파일)·**A2**(duration)·**B3**(streak 계산식)·**C6**(내기록 독서시간).
> 본 문서는 **남은 로드맵 전체**를 의존성 순서로 설계한다. 각 항목 = 목표·현황(근거)·설계·리스크·검증·체크리스트.

## 실행 순서 (의존성 그래프)

```
A5(어휘/타입) ─┬─▶ A3(집계 코어) ─┬─▶ B3-2(스트릭 원장 정합)
              │                  └─▶ C8(3축 통합 뷰)
C9(출력 review·마이그레이션) ── 독립
C7(페이지별 시간) ── A2 위
B1(레거시 photo 차단) ── 사진경로 이관 후
A4(진입점 단일화) · B6(orphan cron) · C1/C2(타이머·페이스) · C3/C4(캘린더·음악) ── 독립/후순위
```

권장 착수 묶음: **묶음1** A5+A3+B3-2(정합성 핵심) → **묶음2** C9+C7(독서법·시간 가치) → **묶음3** C8(3축 통합) → **묶음4** B1+A4+B6(정리) → **묶음5** C1~C4(고도화).

---

## A5 — 3축 공용 어휘·타입 (P1, 공수 M)

### 목표
독서시간/읽기진행률/여정/출력을 코드·UI에서 **한 언어**로 묶어, A3 코어와 C8 뷰의 토대를 만든다.

### 현황 (근거)
- 타입이 분산: `types/progress.ts`(ReadingLog), `types/note.ts`(Note/DetailKind), `recap/types.ts`(RecapStats). "진행률"이 페이지인지 %인지 화면마다 제각각(`reading-progress.tsx:96` % 계산 vs 카드 페이지 표시).
- 3축을 하나로 묶는 공용 타입 없음.

### 설계
- 신설 `types/reading-metrics.ts`:
  ```ts
  /** ⏱ 독서시간 축 */
  export interface ReadingTimeMetrics { totalSeconds: number; sessionCount: number; avgSeconds: number; }
  /** 📊 읽기진행률 축 */
  export interface ReadingProgressMetrics { currentPage: number | null; totalPages: number | null; percent: number | null; }
  /** 🧭 여정 축 (한 책 또는 기간) */
  export interface ReadingJourneyPoint { dateKey: string; page: number | null; kind: "progress" | "completed" | "session"; note?: string | null; }
  /** 기간 집계 공통 */
  export interface ReadingMetrics {
    range: { startISO: string; endISO: string };
    notes: number; notesByKind: Record<string, number>;
    time: ReadingTimeMetrics; pages: number; completedBooks: number;
    activeDays: number; currentStreak: number; maxStreak: number;
  }
  ```
- `lib/reading/progress.ts` 신설 — `computeProgressPercent(currentPage, totalPages)` 단일화(현재 3곳 중복: `reading-progress.tsx:96`, `continue-reading-card`, `books/reading.ts:947`).

### 리스크/검증
- 순수 타입·함수 추가 → 리스크 0. `tsc`. 기존 3곳을 `computeProgressPercent`로 위임(동작 보존, A2 패턴).

### 체크리스트
- [ ] `types/reading-metrics.ts` 신설
- [ ] `lib/reading/progress.ts` + 진행률 3곳 위임
- [ ] `tsc` 통과

---

## A3 — 집계 코어 `computeReadingMetrics` (P1, 공수 L)

### 목표
라이브(`stats.ts`)와 스냅샷(`recap/compute.ts`)이 **같은 순수 함수**로 메트릭을 산출 → 화면 간 숫자 일치(DEC-1 채택안).

### 현황 (근거)
- `stats.ts` 집계 함수 10개: `getReadingStats:222 · getGoalProgress:553 · getDailyRecordsForCalendar:660 · getDailyRecordsByType:706 · getWeeklyProgress:770 · getMonthlyStats:905 · getRecentProgressLogs:996 · getMonthlyBookActivities:1099 · getCurrentBookProgress:1208 · getStreakAndTodayData:1257`.
- `recap/compute.ts::computeRecapForUser` → `RecapStats`(`recap/types.ts:35`): totalNotes·notesByType·totalReadingSeconds·totalPages·sessionCount·completedBooks·booksTouched·activeDays·maxStreakInMonth·currentStreak·vsPrev·goal.
- **중복 집계**: `getMonthlyStats`(라이브 월간)와 `computeRecapForUser`(스냅샷 월간)가 같은 월 범위에서 notes/logs/완독을 각자 합산.

### 설계
- 신설 `lib/reading/metrics.ts` — **순수**(DB 접근 없음), 이미 fetch한 행을 받아 집계:
  ```ts
  interface MetricsInput {
    notes: { created_at: string; type: string; page_number: number | null }[];
    logs: { reading_duration_seconds: number | null; start_page: number | null; end_page: number | null; started_at: string | null }[];
    completed: { completed_at: string }[];
    range: { start: Date; end: Date };
  }
  export function computeReadingMetrics(input: MetricsInput): ReadingMetrics  // A5 타입 사용
  ```
  - streak는 이미 통합된 `lib/utils/streak.ts` 재사용, KST 키는 `lib/utils/timezone.ts` 재사용.
- 위임(점진, 동작 보존):
  1. `recap/compute.ts`: 행 fetch 후 `computeReadingMetrics` 호출 → `RecapStats` 매핑(vsPrev·goal·notesByType·timeBuckets는 compute.ts가 코어 결과 위에 포장).
  2. `stats.ts::getMonthlyStats`: 동일 코어 호출로 교체.
- **하지 않는 것**: getWeeklyProgress·getDailyRecords* 등 표현 특화 함수는 1차 범위 제외(코어가 제공하는 메트릭만 우선 통일).

### 리스크/검증
- **위험: 행 shape·집계 미세 차이로 숫자 변동.** 완화 — 코어를 먼저 작성하고 **기존 함수 결과와 동일 입력으로 비교 테스트**(vitest) 후 교체. 단계마다 `tsc` + 결산/통계 화면 수동 확인(dev 서버).
- 게스트/샘플 경로(admin client) 동일 코어 사용 가능(순수 함수라 클라이언트 무관).

### 체크리스트
- [ ] `lib/reading/metrics.ts` 순수 코어 + vitest(기존 결과 동등성)
- [ ] `recap/compute.ts` 코어 위임
- [ ] `stats.ts::getMonthlyStats` 코어 위임
- [ ] dev 서버 `/stats`·`/recap` 숫자 동일 확인

---

## B3-2 — gamification 스트릭 원장 정합 (P1, 공수 M)

### 목표
계산식 스트릭(B3 완료)과 DB 원장 `user_points.current_streak`(증가식)의 **불일치 해소**.

### 현황 (근거)
- `points.ts::updateStreak:285` — 하루 1회 `current_streak += 1`(연속 끊기면 1로 리셋) 증가식. 포인트 적립과 얽힘.
- 표시는 계산식(`getStreakAndTodayData`)·원장(`current_streak`)이 혼재 → 달 경계·미기록일에서 어긋남.

### 설계 (택1 — DEC-1 코어 채택과 일관)
- **권장**: 표시 SSOT = **계산식**(A3 코어/streak util). `current_streak`은 게이미피케이션 보상 트리거 전용으로 한정하고, **표시에는 쓰지 않음**. 모든 표시면을 `getStreakAndTodayData`(계산식)로 통일.
- 보조: `updateStreak`가 계산식 결과를 검증·동기화(드리프트 시 보정)하되 포인트 적립 규칙은 불변(D4).

### 리스크/검증
- **위험: 포인트 적립 로직 변경 시 보상 회귀.** → 적립 규칙은 건드리지 않고 "표시 출처만 계산식으로" 최소 변경. 홈·통계·결산·포인트 4화면 스트릭 일치 확인.

### 체크리스트
- [ ] 표시면 스트릭 출처를 계산식으로 통일
- [ ] `updateStreak` 적립 규칙 불변 확인(회귀 테스트)
- [ ] 4화면 일치 수동 확인

---

## C7 — 페이지별(구간별) 독서시간 관리 (P2, 공수 M)

### 목표
"독서시간 페이지 별도 관리" — 세션의 `start_page~end_page`와 시간을 묶어 **구간별 페이스**를 본다(시간×진행률 결합).

### 현황 (근거)
- `reading_logs`에 `start_page·end_page·reading_duration_seconds·pace_seconds_per_page`(STORED) 보유. `pace_seconds_per_page` UI 미노출.
- 책 시간탭(`reading-time-tab.tsx`)은 세션 목록만, 구간×페이스 분석 없음.

### 설계
- 신설 컴포넌트 `components/books/reading-pace-panel.tsx` — 책의 reading_logs를 구간순 정렬, 각 구간 "p.A→B · N분 · 페이지당 M초", 합계/평균 페이스, 남은 페이지·예상 완독일(현재 페이스 기반).
- 데이터: 기존 `getReadingTimeLogs`(progress.ts:528) 재사용 + `pace_seconds_per_page` 노출. `formatDuration` 재사용(A2).
- 진입: 책 상세 시간탭 하단 또는 C8 통합 뷰 내 카드.

### 리스크/검증
- 읽기 전용·기존 데이터 활용 → 저위험. `tsc` + 책 상세 dev 확인. 페이지 미입력 세션은 pace NULL → "—" 처리.

### 체크리스트
- [ ] `reading-pace-panel.tsx`
- [ ] 시간탭/통합뷰 진입 연결
- [ ] NULL pace 처리·dev 확인

---

## C8 — 3축 통합 뷰 (P2, 공수 L · DEC-5: A3·A5 후)

### 목표
"3가지 구분 비교 및 정리"를 UI로 — ⏱시간·📊진행률·🧭여정을 책 상세 한 화면에서 비교.

### 현황 (근거)
- 3축이 별 탭/컴포넌트로 분리: `reading-time-tab` / `reading-progress.tsx` / `reading-journey.tsx`.

### 설계
- 신설 `components/books/reading-overview-panel.tsx` — 상단 3축 요약 스트립:
  - ⏱ 총 N시간 M분 · K세션(`ReadingTimeMetrics`)
  - 📊 진행률 바 + p.cur/total · %(`computeProgressPercent`)
  - 🧭 여정 미니 타임라인(회독·최근 진행 점, `reading-journey` 데이터 축약)
  - + C7 페이스 카드(선택)
- A5 타입/A3 코어 위에 구성 → 숫자 정합 보장. 기존 탭은 상세로 유지(요약→상세 드릴다운).

### 리스크/검증
- A3·A5 선행 필수(미선행 시 숫자 분기). dev 서버 책 상세 비교 + Playwright 스냅샷.

### 체크리스트
- [ ] A3·A5 완료 확인
- [ ] `reading-overview-panel.tsx` + 책 상세 통합
- [ ] 3축 숫자 정합·시각 검증

---

## C9 — 출력(독후감·리뷰) 전용 항목 `review` (P2, 공수 M · 마이그레이션 동반)

### 목표
독서법의 "출력" — 긴 산출물(독후감/리뷰/요약)을 quote/memo와 분리된 항목으로(DEC-7 신설 채택).

### 현황 (근거 — 중요)
- `DetailKind = "quote"|"memo"|"transcription"`(`types/note.ts:16`).
- **DB CHECK 제약 존재**: `notes_detail_kind_check` = `detail_kind IS NULL OR detail_kind IN ('quote','memo','transcription')`.
  → `'review'` 추가는 **마이그레이션 필수**(제약 교체).
- `notes.type`은 ENUM `note_type`(앱·DB) — review를 type이 아닌 **detail_kind 확장**으로 추가(상세기록 출력 분류).

### 설계
1. **마이그레이션** (idempotent) — `doc/database/migration-YYYYMMDDHHmm__notes__add_detail_kind_review.sql`:
   ```sql
   ALTER TABLE public.notes DROP CONSTRAINT IF EXISTS notes_detail_kind_check;
   ALTER TABLE public.notes ADD CONSTRAINT notes_detail_kind_check
     CHECK (detail_kind IS NULL OR detail_kind IN ('quote','memo','transcription','review'));
   ```
   - RLS 변경 없음(컬럼 추가 아님). 적용은 프로덕션 수동(기존 결산 마이그 패턴) 또는 MCP `apply_migration`.
2. **타입**: `DetailKind`에 `"review"` 추가(`types/note.ts`). `AddDetailInput.detail_kind` 자동 포함.
3. **저장**: `addNoteToSession`(sessions.ts)·`createNote` 경로가 detail_kind='review' 허용. 포인트: 신규 `note_review`(또는 기존 note_memo 재사용 — DEC 후속).
4. **UI**: RecordSheet detail-step에 "독후감/리뷰" 옵션 추가. 노트 카드/라벨 `getNoteTypeLabel`·아이콘 매핑.
5. **결산 반영(선택)**: `RecapNotesByType`에 review 카운트 추가는 후속(스냅샷 하위호환 주의).

### 리스크/검증
- **위험: 마이그레이션 미적용 상태로 코드 배포 시 review 저장 실패(CHECK 위반).** → 마이그 선적용 후 코드 배포 순서 엄수.
- `tsc` + 마이그레이션 dry-run(MCP) + RecordSheet에서 review 작성→조회 dev 확인.

### 체크리스트
- [ ] 마이그레이션 작성·적용(선)
- [ ] `DetailKind` review 추가
- [ ] 저장 경로·포인트 정책
- [ ] RecordSheet detail UI + 라벨/아이콘
- [ ] dev 작성→조회 검증

---

## B1 — 레거시 photo/progress 신규 차단 (P0였으나 보류 해제 조건부)

### 현황 (근거)
- `notes.type`은 ENUM이라 DB 변경 불필요 — **앱 레벨 가드**만.
- `notes.ts:224` 사진 업로드가 아직 `upload_type==="photo"→type="photo"` **활성 생성** → 선차단 시 업로드 깨짐.

### 설계 (순서)
1. 사진 업로드 경로를 세션 모델(`endReadingSession.image_urls`/스탬프)로 이관하거나, 카나리 데이터로 신규 photo 사용 0 확인.
2. 이관 후 `createNote`에서 `type IN (photo, progress)` **신규 생성 차단**(throw), 진입 UI 제거. 기존 행 보존(DEC-2).

### 체크리스트
- [ ] 사진 업로드 경로 이관/확인
- [ ] `createNote` 가드 throw 전환
- [ ] 진입 UI 제거 · 기존 행 보존 확인

---

## 후순위 (P1~P2, 본 문서는 개요만)

- **A4 진입점 단일화**: RecordSheet 단일, 구형 `progress-record-sheet` deprecate, `/notes/free` 존치(DEC-4). 공수 M.
- **B6 orphan cron**: `reapOrphanSessions`(12h) Vercel Cron 연결(결산 cron 패턴). 공수 S.
- **C1 타이머 UI**: start-step 목표시간 프리셋(15/30/45/60). 공수 M.
- **C2 페이스 분석**: C7과 통합(`pace_seconds_per_page` 노출). 공수 S(켜기).
- **C3 캘린더 SSOT**: `activity-calendar`+`monthly-book-calendar` 공용 일별 집계(A3) 위 통합. 공수 M.
- **C4 음악-세션 동기화**: 세션 시작=재생/종료=정지, 결산 "함께 들은 음악". 공수 M.
- **B2/B4/B5**: deprecated 함수 제거 · page/timestamp 의미 `DATA_MODEL.md` 반영. 공수 S.

---

## 부록 — 결정 반영 요약

| DEC | 채택 | 본 문서 반영 |
|---|---|---|
| DEC-1 | 공용 코어 | A3·B3-2 |
| DEC-2 | photo 보존+신규차단 | B1 |
| DEC-4 | /notes/free 존치 | A4 |
| DEC-5 | C8은 A3·A5 후 | C8 순서 |
| DEC-6 | 여정 편입 기준(메모=항상/일1점/회독경계) | 별도 구현 항목(진행률 저장부) — A3 후속 |
| DEC-7 | review 신설 | C9 |
| DEC-8 | 배지 먼저(C6) | C6 완료, C7는 P2 |

> 다음 실행: **묶음1(A5→A3→B3-2)** 부터 코드 착수 권장. 각 항목 체크리스트 완료 시 `10-implementation-spec.md` 상태표·`doc/log/2026-06.md` 갱신.
