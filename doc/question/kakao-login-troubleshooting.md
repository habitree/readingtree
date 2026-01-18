# 카카오 로그인 오류 해결 가이드

**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0

---

## 🔍 문제 증상

### 오류 메시지
- `dummy.supabase.co`로 연결 시도
- `DNS_PROBE_FINISHED_NXDOMAIN` 오류
- 카카오 로그인 버튼 클릭 시 연결 실패

### 원인
환경 변수(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)가 제대로 읽히지 않아 더미 클라이언트가 사용되고 있습니다.

---

## ✅ 체크리스트

### 1단계: 환경 변수 파일 확인

#### `.env.local` 파일 존재 확인
```bash
# Windows PowerShell
Test-Path .env.local

# 파일이 없으면 생성
New-Item .env.local -ItemType File
```

#### 필수 환경 변수 확인
`.env.local` 파일에 다음이 **반드시** 있어야 합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**주의사항:**
- ✅ `NEXT_PUBLIC_` 접두사 필수
- ✅ 따옴표 없이 작성
- ✅ 공백 없이 작성
- ✅ `https://` 포함

**잘못된 예:**
```env
# ❌ 잘못된 예
SUPABASE_URL=https://xxx.supabase.co  # NEXT_PUBLIC_ 접두사 없음
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"  # 따옴표 사용
NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co  # 공백 있음
```

**올바른 예:**
```env
# ✅ 올바른 예
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 2단계: 개발 서버 재시작

환경 변수를 변경한 후에는 **반드시 개발 서버를 재시작**해야 합니다.

```bash
# 1. 개발 서버 중지 (Ctrl + C)
# 2. 개발 서버 재시작
npm run dev
```

**이유:**
- Next.js는 시작 시 환경 변수를 읽습니다
- 실행 중에는 환경 변수 변경이 반영되지 않습니다

---

### 3단계: 환경 변수 값 확인

#### Supabase Dashboard에서 확인
1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택
3. Settings → API
4. 다음 정보 확인:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`에 사용
   - **anon public** 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 사용

#### 로컬에서 환경 변수 확인 (디버깅용)

임시로 다음 코드를 추가하여 환경 변수가 읽히는지 확인:

```typescript
// app/actions/auth.ts (임시 디버깅 코드)
export async function signInWithKakao() {
  console.log("🔍 환경 변수 확인:", {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    HAS_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NODE_ENV: process.env.NODE_ENV,
  });
  
  const supabase = await createServerSupabaseClient();
  // ... 나머지 코드
}
```

**확인 사항:**
- `SUPABASE_URL`이 `undefined`가 아닌지
- `HAS_ANON_KEY`가 `true`인지
- URL이 `dummy.supabase.co`가 아닌 실제 Supabase URL인지

---

### 4단계: 브라우저 콘솔 확인

1. 브라우저 개발자 도구 열기 (F12)
2. Console 탭 확인
3. Network 탭에서 요청 URL 확인

**확인 사항:**
- 요청 URL이 `dummy.supabase.co`인지
- 실제 Supabase URL인지

---

### 5단계: 코드 확인

#### `lib/supabase/client.ts` 확인

```typescript
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 이 부분이 실행되면 환경 변수가 없는 것입니다
  if (!supabaseUrl || !supabaseAnonKey) {
    const dummyUrl = supabaseUrl || "https://dummy.supabase.co";
    const dummyKey = supabaseAnonKey || "dummy-key";
    return createBrowserClient(dummyUrl, dummyKey); // ❌ 더미 클라이언트 반환
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey); // ✅ 정상 클라이언트 반환
}
```

**문제 발견:**
- `dummy.supabase.co`로 연결 시도 → 환경 변수가 없음
- 실제 Supabase URL로 연결 → 환경 변수 정상

---

## 🔧 해결 방법

### 방법 1: `.env.local` 파일 수정

1. 프로젝트 루트에 `.env.local` 파일 생성/수정
2. 다음 내용 추가:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

3. 개발 서버 재시작

### 방법 2: 환경 변수 형식 확인

`.env.local` 파일 형식이 올바른지 확인:

```env
# ✅ 올바른 형식
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQ4NzI5NjAwLCJleHAiOjE5NjQzMDU2MDB9.xxxxx

# ❌ 잘못된 형식
NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co  # 공백 있음
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"  # 따옴표 사용
SUPABASE_URL=https://xxxxx.supabase.co  # NEXT_PUBLIC_ 접두사 없음
```

### 방법 3: 파일 인코딩 확인

`.env.local` 파일이 UTF-8 인코딩인지 확인:

```powershell
# PowerShell에서 인코딩 확인
Get-Content .env.local -Encoding UTF8
```

---

## 🚨 자주 발생하는 오류

### 오류 1: "dummy.supabase.co에 연결할 수 없음"

**원인:** 환경 변수가 읽히지 않음

**해결:**
1. `.env.local` 파일 확인
2. 환경 변수 이름 확인 (`NEXT_PUBLIC_` 접두사 필수)
3. 개발 서버 재시작

### 오류 2: 환경 변수가 `undefined`

**원인:** 
- 파일 이름 오타 (`.env.local`이 아닌 `.env` 등)
- 파일 위치 오류 (프로젝트 루트에 있어야 함)

**해결:**
1. 파일 이름 확인: `.env.local` (정확히)
2. 파일 위치 확인: 프로젝트 루트 (`package.json`과 같은 위치)

### 오류 3: 개발 서버 재시작 후에도 동일한 오류

**원인:**
- 환경 변수 값이 잘못됨
- Supabase 프로젝트 URL이 변경됨

**해결:**
1. Supabase Dashboard에서 최신 URL 확인
2. `.env.local` 파일 업데이트
3. 개발 서버 재시작

---

## 📋 최종 체크리스트

배포 전 다음을 확인하세요:

- [ ] `.env.local` 파일이 프로젝트 루트에 존재
- [ ] `NEXT_PUBLIC_SUPABASE_URL`이 올바르게 설정됨
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 올바르게 설정됨
- [ ] 환경 변수에 따옴표나 공백이 없음
- [ ] `NEXT_PUBLIC_` 접두사가 있음
- [ ] 개발 서버를 재시작했음
- [ ] 브라우저 콘솔에서 실제 Supabase URL로 요청이 나가는지 확인

---

## 🔍 디버깅 팁

### 환경 변수 출력 (임시)

```typescript
// lib/supabase/client.ts (임시 디버깅)
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 디버깅: 환경 변수 출력 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Supabase 환경 변수:', {
      url: supabaseUrl ? '✅ 설정됨' : '❌ 없음',
      key: supabaseAnonKey ? '✅ 설정됨' : '❌ 없음',
      urlValue: supabaseUrl?.substring(0, 30) + '...', // 일부만 출력
    });
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ 환경 변수가 없습니다!');
    const dummyUrl = supabaseUrl || "https://dummy.supabase.co";
    const dummyKey = supabaseAnonKey || "dummy-key";
    return createBrowserClient(dummyUrl, dummyKey);
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
```

---

## 📚 참고 문서

- [환경 변수 설정 가이드](../setup/local-development-setup.md)
- [Vercel 배포 가이드](../setup/vercel-deployment-guide.md)
- [빌드 오류 해결](./build-error-fix.md)

---

**문서 끝**
