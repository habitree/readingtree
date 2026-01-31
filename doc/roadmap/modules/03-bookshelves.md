# Bookshelves 모듈 고도화 계획

> **모듈**: bookshelves
> **현재 규모**: ~400 LOC
> **성숙도**: ⭐⭐⭐ (3/5)
> **우선순위**: 🟢 낮음

---

## 1. 현황 분석

### 1.1 핵심 기능

| 기능 | 설명 | 상태 |
|------|------|------|
| 다중 서재 | 여러 서재 생성/관리 | ✅ 완료 |
| 책 분류 | 서재에 책 추가/이동 | ✅ 완료 |
| 정렬 | 다양한 정렬 옵션 | ✅ 완료 |
| 필터링 | 상태별 필터 | ✅ 완료 |
| 기본 서재 | 시스템 기본 서재 | ✅ 완료 |

### 1.2 기술 구조

```
app/actions/bookshelves.ts    # Server Actions
├── createBookshelf()
├── updateBookshelf()
├── deleteBookshelf()
├── addBookToShelf()
└── removeBookFromShelf()

components/bookshelves/
├── BookshelfCard.tsx
├── BookshelfList.tsx
├── BookshelfDialog.tsx
└── ShelfSelector.tsx
```

### 1.3 데이터 모델

```sql
bookshelves (
  id, user_id, name, description,
  color, icon, is_default, sort_order, created_at
)

bookshelf_books (
  bookshelf_id, book_id, added_at
)
```

---

## 2. 관점별 분석

### 2.1 핵심 기능 강화

| 항목 | 현재 | 목표 | 우선순위 | 복잡도 |
|------|------|------|---------|--------|
| **드래그 앤 드롭 정렬** | 없음 | 서재/책 순서 조정 | 🔴 높음 | ⭐⭐ |
| **서재 아이콘/컬러** | 기본 | 커스터마이징 | 🟡 중간 | ⭐ |
| **책 다중 선택** | 단일 | 일괄 이동/삭제 | 🟡 중간 | ⭐ |
| **서재 통계** | 없음 | 책 수, 진행률 표시 | 🟢 낮음 | ⭐ |

#### 상세: 드래그 앤 드롭

```typescript
// @dnd-kit/core 사용
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function SortableBookshelves({ shelves }: { shelves: Bookshelf[] }) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      reorderBookshelves(active.id, over?.id);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={shelves} strategy={verticalListSortingStrategy}>
        {shelves.map(shelf => (
          <SortableShelfItem key={shelf.id} shelf={shelf} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

### 2.2 확장성/창의성

| 아이디어 | 설명 | 가치 | 실현성 | 분류 |
|----------|------|------|--------|------|
| **공유 서재** | 다른 사용자와 서재 공유 | 높음 | 중간 | 🔮 장기 |
| **스마트 서재** | 조건 기반 자동 분류 | 높음 | 중간 | 💡 아이디어 |
| **서재 템플릿** | 장르별 추천 서재 | 중간 | 높음 | 🚀 즉시 |
| **서재 목표** | 서재별 독서 목표 | 중간 | 높음 | 💡 아이디어 |
| **시각화 뷰** | 책장 3D 시각화 | 낮음 | 낮음 | 🔮 장기 |

#### 상세: 스마트 서재

```typescript
interface SmartShelfRule {
  id: string;
  field: 'status' | 'genre' | 'author' | 'rating' | 'pages';
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number;
}

interface SmartBookshelf extends Bookshelf {
  rules: SmartShelfRule[];
  is_smart: true;
}

