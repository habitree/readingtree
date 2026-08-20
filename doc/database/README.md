# 데이터베이스 스키마 설정 가이드

이 폴더에는 Habitree Reading Hub 프로젝트의 Supabase 데이터베이스 스키마 파일이 포함되어 있습니다.

---

## 📋 파일 구조1

```
doc/database/
├── README.md              # 이 파일
├── schema.sql             # 전체 데이터베이스 스키마 (통합 파일)
└── verification-queries.sql # 스키마 검증 쿼리
```

---

## 🚀 빠른 시작

### 방법 1: SQL Editor에서 직접 실행 (권장)

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 왼쪽 메뉴에서 "SQL Editor" 클릭
   - "New query" 클릭

3. **스키마 파일 실행**
   - `schema.sql` 파일의 전체 내용을 복사
   - SQL Editor에 붙여넣기
   - "Run" 버튼 클릭 (또는 `Ctrl+Enter`)
   - **주의**: 스키마 파일은 테이블 생성 순서를 고려하여 작성되었습니다.
     - `groups` 테이블의 RLS 정책이 `group_members` 테이블 생성 후 업데이트됩니다.
     - 오류가 발생하면 전체 파일을 다시 실행하세요.

4. **결과 확인**
   - 성공 메시지 확인
   - Table Editor에서 테이블 생성 확인
   - 오류 발생 시: "relation does not exist" 오류는 테이블 생성 순서 문제일 수 있습니다.
     전체 파일을 다시 실행하면 해결됩니다.

### 방법 2: Supabase CLI 사용 (선택사항)

```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref <your-project-ref>

# 스키마 파일을 migrations 폴더에 복사
cp doc/database/schema.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_schema.sql

# 마이그레이션 실행
supabase db push
```

---

## 📦 Storage 버킷 생성

### 1. 버킷 생성

1. Supabase 대시보드 → **Storage** 이동
2. **"New bucket"** 클릭
3. 다음 설정 입력:
   - **Bucket name**: `images`
   - **Public bucket**: ✅ 체크 (공개 이미지 접근을 위해)
   - **File size limit**: `5MB`
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/heic`
4. **"Create bucket"** 클릭

### 2. Storage RLS 정책 설정

버킷 생성 후 SQL Editor에서 다음 정책을 실행:

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

## ✅ 검증 체크리스트

### 데이터베이스 스키마

#### ENUM 타입
- [ ] `reading_status` 타입 생성 확인 (schema.sql 라인 29)
- [ ] `note_type` 타입 생성 확인 (schema.sql 라인 32)
- [ ] `member_role` 타입 생성 확인 (schema.sql 라인 35)
- [ ] `member_status` 타입 생성 확인 (schema.sql 라인 38)

**검증 쿼리:**
```sql
SELECT typname FROM pg_type WHERE typtype = 'e' 
AND typname IN ('reading_status', 'note_type', 'member_role', 'member_status');
```

#### 테이블
- [ ] `users` 테이블 생성 확인 (schema.sql 라인 45)
- [ ] `books` 테이블 생성 확인 (schema.sql 라인 70)
- [ ] `user_books` 테이블 생성 확인 (schema.sql 라인 92)
- [ ] `notes` 테이블 생성 확인 (schema.sql 라인 129)
- [ ] `groups` 테이블 생성 확인 (schema.sql 라인 176)
- [ ] `group_members` 테이블 생성 확인 (schema.sql 라인 213)
- [ ] `group_books` 테이블 생성 확인 (schema.sql 라인 260)
- [ ] `group_notes` 테이블 생성 확인 (schema.sql 라인 290)

**검증 쿼리:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'books', 'user_books', 'notes', 'groups', 'group_members', 'group_books', 'group_notes');
```

#### 인덱스
- [ ] 모든 기본 인덱스 생성 확인
- [ ] Full-text Search 인덱스 생성 확인 (`idx_books_title_fts`, `idx_books_author_fts`, `idx_notes_content_fts`) (schema.sql 라인 88-89, 151)
- [ ] 태그 인덱스 (GIN) 생성 확인 (`idx_notes_tags`) (schema.sql 라인 154)

**검증 쿼리:**
```sql
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname IN ('idx_books_title_fts', 'idx_books_author_fts', 'idx_notes_content_fts', 'idx_notes_tags');
```

#### RLS 정책
- [ ] `users` 테이블 RLS 활성화 및 정책 확인 (schema.sql 라인 59, 61, 65)
- [ ] `books` 테이블 (RLS 없음, 공개 데이터)
- [ ] `user_books` 테이블 RLS 활성화 및 정책 확인 (schema.sql 라인 110, 112-124)
- [ ] `notes` 테이블 RLS 활성화 및 정책 확인 (schema.sql 라인 157, 159-171)
- [ ] `groups` 테이블 RLS 활성화 및 정책 확인 (schema.sql 라인 191, 196-208, 253)
- [ ] `group_members` 테이블 RLS 활성화 및 정책 확인 (schema.sql 라인 229, 231-241)
- [ ] `group_books` 테이블 RLS 활성화 및 정책 확인 (schema.sql 라인 275, 277-283)
- [ ] `group_notes` 테이블 RLS 활성화 및 정책 확인 (schema.sql 라인 303, 305-311)

