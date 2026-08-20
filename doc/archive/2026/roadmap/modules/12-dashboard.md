# Dashboard 모듈 고도화 계획

> **모듈**: dashboard
> **현재 규모**: ~500 LOC
> **성숙도**: ⭐⭐⭐ (3/5)
> **우선순위**: 🟡 중간

---

## 1. 현황 분석

### 1.1 핵심 기능

| 기능 | 설명 | 상태 |
|------|------|------|
| 홈 대시보드 | 메인 화면 | ✅ 완료 |
| 독서 현황 | 진행 중인 책 | ✅ 완료 |
| 최근 기록 | 최근 작성 기록 | ✅ 완료 |
| 스트릭 표시 | 연속 활동 | ✅ 완료 |

### 1.2 기술 구조

```
app/(main)/dashboard/
├── page.tsx                  # 대시보드 페이지
└── components/
    ├── WelcomeCard.tsx       # 환영 메시지
    ├── CurrentBooks.tsx      # 읽는 중인 책
    ├── RecentNotes.tsx       # 최근 기록
    ├── StreakCard.tsx        # 스트릭
    └── QuickActions.tsx      # 빠른 액션
```

---

## 2. 관점별 분석

### 2.1 핵심 기능 강화

| 항목 | 현재 | 목표 | 우선순위 | 복잡도 |
|------|------|------|---------|--------|
| **위젯 커스터마이징** | 고정 | 사용자 선택 | 🔴 높음 | ⭐⭐⭐ |
| **병렬 데이터 로딩** | 순차 | 병렬 | 🔴 높음 | ⭐ |
| **스켈레톤 UI** | 없음 | 로딩 UX 개선 | 🟡 중간 | ⭐ |
| **새로고침** | 없음 | Pull to refresh | 🟢 낮음 | ⭐ |

#### 상세: 위젯 커스터마이징

```typescript
interface DashboardWidget {
  id: string;
  type: 'current_books' | 'recent_notes' | 'streak' | 'stats' |
        'missions' | 'groups' | 'ai_insights' | 'quick_actions';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: number;
  enabled: boolean;
}

const defaultWidgets: DashboardWidget[] = [
  { id: '1', type: 'current_books', title: '읽는 중', size: 'large', position: 0, enabled: true },
  { id: '2', type: 'streak', title: '스트릭', size: 'small', position: 1, enabled: true },
  { id: '3', type: 'missions', title: '오늘의 미션', size: 'medium', position: 2, enabled: true },
  { id: '4', type: 'recent_notes', title: '최근 기록', size: 'medium', position: 3, enabled: true },
];

function DashboardCustomizer({ widgets, onChange }: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>대시보드 설정</SheetTitle>
        </SheetHeader>

        <DndContext onDragEnd={handleDragEnd}>
          <SortableContext items={widgets}>
            {widgets.map((widget) => (
              <SortableWidget
                key={widget.id}
                widget={widget}
                onToggle={() => toggleWidget(widget.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </SheetContent>
    </Sheet>
  );
}
```

### 2.2 확장성/창의성

| 아이디어 | 설명 | 가치 | 실현성 | 분류 |
|----------|------|------|--------|------|
| **AI 인사이트** | 맞춤 독서 조언 | 높음 | 중간 | 🚀 즉시 |
| **오늘의 명언** | 읽은 책에서 추출 | 중간 | 높음 | 🚀 즉시 |
| **독서 타이머** | 실시간 독서 추적 | 중간 | 중간 | 💡 아이디어 |
| **날씨 기반 추천** | 분위기에 맞는 책 | 낮음 | 중간 | 🔮 장기 |

#### 상세: AI 인사이트 위젯

```typescript
async function generateDailyInsight(userId: string): Promise<string> {
  const [recentBooks, stats, persona] = await Promise.all([
    getRecentBooks(userId, 5),
    getUserStats(userId),
    getPersona(userId),
  ]);

  const prompt = `
당신은 독서 코치입니다. 사용자의 독서 패턴을 분석하고
오늘의 독서 조언을 2-3문장으로 제공해주세요.

최근 읽은 책: ${recentBooks.map(b => b.title).join(', ')}
이번 달 독서량: ${stats.thisMonth.books}권
연속 독서 스트릭: ${stats.currentStreak}일
독서 성향: ${persona?.type || '분석 전'}
`;

  const response = await ai.chat({ prompt });
  return response.content;
}

function AIInsightWidget() {
  const { data: insight, isLoading } = useQuery(
    ['daily-insight'],
    () => generateDailyInsight(userId),
    { staleTime: 1000 * 60 * 60 * 24 } // 하루 캐싱
  );

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
      <CardHeader>
        <Sparkles className="h-5 w-5 text-primary" />
        <CardTitle>오늘의 독서 인사이트</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-16" />
        ) : (
          <p className="text-muted-foreground">{insight}</p>
        )}
      </CardContent>
    </Card>
  );
}
```

### 2.3 기술 품질

| 항목 | 현재 상태 | 목표 | 액션 |
|------|----------|------|------|
| **데이터 로딩** | 순차 | 병렬 | Promise.all |
| **캐싱** | 없음 | 적극 캐싱 | React Query |
| **테스트** | 0% | 70% | 테스트 작성 |

#### 병렬 데이터 로딩

