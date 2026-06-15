# 13 — 통합 기록 피드 + 단일 편집 (설계서)

> 작성일: 2026-06-15 · 상위: `00-master.md` · 선행: `11-next-steps-design.md`(C8 3축 통합 뷰), `12-stamp-reintegration.md`(내 기록 통합 뷰)
> 범위 결정(사용자 확정): **표시·편집만 통합(읽기 레이어, 마이그 0)** / 카드 = **날짜·책 그룹 + 개별 카드** / 통합 위치 = **`/notes` 전체 탭 승격** / 본 라운드 산출물 = **본 문서(코드 변경 없음)**

---

## 0. 왜 (문제 정의)

세션모델(`12-stamp-reintegration.md`)과 3축 모델(`기록시간_통합기획_2026-06-04.html`)로 **데이터·생성 경로**는 상당히 통합됐다. 그러나 사용자가 실사용 중 보고한 불편은 **표시·편집 레이어**에 남아 있다:

> "독서기록에서 입력한 기록과 진행율 수정에서 간단히 적은 기록의 맥락은 같은데, 나눠져서 관리·정리된다. 입력 루트는 나눠져도 되지만 **모이는 곳은 한 곳에서 같이 보이고**, 시간만 기록한 뒤 나중에 다시 입력하는 것도 **한 곳에서 편집**되게 해달라."

### 근본 원인 — 두 평행 세계가 표시·편집에서 안 합쳐짐

```
┌─ World A · notes 테이블 ────────────────┐   ┌─ World B · reading_logs 테이블 ─────────┐
│ quote / photo / memo / transcription    │   │ 시간세션 / 스탬프 (단일 행)             │
│ progress (진행율 슬라이더 메모)          │   │ start/end_page · duration · image_urls  │
│                                          │   │ memo · bookmark · promoted_at · status  │
│ 입력: reading-progress.tsx              │   │ 입력: start/endReadingSession           │
│       ::handleSaveWithMemo (L174~)      │   │       attachStampToLog                   │
│       → updateBookProgress              │   │       updateReadingLogEntry              │
│       + createNote({type:'progress'})   │   │                                          │
│                                          │   │                                          │
│ 표시: /notes ("내 기록")                │   │ 표시(흩어짐):                            │
│   searchNotes (search.ts L40~)          │   │   · 책 상세 시간탭 reading-time-tab      │
│   = notes 테이블만 조회                 │   │   · /profile/reading-speed              │
│   탭: all/quote/memo/photo/progress…    │   │   · /stamps                              │
└──────────────────────────────────────────┘   └──────────────────────────────────────────┘
                    │                                              │
                    └──── 교차점은 단 하나 ────────────────────────┘
        searchNotes는 reading_logs를 "note의 하위관계"로만 조인(시간 배지 C6, L121·L221).
        → 독립 시간세션/스탬프(연결 note 없는 reading_logs)는 /notes에 전혀 안 나온다.
```

**증상 요약**
1. `/notes`("내 기록")는 이름과 달리 **`notes` 테이블 기록만** 모은다. 시간세션·스탬프는 빠진다.
2. 진행율 메모(`notes.type='progress'`)와 시간세션(`reading_logs`)은 **같은 맥락**(이 책을 읽고 여기까지 왔다)인데 **다른 테이블·다른 화면**.
3. 시간세션/스탬프는 책 시간탭·reading-speed·stamps **세 곳**에 흩어져, "내가 입력한 게 이곳저곳 나눠진다"는 인식을 만든다.

### 기존 기획과의 연계
- `11-next-steps-design.md`의 **C8(3축 통합 뷰)**·**C3(캘린더 출처 이중화)** 가 미완으로 남아 있다. 본 문서는 그 "표시 통합" 책임을 **`/notes` 한 곳**으로 흡수한다.
- `12-stamp-reintegration.md`의 멘탈 모델("기록은 한 가지, 사진을 더하면 스탬프")을 표시 레이어까지 확장한다.

