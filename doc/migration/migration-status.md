# 마이그레이션 진행 상황

**작성일:** 2026-01-18  
**프로젝트:** Habitree Reading Hub v4.0.0

## 완료된 작업

### 1. 프로젝트 메타데이터 업데이트
- ✅ `package.json`의 repository URL 업데이트: `https://github.com/habitree/readingtree.git`
- ✅ `README.md`의 클론 명령어 URL 업데이트

### 2. 스키마 수정
- ✅ `schema.sql`에 `completed_dates` 컬럼 추가
- ✅ 마이그레이션 파일 생성: `migration-202601180000__user_books__add_completed_dates.sql`

### 3. 데이터 이관 시도
- ⚠️ 데이터베이스 데이터 이관 실행 완료 (일부 오류 발생)
- ⚠️ Storage 파일 이관 진행 중 (510개 파일, 타임아웃으로 중단)

## 발생한 문제 및 해결 방법

### 1. `user_books` 테이블의 `completed_dates` 컬럼 누락

**문제:**
- 새 Supabase 프로젝트의 `user_books` 테이블에 `completed_dates` 컬럼이 없음
- 마이그레이션 스크립트 실행 시 오류 발생

**해결:**
1. 새 Supabase 프로젝트의 SQL Editor에서 다음 마이그레이션 파일 실행:
   ```
   doc/database/migration-202601180000__user_books__add_completed_dates.sql
   ```

2. 또는 직접 SQL 실행:
   ```sql
   ALTER TABLE user_books 
   ADD COLUMN IF NOT EXISTS completed_dates JSONB DEFAULT '[]'::jsonb;
   
   CREATE INDEX IF NOT EXISTS idx_user_books_completed_dates 
   ON user_books USING gin (completed_dates);
   ```

### 2. `users` 테이블 이관 불가

**문제:**
- `users` 테이블은 `auth.users`를 참조하므로 자동 이관 불가
- 다른 테이블들이 `users` 테이블을 참조하여 외래 키 제약 조건 위반 발생

**해결:**
- 사용자가 새 프로젝트에서 직접 로그인하면 `auth.users`와 `users` 테이블이 자동 생성됨
- 또는 Supabase Dashboard의 Database → Backups 기능 사용

### 3. `books` 테이블 조회 오류

**문제:**
- `books` 테이블 데이터 조회 중 오류 발생 (JSON 파싱 오류로 추정)

**해결:**
- 마이그레이션 스크립트 재실행 시 해당 테이블만 수동으로 재이관 가능
- 또는 Supabase Dashboard에서 직접 확인

### 4. Storage 파일 이관 타임아웃

**문제:**
- 510개 파일 이관 중 타임아웃 발생

**해결:**
- 스크립트 재실행 시 이미 이관된 파일은 자동으로 건너뜀
- 또는 수동으로 남은 파일만 이관

## 다음 단계

### 1. 새 Supabase 프로젝트에 `completed_dates` 컬럼 추가 (필수)

새 Supabase 프로젝트의 SQL Editor에서 실행:
```sql
-- doc/database/migration-202601180000__user_books__add_completed_dates.sql 파일 내용 실행
ALTER TABLE user_books 
ADD COLUMN IF NOT EXISTS completed_dates JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_user_books_completed_dates 
ON user_books USING gin (completed_dates);
```

### 2. 데이터 이관 재실행

`completed_dates` 컬럼 추가 후 데이터 이관 스크립트 재실행:
```powershell
cd c:\Users\N100274\OneDrive\2.PJT\readingtree_v4.0.0
$env:NEXT_PUBLIC_SUPABASE_URL="https://tpourpuxuqsorohlydug.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwb3VycHV4dXFzb3JvaGx5ZHVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjcyNjYzNCwiZXhwIjoyMDgyMzAyNjM0fQ.5sX3qTz_dDNFO7bVU-kBE-QKDa-oWGiR1dCaSIvQl84"
node scripts/migrate-supabase-data.js
```

### 3. Storage 파일 이관 재실행

Storage 이관 스크립트 재실행 (이미 이관된 파일은 자동 건너뜀):
```powershell
cd c:\Users\N100274\OneDrive\2.PJT\readingtree_v4.0.0
$env:NEXT_PUBLIC_SUPABASE_URL="https://tpourpuxuqsorohlydug.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwb3VycHV4dXFzb3JvaGx5ZHVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjcyNjYzNCwiZXhwIjoyMDgyMzAyNjM0fQ.5sX3qTz_dDNFO7bVU-kBE-QKDa-oWGiR1dCaSIvQl84"
node scripts/migrate-supabase-storage.js
```

### 4. 사용자 로그인으로 `users` 테이블 생성

새 프로젝트에서 사용자가 직접 로그인하면 `auth.users`와 `users` 테이블이 자동 생성됩니다.

### 5. 나머지 작업 진행

- 이관 결과 검증
- 관리자 계정 설정
- OAuth 설정 이관
- 환경 변수 업데이트
- 최종 테스트
