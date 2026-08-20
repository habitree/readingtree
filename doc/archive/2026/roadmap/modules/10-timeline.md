# Timeline 모듈 고도화 계획

> **모듈**: timeline
> **현재 규모**: ~200 LOC
> **성숙도**: ⭐⭐ (2/5)
> **우선순위**: 🟢 낮음

---

## 1. 현황 분석

### 1.1 핵심 기능

| 기능 | 설명 | 상태 |
|------|------|------|
| 활동 피드 | 기본 활동 목록 | ✅ 완료 |
| 시간순 정렬 | 최신순 표시 | ✅ 완료 |

### 1.2 기술 구조

```
app/(main)/timeline/
├── page.tsx                  # 타임라인 페이지
└── components/
    └── ActivityFeed.tsx      # 활동 피드
```

### 1.3 데이터 모델

```sql
-- 현재는 books, notes 테이블의 created_at을 조합하여 표시
-- 별도 activities 테이블 없음
```

---

## 2. 관점별 분석

### 2.1 핵심 기능 강화

| 항목 | 현재 | 목표 | 우선순위 | 복잡도 |
|------|------|------|---------|--------|
| **무한 스크롤** | 없음 | 페이지네이션 | 🔴 높음 | ⭐ |
| **활동 테이블** | 없음 | 전용 테이블 | 🟡 중간 | ⭐⭐ |
| **필터링** | 없음 | 타입별 필터 | 🟡 중간 | ⭐ |
| **기간별 그룹** | 없음 | 오늘/이번주/이전 | 🟢 낮음 | ⭐ |

#### 상세: 활동 테이블 설계

```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN (
    'book_added', 'book_started', 'book_completed',
    'note_created', 'note_updated',
    'group_joined', 'note_shared',
    'achievement_unlocked', 'level_up'
  )),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_activities_user_date ON activities(user_id, created_at DESC);

-- RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activities"
  ON activities FOR SELECT
  USING (auth.uid() = user_id);
```

### 2.2 확장성/창의성

| 아이디어 | 설명 | 가치 | 실현성 | 분류 |
|----------|------|------|--------|------|
| **소셜 피드** | 팔로잉 활동 표시 | 높음 | 중간 | 🔮 장기 |
| **주간 요약** | 한 주 활동 요약 | 중간 | 높음 | 🚀 즉시 |
| **마일스톤** | 중요 이벤트 하이라이트 | 중간 | 높음 | 💡 아이디어 |
| **캘린더 뷰** | 달력 형태 표시 | 중간 | 중간 | 💡 아이디어 |

#### 상세: 주간 요약

