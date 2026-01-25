# Records Module (독서기록)

> **Module Key**: `records`
> **Layer**: A. 도메인 모듈
> **Last Updated**: 2025-01-25

---

## 1. 개요

독서 노트, 필사, 하이라이트, OCR 기능을 관리하는 핵심 도메인 모듈입니다.

### 1.1 주요 기능

- 노트 작성/수정/삭제
- 노트 타입 관리 (메모, 필사, 하이라이트, 리뷰)
- 이미지 업로드 및 OCR 처리
- 타임라인 표시
- 책 멘션/링크

---

## 2. 파일 구조

```
app/
├── (main)/
│   ├── notes/
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx
│   │   └── new/page.tsx
│   └── timeline/
│       └── page.tsx
├── actions/
│   ├── notes.ts
│   ├── ocr.ts
│   └── ai/ocr.ts
└── api/
    ├── notes/
    └── ocr/

components/
├── notes/
│   ├── note-type-tabs.tsx
│   ├── book-mention-input.tsx
│   ├── book-mention-textarea.tsx
│   ├── book-link-button.tsx
│   ├── book-link-dialog.tsx
│   ├── text-preview-dialog.tsx
│   ├── image-lightbox.tsx
│   ├── related-books-preview.tsx
│   ├── ocr-status-badge.tsx
│   └── ocr-status-checker.tsx
└── timeline/
    ├── timeline-content.tsx
    ├── timeline-group.tsx
    └── timeline-item.tsx

hooks/
├── use-notes.ts
├── use-ocr-status.ts
└── use-mobile-note-sheet.ts

lib/
└── api/
    ├── ocr.ts
    └── cloud-run-ocr.ts

types/
└── note.ts
```

---

## 3. 데이터 모델

### 3.1 테이블

| 테이블 | 설명 |
|--------|------|
| `notes` | 노트 내용 및 메타데이터 |
| `ocr_logs` | OCR 처리 로그 |
| `ocr_usage_stats` | OCR 사용량 통계 |

### 3.2 주요 타입

```typescript
type NoteType = 'memo' | 'transcription' | 'highlight' | 'review'

interface Note {
  id: string
  user_id: string
  book_id: string | null
  title: string | null
  content: string
  note_type: NoteType
  page_number: number | null
  image_urls: string[] | null
  is_public: boolean
  ocr_status: 'pending' | 'processing' | 'completed' | 'failed' | null
  ocr_text: string | null
  created_at: string
  updated_at: string
}
```

---

## 4. 핵심 함수

### 4.1 Server Actions

| 함수 | 파일 | 설명 |
|------|------|------|
| `getNotes()` | `app/actions/notes.ts` | 노트 목록 조회 |
| `getNoteById()` | `app/actions/notes.ts` | 노트 상세 조회 |
| `createNote()` | `app/actions/notes.ts` | 노트 생성 |
| `updateNote()` | `app/actions/notes.ts` | 노트 수정 |
| `deleteNote()` | `app/actions/notes.ts` | 노트 삭제 |
| `processOCR()` | `app/actions/ocr.ts` | OCR 처리 요청 |
| `getOCRStatus()` | `app/actions/ocr.ts` | OCR 상태 조회 |

### 4.2 Hooks

| Hook | 설명 |
|------|------|
| `useNotes()` | 노트 목록 상태 관리 |
| `useOCRStatus()` | OCR 상태 폴링 |
| `useMobileNoteSheet()` | 모바일 노트 시트 상태 |

---

## 5. 의존성

### 5.1 이 모듈이 사용하는 것

- `identity`: 사용자 확인
- `library`: 책 정보 참조
- `shared`: UI 컴포넌트, 유틸리티

### 5.2 이 모듈을 사용하는 것

- `groups`: 그룹 내 노트 공유
- `sharing`: 노트 공유
- `search`: 노트 검색
- `ai`: 노트 컨텍스트 활용
- `home`: 최근 노트 표시

---

## 6. OCR 처리 흐름

```
1. 사용자가 이미지 업로드
   ↓
2. Supabase Storage에 이미지 저장
   ↓
3. OCR API 호출 (Cloud Run)
   ↓
4. ocr_status: 'pending' → 'processing'
   ↓
5. OCR 완료 시 ocr_text 저장
   ↓
6. ocr_status: 'completed'
```

---

## 7. API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/notes` | 노트 목록 조회 |
| POST | `/api/notes` | 노트 생성 |
| GET | `/api/notes/[id]` | 노트 상세 조회 |
| PATCH | `/api/notes/[id]` | 노트 수정 |
| DELETE | `/api/notes/[id]` | 노트 삭제 |
| POST | `/api/ocr` | OCR 처리 요청 |

---

## 8. 참고 문서

- [DATA_MODEL.md](../../database/DATA_MODEL.md)
- [ocr-test-guide.md](../../question/ocr-test-guide.md)
