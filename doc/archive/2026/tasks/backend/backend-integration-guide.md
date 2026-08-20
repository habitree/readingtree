# 백엔드 개발 작업 통합 가이드

**버전:** 1.0  
**작성일:** 2025년 1월  
**프로젝트:** Habitree Reading Hub  
**관련 문서:**
- [Habitree-Reading-Hub-PRD.md](../../Habitree-Reading-Hub-PRD.md)
- [software_design.md](../../software_design.md)
- [user_stories.md](../../user_stories.md)
- [프론트엔드 통합 가이드](../front/task-integration-guide.md)

---

## 목차

1. [작업 개요](#작업-개요)
2. [작업 순서 및 의존성](#작업-순서-및-의존성)
3. [작업 단위별 상세](#작업-단위별-상세)
4. [통합 가이드라인](#통합-가이드라인)
5. [공통 규칙](#공통-규칙)

---

## 작업 개요

백엔드 개발을 **9개의 독립적인 작업 단위**로 분리하여 병렬 개발이 가능하도록 구성했습니다. 각 작업은 명확한 인터페이스와 의존성을 가지며, 프론트엔드와 연동하여 최종 통합 시 충돌 없이 병합할 수 있습니다.

### 작업 단위 목록

| 순서 | 작업 ID | 작업명 | 우선순위 | 예상 소요 시간 | 의존성 |
|------|---------|--------|----------|---------------|--------|
| 0 | TASK-00 | 데이터베이스 스키마 설정 | P0 | 1일 | 없음 |
| 1 | TASK-01 | 인증 및 온보딩 백엔드 | P0 | 1일 | TASK-00 |
| 2 | TASK-02 | 책 관리 백엔드 | P0 | 1일 | TASK-00 |
| 3 | TASK-03 | 기록 관리 백엔드 | P0 | 2일 | TASK-00, TASK-02 |
| 4 | TASK-04 | 검색 백엔드 | P0 | 1일 | TASK-00, TASK-03 |
| 5 | TASK-05 | 공유 백엔드 | P0 | 1일 | TASK-00, TASK-03 |
| 6 | TASK-06 | 타임라인 및 통계 백엔드 | P0 | 1일 | TASK-00, TASK-03 |
| 7 | TASK-07 | 독서모임 백엔드 | P0 | 2일 | TASK-00, TASK-03 |
| 8 | TASK-08 | 프로필 관리 백엔드 | P1 | 1일 | TASK-00 |

---

## 작업 순서 및 의존성

### 의존성 다이어그램

```
TASK-00 (데이터베이스 스키마)
    ↓
    ├──→ TASK-01 (인증 및 온보딩)
    ├──→ TASK-02 (책 관리)
    ├──→ TASK-08 (프로필 관리)
    │
    ├──→ TASK-03 (기록 관리) ──┐
    │                            │
    ├──→ TASK-04 (검색) ────────┤
    ├──→ TASK-05 (공유) ────────┤
    ├──→ TASK-06 (타임라인) ────┤
    └──→ TASK-07 (독서모임) ────┘
```

### 병렬 작업 가능 구간

- **Phase 1**: TASK-00 (순차, 필수)
- **Phase 2**: TASK-01, TASK-02, TASK-08 (병렬 가능)
- **Phase 3**: TASK-03 (TASK-02 완료 후)
- **Phase 4**: TASK-04, TASK-05, TASK-06, TASK-07 (병렬 가능, TASK-03 완료 후)

---

## 작업 단위별 상세

### TASK-00: 데이터베이스 스키마 설정

**의존성:** 없음  
**다음 작업:** 모든 백엔드 작업

**작업 내용:**
- Supabase 프로젝트 준비
- ENUM 타입 생성 (reading_status, note_type, member_role, member_status)
- 테이블 생성 (users, books, user_books, notes, groups, group_members, group_books, group_notes)
- 인덱스 생성
- RLS (Row Level Security) 정책 설정
- 데이터베이스 함수 생성 (updated_at 자동 업데이트, 통계 함수)
- 트리거 생성 (사용자 프로필 자동 생성)
- Storage 버킷 생성 및 정책 설정

**출력물:**
- `doc/database/schema.sql` - 전체 스키마 SQL 파일
- `doc/database/README.md` - 스키마 적용 가이드

**상세 문서:** [00-bkend-database-schema-plan.md](./00-bkend-database-schema-plan.md)

---

### TASK-01: 인증 및 온보딩 백엔드

**의존성:** TASK-00  
**다음 작업:** 없음 (독립적)

**작업 내용:**
- `app/actions/auth.ts` 검증 및 개선
  - 카카오톡 OAuth 로그인
  - 구글 OAuth 로그인
  - 로그아웃
  - 현재 사용자 조회
- `app/actions/onboarding.ts` 검증 및 개선
  - 독서 목표 설정
  - 온보딩 완료 확인
- `app/callback/route.ts` 검증 및 개선
  - OAuth 콜백 처리
  - 사용자 프로필 자동 생성 확인
  - 온보딩 상태 확인 및 리다이렉트

**연동 페이지:**
- `app/(auth)/login/page.tsx`
- `app/(auth)/onboarding/goal/page.tsx`
- `app/(auth)/onboarding/tutorial/page.tsx`

**출력물:**
- 검증 및 개선된 `app/actions/auth.ts`
- 검증 및 개선된 `app/actions/onboarding.ts`
- 검증 및 개선된 `app/callback/route.ts`

**상세 문서:** [01-bkend-authentication-plan.md](./01-bkend-authentication-plan.md)

---

### TASK-02: 책 관리 백엔드

**의존성:** TASK-00  
**다음 작업:** TASK-03

**작업 내용:**
- `app/actions/books.ts` 검증 및 개선
  - 책 추가 (ISBN 중복 체크 및 재사용)
  - 독서 상태 변경
  - 사용자 책 목록 조회
  - 책 상세 조회
- `app/api/books/search/route.ts` 검증 및 개선
  - 네이버 검색 API 연동
  - 검색 결과 캐싱 (1시간)
  - 에러 처리
- `lib/api/naver.ts` 검증 및 개선
  - 네이버 검색 API 클라이언트
  - 응답 데이터 변환

**연동 페이지:**
- `app/(main)/books/page.tsx`
- `app/(main)/books/search/page.tsx`
- `app/(main)/books/[id]/page.tsx`

**출력물:**
- 검증 및 개선된 `app/actions/books.ts`
- 검증 및 개선된 `app/api/books/search/route.ts`
- 검증 및 개선된 `lib/api/naver.ts`

**상세 문서:** [02-bkend-book-management-plan.md](./02-bkend-book-management-plan.md)

---

### TASK-03: 기록 관리 백엔드

**의존성:** TASK-00, TASK-02  
**다음 작업:** TASK-04, TASK-05, TASK-06, TASK-07

**작업 내용:**
- `app/actions/notes.ts` 검증 및 개선
  - 기록 생성
  - 기록 수정
  - 기록 삭제 (이미지 파일 삭제 포함)
  - 기록 목록 조회
  - 기록 상세 조회
- `app/api/upload/route.ts` 검증 및 개선
  - 이미지 업로드 (Supabase Storage)
  - 파일 크기 제한 (5MB)
  - 자동 압축 (5MB 초과 시)
  - 파일 형식 검증
- `app/api/ocr/route.ts` 검증 및 개선
  - OCR 처리 요청 (비동기 Queue)
- `app/api/ocr/process/route.ts` 검증 및 개선
  - OCR 실제 처리 (Gemini API)
  - 결과 저장
- `lib/api/gemini.ts` 검증 및 개선
  - Gemini API 클라이언트
  - OCR 텍스트 추출

**연동 페이지:**
- `app/(main)/notes/page.tsx`
- `app/(main)/notes/new/page.tsx`
- `app/(main)/notes/[id]/page.tsx`
- `app/(main)/notes/[id]/edit/page.tsx`
- `app/(main)/books/[id]/page.tsx` (기록 목록)

**출력물:**
- 검증 및 개선된 `app/actions/notes.ts`
- 검증 및 개선된 `app/api/upload/route.ts`
- 검증 및 개선된 `app/api/ocr/route.ts`
- 검증 및 개선된 `app/api/ocr/process/route.ts`
- 검증 및 개선된 `lib/api/gemini.ts`

**상세 문서:** [03-bkend-notes-management-plan.md](./03-bkend-notes-management-plan.md)

---

### TASK-04: 검색 백엔드

**의존성:** TASK-00, TASK-03  
**다음 작업:** 없음

**작업 내용:**
- `app/api/search/route.ts` 검증 및 개선
  - 전체 텍스트 검색 (ILIKE 패턴 매칭, 한글 지원)
  - 책 제목 필터
  - 날짜 필터
  - 태그 필터
  - 기록 유형 필터
  - 페이지네이션
- `lib/utils/search.ts` 검증 및 개선
  - 검색어 하이라이트 유틸리티

**연동 페이지:**
- `app/(main)/search/page.tsx`

**출력물:**
- 검증 및 개선된 `app/api/search/route.ts`
- 검증 및 개선된 `lib/utils/search.ts`

**상세 문서:** [04-bkend-search-plan.md](./04-bkend-search-plan.md)

---

### TASK-05: 공유 백엔드

**의존성:** TASK-00, TASK-03  
**다음 작업:** 없음

**작업 내용:**
- `app/api/share/card/route.tsx` 검증 및 개선
  - 카드뉴스 이미지 생성 (@vercel/og)
  - 템플릿 선택
  - Edge Runtime 최적화
- `app/share/notes/[id]/page.tsx` 검증 및 개선
  - 공유된 기록 조회
  - Open Graph 메타 태그
  - Twitter Card 메타 태그
- `lib/templates/card-news-templates.ts` 검증 및 개선
  - 카드뉴스 템플릿 정의

**연동 페이지:**
- `components/share/card-news-generator.tsx`
- `components/share/share-buttons.tsx`
- `components/share/share-dialog.tsx`
- `app/share/notes/[id]/page.tsx`

**출력물:**
- 검증 및 개선된 `app/api/share/card/route.tsx`
- 검증 및 개선된 `app/share/notes/[id]/page.tsx`
- 검증 및 개선된 `lib/templates/card-news-templates.ts`

**상세 문서:** [05-bkend-share-plan.md](./05-bkend-share-plan.md)

---

### TASK-06: 타임라인 및 통계 백엔드

**의존성:** TASK-00, TASK-03  
**다음 작업:** 없음

**작업 내용:**
- `app/actions/stats.ts` 검증 및 개선
  - 타임라인 조회 (정렬 옵션, 페이지네이션)
  - 독서 통계 조회 (이번 주, 올해)
  - 목표 진행률 조회
  - 월별 기록 통계 조회
- 데이터베이스 함수 검증 및 개선
  - `get_user_completed_books_count` 함수
  - `get_user_notes_count_this_week` 함수

**연동 페이지:**
- `app/(main)/page.tsx` (대시보드)
- `app/(main)/timeline/page.tsx`
- `components/dashboard/dashboard-content.tsx`
- `components/timeline/timeline-content.tsx`

**출력물:**
- 검증 및 개선된 `app/actions/stats.ts`
- 검증 및 개선된 데이터베이스 함수

**상세 문서:** [06-bkend-timeline-stats-plan.md](./06-bkend-timeline-stats-plan.md)

---

### TASK-07: 독서모임 백엔드

**의존성:** TASK-00, TASK-03  
**다음 작업:** 없음

**작업 내용:**
- `app/actions/groups.ts` 검증 및 개선
  - 모임 생성
  - 모임 참여 신청 (공개/비공개 모임 처리)
  - 모임 참여 승인/거부 (리더 권한)
  - 모임 목록 조회
  - 공개 모임 목록 조회
  - 모임 상세 조회
  - 구성원 진행 상황 조회
  - 모임 내 기록 공유

**연동 페이지:**
- `app/(main)/groups/page.tsx`
- `app/(main)/groups/new/page.tsx`
- `app/(main)/groups/[id]/page.tsx`
- `components/groups/group-dashboard.tsx`
- `components/groups/member-list.tsx`
- `components/groups/shared-notes-list.tsx`

**출력물:**
- 검증 및 개선된 `app/actions/groups.ts`

**상세 문서:** [07-bkend-groups-plan.md](./07-bkend-groups-plan.md)

---

### TASK-08: 프로필 관리 백엔드

**의존성:** TASK-00  
**다음 작업:** 없음

**작업 내용:**
- `app/actions/profile.ts` 검증 및 개선
  - 프로필 조회
  - 프로필 수정
  - 프로필 이미지 업로드 (Supabase Storage)
  - 이미지 압축 및 최적화

**연동 페이지:**
- `app/(main)/profile/page.tsx`
- `components/profile/profile-form.tsx`
- `components/profile/profile-content.tsx`

**출력물:**
- 검증 및 개선된 `app/actions/profile.ts`

**상세 문서:** [08-bkend-profile-plan.md](./08-bkend-profile-plan.md)

---

## 통합 가이드라인

### 1. 브랜치 전략

각 작업은 별도의 feature 브랜치에서 진행:

```
main
├── feature/bkend-00-database-schema
├── feature/bkend-01-authentication
├── feature/bkend-02-book-management
├── feature/bkend-03-notes-management
├── feature/bkend-04-search
├── feature/bkend-05-share
├── feature/bkend-06-timeline-stats
├── feature/bkend-07-groups
└── feature/bkend-08-profile
```

### 2. 병합 순서

1. **Phase 1**: TASK-00 → main (필수)
2. **Phase 2**: TASK-01, TASK-02, TASK-08 → main (병렬 병합 가능)
3. **Phase 3**: TASK-03 → main
4. **Phase 4**: TASK-04, TASK-05, TASK-06, TASK-07 → main (병렬 병합 가능)

### 3. 충돌 방지 규칙

- **파일 경로 분리**: 각 작업은 명확히 분리된 파일에 집중
- **공통 파일 수정 금지**: 다른 작업과 공유하는 파일은 신중하게 수정
- **타입 정의**: `types/` 폴더의 타입은 확장만 가능, 삭제 금지
- **API 인터페이스**: 각 작업의 API는 명확한 인터페이스로 정의

### 4. 프론트엔드 연동 확인

각 작업 완료 후:
- 해당 프론트엔드 페이지에서 기능 테스트
- API 호출 및 응답 확인
- 에러 처리 확인
- 로딩 상태 확인

---

## 공통 규칙

### 1. 코딩 컨벤션

- **언어**: TypeScript (strict mode)
- **스타일**: ESLint + Prettier
- **Server Actions**: `'use server'` 디렉티브 필수
- **API Routes**: Next.js API Routes 표준 준수
- **에러 처리**: 명확한 에러 메시지 및 상태 코드

### 2. 파일 명명 규칙

- **Server Actions**: `app/actions/{name}.ts`
- **API Routes**: `app/api/{path}/route.ts` 또는 `route.tsx`
- **API 클라이언트**: `lib/api/{name}.ts`
- **유틸리티**: `lib/utils/{name}.ts`

### 3. 보안 규칙

- **인증 확인**: 모든 Server Actions 및 API Routes에서 사용자 인증 확인
- **권한 확인**: RLS 정책과 함께 서버 사이드 권한 확인
- **입력 검증**: Zod 스키마를 사용한 입력 데이터 검증
- **에러 메시지**: 민감한 정보 노출 방지

### 4. 성능 최적화

- **캐싱**: 적절한 캐싱 전략 적용 (Next.js cache, Supabase cache)
- **페이지네이션**: 대량 데이터 조회 시 페이지네이션 필수
- **인덱스**: 데이터베이스 쿼리 최적화를 위한 인덱스 활용
- **이미지 최적화**: 이미지 업로드 시 자동 압축 및 최적화

### 5. 문서화

각 작업 완료 후:
- 주요 함수에 JSDoc 주석 추가
- 복잡한 로직은 인라인 주석 추가
- API 응답 형식 문서화
- 에러 케이스 문서화

---

## 다음 단계

각 작업을 시작하기 전에 해당 작업의 상세 계획 문서를 반드시 확인하세요:

1. [TASK-00: 데이터베이스 스키마 설정](./00-bkend-database-schema-plan.md)
2. [TASK-01: 인증 및 온보딩 백엔드](./01-bkend-authentication-plan.md)
3. [TASK-02: 책 관리 백엔드](./02-bkend-book-management-plan.md)
4. [TASK-03: 기록 관리 백엔드](./03-bkend-notes-management-plan.md)
5. [TASK-04: 검색 백엔드](./04-bkend-search-plan.md)
6. [TASK-05: 공유 백엔드](./05-bkend-share-plan.md)
7. [TASK-06: 타임라인 및 통계 백엔드](./06-bkend-timeline-stats-plan.md)
8. [TASK-07: 독서모임 백엔드](./07-bkend-groups-plan.md)
9. [TASK-08: 프로필 관리 백엔드](./08-bkend-profile-plan.md)

---

**문서 끝**