---

## 1. 목표 · 비범위

### 목표
- **하나의 피드**: 모든 입력 경로(시간세션 · 진행율 메모 · 스탬프 · 자유 상세)가 `/notes` 한 곳에 시간순으로 모인다.
- **하나의 편집**: 피드의 어떤 카드든 탭하면 **같은 시트**에서 시간·페이지·메모·사진을 편집/추가한다. "시간만 기록 → 나중에 페이지·메모 추가"가 한 곳에서 완결된다.
- **하나의 시각 언어**: 종류는 작은 배지로만 구분하고 카드 골격은 동일 → "별도 기록"이라는 인식 제거.
- **무마이그·저위험**: 저장 구조는 그대로 두고 **읽기 레이어에서만 머지**. 기존 컴포넌트·액션 재사용, 신규 마이그레이션 0.

### 비범위 (Non-goals · 명시적 보류)
| 보류 항목 | 이유 | 향후 게이트 |
|---|---|---|
| **데이터 모델 완전 단일화** (progress 메모를 `reading_logs`로 백필) | DEC-6(여정 1점 집약)·포인트·notes progress 탭 회귀 위험 큼 | `11-next-steps-design.md` B1("progress 이관")와 묶어 별도 검증 게이트 |
| **그룹 카드 병합** (같은 날·책의 시간+진행+사진을 1카드로) | 한 카드에 여러 원본이 섞여 **편집 타깃이 모호** → "한 곳에서 편집" 요구와 충돌 | 별도 카드+그룹 헤더 운영 후 2차 검토 |
| 책 시간탭/reading-speed/stamps **물리 제거** | 스코프·도메인 전문 렌즈로서 유효 | 표시 SSOT 안정화 후 중복 항목만 정리 |

---

## 2. 확정 결정 (D1~D4)

| # | 결정 | 내용 |
|---|---|---|
| **D1** | 통합 깊이 = **표시·편집만** | 저장 구조 유지. `notes`+`reading_logs`를 읽기 시 머지하고, 편집은 단일 시트로 라우팅. 마이그 0. |
| **D2** | 카드 = **날짜·책 그룹 + 개별 카드** | "오늘 · 책제목" 헤더 아래 시간/진행/사진을 각각 개별 카드로 나열. 카드 탭 = 해당 기록 편집. |
| **D3** | 통합 위치 = **`/notes` "전체" 탭 승격** | 신규 페이지 아님. 기존 헤더/탭/검색 UI 재사용. 전문 탭(quote/memo/…)·검색은 기존 `searchNotes` 유지. |
| **D4** | 본 라운드 산출물 = **본 문서** | 코드 변경은 본 문서 승인 후 별도 라운드. |

---

## 3. 데이터 표현 설계 (읽기 레이어)

### 3.1 통합 표현 타입 — `UnifiedRecord`
신규 `types/unified-record.ts`. 두 테이블의 행을 표시·편집용 단일 형태로 정규화한다.

```ts
type RecordSource = "reading_log" | "note";

interface UnifiedRecord {
  source: RecordSource;
  sourceId: string;              // 원본 PK (reading_logs.id | notes.id)
  userBookId: string | null;     // 자유 기록(책 없음) 허용 → null 가능
  book?: { title; author; coverImageUrl; totalPages } | null;
  createdAt: string;             // 정렬 키 (keyset cursor)
  kstDateKey: string;            // 그룹핑용 KST yyyy-mm-dd (lib/utils/date 재사용)

  // 적응형 슬롯 — "있는 것만" 표시 (요구 4의 핵심)
  durationSeconds?: number | null;
  startPage?: number | null;
  endPage?: number | null;
  pageNumber?: string | null;    // progress note (TEXT, 비숫자 허용)
  memo?: string | null;
  imageUrls?: string[];
  bookmarkText?: string | null;
  bookmarkPage?: number | null;

  // 파생 배지 (정의 불변 — 00-master.md와 동일)
  isStamp: boolean;              // image_url≠NULL && promoted_at≠NULL
  isTimeOnly: boolean;          // duration 있고 start/end_page 없음
  kind: "time" | "progress" | "stamp" | "detail";

  // 단일 편집 라우팅 (4장)
  editTarget:
    | { kind: "reading_log"; logId: string }
    | { kind: "note"; noteId: string; detailKind: NoteType };
}
```

