# Dummy Supabase 설정 제거 가이드

**작성일:** 2026-01-18  
**문제:** `dummy.supabase.co`로 연결 시도 및 연결 실패  
**원인:** 환경 변수가 없을 때 더미 URL 사용  
**해결:** 런타임에는 환경 변수 필수, 빌드 타임에만 더미 사용

## 문제 원인

기존 코드는 환경 변수가 없을 때 `dummy.supabase.co`를 사용하여 빌드 오류를 방지했습니다. 하지만 이로 인해:

1. **Vercel에 환경 변수가 설정되지 않은 경우** `dummy.supabase.co`로 연결 시도
2. **환경 변수가 설정되었지만 재배포가 안 된 경우** 여전히 더미 URL 사용
3. **런타임에 실제 연결 시도** 시 `dummy.supabase.co`는 존재하지 않는 도메인

## 해결 방법

### 코드 수정 완료

`lib/supabase/client.ts`와 `lib/supabase/server.ts`를 수정했습니다:

#### 변경 사항

1. **빌드 타임과 런타임 구분**
   - 빌드 타임: 더미 클라이언트 사용 (빌드 오류 방지)
   - 런타임: 환경 변수 필수, 없으면 명확한 오류 메시지

2. **더미 URL 변경**
   - 기존: `https://dummy.supabase.co` (실제로 존재하지 않는 도메인)
   - 변경: `https://placeholder.supabase.co` (명확히 placeholder임을 표시)

3. **런타임 오류 처리**
   - 환경 변수가 없으면 명확한 오류 메시지와 함께 throw
   - 어떤 환경 변수가 누락되었는지 명시

### Vercel 환경 변수 설정 (필수!)

코드 수정만으로는 해결되지 않습니다. **반드시 Vercel에 환경 변수를 설정해야 합니다.**

#### 1. Vercel Dashboard 접속

1. https://vercel.com 접속
2. 프로젝트 `readingtree` 선택
3. **Settings** → **Environment Variables**

#### 2. 필수 환경 변수 설정

다음 환경 변수들을 **모두 설정**하세요:

```
NEXT_PUBLIC_SUPABASE_URL=https://pkdhhtfomhhuiirzurhs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrZGhodGZvbWhodWlpcnp1cmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2Mzk2NjIsImV4cCI6MjA4NDIxNTY2Mn0.Nnl1jmHa03cppZH_GnZcGojEtMIfDAlZk-OcWbehl3o
NEXT_PUBLIC_APP_URL=https://readingtree.vercel.app
```

**중요:**
- 모든 환경 변수를 **모든 환경에 적용** (Production, Preview, Development)
- **저장** 클릭

#### 3. 재배포 (필수!)

환경 변수 설정 후 **반드시 재배포**해야 합니다:

1. **Deployments** 탭 이동
2. 최신 배포의 **"..."** 메뉴 클릭
3. **"Redeploy"** 선택
4. **"Use existing Build Cache" 체크 해제** (중요!)
5. **"Redeploy"** 클릭
6. 배포 완료 대기 (약 2-3분)

## 변경된 코드 동작

### 빌드 타임 (Next.js 빌드 시)

```typescript
// 빌드 타임에는 더미 클라이언트 사용
// 실제 쿼리가 실행되지 않으므로 안전
return createBrowserClient(
  "https://placeholder.supabase.co",
  "placeholder-key"
);
```

### 런타임 (실제 사용자 요청 시)

```typescript
// 환경 변수가 없으면 명확한 오류 메시지
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "❌ Supabase 환경 변수가 설정되지 않았습니다.\n" +
    "Vercel Dashboard에서 환경 변수를 설정하고 재배포하세요."
  );
}

// 환경 변수가 있으면 정상 작동
return createBrowserClient(supabaseUrl, supabaseAnonKey);
```

## 확인 방법

### 1. 환경 변수 확인

Vercel Dashboard에서:
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 설정됨
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정됨
- [ ] `NEXT_PUBLIC_APP_URL` 설정됨
- [ ] 모든 환경에 적용됨

### 2. 재배포 확인

- [ ] 재배포 완료됨
- [ ] 배포 상태가 "Ready"
- [ ] "Use existing Build Cache" 체크 해제 후 재배포

### 3. 브라우저 테스트

1. 프로덕션 URL 접속: `https://readingtree.vercel.app/login`
2. 브라우저 개발자 도구 (F12) → Console 탭
3. 카카오 로그인 버튼 클릭
4. 확인 사항:
   - ✅ `dummy.supabase.co` 또는 `placeholder.supabase.co`로 요청이 나가지 않음
   - ✅ 실제 Supabase URL (`pkdhhtfomhhuiirzurhs.supabase.co`)로 요청이 나감
   - ✅ 오류 메시지가 없음

### 4. 오류 발생 시

환경 변수가 없으면 다음과 같은 명확한 오류 메시지가 표시됩니다:

```
❌ Supabase 환경 변수가 설정되지 않았습니다.
누락된 환경 변수: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
Vercel Dashboard에서 환경 변수를 설정하고 재배포하세요.
```

이 경우:
1. Vercel Dashboard에서 환경 변수 확인
2. 환경 변수가 설정되어 있다면 재배포 확인
3. 재배포가 완료되었다면 브라우저 캐시 클리어 (Ctrl + Shift + R)

## 체크리스트

- [ ] `lib/supabase/client.ts` 수정 완료
- [ ] `lib/supabase/server.ts` 수정 완료
- [ ] Vercel에 `NEXT_PUBLIC_SUPABASE_URL` 설정
- [ ] Vercel에 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정
- [ ] Vercel에 `NEXT_PUBLIC_APP_URL` 설정
- [ ] 모든 환경 변수를 모든 환경에 적용
- [ ] Vercel 재배포 완료 (Build Cache 해제)
- [ ] 브라우저에서 `dummy.supabase.co` 연결 시도 없음 확인
- [ ] 실제 Supabase URL로 정상 작동 확인

## 참고

- 더미 클라이언트는 **빌드 타임에만** 사용됩니다
- **런타임에는 환경 변수가 필수**입니다
- 환경 변수가 없으면 명확한 오류 메시지가 표시됩니다
- Vercel 환경 변수 설정 후 **반드시 재배포**해야 합니다
