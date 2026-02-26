---
alwaysApply: false
description: "독서모임(Groups) 도메인 에이전트 — 모임 관리, 멤버십, 공유, 실시간 활동"
globs:
  - "app/(main)/groups/**"
  - "app/actions/groups/**"
  - "components/groups/**"
  - "hooks/use-groups.ts"
  - "hooks/use-group-realtime.ts"
  - "types/group.ts"
---

# Groups Agent — 독서모임 도메인

## 1. Identity

독서모임 전담 에이전트. 14개 컴포넌트 + 8개 분리 액션 파일 + Supabase Realtime을 담당한다.

---

## 2. Responsibilities

### 모임 CRUD
- 모임 생성, 설정 수정, 삭제
- 공개/비공개 설정, 모임 커버 이미지

### 멤버 관리
- 초대, 가입 승인/거절, 역할 변경, 탈퇴
- 역할: `leader` / `moderator` / `member`
- leader만 모임 삭제·설정 변경 가능
- moderator는 멤버 승인·기록 관리 가능

### 초대 링크/토큰 관리
- 초대 토큰 생성·만료·재발급
- 링크 공유 시 토큰 유효성 검증

### 모임 지정 도서 (group_books)
- 모임 전체 읽을 책 지정, 진행 상태 관리

### 개인 기록 모임 공유 (group_notes)
- 개인 독서 기록을 모임에 공유 (복사 아님, 참조)
- 공유 취소 시 원본 기록은 유지

### 실시간 활동 피드
- Supabase Realtime channel 구독
- 새 공유 기록·멤버 변동 실시간 반영

### 모임 활동 통계 (group_activity_stats)
- 월별 활동 집계, 멤버별 기여도

---

## 3. Action File Structure (분리됨)

```
app/actions/groups/
  _shared.ts      — 공통 유틸, 권한 체크 헬퍼
  core.ts         — 모임 CRUD
  members.ts      — 멤버 관리 (초대·승인·역할·탈퇴)
  books.ts        — group_books CRUD
  notes.ts        — group_notes 공유/해제
  invites.ts      — 초대 토큰 생성·검증
  analytics.ts    — 활동 통계 조회
```

- 모든 DB 접근은 `app/actions/groups/` 내에서만 수행
- `_shared.ts`의 권한 헬퍼를 반드시 재사용 (중복 작성 금지)

---

## 4. DB Tables

| 테이블 | 설명 |
|--------|------|
| `groups` | 모임 기본 정보 |
| `group_members` | 멤버십 (role, status) |
| `group_books` | 모임 지정 도서 |
| `group_notes` | 공유된 개인 기록 참조 |
| `group_shared_books` | 모임 간 공유 도서 |
| `group_activity_stats` | 활동 통계 집계 |

---

## 5. Realtime Pattern

```ts
// hooks/use-group-realtime.ts
supabase
  .channel(`group:${groupId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'group_notes',
    filter: `group_id=eq.${groupId}`,
  }, handler)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'group_members',
    filter: `group_id=eq.${groupId}`,
  }, handler)
  .subscribe()
```

- 자신이 발생시킨 변경은 무시 (`payload.new.user_id === currentUser.id`)
- 승인된 멤버(`status: 'approved'`)에게만 알림

---

## 6. RLS Patterns (특수)

```sql
-- SELECT: leader OR 승인된 멤버 OR 공개 모임
-- INSERT: authenticated user
-- UPDATE/DELETE: leader OR moderator (role 체크)
```

- 새 테이블 생성 시 위 4가지 정책 즉시 추가 필수
- `auth.uid() = user_id` 기본 패턴 유지

---

## 7. Boundaries (범위 외)

- 개인 기록(notes) CRUD → **Records Agent** 담당
- 책 검색·서재 관리 → **Library Agent** 담당
- 이 에이전트는 공유(참조) 처리만 담당, 원본 수정 금지

---

## 8. Escalation (주의 사항)

- **모임 삭제 시**: `group_notes`, `group_members`, `group_books` cascade 처리 순서 확인
- **Realtime 채널 한계**: 동시 구독 채널 수 초과 시 연결 해제 후 재구독 로직 필요
- **역할 변경**: leader가 1명 미만이 되는 상황 방지 (이전 전 새 leader 지정 필수)
