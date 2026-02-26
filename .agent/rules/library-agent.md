---
alwaysApply: false
description: "서재(Library) 도메인 에이전트 — 책 관리, 서재 구성, 독서 상태, 진행률 추적"
globs:
  - "app/(main)/books/**"
  - "app/(main)/bookshelves/**"
  - "app/actions/books/**"
  - "app/actions/bookshelves.ts"
  - "app/actions/book-relations.ts"
  - "app/actions/progress.ts"
  - "app/api/books/**"
  - "components/books/**"
  - "components/bookshelves/**"
  - "hooks/use-books.ts"
  - "types/book.ts"
  - "types/bookshelf.ts"
  - "types/progress.ts"
---

# Library Agent — 서재 도메인 전담 에이전트

## 1. 에이전트 정체성

**역할**: 서재 모듈 전담 (약 40개 컴포넌트, 5개 액션 파일)
**핵심 액션**: `app/actions/books/` (core · reading · progress · _shared · index)

---

## 2. 담당 책임

| 영역 | 세부 작업 |
|------|-----------|
| 책 CRUD | `addBook`, `getBook`, `getBooksWithDetails`, 수정/삭제 |
| 외부 API 검색 | Naver Books, Google Books, Aladin (`lib/api/naver.ts`, `lib/api/book-page-count.ts`) |
| 서재 관리 | 생성·편집·삭제·순서 변경·메인 서재 (`bookshelves.ts`) |
| 독서 상태 | `updateBookStatus` — `reading / completed / paused / rereading / not_started` |
| 독서 여정 시각화 | `deriveReadingSessions` (회독 단위 세션 파생) |
| 진행률 추적 | `reading_logs` 기록, `current_page` 업데이트, 회독 세션 파생 |
| 관련 도서 연결 | `user_book_relations` — `app/actions/book-relations.ts` |
| 총 페이지 수 | `fetchBookPageCount` → `books.total_pages` 업데이트 |

---

## 3. DB 테이블

| 테이블 | 역할 |
|--------|------|
| `books` | 전역 책 메타데이터 (ISBN 기준 공유) |
| `user_books` | 사용자별 독서 상태·진행률·서재 매핑 |
| `bookshelves` | 사용자 서재 (이름·설명·순서·공개 여부) |
| `reading_logs` | 날짜별 페이지 진행 기록 |
| `user_book_relations` | 책 간 관계 연결 (관련 도서) |

---

## 4. Input/Output 스키마

```typescript
interface AddBookInput {
  title: string;
  author?: string | null;
  isbn?: string | null;
  cover_image_url?: string | null;
  total_pages?: number | null;
  published_date?: string | null;
}

type ReadingStatus = "reading" | "completed" | "paused" | "not_started" | "rereading";

// deriveReadingSessions 반환 단위
interface ReadingSession {
  round: number;        // 회독 번호 (1-based)
  startedAt: string;
  completedAt: string | null;
  logs: ReadingLog[];
}
```

---

## 5. 레이어 분리 (절대 규칙)

```
components/books/**
        ↓
hooks/use-books.ts
        ↓
app/actions/books/** · bookshelves.ts
        ↓
Supabase
```

- DB 접근은 `app/actions/books/` 또는 `app/actions/bookshelves.ts`에서만
- 컴포넌트에서 supabase 클라이언트 직접 호출 금지
- 외부 API(`lib/api/`) 호출도 Server Action 내부에서만

---

## 6. 핵심 유틸리티

| 유틸 | 위치 | 용도 |
|------|------|------|
| `deriveReadingSessions` | `lib/utils/reading-sessions.ts` | reading_logs → 회독 세션 배열 파생 |
| `getImageUrl` | `lib/utils/image.ts` | cover_image_url 정규화 |
| `smartCompressImage` | `lib/utils/image.ts` | 업로드 전 이미지 압축 |
| `searchBooks` / `transformNaverBookItem` | `lib/api/naver.ts` | Naver 책 검색 |
| `fetchBookPageCount` | `lib/api/book-page-count.ts` | 총 페이지 수 외부 조회 |

---

## 7. 금지사항 (경계)

```
❌ notes 기록 로직 수정       →  Records Agent 담당
❌ 인증/세션 로직 수정         →  Identity Agent 담당
❌ AI summarization 수정      →  AI Agent 담당
❌ 포인트 핵심 로직 직접 수정  →  earnPoints() 호출만 허용
❌ 자유기록(READTREE_BOOK_ID)  →  FreeNotes Agent 담당
```

---

## 8. 에스컬레이션 규칙

| 상황 | 대응 |
|------|------|
| **외부 API 전체 장애** (Naver + Aladin + Google Books 동시) | 수동 입력 폼 fallback, "책 직접 입력" 안내 |
| **책 삭제 시 연관 기록 처리** | `notes`, `reading_logs` 존재 여부 확인 → 영향 범위 사용자 고지 후 삭제 |
| **ISBN 중복 충돌** | `books` 테이블 기존 ISBN 책 재사용, 신규 생성 금지 |

---

## 9. DB 변경 체크리스트

1. `doc/database/DATA_MODEL.md` 먼저 수정
2. 마이그레이션 파일: `doc/database/migration-YYYYMMDDHHmm__books__<내용>.sql`
3. `types/book.ts` / `types/bookshelf.ts` 동기화
4. RLS 4가지 정책 (`SELECT / INSERT / UPDATE / DELETE`: `auth.uid() = user_id`)
5. `books` 테이블은 전역 공유 — 읽기 공개, 쓰기는 `authenticated` only

---

## 변경 로그

| 날짜 | 변경 내용 |
|------|----------|
| 2026-02-26 | v1 최초 생성 |
