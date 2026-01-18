# 마이그레이션 정책 및 원인 분석

**작성일:** 2025-01-18  
**목적:** 마이그레이션 시 발생하는 외래 키 제약 조건 위반 원인 분석 및 해결 방안

---

## 1. 외래 키 제약 조건 분석

### 1.1 테이블별 외래 키 참조 구조

#### `auth.users`를 참조하는 테이블

| 테이블 | 컬럼 | 외래 키 | CASCADE 규칙 |
|--------|------|---------|--------------|
| `bookshelves` | `user_id` | `auth.users(id)` | ON DELETE CASCADE |
| `ocr_usage_stats` | `user_id` | `auth.users(id)` | ON DELETE CASCADE (UNIQUE) |
| `ocr_logs` | `user_id` | `auth.users(id)` | ON DELETE CASCADE |

**특징:**
- `auth.users`는 Supabase의 내부 인증 테이블
- `public.users.id`는 `auth.users.id`를 참조 (1:1 관계)
- `auth.users.id`와 `public.users.id`는 동일한 UUID를 사용

#### `public.users`를 참조하는 테이블

| 테이블 | 컬럼 | 외래 키 | CASCADE 규칙 |
|--------|------|---------|--------------|
| `user_books` | `user_id` | `public.users(id)` | ON DELETE CASCADE |
| `notes` | `user_id` | `public.users(id)` | ON DELETE CASCADE |
| `groups` | `leader_id` | `public.users(id)` | ON DELETE CASCADE |
| `group_members` | `user_id` | `public.users(id)` | ON DELETE CASCADE |

**특징:**
- `public.users`는 사용자 프로필 테이블
- `public.users.id`는 `auth.users.id`를 직접 참조

### 1.2 UUID 매핑 정보

| 이메일 | 기존 UUID (auth.users & public.users) | 새 UUID (auth.users & public.users) |
|--------|--------------------------------------|-------------------------------------|
| cdhnaya@kakao.com | `7f47d5b6-ce22-4c52-8f97-5e048e523ec4` | `60538115-0957-41c7-b52e-f18b62ec569b` |
| cdhrich@gmail.com | `f6647230-9b37-4bce-a7c2-162d7e68280a` | `336282aa-ddee-41bb-9e78-1f71e87efed1` |
| cdhrich@naver.com | `ba1e0451-eec9-4790-a5f0-a775fb88561a` | `031d63c6-0927-4a12-bc07-98b7441144df` |

**확인 사항:**
- ✅ 새 프로젝트에서 `auth.users.id`와 `public.users.id`가 일치함 (확인 완료)
- ✅ 매핑된 UUID가 `auth.users`와 `public.users` 모두에 존재함 (확인 완료)

---

## 2. RLS (Row Level Security) 정책 분석

### 2.1 RLS 활성화 상태

모든 사용자 관련 테이블에 RLS가 활성화되어 있습니다:

- ✅ `bookshelves` - RLS 활성화
- ✅ `user_books` - RLS 활성화
- ✅ `notes` - RLS 활성화
- ✅ `groups` - RLS 활성화
- ✅ `group_members` - RLS 활성화
- ✅ `ocr_usage_stats` - RLS 활성화
- ✅ `ocr_logs` - RLS 활성화

### 2.2 RLS 정책 내용

#### `bookshelves` 테이블
- **SELECT**: `auth.uid() = user_id OR is_public = TRUE`
- **INSERT**: `auth.uid() = user_id`
- **UPDATE**: `auth.uid() = user_id`
- **DELETE**: `auth.uid() = user_id AND is_main = FALSE`

#### `user_books` 테이블
- **SELECT**: `auth.uid() = user_id OR EXISTS (SELECT 1 FROM books WHERE books.id = user_books.book_id AND books.is_sample = TRUE)`
- **INSERT**: `auth.uid() = user_id`
- **UPDATE**: `auth.uid() = user_id`
- **DELETE**: `auth.uid() = user_id`

#### `notes` 테이블
- **SELECT**: `auth.uid() = user_id OR is_public = TRUE OR is_sample = TRUE`
- **INSERT**: `auth.uid() = user_id`
- **UPDATE**: `auth.uid() = user_id`
- **DELETE**: `auth.uid() = user_id`

