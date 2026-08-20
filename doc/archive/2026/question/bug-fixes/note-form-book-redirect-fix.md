# 기록 작성 후 /books 페이지로 리다이렉트되는 문제 해결

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0  
**문제:** 책 선택 후 기록 작성 시 다시 /books 페이지로 넘어가는 문제

---

## 🔍 문제 분석

### 발견된 문제

**증상:**
- `/books` 페이지에서 책을 선택한 후 기록 작성 시도
- 기록 작성 후 `/books/${bookId}` 페이지로 이동해야 하는데 `/books` 페이지로 돌아감
- 해당 책 정보의 데이터를 연결해서 작업이 안 되는 것으로 보임

**원인 분석:**

#### 1. bookId 검증 부족
- `note-form.tsx`의 `onSubmit` 함수에서 `bookId`가 유효한지 확인하지 않음
- `bookId`가 없거나 유효하지 않으면 `/books/${bookId}`로 리다이렉트할 때 404 오류 발생 가능
- 404 오류 후 자동으로 `/books`로 리다이렉트될 수 있음

#### 2. Next.js 15+ searchParams 처리 문제
- Next.js 15+ 에서 `searchParams`가 Promise일 수 있음
- `searchParams`를 직접 사용하면 제대로 동작하지 않을 수 있음
- `await searchParams`로 처리해야 함

---

## ✅ 해결 방법

### 1. note-form.tsx에서 bookId 검증 추가

**파일**: `components/notes/note-form.tsx`

**변경 사항**:
- `onSubmit` 함수 시작 부분에 `bookId` 검증 로직 추가
- `bookId`가 유효하지 않으면 에러 메시지 표시 후 `/books`로 리다이렉트
- 리다이렉트 전에 `bookId` 유효성 재확인

**수정 내용**:
```typescript
const onSubmit = async (data: NoteFormValues) => {
  try {
    // bookId 검증
    if (!bookId || typeof bookId !== 'string' || bookId.trim() === '') {
      console.error("NoteForm: bookId가 유효하지 않습니다.", { bookId });
      toast.error("책 정보를 찾을 수 없습니다. 다시 시도해주세요.");
      router.push("/books");
      return;
    }

    // ... 기록 생성 로직 ...

    toast.success("기록이 저장되었습니다.");
    // bookId가 유효한지 다시 한 번 확인 후 리다이렉트
    if (bookId && typeof bookId === 'string' && bookId.trim() !== '') {
      router.push(`/books/${bookId}`);
    } else {
      console.error("NoteForm: 리다이렉트 시 bookId가 유효하지 않습니다.", { bookId });
      toast.error("책 정보를 찾을 수 없습니다.");
      router.push("/books");
    }
  } catch (error) {
    // ... 에러 처리 ...
  }
};
```

### 2. Next.js 15+ searchParams 처리 수정

**파일**: `app/(main)/notes/new/page.tsx`

**변경 사항**:
- `searchParams`를 Promise로 처리
- `await searchParams`로 Promise 해결

**수정 내용**:
```typescript
interface NewNotePageProps {
  searchParams: Promise<{
    bookId?: string;
  }> | {
    bookId?: string;
  };
}

export default async function NewNotePage({ searchParams }: NewNotePageProps) {
  // Next.js 15+ 에서 searchParams는 Promise일 수 있음
  const resolvedSearchParams = await (searchParams instanceof Promise ? searchParams : Promise.resolve(searchParams));
  const bookId = resolvedSearchParams.bookId;
  
  // ... 나머지 코드 ...
}
```

---

## 🧪 테스트 방법

### 1. 기록 작성 테스트

1. `/books` 페이지에서 책 클릭하여 책 상세 페이지(`/books/${bookId}`)로 이동
2. "기록 작성" 버튼 클릭
3. 기록 작성 폼 작성
4. "저장" 버튼 클릭
5. **확인**: 책 상세 페이지(`/books/${bookId}`)로 정상 이동하는지 확인
6. **확인**: 작성한 기록이 목록에 표시되는지 확인

### 2. bookId 유효성 검증 테스트

1. 브라우저 개발자 도구 콘솔 열기
2. `/books` 페이지에서 책 클릭
3. 기록 작성 페이지로 이동
4. 기록 작성 후 저장
5. **확인**: 콘솔에 `bookId` 관련 에러가 없는지 확인
6. **확인**: 정상적으로 책 상세 페이지로 이동하는지 확인

### 3. 에러 케이스 테스트

1. 브라우저 개발자 도구에서 `bookId`를 강제로 제거하거나 잘못된 값으로 변경
2. 기록 작성 시도
3. **확인**: 에러 메시지가 표시되는지 확인
4. **확인**: `/books` 페이지로 리다이렉트되는지 확인

---

## 📋 수정된 파일 목록

1. `components/notes/note-form.tsx` - bookId 검증 로직 추가
2. `app/(main)/notes/new/page.tsx` - Next.js 15+ searchParams 처리 수정

---

## 🔗 관련 문서

- [Next.js App Router 문서](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating)
- [Next.js 15 변경사항](https://nextjs.org/docs/app/api-reference/functions/use-router)
- [기록 작성 후 이전 페이지로 이동하는 문제 해결](./note-form-redirect-fix.md)

---

## 💡 추가 개선 사항

### 향후 개선 가능한 부분

1. **에러 처리 개선**: `bookId`가 유효하지 않을 때 더 명확한 에러 메시지 표시
2. **로깅 개선**: `bookId` 관련 문제 발생 시 더 자세한 로그 기록
3. **사용자 경험 개선**: 에러 발생 시 사용자에게 더 친절한 안내 메시지 제공

---

**문서 끝**

