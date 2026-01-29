# 저장한 기록이 목록에 보이지 않는 문제 해결

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0  
**문제:** 기록 저장 후 오류는 없지만 기록 데이터에 보이지 않는 문제

---

## 🔍 문제 분석

### 발견된 문제

**증상:**
- 기록을 저장한 후 "기록이 저장되었습니다." 메시지가 표시됨
- 오류는 발생하지 않음
- 하지만 책 상세 페이지의 기록 목록에 저장한 기록이 보이지 않음

**원인 분석:**

#### ID 불일치 문제

1. **데이터베이스 구조:**
   - `user_books` 테이블: `id` (user_books.id), `book_id` (books.id 참조)
   - `notes` 테이블: `book_id` (books.id 참조)

2. **함수 간 ID 전달 불일치:**
   - `NotesList` 컴포넌트: `bookId={userBook.id}` 전달 (user_books.id)
   - `getNotes` 함수: `bookId`를 `notes.book_id`와 직접 비교 (books.id)
   - 결과: `user_books.id`와 `notes.book_id`를 비교하므로 매칭되지 않음

3. **기록 생성 과정:**
   - `createNote` 함수는 `data.book_id`로 `user_books.id`를 받음
   - 내부에서 `user_books` 테이블에서 `book_id`를 조회
   - `notes.book_id`에 `books.id`를 저장 (정상)

4. **기록 조회 과정:**
   - `getNotes` 함수는 `bookId`로 `user_books.id`를 받음
   - `notes.book_id`와 직접 비교 (books.id)
   - 결과: 매칭되지 않아 기록이 조회되지 않음

---

## ✅ 해결 방법

### getNotes 함수 수정

**파일**: `app/actions/notes.ts`

**변경 사항**:
- `bookId`가 `user_books.id`인 경우를 처리하도록 수정
- `user_books` 테이블에서 `book_id`를 조회한 후 `notes.book_id`와 비교

**수정 내용**:
```typescript
export async function getNotes(bookId?: string, type?: NoteType) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // ... 게스트 사용자 처리 ...

  // 인증된 사용자는 기존 로직 사용
  let actualBookId = bookId;

  // bookId가 user_books.id인 경우, books.id를 조회해야 함
  if (bookId && isValidUUID(bookId)) {
    const { data: userBook, error: userBookError } = await supabase
      .from("user_books")
      .select("book_id")
      .eq("id", bookId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!userBookError && userBook) {
      // user_books.id를 받았으므로 books.id로 변환
      actualBookId = userBook.book_id;
    }
    // userBook이 없으면 bookId가 이미 books.id일 수 있으므로 그대로 사용
  }

  let query = supabase
    .from("notes")
    .select(
      `
      *,
      books (
        id,
        title,
        author,
        cover_image_url
      )
    `
    )
    .eq("user_id", user.id)
    .order("page_number", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (actualBookId) {
    query = query.eq("book_id", actualBookId);
  }

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(sanitizeErrorMessage(error));
  }

  return data || [];
}
```

---

## 🧪 테스트 방법

### 1. 기록 저장 및 조회 테스트

1. 책 상세 페이지(`/books/${userBookId}`)로 이동
2. "기록 작성" 버튼 클릭
3. 기록 작성 폼 작성 (예: 필사 내용 입력)
4. "저장" 버튼 클릭
5. **확인**: "기록이 저장되었습니다." 메시지 표시
6. **확인**: 책 상세 페이지로 리다이렉트
7. **확인**: 기록 목록에 방금 저장한 기록이 표시되는지 확인

### 2. 다양한 기록 유형 테스트

1. 필사(quote) 기록 저장 및 조회
2. 메모(memo) 기록 저장 및 조회
3. 사진(photo) 기록 저장 및 조회
4. 필사 이미지(transcription) 기록 저장 및 조회
5. **확인**: 모든 유형의 기록이 목록에 표시되는지 확인

### 3. 여러 기록 저장 테스트

1. 같은 책에 여러 개의 기록 저장
2. **확인**: 모든 기록이 목록에 표시되는지 확인
3. **확인**: 기록이 최신순으로 정렬되어 표시되는지 확인

---

## 📋 데이터베이스 구조 이해

### 테이블 관계

```
users
  └── user_books (user_id, book_id)
        └── books (id)
              └── notes (book_id)
```

### ID 흐름

1. **기록 생성 시:**
   - 입력: `user_books.id` (예: `uuid-123`)
   - 처리: `user_books`에서 `book_id` 조회 (예: `uuid-456`)
   - 저장: `notes.book_id = uuid-456` (books.id)

2. **기록 조회 시 (수정 전):**
   - 입력: `user_books.id` (예: `uuid-123`)
   - 비교: `notes.book_id = uuid-123` ❌ (매칭 안 됨)

3. **기록 조회 시 (수정 후):**
   - 입력: `user_books.id` (예: `uuid-123`)
   - 처리: `user_books`에서 `book_id` 조회 (예: `uuid-456`)
   - 비교: `notes.book_id = uuid-456` ✅ (매칭됨)

---

## 🔗 관련 문서

- [기록 작성 후 /books 페이지로 리다이렉트되는 문제 해결](./note-form-book-redirect-fix.md)
- [데이터베이스 스키마](../database/schema.sql)

---

## 💡 추가 개선 사항

### 향후 개선 가능한 부분

1. **타입 안정성 개선**: `bookId`의 타입을 명확히 구분 (user_books.id vs books.id)
2. **함수 시그니처 개선**: `getNotes` 함수의 파라미터 이름을 더 명확하게 변경
3. **에러 처리 개선**: `user_books` 조회 실패 시 더 명확한 에러 메시지 제공

---

**문서 끝**

