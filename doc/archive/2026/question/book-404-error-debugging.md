# 내서재 404 오류 디버깅 및 해결

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0  
**문제:** 내서재에서 책 클릭 시 404 오류 발생

---

## 🔍 문제 분석

### 발견된 문제

**증상:**
- 내서재에서 등록된 책을 클릭하면 `404 This page could not be found.` 오류 발생
- 브라우저 콘솔에 `favicon.ico:1 Failed to load resource: the server responded with a status of 404` 오류

**원인 분석:**

#### 1. Next.js 15 params 처리 문제
- Next.js 15+ 에서 동적 라우트의 `params`가 Promise로 변경됨
- `params.id`를 직접 사용하면 제대로 동작하지 않을 수 있음
- `await params`로 처리해야 함

#### 2. favicon.ico 파일 누락
- `public/favicon.ico` 파일이 없어서 404 오류 발생
- 브라우저가 자동으로 `/favicon.ico`를 요청하지만 파일이 없음

#### 3. 에러 로깅 부족
- `getBookDetail` 함수에서 실제 오류 원인을 파악하기 어려움
- 디버깅을 위한 로그가 부족함

---

## ✅ 해결 방법

### 1. Next.js 15 params 처리 수정

**파일**: `app/(main)/books/[id]/page.tsx`

**변경 사항**:
- `params`를 `await`로 처리하여 Promise 해결
- 더 자세한 에러 로깅 추가

**수정 내용**:
```typescript
export default async function BookDetailPage({ params }: BookDetailPageProps) {
  // Next.js 15+ 에서 params는 Promise일 수 있음
  const resolvedParams = await params;
  const bookId = resolvedParams.id;

  // params.id 검증
  if (!bookId || typeof bookId !== 'string') {
    console.error("BookDetailPage: bookId가 유효하지 않습니다.", { bookId, params: resolvedParams });
    notFound();
  }

  // ... 나머지 코드
}
```

### 2. getBookDetail 함수 에러 로깅 개선

**파일**: `app/actions/books.ts`

**변경 사항**:
- Supabase 쿼리 오류 시 상세 로그 추가
- 데이터가 없을 때 명확한 에러 메시지

**수정 내용**:
```typescript
console.log("getBookDetail: 책 상세 조회 시작", { userBookId, userId: user.id });

const { data, error } = await supabase
  .from("user_books")
  .select(/* ... */)
  .eq("id", userBookId)
  .eq("user_id", user.id)
  .single();

if (error) {
  console.error("getBookDetail: Supabase 쿼리 오류", {
    userBookId,
    userId: user.id,
    error: error.message,
    errorCode: error.code,
    errorDetails: error.details,
    errorHint: error.hint,
  });
  throw new Error(`책 상세 조회 실패: ${error.message || "책을 찾을 수 없습니다."}`);
}
```

### 3. BookCard 컴포넌트 디버깅 로그 추가

**파일**: `components/books/book-card.tsx`

**변경 사항**:
- 클릭 시 userBookId 확인 로그 추가
- onClick 핸들러 개선

**수정 내용**:
```typescript
const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
  if (isSample) {
    e.preventDefault();
    // ... 샘플 데이터 처리
    return;
  }

  // 디버깅: 클릭 시 userBookId 확인
  console.log("BookCard: 책 클릭", {
    userBookId,
    bookTitle: book.title,
    href: `/books/${userBookId}`,
  });
};
```

### 4. favicon.ico 파일 추가

**파일**: `public/favicon.ico`

**변경 사항**:
- `public/favicon.ico` 파일 생성
- `app/layout.tsx`에 icons 메타데이터 추가

**수정 내용**:
```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: "Habitree Reading Hub",
  description: "독서 기록 및 공유 플랫폼",
  icons: {
    icon: "/favicon.ico",
  },
};
```

---

## 🧪 테스트 방법

### 1. 브라우저 개발자 도구 확인

1. 내서재 페이지에서 책 클릭
2. 브라우저 개발자 도구 콘솔 확인:
   - `BookCard: 책 클릭` 로그 확인
   - `BookDetailPage: 책 상세 조회 시도` 로그 확인
   - `getBookDetail: 책 상세 조회 시작` 로그 확인
   - 에러 메시지 확인

### 2. 네트워크 탭 확인

1. 브라우저 개발자 도구 → Network 탭
2. 책 클릭 시 `/books/[id]` 요청 확인
3. 응답 상태 코드 확인 (200이어야 함)

### 3. Supabase 데이터 확인

1. Supabase 대시보드에서 `user_books` 테이블 확인
2. 클릭한 책의 `id`와 `user_id` 확인
3. `getBookDetail` 함수의 쿼리 조건과 일치하는지 확인

---

## 🔧 추가 디버깅 팁

### 콘솔 로그 확인 순서

1. **BookCard 클릭 시**:
   ```
   BookCard: 책 클릭 { userBookId: "...", bookTitle: "...", href: "/books/..." }
   ```

2. **페이지 로드 시**:
   ```
   BookDetailPage: 책 상세 조회 시도 { bookId: "..." }
   getBookDetail: 책 상세 조회 시작 { userBookId: "...", userId: "..." }
   ```

3. **성공 시**:
   ```
   getBookDetail: 책 상세 조회 성공 { userBookId: "...", bookId: "...", bookTitle: "..." }
   BookDetailPage: 책 상세 조회 성공 { bookId: "...", hasBook: true }
   ```

4. **실패 시**:
   ```
   getBookDetail: Supabase 쿼리 오류 { ... }
   또는
   getBookDetail: 데이터가 없습니다 { ... }
   책 상세 조회 오류: { ... }
   ```

### 일반적인 오류 원인

1. **userBookId가 undefined 또는 빈 문자열**
   - `BookList` 또는 `BookCard`에서 `userBook.id`가 제대로 전달되지 않음
   - `getUserBooks` 함수에서 반환하는 데이터 구조 확인

2. **user_id 불일치**
   - 로그인한 사용자와 `user_books` 테이블의 `user_id`가 일치하지 않음
   - 세션 만료 또는 다른 사용자로 로그인한 경우

3. **UUID 형식 오류**
   - `userBookId`가 유효한 UUID 형식이 아님
   - `isValidUUID` 함수 검증 실패

4. **Supabase RLS 정책**
   - Row Level Security 정책으로 인해 데이터 접근 불가
   - Supabase 대시보드에서 RLS 정책 확인

---

## 📋 체크리스트

문제 해결을 위해 다음을 확인하세요:

- [ ] 브라우저 콘솔에서 `BookCard: 책 클릭` 로그 확인
- [ ] `userBookId`가 유효한 UUID 형식인지 확인
- [ ] `BookDetailPage: 책 상세 조회 시도` 로그 확인
- [ ] `getBookDetail: 책 상세 조회 시작` 로그 확인
- [ ] Supabase 쿼리 오류 메시지 확인
- [ ] `user_books` 테이블에 해당 ID가 존재하는지 확인
- [ ] 로그인한 사용자의 `user_id`와 `user_books.user_id`가 일치하는지 확인
- [ ] favicon.ico 404 오류가 해결되었는지 확인

---

## 🔗 관련 문서

- [404 오류 및 Mixed Content 해결](./book-click-404-mixed-content-issue.md)
- [Next.js 15 App Router 문서](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)

---

**문서 끝**