### 3.2 순수 정규화 — `lib/reading/unified.ts`
DB 접근 금지(레이어 규칙). `pace.ts`·`time-stats.ts`와 동일 위치.
- `readingLogToUnified(row)` / `noteToUnified(row)`
- `groupUnifiedByDateBook(records)` — `reading-time-tab.tsx::groupByDate`(오늘/어제 라벨 로직)를 재사용/이전
- `mergeAndSort(notes[], logs[], sort)` — 시간순 병합 + 중복 제거

### 3.3 중복 제거 규칙 (이중 표시 방지) — **핵심**
상세기록(`addNoteToSession`)은 `notes.reading_log_id` FK로 INSERT된다. 따라서 한 세션이 **reading_log(시간) + note(상세)** 두 출처를 가질 수 있다.

> **규칙:** `notes.reading_log_id != null` 인 note는 **세션 카드의 하위로 접고**, `reading_log`를 1차 카드로 표시한다. 피드 쿼리의 notes 측은 **`reading_log_id IS NULL`(자유 상세) + `type='progress'`** 만 1차 카드로 가져온다.
>
> 결과: 한 세션 = 카드 1개. 진행율 메모(progress)는 reading_log와 별개 입력이므로 같은 날·책 그룹에 **나란히** 표시(요구 1·2 충족).

---

## 4. 단계별 구현 계획 (Phase 0~6)

> 모두 **신규 마이그레이션 불필요**. 기존 컬럼·트리거(`promoted_at`, `image_urls` 동기화) 재사용.

### Phase 0 — 통합 타입 + 순수 정규화 (무위험 선행)
| 구분 | 파일 | 역할 |
|---|---|---|
| 신규 | `types/unified-record.ts` | `UnifiedRecord` 타입 (3.1) |
| 신규 | `lib/reading/unified.ts` | `readingLogToUnified`/`noteToUnified`/`groupUnifiedByDateBook`/`mergeAndSort` + 중복 제거(3.3) |

### Phase 1 — 통합 피드 server action
| 구분 | 파일 | 역할 |
|---|---|---|
| 신규 | `app/actions/records.ts` | `getUnifiedRecords({ bookId?, startDate?, endDate?, cursor?, limit?, sort?, kinds? })` |

- **병렬 2쿼리**
  1. `reading_logs` — owner + 정상 status(`abandoned`/`in_progress` 제외) + book join. `getReadingStamps`·`getPaceSessions`(`progress.ts`)의 select·cursor 패턴 재사용.
  2. `notes` — owner + book/날짜 필터(`searchNotes` 패턴) + **`reading_log_id IS NULL`** & **`type='progress'`** 만. books/transcriptions join.
- `mergeAndSort` → **created_at keyset(cursor) 페이지네이션**. 각 테이블 `limit+1` 조회 후 머지·절단 → `nextCursor`. **offset 금지**(머지에서 부정확).
- `searchNotes`는 **확장하지 않음** — notes-only 계약(offset·검색·정렬) 오염 회피. 신규 액션으로 분리.
- 재사용: `getCurrentUser`, `createServerSupabaseClient`, `sanitizeError*`.

### Phase 2 — 일관된 단일 카드 + 피드
| 구분 | 파일 | 역할 |
|---|---|---|
| 신규 | `components/records/unified-record-card.tsx` | 적응형 단일 카드 |
| 신규 | `components/records/unified-record-feed.tsx` | 그룹 헤더 + cursor "더 보기" |

