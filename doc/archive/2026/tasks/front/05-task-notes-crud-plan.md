# TASK-05: 기록 기능 (CRUD)

**작업 ID:** TASK-05  
**우선순위:** P0 (Must Have)  
**예상 소요 시간:** 4일  
**의존성:** TASK-01, TASK-02, TASK-03, TASK-04  
**다음 작업:** TASK-06, TASK-07, TASK-08

---

## 작업 개요

기록 작성(필사, 사진, 메모), 이미지 업로드, OCR 처리 연동, 기록 조회 및 수정/삭제 기능을 구현합니다. 이 작업은 검색, 공유, 타임라인 기능의 기반이 됩니다.

---

## 작업 범위

### 포함 사항
- ✅ 기록 작성 (필사 텍스트, 필사 이미지, 사진, 메모)
- ✅ 이미지 업로드
- ✅ OCR 처리 연동 (비동기)
- ✅ 기록 조회 및 수정/삭제
- ✅ 기록 목록 표시
- ✅ 페이지 순서 정렬
- ✅ Server Actions 및 API Routes

### 제외 사항
- ❌ 검색 기능 (TASK-06)
- ❌ 공유 기능 (TASK-07)
- ❌ 타임라인 (TASK-08)

---

## 상세 작업 목록

### 1. 기록 작성 페이지

**파일:**
- `app/(main)/notes/new/page.tsx` - 기록 작성

**기능:**
- 기록 유형 선택 (필사, 사진, 메모)
- 텍스트 입력 (필사, 메모)
- 이미지 업로드 (필사 이미지, 사진)
- 페이지 번호 입력
- 태그 입력
- 공개 설정

### 2. 기록 상세 및 수정 페이지

**파일:**
- `app/(main)/notes/[id]/page.tsx` - 기록 상세
- `app/(main)/notes/[id]/edit/page.tsx` - 기록 수정

**기능:**
- 기록 상세 표시
- 기록 수정
- 기록 삭제
- OCR 결과 확인 및 수정

### 3. 기록 목록 페이지

**파일:**
- `app/(main)/notes/page.tsx` - 기록 목록

**기능:**
- 기록 목록 표시
- 유형별 필터
- 정렬 옵션

### 4. 기록 관련 컴포넌트

**파일:**
- `components/notes/note-card.tsx` - 기록 카드
- `components/notes/note-form.tsx` - 기록 작성 폼
- `components/notes/note-list.tsx` - 기록 목록
- `components/notes/note-type-tabs.tsx` - 유형 탭

### 5. 이미지 업로드 API

**파일:**
- `app/api/upload/route.ts` - 파일 업로드

**기능:**
- 이미지 업로드 (Supabase Storage)
- 파일 크기 제한 (5MB)
- 자동 압축 (5MB 초과 시)
- 이미지 최적화

### 6. OCR 처리 API

**파일:**
- `app/api/ocr/route.ts` - OCR 처리 요청
- `app/api/ocr/process/route.ts` - OCR 실제 처리 (Queue)

**기능:**
- OCR 처리 요청 (즉시 응답)
- Queue에 작업 추가
- OCR 처리 (Gemini API)
- 결과 저장

### 7. Server Actions

**파일:**
- `app/actions/notes.ts` - 기록 관련 Server Actions

**기능:**
- 기록 생성
- 기록 수정
- 기록 삭제
- 기록 조회

### 8. API 클라이언트 및 Hooks

**파일:**
- `lib/api/notes.ts` - 기록 API 클라이언트
- `hooks/use-notes.ts` - 기록 관련 커스텀 훅

---

## 파일 구조

```
app/
├── (main)/
│   └── notes/
│       ├── page.tsx              # 기록 목록
│       ├── new/
│       │   └── page.tsx          # 기록 작성
│       └── [id]/
│           ├── page.tsx          # 기록 상세
│           └── edit/
│               └── page.tsx      # 기록 수정
└── api/
    ├── upload/
    │   └── route.ts
    └── ocr/
        ├── route.ts              # OCR 요청
        └── process/
            └── route.ts          # OCR 처리

components/
└── notes/
    ├── note-card.tsx
    ├── note-form.tsx
    ├── note-list.tsx
    └── note-type-tabs.tsx

lib/
└── api/
    └── notes.ts

hooks/
└── use-notes.ts

app/
└── actions/
    └── notes.ts
```

---

## API 인터페이스

### Server Actions

