# Supabase에서 모든 기록을 공개로 변경하는 방법

## 개요

Supabase SQL Editor에서 직접 실행하여 모든 기록을 공개로 변경하는 방법을 안내합니다.
1
## 실행 방법

### 방법 1: 마이그레이션 파일 사용 (권장)

**파일 위치**: `doc/database/migration-202601161400__notes__make_all_public.sql`

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard 접속
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 왼쪽 메뉴에서 **"SQL Editor"** 클릭
   - **"New query"** 버튼 클릭

3. **마이그레이션 파일 내용 복사하여 실행**
   - `doc/database/migration-202601161400__notes__make_all_public.sql` 파일 내용 전체 복사
   - SQL Editor에 붙여넣기
   - **"Run"** 버튼 클릭

4. **결과 확인**
   - 함수가 생성되고 실행됩니다
   - 변경된 기록 수가 표시됩니다

### 방법 2: 단계별 실행

#### 1단계: 함수 생성

```sql
-- 관리자가 모든 기록을 공개로 변경하는 함수 생성
CREATE OR REPLACE FUNCTION admin_update_all_notes_public()
RETURNS TABLE(updated_count BIGINT) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_count BIGINT;
BEGIN
    -- 모든 기록을 공개로 변경 (샘플 데이터 제외)
    WITH updated AS (
        UPDATE notes
        SET 
            is_public = TRUE,
            updated_at = NOW()
        WHERE 
            is_public = FALSE 
            AND (is_sample IS NULL OR is_sample = FALSE)
        RETURNING id
    )
    SELECT COUNT(*) INTO result_count FROM updated;
    
    RETURN QUERY SELECT result_count;
END;
$$;
```

#### 2단계: 함수 실행

```sql
-- 함수 실행하여 모든 기록을 공개로 변경
SELECT * FROM admin_update_all_notes_public();
```

#### 3단계: 결과 확인

```sql
-- 변경된 기록 수 확인
SELECT 
    COUNT(*) as total_public_notes,
    COUNT(*) FILTER (WHERE is_sample = FALSE OR is_sample IS NULL) as user_public_notes,
    COUNT(*) FILTER (WHERE is_sample = TRUE) as sample_notes
FROM notes
WHERE is_public = TRUE;
```

---

## 실행 전 확인 사항

### 현재 상태 확인

```sql
-- 현재 공개/비공개 기록 수 확인
SELECT 
    is_public,
    COUNT(*) as count
FROM notes
WHERE is_sample IS NULL OR is_sample IS FALSE
GROUP BY is_public;
```

### 백업 (선택사항)

⚠️ **이 작업은 되돌릴 수 없습니다!**

변경 전에 백업을 권장합니다:

```sql
-- 백업 테이블 생성 (선택사항)
CREATE TABLE notes_backup_20260116 AS 
SELECT * FROM notes WHERE is_public = FALSE;
```

---

## 실행 후 확인

### 변경 결과 확인

```sql
-- 변경된 기록 수 확인
SELECT 
    COUNT(*) as total_public_notes,
    COUNT(*) FILTER (WHERE is_sample = FALSE OR is_sample IS NULL) as user_public_notes
FROM notes
WHERE is_public = TRUE;
```

### 개별 기록 확인

```sql
-- 최근 공개된 기록 확인
SELECT 
    id,
    user_id,
    book_id,
    title,
    is_public,
    is_sample,
    updated_at
FROM notes
WHERE is_public = TRUE
  AND (is_sample IS NULL OR is_sample = FALSE)
ORDER BY updated_at DESC
LIMIT 10;
```

---

## 문제 해결

### 오류: "new row violates row-level security policy"

**원인**: RLS 정책 때문에 다른 사용자의 기록을 업데이트할 수 없음

**해결 방법**:
- ✅ **방법 1 (SECURITY DEFINER 함수)** 사용 권장
- 함수가 `SECURITY DEFINER`로 생성되어 RLS 정책을 우회합니다

### 오류: "permission denied for function"

**원인**: 함수 실행 권한이 없음

**해결 방법**:
- 함수가 `SECURITY DEFINER`로 생성되었는지 확인
- Supabase 대시보드에서 관리자 권한으로 실행

---

## 주의사항

⚠️ **중요한 주의사항**

1. **되돌릴 수 없음**: 이 작업은 되돌릴 수 없습니다
2. **모든 기록 공개**: 모든 사용자의 기록이 공개됩니다
3. **샘플 데이터 제외**: 샘플 데이터(`is_sample = TRUE`)는 제외됩니다
4. **백업 권장**: 실행 전에 백업을 권장합니다

---

## 요약

**가장 간단한 방법**: 마이그레이션 파일 사용

1. `doc/database/migration-202601161400__notes__make_all_public.sql` 파일 열기
2. 내용 전체 복사
3. Supabase SQL Editor에 붙여넣기
4. 실행

이 방법이 가장 안전하고 RLS 정책 문제를 피할 수 있습니다.
