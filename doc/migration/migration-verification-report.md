# 마이그레이션 검증 및 문제 분석 보고서

**작성일:** 2025-01-18  
**목적:** 서재 책 정보 미표시 및 메인 페이지 오류 원인 분석

---

## 1. 마이그레이션 데이터 확인 결과

### 1.1 이관된 데이터 현황

| 테이블 | 레코드 수 | 상태 |
|--------|----------|------|
| `users` | 3명 | ✅ 정상 |
| `books` | 196개 | ✅ 정상 |
| `user_books` | 191개 | ✅ 정상 |
| `bookshelves` | 10개 | ✅ 정상 |
| `notes` | 227개 | ✅ 정상 |
| `groups` | 2개 | ✅ 정상 |
| `group_members` | 3개 | ✅ 정상 |
| `group_books` | 3개 | ✅ 정상 |
| `transcriptions` | 15개 | ✅ 정상 |
| `ocr_usage_stats` | 1개 | ✅ 정상 |
| `ocr_logs` | 19개 | ✅ 정상 |

### 1.2 사용자별 데이터 분포

| 사용자 이메일 | user_books | bookshelves |
|--------------|-----------|-------------|
| cdhnaya@kakao.com | 185개 | "내 서재" (174개), "AI" (11개), "소설" (0개), "자기개발" (0개) |
| cdhrich@gmail.com | 4개 | "내 서재" (2개), "문학" (1개), "역사" (0개), "자기개발" (1개), "투자" (0개) |
| cdhrich@naver.com | 2개 | "내 서재" (2개) |

**결론:** 데이터는 정상적으로 이관되었습니다.

---

## 2. 문제 원인 분석

### 2.1 발견된 문제

#### 문제 1: 스키마 불일치 - 존재하지 않는 컬럼 조회

**위치:** `app/actions/books.ts`의 `getUserBooksWithNotes()` 함수

**문제:**
- `completed_dates` 컬럼 조회 시도 (새 스키마에 없음)
- `reading_reason` 컬럼 조회 시도 (새 스키마에 없음)

**오류 메시지:**
```
Could not find the 'completed_dates' column of 'user_books' in the schema cache
Could not find the 'reading_reason' column of 'user_books' in the schema cache
```

**해결:**
- ✅ `getUserBooksWithNotes()` 함수에서 `completed_dates`와 `reading_reason` 컬럼 조회 제거
- ✅ `getBookDetail()` 함수에서도 `completed_dates` 컬럼 조회 제거

#### 문제 2: RLS 정책 확인

**확인 결과:**
- ✅ `user_books` 테이블: `auth.uid() = user_id` 정책 정상 설정
- ✅ `bookshelves` 테이블: `auth.uid() = user_id` 정책 정상 설정

**결론:** RLS 정책은 올바르게 설정되어 있습니다.

#### 문제 3: UUID 매핑 확인 필요

**가능한 원인:**
- 현재 로그인한 사용자의 UUID가 매핑된 UUID와 일치하지 않을 수 있음
- Vercel 환경 변수가 새 Supabase 프로젝트를 가리키지 않을 수 있음

**확인 필요:**
1. 현재 로그인한 사용자의 UUID 확인
2. Vercel 환경 변수 확인 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

---

## 3. 해결 방안

### 3.1 코드 수정 완료

#### ✅ `app/actions/books.ts` 수정

1. **`getUserBooksWithNotes()` 함수:**
   - `completed_dates` 컬럼 조회 제거
   - `reading_reason` 컬럼 조회 제거
   - 결과 매핑 시 `completed_dates`와 `reading_reason`을 `null`로 설정

2. **`getBookDetail()` 함수:**
   - `completed_dates` 컬럼 조회 제거

### 3.2 확인 필요 사항

#### 1. Vercel 환경 변수 확인

Vercel Dashboard에서 다음 환경 변수가 새 Supabase 프로젝트를 가리키는지 확인:

