# Habitree 디자인 시스템 - 컴포넌트 카탈로그

> 디자인 시스템의 모든 컴포넌트 목록과 사용법을 정리한 문서입니다.

---

## 1. 레이어 구조

```
Domain Components (books/, notes/, groups/ ...)
  ↑ 사용
Patterns (components/patterns/)
  ↑ 사용
Primitives (components/primitives/)
  ↑ 사용
UI (components/ui/) - shadcn/ui 기반
  ↑ 사용
Design Tokens (lib/design-tokens.ts)
  ↑ 사용
CSS Variables + Tailwind Config
```

---

## 2. Design Tokens (`lib/design-tokens.ts`)

| 카테고리 | 설명 | 예시 |
|---------|------|------|
| `typography` | 타이포그래피 스케일 | `typography.pageTitle`, `typography.helper` |
| `spacing` | 간격 시스템 | `spacing.pageSection`, `spacing.formField` |
| `grids` | 그리드 레이아웃 | `grids.bookList`, `grids.noteList` |
| `elevation` | 그림자/높이감 | `elevation.sm`, `elevation.md` |
| `radius` | 테두리 둥글기 | `radius.sm`, `radius.md` |
| `transition` | 트랜지션 | `transition.fast`, `transition.base` |
| `zIndex` | Z-index 레이어 | `zIndex.modal`, `zIndex.toast` |
| `iconSizes` | 아이콘 크기 | `iconSizes.sm`, `iconSizes.md` |
| `formHeights` | 폼 요소 높이 | `formHeights.input`, `formHeights.button` |
| `cardStyles` | 카드 스타일 | `cardStyles.hover`, `cardStyles.selectable` |
| `backgrounds` | 섹션 배경색 | `backgrounds.quote`, `backgrounds.memo` |

---

## 3. Primitives (`components/primitives/`)

### 3.1 Typography

#### Heading
시맨틱 HTML 태그 + 디자인 토큰 자동 적용.

```tsx
import { Heading } from "@/components/primitives";

<Heading level={1}>페이지 제목</Heading>     // h1 + pageTitle 토큰
<Heading level={2}>섹션 제목</Heading>       // h2 + sectionTitle 토큰
<Heading level={3}>카드 제목</Heading>       // h3 + cardTitle 토큰
<Heading level={4}>라벨</Heading>            // h4 + label 토큰

// 시맨틱은 h2이지만 시각적으로 h3 스타일
<Heading level={2} visualLevel={3}>카드 제목</Heading>
```

#### Text
본문 텍스트 변형.

```tsx
import { Text } from "@/components/primitives";

<Text variant="body">본문 텍스트</Text>
<Text variant="small">작은 텍스트</Text>
<Text variant="tiny">매우 작은 텍스트</Text>
<Text variant="helper">도움말 텍스트</Text>
<Text variant="error">에러 메시지</Text>
<Text variant="label">라벨</Text>
<Text variant="description">설명 텍스트</Text>

// 줄 수 제한
<Text variant="small" lineClamp={2}>긴 텍스트...</Text>

// span으로 렌더링
<Text as="span" variant="small">인라인 텍스트</Text>
```

#### TextLink
링크 스타일 텍스트.

```tsx
import { TextLink } from "@/components/primitives";

<TextLink href="/books">내 서재</TextLink>
<TextLink href="https://example.com" external>외부 링크</TextLink>
```

### 3.2 Layout

#### Stack
세로 정렬 (Flexbox column).

```tsx
import { Stack } from "@/components/primitives";

<Stack gap="formField">         // spacing.formField 토큰 사용
  <TextField />
  <TextAreaField />
</Stack>

<Stack gap="pageSection">       // spacing.pageSection 토큰 사용
  <Section1 />
  <Section2 />
</Stack>

<Stack as="form" gap="formField">  // form 태그로 렌더링
  ...
</Stack>
```

#### Inline
가로 정렬 (Flexbox row).

```tsx
import { Inline } from "@/components/primitives";

<Inline gap="listItem" align="center">
  <Badge>완독</Badge>
  <Text variant="small">2024-01-15</Text>
</Inline>

<Inline gap="gap-2" justify="between" wrap>
  <Tag>태그1</Tag>
  <Tag>태그2</Tag>
</Inline>
```

#### Grid
그리드 레이아웃.

