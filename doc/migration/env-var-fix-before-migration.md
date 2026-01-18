# 마이그레이션 전 환경 변수 확인 및 수정 가이드

**작성일:** 2025-01-18  
**목적:** 마이그레이션 실행 전 환경 변수 설정 확인 및 수정

---

## 문제 상황

마이그레이션 스크립트 실행 시 다음 오류가 발생했습니다:

```
❌ [users] 테이블이 존재하지 않거나 접근할 수 없습니다: Invalid API key
   💡 Service Role Key가 올바르지 않거나 새 프로젝트의 키가 아닙니다.
```

또한 환경 변수 확인 시:

```
❌ 경고: 기존 프로젝트와 새 프로젝트 URL이 동일합니다!
   기존 프로젝트: https://tpourpuxuqsorohlydug.supabase.co
   새 프로젝트: https://tpourpuxuqsorohlydug.supabase.co
```

---

## 해결 방법

### 1. `.env.local` 파일 확인

`.env.local` 파일을 열고 다음 구조를 확인하세요:

```env
# old Supabase (기존 프로젝트)
old_NEXT_PUBLIC_SUPABASE_URL=https://tpourpuxuqsorohlydug.supabase.co
old_NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
old_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase2_rebuild (새 프로젝트)
NEXT_PUBLIC_SUPABASE_URL=https://pkdhhtfomhhuiirzurhs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEW_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. 필수 확인 사항

#### ✅ 기존 프로젝트 (old_ 프리픽스)
- `old_NEXT_PUBLIC_SUPABASE_URL`: `https://tpourpuxuqsorohlydug.supabase.co`
- `old_SUPABASE_SERVICE_ROLE_KEY`: 기존 프로젝트의 Service Role Key

#### ✅ 새 프로젝트 (표준 변수명 또는 NEW_ 프리픽스)
- `NEXT_PUBLIC_SUPABASE_URL`: `https://pkdhhtfomhhuiirzurhs.supabase.co` (⚠️ 중요: 기존 프로젝트 URL이 아님!)
- `NEW_SUPABASE_SERVICE_ROLE_KEY` 또는 `SUPABASE_SERVICE_ROLE_KEY`: **새 프로젝트의** Service Role Key

### 3. Service Role Key 확인 및 설정 방법

#### ⚠️ 중요: `.env.local`에 `NEW_SUPABASE_SERVICE_ROLE_KEY` 추가 필수

현재 `SUPABASE_SERVICE_ROLE_KEY`가 새 프로젝트의 Service Role Key가 아닙니다.
`.env.local` 파일에 **반드시** `NEW_SUPABASE_SERVICE_ROLE_KEY`를 추가해야 합니다.

#### 새 프로젝트의 Service Role Key 확인:
1. Supabase Dashboard 접속: https://supabase.com/dashboard
2. 새 프로젝트 선택 (`pkdhhtfomhhuiirzurhs`)
3. Settings → API 이동
4. "service_role" 키 복사 (⚠️ "anon" 키가 아님!)
5. `.env.local`의 `# Supabase2_rebuild` 섹션에 다음 추가:
   ```env
   NEW_SUPABASE_SERVICE_ROLE_KEY=복사한_service_role_키
   ```

#### `.env.local` 파일 구조 예시:
```env
# old Supabase (기존 프로젝트)
old_NEXT_PUBLIC_SUPABASE_URL=https://tpourpuxuqsorohlydug.supabase.co
old_NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
old_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # 기존 프로젝트의 Service Role Key

# Supabase2_rebuild (새 프로젝트)
NEXT_PUBLIC_SUPABASE_URL=https://pkdhhtfomhhuiirzurhs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEW_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # ⚠️ 새 프로젝트의 Service Role Key (필수!)
```

### 4. 환경 변수 확인 스크립트 실행

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

### 5. 마이그레이션 실행

환경 변수가 올바르게 설정되었으면:

```powershell
node scripts/migrate-supabase-data.js
```

---

## 주의 사항

1. **`NEXT_PUBLIC_SUPABASE_URL`은 반드시 새 프로젝트 URL이어야 합니다**
   - 기존 프로젝트 URL (`https://tpourpuxuqsorohlydug.supabase.co`)이면 안 됩니다
   - 새 프로젝트 URL (`https://pkdhhtfomhhuiirzurhs.supabase.co`)이어야 합니다

2. **Service Role Key는 프로젝트별로 다릅니다**
   - 기존 프로젝트의 Service Role Key와 새 프로젝트의 Service Role Key는 다릅니다
   - `SUPABASE_SERVICE_ROLE_KEY`가 새 프로젝트의 키인지 확인하세요

3. **스크립트는 하드코딩된 새 프로젝트 URL을 우선 사용합니다**
   - `NEXT_PUBLIC_SUPABASE_URL`이 잘못 설정되어 있어도 스크립트는 올바른 URL을 사용합니다
   - 하지만 Service Role Key는 환경 변수에서 읽으므로 올바르게 설정해야 합니다

---

## 문제 해결 체크리스트

- [ ] `.env.local` 파일 열기
- [ ] `NEXT_PUBLIC_SUPABASE_URL`이 `https://pkdhhtfomhhuiirzurhs.supabase.co`인지 확인
- [ ] `NEW_SUPABASE_SERVICE_ROLE_KEY` 또는 `SUPABASE_SERVICE_ROLE_KEY`가 새 프로젝트의 키인지 확인
- [ ] `node scripts/check-env-migration.js` 실행하여 확인
- [ ] 마이그레이션 스크립트 실행

---

**다음 단계:** 환경 변수 수정 후 마이그레이션 재실행
