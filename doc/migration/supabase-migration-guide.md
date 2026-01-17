# Supabase 데이터 이관 가이드

**작성일:** 2026년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0  
**최종 업데이트:** 2026-01-17 (관리자 권한 DB 관리 방식 반영, 스키마 이관 완료 상태 반영)

---

## 현재 진행 상황

✅ **완료된 작업**:
- [x] 새 Supabase 프로젝트 생성
- [x] 환경 변수 설정 (`.env.local`)
- [x] 스키마 이관 완료 (`schema.sql` 실행 완료)

📋 **다음 단계**:
- [ ] 데이터베이스 데이터 이관
- [ ] Storage 파일 이관
- [ ] 관리자 계정 설정
- [ ] OAuth 설정
- [ ] 환경 변수 업데이트 및 배포
- [ ] 최종 테스트

> **💡 빠른 참조**: 단계별 실행 가이드는 [`migration-step-by-step.md`](./migration-step-by-step.md)를 참조하세요.

---

## 목차

1. [개요](#1-개요)
2. [사전 준비](#2-사전-준비)
3. [이관 절차](#3-이관-절차)
4. [검증 및 테스트](#4-검증-및-테스트)
5. [문제 해결](#5-문제-해결)

---

## 1. 개요

이 가이드는 기존 Supabase 프로젝트의 모든 데이터를 새로운 리전의 Supabase 프로젝트로 이관하는 방법을 설명합니다.

### 이관 대상

- **데이터베이스**: 모든 테이블 데이터
- **Storage**: 이미지 파일 (`images` 버킷)
- **인증 설정**: OAuth Provider 설정 (수동)
- **RLS 정책**: 스키마와 함께 자동 이관

### 이관하지 않는 항목 (스크립트 기준)

- **auth.users**: Supabase Auth 시스템 테이블
  - **스크립트로 이관 불가**: Supabase Auth 시스템 테이블로 직접 접근/수정 불가
  - **대안 1 (권장)**: 사용자가 새 프로젝트에서 직접 로그인하면 자동 생성됨
  - **대안 2**: Supabase Dashboard의 Database → Backups 기능 사용 (전체 DB 백업/복원)
- **Edge Functions**: 사용하지 않으므로 불필요
- **Realtime**: 사용하지 않으므로 불필요

**⚠️ auth.users 이관이 필요한 경우**:
- 기존 사용자 인증 정보를 그대로 유지해야 하는 경우
- 사용자가 재로그인하기 어려운 경우
- → Supabase Dashboard의 Database → Backups 기능 사용 권장

---

## 2. 사전 준비

### 2.1 새 Supabase 프로젝트 생성

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 로그인

2. **새 프로젝트 생성**
   - "New Project" 클릭
   - **프로젝트 이름** 입력
   - **데이터베이스 비밀번호** 설정 (안전하게 보관)
   - **리전 선택** (예: Asia Pacific (Seoul))
   - "Create new project" 클릭
   - 프로젝트 생성 완료 대기 (약 2-3분)

3. **프로젝트 정보 확인**
   - Settings → API
   - **Project URL** 복사: `https://{new-project-ref}.supabase.co`
   - **anon public** key 복사
   - **service_role** key 복사 (비밀번호 입력 필요)

### 2.2 환경 변수 설정

`.env.local` 파일에 다음 변수를 추가합니다:

```env
# 기존 프로젝트 정보
OLD_SUPABASE_URL=https://{old-project-ref}.supabase.co
OLD_SUPABASE_SERVICE_ROLE_KEY={old-service-role-key}

# 새 프로젝트 정보
NEW_SUPABASE_URL=https://{new-project-ref}.supabase.co
NEW_SUPABASE_SERVICE_ROLE_KEY={new-service-role-key}

# Storage 버킷 이름 (기본값: images)
BUCKET_NAME=images
```

### 2.3 데이터베이스 스키마 이관

**✅ 완료됨**: 스키마 이관이 이미 완료되었습니다.

**참고**: 스키마를 다시 실행해야 하는 경우, 아래 절차를 따르세요.

#### 2.3.1 스키마 파일 실행 (참고용)

1. **스키마 파일 확인**
   - `doc/database/schema.sql` 파일 열기
   - 이 파일에는 다음이 포함되어 있습니다:
     - 모든 테이블 정의 (users, books, user_books, notes, bookshelves 등)
     - `users` 테이블의 `is_admin` 컬럼 (관리자 권한 관리용)
     - 모든 RLS 정책
     - 인덱스 및 함수

2. **Supabase SQL Editor에서 실행**
   - 새 Supabase 프로젝트 → SQL Editor
   - "New query" 클릭
   - `schema.sql` 파일 내용 전체 복사 (Ctrl+A → Ctrl+C)
   - SQL Editor에 붙여넣기 (Ctrl+V)
   - **RUN** 버튼 클릭 (또는 Ctrl+Enter)
   - 실행 완료 대기 (약 1-2분)

3. **실행 결과 확인**
   - 에러 없이 "Success. No rows returned" 메시지 확인
   - 에러가 있으면 메시지를 확인하고 수정

#### 2.3.2 스키마 검증

SQL Editor에서 다음 쿼리 실행하여 테이블 생성 확인:

```sql
-- 테이블 목록 확인
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 주요 테이블 확인 (다음 테이블들이 있어야 함)
-- users, books, user_books, bookshelves, notes, groups, group_members, 
-- group_books, group_notes, transcriptions, ocr_usage_stats, ocr_logs

-- users 테이블의 is_admin 컬럼 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name = 'is_admin';
-- 결과: is_admin | boolean | false

-- RLS 정책 확인
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- is_admin_user() 함수 확인
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'is_admin_user';
-- 결과: is_admin_user | FUNCTION
```

#### 2.3.3 관리자 계정 설정 (선택사항)

**⚠️ 중요**: 데이터 이관 후 기존 관리자 이메일을 관리자로 설정해야 합니다.

데이터 이관 스크립트는 `users` 테이블의 데이터를 이관하지만, `is_admin` 컬럼은 기본값(`FALSE`)으로 설정됩니다.

**데이터 이관 후 관리자 설정 방법**:

1. **기존 관리자 이메일 확인**
   - 기존 프로젝트에서 관리자로 사용하던 이메일 주소 확인
   - 예: `cdhnaya@kakao.com`

2. **새 프로젝트에서 관리자 설정**
   ```sql
   -- 특정 이메일을 관리자로 설정
   UPDATE users 
   SET is_admin = TRUE 
   WHERE email = 'cdhnaya@kakao.com';
   
   -- 설정 확인
   SELECT id, email, name, is_admin 
   FROM users 
   WHERE is_admin = TRUE;
   ```

3. **여러 관리자 추가 (선택사항)**
   ```sql
   -- 여러 사용자를 관리자로 설정
   UPDATE users 
   SET is_admin = TRUE 
   WHERE email IN ('admin1@example.com', 'admin2@example.com');
   ```

**참고**: 
- 데이터 이관 스크립트는 `is_admin` 컬럼을 포함하여 이관합니다
- 기존 프로젝트에서 이미 `is_admin = TRUE`로 설정된 사용자는 그대로 이관됩니다
- 하지만 새 프로젝트에서 처음 스키마를 생성하는 경우, 기존 관리자를 수동으로 설정해야 합니다

### 2.4 Storage 버킷 생성

1. **새 Supabase 프로젝트 → Storage**
2. **"New bucket" 클릭**
3. **설정 입력**:
   - **Bucket name**: `images`
   - **Public bucket**: ✅ 체크
   - **File size limit**: `5MB`
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/heic`
4. **"Create bucket" 클릭**

5. **Storage RLS 정책 설정** (SQL Editor에서 실행):
   ```sql
   -- 모든 사용자가 공개 이미지 조회 가능
   CREATE POLICY "Public images are viewable by everyone"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'images');

   -- 인증된 사용자만 이미지 업로드 가능
   CREATE POLICY "Authenticated users can upload images"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'images' 
     AND auth.role() = 'authenticated'
   );

   -- 사용자는 자신이 업로드한 이미지만 삭제 가능
   CREATE POLICY "Users can delete own images"
   ON storage.objects FOR DELETE
   USING (
     bucket_id = 'images' 
     AND auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

---

## 3. 이관 절차

> **💡 빠른 시작**: 단계별 실행 가이드와 체크리스트는 [`migration-step-by-step.md`](./migration-step-by-step.md)를 참조하세요.

### 3.1 데이터베이스 데이터 이관

**스크립트 사용 (권장)**:

#### 3.1.1 환경 변수 설정

**1단계: `.env.local` 파일 확인 및 수정**

프로젝트 루트 디렉토리(`readingtree_v4.0.0`)에 `.env.local` 파일이 있는지 확인합니다.

**Windows (PowerShell)**:
```powershell
# 프로젝트 루트로 이동
cd C:\Users\N100274\OneDrive\2.PJT\readingtree_v4.0.0

# .env.local 파일 확인
Get-Content .env.local
```

**Windows (CMD)**:
```cmd
cd C:\Users\N100274\OneDrive\2.PJT\readingtree_v4.0.0
type .env.local
```

**2단계: 환경 변수 추가**

`.env.local` 파일을 열고 다음 변수들을 추가합니다:

```env
# 기존 프로젝트 정보 (방법 1: 명시적 변수명 사용)
OLD_SUPABASE_URL=https://{old-project-ref}.supabase.co
OLD_SUPABASE_SERVICE_ROLE_KEY={old-service-role-key}

# 새 프로젝트 정보 (필수)
NEW_SUPABASE_URL=https://{new-project-ref}.supabase.co
NEW_SUPABASE_SERVICE_ROLE_KEY={new-service-role-key}
```

**또는 기존 변수명 사용 (방법 2)**:

이미 `NEXT_PUBLIC_SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`가 설정되어 있다면, 기존 프로젝트는 자동으로 인식됩니다. 새 프로젝트 정보만 추가하면 됩니다:

```env
# 기존 프로젝트 (이미 설정되어 있으면 자동 인식)
# NEXT_PUBLIC_SUPABASE_URL=https://{old-project-ref}.supabase.co
# SUPABASE_SERVICE_ROLE_KEY={old-service-role-key}

# 새 프로젝트 정보 (Supabase2_rebuild 블록의 값 사용)
NEW_SUPABASE_URL=https://{new-project-ref}.supabase.co
NEW_SUPABASE_SERVICE_ROLE_KEY={new-service-role-key}
```

**⚠️ 중요**: 
- 기존 프로젝트는 `NEXT_PUBLIC_SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`로 자동 인식됩니다
- 새 프로젝트는 반드시 `NEW_SUPABASE_URL`과 `NEW_SUPABASE_SERVICE_ROLE_KEY`로 명시해야 합니다

**변수 값 확인 방법**:

1. **기존 프로젝트 정보**:
   - Supabase Dashboard → 기존 프로젝트 선택
   - Settings → API
   - **Project URL** 복사 → `OLD_SUPABASE_URL`에 입력
   - **service_role** key 복사 (비밀번호 입력 필요) → `OLD_SUPABASE_SERVICE_ROLE_KEY`에 입력

2. **새 프로젝트 정보**:
   - Supabase Dashboard → 새 프로젝트 선택
   - Settings → API
   - **Project URL** 복사 → `NEW_SUPABASE_URL`에 입력
   - **service_role** key 복사 (비밀번호 입력 필요) → `NEW_SUPABASE_SERVICE_ROLE_KEY`에 입력

**예시**:
```env
# 기존 프로젝트 (예: 미국 리전)
OLD_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
OLD_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjQwMDAwMDAwLCJleHAiOjE5NTU1NzYwMDB9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 새 프로젝트 (예: 서울 리전)
NEW_SUPABASE_URL=https://qrstuvwxyz123456.supabase.co
NEW_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyc3R1dnd4eXoxMjM0NTYiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjQwMDAwMDAwLCJleHAiOjE5NTU1NzYwMDB9.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

#### 3.1.2 스크립트 실행 전 확인사항

**필수 확인사항**:

1. ✅ **스키마 이관 완료 확인**
   - 새 Supabase 프로젝트의 SQL Editor에서 `doc/database/schema.sql` 실행 완료
   - 모든 테이블이 생성되었는지 확인

2. ✅ **환경 변수 설정 확인**
   - `.env.local` 파일에 4개 변수 모두 설정되어 있는지 확인
   - 변수 값에 공백이나 따옴표가 없는지 확인

3. ✅ **Node.js 설치 확인**
   ```bash
   node --version
   # v18 이상이어야 합니다
   ```

4. ✅ **의존성 설치 확인**
   ```bash
   npm install
   # @supabase/supabase-js 패키지가 설치되어 있어야 합니다
   ```

#### 3.1.3 스크립트 실행

**실행 위치**: 프로젝트 루트 디렉토리

**Windows (PowerShell)**:
```powershell
# 1. 프로젝트 루트로 이동
cd C:\Users\N100274\OneDrive\2.PJT\readingtree_v4.0.0

# 2. 스크립트 실행
node scripts/migrate-supabase-data.js
```

**Windows (CMD)**:
```cmd
cd C:\Users\N100274\OneDrive\2.PJT\readingtree_v4.0.0
node scripts/migrate-supabase-data.js
```

**Mac/Linux**:
```bash
cd /path/to/readingtree_v4.0.0
node scripts/migrate-supabase-data.js
```

#### 3.1.4 실행 중 화면 예시

스크립트를 실행하면 다음과 같은 출력이 표시됩니다:

```
🚀 Supabase 데이터 이관 시작...

기존 프로젝트: https://abcdefghijklmnop.supabase.co
새 프로젝트: https://qrstuvwxyz123456.supabase.co

📋 테이블 존재 여부 확인...
✅ 모든 테이블이 존재합니다.

📦 [users] 데이터 이관 시작...
   ✅ 10개 레코드 이관 완료...
   ✅ 20개 레코드 이관 완료...
✅ [users] 데이터 이관 완료: 총 25개 레코드

📦 [books] 데이터 이관 시작...
   ✅ 100개 레코드 이관 완료...
   ✅ 200개 레코드 이관 완료...
✅ [books] 데이터 이관 완료: 총 189개 레코드

...

🔄 시퀀스 값 업데이트...
✅ 시퀀스 값 업데이트 완료

==================================================
📊 이관 결과 요약
==================================================
✅ users: 25개 레코드
✅ books: 189개 레코드
✅ bookshelves: 30개 레코드
✅ user_books: 450개 레코드
✅ notes: 1200개 레코드
✅ groups: 5개 레코드
✅ group_members: 15개 레코드
✅ group_books: 20개 레코드
✅ group_notes: 50개 레코드
✅ transcriptions: 100개 레코드
✅ ocr_usage_stats: 500개 레코드
✅ ocr_logs: 2000개 레코드
==================================================
```

#### 3.1.5 실행 중 주의사항

1. **인터넷 연결 유지**
   - 스크립트 실행 중 인터넷 연결이 끊기면 오류 발생
   - 오류 발생 시 해당 테이블만 재실행 가능

2. **실행 시간**
   - 레코드당 약 0.1초 소요
   - 1000개 레코드 = 약 1-2분
   - 전체 데이터 이관은 데이터 양에 따라 수십 분 소요될 수 있음

3. **중단 시**
   - `Ctrl + C`로 중단 가능
   - 중단 후 재실행 시 이미 이관된 데이터는 자동으로 건너뜀

4. **오류 발생 시**
   - 오류 메시지 확인
   - 해당 테이블만 수동으로 재실행 가능
   - 또는 전체 스크립트 재실행 (중복 데이터는 자동 건너뜀)

#### 3.1.6 실행 후 확인사항

**1단계: 이관 결과 확인**

스크립트 실행 완료 후 표시되는 요약을 확인합니다:
- 모든 테이블이 ✅로 표시되는지 확인
- 레코드 수가 예상과 일치하는지 확인

**2단계: 수동 검증 (선택사항)**

검증 스크립트 실행:
```bash
node scripts/verify-supabase-migration.js
```

또는 Supabase Dashboard에서 직접 확인:
- 새 프로젝트 → Table Editor
- 각 테이블의 레코드 수 확인

**3단계: 데이터 무결성 확인**

새 프로젝트의 SQL Editor에서 다음 쿼리 실행:

```sql
-- 각 테이블의 레코드 수 확인
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'books', COUNT(*) FROM books
UNION ALL
SELECT 'user_books', COUNT(*) FROM user_books
UNION ALL
SELECT 'notes', COUNT(*) FROM notes
UNION ALL
SELECT 'groups', COUNT(*) FROM groups
ORDER BY table_name;

-- 관리자 계정 확인
SELECT id, email, name, is_admin 
FROM users 
WHERE is_admin = TRUE;
-- 기존 관리자 이메일이 is_admin = TRUE로 설정되어 있는지 확인
-- 설정되지 않았다면 2.3.3의 관리자 설정 방법을 따라 설정하세요
```

**4단계: 관리자 계정 설정 (필수)**

데이터 이관 후 관리자 계정을 설정해야 합니다. 자세한 내용은 [2.3.3 관리자 계정 설정](#233-관리자-계정-설정) 또는 [`admin-setup-guide.md`](./admin-setup-guide.md)를 참조하세요.

**4단계: 관리자 계정 설정 (필수)**

데이터 이관 후 관리자 계정을 설정해야 합니다. 자세한 내용은 [2.3.3 관리자 계정 설정](#233-관리자-계정-설정) 또는 [`admin-setup-guide.md`](./admin-setup-guide.md)를 참조하세요.

이 스크립트는:
- 모든 테이블의 데이터를 순차적으로 이관
- 배치 처리로 API Rate Limit 방지
- 진행 상황 실시간 표시
- 이관 결과 요약 제공

**⚠️ 중요 사항**:

1. **스크립트로 자동 이관되는 항목**:
   - ✅ `public` 스키마의 모든 테이블 데이터 (users, books, user_books, notes, groups 등)
   - ✅ 외래 키 의존성 순서로 자동 정렬하여 이관
   - ✅ 중복 데이터 자동 감지 및 건너뛰기
   - ✅ 배치 처리로 대용량 데이터 안전하게 이관

2. **스크립트로 이관되지 않는 항목**:
   - ❌ `auth.users` 테이블: Supabase Auth 시스템 테이블로 직접 이관 불가
     - **해결 방법**: 사용자가 새 프로젝트에서 직접 로그인하면 자동 생성됨
     - 또는 Supabase Dashboard의 Database → Backups 기능 사용 (전체 DB 백업/복원)
   - ❌ 시퀀스 값: UUID를 사용하는 테이블은 시퀀스가 없으므로 불필요

3. **주의사항**:
   - 스키마(`schema.sql`)를 먼저 실행해야 합니다
   - 대용량 데이터의 경우 시간이 오래 걸릴 수 있습니다 (레코드당 약 0.1초)
   - 네트워크 오류 시 해당 테이블만 재실행하면 됩니다

**수동 이관 (대안 - auth.users 포함 전체 이관 시)**:

Supabase Dashboard의 Database → Backups 기능을 사용하면 `auth.users`를 포함한 전체 데이터베이스를 이관할 수 있습니다:

1. 기존 프로젝트 → Database → Backups → "Create backup"
2. 새 프로젝트 → Database → Backups → "Restore from backup"

**⚠️ 주의**: 이 방법은 전체 데이터베이스를 덮어쓰므로, 새 프로젝트에 이미 스키마를 생성했다면 충돌이 발생할 수 있습니다.

### 3.2 Storage 파일 이관

**스크립트 사용 (권장)**:

```bash
node scripts/migrate-supabase-storage.js
```

이 스크립트는:
- `images` 버킷의 모든 파일을 재귀적으로 탐색
- 각 파일을 다운로드하여 새 프로젝트에 업로드
- 진행 상황 실시간 표시
- 이관 결과 요약 제공

**수동 이관 (대안)**:

1. 기존 프로젝트 → Storage → images
2. 모든 파일 다운로드
3. 새 프로젝트 → Storage → images
4. 동일한 경로로 파일 업로드

### 3.3 OAuth 설정 이관

**수동 작업 필요**:

#### Kakao OAuth 설정

1. **Supabase Dashboard → Authentication → Providers**
2. **Kakao Provider 활성화**
3. **설정 입력**:
   - **Kakao Client ID**: 카카오 개발자 센터에서 확인
   - **Kakao Client Secret**: 카카오 개발자 센터에서 확인
4. **Redirect URL 확인**: `https://{new-project-ref}.supabase.co/auth/v1/callback`

5. **카카오 개발자 센터 설정 업데이트**:
   - https://developers.kakao.com/ 접속
   - 내 애플리케이션 선택
   - **제품 설정 → 카카오 로그인 → Redirect URI**
   - 새 URL 추가: `https://{new-project-ref}.supabase.co/auth/v1/callback`
   - 기존 URL은 테스트 기간 동안 유지 권장

#### Google OAuth 설정

1. **Supabase Dashboard → Authentication → Providers**
2. **Google Provider 활성화**
3. **설정 입력**:
   - **Google Client ID**: Google Cloud Console에서 확인
   - **Google Client Secret**: Google Cloud Console에서 확인
4. **Redirect URL 확인**: `https://{new-project-ref}.supabase.co/auth/v1/callback`

5. **Google Cloud Console 설정 업데이트**:
   - https://console.cloud.google.com/ 접속
   - 프로젝트 선택
   - **APIs & Services → Credentials**
   - OAuth 2.0 Client ID 선택
   - **Authorized redirect URIs**에 새 URL 추가

---

## 4. 검증 및 테스트

### 4.1 데이터 검증

**스크립트 사용**:

```bash
node scripts/verify-supabase-migration.js
```

이 스크립트는:
- 모든 테이블의 레코드 수 비교
- Storage 파일 수 비교
- 불일치 항목 자동 감지
- 검증 결과 요약 제공

### 4.2 수동 검증

#### 데이터베이스 검증

```sql
-- 각 테이블의 레코드 수 확인
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'books', COUNT(*) FROM books
UNION ALL
SELECT 'user_books', COUNT(*) FROM user_books
UNION ALL
SELECT 'notes', COUNT(*) FROM notes
-- ... 기타 테이블
ORDER BY table_name;
```

#### Storage 검증

- Supabase Dashboard → Storage → images
- 파일 목록 확인
- 몇 개 파일의 URL 접근 테스트

### 4.3 애플리케이션 테스트

**환경 변수 업데이트 후**:

1. **로컬 개발 환경 테스트**
   - `.env.local` 파일 업데이트
   - 개발 서버 재시작
   - 주요 기능 테스트:
     - 로그인 (Kakao, Google)
     - 책 추가/조회
     - 기록 생성/조회
     - 서재 관리
     - 독서모임

2. **프로덕션 환경 테스트**
   - Vercel 환경 변수 업데이트
   - 재배포
   - 프로덕션 환경에서 동일한 기능 테스트

---

## 5. 문제 해결

### 5.1 데이터 이관 오류

**문제**: 특정 테이블 이관 실패

#### 5.1.1 users 테이블 오류

**증상**: `insert or update on table "users" violates foreign key constraint "users_id_fkey"`

**원인**: `users` 테이블은 `auth.users(id)`를 참조하는데, 새 프로젝트에 `auth.users`가 없음

**해결**:
- ✅ **정상 동작**: 스크립트가 자동으로 `users` 테이블을 건너뜀
- 사용자가 새 프로젝트에서 직접 로그인하면 `auth.users`와 `users` 테이블이 자동 생성됨
- 또는 Supabase Dashboard의 Database → Backups 기능 사용 (전체 DB 백업/복원)

#### 5.1.2 스키마 불일치 오류

**증상**: `Could not find the 'category' column` 또는 `Could not find the 'book_format' column`

**원인**: 기존 프로젝트에는 컬럼이 있지만 새 스키마에는 없음

**해결**:
- ✅ **자동 처리**: 스크립트가 새 스키마에 없는 컬럼을 자동으로 필터링
- 또는 `schema.sql`에 누락된 컬럼을 추가 (예: `category`, `book_format`)

#### 5.1.3 외래 키 제약 조건 오류

**증상**: `insert or update on table "X" violates foreign key constraint "X_Y_fkey"`

**원인**: 참조하는 테이블의 데이터가 먼저 이관되어야 함

**해결**:
1. 에러 메시지에서 참조하는 테이블 확인
2. 해당 테이블이 먼저 이관되었는지 확인
3. 참조하는 테이블의 이관이 실패했다면, 그 원인을 먼저 해결
4. 수동으로 해당 테이블만 재이관

**예시**:
- `bookshelves` 오류 → `users` 테이블 이관 실패로 인한 연쇄 오류
- `groups` 오류 → `users` 테이블 이관 실패로 인한 연쇄 오류

#### 5.1.4 데이터 형식 오류

**증상**: `invalid input syntax for type integer: "205\n285"`

**원인**: 데이터에 잘못된 형식이 포함됨 (예: `page_number`에 줄바꿈 포함)

**해결**:
- ✅ **자동 처리**: 스크립트가 `notes.page_number` 등 잘못된 형식의 데이터를 자동 정제
- 정제 불가능한 데이터는 `null`로 설정됨

#### 5.1.5 일반적인 이관 오류

**해결**:
1. 에러 메시지 확인
2. 해당 테이블의 RLS 정책 확인
3. Service Role Key 권한 확인
4. 수동으로 해당 테이블만 재이관

### 5.2 Storage 파일 이관 오류

**문제**: 일부 파일 업로드 실패

**해결**:
1. 실패한 파일 경로 확인
2. 파일 크기 확인 (5MB 제한)
3. 수동으로 해당 파일만 재업로드

### 5.3 OAuth 로그인 실패

**문제**: 새 프로젝트에서 로그인 불가

**해결**:
1. OAuth Provider 설정 확인
2. Redirect URL이 정확한지 확인
3. 카카오/구글 개발자 센터에 새 URL 등록 확인
4. Supabase Dashboard의 URL Configuration 확인

### 5.4 관리자 페이지 접근 불가

**문제**: 관리자로 설정했지만 `/admin` 페이지에 접근할 수 없음

**원인**: 
- `is_admin`이 `FALSE`로 설정되어 있음
- 세션 캐시 문제

**해결**:
1. **관리자 설정 확인**:
   ```sql
   SELECT email, is_admin FROM users WHERE email = 'your-email@example.com';
   ```

2. **관리자로 설정**:
   ```sql
   UPDATE users SET is_admin = TRUE WHERE email = 'your-email@example.com';
   ```

3. **세션 갱신**:
   - 브라우저에서 로그아웃 후 다시 로그인
   - 개발 서버 재시작 (`npm run dev`)
   - 브라우저 캐시 클리어

**자세한 내용**: `doc/migration/admin-setup-guide.md` 참조

### 5.5 환경 변수 문제

**문제**: 애플리케이션이 새 프로젝트에 연결되지 않음

**해결**:
1. `.env.local` 파일 확인
2. Vercel 환경 변수 확인
3. 개발 서버 재시작
4. 브라우저 캐시 클리어

### 5.5 관리자 페이지 접근 불가

**문제**: 관리자로 설정했지만 `/admin` 페이지에 접근할 수 없음

**원인**: 
- `is_admin`이 `FALSE`로 설정되어 있음
- 세션 캐시 문제

**해결**:
1. **관리자 설정 확인**:
   ```sql
   SELECT email, is_admin FROM users WHERE email = 'your-email@example.com';
   ```

2. **관리자로 설정**:
   ```sql
   UPDATE users SET is_admin = TRUE WHERE email = 'your-email@example.com';
   ```

3. **세션 갱신**:
   - 브라우저에서 로그아웃 후 다시 로그인
   - 개발 서버 재시작 (`npm run dev`)
   - 브라우저 캐시 클리어

**자세한 내용**: `doc/migration/admin-setup-guide.md` 참조

---

## 6. 롤백 계획

이관 실패 시:

1. **기존 프로젝트 유지**
   - 새 프로젝트 삭제하지 않음
   - 기존 프로젝트는 그대로 유지

2. **환경 변수 원복**
   - `.env.local` 파일을 기존 값으로 복원
   - Vercel 환경 변수도 기존 값으로 복원

3. **재시도**
   - 문제 해결 후 다시 이관 시도

---

## 7. 참고 문서

### 핵심 문서
- **단계별 실행 가이드**: [`migration-step-by-step.md`](./migration-step-by-step.md) - 빠른 참조용 체크리스트
- **관리자 설정 가이드**: [`admin-setup-guide.md`](./admin-setup-guide.md) - 관리자 계정 설정 상세 가이드

### 데이터베이스 관련
- **스키마 파일**: `doc/database/schema.sql`
- **데이터 모델**: `doc/database/DATA_MODEL.md`
- **마이그레이션 파일**: `doc/database/migration-202601170000__users__add_is_admin_column.sql`

### 이관 스크립트
- `scripts/migrate-supabase-data.js` - 데이터베이스 데이터 이관
- `scripts/migrate-supabase-storage.js` - Storage 파일 이관
- `scripts/verify-supabase-migration.js` - 이관 결과 검증

---

## 8. 주요 변경 사항 (2026-01-17)

### 관리자 권한 관리 방식 변경

**이전 방식 (하드코딩)**:
- 코드에 관리자 이메일(`cdhnaya@kakao.com`) 하드코딩
- 관리자 추가/변경 시 코드 수정 필요
- 여러 파일에서 중복 관리

**새로운 방식 (DB 관리)**:
- `users.is_admin` 컬럼으로 관리
- 데이터베이스에서 직접 관리자 추가/제거 가능
- 코드 수정 없이 관리자 변경 가능
- 확장 가능 (여러 관리자 지원)

**마이그레이션 시 주의사항**:
- 데이터 이관 후 기존 관리자 이메일을 `is_admin = TRUE`로 설정해야 합니다
- 자세한 내용은 [2.3.3 관리자 계정 설정](#233-관리자-계정-설정-선택사항) 섹션을 참조하세요
- 상세 가이드는 `doc/migration/admin-setup-guide.md`를 참조하세요

---

**이 가이드를 따라 단계별로 진행하면 안전하게 데이터를 이관할 수 있습니다.**
