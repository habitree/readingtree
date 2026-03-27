# 독서모임 고도화 기획서 v1.0

> **작성일**: 2026-03-27
> **상태**: 기획 완료, 개발 대기
> **목표**: 소모임형 커뮤니티 독서모임 서비스로 고도화

---

## 1. 배경 및 목적

### 1.1 현재 상태

| 항목 | 현재 구현 |
|------|-----------|
| 가입 방식 | `is_public` boolean (공개=자동승인, 비공개=승인대기) |
| 역할 체계 | leader / moderator / member (moderator 수 제한 없음) |
| 모임 프로필 | 이름, 설명만 존재 |
| 콘텐츠 | 기록 공유 + 리액션(3종) + 댓글/대댓글 |
| 초대 | 토큰 기반 초대 링크 (7일 유효) |
| 분석 | 주간 활동 통계, 멤버별 진행률 |
| 실시간 | Realtime 구독 (새 기록/멤버 알림) |
| 일정/게시판 | 미지원 |

### 1.2 고도화 목적

특정 목적의 모임이나 조직이 독서모임을 만들고, **소모임** 서비스처럼 사람들이 가입하여 자료를 공유하는 커뮤니티형 독서모임 서비스를 구축한다.

### 1.3 핵심 요구사항

1. **3가지 가입 방식**: 자유 가입 / 승인제 / 완전 비공개
2. **서브 관리자 최대 2명**: 관리자가 부리더를 2명까지만 지정
3. **소모임형 커뮤니티 기능**: 모임 프로필, 공지, 게시판, 일정, 알림

---

## 2. Phase 1 (P0) — 가입 방식 재설계 + 부리더 제한

### 2.1 가입 방식 3종 (`join_type`)

기존 `is_public` boolean을 `join_type` ENUM으로 교체한다.

```
join_type: 'open' | 'approval' | 'private'
```

#### 2.1.1 자유 가입 (open)

| 항목 | 내용 |
|------|------|
| **검색 노출** | O (모임 찾기에 표시) |
| **가입 경로** | 검색, 직접 URL, 초대 링크 |
| **가입 프로세스** | 가입 버튼 클릭 → **즉시 승인** (status: approved) |
| **대시보드 접근** | 가입 즉시 가능 |
| **UI 표시** | 🌐 "자유 가입" (green 뱃지) |

**사용 시나리오**: 개방적인 독서 커뮤니티, 대규모 공개 모임

#### 2.1.2 승인제 (approval)

| 항목 | 내용 |
|------|------|
| **검색 노출** | O (모임 찾기에 표시) |
| **가입 경로** | 검색, 직접 URL, 초대 링크 |
| **가입 프로세스** | 가입 신청 → **대기** (status: pending) → 관리자 승인 후 approved |
| **대시보드 접근** | 승인 후 가능 |
| **UI 표시** | 🛡️ "승인제" (blue 뱃지) |

**사용 시나리오**: 학교/회사 독서모임, 질적 관리가 필요한 모임

#### 2.1.3 완전 비공개 (private)

| 항목 | 내용 |
|------|------|
| **검색 노출** | X (검색/목록에 미노출) |
| **가입 경로** | **초대 토큰(링크)으로만** 가입 가능 |
| **가입 프로세스** | 초대 링크 접속 → **즉시 승인** (초대 = 승인 의미) |
| **직접 가입 시도** | 에러: "이 모임은 초대를 통해서만 가입 가능합니다" |
| **UI 표시** | 🔒 "비공개" (amber 뱃지) |

**사용 시나리오**: 사내 비공개 독서모임, 소규모 친목 모임

#### 2.1.4 가입 방식 비교표

```
┌─────────────┬──────────┬──────────┬──────────────┐
│             │  open    │ approval │   private    │
├─────────────┼──────────┼──────────┼──────────────┤
│ 검색 노출    │    O     │    O     │      X       │
│ 직접 가입    │  즉시승인 │ 승인대기  │     불가      │
│ 초대 토큰    │ 즉시승인  │ 즉시승인  │   즉시승인    │
│ 모임 정보    │ 전체공개  │ 기본공개  │ 멤버만 접근   │
└─────────────┴──────────┴──────────┴──────────────┘
```

