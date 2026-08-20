# 카카오 로그인 오류 해결 체크리스트

**작성일:** 2025년 1월  
**문제:** `dummy.supabase.co`로 연결 시도

---

## ✅ 즉시 확인 사항

### 1. 개발 서버 재시작 (가장 중요!)

환경 변수를 변경한 후에는 **반드시 개발 서버를 재시작**해야 합니다.

```bash
# 1. 현재 실행 중인 개발 서버 중지 (Ctrl + C)
# 2. 개발 서버 재시작
npm run dev
```

**이유:**
- Next.js는 시작 시 환경 변수를 읽습니다
- 실행 중에는 환경 변수 변경이 반영되지 않습니다

---

### 2. 환경 변수 확인

다음 스크립트로 환경 변수가 제대로 읽히는지 확인:

```bash
node scripts/check-env-vars.js
```

**예상 결과:**
```
✅ NEXT_PUBLIC_SUPABASE_URL: https://tpourpuxuqsorohlydug.s...
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6Ik...
```

**문제가 있다면:**
- `.env.local` 파일 확인
- 환경 변수 이름 확인 (`NEXT_PUBLIC_` 접두사 필수)
- 파일 위치 확인 (프로젝트 루트)

---

### 3. 브라우저 캐시 삭제

1. 브라우저 개발자 도구 열기 (F12)
2. Network 탭 → "Disable cache" 체크
3. 페이지 새로고침 (Ctrl + Shift + R)

또는:

1. 브라우저 설정 → 인터넷 사용 기록 삭제
2. 캐시된 이미지 및 파일 삭제

---

### 4. Next.js 빌드 캐시 삭제

```bash
# .next 폴더 삭제
Remove-Item -Recurse -Force .next

# 개발 서버 재시작
npm run dev
```

---

## 🔍 추가 확인 사항

### 환경 변수 형식 확인

`.env.local` 파일 형식이 올바른지 확인:

```env
# ✅ 올바른 형식
NEXT_PUBLIC_SUPABASE_URL=https://tpourpuxuqsorohlydug.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ❌ 잘못된 형식
NEXT_PUBLIC_SUPABASE_URL = https://...  # 공백 있음
NEXT_PUBLIC_SUPABASE_URL="https://..."  # 따옴표 사용
SUPABASE_URL=https://...  # NEXT_PUBLIC_ 접두사 없음
```

---

### Supabase 프로젝트 확인

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택
3. Settings → API 확인:
   - **Project URL**: `https://tpourpuxuqsorohlydug.supabase.co`
   - **anon public** 키 확인

---

### 카카오 OAuth 설정 확인

1. Supabase Dashboard → Authentication → Providers → Kakao
2. **Redirect URL** 확인:
   - 개발: `http://localhost:3000/callback`
   - 프로덕션: `https://your-domain.vercel.app/callback`

---

## 🚨 문제 해결 단계

### Step 1: 환경 변수 확인
```bash
node scripts/check-env-vars.js
```

### Step 2: 개발 서버 재시작
```bash
# 서버 중지 후
npm run dev
```

### Step 3: 브라우저 캐시 삭제
- 개발자 도구 → Network → Disable cache
- 또는 Ctrl + Shift + R (강력 새로고침)

### Step 4: Next.js 캐시 삭제
```bash
Remove-Item -Recurse -Force .next
npm run dev
```

---

## 📋 최종 체크리스트

- [ ] `.env.local` 파일이 프로젝트 루트에 존재
- [ ] `NEXT_PUBLIC_SUPABASE_URL`이 올바르게 설정됨
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 올바르게 설정됨
- [ ] 환경 변수에 따옴표나 공백이 없음
- [ ] `NEXT_PUBLIC_` 접두사가 있음
- [ ] 개발 서버를 재시작했음
- [ ] 브라우저 캐시를 삭제했음
- [ ] Next.js 빌드 캐시를 삭제했음
- [ ] 브라우저 콘솔에서 실제 Supabase URL로 요청이 나가는지 확인

---

## 💡 디버깅 팁

### 브라우저 콘솔에서 확인

1. 개발자 도구 열기 (F12)
2. Console 탭에서 다음 확인:
   - `dummy.supabase.co`로 요청이 나가면 → 환경 변수 문제
   - 실제 Supabase URL로 요청이 나가면 → 다른 문제

### Network 탭에서 확인

1. Network 탭 열기
2. 카카오 로그인 버튼 클릭
3. 요청 URL 확인:
   - `dummy.supabase.co` → 환경 변수 문제
   - 실제 Supabase URL → 정상

---

## 📚 참고 문서

- [카카오 로그인 오류 해결 가이드](./kakao-login-troubleshooting.md)
- [환경 변수 설정 가이드](../setup/local-development-setup.md)

---

**문서 끝**
