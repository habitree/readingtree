---
alwaysApply: false
description: "DB/RLS 정책 작업 시 적용하는 규칙"
globs:
  - "doc/database/**"
  - "types/database.ts"
---

## [DB/RLS 관리 규칙]

# DB/RLS 관리 규칙 (Database Row Level Security Rules)

**프로젝트:** Habitree Reading Hub v4.0.0  
**작성일:** 2025년 12월  
**버전:** 1.0  
**적용 범위:** 전체 프로젝트

**참고:** 상세 문서는 `doc/database/DATA_MODEL.md`와 `doc/database/schema.sql`을 참조하세요.

---

## 목차

1. [규칙 개요](#1-규칙-개요)
2. [테이블 생성 규칙](#2-테이블-생성-규칙)
3. [RLS 정책 작성 규칙](#3-rls-정책-작성-규칙)
4. [소유자 판단 기준](#4-소유자-판단-기준)
5. [식별자 규칙](#5-식별자-규칙)
6. [RLS 정책 패턴](#6-rls-정책-패턴)
7. [규칙 위반 시 조치](#7-규칙-위반-시-조치)

---

## 1. 규칙 개요

### 1.1 목적

Supabase에서 기능이 늘수록 큰 사고는 2가지입니다:

1. **RLS 미적용으로 데이터 유출**
2. **뒤늦게 RLS 적용하면서 앱 전체가 401/빈 목록이 됨**

이 규칙은 이러한 문제를 방지하기 위해 **테이블 생성과 동시에 RLS 정책을 작성**하도록 강제합니다.

### 1.2 핵심 원칙

- ✅ **테이블 생성 → 즉시 RLS Enable**
- ✅ **즉시 SELECT/INSERT/UPDATE/DELETE 정책 작성**
- ✅ **"user_id = auth.uid()" 패턴을 표준으로**
- ✅ **users는 auth.users.id와 1:1로 매핑**
- ✅ **내부 식별자는 UUID(auth.uid())로 고정**

### 1.3 금지 사항

- ❌ RLS 없이 테이블 생성 후 나중에 추가
- ❌ 일부 정책만 작성하고 나머지는 나중에
- ❌ 이메일 기반 식별자 사용
- ❌ auth.users 외의 사용자 테이블 참조

---

## 2. 테이블 생성 규칙

### 2.1 필수 순서

테이블을 생성할 때는 **반드시 다음 순서를 따릅니다**:

```sql
-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS table_name (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- ... 기타 컬럼
);

-- 2. 인덱스 생성 (필요한 경우)
CREATE INDEX IF NOT EXISTS idx_table_name_user_id ON table_name(user_id);

-- 3. RLS 즉시 활성화 (필수!)
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 즉시 작성 (필수!)
-- SELECT 정책
DROP POLICY IF EXISTS "Users can view own records" ON table_name;
CREATE POLICY "Users can view own records"
    ON table_name FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT 정책
DROP POLICY IF EXISTS "Users can insert own records" ON table_name;
CREATE POLICY "Users can insert own records"
    ON table_name FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE 정책
DROP POLICY IF EXISTS "Users can update own records" ON table_name;
CREATE POLICY "Users can update own records"
    ON table_name FOR UPDATE
    USING (auth.uid() = user_id);

-- DELETE 정책
DROP POLICY IF EXISTS "Users can delete own records" ON table_name;
CREATE POLICY "Users can delete own records"
    ON table_name FOR DELETE
    USING (auth.uid() = user_id);
```

### 2.2 금지된 패턴

```sql
-- ❌ 금지: RLS 없이 테이블 생성
CREATE TABLE table_name (...);
-- RLS를 나중에 추가하는 것은 금지!

-- ❌ 금지: 일부 정책만 작성
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own records" ...;
-- INSERT/UPDATE/DELETE 정책이 없으면 금지!

-- ❌ 금지: 테이블 생성과 RLS 정책 작성 분리
-- 마이그레이션 파일 1: CREATE TABLE
-- 마이그레이션 파일 2: ALTER TABLE ... ENABLE ROW LEVEL SECURITY
-- 이렇게 분리하면 안 됩니다!
```

---

## 3. RLS 정책 작성 규칙

### 3.1 필수 정책

모든 사용자 데이터 테이블은 **반드시 다음 4가지 정책을 모두 작성**해야 합니다:

1. **SELECT**: 조회 권한
2. **INSERT**: 생성 권한
3. **UPDATE**: 수정 권한
4. **DELETE**: 삭제 권한

### 3.2 공개 데이터 예외

**공개 데이터** (`books` 등)는 RLS를 활성화하지 않아도 됩니다:

```sql
-- ✅ 허용: 공개 데이터는 RLS 없음
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    -- ...
);
-- RLS 활성화 없음 (모든 사용자가 조회 가능)
```

### 3.3 부분 공개 데이터

**부분 공개 데이터** (`notes` 등)는 조건부 SELECT 정책을 작성합니다:

```sql
-- ✅ 올바른 예: 부분 공개 데이터
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes or public notes"
    ON notes FOR SELECT
    USING (
        auth.uid() = user_id 
        OR is_public = TRUE 
        OR is_sample = TRUE
    );
```

---

## 4. 소유자 판단 기준

### 4.1 표준 패턴

**소유자 판단은 반드시 `auth.uid()` 기준으로 합니다:**

```sql
-- ✅ 올바른 예: 표준 패턴
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id)
```

### 4.2 컬럼명 규칙

소유자 컬럼명은 다음 중 하나를 사용합니다:

- `user_id`: 일반적인 사용자 소유 데이터
- `leader_id`: 그룹 리더 소유 데이터
- `owner_id`: 명시적 소유자 (선택적)

**중요**: 모든 사용자 관련 외래 키는 `auth.users(id)`를 참조해야 합니다.

```sql
-- ✅ 올바른 예: auth.users 참조
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE

-- ❌ 금지: 다른 사용자 테이블 참조
user_id UUID NOT NULL REFERENCES users(id) -- 금지! auth.users를 참조해야 함
```

### 4.3 users 테이블 특수 규칙

`users` 테이블은 `auth.users(id)`와 1:1 관계입니다:

```sql
-- ✅ 올바른 예: users 테이블
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    -- ... 기타 컬럼
);

-- RLS 정책 (id가 auth.users.id와 동일)
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);
```

---

## 5. 식별자 규칙

### 5.1 UUID 사용

**모든 내부 식별자는 UUID를 사용합니다:**

```sql
-- ✅ 올바른 예: UUID 사용
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID NOT NULL REFERENCES auth.users(id)

-- ❌ 금지: 이메일 기반 식별자
email VARCHAR(255) PRIMARY KEY -- 금지!
user_email VARCHAR(255) NOT NULL -- 외래 키로 사용 금지!
```

### 5.2 auth.uid() 기준

**소유자 판단은 항상 `auth.uid()`를 사용합니다:**

```sql
-- ✅ 올바른 예: auth.uid() 사용
USING (auth.uid() = user_id)

-- ❌ 금지: 이메일 기반 판단
USING (auth.email() = user_email) -- 금지!
```

### 5.3 UUID 생성 방식

**새로운 테이블 생성 시 `gen_random_uuid()`를 사용합니다:**

```sql
-- ✅ 권장: gen_random_uuid() 사용 (PostgreSQL 13+)
id UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- ⚠️ 허용: uuid_generate_v4() (기존 코드 호환)
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
```

**새로운 테이블은 반드시 `gen_random_uuid()`를 사용합니다.**

---

## 6. RLS 정책 패턴

### 6.1 개인 소유 데이터 패턴

**표준 패턴: 자신의 데이터만 접근**

```sql
-- SELECT: 자신의 데이터만 조회
CREATE POLICY "Users can view own records"
    ON table_name FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: 자신의 데이터만 생성
CREATE POLICY "Users can insert own records"
    ON table_name FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: 자신의 데이터만 수정
CREATE POLICY "Users can update own records"
    ON table_name FOR UPDATE
    USING (auth.uid() = user_id);

-- DELETE: 자신의 데이터만 삭제
CREATE POLICY "Users can delete own records"
    ON table_name FOR DELETE
    USING (auth.uid() = user_id);
```

### 6.2 그룹 소유 데이터 패턴

**그룹 리더 소유 데이터**

```sql
-- SELECT: 리더 또는 공개 그룹 멤버만 조회
CREATE POLICY "Leaders and members can view group data"
    ON group_table FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE id = group_table.group_id 
            AND leader_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM groups 
            WHERE id = group_table.group_id 
            AND is_public = TRUE
        )
    );

-- INSERT: 리더만 생성
CREATE POLICY "Leaders can insert group data"
    ON group_table FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE id = group_table.group_id 
            AND leader_id = auth.uid()
        )
    );
```

### 6.3 무한 재귀 방지

**RLS 정책에서 자기 자신을 참조하면 무한 재귀가 발생합니다:**

```sql
-- ❌ 금지: 무한 재귀 발생
CREATE POLICY "Members can view group members"
    ON group_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM group_members -- 자기 자신 참조!
            WHERE group_id = group_members.group_id
            AND user_id = auth.uid()
        )
    );

-- ✅ 올바른 예: groups 테이블만 참조
CREATE POLICY "Members can view group members"
    ON group_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM groups -- groups 테이블만 참조
            WHERE id = group_members.group_id 
            AND leader_id = auth.uid()
        )
        OR
        user_id = auth.uid() -- 자신의 멤버십 정보
    );
```

---

## 7. 규칙 위반 시 조치

### 7.1 발견 시 즉시 수정

규칙 위반 코드를 발견하면:

1. **RLS 없이 테이블 생성**
   → 즉시 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` 추가
   → 모든 정책(SELECT/INSERT/UPDATE/DELETE) 작성

2. **일부 정책만 작성**
   → 누락된 정책 즉시 추가

3. **이메일 기반 식별자 사용**
   → UUID로 변경하고 `auth.users(id)` 참조로 수정

4. **auth.users 외의 사용자 테이블 참조**
   → `auth.users(id)` 참조로 변경

### 7.2 마이그레이션 파일 작성

규칙 위반을 수정할 때는 반드시 마이그레이션 파일을 작성합니다:

**파일명 규칙:**
```
YYYYMMDDHHmm__<테이블명>__<변경내용>.sql
```

**예시:**
- `202412151430__notes__add_rls_policies.sql`
- `202412151500__users__fix_user_id_reference.sql`

**마이그레이션 파일 위치:**
- `doc/database/migrations/` (향후 정리 예정)
- 현재는 `doc/database/`에 직접 위치

### 7.3 Idempotent 작성 원칙

마이그레이션 파일은 **idempotent**하게 작성합니다:

```sql
-- ✅ 올바른 예: Idempotent 마이그레이션
DROP POLICY IF EXISTS "Users can view own records" ON table_name;
CREATE POLICY "Users can view own records"
    ON table_name FOR SELECT
    USING (auth.uid() = user_id);

-- ❌ 나쁜 예: Idempotent하지 않음
CREATE POLICY "Users can view own records" -- 여러 번 실행 시 오류 발생
    ON table_name FOR SELECT
    USING (auth.uid() = user_id);
```

---

## 8. 체크리스트

새로운 테이블 생성 시:

- [ ] 테이블 생성 직후 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` 실행
- [ ] SELECT 정책 작성
- [ ] INSERT 정책 작성
- [ ] UPDATE 정책 작성
- [ ] DELETE 정책 작성
- [ ] 모든 사용자 관련 외래 키가 `auth.users(id)` 참조
- [ ] 소유자 판단이 `auth.uid() = user_id` 패턴 사용
- [ ] UUID 생성 시 `gen_random_uuid()` 사용 (새 테이블)
- [ ] 무한 재귀 방지 (RLS 정책에서 자기 자신 참조 금지)
- [ ] `doc/database/DATA_MODEL.md`에 테이블 정의 추가
- [ ] `doc/database/schema.sql`에 테이블 및 RLS 정책 추가

---

## 9. 참고 사항

### 9.1 현재 프로젝트의 RLS 정책

현재 프로젝트는 다음 테이블에 RLS가 활성화되어 있습니다:

- ✅ `users`: 개인 프로필 (auth.uid() = id)
- ✅ `user_books`: 사용자 독서 목록 (auth.uid() = user_id)
- ✅ `notes`: 사용자 기록 (auth.uid() = user_id OR is_public = TRUE)
- ✅ `groups`: 독서모임 (리더/멤버/공개 그룹)
- ✅ `group_members`: 모임 멤버십
- ✅ `group_books`: 모임 책
- ✅ `group_notes`: 모임 공유 기록
- ❌ `books`: 공개 데이터 (RLS 없음)

### 9.2 RLS 정책 검증

RLS 정책이 올바르게 작동하는지 확인:

```sql
-- RLS 활성화 상태 확인
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 9.3 디버깅

RLS 정책 문제 발생 시:

1. RLS가 활성화되어 있는지 확인
2. 정책이 올바르게 작성되었는지 확인
3. `auth.uid()`가 올바르게 반환되는지 확인
4. 무한 재귀가 발생하지 않는지 확인

---

**이 규칙은 프로젝트의 DB/RLS 관리 규칙 단일 기준입니다. 모든 개발자는 이 규칙을 준수해야 합니다.**

**⚠️ 중요: 테이블 만드는 순간 정책도 같이 만든다. 나중에 추가하면 지옥이다.**

**상세 문서:** `doc/database/DATA_MODEL.md`, `doc/database/schema.sql` 참조