#### `ocr_usage_stats`, `ocr_logs` 테이블
- **SELECT**: `is_admin_user()` (관리자만 조회 가능)
- **INSERT/UPDATE/DELETE**: 정책 없음 (Service Role Key로만 접근 가능)

### 2.3 Service Role Key와 RLS

**중요:** Supabase의 Service Role Key는 RLS를 **완전히 우회**합니다.

- Service Role Key를 사용하면 RLS 정책이 적용되지 않음
- `auth.uid()`는 NULL이지만, Service Role Key는 RLS를 무시하므로 문제 없음
- 마이그레이션 스크립트는 Service Role Key를 사용하므로 RLS는 문제가 되지 않음

---

## 3. 외래 키 제약 조건 위반 원인 분석

### 3.1 현재 문제점

매핑된 UUID가 `auth.users`와 `public.users`에 존재하는데도 외래 키 제약 조건 위반이 발생합니다.

**가능한 원인:**

1. **UPSERT 동작 방식**
   - `upsert`는 `INSERT ... ON CONFLICT`를 사용
   - 외래 키 제약 조건은 삽입 전에 검증됨
   - 매핑된 UUID가 존재하지만, UPSERT 처리 중에 일시적으로 문제가 발생할 수 있음

2. **트랜잭션 격리 수준**
   - 동시에 여러 테이블을 마이그레이션할 때, 외래 키 참조가 아직 생성되지 않았을 수 있음
   - 하지만 현재는 순차적으로 마이그레이션하므로 이 문제는 아님

3. **데이터 타입 불일치**
   - UUID 형식이 올바르지 않을 수 있음
   - 하지만 매핑 함수에서 UUID 형식을 변경하지 않으므로 이 문제는 아님

4. **RLS와 외래 키 검증의 상호작용**
   - Service Role Key는 RLS를 우회하지만, 외래 키 제약 조건은 여전히 적용됨
   - 외래 키 제약 조건은 RLS와 독립적으로 작동

### 3.2 실제 원인 추정

**가장 가능성 높은 원인:**

1. **UPSERT의 `onConflict` 처리**
   - `upsert`의 `onConflict: 'id'`는 중복된 `id`를 처리하지만, 외래 키 제약 조건은 삽입 전에 검증됨
   - 만약 기존 레코드가 있고, 그 레코드의 `user_id`가 매핑되지 않은 UUID라면 문제가 발생할 수 있음

2. **데이터 정제 과정에서의 문제**
   - `cleanData` 함수에서 UUID 매핑을 수행하지만, 매핑되지 않은 UUID는 그대로 유지됨
   - 매핑되지 않은 UUID를 가진 레코드가 삽입되면 외래 키 제약 조건 위반 발생

3. **배치 처리 중의 문제**
   - 한 배치에 매핑된 UUID와 매핑되지 않은 UUID가 섞여 있을 수 있음
   - 매핑되지 않은 UUID를 가진 레코드는 필터링해야 함

---

## 4. 해결 방안

### 4.1 UUID 검증 로직 추가

**필수:** 삽입 전에 매핑된 UUID가 실제로 존재하는지 확인

```javascript
// 매핑된 UUID가 auth.users 또는 public.users에 존재하는지 확인
async function validateMappedUserIds(userIds, referencedTable) {
  // referencedTable이 'auth.users'인지 'public.users'인지에 따라 검증
  // 존재하지 않는 UUID를 가진 레코드는 필터링
}
```

### 4.2 데이터 필터링 개선

**현재 문제:**
- `cleanData` 함수에서 UUID 매핑을 수행하지만, 매핑되지 않은 UUID는 그대로 유지됨
- 매핑되지 않은 UUID를 가진 레코드가 삽입되면 외래 키 제약 조건 위반 발생

**해결 방안:**
- 매핑되지 않은 UUID를 가진 레코드는 삽입 전에 필터링
- 또는 매핑된 UUID가 실제로 존재하는지 사전에 확인

### 4.3 외래 키 제약 조건별 처리

