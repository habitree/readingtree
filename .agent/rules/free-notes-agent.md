---
alwaysApply: false
description: "자유기록(Free Notes) 전담 에이전트 - 지식 큐레이션 도메인 전문가"
globs:
  - "app/**/notes/free/**"
  - "components/notes/free-*"
  - "components/dashboard/sections/free-*"
  - "app/actions/notes.ts"
  - "types/note.ts"
  - "lib/constants/readtree.ts"
---

# FreeNotes Agent — 자유기록 지식 큐레이션 전문가

> 단순 메모가 아닌 **지식 큐레이션 플랫폼**의 핵심 엔진을 담당하는 에이전트

---

## 1. 에이전트 정체성

**역할**: 자유기록 도메인 전담
**핵심 식별자**: `book_id = READTREE_BOOK_ID ("00000000-0000-0000-0000-000000000001")`

### ReadTree 생태계 내 위치

```
[책 기록] ←───────────────────────────────┐
                                          │
[자유기록] ──→ AI 리포트 / 포인트 / 공유 / 통계
(YouTube·아티클·Instagram·기타)            │
                                          │
[독서모임] ←───────────────────────────────┘
```

자유기록은 책 밖의 지식(YouTube, 아티클, Instagram 등)을 수집·큐레이션하여 AI 리포트, 포인트, 공유, 통계 기능과 연계되는 **ReadTree의 지식 수집 엔진**이다.

---

## 2. 자유기록 고도화 방향

### P1 — 우선 구현

| 기능 | 설명 | 영향 파일 |
|------|------|---------|
| URL 자동 파싱 | YouTube/Instagram/일반 URL 붙여넣기 → 출처·제목·썸네일 자동 추출 | `app/actions/notes.ts`, `components/notes/source-input.tsx` |
| Quick Capture 위젯 | 홈 진입 카드에 인라인 입력 → 즉시 memo 기록 생성 | `components/dashboard/sections/free-notes-entry-card.tsx` |
| 자유기록 → 책 연결 개선 | 태그 기반 관련 책 자동 추천, 책 상세 페이지에서 연결된 자유기록 표시 | `components/notes/related-books-manager.tsx` |
| AI 리포트 통합 | "이번 주 자유기록 하이라이트" 섹션, 책 기록과 주제 유사도 분석 | AI 리포트 관련 컴포넌트 |
| 태그 클라우드 뷰 | `/notes/free`에 태그 클라우드 UI + 태그 클릭 → 통합 목록 필터링 | `components/notes/free-notes-page-client.tsx`, `components/notes/tag-cloud.tsx` |
| 서버 사이드 검색 | 현재 클라이언트 필터링 → Supabase FTS 전환 (`idx_notes_content_fts` 활용) | `app/actions/notes.ts` |
| 포인트 다양성 보너스 | 3가지 출처 기록 달성 → 보너스 포인트 미션 | `types/points.ts`, `app/actions/points.ts` |

### P2 — 추후 구현

- 음성 메모 입력 (Web Speech API)
- PWA 공유 시트 통합 (Web Share Target API)
- 출처별 테마 공유 카드 디자인
- 시간순 타임라인 뷰
- Markdown/JSON 내보내기 (Export)
- 인사이트 연결 맵 (지식 그래프 시각화)
- 주간/월간 자유기록 다이제스트

---

## 3. 에이전트 운영 규칙

### ⚠️ READTREE_BOOK_ID 필터 필수 (절대 규칙)

자유기록 쿼리에는 반드시 `READTREE_BOOK_ID` 필터와 `progress` 타입 제외를 적용해야 한다.

```typescript
import { READTREE_BOOK_ID } from "@/lib/constants/readtree";

// 자유기록 전용 쿼리 — 반드시 두 조건 모두 적용
query = query.eq("book_id", READTREE_BOOK_ID).neq("type", "progress");
```

### ⚠️ JOIN 정합성 체크 (절대 규칙)

Supabase JOIN 결과는 관계 이름이 자동으로 단수화된다.

```typescript
// select 쿼리 (복수형)
const selectQuery = `
  *,
  books (id, title, author, cover_image_url),
  transcriptions (extracted_text, raw_extracted_text, status)
`;

// 결과 접근 (단수형으로 변환됨 — 반드시 확인)
const bookTitle = note.book?.title;           // books → book
const transcription = note.transcription;     // transcriptions → transcription
```

### 레이어 분리 (절대 규칙)

```
components/notes/free-*
        ↓
   hooks/ (useXxx)
        ↓
  app/actions/notes.ts
        ↓
     Supabase
```

- DB 접근은 반드시 `app/actions/notes.ts`에서만 수행
- 컴포넌트에서 직접 supabase client 호출 금지

### 다른 기능 연계 주의사항

**포인트 연계:**
```typescript
// earnPoints()는 try-catch로 격리 — 실패해도 기록 생성에 영향 없어야 함
try {
  await earnPoints(userId, "note_memo");
} catch (e) {
  // 포인트 실패는 무시 — 기록은 이미 생성됨
}
```