### 2.2 DB 마이그레이션 전략

#### 1단계: join_type 컬럼 추가

```sql
-- join_type ENUM 생성
CREATE TYPE join_type AS ENUM ('open', 'approval', 'private');

-- groups 테이블에 join_type 컬럼 추가
ALTER TABLE groups ADD COLUMN join_type join_type NOT NULL DEFAULT 'approval';

-- 기존 데이터 마이그레이션
UPDATE groups SET join_type = 'open' WHERE is_public = true;
UPDATE groups SET join_type = 'approval' WHERE is_public = false;

-- 인덱스 생성
CREATE INDEX idx_groups_join_type ON groups(join_type);
```

#### 2단계: is_public 컬럼 제거 (코드 전환 완료 후)

```sql
ALTER TABLE groups DROP COLUMN is_public;
DROP INDEX IF EXISTS idx_groups_is_public;
```

### 2.3 부리더(서브 관리자) 최대 2명 제한

#### 현재 상태
- `member_role` ENUM: leader / moderator / member
- moderator 역할은 존재하지만 **수 제한 없음**

#### 변경사항
- `updateMemberRole()` 함수에서 moderator 승격 시 **기존 moderator 수 체크**
- 2명 이상이면 에러: `"부리더는 최대 2명까지 지정할 수 있습니다"`
- DB 레벨 트리거는 불필요 (Server Action 레벨 검증으로 충분)

#### 부리더 권한 범위

| 기능 | 리더 | 부리더 | 일반멤버 |
|------|:----:|:-----:|:-------:|
| 모임 정보 수정 | ✅ | ❌ | ❌ |
| 모임 삭제 | ✅ | ❌ | ❌ |
| 멤버 승인/거부 | ✅ | ✅ | ❌ |
| 멤버 강퇴 | ✅ | ✅ | ❌ |
| 부리더 지정/해제 | ✅ | ❌ | ❌ |
| 리더 위임 | ✅ | ❌ | ❌ |
| 지정도서 추가/삭제 | ✅ | ✅ | ❌ |
| 초대 토큰 생성 | ✅ | ✅ | ❌ |
| 공지사항 수정 (P1) | ✅ | ✅ | ❌ |
| 기록 공유 | ✅ | ✅ | ✅ |
| 리액션/댓글 | ✅ | ✅ | ✅ |

### 2.4 UI/UX 변경사항

#### 모임 생성 페이지

**Before**: Switch (공개/비공개)

**After**: RadioGroup 3옵션

```
┌─────────────────────────────────────────┐
│  가입 방식 선택                           │
│                                         │
│  ○ 🌐 자유 가입                          │
│     누구나 자유롭게 가입할 수 있습니다       │
│                                         │
│  ● 🛡️ 승인제                            │
│     관리자 승인 후 가입할 수 있습니다        │
│                                         │
│  ○ 🔒 완전 비공개                         │
│     초대받은 사람만 가입할 수 있습니다       │
└─────────────────────────────────────────┘
```

#### 모임 카드 (목록)

```
┌──────────────────────────────┐
│  📚 함께 읽는 고전문학         │
│  [승인제]  👥 12명            │
│  매주 토요일 고전을 함께...     │
│  리더: 홍길동  |  생성: 3일전  │
└──────────────────────────────┘
```

#### 모임 대시보드 헤더

```
┌──────────────────────────────────────────┐
│  📚 함께 읽는 고전문학  [승인제]           │
│  👥 12명  |  📖 3권  |  📝 47개 기록     │
│                                          │
│  [참여하기]  또는  [승인 대기 중]           │
│  (private 비멤버: "초대를 통해서만 가입")   │
└──────────────────────────────────────────┘
```

#### 모임 설정 페이지