```env
NEXT_PUBLIC_SUPABASE_URL=https://pkdhhtfomhhuiirzurhs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=새_프로젝트의_anon_key
```

**확인 방법:**
1. Vercel Dashboard → 프로젝트 → Settings → Environment Variables
2. `NEXT_PUBLIC_SUPABASE_URL`이 `https://pkdhhtfomhhuiirzurhs.supabase.co`인지 확인
3. `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 새 프로젝트의 anon key인지 확인

#### 2. 현재 로그인한 사용자 UUID 확인

**확인 방법:**
1. 브라우저 개발자 도구 → Console
2. 다음 코드 실행:
   ```javascript
   // Supabase 클라이언트에서 현재 사용자 확인
   const { data: { user } } = await supabase.auth.getUser();
   console.log('Current user ID:', user?.id);
   ```

3. 확인된 UUID가 다음 중 하나인지 확인:
   - `60538115-0957-41c7-b52e-f18b62ec569b` (cdhnaya@kakao.com)
   - `336282aa-ddee-41bb-9e78-1f71e87efed1` (cdhrich@gmail.com)
   - `031d63c6-0927-4a12-bc07-98b7441144df` (cdhrich@naver.com)

#### 3. 404 오류 원인 확인

**가능한 원인:**
- 동적 라우팅 문제 (`/books/[id]` 경로)
- `bookshelves` ID를 사용한 라우팅이 실패할 수 있음

**확인 방법:**
- 브라우저 개발자 도구 → Network 탭에서 실패한 요청 확인
- 서버 로그 확인 (Vercel Dashboard → Functions → Logs)

---

## 4. 다음 단계

### 4.1 즉시 확인 사항

1. **Vercel 환경 변수 확인 및 수정**
   - 새 Supabase 프로젝트 URL과 API Key 설정 확인
   - 수정 후 재배포

2. **코드 수정 배포**
   - 수정된 `app/actions/books.ts` 파일 배포
   - Vercel에 자동 배포되거나 수동 배포

3. **사용자 UUID 확인**
   - 현재 로그인한 사용자의 UUID 확인
   - 매핑된 UUID와 일치하는지 확인

### 4.2 추가 확인 사항

1. **404 오류 디버깅**
   - 어떤 경로에서 404가 발생하는지 확인
   - 동적 라우팅 파라미터 확인

2. **RLS 정책 테스트**
   - Service Role Key로는 데이터가 보이지만, 일반 사용자 권한으로는 보이지 않는 경우
   - `auth.uid()`가 올바르게 반환되는지 확인

---

## 5. 체크리스트

- [x] 마이그레이션 데이터 확인 완료
- [x] RLS 정책 확인 완료
- [x] 스키마 불일치 문제 수정 완료 (`completed_dates`, `reading_reason` 제거)
- [ ] Vercel 환경 변수 확인 및 수정
- [ ] 코드 수정 배포
- [ ] 현재 로그인한 사용자 UUID 확인
- [ ] 404 오류 원인 확인
- [ ] 애플리케이션 테스트

---

## 6. 참고 사항

### 6.1 스키마 차이

**기존 프로젝트에만 존재하는 컬럼:**
- `user_books.completed_dates` (JSONB 배열)
- `user_books.reading_reason` (VARCHAR)

**새 프로젝트 스키마:**
- 위 컬럼들이 제거됨
- 마이그레이션 스크립트에서 자동으로 필터링됨

### 6.2 UUID 매핑

**매핑된 사용자:**
- `cdhnaya@kakao.com`: `7f47d5b6...` → `60538115...`
- `cdhrich@gmail.com`: `f6647230...` → `336282aa...`
- `cdhrich@naver.com`: `ba1e0451...` → `031d63c6...`

**중요:** 현재 로그인한 사용자의 UUID가 위 매핑된 UUID 중 하나와 일치해야 데이터가 보입니다.

---

**다음 단계:** Vercel 환경 변수 확인 및 코드 배포 후 테스트
