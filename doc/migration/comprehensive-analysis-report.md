# 마이그레이션 종합 분석 및 수정 보고서

**작성일:** 2025-01-18  
**목적:** 서재 책 정보 미표시 및 메인 페이지 오류 원인 분석 및 해결

---

## 📊 실행 요약

### ✅ 완료된 작업

1. **마이그레이션 데이터 검증** ✅
   - 모든 테이블 데이터 정상 이관 확인
   - UUID 매핑 정확성 확인

2. **RLS 정책 검증** ✅
   - `user_books` 및 `bookshelves` 테이블 RLS 정책 정상 확인

3. **스키마 불일치 수정** ✅
   - `app/actions/books.ts`에서 존재하지 않는 컬럼 조회 제거
   - `completed_dates`, `reading_reason` 컬럼 제거

### ⚠️ 확인 필요 사항

1. **Vercel 환경 변수 확인**
   - 새 Supabase 프로젝트 URL 및 API Key 설정 확인

2. **사용자 UUID 매핑 확인**
   - 현재 로그인한 사용자의 UUID가 매핑된 UUID와 일치하는지 확인

---

## 1. 마이그레이션 데이터 현황

### 1.1 이관된 데이터 통계

| 테이블 | 레코드 수 | 상태 | 비고 |
|--------|----------|------|------|
| `users` | 3명 | ✅ | 매핑된 사용자 모두 존재 |
| `books` | 196개 | ✅ | 모든 책 정보 이관 완료 |
| `user_books` | 191개 | ✅ | 3명의 사용자 데이터 모두 이관 |
| `bookshelves` | 10개 | ✅ | 사용자별 서재 정보 이관 |
| `notes` | 227개 | ✅ | 모든 기록 이관 완료 |
| `groups` | 2개 | ✅ | 독서모임 정보 이관 |
| `group_members` | 3개 | ✅ | 모임 멤버십 이관 |
| `group_books` | 3개 | ✅ | 모임 지정도서 이관 |
| `transcriptions` | 15개 | ✅ | OCR 전사 데이터 이관 |
| `ocr_usage_stats` | 1개 | ✅ | OCR 사용 통계 이관 |
| `ocr_logs` | 19개 | ✅ | OCR 로그 이관 |

### 1.2 사용자별 데이터 분포

#### cdhnaya@kakao.com (UUID: `60538115-0957-41c7-b52e-f18b62ec569b`)
- **user_books**: 185개
- **bookshelves**: 
  - "내 서재" (메인, 174개 책)
  - "AI" (11개 책)
  - "소설" (0개)
  - "자기개발" (0개)

#### cdhrich@gmail.com (UUID: `336282aa-ddee-41bb-9e78-1f71e87efed1`)
- **user_books**: 4개
- **bookshelves**:
  - "내 서재" (메인, 2개 책)
  - "문학" (1개 책)
  - "역사" (0개)
  - "자기개발" (1개 책)
  - "투자" (0개)

#### cdhrich@naver.com (UUID: `031d63c6-0927-4a12-bc07-98b7441144df`)
- **user_books**: 2개
- **bookshelves**:
  - "내 서재" (메인, 2개 책)

**결론:** 모든 데이터가 정상적으로 이관되었습니다.

---

## 2. 발견된 문제 및 해결

### 2.1 문제 1: 스키마 불일치 ✅ 해결

**문제:**
- `app/actions/books.ts`의 `getUserBooksWithNotes()` 함수에서 존재하지 않는 컬럼 조회
- `completed_dates` (JSONB 배열) - 새 스키마에 없음
- `reading_reason` (VARCHAR) - 새 스키마에 없음

**오류 메시지:**
```
Could not find the 'completed_dates' column of 'user_books' in the schema cache
Could not find the 'reading_reason' column of 'user_books' in the schema cache
```

**해결:**
- ✅ `getUserBooksWithNotes()` 함수에서 `completed_dates`, `reading_reason` 컬럼 조회 제거
- ✅ `getBookDetail()` 함수에서 `completed_dates` 컬럼 조회 제거
- ✅ `updateBookInfo()` 함수에서 `completed_dates`, `reading_reason` 업데이트 로직 제거

**수정된 파일:**
- `app/actions/books.ts`

### 2.2 문제 2: RLS 정책 확인 ✅ 정상

**확인 결과:**
- ✅ `user_books` 테이블: `auth.uid() = user_id` 정책 정상 설정
- ✅ `bookshelves` 테이블: `auth.uid() = user_id` 정책 정상 설정

