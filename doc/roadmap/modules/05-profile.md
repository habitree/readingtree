# Profile 모듈 고도화 계획

> **모듈**: profile
> **현재 규모**: ~300 LOC
> **성숙도**: ⭐⭐⭐ (3/5)
> **우선순위**: 🟡 중간

---

## 1. 현황 분석

### 1.1 핵심 기능

| 기능 | 설명 | 상태 |
|------|------|------|
| 프로필 CRUD | 닉네임, 아바타 등 | ✅ 완료 |
| 기본 통계 | 책/기록 수 | ✅ 완료 |
| 프로필 사진 | 이미지 업로드 | ✅ 완료 |

### 1.2 기술 구조

```
app/actions/profile.ts        # Server Actions
├── getProfile()
├── updateProfile()
└── uploadAvatar()

app/(main)/profile/
├── page.tsx                  # 프로필 페이지
└── edit/page.tsx             # 편집 페이지

components/profile/
├── ProfileCard.tsx
├── ProfileStats.tsx
└── AvatarUpload.tsx
```

### 1.3 데이터 모델

```sql
profiles (
  id, user_id, display_name, bio,
  avatar_url, reading_goal, created_at
)
```

---

## 2. 관점별 분석

### 2.1 핵심 기능 강화

| 항목 | 현재 | 목표 | 우선순위 | 복잡도 |
|------|------|------|---------|--------|
| **독서 통계 강화** | 기본 수치 | 상세 분석 | 🔴 높음 | ⭐⭐ |
| **프로필 공개 설정** | 없음 | 공개/비공개 | 🟡 중간 | ⭐ |
| **관심 장르** | 없음 | 장르 태그 | 🟡 중간 | ⭐ |
| **SNS 링크** | 없음 | 소셜 링크 | 🟢 낮음 | ⭐ |

#### 상세: 독서 통계 강화

```typescript
interface ReadingStats {
  // 기본 통계
  totalBooks: number;
  completedBooks: number;
  totalNotes: number;
  totalPages: number;

  // 기간별 통계
  thisMonth: {
    books: number;
    pages: number;
    notes: number;
  };
  thisYear: {
    books: number;
    pages: number;
    notes: number;
  };

  // 분석
  avgPagesPerBook: number;
  avgDaysToFinish: number;
  favoriteGenres: { genre: string; count: number }[];
  readingByMonth: { month: string; books: number }[];

  // 스트릭
  currentStreak: number;
  longestStreak: number;
}
```

### 2.2 확장성/창의성

| 아이디어 | 설명 | 가치 | 실현성 | 분류 |
|----------|------|------|--------|------|
| **독서 성장 리포트** | 월간/연간 리포트 | 높음 | 높음 | 🚀 즉시 |
| **독서 히트맵** | GitHub 스타일 | 높음 | 높음 | 🚀 즉시 |
| **독서 타입 배지** | 독서 성향 표시 | 중간 | 높음 | 💡 아이디어 |
| **공개 프로필** | 링크 공유 가능 | 중간 | 중간 | 🔮 장기 |
| **팔로우 시스템** | 소셜 기능 | 높음 | 중간 | 🔮 장기 |

#### 상세: 독서 히트맵

```typescript
// components/profile/ReadingHeatmap.tsx
function ReadingHeatmap({ data }: { data: DailyActivity[] }) {
  // 365일 히트맵 데이터
  const heatmapData = useMemo(() => {
    const last365Days = generateLast365Days();
    return last365Days.map(date => ({
      date,
      count: data.find(d => isSameDay(d.date, date))?.count || 0,
    }));
  }, [data]);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-muted';
    if (count <= 1) return 'bg-green-200';
    if (count <= 3) return 'bg-green-400';
    if (count <= 5) return 'bg-green-600';
    return 'bg-green-800';
  };

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-rows-7 grid-flow-col gap-1">
        {heatmapData.map((day, i) => (
          <Tooltip key={i} content={`${format(day.date, 'yyyy-MM-dd')}: ${day.count}건`}>
            <div className={cn('w-3 h-3 rounded-sm', getColor(day.count))} />
          </Tooltip>
        ))}
      </div>
      <div className="flex justify-end gap-1 mt-2">
        <span className="text-xs">Less</span>
        {[0, 1, 3, 5, 7].map(n => (
          <div key={n} className={cn('w-3 h-3 rounded-sm', getColor(n))} />
        ))}
        <span className="text-xs">More</span>
      </div>
    </div>
  );
}
```

### 2.3 기술 품질

| 항목 | 현재 상태 | 목표 | 액션 |
|------|----------|------|------|
| **테스트 커버리지** | 0% | 70% | 테스트 작성 |
| **캐싱** | 없음 | 통계 캐싱 | React Query |
| **이미지 최적화** | 기본 | 리사이즈/압축 | sharp |

### 2.4 통합/연동

