# 내서재 책 클릭 시 404 오류 및 Mixed Content 경고 해결

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0  
**문제:** 내서재에서 등록된 책을 클릭하면 404 오류 발생 및 Mixed Content 경고

---

## 🔍 문제 분석

### 발견된 문제

**증상:**
1. 내서재에서 등록된 책을 클릭하면 `404 This page could not be found.` 오류 발생
2. 브라우저 콘솔에 Mixed Content 경고 발생:
   ```
   Mixed Content: The page at 'https://readingtree2-0.vercel.app/books/search' 
   was loaded over HTTPS, but requested an insecure element 
   'http://k.kakaocdn.net/dn/dmtQPx/btsNrr9Ujvo/ctBTZVciEEeReQJUtKVTX0/img_640x640.jpg'
   ```

**원인 분석:**

#### 1. 404 오류 원인
- `book-card.tsx`에서 `userBookId`를 사용해 `/books/${userBookId}`로 라우팅
- `userBookId`가 `undefined`이거나 빈 문자열일 가능성
- `getBookDetail` 함수에서 해당 ID를 찾지 못하는 경우
- `user_books` 테이블의 ID와 실제 전달되는 ID가 일치하지 않는 경우

#### 2. Mixed Content 경고 원인
- 네이버 API에서 받은 이미지 URL이 `http://k.kakaocdn.net/...` 형식으로 반환됨
- HTTPS 페이지에서 HTTP 리소스를 로드하려고 하면 Mixed Content 경고 발생
- `next.config.js`에 `k.kakaocdn.net` 도메인이 `https`로만 허용되어 있지만, 실제 URL은 `http`로 시작
- `transformNaverBookItem` 함수에서 이미지 URL을 그대로 반환
- `getImageUrl` 함수가 HTTP URL을 HTTPS로 변환하지 않음

---

## ✅ 해결 방법

### 1. HTTP 이미지 URL을 HTTPS로 변환

**파일**: `lib/utils/image.ts`

**변경 사항**:
- `convertToHttps()` 함수 추가: HTTP URL을 HTTPS로 변환
- `getImageUrl()` 함수 수정: HTTP URL을 자동으로 HTTPS로 변환

**수정 내용**:
```typescript
/**
 * HTTP URL을 HTTPS로 변환
 * Mixed Content 경고 방지를 위해 HTTP 이미지 URL을 HTTPS로 변환
 */
export function convertToHttps(url: string): string {
  if (!url) return url;
  
  try {
    const urlObj = new URL(url);
    // HTTP인 경우 HTTPS로 변환
    if (urlObj.protocol === 'http:') {
      urlObj.protocol = 'https:';
      return urlObj.toString();
    }
    return url;
  } catch {
    // URL 파싱 실패 시 원본 반환
    return url;
  }
}

/**
 * 이미지 URL에 기본 이미지 적용 (URL이 없거나 유효하지 않을 때)
 * HTTP URL은 자동으로 HTTPS로 변환
 */
export function getImageUrl(
  url: string | null | undefined,
  fallback?: string
): string {
  // 유효한 URL이 있으면 HTTPS로 변환하여 반환
  if (isValidImageUrl(url) && url) {
    return convertToHttps(url);
  }
  
  // fallback이 제공되면 HTTPS로 변환하여 사용
  if (fallback && isValidImageUrl(fallback)) {
    return convertToHttps(fallback);
  }
  
  // 기본 fallback 반환
  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
}
```

### 2. 네이버 API 응답 변환 시 HTTPS 변환

**파일**: `lib/api/naver.ts`

**변경 사항**:
- `transformNaverBookItem()` 함수에서 이미지 URL을 HTTPS로 변환

**수정 내용**:
```typescript
export function transformNaverBookItem(item: NaverBookItem) {
  // ... 기존 코드 ...
  
  // 이미지 URL을 HTTPS로 변환 (Mixed Content 경고 방지)
  let coverImageUrl = item.image ? item.image.trim() : null;
  if (coverImageUrl && coverImageUrl.startsWith('http://')) {
    coverImageUrl = coverImageUrl.replace('http://', 'https://');
  }

  return {
    // ... 기존 필드 ...
    cover_image_url: coverImageUrl,
  };
}
```

