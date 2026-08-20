# Onboarding 모듈 고도화 계획

> **모듈**: onboarding
> **현재 규모**: ~400 LOC
> **성숙도**: ⭐⭐⭐⭐ (4/5)
> **우선순위**: 🟢 낮음

---

## 1. 현황 분석

### 1.1 핵심 기능

| 기능 | 설명 | 상태 |
|------|------|------|
| 3단계 위저드 | 프로필/관심사/목표 | ✅ 완료 |
| 프로필 설정 | 닉네임, 아바타 | ✅ 완료 |
| 관심 장르 선택 | 다중 선택 | ✅ 완료 |
| 독서 목표 설정 | 연간/월간 목표 | ✅ 완료 |

### 1.2 기술 구조

```
app/(auth)/onboarding/
├── page.tsx                  # 온보딩 페이지
└── components/
    ├── OnboardingWizard.tsx  # 위저드 컨테이너
    ├── ProfileStep.tsx       # 프로필 단계
    ├── InterestStep.tsx      # 관심사 단계
    └── GoalStep.tsx          # 목표 단계
```

### 1.3 데이터 모델

```sql
-- profiles 테이블에 온보딩 데이터 저장
profiles (
  ...,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  favorite_genres TEXT[],
  reading_goal INTEGER
)
```

---

## 2. 관점별 분석

### 2.1 핵심 기능 강화

| 항목 | 현재 | 목표 | 우선순위 | 복잡도 |
|------|------|------|---------|--------|
| **진행률 표시** | 기본 | 시각적 강화 | 🟡 중간 | ⭐ |
| **스킵 옵션** | 없음 | 나중에 하기 | 🟡 중간 | ⭐ |
| **데이터 검증** | 기본 | 실시간 검증 | 🟢 낮음 | ⭐ |

### 2.2 확장성/창의성

| 아이디어 | 설명 | 가치 | 실현성 | 분류 |
|----------|------|------|--------|------|
| **개인화 추천** | 관심사 기반 추천 | 높음 | 중간 | 💡 아이디어 |
| **인터랙티브 튜토리얼** | 기능 가이드 | 높음 | 중간 | 🔮 장기 |
| **A/B 테스트** | 온보딩 최적화 | 중간 | 중간 | 💡 아이디어 |
| **소셜 연결** | 친구 찾기 | 낮음 | 중간 | 🔮 장기 |

#### 상세: 인터랙티브 튜토리얼

```typescript
interface TutorialStep {
  id: string;
  target: string;       // CSS 선택자
  title: string;
  content: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    label: string;
    onClick: () => void;
  };
}

const appTutorial: TutorialStep[] = [
  {
    id: 'add-book',
    target: '[data-tutorial="add-book"]',
    title: '책 추가하기',
    content: '읽고 있거나 읽고 싶은 책을 추가해보세요. 검색하거나 직접 입력할 수 있어요.',
    placement: 'bottom',
    action: {
      label: '책 추가해보기',
      onClick: () => openAddBookDialog(),
    },
  },
  {
    id: 'write-note',
    target: '[data-tutorial="write-note"]',
    title: '기록 작성하기',
    content: '인상 깊은 구절이나 생각을 기록해보세요. 나중에 다시 찾아볼 수 있어요.',
    placement: 'bottom',
  },
  // ...
];

function TutorialOverlay({ steps, onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50">
      {/* 하이라이트 영역 */}
      <div className="absolute bg-black/50" style={calculateOverlay(step.target)} />

      {/* 튜토리얼 카드 */}
      <Card
        className="absolute w-80"
        style={calculatePosition(step.target, step.placement)}
      >
        <CardHeader>
          <CardTitle>{step.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{step.content}</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={() => onComplete()}>
            건너뛰기
          </Button>
          <Button onClick={() => {
            if (currentStep < steps.length - 1) {
              setCurrentStep(currentStep + 1);
            } else {
              onComplete();
            }
          }}>
            {currentStep < steps.length - 1 ? '다음' : '완료'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
```

### 2.3 기술 품질

