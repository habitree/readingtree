# 접근성 고도화 계획

> **영역**: 웹 접근성 (WCAG 2.1)
> **우선순위**: 🟡 중간
> **Phase**: 2-3 (기능 강화 단계)

---

## 1. 현황 분석

### 1.1 현재 상태

| 영역 | 현재 상태 | WCAG 수준 |
|------|----------|----------|
| **키보드 접근성** | Radix UI 기본 지원 | AA 부분 충족 |
| **스크린 리더** | ARIA 일부 적용 | A 수준 |
| **색상 대비** | 기본 | 미검증 |
| **텍스트 크기** | 고정 | 조정 불가 |

### 1.2 WCAG 2.1 준수 목표

```
WCAG 2.1 Level AA 달성 목표
═══════════════════════════════════════════════════════════

  ✅ Level A (필수)
  ├── 1.1 텍스트 대안
  ├── 1.3 적응 가능
  ├── 1.4 구별 가능
  ├── 2.1 키보드 접근
  ├── 2.4 탐색 가능
  ├── 3.1 읽기 가능
  └── 4.1 호환성

  🎯 Level AA (목표)
  ├── 1.4.3 색상 대비 (4.5:1)
  ├── 1.4.4 텍스트 크기 조정 (200%)
  ├── 1.4.10 리플로우
  ├── 1.4.11 비텍스트 대비
  └── 2.4.7 포커스 표시

═══════════════════════════════════════════════════════════
```

---

## 2. 개선 영역

### 2.1 키보드 네비게이션

#### 현재 문제점
- 일부 커스텀 컴포넌트 키보드 접근 불가
- 포커스 순서 불명확
- 포커스 트랩 미구현 (모달)

#### 개선 계획

```typescript
// 포커스 관리 훅
function useFocusTrap(ref: RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !ref.current) return;

    const focusableElements = ref.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, ref]);
}

// Skip Link 컴포넌트
function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:p-4 focus:rounded-md"
    >
      본문으로 건너뛰기
    </a>
  );
}
```

### 2.2 스크린 리더 지원

#### ARIA 개선 가이드

```typescript
// 동적 콘텐츠 알림
function LiveRegion({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// 진행률 표시
function ReadingProgress({ book }: { book: Book }) {
  const progress = Math.round((book.currentPage / book.totalPages) * 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${book.title} 읽기 진행률`}
    >
      <span className="sr-only">{progress}% 완료</span>
      <div
        className="h-2 bg-primary rounded-full"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// 아이콘 버튼
function IconButton({ icon: Icon, label, ...props }: IconButtonProps) {
  return (
    <Button {...props} aria-label={label}>
      <Icon className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
}
```

### 2.3 색상 및 대비

#### 색상 대비 검증

```typescript
// 색상 대비 검증 유틸리티
function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// WCAG AA 기준
const CONTRAST_REQUIREMENTS = {
  normalText: 4.5,
  largeText: 3,
  uiComponents: 3,
};

// 테마 색상 검증
const themeColors = {
  text: {
    primary: '#171717',    // 검정
    secondary: '#737373',  // 회색
    muted: '#a3a3a3',      // 밝은 회색
  },
  background: {
    primary: '#ffffff',
    secondary: '#f5f5f5',
  },
};

// 모든 조합 검증
Object.entries(themeColors.text).forEach(([name, color]) => {
  const ratio = getContrastRatio(color, themeColors.background.primary);
  console.log(`${name}: ${ratio.toFixed(2)}:1 ${ratio >= 4.5 ? '✅' : '❌'}`);
});
```

#### 고대비 테마

```typescript
// CSS 변수 기반 고대비 모드
:root {
  --foreground: 0 0% 9%;
  --background: 0 0% 100%;
  --muted: 0 0% 45%;
}

[data-high-contrast="true"] {
  --foreground: 0 0% 0%;
  --background: 0 0% 100%;
  --muted: 0 0% 25%;

  /* 테두리 강화 */
  --border-width: 2px;

  /* 포커스 링 강화 */
  --ring-width: 3px;
}

// 고대비 토글
function HighContrastToggle() {
  const [highContrast, setHighContrast] = useLocalStorage('high-contrast', false);

  useEffect(() => {
    document.documentElement.dataset.highContrast = String(highContrast);
  }, [highContrast]);

  return (
    <Switch
      checked={highContrast}
      onCheckedChange={setHighContrast}
      aria-label="고대비 모드"
    />
  );
}
```

### 2.4 텍스트 크기 조정

```typescript
// 글꼴 크기 설정
const fontSizes = {
  small: { base: '14px', scale: 0.875 },
  medium: { base: '16px', scale: 1 },
  large: { base: '18px', scale: 1.125 },
  xlarge: { base: '20px', scale: 1.25 },
};

function FontSizeSelector() {
  const [fontSize, setFontSize] = useLocalStorage('font-size', 'medium');

  useEffect(() => {
    const size = fontSizes[fontSize as keyof typeof fontSizes];
    document.documentElement.style.setProperty('--base-font-size', size.base);
    document.documentElement.style.setProperty('--font-scale', String(size.scale));
  }, [fontSize]);

  return (
    <RadioGroup value={fontSize} onValueChange={setFontSize}>
      <div className="flex gap-4">
        {Object.entries(fontSizes).map(([key, { base }]) => (
          <div key={key} className="flex items-center gap-2">
            <RadioGroupItem value={key} id={key} />
            <label htmlFor={key} style={{ fontSize: base }}>
              가나다
            </label>
          </div>
        ))}
      </div>
    </RadioGroup>
  );
}

// 반응형 폰트 크기
body {
  font-size: calc(var(--base-font-size) * var(--font-scale));
}

h1 { font-size: calc(2rem * var(--font-scale)); }
h2 { font-size: calc(1.5rem * var(--font-scale)); }
h3 { font-size: calc(1.25rem * var(--font-scale)); }
p { font-size: calc(1rem * var(--font-scale)); }
```

### 2.5 모션 및 애니메이션

```typescript
// 모션 감소 모드 지원
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

// 프로그래매틱 제어
function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}

