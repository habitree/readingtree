# Books 모듈 고도화 계획

> **모듈**: books
> **현재 규모**: ~500 LOC
> **성숙도**: ⭐⭐⭐⭐ (4/5)
> **우선순위**: 🟡 중간

---

## 1. 현황 분석

### 1.1 핵심 기능

| 기능 | 설명 | 상태 |
|------|------|------|
| 책 CRUD | 책 추가/수정/삭제 | ✅ 완료 |
| 상태 관리 | 읽기 전/읽는 중/완료 | ✅ 완료 |
| 진행률 추적 | 페이지/퍼센트 기반 | ✅ 완료 |
| 카카오 API | 책 검색 및 정보 조회 | ✅ 완료 |
| 직접 입력 | 수동 책 등록 | ✅ 완료 |

### 1.2 기술 구조

```
app/actions/books.ts          # Server Actions
├── createBook()
├── updateBook()
├── deleteBook()
├── getBooks()
└── searchBooks()

components/books/
├── BookCard.tsx              # 책 카드 UI
├── BookSearchDialog.tsx      # 검색 다이얼로그
├── BookForm.tsx              # 책 등록 폼
└── BookStatusSelect.tsx      # 상태 선택

hooks/
└── useBooks.ts               # 책 관련 훅
```

### 1.3 데이터 모델

```sql
books (
  id, user_id, title, author, publisher,
  isbn, cover_image, total_pages, current_page,
  status, started_at, finished_at, created_at
)
```

---

## 2. 관점별 분석

### 2.1 핵심 기능 강화

| 항목 | 현재 | 목표 | 우선순위 | 복잡도 |
|------|------|------|---------|--------|
| **ISBN 바코드 스캔** | 없음 | 카메라로 ISBN 인식 | 🔴 높음 | ⭐⭐ |
| **진행률 입력 개선** | 수동 입력 | 슬라이더 + 빠른 입력 | 🔴 높음 | ⭐ |
| **낙관적 업데이트** | 없음 | 즉각적 UI 반영 | 🟡 중간 | ⭐⭐ |
| **책 정보 자동 보완** | 일부 | 여러 API 소스 통합 | 🟢 낮음 | ⭐⭐ |
| **중복 책 감지** | 없음 | ISBN 기반 중복 경고 | 🟢 낮음 | ⭐ |

#### 상세: ISBN 바코드 스캔

```typescript
// 구현 방향
interface BarcodeScannerProps {
  onScan: (isbn: string) => void;
  onError: (error: Error) => void;
}

// 기술 스택
// - @aspect-analytics/web-barcode-scanner
// - 또는 QuaggaJS
// - 모바일 카메라 API 활용
```

### 2.2 확장성/창의성

| 아이디어 | 설명 | 가치 | 실현성 | 분류 |
|----------|------|------|--------|------|
| **오디오북 연동** | Audible, 밀리의서재 연동 | 높음 | 중간 | 🔮 장기 |
| **전자책 플랫폼 연동** | 리디북스, 예스24 | 높음 | 중간 | 🔮 장기 |
| **읽기 목표 설정** | 일/주/월 목표 | 높음 | 높음 | 🚀 즉시 |
| **독서 타이머** | 실제 독서 시간 측정 | 중간 | 높음 | 💡 아이디어 |
| **책 위시리스트** | 읽고 싶은 책 관리 | 중간 | 높음 | 🚀 즉시 |
| **시리즈 관리** | 시리즈물 그룹핑 | 중간 | 중간 | 💡 아이디어 |

#### 상세: 읽기 목표 설정

```typescript
interface ReadingGoal {
  id: string;
  user_id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  target_books?: number;
  target_pages?: number;
  target_minutes?: number;
  period_start: Date;
  period_end: Date;
  progress: number;
}

// UI 컴포넌트
// - GoalSettingDialog
// - GoalProgressCard
// - GoalAchievementBadge
```