### 3. Next.js 이미지 설정에 도메인 추가

**파일**: `next.config.js`

**변경 사항**:
- `k.kakaocdn.net` 도메인을 `https` 프로토콜로 추가

**수정 내용**:
```javascript
const nextConfig = {
  images: {
    remotePatterns: [
      // ... 기존 도메인 ...
      {
        protocol: 'https',
        hostname: 'k.kakaocdn.net',
      },
    ],
  },
};
```

### 4. BookCard 컴포넌트에서 userBookId 검증

**파일**: `components/books/book-card.tsx`

**변경 사항**:
- `userBookId` 검증 로직 추가
- 이미지 URL에 `getImageUrl()` 함수 사용

**수정 내용**:
```typescript
export function BookCard({ book, userBookId, status }: BookCardProps) {
  // ... 기존 코드 ...
  
  // userBookId 검증
  if (!userBookId || typeof userBookId !== 'string' || userBookId.trim() === '') {
    console.error('BookCard: userBookId가 유효하지 않습니다.', { userBookId, book });
    return null;
  }
  
  // ... 이미지 URL 사용 시 getImageUrl() 함수 사용 ...
}
```

### 5. BookList 컴포넌트에서 안전장치 추가

**파일**: `components/books/book-list.tsx`

**변경 사항**:
- `userBook.id` 검증 로직 추가

**수정 내용**:
```typescript
{books.map((userBook) => {
  // userBook.id 검증
  if (!userBook.id || typeof userBook.id !== 'string' || userBook.id.trim() === '') {
    console.error('BookList: userBook.id가 유효하지 않습니다.', { userBook });
    return null;
  }
  
  return (
    <BookCard
      key={userBook.id}
      book={userBook.books as BookWithUserBook}
      userBookId={userBook.id}
      status={userBook.status}
    />
  );
})}
```

---

## 📋 수정된 파일 목록

1. `lib/utils/image.ts` - HTTP URL을 HTTPS로 변환하는 함수 추가
2. `lib/api/naver.ts` - 네이버 API 응답 변환 시 HTTPS 변환
3. `next.config.js` - `k.kakaocdn.net` 도메인 추가
4. `components/books/book-card.tsx` - `userBookId` 검증 및 이미지 URL 처리 개선
5. `components/books/book-list.tsx` - `userBook.id` 검증 추가

---

## 🧪 테스트 방법

1. **Mixed Content 경고 확인**:
   - 내서재 페이지에서 책 목록 확인
   - 브라우저 개발자 도구 콘솔에서 Mixed Content 경고가 사라졌는지 확인
   - 네이버 API에서 받은 HTTP 이미지 URL이 HTTPS로 변환되는지 확인

2. **404 오류 확인**:
   - 내서재에서 등록된 책 클릭
   - 책 상세 페이지가 정상적으로 로드되는지 확인
   - 브라우저 개발자 도구 콘솔에서 에러 메시지 확인

3. **이미지 로딩 확인**:
   - 책 표지 이미지가 정상적으로 표시되는지 확인
   - HTTPS URL로 변환된 이미지가 정상적으로 로드되는지 확인

---

## 🔄 추가 개선 사항

### 향후 개선 가능한 사항

1. **이미지 프록시 서버 사용**:
   - 외부 이미지 URL을 내부 프록시를 통해 제공
   - Mixed Content 문제 완전 해결 및 이미지 최적화 가능

2. **이미지 캐싱 전략**:
   - 변환된 HTTPS URL을 데이터베이스에 저장
   - 네이버 API 호출 시마다 변환하지 않도록 개선

3. **에러 핸들링 개선**:
   - `userBookId`가 유효하지 않을 때 사용자에게 친화적인 메시지 표시
   - 이미지 로딩 실패 시 재시도 로직 개선

---

## 📝 참고 사항

- Mixed Content 경고는 브라우저 보안 정책에 따라 발생
- HTTPS 페이지에서 HTTP 리소스를 로드하는 것은 보안상 위험할 수 있음
- 모든 외부 이미지 URL은 HTTPS로 변환하는 것이 권장됨
- `k.kakaocdn.net`은 카카오 CDN 서비스로, HTTPS를 지원함

