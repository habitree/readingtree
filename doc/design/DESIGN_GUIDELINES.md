# Habitree 디자인 가이드라인 - Do's & Don'ts

> 디자인 시스템 사용 시 따라야 할 규칙과 피해야 할 패턴을 정리한 문서입니다.

---

## 1. Typography

### Do's

```tsx
// 디자인 토큰 사용
import { typography } from "@/lib/design-tokens";

<h1 className={typography.pageTitle}>페이지 제목</h1>

// 또는 Heading 컴포넌트 사용 (권장)
import { Heading, Text } from "@/components/primitives";

<Heading level={1}>페이지 제목</Heading>
<Text variant="helper">도움말 텍스트</Text>
```

### Don'ts

```tsx
// ❌ 인라인 비표준 크기 사용 금지
<h1 className="text-[22px] font-bold">제목</h1>
<span className="text-[9px]">작은 글씨</span>
<p className="text-[11px]">중간 글씨</p>

// ❌ 의미론적 이름 없이 직접 클래스 사용
<h2 className="text-lg font-semibold">섹션</h2>  // sectionTitle 토큰 사용
```

### 허용된 크기

| 토큰 | 클래스 |
|------|--------|
| `typography.pageTitle` | `text-xl sm:text-2xl lg:text-3xl` |
| `typography.sectionTitle` | `text-lg sm:text-xl` |
| `typography.cardTitle` | `text-base sm:text-lg` |
| `typography.label` | `text-sm` |
| `typography.small` | `text-xs sm:text-sm` |
| `typography.tiny` | `text-[10px] sm:text-xs` |
| `typography.helper` | `text-xs` |
| `typography.errorText` | `text-xs` |

---

## 2. Spacing

### Do's

```tsx
import { spacing } from "@/lib/design-tokens";

// 토큰으로 간격 지정
<div className={spacing.pageSection}>...</div>

// Stack/Inline으로 간격 지정
<Stack gap="formField">...</Stack>
<Inline gap="listItem">...</Inline>
```

### Don'ts

```tsx
// ❌ 의미 없는 직접 간격 지정
<div className="space-y-3">...</div>  // spacing.pageSection 또는 Stack 사용
<div className="gap-2">...</div>       // Inline gap 사용
```

---

## 3. 카드 컴포넌트

### Do's

```tsx
// 새 카드 컴포넌트는 CardContainer 패턴 사용
import { CardContainer, CardImageSlot } from "@/components/patterns";

<CardContainer
  href={`/items/${item.id}`}
  ariaLabel={`${item.title} 상세 보기`}
  hoverable
  imageSlot={<CardImageSlot src={item.imageUrl} alt={item.title} />}
  contentSlot={<Heading level={3}>{item.title}</Heading>}
/>
```

### Don'ts

```tsx
// ❌ 카드마다 hover/transition 직접 작성
<Card className="hover:shadow-lg transition-shadow cursor-pointer">
  <div className="relative aspect-[3/4]">...</div>
  <div className="p-1.5 sm:p-2">...</div>
</Card>

// ❌ 삭제 버튼 위치/동작을 매번 구현
<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100">
  <DeleteButton />
</div>
```

---

## 4. 리스트/그리드

### Do's

```tsx
import { ListContainer } from "@/components/patterns";

// 로딩/빈상태/그리드를 한 번에 처리
<ListContainer
  items={books}
  isLoading={isLoading}
  loadingSkeleton={<BookListSkeleton />}
  emptyState={{ icon: BookOpen, title: "책이 없습니다" }}
  renderItem={(book) => <BookCard key={book.id} book={book} />}
  gridVariant="bookList"
/>
```

### Don'ts

```tsx
// ❌ 로딩/빈상태 패턴을 매번 반복
{isLoading ? (
  <BookListSkeleton />
) : books?.length ? (
  <div className="grid grid-cols-4 gap-1.5 sm:gap-2 md:grid-cols-6 lg:grid-cols-8">
    {books.map(book => <BookCard key={book.id} book={book} />)}
  </div>
) : (
  <EmptyState icon={BookOpen} title="책이 없습니다" />
)}
```

---

## 5. 폼

### Do's

```tsx
import { TextField, TextAreaField, SwitchField } from "@/components/patterns";

// FormProvider 내부에서 간결하게 사용
<TextField name="title" label="제목" required />
<TextAreaField name="content" label="내용" rows={4} maxLength={500} />
<SwitchField name="isPublic" label="공개" description="다른 사용자에게 표시" />
```

### Don'ts

```tsx
// ❌ FormField render 패턴 반복
<FormField
  control={form.control}
  name="title"
  render={({ field }) => (
    <FormItem>
      <FormLabel>제목 <span className="text-destructive">*</span></FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## 6. 그림자 (Elevation)

### Do's

```tsx
import { elevation } from "@/lib/design-tokens";

<Card className={elevation.sm}>...</Card>              // 카드 기본
<div className={cn("p-4", elevation.lg)}>...</div>    // 모달
```

### Don'ts

```tsx
// ❌ 비표준 그림자 직접 작성
<div className="shadow-[0_2px_8px_rgba(0,0,0,0.1)]">...</div>
```

---

## 7. 트랜지션 (성능)

### Do's

```tsx
import { transition } from "@/lib/design-tokens";

// 명시적 속성만 전환 (GPU 최적화)
<div className={transition.base}>...</div>
<button className={transition.fast}>...</button>
```

### Don'ts

```tsx
// ❌ transition-all 사용 금지 (성능 문제)
<div className="transition-all duration-300">...</div>

// ❌ 300ms 초과 duration 지양
<div className="transition-transform duration-500">...</div>
```

---

## 8. 접근성

### Do's

- 카드 링크에 `ariaLabel` 제공
- 이미지에 의미 있는 `alt` 텍스트
- 터치 타겟 최소 44x44px
- 색상만으로 정보를 전달하지 않기

### Don'ts

- ❌ `aria-label` 없는 아이콘 버튼
- ❌ `alt=""`인 의미 있는 이미지
- ❌ 32px 미만의 터치 타겟

---

## 9. 모바일 우선

### Do's

```tsx
// 모바일 → 태블릿 → 데스크톱 순서로 클래스 작성
<div className="p-2 sm:p-3 lg:p-4">
<div className="text-sm sm:text-base lg:text-lg">
```

### Don'ts

```tsx
// ❌ 데스크톱 먼저 작성
<div className="p-4 md:p-3 sm:p-2">
```
