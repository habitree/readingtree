# Groups 모듈 고도화 계획

> **모듈**: groups
> **현재 규모**: ~2,600 LOC
> **성숙도**: ⭐⭐⭐⭐⭐ (5/5)
> **우선순위**: 🔴 높음

---

## 1. 현황 분석

### 1.1 핵심 기능

| 기능 | 설명 | 상태 |
|------|------|------|
| 그룹 CRUD | 독서모임 생성/관리 | ✅ 완료 |
| 역할 시스템 | 관리자/멤버/대기 | ✅ 완료 |
| 기록 공유 | 그룹에 노트 공유 | ✅ 완료 |
| 공유 책 | 그룹 공동 독서 | ✅ 완료 |
| 가입 요청 | 승인 기반 가입 | ✅ 완료 |
| 초대 시스템 | 링크/코드 초대 | ✅ 완료 |

### 1.2 기술 구조

```
app/actions/groups/
├── index.ts                  # 그룹 CRUD
├── members.ts                # 멤버 관리
├── shared-books.ts           # 공유 책
├── shared-notes.ts           # 공유 기록
└── invitations.ts            # 초대

app/(main)/groups/
├── page.tsx                  # 그룹 목록
├── [groupId]/
│   ├── page.tsx              # 그룹 홈
│   ├── books/                # 공유 책
│   ├── notes/                # 공유 기록
│   ├── members/              # 멤버 관리
│   └── settings/             # 설정

components/groups/
├── GroupCard.tsx
├── GroupHeader.tsx
├── MemberList.tsx
├── SharedNoteCard.tsx
└── InviteDialog.tsx
```

### 1.3 데이터 모델

```sql
groups (id, name, description, cover_image, created_by, ...)
group_members (group_id, user_id, role, joined_at)
group_shared_books (id, group_id, book_id, shared_by, ...)
group_shared_notes (id, group_id, note_id, shared_by, ...)
group_invitations (id, group_id, code, expires_at, ...)
```

---

## 2. 관점별 분석

### 2.1 핵심 기능 강화

| 항목 | 현재 | 목표 | 우선순위 | 복잡도 |
|------|------|------|---------|--------|
| **실시간 알림** | 없음 | 활동 알림 | 🔴 높음 | ⭐⭐⭐ |
| **활동 피드** | 기본 | 상세 타임라인 | 🔴 높음 | ⭐⭐ |
| **댓글 시스템** | 없음 | 공유 기록 댓글 | 🟡 중간 | ⭐⭐ |
| **좋아요** | 없음 | 기록/댓글 좋아요 | 🟡 중간 | ⭐ |
| **역할 커스텀** | 고정 | 권한 커스터마이징 | 🟢 낮음 | ⭐⭐ |

#### 상세: 실시간 알림 시스템

