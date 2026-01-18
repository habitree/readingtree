# 마이그레이션 다음 단계 가이드

**작성일:** 2026-01-18  
**프로젝트:** Habitree Reading Hub v4.0.0

## 중요: 먼저 해야 할 작업

### 1. 새 Supabase 프로젝트에 `completed_dates` 컬럼 추가 (필수)

새 Supabase 프로젝트 (`https://pkdhhtfomhhuiirzurhs.supabase.co`)의 SQL Editor에서 실행:

```sql
-- doc/database/migration-202601180000__user_books__add_completed_dates.sql 파일 내용
ALTER TABLE user_books 
ADD COLUMN IF NOT EXISTS completed_dates JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_user_books_completed_dates 
ON user_books USING gin (completed_dates);
```

이 작업을 완료한 후에만 데이터 이관을 재실행할 수 있습니다.

## 환경 변수 업데이트

### 1. 로컬 환경 변수 업데이트 (`.env.local`)

`.env.local` 파일을 열고 다음 변경을 수행:

**변경 전:**
```env
# old Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tpourpuxuqsorohlydug.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Supabase2_rebuild
NEW_SUPABASE_URL=https://pkdhhtfomhhuiirzurhs.supabase.co
NEW_SUPABASE_ANON_KEY=...
NEW_SUPABASE_SERVICE_ROLE_KEY=...
```

**변경 후:**
```env
# 새 Supabase 프로젝트 (기본 변수로 교체)
NEXT_PUBLIC_SUPABASE_URL=https://pkdhhtfomhhuiirzurhs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrZGhodGZvbWhodWlpcnp1cmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2Mzk2NjIsImV4cCI6MjA4NDIxNTY2Mn0.Nnl1jmHa03cppZH_GnZcGojEtMIfDAlZk-OcWbehl3o
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrZGhodGZvbWhodWlpcnp1cmhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODYzOTY2MiwiZXhwIjoyMDg0MjE1NjYyfQ.JjYcVJqma1fHXB4SKg-HwchQLzuhaHJ2Yh4zjGksNJ4

# 기존 프로젝트 (주석 처리 또는 제거)
# OLD_SUPABASE_URL=https://tpourpuxuqsorohlydug.supabase.co
# OLD_SUPABASE_ANON_KEY=...
# OLD_SUPABASE_SERVICE_ROLE_KEY=...
```

**⚠️ 주의:** 데이터 이관이 완전히 끝나기 전까지는 기존 프로젝트 변수를 주석 처리만 하고 완전히 삭제하지 마세요.

### 2. Vercel 환경 변수 업데이트

1. Vercel Dashboard 접속: https://vercel.com
2. 프로젝트 선택: `readingtree`
3. Settings → Environment Variables
4. 다음 변수들을 새 프로젝트 값으로 업데이트:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://pkdhhtfomhhuiirzurhs.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 새 프로젝트의 anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: 새 프로젝트의 service role key
5. 모든 환경(Production, Preview, Development)에 적용
6. 재배포 실행

### 3. GitHub Actions Secrets 업데이트

1. GitHub 저장소 접속: https://github.com/habitree/readingtree
2. Settings → Secrets and variables → Actions
3. 다음 Secrets 업데이트:
   - `SUPABASE_URL`: `https://pkdhhtfomhhuiirzurhs.supabase.co`
   - `SUPABASE_ANON_KEY`: 새 프로젝트의 anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: 새 프로젝트의 service role key

## OAuth 설정 이관

### 1. Kakao OAuth 설정

1. **Supabase Dashboard → 새 프로젝트 → Authentication → Providers**
2. **Kakao Provider 활성화**
3. **설정 입력:**
   - Kakao Client ID: 기존 프로젝트와 동일
   - Kakao Client Secret: 기존 프로젝트와 동일
4. **Redirect URL 확인:** `https://pkdhhtfomhhuiirzurhs.supabase.co/auth/v1/callback`

5. **카카오 개발자 센터 설정 업데이트:**
   - https://developers.kakao.com/ 접속
   - 내 애플리케이션 선택
   - 제품 설정 → 카카오 로그인 → Redirect URI
   - 새 URL 추가: `https://pkdhhtfomhhuiirzurhs.supabase.co/auth/v1/callback`
   - 기존 URL은 테스트 기간 동안 유지 권장

