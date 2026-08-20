# TASK-07: 독서모임 백엔드

**작업 ID:** TASK-07  
**우선순위:** P0 (Must Have)  
**예상 소요 시간:** 2일  
**의존성:** TASK-00, TASK-03  
**다음 작업:** 없음

---

## 작업 개요

독서모임 관련 Server Actions를 검증하고 개선합니다. 모임 생성, 참여, 멤버 관리, 기록 공유를 포함합니다.

---

## 작업 범위

### 포함 사항
- ✅ `app/actions/groups.ts` 검증 및 개선
- ✅ 프론트엔드 연동 확인

### 제외 사항
- ❌ 프론트엔드 모임 UI (이미 구현됨)

---

## 상세 작업 목록

### 1. 모임 관리 Server Actions 검증 및 개선

**파일:** `app/actions/groups.ts`

**기능:**
- `createGroup()`: 모임 생성
- `joinGroup()`: 모임 참여 신청 (공개/비공개 모임 처리)
- `approveMember()`: 모임 참여 승인 (리더 권한)
- `rejectMember()`: 모임 참여 거부 (리더 권한)
- `getGroups()`: 모임 목록 조회
- `getPublicGroups()`: 공개 모임 목록 조회
- `getGroupDetail()`: 모임 상세 조회
- `getMemberProgress()`: 구성원 진행 상황 조회
- `shareNoteToGroup()`: 모임 내 기록 공유

**확인 사항:**
- 리더 권한 확인 로직 확인
- 공개/비공개 모임 처리 확인
- RLS 정책 준수 확인
- JOIN 쿼리 확인

---

## 프론트엔드 연동 확인

### 연동 페이지
- `app/(main)/groups/page.tsx`
  - `getGroups()`, `getPublicGroups()` 호출
- `app/(main)/groups/new/page.tsx`
  - `createGroup()` 호출
- `app/(main)/groups/[id]/page.tsx`
  - `getGroupDetail()` 호출
  - `joinGroup()` 호출
  - `approveMember()`, `rejectMember()` 호출
  - `shareNoteToGroup()` 호출

### 연동 컴포넌트
- `components/groups/group-dashboard.tsx`
  - 모임 대시보드
- `components/groups/member-list.tsx`
  - 멤버 관리
- `components/groups/shared-notes-list.tsx`
  - 공유 기록 목록

---

## 개발 프롬프트

```
@doc/software_design.md (4.2.5-4.2.8 섹션) @doc/tasks/front/09-task-groups-plan.md 참고하여 
독서모임 백엔드를 검증하고 개선해주세요.

작업 내용:
1. app/actions/groups.ts 파일 검증 및 개선:
   - createGroup() 함수의 리더 자동 추가 확인
   - joinGroup() 함수의 공개/비공개 모임 처리 확인
   - approveMember(), rejectMember() 함수의 리더 권한 확인
   - getGroups() 함수의 JOIN 쿼리 확인
   - getPublicGroups() 함수의 공개 모임 필터 확인
   - getGroupDetail() 함수의 멤버십 확인 확인
   - getMemberProgress() 함수의 리더 권한 확인
   - shareNoteToGroup() 함수의 기록 소유 및 멤버십 확인 확인
   - RLS 정책 준수 확인

2. 프론트엔드 연동 확인:
   - 모임 목록 페이지에서 Server Actions 호출 확인
   - 모임 생성 페이지에서 createGroup() 호출 확인
   - 모임 상세 페이지에서 Server Actions 호출 확인
   - 멤버 관리 기능 확인
   - 기록 공유 기능 확인
   - 에러 처리 및 로딩 상태 확인
```

---

## 참고 문서

### 필수 참고 문서
- `doc/software_design.md` (4.2.5-4.2.8 섹션)
  - Groups, GroupMembers, GroupBooks, GroupNotes 테이블 스키마
- `doc/tasks/front/09-task-groups-plan.md`
  - 프론트엔드 독서모임 구현 상세

