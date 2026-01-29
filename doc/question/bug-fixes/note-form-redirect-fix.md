# 기록 작성 후 이전 페이지로 이동하는 문제 해결

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0  
**문제:** 기록 작성/수정/삭제 후 이전 페이지로 돌아가는 문제

---

## 🔍 문제 분석

### 발견된 문제

**증상:**
- 기록 작성 후 책 상세 페이지(`/books/${bookId}`)로 이동해야 하는데 이전 페이지로 돌아감
- 기록 수정 후 기록 상세 페이지로 이동해야 하는데 이전 페이지로 돌아감
- 기록 삭제 후 기록 목록 페이지로 이동해야 하는데 이전 페이지로 돌아감

**원인 분석:**

#### router.push와 router.refresh() 동시 호출 문제

Next.js App Router에서 `router.push()`와 `router.refresh()`를 동시에 호출하면 예상치 못한 동작이 발생할 수 있습니다:

1. **타이밍 이슈**: `router.push()`는 비동기적으로 작동하는데, `router.refresh()`가 즉시 호출되면 현재 페이지(기록 작성 페이지)를 새로고침하게 됨
2. **히스토리 스택 충돌**: 두 함수가 동시에 호출되면 브라우저 히스토리 스택에 문제가 발생할 수 있음
3. **불필요한 호출**: Next.js 13+ App Router에서는 `router.push()`가 자동으로 서버 컴포넌트를 다시 렌더링하므로 `router.refresh()`가 필요 없음

---

## ✅ 해결 방법

### 1. 기록 작성 폼 수정

**파일**: `components/notes/note-form.tsx`

**변경 사항**:
- `router.refresh()` 제거
- `router.push()`만 사용

**수정 전**:
```typescript
toast.success("기록이 저장되었습니다.");
router.push(`/books/${bookId}`);
router.refresh();
```

**수정 후**:
```typescript
toast.success("기록이 저장되었습니다.");
// router.push만 사용 (Next.js App Router가 자동으로 서버 컴포넌트를 다시 렌더링)
// router.refresh()는 제거 - push와 동시에 호출하면 이전 페이지로 돌아가는 문제 발생
router.push(`/books/${bookId}`);
```

### 2. 기록 수정 폼 수정

**파일**: `components/notes/note-edit-form.tsx`

**변경 사항**:
- `router.refresh()` 제거
- `router.push()`만 사용

**수정 전**:
```typescript
toast.success("기록이 수정되었습니다.");
router.push(`/notes/${note.id}`);
router.refresh();
```

**수정 후**:
```typescript
toast.success("기록이 수정되었습니다.");
// router.push만 사용 (Next.js App Router가 자동으로 서버 컴포넌트를 다시 렌더링)
router.push(`/notes/${note.id}`);
```

### 3. 기록 삭제 액션 수정

**파일**: `components/notes/note-actions.tsx`

**변경 사항**:
- `router.refresh()` 제거
- `router.push()`만 사용

**수정 전**:
```typescript
await deleteNote(noteId);
toast.success("기록이 삭제되었습니다.");
router.push("/notes");
router.refresh();
```

**수정 후**:
```typescript
await deleteNote(noteId);
toast.success("기록이 삭제되었습니다.");
// router.push만 사용 (Next.js App Router가 자동으로 서버 컴포넌트를 다시 렌더링)
router.push("/notes");
```

---

## 📋 Next.js App Router 네비게이션 가이드

### router.push() 사용 시

- **자동 리프레시**: `router.push()`는 자동으로 서버 컴포넌트를 다시 렌더링합니다
- **캐시 무효화**: `revalidatePath()`를 서버 액션에서 호출하면 해당 경로의 캐시가 무효화됩니다
- **추가 refresh 불필요**: `router.refresh()`를 별도로 호출할 필요가 없습니다

### router.refresh() 사용 시기

`router.refresh()`는 다음 경우에만 사용해야 합니다:

1. **현재 페이지 새로고침**: 같은 페이지에서 데이터를 다시 가져와야 할 때
2. **서버 액션 후 현재 페이지 유지**: 폼 제출 후 같은 페이지에 머물면서 데이터만 갱신할 때

**예시**:
```typescript
// 같은 페이지에서 데이터만 갱신
await updateProfile(data);
router.refresh(); // 현재 페이지 새로고침
```

### router.push()와 router.refresh() 함께 사용하지 않기

❌ **잘못된 사용**:
```typescript
router.push("/new-page");
router.refresh(); // 문제 발생 가능
```

✅ **올바른 사용**:
```typescript
// 옵션 1: push만 사용 (권장)
router.push("/new-page");

// 옵션 2: 현재 페이지에서만 refresh
router.refresh();

// 옵션 3: push 후 약간의 지연을 두고 refresh (비권장)
router.push("/new-page");
setTimeout(() => router.refresh(), 100);
```

---

## 🧪 테스트 방법

### 1. 기록 작성 테스트

1. 책 상세 페이지에서 "기록 작성" 버튼 클릭
2. 기록 작성 폼 작성
3. "저장" 버튼 클릭
4. **확인**: 책 상세 페이지(`/books/${bookId}`)로 정상 이동하는지 확인
5. **확인**: 작성한 기록이 목록에 표시되는지 확인

### 2. 기록 수정 테스트

1. 기록 상세 페이지에서 "수정" 버튼 클릭
2. 기록 내용 수정
3. "저장" 버튼 클릭
4. **확인**: 기록 상세 페이지(`/notes/${noteId}`)로 정상 이동하는지 확인
5. **확인**: 수정한 내용이 반영되었는지 확인

### 3. 기록 삭제 테스트

1. 기록 상세 페이지에서 "삭제" 버튼 클릭
2. 확인 대화상자에서 "확인" 클릭
3. **확인**: 기록 목록 페이지(`/notes`)로 정상 이동하는지 확인
4. **확인**: 삭제한 기록이 목록에서 사라졌는지 확인

---

## 🔧 추가 개선 사항

### 서버 액션에서 revalidatePath 사용

서버 액션(`app/actions/notes.ts`)에서 이미 `revalidatePath()`를 사용하고 있어 추가 작업이 필요 없습니다:

```typescript
// app/actions/notes.ts
export async function createNote(data: CreateNoteInput) {
  // ... 기록 생성 로직 ...
  
  revalidatePath("/notes");
  revalidatePath(`/books/${data.book_id}`);
  revalidatePath(`/notes/${note.id}`);
  
  return { success: true, noteId: note.id };
}
```

이렇게 하면 `router.push()`로 이동한 페이지에서 자동으로 최신 데이터를 가져옵니다.

---

## 📝 수정된 파일 목록

1. `components/notes/note-form.tsx` - 기록 작성 후 리다이렉트 수정
2. `components/notes/note-edit-form.tsx` - 기록 수정 후 리다이렉트 수정
3. `components/notes/note-actions.tsx` - 기록 삭제 후 리다이렉트 수정

---

## 🔗 관련 문서

- [Next.js App Router 문서](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating)
- [Next.js router.refresh() 문서](https://nextjs.org/docs/app/api-reference/functions/use-router#refresh)

---

**문서 끝**

