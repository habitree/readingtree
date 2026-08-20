# TASK-08: 프로필 관리 백엔드

**작업 ID:** TASK-08  
**우선순위:** P1 (Should Have)  
**예상 소요 시간:** 1일  
**의존성:** TASK-00  
**다음 작업:** 없음

---

## 작업 개요

프로필 관리 관련 Server Actions를 검증하고 개선합니다. 프로필 조회, 수정, 이미지 업로드를 포함합니다.

---

## 작업 범위

### 포함 사항
- ✅ `app/actions/profile.ts` 검증 및 개선
- ✅ 프론트엔드 연동 확인

### 제외 사항
- ❌ 프론트엔드 프로필 UI (이미 구현됨)

---

## 상세 작업 목록

### 1. 프로필 관리 Server Actions 검증 및 개선

**파일:** `app/actions/profile.ts`

**기능:**
- `getProfile()`: 프로필 조회
- `updateProfile()`: 프로필 수정
- `updateProfileImage()`: 프로필 이미지 업로드

**확인 사항:**
- 프로필 조회 권한 확인
- 프로필 수정 권한 확인
- 이미지 업로드 및 압축 확인
- 기존 이미지 삭제 확인

---

## 프론트엔드 연동 확인

### 연동 페이지
- `app/(main)/profile/page.tsx`
  - `getProfile()` 호출
  - `updateProfile()` 호출
  - `updateProfileImage()` 호출

### 연동 컴포넌트
- `components/profile/profile-form.tsx`
  - 프로필 수정 폼
- `components/profile/profile-content.tsx`
  - 프로필 표시

---

## 개발 프롬프트

```
@doc/software_design.md (4.2.1 섹션) @doc/tasks/front/10-task-profile-plan.md 참고하여 
프로필 관리 백엔드를 검증하고 개선해주세요.

작업 내용:
1. app/actions/profile.ts 파일 검증 및 개선:
   - getProfile() 함수의 권한 확인 확인
   - updateProfile() 함수의 유효성 검사 확인 (이름 1-100자, 목표 1-100)
   - updateProfileImage() 함수의 파일 형식 검증 확인
   - 이미지 압축 로직 확인 (sharp 사용)
   - 기존 이미지 삭제 확인 (Storage에서도 삭제)
   - Storage 업로드 경로 확인 (avatars/${userId}/${fileName})

2. 프론트엔드 연동 확인:
   - 프로필 페이지에서 Server Actions 호출 확인
   - 프로필 수정 폼 확인
   - 프로필 이미지 업로드 확인
   - 에러 처리 및 로딩 상태 확인
```

---

## 참고 문서

### 필수 참고 문서
- `doc/software_design.md` (4.2.1 섹션)
  - Users 테이블 스키마
- `doc/tasks/front/10-task-profile-plan.md`
  - 프론트엔드 프로필 관리 구현 상세

### 관련 프론트엔드 파일
- `app/(main)/profile/page.tsx`
- `components/profile/profile-form.tsx`
- `components/profile/profile-content.tsx`

---

## 검증 체크리스트

### 프로필 관리 기능
- [x] 프로필 조회가 정상 작동하는지 확인
  - ✅ getProfile() 함수로 프로필 조회
  - ✅ 인증 확인 (auth.uid() === user.id)
  - ✅ users 테이블에서 프로필 조회
  - ✅ RLS 정책 준수 (본인 프로필만 조회 가능)
  - ✅ 에러 처리 및 명확한 에러 메시지
- [x] 프로필 수정이 정상 작동하는지 확인
  - ✅ updateProfile() 함수로 프로필 수정
  - ✅ 인증 확인
  - ✅ 이름 유효성 검사 (1-100자)
  - ✅ 독서 목표 유효성 검사 (1-100)
  - ✅ 이름 trim 처리
  - ✅ users 테이블 업데이트
  - ✅ revalidatePath로 캐시 무효화
- [x] 프로필 이미지 업로드가 정상 작동하는지 확인
  - ✅ updateProfileImage() 함수로 이미지 업로드
  - ✅ 인증 확인
  - ✅ 파일 형식 검증 (jpg, png, webp)
  - ✅ 파일 크기 검증 (최대 2MB)
  - ✅ Supabase Storage에 업로드
  - ✅ 업로드 경로: avatars/${userId}/${fileName}
  - ✅ 공개 URL 생성 및 프로필에 저장
  - ✅ 업로드 실패 시 에러 처리
  - ✅ DB 업데이트 실패 시 파일 삭제 (롤백)
- [x] 이미지 압축 확인
  - ✅ sharp 라이브러리 사용
  - ✅ 1.6MB 이상 파일 자동 압축
  - ✅ 400x400px로 리사이즈 (cover, withoutEnlargement)
  - ✅ JPEG 품질 85%로 압축
  - ✅ 압축 실패 시 원본 파일로 업로드 시도
