# 환경 변수 설정 가이드 (마이그레이션용)

## 문제 상황

마이그레이션 스크립트 실행 시 다음 오류가 발생했습니다:

```
❌ 경고: 기존 프로젝트와 새 프로젝트 URL이 동일합니다!
   기존 프로젝트: https://tpourpuxuqsorohlydug.supabase.co
   새 프로젝트: https://tpourpuxuqsorohlydug.supabase.co
```

이는 `.env.local` 파일의 환경 변수 설정이 잘못되었음을 의미합니다.

## 올바른 .env.local 구조

`.env.local` 파일은 다음과 같이 설정해야 합니다:

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

## 중요 사항

1. **기존 프로젝트**: `old_` 프리픽스 사용
   - `old_NEXT_PUBLIC_SUPABASE_URL`
   - `old_NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `old_SUPABASE_SERVICE_ROLE_KEY`

2. **새 프로젝트**: 표준 변수명 사용
   - `NEXT_PUBLIC_SUPABASE_URL` (새 프로젝트 URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (새 프로젝트 Anon Key)
   - `NEW_SUPABASE_SERVICE_ROLE_KEY` (새 프로젝트 Service Role Key)

3. **주의**: `NEXT_PUBLIC_SUPABASE_URL`은 반드시 새 프로젝트 URL(`https://pkdhhtfomhhuiirzurhs.supabase.co`)이어야 합니다.

## 확인 방법

마이그레이션 스크립트 실행 전에 다음을 확인하세요:

```bash
# 환경 변수 확인
node -e "require('dotenv').config({ path: '.env.local' }); console.log('OLD:', process.env.old_NEXT_PUBLIC_SUPABASE_URL); console.log('NEW:', process.env.NEXT_PUBLIC_SUPABASE_URL);"
```

출력 결과:
- `OLD:` 기존 프로젝트 URL (`https://tpourpuxuqsorohlydug.supabase.co`)
- `NEW:` 새 프로젝트 URL (`https://pkdhhtfomhhuiirzurhs.supabase.co`)

두 URL이 달라야 합니다!

## 수정 후 재실행

`.env.local` 파일을 수정한 후:

```bash
node scripts/migrate-supabase-data.js
```

## 추가 문제 해결

### 데이터 조회 오류 (`{"` 오류)

모든 테이블에서 `{"` 오류가 발생하는 경우:

1. **기존 프로젝트의 Service Role Key 확인**
   - Supabase Dashboard → Settings → API
   - `service_role` 키가 올바른지 확인

2. **RLS 정책 확인**
   - 기존 프로젝트의 테이블에 RLS가 활성화되어 있는 경우
   - Service Role Key를 사용하면 RLS를 우회할 수 있어야 합니다

3. **네트워크 연결 확인**
   - 기존 프로젝트 URL에 접근 가능한지 확인

## 참고

- 마이그레이션 스크립트는 `scripts/migrate-supabase-data.js`입니다.
- 환경 변수 로딩은 `dotenv` 패키지를 사용합니다.
- 스크립트는 `.env.local` 파일을 자동으로 읽습니다.