- Switch → RadioGroup 동일 적용
- join_type 변경 시 경고 다이얼로그:
  - open→private: "기존 검색 노출이 중단됩니다"
  - private→open: "모임이 검색에 노출됩니다"

#### 모임 목록 (모임 찾기)

- 탭 명칭 변경: "공개 모임" → "모임 찾기"
- private 모임은 검색 결과에서 제외
- 각 카드에 join_type 뱃지 표시

#### 멤버 관리

- moderator 2명 도달 시 "부리더 지정" 메뉴 비활성화
- 비활성화 툴팁: "부리더는 최대 2명까지 지정할 수 있습니다"

### 2.5 수정 대상 파일

| 파일 | 변경 내용 |
|------|-----------|
| `types/group.ts` | JoinType 타입 추가, Group 인터페이스 변경 |
| `types/database.ts` | groups 테이블 타입 변경 |
| `app/actions/groups/core.ts` | createGroup, updateGroup, getPublicGroups, getGroupDetail |
| `app/actions/groups/members.ts` | joinGroup 분기, updateMemberRole 제한 |
| `app/actions/groups/_shared.ts` | JoinType export |
| `app/(main)/groups/new/page.tsx` | 생성 폼 RadioGroup |
| `app/(main)/groups/[id]/settings/page.tsx` | 설정 폼 RadioGroup |
| `components/groups/group-card.tsx` | 뱃지 3종 |
| `components/groups/group-dashboard.tsx` | 뱃지 + 상태 표시 |
| `components/groups/groups-content.tsx` | 탭명 + 필터 |
| `components/groups/member-list.tsx` | moderator 제한 UI |
| `hooks/use-groups.ts` | 타입 반영 |

---

## 3. Phase 2 (P1) — 모임 프로필 + 공지 + 검색 고도화

### 3.1 모임 프로필 확장

#### 새 컬럼

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `cover_image_url` | TEXT | 커버 이미지 URL |
| `category` | VARCHAR(50) | 주요 카테고리 |
| `tags` | TEXT[] | 태그 배열 |
| `max_members` | INTEGER | 최대 멤버 수 (null=무제한) |

#### 카테고리 목록

앱 코드에서 관리 (`lib/constants/group-categories.ts`):

| 카테고리 | 아이콘 |
|---------|--------|
| 문학 | 📖 |
| 비문학 | 📋 |
| 자기계발 | 🎯 |
| 인문학 | 🏛️ |
| 과학 | 🔬 |
| 경영/경제 | 💼 |
| 기술/IT | 💻 |
| 예술 | 🎨 |
| 기타 | 📚 |

#### UI 와이어프레임: 모임 생성 (확장)

```
┌─────────────────────────────────────────┐
│  모임 만들기                              │
│                                         │
│  [📷 커버 이미지 업로드]                   │
│                                         │
│  모임 이름: [________________]            │
│  설명:     [________________]            │
│                                         │
│  카테고리:  [문학 ▼]                      │
│  태그:     [소설] [고전] [+추가]          │
│  최대 인원: [__ 명] (비워두면 무제한)       │
│                                         │
│  가입 방식:                               │
│  ○ 자유 가입  ● 승인제  ○ 완전 비공개      │
│                                         │
│  [모임 만들기]                             │
└─────────────────────────────────────────┘
```

#### 모임 카드 (커버 이미지 포함)

```
┌──────────────────────────────┐
│ ████████████████████████████ │  ← 커버 이미지
│ ████████████████████████████ │
├──────────────────────────────┤
│  📚 함께 읽는 고전문학         │
│  [문학] [승인제]  👥 12/30명  │
│  매주 토요일 고전을 함께...     │
└──────────────────────────────┘
```

### 3.2 모임 공지사항

#### 새 컬럼

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `announcement` | TEXT | 공지 내용 |
| `announcement_updated_at` | TIMESTAMPTZ | 수정 시간 |

모임당 1개의 공지만 존재. 복수 공지가 필요해지면 Phase 3 게시판의 pinned post로 확장.