- [x] 기존 이미지 삭제 확인
  - ✅ 업로드 전 기존 프로필 이미지 확인
  - ✅ Storage URL에서 경로 추출
  - ✅ Supabase Storage에서 기존 이미지 삭제
  - ✅ 삭제 실패는 무시 (파일이 없을 수 있음)
- [x] 유효성 검사 확인
  - ✅ 이름: 1-100자 (trim 후 검증)
  - ✅ 독서 목표: 1-100 사이의 숫자
  - ✅ 파일 형식: jpg, png, webp만 허용
  - ✅ 파일 크기: 최대 2MB
  - ✅ 명확한 에러 메시지 제공

### 보안 및 안전성
- [x] RLS 정책 준수 확인
  - ✅ users 테이블: 본인 프로필만 조회/수정 가능
  - ✅ 모든 쿼리에서 user_id 필터링
  - ✅ 인증 확인 로직 구현
- [x] 파일 업로드 보안 확인
  - ✅ 파일 형식 검증
  - ✅ 파일 크기 제한
  - ✅ 안전한 파일명 생성 (timestamp + random)
  - ✅ 사용자별 디렉토리 분리 (avatars/${userId}/)

### 에러 처리
- [x] 프로필 관리 에러 시 적절한 에러 메시지 표시
  - ✅ 인증 실패: "로그인이 필요합니다."
  - ✅ 프로필 없음: "프로필을 찾을 수 없습니다."
  - ✅ 유효성 검사 실패: 명확한 범위 안내
  - ✅ 파일 형식 오류: "지원하지 않는 파일 형식입니다."
  - ✅ 파일 크기 초과: "파일 크기는 2MB 이하여야 합니다."
  - ✅ 업로드 실패: "업로드 실패: {에러 메시지}"
  - ✅ DB 업데이트 실패: "프로필 업데이트 실패: {에러 메시지}"
- [x] 예외 상황 처리 확인
  - ✅ try-catch로 에러 처리
  - ✅ 업로드 성공 후 DB 업데이트 실패 시 파일 삭제 (롤백)
  - ✅ 압축 실패 시 원본 파일로 업로드 시도
  - ✅ 기존 이미지 삭제 실패는 무시
  - ✅ revalidatePath로 캐시 무효화

### 프론트엔드 연동
- [x] 프로필 페이지에서 Server Actions 호출 확인
  - ✅ app/(main)/profile/page.tsx에서 ProfileContent 컴포넌트 사용
  - ✅ components/profile/profile-content.tsx에서 getProfile() 호출
  - ✅ Suspense로 로딩 상태 처리
  - ✅ 에러 처리 및 에러 메시지 표시
- [x] 프로필 수정 폼 확인
  - ✅ components/profile/profile-form.tsx에서 updateProfile() 호출
  - ✅ 이름, 독서 목표 입력 필드
  - ✅ 유효성 검사 (maxLength, min/max)
  - ✅ 폼 제출 시 updateProfile() 호출
  - ✅ 성공 시 router.refresh()로 페이지 새로고침
  - ✅ toast로 성공/실패 메시지 표시
- [x] 프로필 이미지 업로드 확인
  - ✅ components/profile/profile-form.tsx에서 updateProfileImage() 호출
  - ✅ 파일 입력 필드 (accept 속성으로 형식 제한)
  - ✅ 클라이언트 사이드 파일 검증 (형식, 크기)
  - ✅ 업로드 중 로딩 상태 표시
  - ✅ 성공 시 avatarUrl 업데이트
  - ✅ 성공 시 router.refresh()로 페이지 새로고침
  - ✅ toast로 성공/실패 메시지 표시
- [x] 에러 처리 및 로딩 상태 확인
  - ✅ isSubmitting, isUploading 상태 관리
  - ✅ Loader2 컴포넌트로 로딩 표시
  - ✅ Skeleton 컴포넌트로 초기 로딩 표시
  - ✅ toast로 에러 메시지 표시
  - ✅ try-catch로 에러 처리

### 개선 사항
- ✅ 기존 이미지 삭제 로직 개선
  - URL에서 경로 추출 로직 개선
  - 삭제 실패는 무시하도록 처리
- ✅ 이미지 압축 로직 확인
  - sharp 라이브러리 사용
  - 1.6MB 이상 파일 자동 압축
  - 압축 실패 시 원본 파일로 업로드
- ✅ 롤백 로직 구현
  - DB 업데이트 실패 시 업로드된 파일 삭제
- ✅ 유효성 검사 강화
  - 이름 trim 처리
  - 명확한 범위 안내

---

**문서 끝**