```typescript
// Supabase Realtime 활용
function useGroupNotifications(groupId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel(`group:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_activities',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const activity = payload.new as GroupActivity;
          setNotifications(prev => [activity, ...prev]);

          // 브라우저 알림
          if (Notification.permission === 'granted') {
            new Notification(formatActivityTitle(activity), {
              body: formatActivityBody(activity),
              icon: '/icon-192.png',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  return notifications;
}
```

### 2.2 확장성/창의성

| 아이디어 | 설명 | 가치 | 실현성 | 분류 |
|----------|------|------|--------|------|
| **그룹 챌린지** | 공동 독서 목표 | 높음 | 높음 | 🚀 즉시 |
| **실시간 토론** | 그룹 채팅 | 높음 | 중간 | 🔮 장기 |
| **독서 일정** | 캘린더 연동 | 중간 | 높음 | 💡 아이디어 |
| **투표 시스템** | 다음 책 선정 투표 | 중간 | 높음 | 🚀 즉시 |
| **그룹 통계** | 그룹 활동 분석 | 중간 | 높음 | 🚀 즉시 |
| **멘토링** | 1:1 매칭 | 낮음 | 중간 | 🔮 장기 |

#### 상세: 그룹 챌린지

```typescript
interface GroupChallenge {
  id: string;
  group_id: string;
  title: string;
  description: string;
  type: 'books_count' | 'pages_count' | 'notes_count' | 'streak';
  target: number;
  start_date: Date;
  end_date: Date;
  participants: ChallengeParticipant[];
}

interface ChallengeParticipant {
  user_id: string;
  progress: number;
  completed_at?: Date;
}

// UI 컴포넌트
function GroupChallengeCard({ challenge }: { challenge: GroupChallenge }) {
  const progress = calculateGroupProgress(challenge);

  return (
    <Card>
      <CardHeader>
        <Trophy className="text-yellow-500" />
        <CardTitle>{challenge.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={progress} />
        <div className="mt-4 space-y-2">
          {challenge.participants.map(p => (
            <ParticipantProgress key={p.user_id} participant={p} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 상세: 투표 시스템

```typescript
interface BookPoll {
  id: string;
  group_id: string;
  title: string;
  options: BookPollOption[];
  ends_at: Date;
  created_by: string;
}

interface BookPollOption {
  id: string;
  book_title: string;
  book_author: string;
  cover_image?: string;
  votes: string[]; // user_ids
}

// components/groups/BookPoll.tsx
function BookPoll({ poll }: { poll: BookPoll }) {
  const [voted, setVoted] = useState<string | null>(null);
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes.length, 0);

  return (
    <Card>
      <CardHeader>
        <Vote className="text-primary" />
        <CardTitle>{poll.title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {formatDistanceToNow(poll.ends_at)} 후 마감
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {poll.options.map(option => (
          <PollOption
            key={option.id}
            option={option}
            totalVotes={totalVotes}
            isVoted={voted === option.id}
            onVote={() => handleVote(option.id)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
```

### 2.3 기술 품질

| 항목 | 현재 상태 | 목표 | 액션 |
|------|----------|------|------|
| **테스트 커버리지** | 0% | 80% | 테스트 작성 |
| **실시간 연결** | 없음 | WebSocket | Supabase Realtime |
| **권한 체크** | 서버 | 서버 + 클라이언트 | 권한 훅 추가 |
| **캐싱** | 없음 | 그룹 데이터 캐싱 | React Query |

#### 권한 체크 훅

```typescript
// hooks/useGroupPermission.ts
function useGroupPermission(groupId: string) {
  const { user } = useUser();
  const { data: member } = useGroupMember(groupId, user?.id);

  const permissions = useMemo(() => ({
    canManageMembers: member?.role === 'admin',
    canEditGroup: member?.role === 'admin',
    canShareNotes: !!member,
    canComment: !!member,
    canVote: !!member,
    canCreateChallenge: member?.role === 'admin',
  }), [member]);

  return permissions;
}
```

### 2.4 통합/연동

| 연동 대상 | 유형 | 데이터 흐름 | 우선순위 |
|----------|------|------------|---------|
| **notes 모듈** | 내부 | 기록 공유 | ✅ 완료 |
| **books 모듈** | 내부 | 책 공유 | ✅ 완료 |
| **points 모듈** | 내부 | 그룹 활동 포인트 | 🟡 중간 |
| **Google Calendar** | 외부 | 독서 모임 일정 | 🟢 낮음 |
| **카카오 공유** | 외부 | 그룹 초대 공유 | 🟢 낮음 |

---

## 3. 고도화 항목 상세

### 3.1 단기 개선 (Quick Wins)

#### QW-01: 활동 피드 개선

```typescript
type ActivityType =
  | 'member_joined'
  | 'book_shared'
  | 'note_shared'
  | 'challenge_created'
  | 'challenge_completed'
  | 'poll_created';

function ActivityFeed({ groupId }: { groupId: string }) {
  const { data: activities } = useGroupActivities(groupId);

  return (
    <div className="space-y-4">
      {activities.map(activity => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}

function ActivityItem({ activity }: { activity: GroupActivity }) {
  const icons: Record<ActivityType, React.ReactNode> = {
    member_joined: <UserPlus />,
    book_shared: <BookOpen />,
    note_shared: <FileText />,
    challenge_created: <Trophy />,
    challenge_completed: <Star />,
    poll_created: <Vote />,
  };

  return (
    <div className="flex gap-3">
      <Avatar src={activity.user.avatar_url} />
      <div>
        <p>
          <strong>{activity.user.display_name}</strong>
          {' '}{formatActivityText(activity)}
        </p>
        <time className="text-sm text-muted-foreground">
          {formatDistanceToNow(activity.created_at)}
        </time>
      </div>
    </div>
  );
}
```

#### QW-02: 그룹 통계 대시보드

```typescript
interface GroupStats {
  totalMembers: number;
  totalSharedBooks: number;
  totalSharedNotes: number;
  thisWeekActivities: number;
  topContributors: { user: User; count: number }[];
  popularBooks: { book: Book; noteCount: number }[];
}

function GroupStatsDashboard({ stats }: { stats: GroupStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="멤버" value={stats.totalMembers} icon={<Users />} />
      <StatCard label="공유 책" value={stats.totalSharedBooks} icon={<BookOpen />} />
      <StatCard label="공유 기록" value={stats.totalSharedNotes} icon={<FileText />} />
      <StatCard label="주간 활동" value={stats.thisWeekActivities} icon={<Activity />} />
    </div>
  );
}
```

### 3.2 중기 개선 (Planned)

#### PL-01: 댓글 시스템

```sql
-- 댓글 테이블
CREATE TABLE group_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  shared_note_id UUID REFERENCES group_shared_notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  parent_id UUID REFERENCES group_comments(id), -- 대댓글
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 좋아요 테이블
CREATE TABLE group_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  likeable_type TEXT NOT NULL CHECK (likeable_type IN ('note', 'comment')),
  likeable_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, likeable_type, likeable_id)
);
```

#### PL-02: 실시간 알림 시스템

**구현 단계:**
1. Supabase Realtime 채널 설정
2. 알림 테이블 및 트리거 생성
3. 브라우저 알림 권한 요청
4. 알림 UI 컴포넌트 개발
5. 알림 설정 (구독/해제)

### 3.3 장기 비전 (Vision)

#### VS-01: 실시간 그룹 토론

```
┌─────────────────────────────────────────────────────────────┐
│                    실시간 토론 시스템                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   토론 채널     │    │   음성 토론      │                │
│  │   (텍스트)      │    │   (WebRTC)      │                │
│  └────────┬────────┘    └────────┬────────┘                │
│           │                      │                          │
│           └──────────┬───────────┘                          │
│                      │                                      │
│           ┌──────────┴──────────┐                          │
│           │   토론 아카이브     │                          │
│           │   (녹화/저장)       │                          │
│           └─────────────────────┘                          │
│                                                             │
│  기능:                                                      │
│  • 책별 토론 채널                                           │
│  • 실시간 채팅                                              │
│  • 화면 공유 (구절 표시)                                    │
│  • 토론 녹화 및 아카이브                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 구현 가이드

### 4.1 기술 요구사항

| 기능 | 필요 기술 | 비고 |
|------|----------|------|
| 실시간 알림 | Supabase Realtime | 이미 사용 가능 |
| 푸시 알림 | Web Push API | Service Worker 필요 |
| 음성 토론 | WebRTC / LiveKit | 장기 비전 |
| 캘린더 연동 | Google Calendar API | OAuth 필요 |

### 4.2 마이그레이션 계획

```sql
-- 그룹 활동 테이블
CREATE TABLE group_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  activity_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 그룹 챌린지 테이블
CREATE TABLE group_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  target INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE group_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_challenges ENABLE ROW LEVEL SECURITY;
```

---

## 5. 성공 지표 (KPIs)

| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|----------|
| **그룹 활성률** | - | 60% | 주 1회 이상 활동 그룹 비율 |
| **기록 공유율** | - | 40% | 그룹에서 공유된 기록 비율 |
| **댓글 참여율** | - | 30% | 공유 기록당 댓글 수 |
| **챌린지 완료율** | - | 50% | 목표 달성한 챌린지 비율 |
| **알림 클릭률** | - | 25% | 알림 → 앱 방문 비율 |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2026-01-30 | 최초 작성 |

---

*관련 문서: [메인 계획서](../MODULE_ENHANCEMENT_PLAN.md) | [Notes 모듈](./02-notes.md) | [Points 모듈](./08-points.md)*