#### UI: 대시보드 공지 카드

```
┌──────────────────────────────────────────┐
│  📢 공지사항                    [✏️ 수정]  │
│  ──────────────────────────────────────  │
│  이번 주 모임은 '데미안' 3장까지 읽어오세요.│
│  토론 주제: 성장과 자아 탐색              │
│                                          │
│  수정: 2026-03-27                        │
└──────────────────────────────────────────┘
```

- 리더/부리더: 수정 버튼 표시
- 일반멤버: 읽기 전용
- 공지 미설정 시: 리더/부리더에게 "공지를 작성해보세요" 프롬프트

### 3.3 모임 검색/발견 고도화

#### 검색 필터 UI

```
┌──────────────────────────────────────────┐
│  🔍 [모임 검색...]                        │
│                                          │
│  [전체] [문학] [비문학] [자기계발] [인문학]  │
│  [과학] [경영] [기술] [예술] [기타]        │
│                                          │
│  정렬: [최신순 ▼]                         │
│     - 최신순                              │
│     - 인기순 (멤버 수)                     │
│     - 활동순 (최근 활동)                   │
└──────────────────────────────────────────┘
```

#### Server Action 확장

- `getPublicGroups(query, { category, tags, sortBy })`: 필터+정렬 지원
- `getPopularCategories()`: 카테고리별 모임 수 집계
- `getRecommendedGroups()`: 활동이 활발한 모임 추천

---

## 4. Phase 3 (P2) — 커뮤니티 기능

### 4.1 모임 게시판/자료실

현재는 개인 기록을 모임에 "공유"하는 방식만 존재. 자유 형식의 게시글을 작성할 수 있는 게시판을 추가한다.

#### 새 테이블: `group_posts`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | |
| group_id | UUID FK → groups | ON DELETE CASCADE |
| author_id | UUID FK → users | ON DELETE CASCADE |
| type | VARCHAR(20) | 'general' / 'question' / 'resource' |
| title | VARCHAR(200) NOT NULL | 제목 |
| content | TEXT | 본문 (마크다운 지원) |
| is_pinned | BOOLEAN DEFAULT FALSE | 고정 여부 (leader/moderator만) |
| attachment_urls | TEXT[] | 첨부 파일 URL 배열 |
| created_at | TIMESTAMPTZ DEFAULT now() | |
| updated_at | TIMESTAMPTZ DEFAULT now() | |

#### RLS 정책

- **SELECT**: 승인된 멤버만 조회
- **INSERT**: 승인된 멤버만 작성
- **UPDATE**: 작성자 본인 OR leader/moderator
- **DELETE**: 작성자 본인 OR leader/moderator

#### 게시글 타입

| 타입 | 아이콘 | 용도 |
|------|--------|------|
| general | 💬 | 자유 게시글, 토론 |
| question | ❓ | 질문 (Q&A) |
| resource | 📎 | 자료 공유 (PDF, 링크 등) |

#### UI: 게시판 탭

```
┌──────────────────────────────────────────┐
│  게시판                       [+ 글쓰기]  │
│                                          │
│  [전체] [자유] [질문] [자료]              │
│                                          │
│  📌 이번 달 독서 계획           홍길동     │
│     3월은 '데미안'을 함께...    3시간 전   │
│                                          │
│  ❓ 데미안 3장 해석 질문         김철수     │
│     싱클레어가 데미안을...      1일 전     │
│                                          │
│  📎 데미안 독서 가이드 PDF      이영희     │
│     출판사 제공 독서 가이드...   2일 전     │
└──────────────────────────────────────────┘
```

### 4.2 모임 일정 관리

오프라인/온라인 모임 일정을 관리할 수 있는 기능.