// 스마트 서재 책 목록 조회
async function getSmartShelfBooks(rules: SmartShelfRule[]): Promise<Book[]> {
  let query = supabase.from('books').select();

  for (const rule of rules) {
    switch (rule.operator) {
      case 'equals':
        query = query.eq(rule.field, rule.value);
        break;
      case 'contains':
        query = query.ilike(rule.field, `%${rule.value}%`);
        break;
      // ...
    }
  }

  return query;
}
```

### 2.3 기술 품질

| 항목 | 현재 상태 | 목표 | 액션 |
|------|----------|------|------|
| **테스트 커버리지** | 0% | 70% | 테스트 작성 |
| **가상화** | 없음 | 큰 서재 최적화 | react-window |
| **캐싱** | 없음 | 서재 목록 캐싱 | React Query |
| **낙관적 UI** | 없음 | 즉각 반영 | useMutation |

### 2.4 통합/연동

| 연동 대상 | 유형 | 데이터 흐름 | 우선순위 |
|----------|------|------------|---------|
| **books 모듈** | 내부 | 책-서재 연결 | ✅ 완료 |
| **profile 모듈** | 내부 | 서재 통계 표시 | 🟢 낮음 |
| **소셜 공유** | 외부 | 서재 공개 링크 | 🟢 낮음 |

---

## 3. 고도화 항목 상세

### 3.1 단기 개선 (Quick Wins)

#### QW-01: 서재 아이콘 선택기

```typescript
const shelfIcons = [
  { icon: '📚', label: '기본' },
  { icon: '⭐', label: '즐겨찾기' },
  { icon: '📖', label: '읽는 중' },
  { icon: '✅', label: '완료' },
  { icon: '🎯', label: '목표' },
  { icon: '💡', label: '아이디어' },
];

function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {shelfIcons.map(({ icon, label }) => (
        <Button
          key={icon}
          variant={value === icon ? 'default' : 'outline'}
          onClick={() => onChange(icon)}
          title={label}
        >
          {icon}
        </Button>
      ))}
    </div>
  );
}
```

#### QW-02: 서재 통계 배지

```typescript
function BookshelfStats({ shelfId }: { shelfId: string }) {
  const { data: stats } = useBookshelfStats(shelfId);

  return (
    <div className="flex gap-2 text-sm text-muted-foreground">
      <Badge variant="secondary">{stats.totalBooks}권</Badge>
      <Badge variant="secondary">{stats.completedBooks} 완독</Badge>
      <Badge variant="secondary">{stats.avgProgress}% 진행</Badge>
    </div>
  );
}
```

### 3.2 중기 개선 (Planned)

#### PL-01: 드래그 앤 드롭 시스템

**구현 범위:**
1. 서재 순서 변경
2. 책 서재 간 이동
3. 책 순서 변경

**기술 스택:**
- @dnd-kit/core
- @dnd-kit/sortable
- @dnd-kit/utilities

### 3.3 장기 비전 (Vision)

#### VS-01: 공유 서재 시스템

```sql
-- 서재 공유 테이블
CREATE TABLE shared_bookshelves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bookshelf_id UUID REFERENCES bookshelves(id),
  shared_with UUID REFERENCES auth.users(id),
  permission TEXT CHECK (permission IN ('view', 'edit')),
  shared_at TIMESTAMPTZ DEFAULT NOW()
);

-- 공개 서재 설정
ALTER TABLE bookshelves
ADD COLUMN visibility TEXT DEFAULT 'private'
CHECK (visibility IN ('private', 'followers', 'public'));
```

---

## 4. 구현 가이드

### 4.1 기술 요구사항

| 기능 | 필요 패키지 |
|------|------------|
| 드래그 앤 드롭 | @dnd-kit/core, @dnd-kit/sortable |
| 가상화 | @tanstack/react-virtual |
| 아이콘 | lucide-react (이미 설치) |

### 4.2 마이그레이션 계획

```sql
-- 서재 확장 스키마
ALTER TABLE bookshelves
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '📚',
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6366f1',
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private';
```

---

## 5. 성공 지표 (KPIs)

| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|----------|
| **서재 생성률** | - | 사용자당 3개 | 평균 서재 수 |
| **분류 활용률** | - | 80% | 서재에 배치된 책 비율 |
| **드래그 앤 드롭 사용** | - | 50% | 순서 변경 이벤트 |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2026-01-30 | 최초 작성 |

---

*관련 문서: [메인 계획서](../MODULE_ENHANCEMENT_PLAN.md) | [Books 모듈](./01-books.md)*