**RLS 정책 내용:**
- **SELECT**: `auth.uid() = user_id` (자신의 데이터만 조회)
- **INSERT**: `auth.uid() = user_id` (자신의 데이터만 생성)
- **UPDATE**: `auth.uid() = user_id` (자신의 데이터만 수정)
- **DELETE**: `auth.uid() = user_id` (자신의 데이터만 삭제)

**결론:** RLS 정책은 올바르게 설정되어 있습니다.

---

## 3. 확인 필요 사항

### 3.1 Vercel 환경 변수 확인 ⚠️

**확인 필요:**
Vercel Dashboard에서 다음 환경 변수가 새 Supabase 프로젝트를 가리키는지 확인:

```env
NEXT_PUBLIC_SUPABASE_URL=https://pkdhhtfomhhuiirzurhs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=새_프로젝트의_anon_key
```

**확인 방법:**
1. Vercel Dashboard → 프로젝트 → Settings → Environment Variables
2. `NEXT_PUBLIC_SUPABASE_URL` 확인
3. `NEXT_PUBLIC_SUPABASE_ANON_KEY` 확인
4. 수정 후 재배포

**문제 가능성:**
- 환경 변수가 기존 프로젝트를 가리키는 경우 → 데이터를 조회할 수 없음
- 환경 변수가 설정되지 않은 경우 → 연결 오류 발생

### 3.2 사용자 UUID 매핑 확인 ⚠️

**확인 필요:**
현재 로그인한 사용자의 UUID가 다음 중 하나와 일치하는지 확인:

- `60538115-0957-41c7-b52e-f18b62ec569b` (cdhnaya@kakao.com)
- `336282aa-ddee-41bb-9e78-1f71e87efed1` (cdhrich@gmail.com)
- `031d63c6-0927-4a12-bc07-98b7441144df` (cdhrich@naver.com)

**확인 방법:**
1. 브라우저 개발자 도구 → Console
2. 다음 코드 실행:
   ```javascript
   // Supabase 클라이언트에서 현재 사용자 확인
   const { data: { user } } = await supabase.auth.getUser();
   console.log('Current user ID:', user?.id);
   console.log('Current user email:', user?.email);
   ```

**문제 가능성:**
- 로그인한 사용자의 UUID가 매핑된 UUID와 다를 경우 → RLS 정책에 의해 데이터가 보이지 않음
- 새로 가입한 사용자의 경우 → 데이터가 없음 (정상)

### 3.3 404 오류 원인 확인 ⚠️

**가능한 원인:**
1. **동적 라우팅 문제**
   - `/books/[id]` 경로에서 `userBookId`가 유효하지 않을 수 있음
   - `bookshelves` ID를 사용한 라우팅이 실패할 수 있음

2. **데이터 부재**
   - 요청한 `userBookId`에 해당하는 데이터가 없을 수 있음
   - RLS 정책에 의해 접근이 차단될 수 있음

**확인 방법:**
- 브라우저 개발자 도구 → Network 탭에서 실패한 요청 확인
- 서버 로그 확인 (Vercel Dashboard → Functions → Logs)

---

## 4. 수정 완료 사항

### 4.1 코드 수정

#### `app/actions/books.ts`

1. **`getUserBooksWithNotes()` 함수**
   ```typescript
   // 수정 전
   .select(`
     id,
     status,
     completed_at,
     completed_dates,  // ❌ 제거
     started_at,
     reading_reason,   // ❌ 제거
     bookshelf_id,
     created_at,
     books (...)
   `)
   
   // 수정 후
   .select(`
     id,
     status,
     completed_at,
     started_at,
     bookshelf_id,
     created_at,
     books (...)
   `)
   ```

2. **`getBookDetail()` 함수**
   ```typescript
   // 수정 전
   .select(`
     *,
     completed_dates,  // ❌ 제거
     books (...)
   `)
   
   // 수정 후
   .select(`
     *,
     books (...)
   `)
   ```

3. **`updateBookInfo()` 함수**
   ```typescript
   // 수정 전
   const updateData: {
     reading_reason?: string | null;  // ❌ 제거
     started_at?: string | null;
     completed_dates?: any;           // ❌ 제거
   } = {};
   
   // 수정 후
   const updateData: {
     started_at?: string | null;
   } = {};
   ```

### 4.2 문서화

