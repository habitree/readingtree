# TASK-09: 독서모임 기능

**작업 ID:** TASK-09  
**우선순위:** P0 (Must Have)  
**예상 소요 시간:** 3일  
**의존성:** TASK-01, TASK-02, TASK-03, TASK-05  
**다음 작업:** 없음

---

## 작업 개요

독서모임 생성, 참여, 관리, 대시보드, 기록 공유 기능을 구현합니다.

---

## 작업 범위

### 포함 사항
- ✅ 모임 생성
- ✅ 모임 참여 신청
- ✅ 모임 참여 승인/거부
- ✅ 모임 대시보드
- ✅ 구성원 진행 상황
- ✅ 모임 내 기록 공유

### 제외 사항
- ❌ 기록 작성/수정 (TASK-05)
- ❌ 프로필 관리 (TASK-10)

---

## 상세 작업 목록

### 1. 모임 목록 페이지

**파일:**
- `app/(main)/groups/page.tsx` - 모임 목록

**기능:**
- 모임 목록 표시
- 공개 모임 검색
- 모임 생성 버튼

### 2. 모임 생성 페이지

**파일:**
- `app/(main)/groups/new/page.tsx` - 모임 생성

**기능:**
- 모임 이름, 설명 입력
- 공개/비공개 설정
- 모임 생성

### 3. 모임 대시보드 페이지

**파일:**
- `app/(main)/groups/[id]/page.tsx` - 모임 대시보드

**기능:**
- 모임 정보 표시
- 구성원 목록
- 현재 읽는 책
- 최근 활동
- 공유된 기록 목록

### 4. 모임 관련 컴포넌트

**파일:**
- `components/groups/group-card.tsx` - 모임 카드
- `components/groups/group-dashboard.tsx` - 모임 대시보드
- `components/groups/member-list.tsx` - 구성원 목록

### 5. Server Actions

**파일:**
- `app/actions/groups.ts` - 모임 관련 Server Actions

**기능:**
- 모임 생성
- 모임 참여 신청
- 모임 참여 승인/거부
- 모임 조회
- 구성원 진행 상황 조회
- 모임 내 기록 공유

### 6. API 클라이언트 및 Hooks

**파일:**
- `lib/api/groups.ts` - 모임 API 클라이언트
- `hooks/use-groups.ts` - 모임 관련 커스텀 훅

---

## 파일 구조

```
app/
└── (main)/
    └── groups/
        ├── page.tsx              # 모임 목록
        ├── new/
        │   └── page.tsx          # 모임 생성
        └── [id]/
            └── page.tsx          # 모임 대시보드

components/
└── groups/
    ├── group-card.tsx
    ├── group-dashboard.tsx
    └── member-list.tsx

lib/
└── api/
    └── groups.ts

hooks/
└── use-groups.ts

app/
└── actions/
    └── groups.ts
```

---

## API 인터페이스

### Server Actions

```typescript
// app/actions/groups.ts
export async function createGroup(data: {
  name: string;
  description?: string;
  isPublic: boolean;
}) {
  // 모임 생성
}

export async function joinGroup(groupId: string) {
  // 모임 참여 신청
}

export async function approveMember(groupId: string, userId: string) {
  // 모임 참여 승인
}

export async function rejectMember(groupId: string, userId: string) {
  // 모임 참여 거부
}

export async function getGroups(isPublic?: boolean) {
  // 모임 목록 조회
}

export async function getGroupDetail(groupId: string) {
  // 모임 상세 조회
}

export async function getMemberProgress(groupId: string) {
  // 구성원 진행 상황 조회
}

export async function shareNoteToGroup(noteId: string, groupId: string) {
  // 모임 내 기록 공유
}
```

---

## 사용자 스토리 매핑

- US-033: 독서모임 생성
- US-034: 독서모임 참여 신청
- US-035: 모임 참여 승인/거부
- US-036: 모임 대시보드
- US-037: 구성원 진행 상황 확인
- US-038: 모임 내 기록 공유

---

## 검증 체크리스트

- [x] 모임 생성이 정상 작동함
- [x] 모임 참여 신청이 정상 작동함
- [x] 모임 참여 승인/거부가 정상 작동함
- [x] 모임 대시보드가 정상 작동함
- [x] 구성원 진행 상황이 정상 표시됨
- [x] 모임 내 기록 공유가 정상 작동함
- [x] 공개 모임 검색이 정상 작동함

---

## 개발 프롬프트

```
다음 문서들을 참고하여 독서모임 기능을 구현해주세요.

참고 문서:
- doc/user_stories.md (US-033~US-038)
- doc/software_design.md (4.2.5 Groups, 4.2.6 GroupMembers, 4.2.8 GroupNotes)
- doc/Habitree-Reading-Hub-PRD.md (4.1.7 독서모임 기능)

작업 내용:
1. 모임 목록 페이지 구현:
   - 모임 목록 표시
   - 공개 모임 검색
   - 모임 생성 버튼
2. 모임 생성 페이지 구현
3. 모임 대시보드 페이지 구현:
   - 모임 정보
   - 구성원 목록
   - 현재 읽는 책
   - 최근 활동
   - 공유된 기록 목록
4. 모임 관련 컴포넌트 구현
5. Server Actions 구현:
   - 모임 생성 (리더 자동 추가)
   - 모임 참여 신청 (공개 모임은 자동 승인)
   - 모임 참여 승인/거부 (리더만)
   - 구성원 진행 상황 조회
   - 모임 내 기록 공유
6. API 클라이언트 및 Hooks 구현

주의사항:
- 모임 생성자는 자동으로 리더가 됨
- 공개 모임은 자동 승인, 비공개 모임은 리더 승인 필요
- RLS 정책 확인 (software_design.md 참고)
- 모임 내 기록 공유는 GroupNotes 테이블 사용
- 구성원 진행 상황은 UserBooks와 Notes 조인 쿼리

완료 후:
- 각 함수에 JSDoc 주석 추가
- 에러 처리 로직 추가
- 로딩 상태 처리
```

---

## 참고 문서

### 필수 참고
- [user_stories.md](../../user_stories.md) - US-033~US-038
- [software_design.md](../../software_design.md) - 4.2.5~4.2.8 Groups 관련 테이블
- [Habitree-Reading-Hub-PRD.md](../../Habitree-Reading-Hub-PRD.md) - 4.1.7 독서모임 기능

### 추가 참고
- [Supabase RLS 문서](https://supabase.com/docs/guides/auth/row-level-security)

---

**문서 끝**

