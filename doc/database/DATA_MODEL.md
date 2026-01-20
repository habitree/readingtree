# 데이터 모델 (Data Model)

**프로젝트:** Habitree Reading Hub v4.0.0  
**최종 업데이트:** 2025년 1월  
**버전:** 1.0

---

## 목차

1. [개요(Overview)](#1-개요overview)
2. [네이밍 규칙](#2-네이밍-규칙)
3. [ENUM 타입 정의](#3-enum-타입-정의)
4. [테이블 정의](#4-테이블-정의)
5. [관계 요약](#5-관계-요약)
6. [접근 제어 원칙](#6-접근-제어-원칙)
7. [변경 로그(Change Log)](#7-변경-로그change-log)

---

## 1. 개요(Overview)

### 1.1 프로젝트 데이터 모델의 전체 목적

Habitree Reading Hub는 사용자의 독서 활동을 관리하고 공유하는 플랫폼입니다.  
데이터 모델은 다음 주요 도메인 개념을 다룹니다:

- **사용자 관리**: 사용자 프로필 및 인증 정보
- **책 관리**: 책 정보 및 사용자별 독서 상태
- **기록 관리**: 사용자가 책에 남긴 다양한 형태의 기록
- **독서모임**: 그룹 기반 독서 활동 및 기록 공유

### 1.2 주요 도메인 개념

1. **Users (사용자)**: 인증된 사용자의 프로필 정보
2. **Books (책)**: 공개 책 정보 (ISBN, 제목, 저자 등)
3. **Bookshelves (서재)**: 사용자의 서재 정보 (메인 서재 및 하위 서재)
4. **UserBooks (사용자-책 관계)**: 사용자가 읽는 책과 독서 상태
5. **Notes (기록)**: 사용자가 책에 남긴 인용구, 메모, 사진, 전사 등
6. **Groups (독서모임)**: 독서 그룹 정보
7. **GroupMembers (모임 멤버)**: 그룹 멤버십 및 역할
8. **GroupBooks (모임 책)**: 그룹에서 함께 읽는 책
9. **GroupNotes (모임 공유 기록)**: 그룹에 공유된 기록

---

## 2. 네이밍 규칙

### 2.1 테이블 네이밍 컨벤션

- **단수형 사용**: `users`, `books`, `notes` (복수형)
- **소문자 + 언더스코어**: `user_books`, `group_members`
- **관계 테이블**: `{주체}_{대상}` 형식 (예: `user_books`, `group_notes`)

### 2.2 컬럼 네이밍 컨벤션

- **소문자 + 언더스코어**: `user_id`, `created_at`
- **외래 키**: `{참조테이블명}_id` (예: `user_id`, `book_id`)
- **불리언**: `is_` 접두사 (예: `is_public`, `is_sample`)
- **타임스탬프**: `_at` 접미사 (예: `created_at`, `updated_at`)

### 2.3 인덱스 네이밍 컨벤션

- **형식**: `idx_{테이블명}_{컬럼명}` (예: `idx_users_email`)
- **복합 인덱스**: `idx_{테이블명}_{컬럼1}_{컬럼2}` (예: `idx_user_books_user_id_book_id`)
- **전문 검색 인덱스**: `idx_{테이블명}_{컬럼명}_fts` (예: `idx_books_title_fts`)

---

## 3. ENUM 타입 정의

### 3.1 reading_status (독서 상태)

```sql
CREATE TYPE reading_status AS ENUM ('reading', 'completed', 'paused', 'not_started', 'rereading');
```

- **reading**: 읽는 중
- **completed**: 완독
- **paused**: 일시 정지
- **not_started**: 읽기전 (아직 읽기 시작하지 않은 책)
- **rereading**: 재독 (다시 읽는 책)

**사용 테이블**: `user_books`

### 3.2 note_type (기록 유형)

```sql
CREATE TYPE note_type AS ENUM ('quote', 'photo', 'memo', 'transcription');
```

- **quote**: 인용구
- **photo**: 사진
- **memo**: 메모
- **transcription**: 전사 (OCR)

**사용 테이블**: `notes`

### 3.3 member_role (모임 멤버 역할)

```sql
CREATE TYPE member_role AS ENUM ('leader', 'member');
```

- **leader**: 리더
- **member**: 일반 멤버

**사용 테이블**: `group_members`

### 3.4 member_status (모임 멤버 상태)

```sql
CREATE TYPE member_status AS ENUM ('pending', 'approved', 'rejected');
```

- **pending**: 대기 중
- **approved**: 승인됨
- **rejected**: 거부됨

**사용 테이블**: `group_members`

### 3.5 ocr_log_status (OCR 로그 상태)

```sql
CREATE TYPE ocr_log_status AS ENUM ('success', 'failed');
```

- **success**: OCR 처리 성공
- **failed**: OCR 처리 실패

**사용 테이블**: `ocr_logs`

---

## 4. 테이블 정의

### 4.1 users (사용자 프로필)

**목적**: 인증된 사용자의 프로필 정보를 저장합니다. `auth.users` 테이블과 1:1 관계입니다.

**소유 구조**: 개인 (각 사용자는 자신의 프로필만 소유)

**주요 컬럼**:
- `id` (UUID, PK): `auth.users(id)` 참조, CASCADE 삭제
- `email` (VARCHAR(255)): 이메일 주소
- `name` (VARCHAR(100), NOT NULL): 사용자 이름
- `avatar_url` (TEXT): 프로필 이미지 URL
- `reading_goal` (INTEGER, DEFAULT 12): 올해 읽을 책 목표 수
- `terms_agreed` (BOOLEAN, DEFAULT FALSE): 이용약관 동의 여부
- `privacy_agreed` (BOOLEAN, DEFAULT FALSE): 개인정보처리방침 동의 여부
- `consent_date` (TIMESTAMP WITH TIME ZONE): 약관 동의 일시
- `created_at`, `updated_at` (TIMESTAMP WITH TIME ZONE): 생성/수정 시간

**관계 정의**:
- `id` → `auth.users(id)` (ON DELETE CASCADE)
- `id` ← `user_books(user_id)`
- `id` ← `notes(user_id)`
- `id` ← `groups(leader_id)`
- `id` ← `group_members(user_id)`

**인덱스**:
- `idx_users_email`: 이메일 조회용

**RLS 정책 요약**:
- **SELECT**: 자신의 프로필만 조회 가능 (`auth.uid() = id`)
- **INSERT**: 자신의 프로필만 생성 가능 (`auth.uid() = id`)
- **UPDATE**: 자신의 프로필만 수정 가능 (`auth.uid() = id`)
- **DELETE**: 자신의 프로필만 삭제 가능 (`auth.uid() = id`)

**특수 기능**:
- `handle_new_user()` 트리거: `auth.users`에 새 사용자 생성 시 자동으로 프로필 생성

---

### 4.2 books (책)

**목적**: 공개 책 정보를 저장합니다. 여러 사용자가 같은 책을 추가할 수 있습니다.

**소유 구조**: 공개 (모든 사용자가 조회 가능, 소유 개념 없음)

**주요 컬럼**:
- `id` (UUID, PK): 기본 키
- `isbn` (VARCHAR(20)): ISBN 번호 (NULL 허용, UNIQUE 아님)
- `title` (VARCHAR(500), NOT NULL): 책 제목
- `author` (VARCHAR(200)): 저자
- `publisher` (VARCHAR(200)): 출판사
- `published_date` (DATE): 출판일
- `cover_image_url` (TEXT): 표지 이미지 URL
- `category` (VARCHAR(100)): 도서 분류 (소설, 자기계발, 인문 등)
- `total_pages` (INTEGER): 도서의 전체 페이지 수
- `summary` (TEXT): 출판사 제공 또는 사용자가 기록한 책 소개
- `description_summary` (VARCHAR(50)): Naver API에서 가져온 책소개를 Gemini API로 요약한 20자 내외 텍스트
- `external_link` (TEXT): 네이버 링크 (도서 검색 및 구매 페이지 연결용 URL)
- `is_sample` (BOOLEAN, DEFAULT FALSE): 샘플 데이터 플래그 (게스트 사용자용)
- `created_at`, `updated_at` (TIMESTAMP WITH TIME ZONE): 생성/수정 시간

**관계 정의**:
- `id` ← `user_books(book_id)` (ON DELETE CASCADE)
- `id` ← `notes(book_id)` (ON DELETE CASCADE)
- `id` ← `group_books(book_id)` (ON DELETE CASCADE)

**인덱스**:
- `idx_books_isbn`: ISBN 조회용 (NULL 제외)
- `idx_books_title`: 제목 조회용
- `idx_books_author`: 저자 조회용
- `idx_books_category`: 분류별 필터링용 (NULL 제외)
- `idx_books_total_pages`: 페이지 수 범위 검색용 (NULL 제외)
- `idx_books_is_sample`: 샘플 데이터 조회용
- `idx_books_title_fts`: 제목 전문 검색용 (GIN)
- `idx_books_author_fts`: 저자 전문 검색용 (GIN)

**RLS 정책 요약**:
- **RLS 없음**: 모든 사용자가 조회 가능 (공개 데이터)

---

### 4.3 user_books (사용자-책 관계)

**목적**: 사용자가 읽는 책과 독서 상태를 관리합니다. 사용자와 책의 다대다 관계를 표현합니다.

**소유 구조**: 개인 (각 사용자는 자신의 독서 목록만 소유)

**주요 컬럼**:
- `id` (UUID, PK): 기본 키
- `user_id` (UUID, NOT NULL): 사용자 ID (`users(id)` 참조)
- `book_id` (UUID, NOT NULL): 책 ID (`books(id)` 참조)
- `bookshelf_id` (UUID, NOT NULL): 서재 ID (`bookshelves(id)` 참조)
- `status` (reading_status, DEFAULT 'reading'): 독서 상태
- `started_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW()): 시작일
- `completed_at` (TIMESTAMP WITH TIME ZONE): 완독일
- `reading_reason` (TEXT): 사용자가 책을 읽는 이유 (선택 사항)
- `book_format` (VARCHAR(50)): 읽는 책 종류 (종이책, 전자책, 종이+전자 등 독서 매체)
- `created_at`, `updated_at` (TIMESTAMP WITH TIME ZONE): 생성/수정 시간
- **UNIQUE 제약**: `(user_id, book_id)` - 한 사용자는 같은 책을 한 번만 추가 가능

**관계 정의**:
- `user_id` → `users(id)` (ON DELETE CASCADE)
- `book_id` → `books(id)` (ON DELETE CASCADE)
- `bookshelf_id` → `bookshelves(id)` (ON DELETE SET NULL)

**인덱스**:
- `idx_user_books_user_id`: 사용자별 책 목록 조회용
- `idx_user_books_book_id`: 책별 사용자 목록 조회용
- `idx_user_books_status`: 상태별 필터링용
- `idx_user_books_bookshelf_id`: 서재별 책 조회용
- `idx_user_books_book_format`: 독서 매체별 필터링용 (NULL 제외)

**RLS 정책 요약**:
- **SELECT**: 자신의 책 또는 샘플 책 조회 가능 (`auth.uid() = user_id OR book.is_sample = TRUE`)
- **INSERT**: 자신의 책만 추가 가능 (`auth.uid() = user_id`)
- **UPDATE**: 자신의 책만 수정 가능 (`auth.uid() = user_id`)
- **DELETE**: 자신의 책만 삭제 가능 (`auth.uid() = user_id`)

---

### 4.4 bookshelves (서재)

**목적**: 사용자의 서재 정보를 관리합니다. 메인 서재(통합 뷰)와 하위 서재(개별 관리)를 지원합니다.

**소유 구조**: 개인 (각 사용자는 자신의 서재만 소유)

**주요 컬럼**:
- `id` (UUID, PK): 기본 키
- `user_id` (UUID, NOT NULL): 사용자 ID (`auth.users(id)` 참조)
- `name` (VARCHAR(100), NOT NULL): 서재 이름
- `description` (TEXT): 서재 설명 (선택 사항)
- `is_main` (BOOLEAN, DEFAULT FALSE): 메인 서재 여부 (통합 뷰)
- `order` (INTEGER, DEFAULT 0): 정렬 순서
- `is_public` (BOOLEAN, DEFAULT FALSE): 공개 여부 (향후 공유 기능용)
- `created_at`, `updated_at` (TIMESTAMP WITH TIME ZONE): 생성/수정 시간
- **UNIQUE 제약**: `(user_id, is_main)` WHERE `is_main = TRUE` - 사용자당 메인 서재는 1개만
- **CHECK 제약**: `order >= 0` - 정렬 순서는 0 이상

**관계 정의**:
- `user_id` → `auth.users(id)` (ON DELETE CASCADE)
- `id` ← `user_books(bookshelf_id)` (ON DELETE SET NULL)

**인덱스**:
- `idx_bookshelves_user_id`: 사용자별 서재 조회용
- `idx_bookshelves_is_main`: 메인 서재 조회용
- `idx_bookshelves_order`: 정렬 순서 조회용

**RLS 정책 요약**:
- **SELECT**: 자신의 서재 또는 공개 서재 조회 가능 (`auth.uid() = user_id OR is_public = TRUE`)
- **INSERT**: 자신의 서재만 생성 가능 (`auth.uid() = user_id`)
- **UPDATE**: 자신의 서재만 수정 가능 (`auth.uid() = user_id`)
- **DELETE**: 자신의 서재만 삭제 가능 (`auth.uid() = user_id AND is_main = FALSE`)

**특수 규칙**:
- 메인 서재(`is_main = TRUE`)는 사용자당 1개만 존재하며, 삭제할 수 없음
- 메인 서재는 모든 하위 서재의 책을 통합하여 보여주는 뷰 역할
- 실제 책 데이터는 `user_books.bookshelf_id`에 저장되며, 메인 서재 조회 시 모든 서재의 책을 포함

---

### 4.5 notes (기록)

**목적**: 사용자가 책에 남긴 다양한 형태의 기록(인용구, 메모, 사진, 전사)을 저장합니다.

**소유 구조**: 개인/공개 (기본적으로 개인, `is_public = TRUE` 시 공개)

**주요 컬럼**:
- `id` (UUID, PK): 기본 키
- `user_id` (UUID, NOT NULL): 사용자 ID (`users(id)` 참조)
- `book_id` (UUID, NOT NULL): 책 ID (`books(id)` 참조) - 주 책
- `title` (TEXT): 기록 제목 (선택 사항)
- `type` (note_type, NOT NULL): 기록 유형
- `content` (TEXT): 기록 내용
- `image_url` (TEXT): 이미지 URL (사진/전사 타입용)
- `page_number` (INTEGER): 페이지 번호
- `is_public` (BOOLEAN, DEFAULT FALSE): 공개 여부
- `is_sample` (BOOLEAN, DEFAULT FALSE): 샘플 데이터 플래그 (게스트 사용자용)
- `tags` (TEXT[]): 태그 배열
- `related_user_book_ids` (UUID[]): 연결된 다른 책들의 `user_books.id` 배열 (선택 사항)
- `created_at`, `updated_at` (TIMESTAMP WITH TIME ZONE): 생성/수정 시간

**관계 정의**:
- `user_id` → `users(id)` (ON DELETE CASCADE)
- `book_id` → `books(id)` (ON DELETE CASCADE)
- `id` ← `group_notes(note_id)` (ON DELETE CASCADE)

**인덱스**:
- `idx_notes_user_id`: 사용자별 기록 조회용
- `idx_notes_book_id`: 책별 기록 조회용
- `idx_notes_type`: 타입별 필터링용
- `idx_notes_created_at`: 최신순 정렬용 (DESC)
- `idx_notes_page_number`: 페이지별 조회용
- `idx_notes_is_sample`: 샘플 데이터 조회용
- `idx_notes_content_fts`: 내용 전문 검색용 (GIN)
- `idx_notes_tags`: 태그 검색용 (GIN)
- `idx_notes_title`: 제목 검색용
- `idx_notes_related_user_book_ids`: 관련 책 검색용 (GIN)

**RLS 정책 요약**:
- **SELECT**: 자신의 기록, 공개 기록, 샘플 기록 조회 가능 (`auth.uid() = user_id OR is_public = TRUE OR is_sample = TRUE`)
- **INSERT**: 자신의 기록만 생성 가능 (`auth.uid() = user_id`)
- **UPDATE**: 자신의 기록만 수정 가능 (`auth.uid() = user_id`)
- **DELETE**: 자신의 기록만 삭제 가능 (`auth.uid() = user_id`)

---

### 4.5 transcriptions (필사 OCR 데이터)

**목적**: 필사 등록 시 OCR로 변환된 텍스트 데이터를 별도로 관리합니다. 책 구절과 사용자의 생각을 체계적으로 저장하고 관리합니다.

**소유 구조**: 개인 (각 사용자는 자신의 필사 데이터만 소유)

**주요 컬럼**:
- `id` (UUID, PK): 기본 키
- `note_id` (UUID, NOT NULL): 기록 ID (`notes(id)` 참조, UNIQUE)
- `extracted_text` (TEXT, NOT NULL): OCR로 추출된 원본 텍스트
- `quote_content` (TEXT): 책 구절 (사용자가 편집 가능)
- `memo_content` (TEXT): 사용자의 생각 (사용자가 추가 가능)
- `status` (ocr_status, DEFAULT 'processing'): OCR 처리 상태
  - `processing`: 처리 중
  - `completed`: 완료
  - `failed`: 실패
- `created_at`, `updated_at` (TIMESTAMP WITH TIME ZONE): 생성/수정 시간
- **UNIQUE 제약**: `(note_id)` - 하나의 기록은 하나의 transcription만 가질 수 있음

**관계 정의**:
- `note_id` → `notes(id)` (ON DELETE CASCADE)

**인덱스**:
- `idx_transcriptions_note_id`: 기록별 transcription 조회용
- `idx_transcriptions_status`: 상태별 필터링용
- `idx_transcriptions_created_at`: 최신순 정렬용 (DESC)

**RLS 정책 요약**:
- **SELECT**: 자신의 기록에 대한 transcription만 조회 가능 (`notes.user_id = auth.uid()`)
- **INSERT**: 자신의 기록에 대한 transcription만 생성 가능 (`notes.user_id = auth.uid()`)
- **UPDATE**: 자신의 기록에 대한 transcription만 수정 가능 (`notes.user_id = auth.uid()`)
- **DELETE**: 자신의 기록에 대한 transcription만 삭제 가능 (`notes.user_id = auth.uid()`)

---

### 4.6 ocr_usage_stats (OCR 사용 통계)

**목적**: 사용자별 OCR 처리 횟수를 집계하여 저장합니다. 유료화 및 사용량 제한을 위한 내부 통계 데이터입니다. 사용자에게는 표시되지 않으며 관리자 및 시스템에서만 조회합니다.

**소유 구조**: 개인 (각 사용자는 자신의 통계만 소유, 하지만 사용자는 조회 불가)

**주요 컬럼**:
- `id` (UUID, PK): 기본 키
- `user_id` (UUID, NOT NULL): 사용자 ID (`auth.users(id)` 참조, UNIQUE)
- `success_count` (INTEGER, DEFAULT 0): 성공한 OCR 처리 횟수
- `failure_count` (INTEGER, DEFAULT 0): 실패한 OCR 처리 횟수
- `last_processed_at` (TIMESTAMP WITH TIME ZONE): 마지막 OCR 처리 시간
- `created_at`, `updated_at` (TIMESTAMP WITH TIME ZONE): 생성/수정 시간
- **UNIQUE 제약**: `(user_id)` - 한 사용자는 하나의 통계 레코드만 가짐

**관계 정의**:
- `user_id` → `auth.users(id)` (ON DELETE CASCADE)

**인덱스**:
- `idx_ocr_usage_stats_user_id`: 사용자별 통계 조회용 (UNIQUE 인덱스)

**RLS 정책 요약**:
- **SELECT**: 관리자만 조회 가능 (`is_admin_user()` 함수 사용)
- **INSERT**: 시스템에서만 생성 가능 (RLS 정책 없음, 서버 액션에서 직접 처리)
- **UPDATE**: 시스템에서만 수정 가능 (RLS 정책 없음, 서버 액션에서 직접 처리)
- **DELETE**: 사용자 삭제 시 CASCADE 삭제

**특수 기능**:
- 사용자는 자신의 통계를 조회할 수 없음 (내부 로그용)
- 관리자만 전체 통계 조회 가능
- OCR 처리 성공/실패 시 자동으로 카운트 증가

---

### 4.7 ocr_logs (OCR 처리 상세 로그)

**목적**: 각 OCR 처리 요청의 상세 로그를 기록합니다. 디버깅, 분석, 유료화 정책 수립을 위한 상세 이력 데이터입니다.

**소유 구조**: 개인 (각 사용자는 자신의 로그만 소유, 하지만 사용자는 조회 불가)

**주요 컬럼**:
- `id` (UUID, PK): 기본 키
- `user_id` (UUID, NOT NULL): 사용자 ID (`auth.users(id)` 참조)
- `note_id` (UUID): 기록 ID (`notes(id)` 참조, NULL 허용)
- `status` (ocr_log_status, NOT NULL): OCR 처리 상태
  - `success`: 성공
  - `failed`: 실패
- `error_message` (TEXT): 실패 시 에러 메시지 (NULL 허용)
- `processing_duration_ms` (INTEGER): 처리 소요 시간 (밀리초, NULL 허용)
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW()): 로그 생성 시간

**관계 정의**:
- `user_id` → `auth.users(id)` (ON DELETE CASCADE)
- `note_id` → `notes(id)` (ON DELETE SET NULL)

**인덱스**:
- `idx_ocr_logs_user_id`: 사용자별 로그 조회용
- `idx_ocr_logs_note_id`: 기록별 로그 조회용
- `idx_ocr_logs_status`: 상태별 필터링용
- `idx_ocr_logs_created_at`: 시간순 정렬용 (DESC)

**RLS 정책 요약**:
- **SELECT**: 관리자만 조회 가능 (`is_admin_user()` 함수 사용)
- **INSERT**: 시스템에서만 생성 가능 (RLS 정책 없음, 서버 액션에서 직접 처리)
- **UPDATE**: 없음 (로그는 수정 불가)
- **DELETE**: 사용자 삭제 시 CASCADE 삭제

**특수 기능**:
- 사용자는 자신의 로그를 조회할 수 없음 (내부 로그용)
- 관리자만 전체 로그 조회 가능
- 로그는 생성 후 수정 불가 (불변 데이터)

---

### 4.8 groups (독서모임)

**목적**: 독서 그룹 정보를 저장합니다. 리더가 그룹을 생성하고 관리합니다.

**소유 구조**: 그룹 (리더가 소유, 멤버는 참여)

**주요 컬럼**:
- `id` (UUID, PK): 기본 키
- `name` (VARCHAR(200), NOT NULL): 그룹 이름
- `description` (TEXT): 그룹 설명
- `leader_id` (UUID, NOT NULL): 리더 ID (`users(id)` 참조)
- `is_public` (BOOLEAN, DEFAULT FALSE): 공개 여부
- `created_at`, `updated_at` (TIMESTAMP WITH TIME ZONE): 생성/수정 시간

**관계 정의**:
- `leader_id` → `users(id)` (ON DELETE CASCADE)
- `id` ← `group_members(group_id)` (ON DELETE CASCADE)
- `id` ← `group_books(group_id)` (ON DELETE CASCADE)
- `id` ← `group_notes(group_id)` (ON DELETE CASCADE)

**인덱스**:
- `idx_groups_leader_id`: 리더별 그룹 조회용
- `idx_groups_is_public`: 공개 그룹 조회용

**RLS 정책 요약**:
- **SELECT**: 공개 그룹, 자신이 리더인 그룹, 자신이 멤버인 그룹 조회 가능
- **INSERT**: 인증된 사용자가 리더로 그룹 생성 가능 (`auth.uid() = leader_id`)
- **UPDATE**: 리더만 수정 가능 (`auth.uid() = leader_id`)
- **DELETE**: 리더만 삭제 가능 (`auth.uid() = leader_id`)

---

### 4.7 group_members (모임 멤버)

**목적**: 그룹 멤버십 정보를 저장합니다. 사용자의 그룹 가입 요청 및 승인 상태를 관리합니다.

**소유 구조**: 그룹 (그룹 리더가 멤버십 관리)

**주요 컬럼**:
- `id` (UUID, PK): 기본 키
- `group_id` (UUID, NOT NULL): 그룹 ID (`groups(id)` 참조)
- `user_id` (UUID, NOT NULL): 사용자 ID (`users(id)` 참조)
- `role` (member_role, DEFAULT 'member'): 멤버 역할
- `status` (member_status, DEFAULT 'pending'): 멤버십 상태
- `joined_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW()): 가입일
- **UNIQUE 제약**: `(group_id, user_id)` - 한 사용자는 같은 그룹에 한 번만 가입 가능

**관계 정의**:
- `group_id` → `groups(id)` (ON DELETE CASCADE)
- `user_id` → `users(id)` (ON DELETE CASCADE)

**인덱스**:
- `idx_group_members_group_id`: 그룹별 멤버 조회용
- `idx_group_members_user_id`: 사용자별 그룹 조회용
- `idx_group_members_status`: 상태별 필터링용

**RLS 정책 요약**:
- **SELECT**: 리더가 볼 수 있는 그룹의 멤버, 공개 그룹의 멤버, 자신의 멤버십 정보 조회 가능
- **INSERT**: 사용자가 자신의 가입 요청 생성 가능 (`auth.uid() = user_id`)
- **UPDATE**: 리더만 멤버십 상태 변경 가능
- **DELETE**: 리더만 멤버 제거 가능

---

### 4.8 group_books (모임 책)

**목적**: 그룹에서 함께 읽는 책을 관리합니다.

**소유 구조**: 그룹 (그룹 리더가 책 추가)

**주요 컬럼**:
- `id` (UUID, PK): 기본 키
- `group_id` (UUID, NOT NULL): 그룹 ID (`groups(id)` 참조)
- `book_id` (UUID, NOT NULL): 책 ID (`books(id)` 참조)
- `started_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW()): 시작일
- `target_completed_at` (TIMESTAMP WITH TIME ZONE): 목표 완독일
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW()): 생성일
- **UNIQUE 제약**: `(group_id, book_id)` - 한 그룹은 같은 책을 한 번만 추가 가능

**관계 정의**:
- `group_id` → `groups(id)` (ON DELETE CASCADE)
- `book_id` → `books(id)` (ON DELETE CASCADE)

**인덱스**:
- `idx_group_books_group_id`: 그룹별 책 조회용
- `idx_group_books_book_id`: 책별 그룹 조회용

**RLS 정책 요약**:
- **SELECT**: 리더, 멤버, 또는 공개 그룹의 책 조회 가능
- **INSERT**: 리더만 책 추가 가능
- **UPDATE**: 리더만 책 정보 수정 가능
- **DELETE**: 리더만 책 제거 가능

---

### 4.8 group_shared_books (모임에 공유된 개인 서재)

**목적**: 모임 멤버들이 자신의 개인 서재를 모임에 공유합니다.

**소유 구조**: 개인 (사용자가 자신의 서재를 공유)

**주요 컬럼**:
- `id` (UUID, PK): 기본 키
- `group_id` (UUID, NOT NULL): 그룹 ID (`groups(id)` 참조)
- `user_book_id` (UUID, NOT NULL): 사용자 서재 ID (`user_books(id)` 참조)
- `shared_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW()): 공유일
- **UNIQUE 제약**: `(group_id, user_book_id)` - 한 모임에 같은 서재를 한 번만 공유 가능

**관계 정의**:
- `group_id` → `groups(id)` (ON DELETE CASCADE)
- `user_book_id` → `user_books(id)` (ON DELETE CASCADE)

**인덱스**:
- `idx_group_shared_books_group_id`: 그룹별 공유 서재 조회용
- `idx_group_shared_books_user_book_id`: 서재별 그룹 조회용

**RLS 정책 요약**:
- **SELECT**: 리더, 멤버, 또는 공개 그룹의 공유 서재 조회 가능
- **INSERT**: 자신의 서재만 공유 가능, 모임 멤버만 공유 가능
- **DELETE**: 자신이 공유한 서재만 공유 해제 가능

---

### 4.8 group_notes (모임 내 공유 기록)

**목적**: 그룹에 공유된 기록을 관리합니다. 사용자가 자신의 기록을 그룹에 공유할 수 있습니다.

**소유 구조**: 그룹 (기록 소유자가 그룹에 공유)

**주요 컬럼**:
- `id` (UUID, PK): 기본 키
- `group_id` (UUID, NOT NULL): 그룹 ID (`groups(id)` 참조)
- `note_id` (UUID, NOT NULL): 기록 ID (`notes(id)` 참조)
- `shared_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW()): 공유일
- **UNIQUE 제약**: `(group_id, note_id)` - 한 기록은 같은 그룹에 한 번만 공유 가능

**관계 정의**:
- `group_id` → `groups(id)` (ON DELETE CASCADE)
- `note_id` → `notes(id)` (ON DELETE CASCADE)

**인덱스**:
- `idx_group_notes_group_id`: 그룹별 공유 기록 조회용
- `idx_group_notes_note_id`: 기록별 그룹 조회용

**RLS 정책 요약**:
- **SELECT**: 리더가 볼 수 있는 그룹의 공유 기록, 공개 그룹의 공유 기록, 멤버가 볼 수 있는 그룹의 공유 기록 조회 가능
- **INSERT**: 기록 소유자만 그룹에 공유 가능 (`auth.uid() = note.user_id`)
- **DELETE**: 기록 소유자만 그룹에서 공유 해제 가능 (`auth.uid() = note.user_id`)

---

### 4.9 chat_sessions (AI 채팅 세션)

**목적**: AI 독서 도우미와의 채팅 세션을 관리합니다.

**소유 구조**: 개인 (각 사용자는 자신의 채팅 세션만 소유)

**주요 컬럼**:
- `id` (UUID, PK): 기본 키
- `user_id` (UUID, NOT NULL): 사용자 ID (`auth.users(id)` 참조)
- `title` (VARCHAR(200)): 세션 제목 (첫 메시지 기반 자동 생성)
- `last_message_at` (TIMESTAMP WITH TIME ZONE): 마지막 메시지 시간
- `message_count` (INTEGER, DEFAULT 0): 메시지 수
- `created_at`, `updated_at` (TIMESTAMP WITH TIME ZONE): 생성/수정 시간

**관계 정의**:
- `user_id` → `auth.users(id)` (ON DELETE CASCADE)
- `id` ← `chat_messages(session_id)` (ON DELETE CASCADE)

**인덱스**:
- `idx_chat_sessions_user_id`: 사용자별 세션 조회용
- `idx_chat_sessions_last_message_at`: 최신 세션 정렬용 (DESC)

**RLS 정책 요약**:
- **SELECT**: 자신의 세션만 조회 가능 (`auth.uid() = user_id`)
- **INSERT**: 자신의 세션만 생성 가능 (`auth.uid() = user_id`)
- **UPDATE**: 자신의 세션만 수정 가능 (`auth.uid() = user_id`)
- **DELETE**: 자신의 세션만 삭제 가능 (`auth.uid() = user_id`)

---

### 4.10 chat_messages (AI 채팅 메시지)

**목적**: AI 독서 도우미와의 대화 메시지를 저장합니다.

**소유 구조**: 개인 (세션 소유자만 접근 가능)

**주요 컬럼**:
- `id` (UUID, PK): 기본 키
- `session_id` (UUID, NOT NULL): 세션 ID (`chat_sessions(id)` 참조)
- `role` (VARCHAR(20), NOT NULL): 메시지 역할 ('user', 'assistant', 'system')
- `content` (TEXT, NOT NULL): 메시지 내용
- `context_books` (UUID[]): 참조된 책 ID 배열
- `context_notes` (UUID[]): 참조된 기록 ID 배열
- `created_at` (TIMESTAMP WITH TIME ZONE): 생성 시간

**관계 정의**:
- `session_id` → `chat_sessions(id)` (ON DELETE CASCADE)

**인덱스**:
- `idx_chat_messages_session_id`: 세션별 메시지 조회용
- `idx_chat_messages_created_at`: 시간순 정렬용

**RLS 정책 요약**:
- **SELECT**: 자신의 세션에 속한 메시지만 조회 가능
- **INSERT**: 자신의 세션에만 메시지 생성 가능
- **UPDATE**: 자신의 세션에 속한 메시지만 수정 가능
- **DELETE**: 자신의 세션에 속한 메시지만 삭제 가능

---

### 4.11 user_personas (사용자 페르소나)

**목적**: 사용자의 독서 성향 분석 결과를 저장합니다. AI 챗봇이 개인화된 응답을 제공하는 데 사용됩니다.

**소유 구조**: 개인 (각 사용자는 하나의 페르소나만 소유)

**주요 컬럼**:
- `id` (UUID, PK): 기본 키
- `user_id` (UUID, NOT NULL, UNIQUE): 사용자 ID (`auth.users(id)` 참조)
- `reading_pace` (VARCHAR(20)): 독서 속도 ('fast', 'steady', 'slow')
- `note_style` (VARCHAR(30)): 기록 스타일 ('quote-focused', 'reflection-focused', 'visual', 'balanced')
- `activity_pattern` (VARCHAR(20)): 활동 패턴 ('morning', 'afternoon', 'evening', 'night')
- `group_engagement` (VARCHAR(20)): 그룹 참여 스타일 ('leader', 'active', 'observer', 'solo')
- `reading_stats` (JSONB): 상세 독서 통계
- `category_preferences` (JSONB): 카테고리 선호도 배열
- `persona_summary` (TEXT): AI 생성 페르소나 요약
- `last_analyzed_at` (TIMESTAMP WITH TIME ZONE): 마지막 분석 시간
- `created_at`, `updated_at` (TIMESTAMP WITH TIME ZONE): 생성/수정 시간

**관계 정의**:
- `user_id` → `auth.users(id)` (ON DELETE CASCADE)

**인덱스**:
- `idx_user_personas_user_id`: 사용자별 페르소나 조회용
- `idx_user_personas_last_analyzed_at`: 분석 시간 기준 조회용

**RLS 정책 요약**:
- **SELECT**: 자신의 페르소나만 조회 가능 (`auth.uid() = user_id`)
- **INSERT**: 자신의 페르소나만 생성 가능 (`auth.uid() = user_id`)
- **UPDATE**: 자신의 페르소나만 수정 가능 (`auth.uid() = user_id`)
- **DELETE**: 자신의 페르소나만 삭제 가능 (`auth.uid() = user_id`)

**특수 기능**:
- 24시간 캐싱: `last_analyzed_at`을 기준으로 24시간 경과 시 재분석
- 사용자당 1개의 페르소나만 존재 (UNIQUE 제약)

---

## 5. 관계 요약

### 5.1 주요 관계 다이어그램

```
auth.users (Supabase Auth)
    ↓ (1:1)
users (프로필)
    ↓ (1:N)
user_books ←→ books (N:M)
    ↓ (1:N)
notes ←→ books (N:M)
    ↓ (1:N)
group_notes ←→ groups (N:M)

groups (독서모임)
    ↓ (1:N)
group_members ←→ users (N:M)
    ↓ (1:N)
group_books ←→ books (N:M)
    ↓ (1:N)
group_shared_books ←→ user_books (N:M)
```

### 5.2 관계 설명

1. **users ↔ auth.users**: 1:1 관계, `users.id`가 `auth.users.id`를 참조
2. **users ↔ user_books**: 1:N 관계, 한 사용자는 여러 책을 읽을 수 있음
3. **books ↔ user_books**: 1:N 관계, 한 책은 여러 사용자가 읽을 수 있음
4. **users ↔ notes**: 1:N 관계, 한 사용자는 여러 기록을 작성할 수 있음
5. **books ↔ notes**: 1:N 관계, 한 책에는 여러 기록이 있을 수 있음
6. **users ↔ groups**: N:M 관계 (group_members를 통해), 한 사용자는 여러 그룹에 가입 가능
7. **groups ↔ books**: N:M 관계 (group_books를 통해), 한 그룹은 여러 책을 읽을 수 있음
8. **user_books ↔ groups**: N:M 관계 (group_shared_books를 통해), 한 사용자 서재는 여러 그룹에 공유 가능
9. **notes ↔ groups**: N:M 관계 (group_notes를 통해), 한 기록은 여러 그룹에 공유 가능
10. **users ↔ ocr_usage_stats**: 1:1 관계, 한 사용자는 하나의 OCR 통계만 가짐
11. **users ↔ ocr_logs**: 1:N 관계, 한 사용자는 여러 OCR 로그를 가짐
12. **notes ↔ ocr_logs**: 1:N 관계, 한 기록은 여러 OCR 로그를 가질 수 있음 (NULL 허용)
13. **users ↔ chat_sessions**: 1:N 관계, 한 사용자는 여러 채팅 세션을 가질 수 있음
14. **chat_sessions ↔ chat_messages**: 1:N 관계, 한 세션은 여러 메시지를 가짐
15. **users ↔ user_personas**: 1:1 관계, 한 사용자는 하나의 페르소나만 가짐

### 5.3 CASCADE 규칙

- **users 삭제 시**: `user_books`, `notes`, `groups` (리더인 경우), `group_members`, `ocr_usage_stats`, `ocr_logs` CASCADE 삭제
- **books 삭제 시**: `user_books`, `notes`, `group_books` CASCADE 삭제
- **groups 삭제 시**: `group_members`, `group_books`, `group_notes`, `group_shared_books` CASCADE 삭제
- **user_books 삭제 시**: `group_shared_books` CASCADE 삭제
- **notes 삭제 시**: `group_notes` CASCADE 삭제, `ocr_logs`의 `note_id`는 SET NULL

---

## 6. 접근 제어 원칙

### 6.1 RLS 정책의 의도

모든 사용자 데이터는 **Row Level Security (RLS)**로 보호됩니다.  
RLS 정책은 데이터베이스 레벨에서 접근 제어를 강제하므로, 애플리케이션 레벨에서의 추가 검증은 선택 사항입니다.

### 6.2 소유자 판단 기준

모든 소유자 판단은 **`auth.uid()`** 기준으로 합니다:

- `auth.uid()`: 현재 인증된 사용자의 ID (Supabase Auth에서 제공)
- `users.id`: `auth.users(id)`를 참조하므로 `auth.uid()`와 동일

**중요**: 모든 사용자 관련 외래 키는 `auth.users(id)`를 참조합니다.

### 6.3 개인 데이터 접근 규칙

**개인 소유 데이터** (`users`, `user_books`, `notes`):
- 자신의 데이터만 조회/수정/삭제 가능
- 예외: `notes`는 `is_public = TRUE` 시 모든 사용자가 조회 가능
- 예외: 샘플 데이터(`is_sample = TRUE`)는 게스트 사용자용으로 모든 사용자가 조회 가능

### 6.4 그룹 접근 규칙

**그룹 데이터** (`groups`, `group_members`, `group_books`, `group_notes`, `group_shared_books`):
- **공개 그룹** (`is_public = TRUE`): 모든 사용자가 조회 가능
- **비공개 그룹**: 리더 및 승인된 멤버만 조회 가능
- **리더 권한**: 그룹 생성, 수정, 삭제, 멤버 관리, 책 추가

### 6.5 공개 데이터 접근 규칙

**공개 데이터** (`books`):
- RLS 없음, 모든 사용자가 조회 가능
- 수정/삭제는 애플리케이션 레벨에서 관리 (일반적으로 불가)

### 6.6 샘플 데이터 접근 규칙

**샘플 데이터** (`books.is_sample`, `notes.is_sample`):
- 게스트 사용자(비인증 사용자)를 위한 샘플 데이터
- 모든 사용자가 조회 가능
- 수정/삭제 불가 (애플리케이션 레벨에서 차단)

### 6.7 관리자 접근 규칙

**관리자 권한**:
- 관리자는 `cdhnaya@kakao.com` 이메일 주소로만 지정
- 관리자는 모든 사용자 데이터를 조회할 수 있음 (SELECT 권한)
- 관리자도 수정/삭제는 개인 데이터만 가능 (기존 RLS 정책 유지)
- 관리자용 RLS 정책은 `is_admin_user()` 함수를 통해 확인

**관리자 접근 가능한 데이터**:
- `users`: 모든 사용자 프로필 조회
- `user_books`: 모든 사용자의 독서 목록 조회
- `notes`: 모든 기록 조회
- `groups`: 모든 그룹 조회
- `group_members`: 모든 그룹 멤버십 조회
- `group_books`: 모든 그룹 책 조회
- `group_notes`: 모든 그룹 공유 기록 조회
- `group_shared_books`: 모든 그룹 공유 책 조회
- `transcriptions`: 모든 전사 데이터 조회

**보안 주의사항**:
- 관리자 이메일 주소는 하드코딩되어 있으며, 변경 시 마이그레이션 파일 수정 필요
- 관리자 권한은 조회(SELECT)만 허용되며, 수정/삭제는 개인 데이터만 가능

---

## 7. 변경 로그(Change Log)

### 2026-01-09 (서재 상하구조 개편)

- **변경 내용**: 서재 기능을 상하 구조로 개편
  - `bookshelves` 테이블 생성: 사용자의 서재 정보 관리
    - 메인 서재(`is_main = TRUE`): 통합 뷰 역할, 모든 하위 서재의 책을 통합 표시
    - 하위 서재: 개별 서재 관리, 사용자가 생성/수정/삭제 가능
  - `user_books` 테이블에 `bookshelf_id` 컬럼 추가: 책이 속한 서재 정보
- **영향받는 테이블**:
  - `bookshelves` (신규)
  - `user_books` (수정: `bookshelf_id` 컬럼 추가)
- **마이그레이션 파일**: `migration-202601091224__bookshelves__create_table.sql`
- **목적**: 여러 서재를 관리할 수 있도록 하고, 메인 서재는 통합 뷰로, 하위 서재는 개별 관리로 구분
- **향후 확장**: `bookshelf_shares` 테이블을 통한 서재별 공유 기능 예정

### 2025-01 (초기 스키마)

- **초기 스키마 생성**: 모든 테이블, ENUM 타입, 인덱스, RLS 정책 생성
- **주요 기능**:
  - 사용자 프로필 관리
  - 책 정보 관리
  - 독서 상태 관리
  - 기록 관리 (인용구, 메모, 사진, 전사)
  - 독서모임 기능
  - 샘플 데이터 지원 (게스트 사용자용)

### 2025-12-28 (RLS 정책 보완)

- **변경 내용**: 누락된 RLS 정책 추가
  - `users` 테이블에 DELETE 정책 추가
  - `group_members` 테이블에 DELETE 정책 추가
  - `group_books` 테이블에 UPDATE/DELETE 정책 추가
  - `group_notes` 테이블에 DELETE 정책 추가
- **영향받는 테이블**:
  - `users`
  - `group_members`
  - `group_books`
  - `group_notes`
- **마이그레이션 파일**: `migration-202512282221__rls__add_missing_policies.sql`
- **목적**: DB/RLS 규칙 완전 준수 (모든 테이블에 SELECT/INSERT/UPDATE/DELETE 정책 완비)

### 2025-12-31 (지정도서 및 공유 서재 기능 추가)

- **변경 내용**: 독서모임의 지정도서 및 공유 서재 기능 추가
  - `group_books` 테이블 SELECT 정책 수정: 멤버도 지정도서 조회 가능
  - `group_shared_books` 테이블 생성: 개인 서재를 모임에 공유하는 기능
    - `id`, `group_id`, `user_book_id`, `shared_at` 컬럼
    - UNIQUE 제약: `(group_id, user_book_id)`
  - RLS 정책 설정:
    - SELECT: 리더, 멤버, 또는 공개 그룹의 공유 서재 조회 가능
    - INSERT: 자신의 서재만 공유 가능, 모임 멤버만 공유 가능
    - DELETE: 자신이 공유한 서재만 공유 해제 가능
- **영향받는 테이블**:
  - `group_books` (RLS 정책 수정)
  - `group_shared_books` (신규)
- **마이그레이션 파일**:
  - `migration-202512311633__group_shared_books__create_table.sql`
  - `migration-202512311634__group_books__allow_member_view.sql`
- **목적**: 독서모임에서 지정도서와 개인 서재 공유 기능 통합 제공

### 2025-12-28 (약관 동의 기능 추가)

- **변경 내용**: 약관 동의 기능 추가
  - `users` 테이블에 약관 동의 관련 필드 추가
    - `terms_agreed`: 이용약관 동의 여부
    - `privacy_agreed`: 개인정보처리방침 동의 여부
    - `consent_date`: 약관 동의 일시
  - 약관 동의 페이지 생성 (`/onboarding/consent`)
  - 콜백 로직에 약관 동의 체크 추가
- **영향받는 테이블**:
  - `users`
- **마이그레이션 파일**: `migration-202512282233__users__add_consent_fields.sql`
- **목적**: 로그인 후 약관 동의 페이지를 통한 명시적 동의 수집

### 2025-01-02 (관리자 접근 제한 기능 추가)

- **변경 내용**: 관리자 페이지 접근 제한 및 관리자용 RLS 정책 추가
  - 관리자 권한 체크 함수 추가 (`app/actions/auth.ts`의 `isAdmin()`)
  - 관리자 페이지 접근 제한 (`app/(main)/admin/page.tsx`)
  - 사이드바 및 헤더에서 관리자 링크 조건부 표시
  - 관리자 액션들에 권한 체크 추가 (`app/actions/admin.ts`)
  - 관리자용 RLS 정책 추가: `is_admin_user()` 함수 생성
    - 관리자는 모든 사용자 데이터 조회 가능 (SELECT 권한)
    - 수정/삭제는 개인 데이터만 가능 (기존 RLS 정책 유지)
- **영향받는 테이블**:
  - `users` (관리자 SELECT 정책 추가)
  - `user_books` (관리자 SELECT 정책 추가)
  - `notes` (관리자 SELECT 정책 추가)
  - `groups` (관리자 SELECT 정책 추가)
  - `group_members` (관리자 SELECT 정책 추가)
  - `group_books` (관리자 SELECT 정책 추가)
  - `group_notes` (관리자 SELECT 정책 추가)
  - `group_shared_books` (관리자 SELECT 정책 추가)
  - `transcriptions` (관리자 SELECT 정책 추가)
- **마이그레이션 파일**: `migration-202501021500__admin__add_admin_rls_policies.sql`
- **목적**: 관리자(`cdhnaya@kakao.com`)만 관리자 페이지에 접근 가능하도록 제한하고, 전체 데이터 조회 권한 부여

### 2025-01-03 (OCR 사용 통계 및 로그 기능 추가)

- **변경 내용**: OCR 처리 횟수 기록을 위한 테이블 추가
  - `ocr_usage_stats` 테이블 생성: 사용자별 OCR 처리 통계 (성공/실패 횟수)
    - `user_id` (UUID, UNIQUE): 사용자 ID
    - `success_count` (INTEGER): 성공 횟수
    - `failure_count` (INTEGER): 실패 횟수
    - `last_processed_at` (TIMESTAMP): 마지막 처리 시간
  - `ocr_logs` 테이블 생성: 각 OCR 처리 요청의 상세 로그
    - `user_id` (UUID): 사용자 ID
    - `note_id` (UUID, NULL): 관련 기록 ID
    - `status` (ocr_log_status ENUM): 처리 상태 (success/failed)
    - `error_message` (TEXT, NULL): 실패 시 에러 메시지
    - `processing_duration_ms` (INTEGER, NULL): 처리 소요 시간
  - `ocr_log_status` ENUM 타입 추가: 'success', 'failed'
  - RLS 정책: 관리자만 조회 가능 (사용자는 자신의 통계/로그 조회 불가)
- **영향받는 테이블**:
  - `ocr_usage_stats` (신규)
  - `ocr_logs` (신규)
- **마이그레이션 파일**:
  - `migration-202501031200__ocr__add_usage_stats_and_logs.sql`
- **목적**: OCR 처리 횟수를 기록하여 유료화 정책 수립 및 사용량 제한을 위한 데이터 수집

### 2026-01-20 (AI 독서 도우미 기능 추가)

- **변경 내용**: AI 챗봇 및 페르소나 기능 추가
  - `chat_sessions` 테이블 생성: AI 채팅 세션 관리
    - `id`, `user_id`, `title`, `last_message_at`, `message_count`
  - `chat_messages` 테이블 생성: 채팅 메시지 저장
    - `id`, `session_id`, `role`, `content`, `context_books`, `context_notes`
  - `user_personas` 테이블 생성: 사용자 독서 페르소나 저장
    - `id`, `user_id`, `reading_pace`, `note_style`, `activity_pattern`, `group_engagement`
    - `reading_stats`, `category_preferences`, `persona_summary`, `last_analyzed_at`
  - `books` 테이블에 AI 메타데이터 컬럼 추가:
    - `table_of_contents`: 목차
    - `full_description`: 상세 설명
    - `keywords`: AI 키워드 배열
    - `author_info`: 저자 정보
- **영향받는 테이블**:
  - `chat_sessions` (신규)
  - `chat_messages` (신규)
  - `user_personas` (신규)
  - `books` (수정: AI 메타데이터 컬럼 추가)
- **마이그레이션 파일**:
  - `migration-202601201000__ai_chat__create_tables.sql`
  - `migration-202601201010__user_personas__create_table.sql`
  - `migration-202601201020__books__add_ai_metadata_columns.sql`
- **목적**: 사용자의 독서 기록을 분석하여 개인화된 AI 독서 도우미 제공

### 향후 변경 사항

변경 사항은 이 섹션에 기록됩니다:
- 날짜
- 변경 내용
- 영향받는 테이블
- 마이그레이션 파일명

### 2026-01-12 (도서 메타데이터 컬럼 추가)

- **변경 내용**: 기존 시스템에서 관리되던 메타데이터를 새로 추가
  - `books` 테이블에 메타데이터 컬럼 추가:
    - `category` (VARCHAR(100)): 도서 분류 (소설, 자기계발, 인문 등)
    - `total_pages` (INTEGER): 도서의 전체 페이지 수
    - `summary` (TEXT): 출판사 제공 또는 사용자가 기록한 책 소개
    - `external_link` (TEXT): 네이버 링크 (도서 검색 및 구매 페이지 연결용 URL)
  - `user_books` 테이블에 컬럼 추가:
    - `book_format` (VARCHAR(50)): 읽는 책 종류 (종이책, 전자책, 종이+전자 등 독서 매체)
  - 인덱스 추가:
    - `idx_books_category`: 분류별 필터링용
    - `idx_books_total_pages`: 페이지 수 범위 검색용
    - `idx_user_books_book_format`: 독서 매체별 필터링용
- **영향받는 테이블**:
  - `books`
  - `user_books`
- **마이그레이션 파일**: `migration-202601122226__books__add_metadata_columns.sql`
- **목적**: 기존 시스템의 메타데이터를 새 시스템에 통합 (기능 적용은 이후에 진행 예정)

### 2026-01-04 (기록 제목 추가)

- **변경 내용**: `notes` 테이블에 `title` 컬럼 추가
  - `title` (TEXT, NULL 허용)
  - 인덱스 추가: `idx_notes_title`
- **영향받는 테이블**:
  - `notes`
- **마이그레이션 파일**: `migration-202601041320__notes__add_title_column.sql`

---

**이 문서는 프로젝트의 데이터 모델 단일 기준 문서입니다. 모든 스키마 변경은 이 문서에 반영되어야 합니다.**

