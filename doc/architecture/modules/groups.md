# Groups Module (모임)

> **Module Key**: `groups`
> **Layer**: A. 도메인 모듈
> **Last Updated**: 2025-01-25

---

## 1. 개요

독서 모임 생성, 멤버 관리, 그룹 내 책/기록 공유를 담당하는 도메인 모듈입니다.

### 1.1 주요 기능

- 그룹 생성/수정/삭제
- 멤버 초대 및 관리
- 그룹 내 책 추가 및 공유
- 그룹 내 노트 공유
- 멤버 독서 진행률 표시

---

## 2. 파일 구조

```
app/
├── (main)/
│   └── groups/
│       ├── page.tsx
│       ├── [id]/page.tsx
│       ├── create/page.tsx
│       └── join/[code]/page.tsx
└── actions/
    └── groups.ts

components/
└── groups/
    ├── group-card.tsx
    ├── groups-content.tsx
    ├── group-dashboard.tsx
    ├── group-books-manager.tsx
    ├── member-list.tsx
    ├── member-progress.tsx
    └── shared-notes-list.tsx

hooks/
└── use-groups.ts

types/
└── group.ts
```

---

## 3. 데이터 모델

### 3.1 테이블

| 테이블 | 설명 |
|--------|------|
| `groups` | 그룹 기본 정보 |
| `group_members` | 그룹-멤버 관계 |
| `group_books` | 그룹 내 책 |
| `group_shared_books` | 그룹에 공유된 책 |
| `group_notes` | 그룹에 공유된 노트 |

### 3.2 주요 타입

```typescript
type GroupRole = 'owner' | 'admin' | 'member'

interface Group {
  id: string
  name: string
  description: string | null
  invite_code: string
  owner_id: string
  created_at: string
  updated_at: string
}

interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: GroupRole
  joined_at: string
}

interface GroupBook {
  id: string
  group_id: string
  book_id: string
  added_by: string
  added_at: string
}
```

---

## 4. 핵심 함수

### 4.1 Server Actions

| 함수 | 파일 | 설명 |
|------|------|------|
| `getGroups()` | `app/actions/groups.ts` | 사용자 그룹 목록 조회 |
| `getGroupById()` | `app/actions/groups.ts` | 그룹 상세 조회 |
| `createGroup()` | `app/actions/groups.ts` | 그룹 생성 |
| `updateGroup()` | `app/actions/groups.ts` | 그룹 수정 |
| `deleteGroup()` | `app/actions/groups.ts` | 그룹 삭제 |
| `joinGroup()` | `app/actions/groups.ts` | 그룹 참가 |
| `leaveGroup()` | `app/actions/groups.ts` | 그룹 탈퇴 |
| `addBookToGroup()` | `app/actions/groups.ts` | 그룹에 책 추가 |
| `shareNoteToGroup()` | `app/actions/groups.ts` | 그룹에 노트 공유 |
| `getGroupMembers()` | `app/actions/groups.ts` | 그룹 멤버 목록 |

### 4.2 Hooks

| Hook | 설명 |
|------|------|
| `useGroups()` | 그룹 목록 상태 관리 |

---

## 5. 의존성

### 5.1 이 모듈이 사용하는 것

- `identity`: 사용자 확인
- `library`: 책 정보 참조
- `records`: 노트 정보 참조
- `shared`: UI 컴포넌트, 유틸리티

### 5.2 이 모듈을 사용하는 것

- `sharing`: 그룹 공유
- `home`: 그룹 활동 표시

---

## 6. 권한 체계

### 6.1 역할별 권한

| 기능 | owner | admin | member |
|------|-------|-------|--------|
| 그룹 삭제 | ✅ | ❌ | ❌ |
| 그룹 설정 변경 | ✅ | ✅ | ❌ |
| 멤버 초대/제거 | ✅ | ✅ | ❌ |
| 책 추가/제거 | ✅ | ✅ | ❌ |
| 노트 공유 | ✅ | ✅ | ✅ |
| 조회 | ✅ | ✅ | ✅ |

### 6.2 RLS 정책

```sql
-- 멤버만 그룹 데이터 접근 가능
auth.uid() IN (
  SELECT user_id FROM group_members WHERE group_id = groups.id
)
```

---

## 7. 참고 문서

- [DATA_MODEL.md](../../database/DATA_MODEL.md)
- [09-task-groups-plan.md](../../tasks/front/09-task-groups-plan.md)