- 카드: `components/notes/note-card.tsx`(좌측 표지 + 우측 내용) 레이아웃 차용 → **동일 시각 언어**. 있는 슬롯만 적응형 표시. 종류는 작은 배지(·시간 / ·진행 / ·사진)로만 구분.
- 사진 있으면 좌측 썸네일 + 스탬프 배지(없으면 표지/타이머 아이콘). 메모 2줄, 진행 `p.start→end (%)`, 북마크 칩.
- 피드: `groupUnifiedByDateBook`로 "오늘/어제/날짜 · 책" 헤더 묶음. `EmptyState` 재사용.
- 재사용: `formatDuration`/`formatTimeRange`(`lib/utils/duration`), `formatSmartDate`(`lib/utils/date`), `getImageUrl`(`lib/utils/image`), `Lightbox`(`components/stamps/photo-gallery`), `NoteContentViewer`(`components/notes/note-content-viewer`), `computeProgressPercent`(`lib/reading/progress`).

### Phase 3~4 — 단일 편집 라우팅
| 구분 | 파일 | 역할 |
|---|---|---|
| 신규 | `hooks/use-unified-record-edit.ts` | `editTarget` 분기 글루 |

- `editRecord(record)` 분기:
  - `kind="reading_log"` → `useRecordSheet().openAttach(logId, {...})`. **이미** `reading-time-tab.tsx::openEditSheet`·`reading-speed-detail.tsx`가 쓰는 패턴. "시간만→페이지·메모 추가" 수렴이 attach로 충족(요구 3).
  - `kind="note"` + `progress` → 경량 편집(페이지·메모) = 기존 `updateNote` 재사용. 1차는 `/notes/[id]/edit` 폴백, 후속에서 시트화.
  - `kind="note"` + `quote/memo/transcription` → 기존 `/notes/[id]/edit`(리치 편집) 유지.
- `RecordSheet`는 **이미 attach 모드 보유**(`12-stamp-reintegration.md` Phase B) → 신규 모드 불필요.
- `isRecordV2Enabled()`(`lib/feature-flags.ts`)로 attach 진입(카나리 정합, OFF면 legacy 폴백).
- 저장 후 재검증: `attachStampToLog`/`updateReadingLogEntry`의 `revalidatePath`에 `/notes` 포함 확인(누락 시 추가).

### Phase 5 — `/notes` "전체" 탭 승격
| 구분 | 파일 | 역할 |
|---|---|---|
| 수정 | `app/(main)/notes/page.tsx` | `tab==="all"` & 검색어 없음 → `getUnifiedRecords` + `UnifiedRecordFeed`. 그 외 탭/검색 → 기존 `searchNotes` + `NotesHubClient` 유지. 게스트 샘플 경로 유지. |
| 수정 | `components/notes/notes-hub-client.tsx` | 전체 탭 통합 피드 렌더(prop 분기). 헤더/탭/검색바 재사용. `progress` 탭은 통합 후 중복 → 후속 제거 검토. |
| 플래그 | `lib/feature-flags.ts` | `NEXT_PUBLIC_UNIFIED_FEED` 뒤 점진 노출(킬 스위치). |

### Phase 6 — 흩어진 뷰 역할 재정의
| 화면 | 재정의 |
|---|---|
| `/notes` 전체 탭 | **표시 SSOT — 모든 입력이 모이는 한 곳** (요구 1·2) |
| 책 상세 시간탭 `reading-time-tab.tsx` | **책-스코프 전문 뷰 유지**. 편집은 이미 attach 사용 → 통합 편집과 동일 경로(정합). 스코프가 달라 중복 아님 |
| `/profile/reading-speed` | **속도 분석 전문 뷰 유지**(이상치/가이드는 특수 도메인) |
| `/stamps` | **사진 컬렉션 갤러리 유지**(큐레이션 목적, 피드와 다름) |

> 원칙: **표시 통합은 /notes 한 곳**, 나머지는 스코프·도메인 렌즈로 유지. **편집은 전부 RecordSheet attach로 수렴** → "한 곳에서 편집"(요구 3).