### 2. Google OAuth 설정

1. **Supabase Dashboard → 새 프로젝트 → Authentication → Providers**
2. **Google Provider 활성화**
3. **설정 입력:**
   - Google Client ID: 기존 프로젝트와 동일
   - Google Client Secret: 기존 프로젝트와 동일
4. **Redirect URL 확인:** `https://pkdhhtfomhhuiirzurhs.supabase.co/auth/v1/callback`

5. **Google Cloud Console 설정 업데이트:**
   - https://console.cloud.google.com/ 접속
   - 프로젝트 선택
   - APIs & Services → Credentials
   - OAuth 2.0 Client ID 선택
   - Authorized redirect URIs에 새 URL 추가

## 관리자 계정 설정

데이터 이관 후, 새 프로젝트의 SQL Editor에서 실행:

```sql
-- 관리자로 설정
UPDATE users 
SET is_admin = TRUE 
WHERE email = 'cdhnaya@kakao.com';

-- 설정 확인
SELECT id, email, name, is_admin 
FROM users 
WHERE is_admin = TRUE;
```

## 데이터 이관 재실행

### 1. 데이터베이스 데이터 이관

`completed_dates` 컬럼 추가 후 재실행:

```powershell
cd c:\Users\N100274\OneDrive\2.PJT\readingtree_v4.0.0
$env:NEXT_PUBLIC_SUPABASE_URL="https://tpourpuxuqsorohlydug.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwb3VycHV4dXFzb3JvaGx5ZHVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjcyNjYzNCwiZXhwIjoyMDgyMzAyNjM0fQ.5sX3qTz_dDNFO7bVU-kBE-QKDa-oWGiR1dCaSIvQl84"
node scripts/migrate-supabase-data.js
```

### 2. Storage 파일 이관

```powershell
cd c:\Users\N100274\OneDrive\2.PJT\readingtree_v4.0.0
$env:NEXT_PUBLIC_SUPABASE_URL="https://tpourpuxuqsorohlydug.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwb3VycHV4dXFzb3JvaGx5ZHVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjcyNjYzNCwiZXhwIjoyMDgyMzAyNjM0fQ.5sX3qTz_dDNFO7bVU-kBE-QKDa-oWGiR1dCaSIvQl84"
node scripts/migrate-supabase-storage.js
```

### 3. 이관 결과 검증

```powershell
cd c:\Users\N100274\OneDrive\2.PJT\readingtree_v4.0.0
node scripts/verify-supabase-migration.js
```

## 최종 테스트

### 1. 로컬 환경 테스트

1. `.env.local` 업데이트 완료
2. 개발 서버 재시작: `npm run dev`
3. 주요 기능 테스트:
   - 로그인 (Kakao, Google)
   - 책 추가/조회
   - 기록 생성/조회
   - 서재 관리
   - 독서모임
   - 관리자 페이지 접근 (`/admin`)

### 2. 프로덕션 환경 테스트

1. Vercel 환경 변수 업데이트 완료
2. Vercel에서 자동 재배포 확인
3. 프로덕션 URL에서 동일한 기능 테스트: `https://readingtree-i2zd5zgdx-cdhrichs-projects.vercel.app`

## 체크리스트

- [ ] 새 Supabase 프로젝트에 `completed_dates` 컬럼 추가
- [ ] 데이터베이스 데이터 이관 재실행
- [ ] Storage 파일 이관 재실행
- [ ] 이관 결과 검증
- [ ] 관리자 계정 설정
- [ ] Kakao OAuth 설정
- [ ] Google OAuth 설정
- [ ] 카카오 개발자 센터 Redirect URL 업데이트
- [ ] Google Cloud Console Redirect URL 업데이트
- [ ] `.env.local` 환경 변수 업데이트
- [ ] Vercel 환경 변수 업데이트
- [ ] GitHub Actions Secrets 업데이트
- [ ] 로컬 환경 테스트
- [ ] 프로덕션 환경 테스트