#### 새 테이블: `group_events`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | |
| group_id | UUID FK → groups | ON DELETE CASCADE |
| created_by | UUID FK → users | |
| title | VARCHAR(200) NOT NULL | 일정 제목 |
| description | TEXT | 상세 설명 |
| event_date | TIMESTAMPTZ NOT NULL | 일정 날짜/시간 |
| location | VARCHAR(500) | 장소 or 온라인 링크 |
| is_online | BOOLEAN DEFAULT FALSE | 온/오프라인 |
| max_attendees | INTEGER | 최대 참석 인원 (null=무제한) |
| created_at | TIMESTAMPTZ DEFAULT now() | |

#### 새 테이블: `group_event_attendees`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | |
| event_id | UUID FK → group_events | ON DELETE CASCADE |
| user_id | UUID FK → users | ON DELETE CASCADE |
| status | VARCHAR(20) | 'attending' / 'maybe' / 'declined' |
| created_at | TIMESTAMPTZ DEFAULT now() | |
| UNIQUE | (event_id, user_id) | |

#### UI: 일정 탭

```
┌──────────────────────────────────────────┐
│  일정                      [+ 일정 추가]  │
│                                          │
│  📅 다가오는 일정                          │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  3월 29일 (토) 14:00              │  │
│  │  📍 스타벅스 강남점                │  │
│  │  데미안 3~5장 토론                 │  │
│  │                                    │  │
│  │  참석 8 · 미정 2 · 불참 1          │  │
│  │  [✅ 참석] [🤔 미정] [❌ 불참]     │  │
│  └────────────────────────────────────┘  │
│                                          │
│  📅 지난 일정                             │
│  ...                                     │
└──────────────────────────────────────────┘
```

#### overview 탭 미리보기

대시보드 overview에 다가오는 일정 1~2개를 미리보기로 표시.

### 4.3 멤버 모임 내 프로필

#### group_members 컬럼 추가

| 컬럼 | 타입 | 설명 |
|------|------|------|
| bio | VARCHAR(200) | 모임 내 자기소개 |
| nickname | VARCHAR(50) | 모임 내 별명 (선택) |

#### UI: 멤버 프로필 팝오버

```
┌────────────────────────┐
│  🧑 홍길동  (길동이)     │
│  부리더                  │
│                         │
│  "고전문학을 좋아하는    │
│   직장인입니다"          │
│                         │
│  가입: 2026-01-15       │
│  공유 기록: 23개         │
│  [프로필 편집]           │
└────────────────────────┘
```

### 4.4 알림 시스템

#### 새 테이블: `notifications`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | |
| user_id | UUID FK → users | 수신자 |
| type | VARCHAR(50) NOT NULL | 알림 유형 |
| title | VARCHAR(200) | 알림 제목 |
| message | TEXT | 알림 내용 |
| data | JSONB | 추가 데이터 |
| is_read | BOOLEAN DEFAULT FALSE | 읽음 여부 |
| created_at | TIMESTAMPTZ DEFAULT now() | |

#### 알림 유형

| type | 대상 | 트리거 |
|------|------|--------|
| `group_join_request` | leader/moderator | 새 가입 신청 |
| `group_join_approved` | 신청자 | 가입 승인 |
| `group_join_rejected` | 신청자 | 가입 거부 |
| `group_new_note` | 모임 멤버 전체 | 새 기록 공유 |
| `group_new_post` | 모임 멤버 전체 | 새 게시글 |
| `group_new_event` | 모임 멤버 전체 | 새 일정 |
| `group_announcement` | 모임 멤버 전체 | 공지 변경 |
| `group_role_changed` | 해당 멤버 | 역할 변경 |
| `note_reaction` | 기록 작성자 | 리액션 추가 |
| `note_comment` | 기록 작성자 | 댓글 추가 |

#### UI: 알림 벨

```
┌──────────────────────────────┐
│  🔔 (3)                      │  ← 네비게이션 바
└──────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  알림                [모두 읽음] │
│                               │
│  🟢 홍길동님이 '데미안' 기록을   │
│     공유했습니다  (2분 전)      │
│                               │
│  🟢 김철수님이 모임 가입을       │
│     신청했습니다  (1시간 전)     │
│                               │
│  ⚪ 이영희님이 댓글을            │
│     남겼습니다  (어제)          │
└──────────────────────────────┘
```