**검증 쿼리:**
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'books', 'user_books', 'notes', 'groups', 'group_members', 'group_books', 'group_notes');
```

#### 함수
- [ ] `update_updated_at_column()` 함수 생성 확인 (schema.sql 라인 322)
- [ ] `handle_new_user()` 함수 생성 확인 (schema.sql 라인 331)
- [ ] `get_user_completed_books_count()` 함수 생성 확인 (schema.sql 라인 347)
- [ ] `get_user_notes_count_this_week()` 함수 생성 확인 (schema.sql 라인 364)

**검증 쿼리:**
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_updated_at_column', 'handle_new_user', 'get_user_completed_books_count', 'get_user_notes_count_this_week');
```

#### 트리거
- [ ] `update_users_updated_at` 트리거 생성 확인 (schema.sql 라인 383)
- [ ] `update_books_updated_at` 트리거 생성 확인 (schema.sql 라인 388)
- [ ] `update_user_books_updated_at` 트리거 생성 확인 (schema.sql 라인 393)
- [ ] `update_notes_updated_at` 트리거 생성 확인 (schema.sql 라인 398)
- [ ] `update_groups_updated_at` 트리거 생성 확인 (schema.sql 라인 403)
- [ ] `on_auth_user_created` 트리거 생성 확인 (schema.sql 라인 409)

**검증 쿼리:**
```sql
SELECT trigger_name, event_object_table FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name IN ('update_users_updated_at', 'update_books_updated_at', 'update_user_books_updated_at', 'update_notes_updated_at', 'update_groups_updated_at', 'on_auth_user_created');
```

### Storage

- [ ] `images` 버킷 생성 확인
- [ ] 버킷이 Public으로 설정되었는지 확인
- [ ] Storage RLS 정책 설정 확인

### 테스트

- [ ] 테스트 사용자 생성 후 프로필 자동 생성 확인
- [ ] RLS 정책이 올바르게 작동하는지 확인 (본인 데이터만 조회 가능)
- [ ] `updated_at` 자동 업데이트 확인
- [ ] 통계 함수가 올바르게 작동하는지 확인

---

## 🔍 검증 쿼리

스키마가 올바르게 적용되었는지 확인하기 위한 검증 쿼리 파일이 제공됩니다:

**`verification-queries.sql`** 파일을 Supabase SQL Editor에서 실행하여 모든 항목을 확인하세요.

### 빠른 검증

각 항목을 개별적으로 확인하려면 아래 쿼리를 사용하세요:

#### 1. ENUM 타입 확인 (4개)

```sql
SELECT typname 
FROM pg_type 
WHERE typtype = 'e' 
AND typname IN ('reading_status', 'note_type', 'member_role', 'member_status')
ORDER BY typname;
```

#### 2. 테이블 확인 (8개)

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'books', 'user_books', 'notes', 'groups', 'group_members', 'group_books', 'group_notes')
ORDER BY table_name;
```

#### 3. 인덱스 확인

```sql
-- Full-text Search 인덱스 (3개)
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname IN ('idx_books_title_fts', 'idx_books_author_fts', 'idx_notes_content_fts');

-- 태그 인덱스 (1개)
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname = 'idx_notes_tags';
```

#### 4. RLS 정책 확인

```sql
-- 모든 RLS 정책 확인
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- RLS 활성화 상태 확인
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'books', 'user_books', 'notes', 'groups', 'group_members', 'group_books', 'group_notes')
ORDER BY tablename;
```

#### 5. 함수 확인 (4개)

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
AND routine_name IN (
    'update_updated_at_column',
    'handle_new_user',
    'get_user_completed_books_count',
    'get_user_notes_count_this_week'
)
ORDER BY routine_name;
```

#### 6. 트리거 확인 (6개)

```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name IN (
    'update_users_updated_at',
    'update_books_updated_at',
    'update_user_books_updated_at',
    'update_notes_updated_at',
    'update_groups_updated_at',
    'on_auth_user_created'
)
ORDER BY event_object_table, trigger_name;
```

---

## 🐛 문제 해결

### 오류: "relation already exists"

이미 테이블이나 함수가 존재하는 경우:
- 기존 테이블/함수를 삭제하거나
- `CREATE OR REPLACE` 구문 사용 (함수의 경우)
- `DROP TABLE IF EXISTS` 구문 사용 (테이블의 경우)

### 오류: "permission denied"

RLS 정책이 올바르게 설정되지 않은 경우:
- 각 테이블의 RLS 정책을 다시 확인
- `auth.uid()` 함수가 올바르게 작동하는지 확인

### 오류: "function does not exist"

함수가 생성되지 않은 경우:
- 함수 생성 순서 확인
- `CREATE OR REPLACE FUNCTION` 구문 사용

---

## 📚 참고 문서

- [Supabase 공식 문서](https://supabase.com/docs)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)
- `doc/software_design.md` (4.2, 4.3 섹션)
- `doc/archive/2026/tasks/backend/00-bkend-database-schema-plan.md`

---

**문서 끝**

