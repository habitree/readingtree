---
alwaysApply: false
description: "마이그레이션 파일 작성 시 적용하는 규칙"
globs:
  - "doc/database/migration-*"
---

## [마이그레이션 관리 규칙]

# 마이그레이션 관리 규칙 (Database Migration Rules)

**프로젝트:** Habitree Reading Hub v4.0.0  
**작성일:** 2025년 12월  
**버전:** 1.0  
**적용 범위:** 전체 프로젝트

**참고:** 상세 문서는 `doc/database/DATA_MODEL.md`와 `doc/database/README.md`를 참조하세요.

---

## 목차

1. [규칙 개요](#1-규칙-개요)
2. [마이그레이션 파일 규칙](#2-마이그레이션-파일-규칙)
3. [필수 기록 사항](#3-필수-기록-사항)
4. [파일명 규칙](#4-파일명-규칙)
5. [작성 규칙](#5-작성-규칙)
6. [문서화 규칙](#6-문서화-규칙)
7. [규칙 위반 시 조치](#7-규칙-위반-시-조치)

---

## 1. 규칙 개요

### 1.1 목적

바이브코딩은 "그때그때 콘솔에서 DB 수정"을 하게 됩니다.  
하지만 기능이 늘면, 어느 순간부터 DB 스키마가 재현 불가능해져서 팀이 아니어도 본인이 고생합니다.

이 규칙은 **모든 스키마 변경을 기록**하여 재현 가능한 데이터베이스를 유지합니다.

### 1.2 핵심 원칙

- ✅ **모든 스키마 변경은 마이그레이션 파일로 기록**
- ✅ **콘솔에서 직접 수정 금지** (긴급 상황 제외, 이후 마이그레이션 파일 생성 필수)
- ✅ **날짜 + 기능명으로 파일명 명명**
- ✅ **Idempotent 작성** (여러 번 실행해도 안전)
- ✅ **문서화 필수** (`DATA_MODEL.md` 업데이트)

### 1.3 금지 사항

- ❌ 콘솔에서 직접 수정 후 마이그레이션 파일 미작성
- ❌ 마이그레이션 파일 없이 스키마 변경
- ❌ 날짜/기능명 없이 파일명 작성
- ❌ Idempotent하지 않은 마이그레이션 작성

---

## 2. 마이그레이션 파일 규칙

### 2.1 파일 위치

**모든 마이그레이션 파일은 다음 위치에 저장합니다:**

```
doc/database/
├── schema.sql                    # 전체 스키마 통합 파일
├── migration-YYYYMMDDHHmm__<기능명>__<변경내용>.sql
├── migration-YYYYMMDDHHmm__<기능명>__<변경내용>.sql
└── ...
```

**향후 정리 예정:**
- `doc/database/migrations/` 폴더로 분리 예정
- 현재는 `doc/database/`에 직접 위치

### 2.2 파일 분류

마이그레이션 파일은 다음 중 하나 이상을 포함합니다:

1. **테이블 생성/변경 SQL**
2. **RLS 정책 SQL**
3. **트리거/함수 SQL**

**하나의 파일에 여러 변경 사항 포함 가능** (같은 기능/목적의 변경)

---

## 3. 필수 기록 사항

### 3.1 테이블 생성/변경

**다음 변경 사항은 반드시 기록합니다:**

- ✅ 테이블 생성 (`CREATE TABLE`)
- ✅ 테이블 삭제 (`DROP TABLE`)
- ✅ 컬럼 추가 (`ALTER TABLE ... ADD COLUMN`)
- ✅ 컬럼 삭제 (`ALTER TABLE ... DROP COLUMN`)
- ✅ 컬럼 수정 (`ALTER TABLE ... ALTER COLUMN`)
- ✅ 인덱스 생성/삭제 (`CREATE INDEX` / `DROP INDEX`)
- ✅ 제약 조건 추가/삭제 (`ADD CONSTRAINT` / `DROP CONSTRAINT`)

**예시:**
```sql
-- migration-202412151430__notes__add_page_number_column.sql
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS page_number INTEGER;

CREATE INDEX IF NOT EXISTS idx_notes_page_number 
ON notes(page_number);
```

### 3.2 RLS 정책

**다음 변경 사항은 반드시 기록합니다:**

- ✅ RLS 활성화 (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- ✅ RLS 정책 생성 (`CREATE POLICY`)
- ✅ RLS 정책 삭제 (`DROP POLICY`)
- ✅ RLS 정책 수정 (DROP 후 재생성)

**예시:**
```sql
-- migration-202412151500__users__add_insert_policy.sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);
```

### 3.3 트리거/함수

**다음 변경 사항은 반드시 기록합니다:**

- ✅ 함수 생성/수정 (`CREATE OR REPLACE FUNCTION`)
- ✅ 함수 삭제 (`DROP FUNCTION`)
- ✅ 트리거 생성 (`CREATE TRIGGER`)
- ✅ 트리거 삭제 (`DROP TRIGGER`)

**예시:**
```sql
-- migration-202412151600__users__add_updated_at_trigger.sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## 4. 파일명 규칙

### 4.1 표준 형식

**파일명 형식:**
```
migration-YYYYMMDDHHmm__<기능명>__<변경내용>.sql
```

**구성 요소:**
- `YYYYMMDDHHmm`: 날짜 및 시간 (예: 202412151430)
- `<기능명>`: 변경된 기능/테이블명 (예: notes, users, groups)
- `<변경내용>`: 간단한 변경 설명 (예: add_page_number, fix_rls_policy)

### 4.2 파일명 예시

**올바른 예시:**
```
migration-202412151430__notes__add_page_number_column.sql
migration-202412151500__users__add_insert_rls_policy.sql
migration-202412151600__groups__fix_member_access.sql
migration-202412151700__books__add_isbn_index.sql
```

**나쁜 예시:**
```
migration.sql                    -- 날짜/기능명 없음
migration-fix.sql               -- 날짜 없음
20241215-notes.sql              -- 형식 불일치
migration-notes.sql             -- 날짜 없음
```

### 4.3 날짜 형식

**날짜 형식:** `YYYYMMDDHHmm` (24시간 형식)

- `YYYY`: 4자리 연도
- `MM`: 2자리 월 (01-12)
- `DD`: 2자리 일 (01-31)
- `HH`: 2자리 시 (00-23)
- `mm`: 2자리 분 (00-59)

**예시:**
- `202412151430`: 2024년 12월 15일 14시 30분
- `202501010000`: 2025년 1월 1일 00시 00분

---

## 5. 작성 규칙

### 5.1 Idempotent 작성 원칙

**모든 마이그레이션은 Idempotent하게 작성합니다:**

```sql
-- ✅ 올바른 예: Idempotent
CREATE TABLE IF NOT EXISTS new_table (...);
CREATE INDEX IF NOT EXISTS idx_new_table_user_id ON new_table(user_id);
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own records" ON new_table;
CREATE POLICY "Users can view own records" ...;

-- ❌ 나쁜 예: Idempotent하지 않음
CREATE TABLE new_table (...); -- 여러 번 실행 시 오류 발생
CREATE INDEX idx_new_table_user_id ON new_table(user_id); -- 여러 번 실행 시 오류 발생
```

### 5.2 주석 작성 규칙

**모든 마이그레이션 파일은 다음 주석을 포함합니다:**

```sql
-- ============================================
-- 마이그레이션: <기능명> - <변경내용>
-- 날짜: YYYY-MM-DD HH:mm
-- 작성자: <이름 또는 팀>
-- ============================================
-- 
-- 변경 사항:
-- 1. <변경 내용 1>
-- 2. <변경 내용 2>
--
-- 영향받는 테이블:
-- - <테이블명1>
-- - <테이블명2>
--
-- 참고:
-- - <관련 이슈 또는 문서>
-- ============================================

-- 실제 SQL 코드
```

### 5.3 실행 순서 고려

**마이그레이션은 의존성 순서를 고려합니다:**

```sql
-- ✅ 올바른 예: 의존성 순서 고려
-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS group_books (...);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_group_books_group_id ON group_books(group_id);

-- 3. RLS 활성화
ALTER TABLE group_books ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 작성 (groups 테이블 참조)
DROP POLICY IF EXISTS "Members can view group books" ON group_books;
CREATE POLICY "Members can view group books"
    ON group_books FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE id = group_books.group_id 
            AND leader_id = auth.uid()
        )
    );
```

---

## 6. 문서화 규칙

### 6.1 DATA_MODEL.md 업데이트

**스키마 변경 시 반드시 `doc/database/DATA_MODEL.md`를 업데이트합니다:**

1. **테이블 정의 섹션 수정**
   - 새 테이블 추가
   - 기존 테이블 컬럼 변경
   - 관계 정의 변경

2. **RLS 정책 요약 업데이트**
   - 새 정책 추가
   - 기존 정책 변경

3. **변경 로그 추가**
   - 날짜
   - 변경 내용
   - 영향받는 테이블
   - 마이그레이션 파일명

**예시:**
```markdown
### 2025-12-15

**변경 내용:**
- `notes` 테이블에 `page_number` 컬럼 추가
- `idx_notes_page_number` 인덱스 추가

**영향받는 테이블:**
- `notes`

**마이그레이션 파일:**
- `migration-202412151430__notes__add_page_number_column.sql`
```

### 6.2 schema.sql 업데이트

**전체 스키마 통합 파일인 `doc/database/schema.sql`도 업데이트합니다:**

- 마이그레이션 내용을 `schema.sql`에 반영
- 최신 상태 유지 (새 환경 구축 시 `schema.sql`만으로 전체 스키마 생성 가능)

---

## 7. 규칙 위반 시 조치

### 7.1 콘솔에서 직접 수정한 경우

**긴급 상황으로 콘솔에서 직접 수정한 경우:**

1. **즉시 마이그레이션 파일 생성**
   - 변경 사항을 정확히 기록
   - Idempotent하게 작성
   - 파일명 규칙 준수

2. **문서 업데이트**
   - `DATA_MODEL.md` 업데이트
   - `schema.sql` 업데이트

3. **팀 공유**
   - 변경 사항을 팀에 공유
   - 마이그레이션 파일 위치 안내

### 7.2 마이그레이션 파일 누락 발견 시

**기존 변경 사항에 마이그레이션 파일이 없는 경우:**

1. **현재 스키마 상태 확인** (SQL Editor에서 테이블/정책 목록 조회)
2. **마이그레이션 파일 생성** (파일명에 "reconstruct" 또는 "backfill" 표시)
3. **문서화** (변경 로그에 "재구성" 표시 및 누락 이유 기록)

### 7.3 Idempotent하지 않은 마이그레이션 발견 시

**기존 마이그레이션이 Idempotent하지 않은 경우:**

1. **마이그레이션 파일 수정**
   - `IF NOT EXISTS`, `DROP IF EXISTS` 추가
   - 여러 번 실행해도 안전하도록 수정

2. **파일명 변경**
   - 수정된 파일은 새 파일명으로 저장
   - 기존 파일은 유지 (이력 보존)

---

## 8. 체크리스트

새로운 스키마 변경 시:

- [ ] 마이그레이션 파일 생성 (날짜 + 기능명 + 변경내용)
- [ ] Idempotent하게 작성 (`IF NOT EXISTS`, `DROP IF EXISTS` 사용)
- [ ] 주석 작성 (변경 사항, 영향받는 테이블)
- [ ] `doc/database/DATA_MODEL.md` 업데이트
- [ ] `doc/database/schema.sql` 업데이트
- [ ] 변경 로그에 기록
- [ ] 팀에 변경 사항 공유

---

## 9. 마이그레이션 실행 규칙

### 9.1 실행 순서

**마이그레이션 파일은 날짜 순서대로 실행합니다:**

1. 파일명의 날짜 순서 확인
2. 의존성이 있는 마이그레이션 먼저 실행
3. 오류 발생 시 전체 롤백 고려

### 9.2 실행 방법

**Supabase SQL Editor에서 실행:**

1. Supabase 대시보드 → SQL Editor
2. 마이그레이션 파일 내용 복사
3. 붙여넣기 후 실행
4. 결과 확인

**Supabase CLI 사용 (선택):**

```bash
# 마이그레이션 파일을 migrations 폴더에 복사
cp doc/database/migration-*.sql supabase/migrations/

# 마이그레이션 실행
supabase db push
```

### 9.3 실행 전 확인

**마이그레이션 실행 전 확인 사항:**

- [ ] Idempotent하게 작성되었는지 확인
- [ ] 의존성 순서 확인
- [ ] 백업 권장 (프로덕션 환경)
- [ ] 테스트 환경에서 먼저 실행

---

## 10. 참고 사항

### 10.1 현재 프로젝트의 마이그레이션 파일

현재 프로젝트는 다음 마이그레이션 파일을 보유하고 있습니다:

- `migration-fix-users-rls.sql`: users 테이블 INSERT RLS 정책 추가
- `migration-fix-groups-rls-members.sql`: groups 테이블 멤버 접근 허용
- `migration-fix-group-members-rls-recursion.sql`: group_members 무한 재귀 수정
- `migration-make-schema-idempotent.sql`: 스키마 Idempotent하게 수정
- `migration-add-sample-data.sql`: 샘플 데이터 지원

### 10.2 스키마 통합 파일

**`schema.sql`은 전체 스키마의 통합 파일입니다:**

- 모든 테이블, 인덱스, RLS 정책, 함수, 트리거 포함
- 새 환경 구축 시 이 파일만으로 전체 스키마 생성 가능
- 마이그레이션 파일의 변경 사항을 반영하여 최신 상태 유지

### 10.3 마이그레이션 vs 스키마 파일

**차이점:**
- **마이그레이션 파일**: 변경 사항만 기록 (증분)
- **스키마 파일**: 전체 스키마 통합 (전체)

**사용 시기:**
- **마이그레이션 파일**: 기존 환경에 변경 사항 적용
- **스키마 파일**: 새 환경 구축 또는 전체 재생성

---

## 11. 예시

### 11.1 테이블 컬럼 추가

**파일명:** `migration-202412151430__notes__add_page_number_column.sql`

```sql
-- 마이그레이션: notes - page_number 컬럼 추가
-- 날짜: 2024-12-15 14:30

ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS page_number INTEGER;

CREATE INDEX IF NOT EXISTS idx_notes_page_number 
ON notes(page_number);
```

### 11.2 RLS 정책 추가

**파일명:** `migration-202412151500__users__add_insert_rls_policy.sql`

```sql
-- 마이그레이션: users - INSERT RLS 정책 추가
-- 날짜: 2024-12-15 15:00

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);
```

---

**이 규칙은 프로젝트의 마이그레이션 관리 규칙 단일 기준입니다. 모든 개발자는 이 규칙을 준수해야 합니다.**

**⚠️ 중요: 스키마 변경을 기록하지 않으면 미래에 재앙이다.**

**상세 문서:** `doc/database/DATA_MODEL.md`, `doc/database/README.md` 참조
