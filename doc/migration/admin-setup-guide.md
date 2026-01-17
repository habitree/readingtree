# 관리자 계정 설정 가이드

**작성일:** 2026년 1월  
**프로젝트:** Habitree Reading Hub v4.0.0

---

## 개요

이 가이드는 Supabase 마이그레이션 후 관리자 계정을 설정하는 방법을 설명합니다.

**중요**: 프로젝트는 이제 데이터베이스의 `users.is_admin` 컬럼을 사용하여 관리자 권한을 관리합니다. 코드에 하드코딩된 이메일은 더 이상 사용되지 않습니다.

---

## 관리자 설정 방법

### 1. 기존 관리자 이메일 확인

기존 프로젝트에서 관리자로 사용하던 이메일 주소를 확인합니다.

**확인 방법**:
- 기존 프로젝트의 Supabase Dashboard → Authentication → Users
- 또는 애플리케이션 코드에서 확인 (이전에 하드코딩된 이메일)

**예시**: `cdhnaya@kakao.com`

---

### 2. 새 프로젝트에서 관리자 설정

#### 2.1 SQL Editor에서 실행

새 Supabase 프로젝트의 SQL Editor에서 다음 쿼리를 실행합니다:

```sql
-- 특정 이메일을 관리자로 설정
UPDATE users 
SET is_admin = TRUE 
WHERE email = 'cdhnaya@kakao.com';
```

#### 2.2 설정 확인

```sql
-- 관리자 계정 확인
SELECT id, email, name, is_admin 
FROM users 
WHERE is_admin = TRUE;
```

**예상 결과**:
```
id                                   | email              | name  | is_admin
-------------------------------------|--------------------|-------|----------
550e8400-e29b-41d4-a716-446655440000| cdhnaya@kakao.com  | 관리자 | true
```

---

### 3. 여러 관리자 추가

여러 사용자를 관리자로 설정하려면:

```sql
-- 여러 사용자를 관리자로 설정
UPDATE users 
SET is_admin = TRUE 
WHERE email IN (
  'admin1@example.com',
  'admin2@example.com',
  'admin3@example.com'
);
```

---

### 4. 관리자 권한 제거

관리자 권한을 제거하려면:

```sql
-- 특정 사용자의 관리자 권한 제거
UPDATE users 
SET is_admin = FALSE 
WHERE email = 'oldadmin@example.com';
```

---

## 데이터 이관 시 주의사항

### 시나리오 1: 기존 프로젝트에 `is_admin` 컬럼이 있는 경우

- 데이터 이관 스크립트가 `is_admin` 값을 그대로 이관합니다
- 추가 설정이 필요 없습니다
- 다만, 이관 후 확인은 권장합니다

### 시나리오 2: 기존 프로젝트에 `is_admin` 컬럼이 없는 경우

- 데이터 이관 후 모든 사용자의 `is_admin`이 `FALSE`로 설정됩니다
- **반드시** 기존 관리자 이메일을 `is_admin = TRUE`로 설정해야 합니다
- 위의 "2. 새 프로젝트에서 관리자 설정" 방법을 따라 설정하세요

---

## 관리자 확인 방법

### 데이터베이스에서 확인

```sql
-- 모든 관리자 목록 조회
SELECT id, email, name, is_admin, created_at
FROM users 
WHERE is_admin = TRUE
ORDER BY created_at DESC;
```

### 애플리케이션에서 확인

1. **관리자 페이지 접근**
   - `/admin` 페이지에 접근
   - 관리자 권한이 있으면 접근 가능
   - 권한이 없으면 접근 거부

2. **사이드바 확인**
   - 로그인 후 사이드바에 "관리자" 메뉴가 표시되면 관리자입니다
   - 관리자가 아니면 "관리자" 메뉴가 표시되지 않습니다

---

## 문제 해결

### 문제 1: 관리자 페이지에 접근할 수 없음

**원인**: `is_admin`이 `FALSE`로 설정되어 있음

**해결**:
```sql
-- 이메일로 확인
SELECT email, is_admin FROM users WHERE email = 'your-email@example.com';

-- 관리자로 설정
UPDATE users SET is_admin = TRUE WHERE email = 'your-email@example.com';
```

### 문제 2: 관리자로 설정했지만 여전히 접근 불가

**원인**: 
- 세션 캐시 문제
- 애플리케이션 재시작 필요

**해결**:
1. 브라우저에서 로그아웃 후 다시 로그인
2. 개발 서버 재시작 (`npm run dev`)
3. 브라우저 캐시 클리어

### 문제 3: 여러 관리자가 필요한 경우

**해결**:
```sql
-- 여러 이메일을 한 번에 관리자로 설정
UPDATE users 
SET is_admin = TRUE 
WHERE email IN ('admin1@example.com', 'admin2@example.com');
```

---

## 보안 고려사항

### 1. 관리자 계정 보호

- 관리자 이메일은 공개하지 마세요
- 관리자 계정에 강력한 비밀번호를 설정하세요
- 2단계 인증(2FA)을 활성화하세요

### 2. 관리자 권한 관리

- 필요한 최소한의 사용자만 관리자로 설정하세요
- 정기적으로 관리자 목록을 검토하세요
- 더 이상 필요 없는 관리자 권한은 즉시 제거하세요

### 3. 로그 모니터링

- 관리자 페이지 접근 로그를 모니터링하세요
- 의심스러운 활동이 있으면 즉시 조사하세요

---

## 참고 문서

- 스키마 파일: `doc/database/schema.sql`
- 마이그레이션 파일: `doc/database/migration-202601170000__users__add_is_admin_column.sql`
- 데이터 모델: `doc/database/DATA_MODEL.md`
- 마이그레이션 가이드: `doc/migration/supabase-migration-guide.md`

---

**이 가이드를 따라 관리자 계정을 안전하게 설정하고 관리할 수 있습니다.**