---

## 5. 마이그레이션 로드맵

### Phase 1 (P0) — 즉시 구현

| # | 마이그레이션 | 내용 |
|---|-------------|------|
| 1 | `__groups__add_join_type.sql` | join_type ENUM + 컬럼 + 데이터 변환 |
| 2 | `__groups__drop_is_public.sql` | is_public 제거 (코드 전환 후) |

### Phase 2 (P1) — 프로필/공지/검색

| # | 마이그레이션 | 내용 |
|---|-------------|------|
| 3 | `__groups__add_profile_fields.sql` | cover_image_url, category, tags, max_members |
| 4 | `__groups__add_announcement.sql` | announcement, announcement_updated_at |

### Phase 3 (P2) — 커뮤니티

| # | 마이그레이션 | 내용 |
|---|-------------|------|
| 5 | `__groups__create_posts.sql` | group_posts 테이블 + RLS |
| 6 | `__groups__create_events.sql` | group_events + attendees + RLS |
| 7 | `__notifications__create.sql` | notifications 테이블 + RLS |
| 8 | `__group_members__add_profile.sql` | bio, nickname 컬럼 |

---

## 6. 데이터 모델 변경 요약

### 6.1 기존 테이블 변경

```
groups
  + join_type        (join_type ENUM, NOT NULL, DEFAULT 'approval')  [P0]
  - is_public        (DROP after code migration)                     [P0]
  + cover_image_url  (TEXT)                                          [P1]
  + category         (VARCHAR(50))                                   [P1]
  + tags             (TEXT[])                                        [P1]
  + max_members      (INTEGER)                                       [P1]
  + announcement     (TEXT)                                          [P1]
  + announcement_updated_at (TIMESTAMPTZ)                            [P1]

group_members
  + bio              (VARCHAR(200))                                   [P2]
  + nickname         (VARCHAR(50))                                    [P2]
```

### 6.2 새 테이블

```
group_posts              [P2]  — 모임 게시판
group_events             [P2]  — 모임 일정
group_event_attendees    [P2]  — 일정 참석자
notifications            [P2]  — 알림
```

### 6.3 새 인덱스

```
idx_groups_join_type              ON groups(join_type)                [P0]
idx_groups_category               ON groups(category)                [P1]
idx_groups_tags                   ON groups USING GIN(tags)          [P1]
idx_group_posts_group_id          ON group_posts(group_id)           [P2]
idx_group_events_group_id         ON group_events(group_id)          [P2]
idx_group_events_event_date       ON group_events(event_date)        [P2]
idx_notifications_user_id_read    ON notifications(user_id, is_read) [P2]
```

---

## 7. 주의사항 및 제약

1. **RLS 재귀 방지**: 현재 코드베이스는 `group_members` JOIN을 피하고 `groups` 테이블만 참조하는 RLS 패턴을 사용. 새 RLS 정책도 이 패턴을 반드시 유지
2. **하위 호환성**: `is_public` 참조가 10개 이상 파일에 산재 — 모든 참조를 `join_type`으로 전환 완료한 후 컬럼 DROP
3. **초대 토큰 정책**: 모든 join_type에서 `joinByToken()` = 자동 승인 유지 (초대 = 승인 의미)
4. **구독 체크**: `joinGroup()`의 `checkFeatureAccess()` 유지
5. **i18n**: 새 UI 문구 번역 키 추가 필요
6. **Supabase Storage**: 커버 이미지 업로드 시 `group-covers` 버킷 생성 필요

---

## 8. 성공 지표

| 지표 | 목표 |
|------|------|
| 모임 생성 수 | 기존 대비 +30% |
| 모임 가입률 | open 모임 가입 전환율 50%+ |
| 멤버 활동률 | 주간 기록 공유 +20% |
| 모임 유지율 | 30일 후 활성 모임 비율 70%+ |

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2026-03-27 | v1.0 | 초안 작성 |