```typescript
// app/actions/notes.ts
export async function createNote(data: {
  bookId: string;
  type: 'quote' | 'photo' | 'memo' | 'transcription';
  content?: string;
  imageUrl?: string;
  pageNumber?: number;
  tags?: string[];
  isPublic?: boolean;
}) {
  // 기록 생성
}

export async function updateNote(
  noteId: string,
  data: Partial<CreateNoteInput>
) {
  // 기록 수정
}

export async function deleteNote(noteId: string) {
  // 기록 삭제
}

export async function getNotes(bookId?: string) {
  // 기록 목록 조회
}

export async function getNoteDetail(noteId: string) {
  // 기록 상세 조회
}
```

### API Routes

```typescript
// app/api/upload/route.ts
export async function POST(request: Request) {
  // 이미지 업로드 (FormData)
  // 반환: { url: string }
}

// app/api/ocr/route.ts
export async function POST(request: Request) {
  // OCR 처리 요청 (즉시 응답, Queue에 추가)
  // 반환: { success: true, noteId: string }
}

// app/api/ocr/process/route.ts
export async function POST(request: Request) {
  // OCR 실제 처리 (Queue에서 호출)
  // 반환: { success: true }
}
```

---

## 사용자 스토리 매핑

- US-010: 필사 텍스트 입력
- US-011: 필사 이미지 업로드
- US-012: OCR 텍스트 추출 (비동기)
- US-013: 책 페이지 사진 업로드
- US-014: 다중 사진 일괄 업로드
- US-015: 메모 작성
- US-016: 기록 자동 정리
- US-017: 페이지 순서 자동 정렬
- US-018: 기록 수정 및 삭제

---

## 검증 체크리스트

- [x] 기록 작성이 정상 작동함 (모든 유형)
- [x] 이미지 업로드가 정상 작동함
- [x] OCR 처리가 비동기로 정상 작동함
- [x] 기록 목록이 정상 조회됨
- [x] 기록 수정/삭제가 정상 작동함
- [x] 페이지 순서 정렬이 정상 작동함
- [x] 다중 이미지 업로드가 정상 작동함
- [x] 태그 기능이 정상 작동함

---

## 개발 프롬프트

```
다음 문서들을 참고하여 기록 기능을 구현해주세요.

참고 문서:
- doc/user_stories.md (US-010~US-018)
- doc/software_design.md (6.2.2 Gemini API, 6.3 파일 업로드, 4.2.4 Notes)
- doc/Habitree-Reading-Hub-PRD.md (4.1.3 기록 기능)
- doc/review_issues.md (4. OCR 처리 방식 - 비동기 Queue)

작업 내용:
1. 기록 작성 페이지 구현:
   - 기록 유형 선택 (필사, 사진, 메모)
   - 텍스트 입력
   - 이미지 업로드 (단일/다중)
   - 페이지 번호, 태그, 공개 설정
2. 기록 상세 및 수정 페이지 구현
3. 기록 목록 페이지 구현
4. 이미지 업로드 API 구현 (app/api/upload/route.ts)
5. OCR 처리 API 구현 (비동기 Queue 방식):
   - app/api/ocr/route.ts: 요청 받아서 Queue에 추가
   - app/api/ocr/process/route.ts: 실제 OCR 처리
6. Server Actions 구현
7. API 클라이언트 및 Hooks 구현

주의사항:
- review_issues.md의 4번 이슈 참고: OCR은 비동기 Queue 방식
- 이미지 업로드 경로: ${type}s/${userId}/${timestamp}-${random}.${ext}
- 파일 크기 제한 5MB, 초과 시 자동 압축
- OCR 처리 중 상태 표시 필요
- 다중 이미지 업로드 시 진행률 표시
- 페이지 순서 정렬: page_number ASC NULLS LAST, created_at DESC

완료 후:
- 각 함수에 JSDoc 주석 추가
- 에러 처리 로직 추가
- 로딩 상태 처리
```

---

## 참고 문서

### 필수 참고
- [user_stories.md](../../user_stories.md) - US-010~US-018
- [software_design.md](../../software_design.md) - 6.2.2 Gemini API, 6.3 파일 업로드
- [review_issues.md](../../review_issues.md) - 4. OCR 처리 방식, 7. 이미지 업로드 경로

### 추가 참고
- [Gemini API 문서](https://ai.google.dev/docs)
- [Supabase Storage 문서](https://supabase.com/docs/guides/storage)

---

**문서 끝**