```typescript
interface WeeklySummary {
  weekStart: Date;
  weekEnd: Date;
  stats: {
    booksStarted: number;
    booksCompleted: number;
    pagesRead: number;
    notesWritten: number;
  };
  highlights: Activity[];
  streak: number;
}

function WeeklySummaryCard({ summary }: { summary: WeeklySummary }) {
  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          이번 주 독서 요약
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {format(summary.weekStart, 'M/d')} - {format(summary.weekEnd, 'M/d')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <StatItem icon={<BookPlus />} label="시작" value={summary.stats.booksStarted} />
          <StatItem icon={<BookCheck />} label="완독" value={summary.stats.booksCompleted} />
          <StatItem icon={<FileText />} label="기록" value={summary.stats.notesWritten} />
          <StatItem icon={<Flame />} label="스트릭" value={`${summary.streak}일`} />
        </div>

        {summary.highlights.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">주요 활동</h4>
            <ul className="space-y-1">
              {summary.highlights.map((h, i) => (
                <li key={i} className="text-sm flex items-center gap-2">
                  <Star className="h-3 w-3 text-yellow-500" />
                  {formatActivityText(h)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 2.3 기술 품질

| 항목 | 현재 상태 | 목표 | 액션 |
|------|----------|------|------|
| **가상화** | 없음 | 큰 목록 최적화 | react-window |
| **캐싱** | 없음 | 페이지 캐싱 | React Query |
| **테스트** | 0% | 60% | 테스트 작성 |

### 2.4 통합/연동

| 연동 대상 | 유형 | 데이터 흐름 | 우선순위 |
|----------|------|------------|---------|
| **books** | 내부 | 책 활동 | 🔴 높음 |
| **notes** | 내부 | 기록 활동 | 🔴 높음 |
| **groups** | 내부 | 그룹 활동 | 🟡 중간 |
| **points** | 내부 | 보상 활동 | 🟡 중간 |

---

## 3. 고도화 항목 상세

### 3.1 단기 개선 (Quick Wins)

#### QW-01: 무한 스크롤

```typescript
function ActivityTimeline() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    ['activities'],
    ({ pageParam = null }) => getActivities({ cursor: pageParam, limit: 20 }),
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  return (
    <div className="space-y-4">
      {data?.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </React.Fragment>
      ))}

      <div ref={ref}>
        {isFetchingNextPage && <Spinner />}
      </div>
    </div>
  );
}
```

#### QW-02: 기간별 그룹핑

```typescript
function GroupedTimeline({ activities }: { activities: Activity[] }) {
  const grouped = useMemo(() => {
    const groups: { label: string; activities: Activity[] }[] = [];
    const today = startOfDay(new Date());
    const yesterday = subDays(today, 1);
    const weekStart = startOfWeek(today);

    const todayActivities = activities.filter(a =>
      isSameDay(new Date(a.created_at), today)
    );
    const yesterdayActivities = activities.filter(a =>
      isSameDay(new Date(a.created_at), yesterday)
    );
    const weekActivities = activities.filter(a =>
      isWithinInterval(new Date(a.created_at), { start: weekStart, end: yesterday })
    );
    const olderActivities = activities.filter(a =>
      isBefore(new Date(a.created_at), weekStart)
    );

    if (todayActivities.length) groups.push({ label: '오늘', activities: todayActivities });
    if (yesterdayActivities.length) groups.push({ label: '어제', activities: yesterdayActivities });
    if (weekActivities.length) groups.push({ label: '이번 주', activities: weekActivities });
    if (olderActivities.length) groups.push({ label: '이전', activities: olderActivities });

    return groups;
  }, [activities]);

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.label}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {group.label}
          </h3>
          <div className="space-y-3">
            {group.activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 3.2 중기 개선 (Planned)

#### PL-01: 활동 타입별 필터

```typescript
const activityFilters = [
  { value: 'all', label: '전체', icon: <List /> },
  { value: 'books', label: '책', icon: <BookOpen /> },
  { value: 'notes', label: '기록', icon: <FileText /> },
  { value: 'social', label: '소셜', icon: <Users /> },
  { value: 'achievements', label: '업적', icon: <Trophy /> },
];

function TimelineFilters({ value, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {activityFilters.map((filter) => (
        <Button
          key={filter.value}
          variant={value === filter.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(filter.value)}
        >
          {filter.icon}
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
```

### 3.3 장기 비전 (Vision)

#### VS-01: 소셜 피드

```
┌─────────────────────────────────────────────────────────────┐
│                      소셜 타임라인                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [내 활동] [팔로잉] [전체]                                   │
│                                                             │
│  ────────────────────────────────────────────────           │
│                                                             │
│  👤 김독서 님이 '원씽'을 완독했습니다.                       │
│     ⏰ 2시간 전 | 💬 3 | ❤️ 12                              │
│                                                             │
│  👤 이책벌레 님이 새로운 기록을 공유했습니다.                │
│     "리더십이란 결국..." - 리더의 탄생                       │
│     ⏰ 5시간 전 | 💬 7 | ❤️ 23                              │
│                                                             │
│  👤 박독서왕 님이 '그릿'을 시작했습니다.                     │
│     ⏰ 1일 전                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 구현 가이드

### 4.1 기술 요구사항

| 기능 | 필요 기술 | 비고 |
|------|----------|------|
| 무한 스크롤 | @tanstack/react-query | useInfiniteQuery |
| 가상화 | react-window | 긴 목록 |
| 날짜 처리 | date-fns | 이미 설치됨 |

### 4.2 마이그레이션 계획

```sql
-- 활동 로그 테이블
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  entity_type TEXT, -- 'book', 'note', 'group' 등
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_activities_user ON activities(user_id, created_at DESC);
CREATE INDEX idx_activities_type ON activities(type);

-- RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own activities"
  ON activities FOR SELECT USING (auth.uid() = user_id);
```

---

## 5. 성공 지표 (KPIs)

| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|----------|
| **타임라인 조회율** | - | 30% | 일간 활성 사용자 대비 |
| **스크롤 깊이** | - | 20개+ | 평균 활동 조회 수 |
| **체류 시간** | - | 2분+ | 페이지 체류 시간 |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2026-01-30 | 최초 작성 |

---

*관련 문서: [메인 계획서](../MODULE_ENHANCEMENT_PLAN.md) | [Profile 모듈](./05-profile.md) | [Groups 모듈](./04-groups.md)*