---

## 5. 화면 흐름 (텍스트 와이어프레임)

### 5.1 통합 피드 (D2 — 그룹 헤더 + 개별 카드)
```
/notes  [ 전체 ] 메모  사진  진행  필사  …          (전체 탭 = 통합 피드)
────────────────────────────────────────────
▾ 오늘 · 미움받을 용기
  ┌───────────────────────────────────────┐
  │ ⏱  32분    p.45 → 78          ·시간    │  ← reading_log (시간세션)
  └───────────────────────────────────────┘
  ┌───────────────────────────────────────┐
  │ 📊  62%   "이 부분 인상 깊다"   ·진행   │  ← notes(progress) (슬라이더 메모)
  └───────────────────────────────────────┘
  ┌───────────────────────────────────────┐
  │ 📷[썸네일]  p.80   🏅스탬프      ·사진  │  ← reading_log (사진 승격)
  └───────────────────────────────────────┘
▾ 어제 · 데미안
  ┌───────────────────────────────────────┐
  │ ✍ "새는 알에서 나오려 투쟁한다" 구절    │  ← notes(quote) 자유 상세
  └───────────────────────────────────────┘
            [ 더 보기 ]   (created_at keyset cursor)
```

### 5.2 단일 편집 — "시간만 → 나중에 페이지·메모" 수렴 (요구 3)
```
[시간만 카드 탭]
   │  editTarget = { kind:"reading_log", logId }
   ▼
RecordSheet (attach 모드, 이미 존재)
   ├─ 페이지: 45 → [ 78 ]
   ├─ 메모:  [______________]
   └─ 사진:  [ + 추가 ]  (있으면 attachStampToLog → 스탬프 승격)
   │  → updateReadingLogEntry / attachStampToLog
   ▼
같은 카드가 그 자리에서 갱신 (시간 + 페이지 + 메모) — 새 카드 생성 아님
```

---

## 6. 위험 · 완화

| 위험 | 완화 |
|---|---|
| **이중 표시** (세션 연결 note + reading_log) | 3.3 중복 제거 규칙(`reading_log_id IS NULL`만 1차 카드) + `unified.ts` 단위 테스트 |
| **포인트 이중 적립** | 편집은 `attachStampToLog`/`updateReadingLogEntry`만 사용(둘 다 적립 없음, D4 불변). 신규 적립 경로 생성 금지 |
| **RLS** | 모든 쿼리 `.eq("user_id", …)` 명시 + 테이블 RLS. 신규 액션은 읽기 전용·owner 필터 |
| **성능/페이지네이션** | offset 금지, created_at keyset cursor, 각 테이블 `limit+1`. 필요 시 `(user_id, created_at)` idempotent 인덱스 마이그(`migration-YYYYMMDDHHmm__reading_logs__user_created_idx.sql`, `CREATE INDEX IF NOT EXISTS`) |
| **카나리/legacy 충돌** | 피드는 표시 신규 추가라 `NEXT_PUBLIC_RECORD_V2`와 독립. 편집 진입만 `isRecordV2Enabled()` 따름. 피드 자체는 `NEXT_PUBLIC_UNIFIED_FEED`로 점진 노출 |
| **progress 이관 회귀** | 본 라운드는 표시만 통합(무마이그) → 회귀 최소. 백필은 별도 게이트(1장 비범위) |

---

## 7. 결정 정합성 (기존 ADR/DEC 충돌 없음)
- **D4**(포인트 종료 1회): 편집 경로는 추가 적립 없음 — 불변.
- **DEC-6**(여정 편입): progress note 생성·집약 로직 변경 없음(표시만 머지) — 충돌 없음.
- 스탬프 정의(`image_url≠NULL AND promoted_at≠NULL`): `00-master.md`·`12`와 동일.
- 자유 기록(책 없음, D3 of master): `userBookId = null` 허용으로 표현.