다음 문서가 생성되었습니다:
- `doc/migration/migration-verification-report.md` - 마이그레이션 검증 보고서
- `doc/migration/schema-mismatch-fix-summary.md` - 스키마 불일치 수정 요약
- `doc/migration/ui-components-fix-needed.md` - UI 컴포넌트 수정 가이드

---

## 5. 다음 단계

### 5.1 즉시 확인 사항

1. **Vercel 환경 변수 확인 및 수정**
   - 새 Supabase 프로젝트 URL과 API Key 설정 확인
   - 수정 후 재배포

2. **코드 배포**
   - 수정된 `app/actions/books.ts` 파일이 배포되었는지 확인
   - Vercel에 자동 배포되거나 수동 배포

3. **사용자 UUID 확인**
   - 현재 로그인한 사용자의 UUID 확인
   - 매핑된 UUID와 일치하는지 확인

### 5.2 선택적 수정 사항

4. **UI 컴포넌트 수정** (선택 사항)
   - `components/books/book-table.tsx`에서 `reading_reason`, `completed_dates` 사용 부분 제거
   - `components/search/search-result-card.tsx`에서 `reading_reason` 사용 부분 제거
   - 현재는 오류가 발생하지 않지만, 코드 정리를 위해 수정 권장

---

## 6. 문제 해결 체크리스트

### 마이그레이션 검증
- [x] 마이그레이션 데이터 확인 완료
- [x] UUID 매핑 확인 완료
- [x] RLS 정책 확인 완료

### 코드 수정
- [x] 스키마 불일치 수정 완료 (`app/actions/books.ts`)
- [ ] UI 컴포넌트 수정 (선택 사항)

### 배포 및 확인
- [ ] Vercel 환경 변수 확인 및 수정
- [ ] 코드 배포 확인
- [ ] 현재 로그인한 사용자 UUID 확인
- [ ] 애플리케이션 테스트

---

## 7. 예상 결과

### 수정 후 예상 동작

1. **서재 페이지 (`/books`)**
   - 로그인한 사용자의 책 목록이 정상적으로 표시됨
   - "등록된 책이 없습니다" 메시지가 사라짐
   - 사이드바의 "서재 (3)"과 실제 책 목록이 일치함

2. **책 상세 페이지 (`/books/[id]`)**
   - 404 오류가 발생하지 않음
   - 책 정보가 정상적으로 표시됨

3. **메인 페이지**
   - 책 선택 시 오류가 발생하지 않음
   - 정상적으로 책 상세 페이지로 이동

---

## 8. 참고 사항

### 8.1 스키마 차이

**제거된 컬럼:**
- `user_books.completed_dates` (JSONB 배열) - 여러 번 완독한 날짜 저장
- `user_books.reading_reason` (VARCHAR) - 책을 읽는 이유

**유지된 컬럼:**
- `user_books.completed_at` (TIMESTAMPTZ) - 단일 완독일 저장
- `user_books.started_at` (TIMESTAMPTZ) - 시작일
- `user_books.status` (ENUM) - 독서 상태

### 8.2 UUID 매핑

**매핑된 사용자:**
- `cdhnaya@kakao.com`: `7f47d5b6...` → `60538115...`
- `cdhrich@gmail.com`: `f6647230...` → `336282aa...`
- `cdhrich@naver.com`: `ba1e0451...` → `031d63c6...`

**중요:** 현재 로그인한 사용자의 UUID가 위 매핑된 UUID 중 하나와 일치해야 데이터가 보입니다.

---

## 9. 문제 해결 가이드

### 문제: 서재에 책이 보이지 않음

**확인 사항:**
1. Vercel 환경 변수가 새 Supabase 프로젝트를 가리키는지 확인
2. 현재 로그인한 사용자의 UUID가 매핑된 UUID와 일치하는지 확인
3. 브라우저 개발자 도구 → Network 탭에서 API 요청 확인
4. 서버 로그 확인 (Vercel Dashboard → Functions → Logs)

### 문제: 404 오류 발생

**확인 사항:**
1. 요청한 `userBookId`가 유효한지 확인
2. 해당 데이터가 실제로 존재하는지 확인 (Service Role Key로 조회)
3. RLS 정책에 의해 접근이 차단되지 않는지 확인

### 문제: 메인 페이지에서 책 선택 시 오류

**확인 사항:**
1. 책 상세 페이지 라우팅 확인 (`/books/[id]`)
2. `getBookDetail()` 함수가 정상적으로 작동하는지 확인
3. 브라우저 콘솔에서 오류 메시지 확인

---

**다음 단계:** Vercel 환경 변수 확인 및 코드 배포 후 테스트
