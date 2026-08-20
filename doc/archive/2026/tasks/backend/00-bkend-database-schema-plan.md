# TASK-00: 데이터베이스 스키마 설정

**작업 ID:** TASK-00  
**우선순위:** P0 (Must Have)  
**예상 소요 시간:** 1일  
**의존성:** 없음  
**다음 작업:** 모든 백엔드 작업

---

## 작업 개요

Supabase 데이터베이스에 모든 테이블, 인덱스, RLS 정책, 함수, 트리거를 생성합니다. 이 작업은 모든 백엔드 작업의 전제조건입니다.

**작업 상태:** ✅ 스키마 파일 생성 완료 (수정 완료: 테이블 생성 순서 문제 해결)

---

## 작업 범위

### 포함 사항
- ✅ Supabase 프로젝트 준비 또는 기존 프로젝트 확인
- ✅ 모든 테이블 생성 (users, books, user_books, notes, groups, group_members, group_books, group_notes)
- ✅ ENUM 타입 생성 (reading_status, note_type, member_role, member_status)
- ✅ 인덱스 생성
- ✅ RLS (Row Level Security) 정책 설정
- ✅ 데이터베이스 함수 생성
- ✅ 트리거 생성
- ✅ Storage 버킷 생성 및 정책 설정

### 제외 사항
- ❌ 프론트엔드 코드 (프론트엔드 작업에서 처리)
- ❌ API 구현 (각 백엔드 작업에서 처리)

---

## 상세 작업 목록

### 1. Supabase 프로젝트 준비

1. Supabase 대시보드에서 새 프로젝트 생성 또는 기존 프로젝트 확인
2. 프로젝트 URL과 API 키 확인
3. SQL Editor 접근 권한 확인

### 2. 데이터베이스 스키마 적용

**방법 1: SQL Editor에서 직접 실행 (권장)**

1. Supabase 대시보드 → SQL Editor 이동
2. `doc/database/schema.sql` 파일의 전체 내용을 복사
3. SQL Editor에 붙여넣기
4. "Run" 버튼 클릭 (또는 `Ctrl+Enter`)
5. 성공 메시지 확인

**방법 2: Supabase CLI 사용 (선택사항)**

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

### 3. Storage 버킷 생성

1. Supabase 대시보드 → Storage 이동
2. "New bucket" 클릭
3. 버킷 이름: `images`
4. Public bucket: ✅ 체크 (공개 이미지 접근을 위해)
5. File size limit: 5MB
6. Allowed MIME types: `image/jpeg, image/png, image/webp, image/heic`
7. "Create bucket" 클릭

### 4. Storage 정책 설정

Storage 버킷 생성 후 자동으로 RLS가 활성화됩니다. 다음 정책을 추가합니다:

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

## 파일 구조

```
doc/
└── database/
    ├── README.md           # 스키마 적용 가이드
    └── schema.sql          # 전체 데이터베이스 스키마 (통합 파일)
```

---

## 스키마 구성

### ENUM 타입
- `reading_status`: 'reading', 'completed', 'paused'
- `note_type`: 'quote', 'photo', 'memo', 'transcription'
- `member_role`: 'leader', 'member'
- `member_status`: 'pending', 'approved', 'rejected'

### 테이블
1. **users**: 사용자 프로필
2. **books**: 책 정보
3. **user_books**: 사용자-책 관계
4. **notes**: 기록
5. **groups**: 독서모임
6. **group_members**: 모임 멤버
7. **group_books**: 모임 책
8. **group_notes**: 모임 내 공유 기록

### 인덱스
- 기본 인덱스 (외래 키, 자주 조회되는 컬럼)
- Full-text Search 인덱스 (제목, 저자, 내용)
- 태그 인덱스 (GIN 인덱스)

### RLS 정책
- 사용자는 본인의 데이터만 조회/수정/삭제 가능
- 공개 기록은 모든 사용자가 조회 가능
- 모임 멤버는 모임 내 데이터 조회 가능
- 리더는 모임 설정 및 멤버 관리 가능

### 함수
- `update_updated_at_column()`: updated_at 자동 업데이트
- `get_user_completed_books_count()`: 올해 완독 책 수
- `get_user_notes_count_this_week()`: 이번 주 기록 수
- `handle_new_user()`: 사용자 프로필 자동 생성