```tsx
import { Grid } from "@/components/primitives";

<Grid variant="bookList">     // grids.bookList 토큰
  {books.map(b => <BookCard key={b.id} book={b} />)}
</Grid>

<Grid variant="noteList">     // grids.noteList 토큰
  {notes.map(n => <NoteCard key={n.id} note={n} />)}
</Grid>
```

#### Container
페이지 컨테이너.

```tsx
import { Container } from "@/components/primitives";

<Container maxWidth="5xl">     // 기본값
  <PageContent />
</Container>

<Container as="main" maxWidth="lg">
  <NarrowContent />
</Container>
```

### 3.3 Feedback

#### Spinner
표준화된 로딩 스피너.

```tsx
import { Spinner, FullPageSpinner } from "@/components/primitives";

<Spinner size="sm" />          // 16px
<Spinner size="md" />          // 24px (기본)
<Spinner size="lg" />          // 32px

<FullPageSpinner message="불러오는 중..." />  // Suspense fallback용
```

---

## 4. Patterns (`components/patterns/`)

### 4.1 CardContainer
Slot 기반 카드 래퍼. 16개 도메인 카드의 공통 구조 추상화.

```tsx
import { CardContainer, CardImageSlot } from "@/components/patterns";

<CardContainer
  href="/books/123"
  ariaLabel="해리포터 상세 보기"
  variant="default"                // "default" | "compact" | "horizontal"
  hoverable
  imageSlot={
    <CardImageSlot
      src={coverUrl}
      alt="해리포터 표지"
      aspectRatio="3/4"
    />
  }
  badgeSlot={<BookStatusBadge status="reading" />}
  contentSlot={
    <>
      <Heading level={3}>해리포터</Heading>
      <Text variant="small">J.K. 롤링</Text>
    </>
  }
  footerSlot={
    <Text variant="tiny" as="span">2024-01-15</Text>
  }
  deleteSlot={<BookDeleteButton id={id} />}
/>
```

**variant 별 레이아웃:**
- `default`: 세로 (이미지 위 + 콘텐츠 아래)
- `compact`: 세로 + 좁은 패딩
- `horizontal`: 가로 (이미지 왼쪽 + 콘텐츠 오른쪽)

### 4.2 ListContainer
로딩/빈상태/그리드 자동 처리.

```tsx
import { ListContainer } from "@/components/patterns";

<ListContainer
  items={books}
  isLoading={isLoading}
  loadingSkeleton={<BookListSkeleton />}
  emptyState={{
    icon: BookOpen,
    title: "책이 없습니다",
    description: "새로운 책을 등록해보세요",
    action: { label: "책 등록", href: "/books/new" },
  }}
  renderItem={(book) => <BookCard key={book.id} book={book} />}
  gridVariant="bookList"
/>
```

### 4.3 FormHelpers
react-hook-form FormField 보일러플레이트 제거. **반드시 `<FormProvider>` 내부에서 사용**.

```tsx
import { TextField, TextAreaField, SwitchField } from "@/components/patterns";

// FormProvider 내부에서:
<TextField name="title" label="제목" required placeholder="책 제목 입력" />

<TextAreaField
  name="content"
  label="내용"
  rows={4}
  maxLength={500}
  placeholder="내용을 입력하세요"
/>

<SwitchField
  name="isPublic"
  label="공개"
  description="다른 사용자에게 표시합니다"
/>
```

---

## 5. UI (`components/ui/`) - 기존 유지

shadcn/ui 기반 프리미티브. 변경 없음.

| 컴포넌트 | 파일 | 주요 variant |
|---------|------|-------------|
| Button | `button.tsx` | default, outline, ghost, destructive, link, secondary, forest, paper, icon |
| Card | `card.tsx` | default, destructive, warning, highlight, success, ghost, interactive, glass |
| Badge | `badge.tsx` | default, secondary, destructive, outline |
| Dialog | `dialog.tsx` | - |
| EmptyState | `empty-state.tsx` | default, encouraging, celebratory, curious |
| Skeleton | `skeleton.tsx` | shimmer (default), pulse |

---

## 6. Import 경로

```tsx
// Primitives
import { Heading, Text, Stack, Inline, Grid, Spinner } from "@/components/primitives";

// Patterns
import { CardContainer, CardImageSlot, ListContainer, TextField } from "@/components/patterns";

// UI (기존)
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Tokens
import { typography, spacing, elevation, radius } from "@/lib/design-tokens";
```
