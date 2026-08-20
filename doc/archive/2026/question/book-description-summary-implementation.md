# 책소개 요약 기능 구현 가이드

**작성일:** 2026년 1월 15일  
**기능:** Naver API + Gemini API를 통한 책소개 자동 요약 및 저장

---

## 📋 구현 내용

### 1. 데이터베이스 구조

**마이그레이션 파일:**
- `doc/database/migration-202601151300__books__add_description_summary.sql`

**추가된 컬럼:**
- `books.description_summary` (VARCHAR(50))
  - Naver API에서 가져온 책소개를 Gemini API로 요약한 20자 내외 텍스트
  - NULL 허용 (책소개가 없거나 요약 실패 시)

**기존 컬럼과의 차이:**
- `summary` (TEXT): 출판사 제공 또는 사용자가 기록한 책 소개
- `description_summary` (VARCHAR(50)): Naver API + Gemini API로 자동 생성된 요약

---

### 2. 타입 정의 업데이트

**파일:** `types/database.ts`

**업데이트 내용:**
- `books.Row`: `description_summary: string | null` 추가
- `books.Insert`: `description_summary?: string | null` 추가
- `books.Update`: `description_summary?: string | null` 추가

**파일:** `app/actions/books.ts`

**업데이트 내용:**
- `BookWithNotes` 인터페이스의 `books` 객체에 `description_summary: string | null` 추가
- `getUserBooksWithNotes()` 함수에서 `description_summary` 조회 추가

---

### 3. API 함수

**파일:** `lib/api/gemini.ts`

**함수:**
- `summarizeBookDescription(description: string): Promise<string>`
  - 책소개를 20자 내외로 요약
  - Gemini 1.5 Flash 모델 사용

**파일:** `app/actions/books.ts`

**함수:**
- `getBookDescriptionSummary(bookId: string, isbn?: string | null, title?: string | null): Promise<string>`
  - DB에 저장된 요약이 있으면 반환
  - 없으면 Naver API + Gemini API로 생성 후 DB에 저장
  - 비동기 저장 (실패해도 요약 반환)

---

### 4. 컴포넌트 수정

**파일:** `components/books/book-table.tsx`

**변경 사항:**
1. **상태 컬럼 폭 축소:**
   - 기존: `w-32 sm:w-40` → 수정: `w-24 sm:w-28`
   - 상태 버튼: `w-[180px]` → `max-w-[140px]`

2. **책소개 컬럼 추가:**
   - 제목과 상태 사이에 책소개 컬럼 추가
   - PC 버전에서만 표시 (`hidden lg:table-cell`)

3. **책소개 로드 로직:**
   - DB에서 가져온 `description_summary` 먼저 표시
   - 없으면 API로 요약 생성 후 표시 및 저장
   - 로딩 중에는 "요약 중..." 표시

---

## 🔄 데이터 흐름

### 1. 초기 로드

```
1. getUserBooksWithNotes() 호출
   ↓
2. books 테이블에서 description_summary 조회
   ↓
3. 컴포넌트에 전달
   ↓
4. book-table.tsx에서 표시
```

### 2. 요약 생성 (description_summary가 없는 경우)

```
1. book-table.tsx에서 description_summary 확인
   ↓
2. 없으면 getBookDescriptionSummary() 호출
   ↓
3. Naver API로 책소개 조회
   ↓
4. Gemini API로 20자 내외 요약
   ↓
5. DB에 저장 (비동기)
   ↓
6. 컴포넌트에 표시
```

---

## 📊 성능 최적화

### 1. 캐싱 전략

- **DB 저장**: 한 번 생성된 요약은 DB에 저장되어 재사용
- **메모리 캐싱**: 컴포넌트 내 state로 관리
- **중복 방지**: 이미 로드된 책은 재요청하지 않음

### 2. 병렬 처리

- 최대 5개씩 배치로 처리
- Promise.all을 사용한 병렬 API 호출

### 3. 조건부 로드

- PC 버전(lg 이상)에서만 로드
- 모바일에서는 성능 영향 없음

---

## 🗄️ 데이터베이스 마이그레이션

### 실행 방법

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **SQL Editor 이동**
   - 좌측 메뉴에서 "SQL Editor" 클릭

3. **마이그레이션 파일 실행**
   - `doc/database/migration-202601151300__books__add_description_summary.sql` 파일 내용 복사
   - SQL Editor에 붙여넣기
   - "Run" 버튼 클릭

4. **실행 결과 확인**
   - "Success. No rows returned" 메시지 확인

### 확인 쿼리

```sql
-- 컬럼 추가 확인
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'books'
  AND column_name = 'description_summary';
```

**예상 결과:**
- `column_name`: `description_summary`
- `data_type`: `character varying`
- `character_maximum_length`: `50`

---

## ✅ 체크리스트

### 데이터베이스
- [ ] 마이그레이션 파일 실행 완료
- [ ] `description_summary` 컬럼 확인

### 타입 정의
- [ ] `types/database.ts` 업데이트 확인
- [ ] `app/actions/books.ts`의 `BookWithNotes` 인터페이스 업데이트 확인

### 기능 테스트
- [ ] PC 버전에서 책소개 표시 확인
- [ ] DB에 저장된 요약이 표시되는지 확인
- [ ] 요약이 없는 책에서 자동 생성되는지 확인
- [ ] 로딩 상태 표시 확인

---

## 📝 참고 사항

### 환경 변수

**필수:**
- `GEMINI_API_KEY`: Gemini API 키
- `NAVER_CLIENT_ID`: 네이버 API 클라이언트 ID
- `NAVER_CLIENT_SECRET`: 네이버 API 클라이언트 시크릿

### API 사용량

- **Naver API**: 책소개 조회 (1시간 캐시)
- **Gemini API**: 텍스트 요약 (책당 1회, DB에 저장되어 재사용)

### 오류 처리

- Naver API 실패: 빈 문자열 반환
- Gemini API 실패: 원본 텍스트를 20자로 자르기
- DB 저장 실패: 요약은 반환하되 저장은 실패 (비동기 처리)

---

**이 문서는 책소개 요약 기능의 구현 가이드입니다.**