| 항목 | 현재 상태 | 목표 | 액션 |
|------|----------|------|------|
| **테스트** | 0% | 80% | E2E 테스트 |
| **분석** | 없음 | 단계별 이탈률 | 이벤트 추적 |
| **접근성** | 기본 | 완전 지원 | ARIA 개선 |

### 2.4 통합/연동

| 연동 대상 | 유형 | 데이터 흐름 | 우선순위 |
|----------|------|------------|---------|
| **profile** | 내부 | 프로필 초기화 | ✅ 완료 |
| **persona** | 내부 | 초기 페르소나 | 🟢 낮음 |
| **analytics** | 외부 | 이벤트 추적 | 🟡 중간 |

---

## 3. 고도화 항목 상세

### 3.1 단기 개선 (Quick Wins)

#### QW-01: 진행률 표시 강화

```typescript
function OnboardingProgress({ currentStep, totalSteps }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>시작하기</span>
        <span>{currentStep} / {totalSteps}</span>
      </div>
      <div className="flex gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-2 flex-1 rounded-full transition-colors',
              i < currentStep
                ? 'bg-primary'
                : i === currentStep
                ? 'bg-primary/50'
                : 'bg-muted'
            )}
          />
        ))}
      </div>
    </div>
  );
}
```

#### QW-02: 스킵 옵션

```typescript
function OnboardingSkipOption({ onSkip }: { onSkip: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm">
          나중에 하기
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>설정을 건너뛰시겠어요?</AlertDialogTitle>
          <AlertDialogDescription>
            언제든지 설정에서 다시 진행할 수 있어요.
            하지만 지금 완료하면 맞춤 추천을 받을 수 있어요!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>계속하기</AlertDialogCancel>
          <AlertDialogAction onClick={onSkip}>
            건너뛰기
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### 3.2 중기 개선 (Planned)

#### PL-01: 온보딩 분석

```typescript
// 온보딩 이벤트 추적
const trackOnboardingEvent = (event: OnboardingEvent) => {
  analytics.track(event.type, {
    step: event.step,
    duration: event.duration,
    completed: event.completed,
    skipped: event.skipped,
  });
};

// 분석 대시보드 (관리자용)
interface OnboardingMetrics {
  totalStarts: number;
  completionRate: number;
  avgDuration: number;
  dropOffByStep: { step: number; rate: number }[];
  popularGenres: { genre: string; count: number }[];
  avgGoal: number;
}
```

### 3.3 장기 비전 (Vision)

#### VS-01: 개인화된 시작 경험

```
┌─────────────────────────────────────────────────────────────┐
│                    맞춤형 온보딩                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  신규 사용자 유형 감지:                                      │
│  • 열정적 독서가 → 고급 기능 안내                           │
│  • 독서 입문자 → 기본 기능 집중                             │
│  • 기록 중심 → 노트 기능 강조                               │
│  • 소셜 지향 → 그룹 기능 안내                               │
│                                                             │
│  온보딩 후 액션:                                             │
│  1. 관심 장르 기반 책 추천 3권                              │
│  2. 인기 독서모임 추천                                       │
│  3. 첫 책 등록 미션 제공                                     │
│  4. 튜토리얼 시작 제안                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 구현 가이드

### 4.1 기술 요구사항

| 기능 | 필요 기술 | 비고 |
|------|----------|------|
| 튜토리얼 | react-joyride 또는 커스텀 | - |
| 분석 | Mixpanel 또는 GA4 | - |

### 4.2 마이그레이션 계획

```sql
-- 온보딩 상태 확장
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tutorial_completed BOOLEAN DEFAULT FALSE;
```

---

## 5. 성공 지표 (KPIs)

| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|----------|
| **완료율** | - | 80% | 시작 → 완료 비율 |
| **평균 소요 시간** | - | 2분 | 완료까지 시간 |
| **첫 주 리텐션** | - | 60% | 온보딩 완료 후 7일 |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2026-01-30 | 최초 작성 |

---

*관련 문서: [메인 계획서](../MODULE_ENHANCEMENT_PLAN.md) | [Profile 모듈](./05-profile.md) | [Dashboard 모듈](./12-dashboard.md)*
