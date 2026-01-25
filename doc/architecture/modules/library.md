# Library Module (서재)

> **Module Key**: `library`
> **Layer**: A. 도메인 모듈
> **Last Updated**: 2025-01-25

---

## 1. 개요

사용자의 서재, 책 메타데이터, 독서 상태를 관리하는 핵심 도메인 모듈입니다.

### 1.1 주요 기능

- 책 추가/수정/삭제
- 독서 상태 관리 (읽기 전, 읽는 중, 완독, 재독)
- 책장(bookshelf) 관리
- 독서 진행률 추적

---

## 2. 파일 구조

```
app/
├── (main)/
│   ├── books/
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx
│   │   └── search/page.tsx
│   └── bookshelves/
│       └── page.tsx
├── actions/
│   ├── books.ts
│   └── bookshelves.ts
└── api/
    └── books/

components/
├── books/
│   ├── book-card.tsx
│   ├── book-search.tsx
│   ├── book-title.tsx
│   ├── book-status-badge.tsx
│   ├── book-info-editor.tsx
│   ├── book-notes-preview.tsx
│   ├── book-stats-cards.tsx
│   ├── book-scroll-handler.tsx
│   └── book-delete-button.tsx
├── bookshelves/
│   ├── bookshelf-card.tsx
│   ├── bookshelf-list.tsx
│   ├── bookshelf-selector.tsx
│   └── bookshelf-stats.tsx
└── layout/
    └── bookshelf-tree.tsx

hooks/
├── use-books.ts
└── use-bookshelves.ts

types/
├── book.ts
└── bookshelf.ts
```

---

## 3. 데이터 모델

### 3.1 테이블

| 테이블 | 설명 |
|--------|------|
| `books` | 책 메타데이터 (ISBN, 제목, 저자 등) |
| `user_books` | 사용자-책 관계 (독서 상태, 진행률) |
| `bookshelves` | 책장 정보 |

### 3.2 주요 타입

```typescript
interface Book {
  id: string
  isbn: string | null
  title: string
  author: string | null
  publisher: string | null
  cover_image: string | null
  page_count: number | null
}

interface UserBook {
  id: string
  user_id: string
  book_id: string
  bookshelf_id: string | null
  reading_status: 'not_started' | 'reading' | 'completed' | 'rereading'
  current_page: number | null
  started_at: string | null
  completed_at: string | null
  reading_reason: string | null
}

interface Bookshelf {
  id: string
  user_id: string
  name: string
  description: string | null
}
```

---

## 4. 핵심 함수

### 4.1 Server Actions

| 함수 | 파일 | 설명 |
|------|------|------|
| `getBooks()` | `app/actions/books.ts` | 사용자 책 목록 조회 |
| `getBookById()` | `app/actions/books.ts` | 책 상세 조회 |
| `addBook()` | `app/actions/books.ts` | 책 추가 |
| `updateBook()` | `app/actions/books.ts` | 책 정보 수정 |
| `deleteBook()` | `app/actions/books.ts` | 책 삭제 |
| `updateReadingStatus()` | `app/actions/books.ts` | 독서 상태 변경 |
| `getBookshelves()` | `app/actions/bookshelves.ts` | 책장 목록 조회 |
| `createBookshelf()` | `app/actions/bookshelves.ts` | 책장 생성 |

### 4.2 Hooks

| Hook | 설명 |
|------|------|
| `useBooks()` | 책 목록 상태 관리 |
| `useBookshelves()` | 책장 목록 상태 관리 |

---

## 5. 의존성

### 5.1 이 모듈이 사용하는 것

- `identity`: 사용자 확인
- `shared`: UI 컴포넌트, 유틸리티

### 5.2 이 모듈을 사용하는 것

- `records`: 책 정보 참조 (노트 작성 시)
- `groups`: 그룹 내 책 공유
- `sharing`: 책 공유
- `search`: 책 검색
- `ai`: 책 컨텍스트 활용
- `home`: 최근 읽은 책 표시

---

## 6. API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/books` | 책 목록 조회 |
| POST | `/api/books` | 책 추가 |
| GET | `/api/books/[id]` | 책 상세 조회 |
| PATCH | `/api/books/[id]` | 책 수정 |
| DELETE | `/api/books/[id]` | 책 삭제 |

---

## 7. 참고 문서

- [DATA_MODEL.md](../../database/DATA_MODEL.md)