### 관련 프론트엔드 파일
- `app/(main)/groups/page.tsx`
- `app/(main)/groups/new/page.tsx`
- `app/(main)/groups/[id]/page.tsx`
- `components/groups/group-dashboard.tsx`
- `components/groups/member-list.tsx`

---

## 검증 체크리스트

### 모임 관리 기능
- [x] 모임 생성이 정상 작동하는지 확인
  - ✅ createGroup() 함수로 모임 생성
  - ✅ 생성자를 리더로 자동 추가 (role: "leader", status: "approved")
  - ✅ 모임 생성 실패 시 롤백 처리
  - ✅ 멤버 추가 실패 시 모임 삭제
- [x] 모임 참여 신청이 정상 작동하는지 확인
  - ✅ joinGroup() 함수로 모임 참여 신청
  - ✅ 이미 멤버인지 확인 (중복 참여 방지)
  - ✅ 대기 중인 신청 확인
  - ✅ 에러 처리 및 revalidatePath 호출
- [x] 공개 모임 자동 승인 확인
  - ✅ 공개 모임(is_public = true) 참여 시 status: "approved" 자동 설정
  - ✅ autoApproved 플래그 반환
- [x] 비공개 모임 대기 확인
  - ✅ 비공개 모임(is_public = false) 참여 시 status: "pending" 설정
  - ✅ 리더 승인 필요
- [x] 모임 참여 승인/거부가 정상 작동하는지 확인
  - ✅ approveMember() 함수로 멤버 승인
  - ✅ rejectMember() 함수로 멤버 거부 (삭제)
  - ✅ 리더 권한 확인 (leader_id === user.id)
  - ✅ 에러 처리 및 revalidatePath 호출
- [x] 리더 권한 확인 확인
  - ✅ approveMember(), rejectMember()에서 리더 권한 확인
  - ✅ getMemberProgress()에서 리더 권한 확인
  - ✅ 리더가 아닌 경우 명확한 에러 메시지 반환

### 모임 조회 기능
- [x] 모임 목록 조회가 정상 작동하는지 확인
  - ✅ getGroups() 함수로 모임 목록 조회
  - ✅ JOIN 쿼리로 group_members 정보 조회
  - ✅ 사용자가 승인된 멤버인 모임만 조회
  - ✅ isPublic 파라미터로 필터링 지원
- [x] 공개 모임 목록 조회가 정상 작동하는지 확인
  - ✅ getPublicGroups() 함수로 공개 모임 목록 조회
  - ✅ is_public = true 필터 적용
  - ✅ JOIN 쿼리로 리더 정보 조회
  - ✅ 검색 쿼리 지원 (name, description ILIKE)
  - ✅ created_at DESC 정렬
- [x] 모임 상세 조회가 정상 작동하는지 확인
  - ✅ getGroupDetail() 함수로 모임 상세 조회
  - ✅ JOIN 쿼리로 리더 정보 조회
  - ✅ 멤버 목록 조회 (승인된 멤버만)
  - ✅ 현재 사용자의 멤버십 확인
  - ✅ 공유된 기록 목록 조회 (최근 20개)
  - ✅ isLeader 플래그 반환
- [x] 구성원 진행 상황 조회가 정상 작동하는지 확인
  - ✅ getMemberProgress() 함수로 진행 상황 조회
  - ✅ 리더 권한 확인
  - ✅ 승인된 멤버 목록 조회
  - ✅ 각 멤버의 완독한 책 수, 기록 수, 최근 활동 일자 조회
  - ✅ Promise.all()로 병렬 처리

### 기록 공유 기능
- [x] 모임 내 기록 공유가 정상 작동하는지 확인
  - ✅ shareNoteToGroup() 함수로 기록 공유
  - ✅ 기록 소유자 확인 (note.user_id === user.id)
  - ✅ 모임 멤버십 확인 (status: "approved")
  - ✅ 중복 공유 방지 (이미 공유된 기록 확인)
  - ✅ group_notes 테이블에 삽입
  - ✅ 에러 처리 및 revalidatePath 호출