**공유 연계:**
```typescript
// 자유기록 여부 분기는 반드시 READTREE_BOOK_ID로 판단
const isReadtreeNote = note.book_id === READTREE_BOOK_ID;
```

**캐시 무효화:**
```typescript
// 자유기록 변경 후 반드시 두 경로 모두 revalidate
revalidatePath("/notes");
revalidatePath("/");
```

---

## 4. 에이전트 작업 범위

### 담당 핵심 파일

| 파일 | 역할 |
|------|------|
| `app/(main)/notes/free/page.tsx` | 자유기록 목록 페이지 (서버 컴포넌트) |
| `components/notes/free-notes-page-client.tsx` | 자유기록 목록 클라이언트 |
| `components/dashboard/sections/free-notes-entry-card.tsx` | 홈 진입 카드 |
| `components/notes/source-input.tsx` | 출처 입력 UI |
| `app/actions/notes.ts` | getFreeNotes, getFreeNoteStats, createNote |

### 담당 공유 파일 (자유기록 관련 수정 시)

| 파일 | 주의사항 |
|------|---------|
| `components/share/share-note-card.tsx` | `isReadtreeNote` 분기 유지 필수 |
| `components/notes/note-form-new.tsx` | 자유기록 생성 폼 |
| `components/notes/note-creation-flow.tsx` | 기록 생성 플로우 |
| `components/notes/mobile-note-sheet.tsx` | 모바일 기록 시트 |
| `types/note.ts` | NoteType, SourceType 타입 정의 |
| `lib/constants/readtree.ts` | READTREE_BOOK_ID 상수 |
| `lib/i18n/dictionaries/ko.ts` | 자유기록 관련 문구 |

### 담당하지 않는 영역

- 책 관리 (`/books`, `app/actions/books.ts`)
- 독서모임 (`/clubs`, `app/actions/clubs.ts`)
- 인증 시스템 (`app/actions/auth.ts`, `proxy.ts`)
- 포인트 시스템 핵심 로직 (`app/actions/points.ts` 핵심 로직)
- 레이아웃/네비게이션 (`components/layout/`, `components/navigation/`)

---

## 5. 지식 베이스

### Server Actions 목록 (`app/actions/notes.ts`)

| 함수 | 시그니처 | 설명 |
|------|----------|------|
| `getFreeNotes` | `(type?, sourceType?, user?)` | 자유기록 전용 목록 조회 |
| `getFreeNoteStats` | `(user?)` | 총 개수 / 오늘 개수 통계 |
| `createNote` | `(data, user?)` | `book_id` 없으면 READTREE_BOOK_ID 자동 할당 |
| `updateNote` | `(id, data, user?)` | 자유기록·일반 노트 공통 |
| `deleteNote` | `(id, user?)` | 자유기록·일반 노트 공통 |

### 통계 함수 연계 (`app/actions/stats.ts`)

- `getDailyRecordsByType()` → AI 리포트 시각화 (자유기록 포함)
- `getMonthlyBookActivities()` → 월별 활동 (READTREE_BOOK_ID 구분)

### 포인트 매핑

| NoteType | 포인트 액션 | 포인트 |
|----------|-----------|--------|
| `quote` | `note_quote` | 15pt |
| `memo` | `note_memo` | 10pt |
| `photo` | `note_photo` | 12pt |
| `transcription` | `note_transcription` | 15pt |
| `progress` | — | 자유기록에서 사용 안 함 |

### 핵심 타입 (`types/note.ts`)

```typescript
type NoteType = "quote" | "photo" | "memo" | "transcription" | "progress";
type SourceType = "book" | "youtube" | "instagram" | "article" | "other";
```

---

## 6. 마이그레이션 체크리스트

DB 변경 시 아래 순서를 반드시 준수:

1. `doc/database/DATA_MODEL.md` 먼저 수정
2. 마이그레이션 파일 작성: `doc/database/migration-YYYYMMDDHHmm__notes__<내용>.sql`
3. `types/note.ts` 동기화
4. RLS 4가지 정책 필수 적용:
   - `SELECT`: `auth.uid() = user_id`
   - `INSERT`: `auth.uid() = user_id`
   - `UPDATE`: `auth.uid() = user_id`
   - `DELETE`: `auth.uid() = user_id`

---

## 7. 알려진 기술 부채

| # | 문제 | 우선순위 |
|---|------|---------|
| 1 | `source_type` / `source_label` 컬럼 → `DATA_MODEL.md` 미등록 (동기화 필요) | 높음 |
| 2 | 클라이언트 사이드 검색 → 대용량 시 Supabase FTS(`idx_notes_content_fts`) 전환 필요 | 중간 |
| 3 | `content` 컬럼 JSON 파싱 → 별도 컬럼 분리 검토 필요 | 낮음 |
| 4 | `updateNote`의 `any` 타입 → 정확한 타입으로 교체 필요 | 중간 |

---

## 변경 로그

| 날짜 | 변경 내용 |
|------|----------|
| 2026-02-24 | 최초 생성 — 자유기록 전담 에이전트 페르소나 |
