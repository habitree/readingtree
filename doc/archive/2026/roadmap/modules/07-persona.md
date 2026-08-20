# Persona 모듈 고도화 계획

> **모듈**: persona
> **현재 규모**: ~400 LOC
> **성숙도**: ⭐⭐⭐ (3/5)
> **우선순위**: 🟢 낮음

---

## 1. 현황 분석

### 1.1 핵심 기능

| 기능 | 설명 | 상태 |
|------|------|------|
| 독서 패턴 분석 | AI 기반 성향 분석 | ✅ 완료 |
| 페르소나 생성 | 독서 타입 도출 | ✅ 완료 |
| 성향 시각화 | 레이더 차트 표시 | ✅ 완료 |

### 1.2 기술 구조

```
app/actions/persona.ts        # Server Actions
├── analyzeReadingPattern()
├── generatePersona()
└── getPersona()

components/persona/
├── PersonaCard.tsx
├── PersonaChart.tsx
└── PersonaInsights.tsx
```

### 1.3 데이터 모델

```sql
personas (
  id, user_id, type, traits, insights,
  analyzed_at, book_count, note_count
)
```

---

## 2. 관점별 분석

### 2.1 핵심 기능 강화

| 항목 | 현재 | 목표 | 우선순위 | 복잡도 |
|------|------|------|---------|--------|
| **분석 정확도** | 기본 | 다차원 분석 | 🟡 중간 | ⭐⭐ |
| **자동 갱신** | 수동 | 주기적 갱신 | 🟡 중간 | ⭐ |
| **분석 기준 확장** | 제한적 | 다양한 지표 | 🟢 낮음 | ⭐⭐ |

#### 상세: 다차원 분석

```typescript
interface ReadingDimensions {
  // 독서 스타일
  depth: number;       // 깊이 (기록 양)
  breadth: number;     // 폭 (장르 다양성)
  consistency: number; // 일관성 (스트릭)

  // 독서 패턴
  preferredTime: 'morning' | 'afternoon' | 'evening' | 'night';
  readingSpeed: 'slow' | 'moderate' | 'fast';
  noteStyle: 'quote' | 'summary' | 'thought' | 'mixed';

  // 관심 영역
  topGenres: string[];
  topAuthors: string[];
  topTopics: string[];
}

async function analyzeMultiDimensional(userId: string): Promise<ReadingDimensions> {
  const [books, notes, activities] = await Promise.all([
    getUserBooks(userId),
    getUserNotes(userId),
    getDailyActivities(userId),
  ]);

  return {
    depth: calculateDepth(notes),
    breadth: calculateBreadth(books),
    consistency: calculateConsistency(activities),
    preferredTime: analyzePreferredTime(activities),
    readingSpeed: analyzeReadingSpeed(books),
    noteStyle: analyzeNoteStyle(notes),
    topGenres: extractTopGenres(books),
    topAuthors: extractTopAuthors(books),
    topTopics: extractTopTopics(notes),
  };
}
```

### 2.2 확장성/창의성

| 아이디어 | 설명 | 가치 | 실현성 | 분류 |
|----------|------|------|--------|------|
| **독서 성향 매칭** | 비슷한 사용자 추천 | 높음 | 중간 | 🔮 장기 |
| **그룹 추천** | 성향에 맞는 그룹 | 중간 | 중간 | 💡 아이디어 |
| **도서 추천** | 성향 기반 추천 | 높음 | 중간 | 🚀 즉시 |
| **성장 추적** | 페르소나 변화 기록 | 중간 | 높음 | 💡 아이디어 |
| **페르소나 공유** | SNS 공유 카드 | 중간 | 높음 | 🚀 즉시 |

#### 상세: 도서 추천 시스템

```typescript
interface BookRecommendation {
  book: ExternalBook;
  matchScore: number;
  reasons: string[];
}

async function recommendBooksByPersona(
  persona: Persona
): Promise<BookRecommendation[]> {
  const prompt = `
사용자의 독서 성향:
- 타입: ${persona.type}
- 선호 장르: ${persona.traits.topGenres.join(', ')}
- 독서 스타일: ${persona.traits.noteStyle}
- 특징: ${persona.insights.join(', ')}