- [x] 기록 소유 확인 확인
  - ✅ notes 테이블에서 user_id 조회
  - ✅ 본인의 기록만 공유 가능
  - ✅ 소유자가 아닌 경우 명확한 에러 메시지 반환
- [x] 멤버십 확인 확인
  - ✅ group_members 테이블에서 멤버십 확인
  - ✅ status: "approved"인 멤버만 공유 가능
  - ✅ 멤버가 아닌 경우 명확한 에러 메시지 반환

### 보안 및 안전성
- [x] RLS 정책 준수 확인
  - ✅ groups 테이블: 공개 모임 또는 멤버만 조회 가능
  - ✅ group_members 테이블: 멤버만 조회 가능, 리더만 관리 가능
  - ✅ group_notes 테이블: 멤버만 조회 가능, 기록 소유자만 공유 가능
  - ✅ 모든 쿼리에서 user_id 필터링
  - ✅ 리더 권한 확인 로직 구현

### 에러 처리
- [x] 모임 관리 에러 시 적절한 에러 메시지 표시
  - ✅ 인증 실패: "로그인이 필요합니다."
  - ✅ 모임 없음: "모임을 찾을 수 없습니다."
  - ✅ 리더 권한 없음: "리더만 ~할 수 있습니다."
  - ✅ 이미 멤버: "이미 모임 멤버입니다."
  - ✅ 대기 중: "이미 참여 신청이 대기 중입니다."
  - ✅ 기록 소유 아님: "본인의 기록만 공유할 수 있습니다."
  - ✅ 멤버 아님: "모임 멤버만 기록을 공유할 수 있습니다."
  - ✅ 이미 공유됨: "이미 공유된 기록입니다."
- [x] 예외 상황 처리 확인
  - ✅ try-catch로 에러 처리
  - ✅ 데이터베이스 에러 메시지 반환
  - ✅ revalidatePath로 캐시 무효화
  - ✅ 모임 생성 실패 시 롤백 처리

### 프론트엔드 연동
- [x] 모임 목록 페이지에서 Server Actions 호출 확인
  - ✅ app/(main)/groups/page.tsx에서 GroupsContent 컴포넌트 사용
  - ✅ components/groups/groups-content.tsx에서 getGroups(), getPublicGroups() 호출
  - ✅ Suspense로 로딩 상태 처리
- [x] 모임 생성 페이지에서 Server Actions 호출 확인
  - ✅ app/(main)/groups/new/page.tsx에서 createGroup() 호출
  - ✅ 폼 제출 시 createGroup() 호출
  - ✅ 성공 시 모임 상세 페이지로 이동
  - ✅ toast로 성공/실패 메시지 표시
  - ✅ 로딩 상태 관리 (isSubmitting)
- [x] 모임 상세 페이지에서 Server Actions 호출 확인
  - ✅ app/(main)/groups/[id]/page.tsx에서 getGroupDetail() 호출
  - ✅ components/groups/group-dashboard.tsx에서 모임 정보 표시
  - ✅ joinGroup(), approveMember(), rejectMember() 호출
  - ✅ shareNoteToGroup() 호출
  - ✅ Suspense로 로딩 상태 처리
  - ✅ 에러 시 notFound() 호출
- [x] 에러 처리 및 로딩 상태 확인
  - ✅ toast로 에러 메시지 표시
  - ✅ Loader2 컴포넌트로 로딩 표시
  - ✅ Skeleton 컴포넌트로 로딩 상태 표시
  - ✅ try-catch로 에러 처리

### 개선 사항
- ✅ 모든 함수에서 명확한 에러 메시지 제공
- ✅ RLS 정책 준수 확인
- ✅ 리더 권한 확인 로직 일관성 유지
- ✅ revalidatePath로 캐시 무효화
- ✅ JOIN 쿼리 최적화
- ✅ 중복 참여/공유 방지 로직 구현

---

**문서 끝**

