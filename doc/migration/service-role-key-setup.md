# Service Role Key 설정 가이드

**작성일:** 2025-01-18  
**목적:** 마이그레이션을 위한 Service Role Key 설정

---

## 문제 상황

마이그레이션 스크립트 실행 시 다음 오류가 발생합니다:

```
❌ 새 프로젝트 연결 실패: Invalid API key
```

이는 `.env.local` 파일에 `NEW_SUPABASE_SERVICE_ROLE_KEY`가 설정되지 않았거나, `SUPABASE_SERVICE_ROLE_KEY`가 새 프로젝트의 Service Role Key가 아니기 때문입니다.

---

## 해결 방법

### 1. 새 프로젝트의 Service Role Key 확인

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard
   - 새 프로젝트 선택: `pkdhhtfomhhuiirzurhs`

2. **Service Role Key 복사**
   - Settings → API 이동
   - "service_role" 키 복사 (⚠️ "anon" 키가 아님!)
   - 키는 `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` 형식입니다

### 2. `.env.local` 파일 수정

`.env.local` 파일을 열고 `# Supabase2_rebuild` 섹션에 다음을 추가하세요:

```env
# Supabase2_rebuild (새 프로젝트)
NEXT_PUBLIC_SUPABASE_URL=https://pkdhhtfomhhuiirzurhs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEW_SUPABASE_SERVICE_ROLE_KEY=복사한_service_role_키_여기에_붙여넣기  # ⚠️ 필수!
```

### 3. 환경 변수 확인

수정 후 다음 명령어로 확인:

```powershell
node scripts/check-env-migration.js
```

**예상 출력:**
```
✅ 환경 변수 설정이 올바릅니다.
   기존: https://tpourpuxuqsorohlydug.supabase.co
   새: https://pkdhhtfomhhuiirzurhs.supabase.co
```

### 4. 연결 테스트

다음 명령어로 새 프로젝트 연결을 테스트합니다:

```powershell
node scripts/test-supabase-connection.js
```

**예상 출력:**
```
✅ 새 프로젝트 연결 성공
```

---

## 중요 사항

1. **`NEW_SUPABASE_SERVICE_ROLE_KEY`는 필수입니다**
   - 이 변수가 설정되지 않으면 `SUPABASE_SERVICE_ROLE_KEY`를 사용합니다
   - 하지만 `SUPABASE_SERVICE_ROLE_KEY`가 새 프로젝트의 키가 아닐 수 있습니다

2. **Service Role Key는 프로젝트별로 다릅니다**
   - 기존 프로젝트의 Service Role Key와 새 프로젝트의 Service Role Key는 다릅니다
   - 각 프로젝트의 Dashboard에서 확인해야 합니다

3. **보안 주의사항**
   - Service Role Key는 매우 민감한 정보입니다
   - `.env.local` 파일은 절대 Git에 커밋하지 마세요
   - `.gitignore`에 포함되어 있는지 확인하세요

---

## 체크리스트

- [ ] Supabase Dashboard에서 새 프로젝트의 Service Role Key 복사
- [ ] `.env.local` 파일에 `NEW_SUPABASE_SERVICE_ROLE_KEY` 추가
- [ ] `node scripts/check-env-migration.js` 실행하여 확인
- [ ] `node scripts/test-supabase-connection.js` 실행하여 연결 테스트
- [ ] 마이그레이션 스크립트 실행

---

**다음 단계:** `NEW_SUPABASE_SERVICE_ROLE_KEY` 설정 후 마이그레이션 재실행
