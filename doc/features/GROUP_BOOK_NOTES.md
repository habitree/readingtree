# 독서 모임 고도화: 지정도서별 기록 공유 기능

> **버전**: 1.0
> **최종 업데이트**: 2026-01-28
> **상태**: Phase 1 MVP 구현 완료

---

## 1. 개요

### 1.1 목적
각 모임별 선정된 도서를 기준으로 기록을 공유하는 기능. 기존 기록/서재 시스템과 자연스럽게 통합하여 모임 활동의 가치를 높입니다.

### 1.2 핵심 가치
- **지정도서 중심**: 모임에서 함께 읽는 책을 기준으로 기록 공유
- **간편한 공유**: 내 기록을 선택하여 일괄 공유
- **활동 시각화**: 멤버별 활동 현황을 한눈에 파악

---

## 2. 기능 명세

### 2.1 책별 공유 기록 조회
| 항목 | 내용 |
|------|------|
| **URL** | `/groups/[id]/books/[bookId]` |
| **접근 권한** | 모임 멤버, 리더, 공개 모임의 경우 모든 사용자 |
| **기능** | 특정 책에 대해 모임에 공유된 기록 목록 조회 |

### 2.2 기록 공유
| 항목 | 내용 |
|------|------|
| **기능** | 내 기록 중 아직 공유하지 않은 것들을 선택하여 일괄 공유 |
| **UI** | Share Note Dialog (체크박스로 다중 선택) |
| **제한** | 본인 기록만 공유 가능, 중복 공유 방지 |

### 2.3 멤버 활동 현황
| 항목 | 내용 |
|------|------|
| **탭 위치** | 모임 대시보드 > "멤버 활동" 탭 |
| **표시 정보** | 멤버별 공유 기록 수, 기록 유형별 분포, 최근 활동 시간 |

---

## 3. 구현 내용

### 3.1 Server Actions (`app/actions/groups.ts`)

| 함수명 | 용도 |
|--------|------|
| `getGroupBookNotes(groupId, bookId, options?)` | 책별 공유 기록 조회 |
| `getGroupBookNoteCounts(groupId)` | 책별 기록 수 조회 |
| `getShareableNotes(groupId, bookId)` | 공유 가능한 내 기록 조회 |
| `shareNotesToGroup(noteIds[], groupId)` | 기록 일괄 공유 |
| `unshareNoteFromGroup(noteId, groupId)` | 기록 공유 해제 |
| `getMemberActivities(groupId)` | 멤버별 활동 현황 조회 |

### 3.2 새 컴포넌트

| 컴포넌트 | 용도 |
|----------|------|
| `group-book-card-enhanced.tsx` | 기록 수 배지 포함 카드 |
| `group-note-feed.tsx` | 공유 기록 피드 (필터 포함) |
| `group-note-card.tsx` | 작성자 표시 기록 카드 |
| `share-note-dialog.tsx` | 기록 공유 다이얼로그 |
| `member-activity-list.tsx` | 멤버 활동 현황 목록 |
| `group-book-notes-page.tsx` | 책별 공유 기록 페이지 |

### 3.3 수정된 컴포넌트

| 컴포넌트 | 변경 내용 |
|----------|-----------|
| `group-dashboard.tsx` | "멤버 활동" 탭 추가 |
| `group-books-manager.tsx` | Enhanced 카드로 교체, 기록 수 배지 표시 |

### 3.4 새 페이지

| 경로 | 용도 |
|------|------|
| `/groups/[id]/books/[bookId]/page.tsx` | 책별 공유 기록 페이지 |

### 3.5 타입 정의 (`types/group.ts`)

```typescript
export type NoteType = "quote" | "photo" | "memo" | "transcription";

export interface GroupNote { ... }
export interface GroupBookWithNoteCount { ... }
export interface SharedNoteWithAuthor { ... }
export interface MemberActivity { ... }
export interface ShareableNote { ... }
```

---

## 4. 사용자 플로우

### 4.1 기록 공유 플로우
```
1. 모임 대시보드 > 지정도서 탭
2. 책 카드 클릭 → 책별 공유 기록 페이지
3. "내 기록 공유하기" 버튼 클릭
4. 공유할 기록 선택 (체크박스)
5. "공유" 버튼 클릭
6. 피드에 내 기록 표시됨
```

### 4.2 기록 조회 플로우
```
1. 모임 대시보드 > 지정도서 탭
2. 책 카드에서 기록 수 배지 확인
3. 책 클릭 → 공유 기록 피드
4. 필터로 기록 유형별 조회 (인용구, 메모, 사진, 필사)
```

### 4.3 활동 현황 조회
```
1. 모임 대시보드 > 멤버 활동 탭
2. 멤버별 공유 기록 수, 기록 유형별 분포 확인
3. 최근 활동 시간 확인
```

---

## 5. 데이터 모델 참조

기존 테이블 활용:
- `group_notes`: 모임에 공유된 기록 (group_id, note_id)
- `group_books`: 모임 지정도서 (group_id, book_id)
- `notes`: 사용자 기록 (user_id, book_id, type, content)

---

## 6. Phase 계획

### Phase 1: MVP ✅ (완료)
- [x] Server Actions 추가
- [x] 책별 공유 기록 페이지
- [x] 기록 공유 다이얼로그
- [x] 멤버 활동 현황 탭
- [x] 기록 수 배지 표시

### Phase 2: UX 개선 (예정)
- [ ] URL 상태 연동 필터 (`?type=quote&member=xxx`)
- [ ] 기록 작성 시 공유 제안 체크박스
- [ ] 모바일용 바텀시트 공유 UI

### Phase 3: 확장 (선택)
- [ ] 책별 토론 댓글 기능 (`group_book_comments` 테이블)
- [ ] Supabase Realtime 연동 (실시간 업데이트)

---

## 7. 검증 방법

1. 모임 생성 → 지정도서 추가
2. 해당 책에 기록 작성 (메모, 인용구 등)
3. 기록 공유 다이얼로그에서 기록 선택 → 공유
4. 피드에서 공유된 기록 확인
5. 다른 멤버 로그인 → 공유 기록 조회 확인
6. 필터 동작 확인 (인용구, 메모, 사진, 필사)
7. 멤버 활동 탭에서 활동 현황 확인

---

## 8. 관련 파일

### Server Actions
- `app/actions/groups.ts`

### 컴포넌트
- `components/groups/group-book-card-enhanced.tsx`
- `components/groups/group-note-feed.tsx`
- `components/groups/group-note-card.tsx`
- `components/groups/share-note-dialog.tsx`
- `components/groups/member-activity-list.tsx`
- `components/groups/group-book-notes-page.tsx`
- `components/groups/group-dashboard.tsx` (수정)
- `components/groups/group-books-manager.tsx` (수정)

### 페이지
- `app/(main)/groups/[id]/books/[bookId]/page.tsx`

### 타입
- `types/group.ts`