---

## 8. 검증 (E2E — 구현 라운드)
1. 시간만 세션 종료(사진·페이지 없음) → /notes 전체 탭에 시간 카드 → 탭 → attach로 페이지·메모 추가 → **같은 카드 갱신(수렴)**.
2. 진행율 슬라이더+메모(progress note) → 같은 날·책 그룹에 시간세션과 **나란히** 표시.
3. 세션 종료 시 사진 첨부(스탬프) → 피드 썸네일+스탬프 배지, /stamps에도 표시되되 **이중 표시 0**.
4. 세션 연결 상세기록(quote) → 피드에서 **세션 카드 1개**(중복 제거 확인).
5. 편집 후 **포인트 변화 0**(이중 적립 0).
6. cursor "더 보기" 누락/중복 0.
7. `NEXT_PUBLIC_UNIFIED_FEED=0` → 기존 notes 화면 폴백.
8. `tsc` + ESLint 통과.

---

## 9. 재사용 자산 (신규 생성 금지)
| 분류 | 자산 |
|---|---|
| 편집 액션 | `app/actions/progress.ts::attachStampToLog`·`updateReadingLogEntry` |
| 편집 진입 | `hooks/use-record-sheet.ts::openAttach`, `components/records/record-attach-step.tsx`, `record-sheet.tsx`(attach 모드) |
| 조회 패턴 | `getReadingStamps`·`getPaceSessions`(`progress.ts`) select·cursor; `searchNotes`(`search.ts`) 필터 |
| 표시 | `components/notes/note-card.tsx`, `note-content-viewer`, `Lightbox`(`stamps/photo-gallery`), `EmptyState` |
| 순수 헬퍼 | `lib/reading/time-stats.ts`·`pace.ts`, `lib/reading/progress::computeProgressPercent`, `lib/utils/duration`·`date`·`image` |
| 카나리 | `lib/feature-flags.ts::isRecordV2Enabled` |

---

## 10. 체크리스트 (구현 현황 — 2026-06-15)

### 설계
- [x] 두 평행 세계 진단 + 분리감 근원 확정
- [x] 4대 결정(D1~D4) 사용자 확정
- [x] 무마이그 읽기 레이어 설계(Phase 0~6) + 재사용 자산 매핑

### Phase 0 — 통합 타입 + 순수 정규화 ✅
- [x] `types/unified-record.ts` — `UnifiedRecord`/`UnifiedRecordBook`/`UnifiedRecordGroup` + 파라미터/결과 타입
- [x] `lib/reading/unified.ts`(순수) — `toKstDateKey`·`readingLogToUnified`·`noteToUnified`·`mergeAndSort`·`groupUnifiedByDateBook`

### Phase 1 — 통합 피드 액션 ✅
- [x] `app/actions/records.ts::getUnifiedRecords` — reading_logs + notes 병렬 조회, books.id→user_books.id 역매핑(그룹 정합), created_at keyset cursor(`limit+1` 후 머지 절단), `searchNotes` 무변경
- [x] 중복 제거: notes 측 `reading_log_id IS NULL`만 1차 카드

### Phase 2 — 카드 + 피드 ✅
- [x] `components/records/unified-record-card.tsx` — 적응형 슬롯(시간/페이지·%/메모/사진/북마크) + 작은 종류 배지 + 카드 탭=편집
- [x] `components/records/unified-record-feed.tsx` — "날짜 · 책" 그룹 헤더 + cursor 더보기 + 시트 닫힘 시 `router.refresh()` + `Lightbox`

### Phase 3·4 — 단일 편집 ✅
- [x] `hooks/use-unified-record-edit.ts` — `editTarget` 분기(reading_log→`openAttach` / note→`/notes/[id]/edit`), `isRecordV2Enabled` 폴백