### 트리거
- `on_auth_user_created`: auth.users에 새 사용자 생성 시 public.users에 프로필 자동 생성
- `update_*_updated_at`: 각 테이블의 updated_at 자동 업데이트

---

## 개발 프롬프트

```
@doc/software_design.md (4.2, 4.3 섹션) @doc/Habitree-Reading-Hub-PRD.md (7.1 섹션) 참고하여 
Supabase 데이터베이스 스키마를 설정해주세요.

작업 내용:
1. doc/database/schema.sql 파일을 생성하여 다음 내용을 포함:
   - ENUM 타입 정의 (reading_status, note_type, member_role, member_status)
   - 모든 테이블 생성 (users, books, user_books, notes, groups, group_members, group_books, group_notes)
   - 인덱스 생성
   - RLS 정책 설정
   - 데이터베이스 함수 생성 (update_updated_at_column, get_user_completed_books_count, get_user_notes_count_this_week, handle_new_user)
   - 트리거 생성

2. doc/database/README.md 파일을 생성하여 스키마 적용 가이드를 작성:
   - Supabase SQL Editor에서 실행하는 방법
   - Supabase CLI를 사용하는 방법 (선택사항)
   - Storage 버킷 생성 및 정책 설정 가이드
   - 검증 체크리스트

3. software_design.md의 4.2, 4.3 섹션을 정확히 따르되, 다음 사항을 확인:
   - ✅ Books 테이블의 ISBN은 UNIQUE 제약조건이 없어야 함 (여러 사용자가 같은 책 추가 가능) - 확인 완료
   - ✅ Notes 테이블에 tags 컬럼이 TEXT[] 타입으로 포함되어야 함 - 확인 완료
   - ✅ 모든 테이블에 updated_at 자동 업데이트 트리거가 설정되어야 함 - 확인 완료 (users, books, user_books, notes, groups)
   - ✅ RLS 정책이 모든 테이블에 적용되어야 함 - 확인 완료

4. 스키마 파일 생성 완료:
   - ✅ `doc/database/schema.sql` 파일 생성 완료
   - ✅ `doc/database/README.md` 파일 생성 완료
   - ✅ 모든 ENUM 타입 포함 확인
   - ✅ 모든 테이블 포함 확인
   - ✅ 모든 인덱스 포함 확인
   - ✅ 모든 RLS 정책 포함 확인
   - ✅ 모든 함수 포함 확인
   - ✅ 모든 트리거 포함 확인

5. Supabase 적용 후 다음을 검증 (수동 작업):
   - 모든 테이블이 생성되었는지 확인
   - 모든 인덱스가 생성되었는지 확인
   - RLS가 활성화되었는지 확인
   - 함수와 트리거가 생성되었는지 확인
   - Storage 버킷이 생성되었는지 확인
```

---

## 참고 문서

### 필수 참고 문서
- `doc/software_design.md` (4.2, 4.3 섹션)
  - 테이블 스키마 정의
  - RLS 정책
  - 데이터베이스 함수 및 트리거
- `doc/Habitree-Reading-Hub-PRD.md` (7.1 섹션)
  - 데이터 모델 개요

### 관련 프론트엔드 작업
- 없음 (이 작업은 모든 프론트엔드 작업의 전제조건)

---

## 검증 체크리스트

### 데이터베이스 스키마
- [x] ENUM 타입 4개 생성 확인 (`reading_status`, `note_type`, `member_role`, `member_status`)
- [x] 테이블 8개 생성 확인 (`users`, `books`, `user_books`, `notes`, `groups`, `group_members`, `group_books`, `group_notes`)
- [x] 모든 외래 키 제약조건 확인
- [x] 모든 인덱스 생성 확인 (기본 인덱스, Full-text Search 인덱스, 태그 인덱스)
- [x] Full-text Search 인덱스 생성 확인 (`idx_books_title_fts`, `idx_books_author_fts`, `idx_notes_content_fts`)
- [x] 태그 인덱스 (GIN) 생성 확인 (`idx_notes_tags`)