// 애니메이션 조건부 적용
function AnimatedCard({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

---

## 3. 접근성 설정 패널

```typescript
function AccessibilitySettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Accessibility className="h-5 w-5" />
          접근성 설정
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 시각 설정 */}
        <section>
          <h3 className="font-medium mb-4">시각</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>고대비 모드</Label>
              <HighContrastToggle />
            </div>
            <div>
              <Label>글꼴 크기</Label>
              <FontSizeSelector />
            </div>
            <div className="flex items-center justify-between">
              <Label>색맹 보정 모드</Label>
              <ColorBlindnessSelector />
            </div>
          </div>
        </section>

        {/* 모션 설정 */}
        <section>
          <h3 className="font-medium mb-4">모션</h3>
          <div className="flex items-center justify-between">
            <Label>애니메이션 줄이기</Label>
            <ReducedMotionToggle />
          </div>
        </section>

        {/* 소리 설정 */}
        <section>
          <h3 className="font-medium mb-4">소리</h3>
          <div className="flex items-center justify-between">
            <Label>알림 효과음</Label>
            <SoundEffectsToggle />
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
```

---

## 4. 테스트 전략

### 4.1 자동화 테스트

```typescript
// 접근성 테스트 (axe-core)
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('BookCard should have no accessibility violations', async () => {
    const { container } = render(<BookCard book={mockBook} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('NoteEditor should have no accessibility violations', async () => {
    const { container } = render(<NoteEditor />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 4.2 수동 테스트 체크리스트

```markdown
## 키보드 테스트
- [ ] Tab으로 모든 인터랙티브 요소 접근 가능
- [ ] Enter/Space로 버튼/링크 활성화
- [ ] Escape로 모달/드롭다운 닫기
- [ ] 방향키로 목록/탭 탐색
- [ ] 포커스 순서가 논리적

## 스크린 리더 테스트 (NVDA/VoiceOver)
- [ ] 모든 이미지에 대체 텍스트
- [ ] 폼 필드에 레이블
- [ ] 에러 메시지 읽어줌
- [ ] 동적 콘텐츠 변경 알림
- [ ] 랜드마크 구조 적절

## 시각 테스트
- [ ] 200% 확대 시 콘텐츠 사용 가능
- [ ] 색상 없이도 정보 전달
- [ ] 충분한 색상 대비
- [ ] 포커스 표시 명확
```

---

## 5. 구현 로드맵

### Phase 1: 기본 접근성

```
Week 1-2:
├── Skip Link 추가
├── 포커스 관리 개선
├── ARIA 레이블 추가
└── 색상 대비 검증 및 수정
```

### Phase 2: 고급 접근성

```
Week 3-4:
├── 접근성 설정 패널
├── 고대비 테마
├── 글꼴 크기 조정
└── 모션 감소 지원
```

### Phase 3: 테스트 및 검증

```
Week 5-6:
├── axe-core 자동화 테스트
├── 스크린 리더 테스트
├── WCAG 준수 검증
└── 문서화
```

---

## 6. 성공 지표

| 지표 | 현재 | 목표 |
|------|------|------|
| WCAG 준수 수준 | A 부분 | AA 완전 |
| axe 위반 | 미측정 | 0 |
| 키보드 접근성 | 70% | 100% |
| 색상 대비 | 미검증 | 4.5:1+ |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2026-01-30 | 최초 작성 |

---

*관련 문서: [메인 계획서](../MODULE_ENHANCEMENT_PLAN.md) | [품질](./QUALITY.md)*
