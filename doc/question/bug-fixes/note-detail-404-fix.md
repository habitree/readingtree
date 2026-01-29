# 기록 조회 시 404 오류 해결

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0  
**문제:** 기록 상세 페이지 조회 시 404 오류 발생

---

## 🔍 문제 분석

### 발견된 문제

**증상:**
- 기록 목록에서 기록을 클릭하면 404 오류 발생
- 기록 상세 페이지(`/notes/${noteId}`)에 접근할 수 없음
- 기록 수정 페이지도 동일한 문제 발생

**원인 분석:**

#### 1. Next.js 15+ params Promise 처리 문제
- Next.js 15+ 에서 동적 라우트의 `params`가 Promise로 변경됨
- `params.id`를 직접 사용하면 제대로 동작하지 않을 수 있음
- `await params`로 처리해야 함

#### 2. 책 링크 ID 불일치 문제
- 기록 상세 페이지에서 책 링크가 `books.id`를 사용
- 책 상세 페이지는 `user_books.id`를 필요로 함
- 결과: 책 링크 클릭 시 404 오류 발생

---

## ✅ 해결 방법

### 1. 기록 상세 페이지 Next.js 15+ 호환성 수정

**파일**: `app/(main)/notes/[id]/page.tsx`

**변경 사항**:
- `params`를 `await`로 처리하여 Promise 해결
- 더 자세한 에러 로깅 추가

**수정 내용**:
```typescript
export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  // Next.js 15+ 에서 params는 Promise일 수 있음
  const resolvedParams = await params;
  const noteId = resolvedParams.id;

  // params.id 검증
  if (!noteId || typeof noteId !== 'string') {
    console.error("NoteDetailPage: noteId가 유효하지 않습니다.", { noteId, params: resolvedParams });
    notFound();
  }

  // UUID 검증
  if (!isValidUUID(noteId)) {
    console.error("NoteDetailPage: noteId가 유효한 UUID가 아닙니다.", { noteId });
    notFound();
  }

  let note;
  try {
    console.log("NoteDetailPage: 기록 상세 조회 시도", { noteId });
    note = await getNoteDetail(noteId);
    console.log("NoteDetailPage: 기록 상세 조회 성공", { noteId, hasNote: !!note });
  } catch (error) {
    // ... 에러 처리 ...
  }
}
```

### 2. 기록 수정 페이지 Next.js 15+ 호환성 수정

**파일**: `app/(main)/notes/[id]/edit/page.tsx`

**변경 사항**:
- `params`를 `await`로 처리하여 Promise 해결
- 더 자세한 에러 로깅 추가

### 3. getNoteDetail 함수 수정 - user_books.id 추가

**파일**: `app/actions/notes.ts`

**변경 사항**:
- `getNoteDetail` 함수에서 `user_books.id`도 함께 조회하여 반환
- 기록 상세 페이지에서 책 링크에 사용

**수정 내용**:
```typescript
export async function getNoteDetail(noteId: string) {
  // ... 기존 코드 ...

  // user_books.id 조회 (책 상세 페이지 링크용)
  let userBookId = null;
  if (data.book_id) {
    const { data: userBook } = await supabase
      .from("user_books")
      .select("id")
      .eq("book_id", data.book_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (userBook) {
      userBookId = userBook.id;
    }
  }

  return {
    ...data,
    user_book_id: userBookId,
  };
}
```

### 4. 기록 상세 페이지 책 링크 수정

**파일**: `app/(main)/notes/[id]/page.tsx`

**변경 사항**:
- 책 링크에서 `books.id` 대신 `user_books.id` 사용

**수정 내용**:
```typescript
{note.book && (
  <div className="flex items-center gap-2">
    <Link 
      href={note.user_book_id ? `/books/${note.user_book_id}` : '#'} 
      className="text-sm text-muted-foreground hover:text-foreground"
    >
      {note.book.title}
    </Link>
    {/* ... */}
  </div>
)}
```

---

## 🧪 테스트 방법

### 1. 기록 상세 페이지 테스트

1. 로그인 후 책 상세 페이지로 이동
2. 기록 작성 후 저장
3. 기록 목록에서 기록 클릭
4. **확인**: 기록 상세 페이지가 정상적으로 표시되는지 확인
5. **확인**: 책 제목 링크 클릭 시 책 상세 페이지로 이동하는지 확인

### 2. 기록 수정 페이지 테스트

1. 기록 상세 페이지에서 "수정" 버튼 클릭
2. **확인**: 기록 수정 페이지가 정상적으로 표시되는지 확인
3. 기록 내용 수정 후 저장
4. **확인**: 기록 상세 페이지로 정상적으로 리다이렉트되는지 확인

### 3. 다양한 기록 유형 테스트

1. 필사(quote) 기록 상세 조회
2. 메모(memo) 기록 상세 조회
3. 사진(photo) 기록 상세 조회
4. 필사 이미지(transcription) 기록 상세 조회
5. **확인**: 모든 유형의 기록이 정상적으로 표시되는지 확인

---

## 📋 수정된 파일 목록

1. `app/(main)/notes/[id]/page.tsx` - Next.js 15+ 호환성 및 책 링크 수정
2. `app/(main)/notes/[id]/edit/page.tsx` - Next.js 15+ 호환성 수정
3. `app/actions/notes.ts` - getNoteDetail 함수에 user_books.id 추가

---

## 🔗 관련 문서

- [Next.js 15 변경사항](https://nextjs.org/docs/app/api-reference/functions/use-router)
- [책 클릭 404 오류 해결](./book-404-error-debugging.md)
- [저장한 기록이 목록에 보이지 않는 문제 해결](./notes-not-appearing-fix.md)

---

## 💡 추가 개선 사항

### 향후 개선 가능한 부분

1. **타입 안정성 개선**: `user_book_id`를 타입에 명시적으로 추가
2. **에러 처리 개선**: `user_books.id` 조회 실패 시 더 명확한 에러 메시지 제공
3. **성능 최적화**: `user_books.id` 조회를 캐싱하거나 최적화

---

**문서 끝**