| 연동 대상 | 유형 | 데이터 흐름 | 우선순위 |
|----------|------|------------|---------|
| **books 모듈** | 내부 | 통계 집계 | ✅ 완료 |
| **notes 모듈** | 내부 | 기록 수 집계 | ✅ 완료 |
| **points 모듈** | 내부 | 레벨/포인트 표시 | 🟡 중간 |
| **SNS 공유** | 외부 | 프로필/통계 공유 | 🟢 낮음 |

---

## 3. 고도화 항목 상세

### 3.1 단기 개선 (Quick Wins)

#### QW-01: 통계 카드 개선

```typescript
function EnhancedProfileStats({ userId }: { userId: string }) {
  const { data: stats } = useProfileStats(userId);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        label="완독한 책"
        value={stats.completedBooks}
        icon={<BookCheck />}
        trend={stats.thisMonth.books > stats.lastMonth.books ? 'up' : 'down'}
      />
      <StatCard
        label="읽은 페이지"
        value={stats.totalPages.toLocaleString()}
        icon={<FileText />}
      />
      <StatCard
        label="작성한 기록"
        value={stats.totalNotes}
        icon={<PenLine />}
      />
      <StatCard
        label="독서 스트릭"
        value={`${stats.currentStreak}일`}
        icon={<Flame />}
        highlight={stats.currentStreak >= 7}
      />
    </div>
  );
}
```

### 3.2 중기 개선 (Planned)

#### PL-01: 독서 성장 리포트

```typescript
interface MonthlyReport {
  period: { year: number; month: number };
  summary: {
    booksRead: number;
    pagesRead: number;
    notesWritten: number;
    avgPagesPerDay: number;
  };
  highlights: {
    longestBook: Book;
    mostNotedBook: Book;
    favoriteGenre: string;
  };
  comparison: {
    vsPrevMonth: number; // percentage
    vsAverage: number;
  };
  insights: string[]; // AI 생성 인사이트
}

function MonthlyReportCard({ report }: { report: MonthlyReport }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">
        {report.period.year}년 {report.period.month}월 독서 리포트
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatItem label="읽은 책" value={report.summary.booksRead} />
        <StatItem label="읽은 페이지" value={report.summary.pagesRead} />
        <StatItem label="작성한 기록" value={report.summary.notesWritten} />
        <StatItem label="일 평균 페이지" value={report.summary.avgPagesPerDay} />
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">이달의 하이라이트</h4>
        <p>가장 긴 책: {report.highlights.longestBook.title}</p>
        <p>가장 많이 기록한 책: {report.highlights.mostNotedBook.title}</p>
        <p>선호 장르: {report.highlights.favoriteGenre}</p>
      </div>

      {report.insights.length > 0 && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <h4 className="font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> AI 인사이트
          </h4>
          <ul className="mt-2 space-y-1">
            {report.insights.map((insight, i) => (
              <li key={i} className="text-sm">{insight}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
```

### 3.3 장기 비전 (Vision)

#### VS-01: 공개 프로필 시스템

```
공개 프로필 URL: /u/{username}

┌─────────────────────────────────────────────────────────────┐
│                    공개 프로필 페이지                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────┐  닉네임                                           │
│  │ 아바타 │  @username                                       │
│  └──────┘  "한 줄 소개"                                      │
│                                                             │
│  ────────────────────────────────────────────────           │
│                                                             │
│  📚 완독 42권  |  📝 기록 156개  |  🔥 127일 스트릭          │
│                                                             │
│  [독서 히트맵]                                               │
│                                                             │
│  최근 읽은 책                                                │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                           │
│  │ 책1 │ │ 책2 │ │ 책3 │ │ 책4 │                           │
│  └─────┘ └─────┘ └─────┘ └─────┘                           │
│                                                             │
│  공개 기록                                                   │
│  • "이 구절이 인상적이었다..." - 책 제목                     │
│  • "저자의 관점에서..." - 책 제목                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 구현 가이드

### 4.1 기술 요구사항

| 기능 | 필요 패키지 | 비고 |
|------|------------|------|
| 히트맵 | 커스텀 구현 | CSS Grid |
| 차트 | recharts | 이미 설치됨 |
| 이미지 최적화 | sharp | 서버사이드 |

### 4.2 마이그레이션 계획

```sql
-- 프로필 확장 스키마
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private',
ADD COLUMN IF NOT EXISTS favorite_genres TEXT[],
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- 일일 활동 통계 테이블 (히트맵용)
CREATE TABLE daily_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL,
  books_read INTEGER DEFAULT 0,
  pages_read INTEGER DEFAULT 0,
  notes_written INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);
```

---

## 5. 성공 지표 (KPIs)

| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|----------|
| **프로필 완성률** | - | 80% | 필수 필드 입력 비율 |
| **통계 조회 빈도** | - | 주 2회 | 사용자당 평균 |
| **히트맵 활용** | - | 50% | 히트맵 보유 사용자 비율 |
| **리포트 공유** | - | 20% | 월간 리포트 공유 비율 |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2026-01-30 | 최초 작성 |

---

*관련 문서: [메인 계획서](../MODULE_ENHANCEMENT_PLAN.md) | [Points 모듈](./08-points.md) | [Dashboard 모듈](./12-dashboard.md)*