### 2.3 기술 품질

| 항목 | 현재 상태 | 목표 | 액션 |
|------|----------|------|------|
| **테스트 커버리지** | 0% | 80% | 유닛/통합 테스트 작성 |
| **타입 안전성** | 양호 | 우수 | Zod 스키마 강화 |
| **에러 처리** | 기본 | 표준화 | Error Boundary 적용 |
| **로딩 상태** | 기본 | 스켈레톤 UI | 로딩 UX 개선 |
| **캐싱** | 없음 | SWR/React Query | 캐싱 전략 적용 |

#### 테스트 전략

```typescript
// 유닛 테스트 (Vitest)
describe('books actions', () => {
  it('should create a book with valid data', async () => {
    const result = await createBook(validBookData);
    expect(result.success).toBe(true);
  });

  it('should validate ISBN format', () => {
    expect(isValidISBN('9788934972464')).toBe(true);
    expect(isValidISBN('invalid')).toBe(false);
  });
});

// 통합 테스트 (Testing Library)
describe('BookSearchDialog', () => {
  it('should search books and display results', async () => {
    render(<BookSearchDialog />);
    await userEvent.type(screen.getByRole('searchbox'), '클린 코드');
    await waitFor(() => {
      expect(screen.getByText('클린 코드')).toBeInTheDocument();
    });
  });
});
```

### 2.4 통합/연동

| 연동 대상 | 유형 | 데이터 흐름 | 우선순위 |
|----------|------|------------|---------|
| **notes 모듈** | 내부 | book_id로 기록 연결 | ✅ 완료 |
| **bookshelves 모듈** | 내부 | 서재별 책 분류 | ✅ 완료 |
| **points 모듈** | 내부 | 책 완독 시 포인트 | ✅ 완료 |
| **국립중앙도서관 API** | 외부 | 추가 책 정보 조회 | 🟡 중간 |
| **알라딘 API** | 외부 | 가격/리뷰 정보 | 🟢 낮음 |
| **굿리즈 API** | 외부 | 글로벌 평점/리뷰 | 🟢 낮음 |

#### 외부 API 연동 설계

```typescript
// 도서 정보 통합 서비스
interface BookInfoProvider {
  search(query: string): Promise<BookSearchResult[]>;
  getByISBN(isbn: string): Promise<BookInfo | null>;
}

class UnifiedBookService {
  private providers: BookInfoProvider[];

  async search(query: string): Promise<BookSearchResult[]> {
    const results = await Promise.allSettled(
      this.providers.map(p => p.search(query))
    );
    return this.mergeAndDedup(results);
  }

  async enrichBookInfo(book: Book): Promise<EnrichedBook> {
    // 여러 소스에서 정보를 조합
  }
}
```

---

## 3. 고도화 항목 상세

### 3.1 단기 개선 (Quick Wins)

#### QW-01: 진행률 슬라이더

```typescript
// components/books/ProgressSlider.tsx
export function ProgressSlider({
  currentPage,
  totalPages,
  onUpdate
}: ProgressSliderProps) {
  return (
    <div className="space-y-2">
      <Slider
        value={[currentPage]}
        max={totalPages}
        step={1}
        onValueChange={([page]) => onUpdate(page)}
      />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{currentPage}p</span>
        <span>{Math.round((currentPage / totalPages) * 100)}%</span>
        <span>{totalPages}p</span>
      </div>
    </div>
  );
}
```

#### QW-02: 빠른 진행률 버튼

```typescript
// 10%, 25%, 50%, 75%, 100% 빠른 설정 버튼
const quickProgress = [10, 25, 50, 75, 100];

<div className="flex gap-2">
  {quickProgress.map(percent => (
    <Button
      key={percent}
      variant="outline"
      size="sm"
      onClick={() => setProgress(Math.round(totalPages * percent / 100))}
    >
      {percent}%
    </Button>
  ))}
</div>
```

### 3.2 중기 개선 (Planned)