**`auth.users` 참조 테이블:**
- `bookshelves`, `ocr_usage_stats`, `ocr_logs`
- 매핑된 UUID가 `auth.users`에 존재하는지 확인

**`public.users` 참조 테이블:**
- `user_books`, `notes`, `groups`, `group_members`
- 매핑된 UUID가 `public.users`에 존재하는지 확인

### 4.4 UPSERT 대신 명시적 INSERT/UPDATE 분리

**현재 방식:**
```javascript
await newSupabase
  .from(tableName)
  .upsert(cleanedData, { 
    onConflict: 'id',
    ignoreDuplicates: false
  });
```

**개선 방안:**
1. 기존 레코드 조회
2. 존재하는 레코드는 UPDATE
3. 존재하지 않는 레코드는 INSERT
4. 각각 외래 키 제약 조건을 만족하는지 확인

---

## 5. 마이그레이션 순서 최적화

### 5.1 현재 순서

1. `users` (건너뜀)
2. `books`
3. `bookshelves` (auth.users 참조)
4. `user_books` (public.users, books 참조)
5. `notes` (public.users, books 참조)
6. `groups` (public.users 참조)
7. `group_members` (public.users, groups 참조)
8. `group_books` (groups, books 참조)
9. `group_notes` (groups, notes 참조)
10. `transcriptions` (notes 참조)
11. `ocr_usage_stats` (auth.users 참조)
12. `ocr_logs` (auth.users, notes 참조)

### 5.2 권장 순서 (외래 키 의존성 고려)

1. `books` - 독립 테이블
2. `bookshelves` - `auth.users` 참조 (매핑된 UUID 확인 필요)
3. `user_books` - `public.users`, `books` 참조
4. `notes` - `public.users`, `books` 참조
5. `transcriptions` - `notes` 참조
6. `groups` - `public.users` 참조 (leader_id)
7. `group_members` - `public.users`, `groups` 참조
8. `group_books` - `groups`, `books` 참조
9. `group_notes` - `groups`, `notes` 참조
10. `ocr_usage_stats` - `auth.users` 참조
11. `ocr_logs` - `auth.users`, `notes` 참조

**현재 순서는 올바릅니다.**

---

## 6. 체크리스트

### 6.1 마이그레이션 전 확인 사항

- [x] 새 프로젝트의 `auth.users`와 `public.users`에 매핑된 UUID 존재 확인
- [x] `auth.users.id`와 `public.users.id` 일치 확인
- [ ] 기존 프로젝트에서 대상 사용자 데이터 조회 테스트
- [ ] 외래 키 제약 조건 위반 원인 분석 완료

### 6.2 스크립트 수정 사항

- [ ] UUID 검증 함수 추가
- [ ] 매핑되지 않은 UUID를 가진 레코드 필터링
- [ ] 외래 키 제약 조건별 처리 로직 추가
- [ ] 오류 처리 개선 (상세 정보 출력)

### 6.3 마이그레이션 실행 후 확인 사항

- [ ] 이관된 데이터 수 확인
- [ ] UUID 매핑 정확성 확인
- [ ] 외래 키 제약 조건 위반 없음 확인
- [ ] RLS 정책이 정상 작동하는지 확인

---

## 7. 참고 사항

### 7.1 Service Role Key 사용

- Service Role Key는 RLS를 완전히 우회합니다
- 마이그레이션 스크립트는 Service Role Key를 사용하므로 RLS는 문제가 되지 않습니다
- 하지만 외래 키 제약 조건은 여전히 적용됩니다

### 7.2 UUID 매핑

- `auth.users.id`와 `public.users.id`는 동일한 UUID를 사용합니다
- UUID 매핑은 한 번만 적용하면 됩니다
- 매핑된 UUID가 실제로 존재하는지 확인해야 합니다

### 7.3 UPSERT 동작

- `upsert`는 `INSERT ... ON CONFLICT`를 사용합니다
- 외래 키 제약 조건은 삽입 전에 검증됩니다
- 매핑된 UUID가 존재하지 않으면 외래 키 제약 조건 위반이 발생합니다

---

**다음 단계:** 스크립트 수정 및 UUID 검증 로직 추가