### Phase 5 — /notes 전체 탭 승격 ✅
- [x] `lib/feature-flags.ts::isUnifiedFeedEnabled`(기본 ON, `NEXT_PUBLIC_UNIFIED_FEED=0` 킬 스위치)
- [x] `app/(main)/notes/page.tsx` — 전체 탭 + list 뷰 + 필터/검색 없음일 때만 피드 승격(그 외는 기존 `searchNotes`)
- [x] `components/notes/notes-hub-client.tsx` — `unifiedRecords` prop → `UnifiedRecordFeed` 렌더(헤더/탭/검색 재사용)

### Phase 6 — 뷰 역할 재정의 + 중복 정리 ✅
- [x] /notes 전체 탭 = 표시 SSOT, 책 시간탭/reading-speed/stamps = 스코프·도메인 렌즈 유지(역할표 §4 Phase 6)
- [x] notes `progress` 탭 제거(`notes-hub-client.tsx` MAIN_TABS) — 진행 기록이 전체 피드로 흡수, `?tab=progress` 하위호환 유지
- [ ] (선택) 진행율 기록 데이터 모델 단일화(reading_logs 백필) — 여정·포인트 회귀로 별도 게이트 보류(§1 비범위)

### 검증
- [x] `tsc --noEmit` ✅ · ESLint(변경 파일, 0 error) ✅ · `next build` ✅
- [x] 순수 로직 단위 테스트 `__tests__/lib/unified.test.ts` ✅ (12/12) — `mergeAndSort` 정렬 방향 버그를 테스트로 발견·수정
- [x] HTML 화면 가이드 `doc/update/통합기록피드_화면가이드_2026-06-15.html`
- [ ] dev 실기기 수동 확인(E2E §8): 시간만→attach 수렴, 진행율+시간 동일 그룹, 스탬프 이중표시 0, cursor 더보기, 플래그 OFF 폴백

> **상태(2026-06-15):** Phase 0~6 구현 완료(마이그레이션 0). 통합 피드는 `NEXT_PUBLIC_UNIFIED_FEED` 기본 ON·킬 스위치 보존. 검증: `tsc` ✅ · ESLint ✅ · `next build` ✅ · 단위테스트 ✅. 실기기 수동 E2E와 데이터 모델 단일화(선택)는 후속. 브랜치 `feat/record-time-consolidation`. 로그: `doc/log/2026-06.md` 2026-06-15 엔트리.

---

## 11. 후속 단계 적용 (2026-06-15 2차) — ①④② 완료 / ③ 게이트

사용자 선택(4개)에 따라 안전한 3개를 적용하고, ③(데이터 단일화)은 위험 감사 후 게이트.

### ① 종류 필터 UI ✅
- `unified-record-feed.tsx`에 세그먼트 필터(전체/시간/진행/스탬프/상세) — 클라이언트 측 kind 필터(로드된 기록에 적용, cursor 더보기와 양립).

### ④ 타임라인/책별 뷰 통합 ✅
- `lib/reading/unified.ts`에 `groupUnifiedByMonth`/`groupUnifiedByBook` 추가.
- 피드 `groupBy`(dateBook/month/book) + `sort`(latest/oldest, keyset 방향 일치) prop.
- `notes/page.tsx`: 전체 탭의 **모든 뷰**(list/timeline/book)에서 통합 피드 승격(필터/검색 없을 때). `notes-hub-client.tsx`가 activeView→groupBy 매핑.

### ② 책 상세 통합 피드 ✅
- `books/[id]/page.tsx`: `getUnifiedRecords({bookId})` 조회(플래그 ON·비게스트, Promise.all 병합).
- `book-notes-tabs.tsx`: "기록" 탭을 책-스코프 통합 피드로 승격(플래그 ON), OFF면 기존 `NoteList` 폴백. 시간/여정 탭은 전문 렌즈로 유지.