#### PL-01: ISBN 바코드 스캔

**기술 요구사항:**
- 웹 카메라 API (navigator.mediaDevices)
- 바코드 인식 라이브러리 (QuaggaJS)
- 모바일 최적화

**구현 계획:**
1. 바코드 스캐너 컴포넌트 개발
2. 카메라 권한 흐름 구현
3. ISBN 인식 → 책 검색 연동
4. 폴백 (수동 ISBN 입력)

#### PL-02: 낙관적 업데이트

```typescript
// hooks/useOptimisticBooks.ts
function useOptimisticBooks() {
  const queryClient = useQueryClient();

  const updateProgress = useMutation({
    mutationFn: updateBookProgress,
    onMutate: async (newProgress) => {
      await queryClient.cancelQueries(['books']);
      const previous = queryClient.getQueryData(['books']);

      queryClient.setQueryData(['books'], (old) =>
        old.map(book =>
          book.id === newProgress.bookId
            ? { ...book, currentPage: newProgress.page }
            : book
        )
      );

      return { previous };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(['books'], context.previous);
      toast.error('업데이트 실패');
    },
    onSettled: () => {
      queryClient.invalidateQueries(['books']);
    },
  });

  return { updateProgress };
}
```

### 3.3 장기 비전 (Vision)

#### VS-01: 오디오북/전자책 통합

```
┌─────────────────────────────────────────────────────────────┐
│                    통합 독서 경험                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📖 종이책     📱 전자책      🎧 오디오북                    │
│     │            │              │                          │
│     └────────────┼──────────────┘                          │
│                  ▼                                          │
│         ┌───────────────┐                                  │
│         │   통합 진행률   │                                 │
│         │   (하나의 책)  │                                  │
│         └───────────────┘                                  │
│                  │                                          │
│     ┌────────────┼────────────┐                            │
│     ▼            ▼            ▼                            │
│  페이지 진행   위치 동기화   청취 시간                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 구현 가이드

### 4.1 기술 요구사항

| 기능 | 필요 패키지 | 비고 |
|------|------------|------|
| 바코드 스캔 | quagga2 | 또는 @aspect-analytics/web-barcode-scanner |
| 캐싱 | @tanstack/react-query | 또는 swr |
| 테스트 | vitest, @testing-library/react | - |
| 슬라이더 | @radix-ui/react-slider | 이미 설치됨 |

### 4.2 마이그레이션 계획

```sql
-- migration: 책 목표 테이블 추가
CREATE TABLE IF NOT EXISTS reading_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly', 'yearly')),
  target_books INTEGER,
  target_pages INTEGER,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE reading_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own goals"
  ON reading_goals FOR ALL
  USING (auth.uid() = user_id);
```

### 4.3 테스트 전략

```
테스트 피라미드
═══════════════════════════════════════

        /\
       /  \        E2E (10%)
      /    \       - 책 등록 → 진행률 → 완독 플로우
     /──────\
    /        \     통합 (30%)
   /          \    - BookSearchDialog
  /            \   - BookForm 제출
 /──────────────\
/                \  유닛 (60%)
                   - createBook action
                   - ISBN 검증
                   - 상태 전환 로직
═══════════════════════════════════════
```

---

## 5. 성공 지표 (KPIs)

| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|----------|
| **책 등록 완료율** | - | 95% | 등록 시작 → 완료 비율 |
| **진행률 업데이트 빈도** | - | 주 3회 | 사용자당 평균 |
| **바코드 스캔 성공률** | - | 90% | 스캔 시도 → 성공 비율 |
| **API 응답 시간** | - | <200ms | p95 기준 |
| **테스트 커버리지** | 0% | 80% | Vitest coverage |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2026-01-30 | 최초 작성 |

---

*관련 문서: [메인 계획서](../MODULE_ENHANCEMENT_PLAN.md) | [Notes 모듈](./02-notes.md)*
