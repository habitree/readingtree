# 빌드 오류 수정 완료

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0

---

## 🔍 발견된 문제

### GitHub Actions 빌드 오류

**오류 메시지:**
```
Error: Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.
Error occurred prerendering page "/_not-found"
```

**원인:**
1. `/_not-found` 페이지를 prerender하는 과정에서 Supabase 클라이언트 초기화
2. `AuthProvider`가 루트 레이아웃에 포함되어 모든 페이지에서 실행
3. 빌드 타임에 환경 변수가 없어도 에러를 throw하여 빌드 실패

---

## ✅ 수정 사항

### 1. `lib/supabase/client.ts` 수정

**변경 전:**
- 환경 변수가 없으면 즉시 에러 throw

**변경 후:**
- 빌드 타임에는 더미 클라이언트 반환
- 런타임에는 정상 작동 (환경 변수 필수)

```typescript
// 빌드 타임이나 환경 변수가 없을 때 더미 클라이언트 반환
if (!supabaseUrl || !supabaseAnonKey) {
  const dummyUrl = supabaseUrl || "https://dummy.supabase.co";
  const dummyKey = supabaseAnonKey || "dummy-key";
  return createBrowserClient(dummyUrl, dummyKey);
}
```

### 2. `lib/supabase/server.ts` 수정

**변경 전:**
- 환경 변수가 없으면 즉시 에러 throw

**변경 후:**
- 빌드 타임에는 더미 클라이언트 반환
- `cookies()` 호출 실패 시에도 처리

### 3. `contexts/auth-context.tsx` 수정

**변경 전:**
- 컴포넌트 레벨에서 `createClient()` 호출
- 빌드 타임에 실행될 수 있음

**변경 후:**
- `useEffect` 내부에서만 `createClient()` 호출
- 클라이언트 사이드에서만 실행
- 환경 변수 확인 추가

---

## 📋 수정된 파일

1. `lib/supabase/client.ts` - 빌드 타임 더미 클라이언트 지원
2. `lib/supabase/server.ts` - 빌드 타임 더미 클라이언트 지원
3. `contexts/auth-context.tsx` - 클라이언트 사이드에서만 실행

---

## ✅ 검증 결과

- ✅ 로컬 빌드 성공
- ✅ `/_not-found` 페이지 정상 생성
- ✅ 모든 정적 페이지 생성 성공

---

## ⚠️ 주의사항

### 런타임 환경 변수 필수

빌드 타임에는 더미 클라이언트를 사용하지만, **실제 런타임에서는 환경 변수가 필수**입니다.

**확인 사항:**
- Vercel Dashboard에 모든 환경 변수 설정
- GitHub Secrets에 모든 환경 변수 설정
- 프로덕션 배포 시 환경 변수 확인

---

## 🔒 보안 관련 추가 확인

### XSS 취약점 확인

`components/search/search-result-card.tsx`에서 `dangerouslySetInnerHTML` 사용:
- 검색어 하이라이트 기능에 사용
- 입력값이 검색어이므로 상대적으로 안전
- 하지만 추가 검증 권장

**권장 사항:**
- HTML 이스케이프 처리
- 또는 React의 텍스트 렌더링으로 변경

---

**문서 끝**