```typescript
// 대시보드 데이터 한 번에 로딩
async function getDashboardData(userId: string) {
  const [
    currentBooks,
    recentNotes,
    stats,
    missions,
    streak,
    groups,
  ] = await Promise.all([
    getCurrentBooks(userId),
    getRecentNotes(userId, 5),
    getUserStats(userId),
    getDailyMissions(userId),
    getStreak(userId),
    getUserGroups(userId),
  ]);

  return { currentBooks, recentNotes, stats, missions, streak, groups };
}

// React Query로 캐싱
function useDashboardData() {
  return useQuery(['dashboard'], () => getDashboardData(userId), {
    staleTime: 1000 * 60 * 5, // 5분
    refetchOnWindowFocus: true,
  });
}
```

### 2.4 통합/연동

| 연동 대상 | 유형 | 데이터 흐름 | 우선순위 |
|----------|------|------------|---------|
| **books** | 내부 | 진행 중인 책 | ✅ 완료 |
| **notes** | 내부 | 최근 기록 | ✅ 완료 |
| **points** | 내부 | 스트릭/미션 | ✅ 완료 |
| **groups** | 내부 | 그룹 활동 | 🟡 중간 |
| **persona** | 내부 | 인사이트 | 🟢 낮음 |

---

## 3. 고도화 항목 상세

### 3.1 단기 개선 (Quick Wins)

#### QW-01: 스켈레톤 UI

```typescript
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <Skeleton className="h-24 w-full" />

      {/* 현재 읽는 책 */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-4">
          <Skeleton className="h-48 w-32" />
          <Skeleton className="h-48 w-32" />
          <Skeleton className="h-48 w-32" />
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>

      {/* 최근 기록 */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    </div>
  );
}
```

#### QW-02: 오늘의 명언

```typescript
function TodayQuoteWidget() {
  const { data: quote } = useRandomQuote();

  if (!quote) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <blockquote className="border-l-4 border-primary pl-4 italic">
          "{quote.content}"
        </blockquote>
        <p className="mt-2 text-sm text-muted-foreground text-right">
          - {quote.bookTitle}
        </p>
      </CardContent>
    </Card>
  );
}

// 사용자의 기록에서 인용구 랜덤 선택
async function getRandomQuote(userId: string) {
  const { data } = await supabase
    .from('notes')
    .select('content, books(title)')
    .eq('user_id', userId)
    .eq('type', 'quote')
    .limit(100);

  if (!data?.length) return null;

  const random = data[Math.floor(Math.random() * data.length)];
  return {
    content: random.content,
    bookTitle: random.books.title,
  };
}
```

### 3.2 중기 개선 (Planned)

#### PL-01: 위젯 시스템 구현

```typescript
// 위젯 레지스트리
const widgetRegistry: Record<string, WidgetComponent> = {
  current_books: CurrentBooksWidget,
  recent_notes: RecentNotesWidget,
  streak: StreakWidget,
  stats: StatsWidget,
  missions: MissionsWidget,
  groups: GroupsWidget,
  ai_insights: AIInsightWidget,
  today_quote: TodayQuoteWidget,
  quick_actions: QuickActionsWidget,
};

// 동적 대시보드 렌더링
function CustomizableDashboard() {
  const { data: widgets } = useUserWidgets();

  const enabledWidgets = widgets
    .filter(w => w.enabled)
    .sort((a, b) => a.position - b.position);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {enabledWidgets.map((widget) => {
        const WidgetComponent = widgetRegistry[widget.type];
        return (
          <div
            key={widget.id}
            className={cn(
              widget.size === 'large' && 'md:col-span-2',
              widget.size === 'small' && 'col-span-1'
            )}
          >
            <WidgetComponent />
          </div>
        );
      })}
    </div>
  );
}
```

### 3.3 장기 비전 (Vision)

#### VS-01: 개인화된 대시보드

```
┌─────────────────────────────────────────────────────────────┐
│                    스마트 대시보드                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  시간대별 최적화:                                            │
│  • 아침: 오늘의 목표 + 동기부여 명언                         │
│  • 저녁: 하루 독서 요약 + 내일 계획                          │
│  • 주말: 주간 리뷰 + 새로운 책 추천                          │
│                                                             │
│  사용자 행동 기반:                                           │
│  • 책 등록 직후: 첫 기록 작성 유도                           │
│  • 완독 직후: 서평 작성 + 다음 책 추천                       │
│  • 스트릭 위험: 간단한 활동 제안                             │
│                                                             │
│  위젯 자동 배치:                                             │
│  • 자주 사용하는 위젯 상단 배치                              │
│  • 미사용 위젯 자동 숨김 제안                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 구현 가이드

### 4.1 기술 요구사항

| 기능 | 필요 기술 | 비고 |
|------|----------|------|
| 드래그 앤 드롭 | @dnd-kit/core | 위젯 정렬 |
| 캐싱 | @tanstack/react-query | - |
| 반응형 그리드 | CSS Grid | - |

### 4.2 마이그레이션 계획

```sql
-- 사용자 대시보드 설정
CREATE TABLE user_dashboard_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  widgets JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. 성공 지표 (KPIs)

| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|----------|
| **대시보드 조회율** | - | 80% | DAU 대비 |
| **위젯 상호작용** | - | 3회/방문 | 클릭/액션 수 |
| **페이지 로드 시간** | - | <1초 | p95 기준 |
| **커스터마이징 사용** | - | 30% | 설정 변경 사용자 |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2026-01-30 | 최초 작성 |

---

*관련 문서: [메인 계획서](../MODULE_ENHANCEMENT_PLAN.md) | [Profile 모듈](./05-profile.md) | [Points 모듈](./08-points.md)*