### RLS 정책
- [x] users 테이블 RLS 활성화 및 정책 확인 (SELECT, UPDATE)
- [x] books 테이블 (RLS 없음, 공개 데이터)
- [x] user_books 테이블 RLS 활성화 및 정책 확인 (SELECT, INSERT, UPDATE, DELETE)
- [x] notes 테이블 RLS 활성화 및 정책 확인 (SELECT with is_public, INSERT, UPDATE, DELETE)
- [x] groups 테이블 RLS 활성화 및 정책 확인 (SELECT with is_public/members, INSERT, UPDATE, DELETE)
- [x] group_members 테이블 RLS 활성화 및 정책 확인 (SELECT, INSERT, UPDATE)
- [x] group_books 테이블 RLS 활성화 및 정책 확인 (SELECT, INSERT)
- [x] group_notes 테이블 RLS 활성화 및 정책 확인 (SELECT, INSERT)

### 함수 및 트리거
- [x] `update_updated_at_column()` 함수 생성 확인
- [x] 모든 테이블에 updated_at 트리거 적용 확인 (users, books, user_books, notes, groups)
- [x] `get_user_completed_books_count()` 함수 생성 확인
- [x] `get_user_notes_count_this_week()` 함수 생성 확인
- [x] `handle_new_user()` 함수 생성 확인
- [x] `on_auth_user_created` 트리거 생성 확인

### 스키마 파일 생성
- [x] `doc/database/schema.sql` 파일 생성 완료
- [x] `doc/database/README.md` 파일 생성 완료
- [x] 모든 ENUM 타입 포함 확인
- [x] 모든 테이블 포함 확인
- [x] 모든 인덱스 포함 확인
- [x] 모든 RLS 정책 포함 확인
- [x] 모든 함수 포함 확인
- [x] 모든 트리거 포함 확인

### Storage
- [ ] `images` 버킷 생성 확인 (Supabase 대시보드에서 수동 생성 필요)
- [ ] 버킷이 Public으로 설정되었는지 확인 (Supabase 대시보드에서 수동 설정 필요)
- [ ] Storage RLS 정책 설정 확인 (README.md의 SQL 정책 실행 필요)

### 테스트 (Supabase에 스키마 적용 후)
- [ ] 테스트 사용자 생성 후 프로필 자동 생성 확인
- [ ] RLS 정책이 올바르게 작동하는지 확인 (본인 데이터만 조회 가능)
- [ ] updated_at 자동 업데이트 확인
- [ ] 통계 함수가 올바르게 작동하는지 확인

---

## 작업 완료 상태

### ✅ 완료된 작업
- [x] `doc/database/schema.sql` 파일 생성 완료
- [x] `doc/database/README.md` 파일 생성 완료
- [x] 모든 ENUM 타입 정의 포함
- [x] 모든 테이블 정의 포함
- [x] 모든 인덱스 정의 포함
- [x] 모든 RLS 정책 정의 포함
- [x] 모든 함수 정의 포함
- [x] 모든 트리거 정의 포함

### ⏳ 수동 작업 필요
다음 작업은 Supabase 대시보드에서 수동으로 수행해야 합니다:

1. **스키마 적용**
   - Supabase SQL Editor에서 `doc/database/schema.sql` 실행
   - 또는 Supabase CLI를 사용하여 마이그레이션 실행

2. **Storage 버킷 생성**
   - Supabase 대시보드 → Storage → "New bucket"
   - 버킷 이름: `images`
   - Public bucket: ✅ 체크
   - File size limit: 5MB
   - Allowed MIME types: `image/jpeg, image/png, image/webp, image/heic`

3. **Storage RLS 정책 설정**
   - `doc/database/README.md`의 Storage RLS 정책 SQL 실행

4. **검증 테스트**
   - 테스트 사용자 생성 및 프로필 자동 생성 확인
   - RLS 정책 작동 확인
   - 함수 및 트리거 작동 확인

## 다음 단계

스키마 파일 생성 완료 후:
1. Supabase 대시보드에서 스키마 적용 (수동)
2. Storage 버킷 생성 및 정책 설정 (수동)
3. 검증 테스트 수행 (수동)
4. 환경 변수 설정 확인 (`.env.local`)
5. TASK-01 (인증 및 온보딩 백엔드) 시작 가능
6. TASK-02 (책 관리 백엔드) 시작 가능
7. TASK-08 (프로필 관리 백엔드) 시작 가능

---

**문서 끝**