### ③ 진행율 기록 데이터 단일화 — ✅ 구현(플래그 기본 OFF · 백필 미적용)
사용자 "위험 감수하고 진행" 승인. **위험도 HIGH(9/10)** 라 안전망으로 **피처플래그 `NEXT_PUBLIC_PROGRESS_IN_LOGS`(기본 OFF)** 뒤에 전체 구현하고, **파괴적 백필은 미적용(ready SQL만)**.

**모델:** 진행 기록 = `reading_logs` 중 `reading_duration_seconds=0 AND image_url IS NULL AND end_page≠NULL`(페이지-only). 시간세션(duration>0)·스탬프(image)와 충돌 없음.

**구현(플래그 ON일 때 동작):**
- 쓰기: `progress.ts::recordProgressLog`(DEC-6 same-day 집약 on reading_logs) — `reading-progress.tsx`가 `createNote/upsertDailyProgressNote` 대신 호출.
- 어댑터: `progress.ts::getProgressLogsAsNotes`(reading_logs→NoteWithBook 형) — 여정/탭 리더 무변경 재사용.
- dual-source 리더(레거시 notes ⊕ 신규 logs, **disjoint → 이중 카운트 없음**): 책 상세 `books/[id]/page.tsx`(여정), `stats.ts::getDailyRecordsByType`·`getWeeklyProgress`(주간+스트릭)·`getRecentProgressLogs`. 헬퍼 `fetchProgressLogCreatedAts`.
- 피드: `readingLogToUnified`가 페이지-only 로그를 kind 'progress'로 분류(플래그 무관, 무해).

**위험 영향(플래그 OFF면 전부 기존 동작 유지):**
| 영향 | 위치 | dual-source 처리 |
|---|---|---|
| 여정 회독 시각화 | `reading-sessions.ts`·`reading-journey.tsx`·`book-notes-tabs.tsx` | 책 페이지에서 logs를 note형으로 합류 |
| 캘린더 일별 집계 | `stats.ts::getDailyRecordsByType` | logs progress 합산 |
| 주간/스트릭 | `stats.ts::getWeeklyProgress` | 주간+30일 스트릭에 logs 합산 |
| 대시보드 최근 진행 | `stats.ts::getRecentProgressLogs` | logs 병합·정렬·limit |
| 포인트(`note_progress`) | `notes.ts::createNote` | recordProgressLog는 미적립(단순화) |

**백필(파괴적, 미적용):** `doc/database/migration-202606151200__reading_logs__backfill_progress_notes.sql` — **원자적(한 트랜잭션) 백필+삭제**. ⚠️ 백필과 삭제를 분리하면 그 사이 notes ⊕ logs 가 둘 다 읽혀 **이중 카운트/표시**가 되므로 반드시 같은 트랜잭션. 또 **플래그 ON 선행 필수**(OFF면 리더가 logs를 안 읽어 진행 기록이 사라짐). idempotent.

> **상태(2026-06-15 2차):** ③ 코드 구현 완료(플래그 OFF, 현 사용자 무영향). 검증 `tsc`·ESLint 0err·단위테스트(progress 분류 포함)·`next build`.
>
> **활성화 런북(올바른 순서 — 1·2·5는 사람이 수행):**
> 1. 프리뷰/스테이징에 `NEXT_PUBLIC_PROGRESS_IN_LOGS=1` 배포 (Vercel — 플래그 **먼저**).
> 2. 진행율 기록 후 실데이터로 여정·캘린더·스트릭·대시보드 정상 표시 확인(신규 진행이 logs에서 보임 + 기존 progress notes도 함께 보임 = disjoint).
> 3. 백필 마이그레이션 실행(원자적 백필+삭제). 대상 노트 수는 사전 카운트로 확인(2026-06-15 기준 194건).
> 4. 백필 후 과거 진행 기록이 그대로 보이는지(이중표시 0, 누락 0) 재확인.
> 5. 프로덕션 플래그 ON + (필요 시 프로덕션 백필).
>
> ⚠️ 절대 금지: 플래그 OFF에서 백필 실행(진행 기록 소실), 백필만 하고 삭제 생략(이중 표시).