이 사용자에게 어울릴 것 같은 책 5권을 추천해주세요.
각 책에 대해 추천 이유도 함께 설명해주세요.
`;

  const response = await ai.chat({ prompt });
  return parseRecommendations(response.content);
}

// UI 컴포넌트
function PersonaBookRecommendations({ persona }: { persona: Persona }) {
  const { data: recommendations, isLoading } = useQuery(
    ['persona-recommendations', persona.id],
    () => recommendBooksByPersona(persona)
  );

  return (
    <Card>
      <CardHeader>
        <Sparkles className="text-primary" />
        <CardTitle>당신을 위한 추천</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton />
        ) : (
          <div className="space-y-4">
            {recommendations?.map((rec, i) => (
              <RecommendationCard key={i} recommendation={rec} />
            ))}
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
| **분석 성능** | 동기 | 백그라운드 | 큐 처리 |
| **캐싱** | 없음 | 분석 결과 캐싱 | 7일 캐시 |
| **테스트** | 0% | 70% | 테스트 작성 |

### 2.4 통합/연동

| 연동 대상 | 유형 | 데이터 흐름 | 우선순위 |
|----------|------|------------|---------|
| **books/notes** | 내부 | 분석 데이터 소스 | ✅ 완료 |
| **chat 모듈** | 내부 | 대화 스타일 반영 | 🟡 중간 |
| **dashboard** | 내부 | 페르소나 요약 표시 | 🟢 낮음 |

---

## 3. 고도화 항목 상세

### 3.1 단기 개선 (Quick Wins)

#### QW-01: 페르소나 공유 카드

```typescript
function PersonaShareCard({ persona }: { persona: Persona }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    // 예쁜 카드 디자인 렌더링
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 600, 400);

    // 페르소나 정보 렌더링
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(persona.type, 50, 100);

    // ... 차트, 통계 등 렌더링

    return canvas.toDataURL('image/png');
  };

  const handleShare = async () => {
    const imageUrl = await generateImage();
    // 네이티브 공유 또는 다운로드
    if (navigator.share) {
      await navigator.share({
        title: '나의 독서 페르소나',
        text: `나는 ${persona.type}입니다!`,
        url: window.location.href,
      });
    }
  };

  return (
    <>
      <canvas ref={canvasRef} width={600} height={400} className="hidden" />
      <Button onClick={handleShare}>
        <Share2 /> 공유하기
      </Button>
    </>
  );
}
```

### 3.2 중기 개선 (Planned)

#### PL-01: 페르소나 히스토리

```sql
-- 페르소나 변화 기록
CREATE TABLE persona_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  persona_type TEXT NOT NULL,
  dimensions JSONB NOT NULL,
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 월별 자동 기록 (cron job)
```

```typescript
function PersonaEvolution({ userId }: { userId: string }) {
  const { data: history } = usePersonaHistory(userId);

  return (
    <Card>
      <CardHeader>
        <TrendingUp />
        <CardTitle>독서 성향 변화</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={history}>
            <XAxis dataKey="month" />
            <YAxis />
            <Line dataKey="depth" name="깊이" stroke="#8884d8" />
            <Line dataKey="breadth" name="폭" stroke="#82ca9d" />
            <Line dataKey="consistency" name="일관성" stroke="#ffc658" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

### 3.3 장기 비전 (Vision)

#### VS-01: 독서 성향 기반 소셜 매칭

```
┌─────────────────────────────────────────────────────────────┐
│                    독서 친구 매칭                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  매칭 알고리즘:                                              │
│  1. 페르소나 유사도 계산                                     │
│  2. 관심 장르 중첩도                                         │
│  3. 독서 속도 유사성                                         │
│  4. 활동 시간대 유사성                                       │
│                                                             │
│  매칭 결과:                                                  │
│  ┌────────────────────────────────────────┐                │
│  │  👤 독서친구 A                          │                │
│  │  유사도: 87%                           │                │
│  │  공통 관심: 자기계발, 심리학             │                │
│  │  [프로필 보기] [팔로우]                 │                │
│  └────────────────────────────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 구현 가이드

### 4.1 기술 요구사항

| 기능 | 필요 기술 | 비고 |
|------|----------|------|
| 차트 | recharts | 이미 설치됨 |
| 이미지 생성 | Canvas API | 브라우저 내장 |
| 백그라운드 분석 | Supabase Edge Functions | 또는 cron |

### 4.2 마이그레이션 계획

```sql
-- 페르소나 확장 스키마
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS dimensions JSONB,
ADD COLUMN IF NOT EXISTS recommendations JSONB,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ;
```

---

## 5. 성공 지표 (KPIs)

| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|----------|
| **페르소나 생성률** | - | 70% | 생성한 사용자 비율 |
| **공유율** | - | 20% | 페르소나 공유 비율 |
| **추천 클릭률** | - | 30% | 추천 → 클릭 비율 |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2026-01-30 | 최초 작성 |

---

*관련 문서: [메인 계획서](../MODULE_ENHANCEMENT_PLAN.md) | [Chat 모듈](./06-chat.md) | [Profile 모듈](./05-profile.md)*
