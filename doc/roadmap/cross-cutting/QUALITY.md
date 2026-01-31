# 기술 품질 고도화 계획

> **영역**: 테스트, 에러 처리, 캐싱, 성능
> **우선순위**: 🔴 높음
> **Phase**: 1 (품질 기반 구축)

---

## 1. 현황 분석

### 1.1 현재 상태

| 영역 | 현재 상태 | 문제점 |
|------|----------|--------|
| **테스트** | 테스트 코드 없음 | 회귀 버그 위험 |
| **에러 처리** | 개별 처리 | 일관성 부족 |
| **캐싱** | 없음 | 불필요한 API 호출 |
| **타입 안전성** | 양호 | Zod 스키마 일부 누락 |

### 1.2 기술 부채

```
기술 부채 매트릭스
═══════════════════════════════════════════════════════════

  높은 영향 ↑
            │
     ┌──────┼───────────────────────────────┐
     │      │  테스트 부재    에러 처리      │  → 즉시 해결
     │      │                               │
     ├──────┼───────────────────────────────┤
     │      │  캐싱 미흡     로깅 부족       │  → 계획적 해결
     │      │                               │
     ├──────┼───────────────────────────────┤
     │      │  코드 중복     문서화 부족     │  → 점진적 개선
     │      │                               │
     └──────┴───────────────────────────────┘
            └────────────────────────────────→ 해결 난이도

═══════════════════════════════════════════════════════════
```

---

## 2. 테스트 전략

### 2.1 테스트 피라미드

```
                    /\
                   /  \           E2E (10%)
                  /    \          - 핵심 사용자 플로우
                 /──────\
                /        \        통합 (30%)
               /          \       - 컴포넌트 + API
              /────────────\
             /              \     유닛 (60%)
            /                \    - 비즈니스 로직
           /──────────────────\   - 유틸리티 함수
```

### 2.2 기술 스택

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "msw": "^2.0.0",
    "@playwright/test": "^1.40.0"
  }
}
```

### 2.3 테스트 구조

```
__tests__/
├── unit/
│   ├── actions/
│   │   ├── books.test.ts
│   │   ├── notes.test.ts
│   │   └── points.test.ts
│   ├── lib/
│   │   ├── utils.test.ts
│   │   └── validation.test.ts
│   └── hooks/
│       └── useBooks.test.ts
├── integration/
│   ├── components/
│   │   ├── BookCard.test.tsx
│   │   ├── NoteEditor.test.tsx
│   │   └── SearchDialog.test.tsx
│   └── flows/
│       ├── add-book.test.tsx
│       └── create-note.test.tsx
└── e2e/
    ├── auth.spec.ts
    ├── book-management.spec.ts
    └── reading-flow.spec.ts
```

### 2.4 테스트 작성 가이드

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', '**/*.d.ts', '**/*.config.*'],
    },
  },
});

// vitest.setup.ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

#### 유닛 테스트 예시

```typescript
// __tests__/unit/actions/books.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createBook, updateBookProgress } from '@/app/actions/books';

describe('books actions', () => {
  describe('createBook', () => {
    it('should create a book with valid data', async () => {
      const bookData = {
        title: '클린 코드',
        author: '로버트 C. 마틴',
        totalPages: 464,
      };

      const result = await createBook(bookData);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        title: '클린 코드',
        status: 'want_to_read',
      });
    });

    it('should validate required fields', async () => {
      const result = await createBook({ title: '' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('title');
    });
  });

  describe('updateBookProgress', () => {
    it('should update progress and emit points', async () => {
      const onPointsEarned = vi.fn();

      await updateBookProgress({
        bookId: 'book-1',
        currentPage: 100,
        onPointsEarned,
      });

      expect(onPointsEarned).toHaveBeenCalled();
    });
  });
});
```

#### 컴포넌트 테스트 예시

```typescript
// __tests__/integration/components/BookCard.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookCard } from '@/components/books/BookCard';

describe('BookCard', () => {
  const mockBook = {
    id: '1',
    title: '클린 코드',
    author: '로버트 C. 마틴',
    status: 'reading',
    progress: 50,
  };

  it('renders book information', () => {
    render(<BookCard book={mockBook} />);

    expect(screen.getByText('클린 코드')).toBeInTheDocument();
    expect(screen.getByText('로버트 C. 마틴')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('opens detail modal on click', async () => {
    const user = userEvent.setup();
    render(<BookCard book={mockBook} />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
```

---

## 3. 에러 처리 표준화

### 3.1 에러 처리 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                     에러 처리 흐름                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Server Action] ────▶ [Result Type] ────▶ [Client Handler] │
│        │                     │                    │         │
│        │                     │                    │         │
│        ▼                     ▼                    ▼         │
│  try/catch            success/error         Toast/UI        │
│  Zod validation       typed response        Error Boundary   │
│  DB error mapping     error codes           Retry Logic      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 표준 Result 타입

```typescript
// types/result.ts
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export type ActionResult<T> = Result<T, ActionError>;

export interface ActionError {
  code: string;
  message: string;
  field?: string;
  details?: unknown;
}

// 에러 코드 정의
export const ErrorCodes = {
  // 인증 관련
  UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',

  // 검증 관련
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',

  // 데이터 관련
  NOT_FOUND: 'DATA_NOT_FOUND',
  DUPLICATE: 'DATA_DUPLICATE',
  CONFLICT: 'DATA_CONFLICT',

  // 서버 관련
  INTERNAL_ERROR: 'SERVER_INTERNAL_ERROR',
  DATABASE_ERROR: 'SERVER_DATABASE_ERROR',
  RATE_LIMITED: 'SERVER_RATE_LIMITED',
} as const;
```

### 3.3 Server Action 에러 처리

```typescript
// lib/action-utils.ts
import { z } from 'zod';
import { ActionResult, ActionError, ErrorCodes } from '@/types/result';

export function createAction<TInput, TOutput>(
  schema: z.Schema<TInput>,
  handler: (input: TInput) => Promise<TOutput>
) {
  return async (rawInput: unknown): Promise<ActionResult<TOutput>> => {
    try {
      // 입력 검증
      const parseResult = schema.safeParse(rawInput);
      if (!parseResult.success) {
        return {
          success: false,
          error: {
            code: ErrorCodes.VALIDATION_FAILED,
            message: '입력 데이터가 올바르지 않습니다.',
            details: parseResult.error.flatten(),
          },
        };
      }

      // 핸들러 실행
      const data = await handler(parseResult.data);
      return { success: true, data };

    } catch (error) {
      // 에러 매핑
      return {
        success: false,
        error: mapError(error),
      };
    }
  };
}

function mapError(error: unknown): ActionError {
  if (error instanceof z.ZodError) {
    return {
      code: ErrorCodes.VALIDATION_FAILED,
      message: '유효성 검사 실패',
      details: error.flatten(),
    };
  }

  if (isSupabaseError(error)) {
    return mapSupabaseError(error);
  }

  console.error('Unexpected error:', error);
  return {
    code: ErrorCodes.INTERNAL_ERROR,
    message: '예상치 못한 오류가 발생했습니다.',
  };
}
```

### 3.4 클라이언트 에러 처리

```typescript
// hooks/useAction.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { ActionResult } from '@/types/result';

export function useAction<TInput, TOutput>(
  action: (input: TInput) => Promise<ActionResult<TOutput>>,
  options?: {
    onSuccess?: (data: TOutput) => void;
    onError?: (error: ActionError) => void;
    successMessage?: string;
  }
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ActionError | null>(null);

  const execute = useCallback(async (input: TInput) => {
    setIsLoading(true);
    setError(null);

    const result = await action(input);

    setIsLoading(false);

    if (result.success) {
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      options?.onSuccess?.(result.data);
      return result.data;
    } else {
      setError(result.error);
      toast.error(result.error.message);
      options?.onError?.(result.error);
      return null;
    }
  }, [action, options]);

  return { execute, isLoading, error };
}

// 사용 예시
function BookForm() {
  const { execute, isLoading, error } = useAction(createBook, {
    onSuccess: (book) => router.push(`/books/${book.id}`),
    successMessage: '책이 추가되었습니다!',
  });

  const handleSubmit = async (data: BookFormData) => {
    await execute(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error?.field && <ErrorMessage>{error.message}</ErrorMessage>}
      {/* form fields */}
    </form>
  );
}
```

### 3.5 Error Boundary

```typescript
// components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, info);
    // 에러 리포팅 서비스에 전송
    // reportError(error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">문제가 발생했습니다</h2>
          <p className="text-muted-foreground mb-4">
            일시적인 오류가 발생했습니다. 다시 시도해 주세요.
          </p>
          <Button onClick={this.handleRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            다시 시도
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 4. 캐싱 전략

### 4.1 캐싱 레이어

```
┌─────────────────────────────────────────────────────────────┐
│                     캐싱 아키텍처                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Browser]                                                  │
│     │                                                       │
│     ├── React Query Cache (메모리)                          │
│     │   └── staleTime, cacheTime 설정                       │
│     │                                                       │
│     ├── localStorage (영구 저장)                            │
│     │   └── 사용자 설정, 검색 히스토리                       │
│     │                                                       │
│     └── IndexedDB (오프라인)                                │
│         └── 드래프트, 임시 데이터                            │
│                                                             │
│  [Server]                                                   │
│     │                                                       │
│     ├── Next.js Cache (요청 캐싱)                           │
│     │   └── unstable_cache, revalidate                     │
│     │                                                       │
│     └── Supabase (데이터베이스 레벨)                        │
│         └── RLS, 인덱스 최적화                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 React Query 설정

```typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5분
      cacheTime: 1000 * 60 * 30, // 30분
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// 캐시 키 상수
export const queryKeys = {
  books: {
    all: ['books'] as const,
    list: (filters: BookFilters) => ['books', 'list', filters] as const,
    detail: (id: string) => ['books', 'detail', id] as const,
  },
  notes: {
    all: ['notes'] as const,
    list: (bookId?: string) => ['notes', 'list', bookId] as const,
    detail: (id: string) => ['notes', 'detail', id] as const,
  },
  // ...
} as const;
```

### 4.3 캐싱 훅 패턴

```typescript
// hooks/useBooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';

export function useBooks(filters?: BookFilters) {
  return useQuery({
    queryKey: queryKeys.books.list(filters),
    queryFn: () => getBooks(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBook,
    onSuccess: () => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
    },
  });
}

// 낙관적 업데이트
export function useUpdateBookProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBookProgress,
    onMutate: async (newProgress) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({
        queryKey: queryKeys.books.detail(newProgress.bookId),
      });

      // 이전 값 저장
      const previous = queryClient.getQueryData(
        queryKeys.books.detail(newProgress.bookId)
      );

      // 낙관적 업데이트
      queryClient.setQueryData(
        queryKeys.books.detail(newProgress.bookId),
        (old: Book) => ({
          ...old,
          currentPage: newProgress.currentPage,
        })
      );

      return { previous };
    },
    onError: (err, vars, context) => {
      // 에러 시 롤백
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.books.detail(vars.bookId),
          context.previous
        );
      }
    },
    onSettled: (data, err, vars) => {
      // 항상 재검증
      queryClient.invalidateQueries({
        queryKey: queryKeys.books.detail(vars.bookId),
      });
    },
  });
}
```

---

## 5. 성능 최적화

### 5.1 번들 사이즈 최적화

```typescript
// next.config.js
module.exports = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
    ],
  },
};
```

### 5.2 코드 스플리팅

```typescript
// 동적 임포트
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(
  () => import('@/components/notes/RichTextEditor'),
  {
    loading: () => <Skeleton className="h-64" />,
    ssr: false,
  }
);

const Chart = dynamic(
  () => import('recharts').then(mod => mod.LineChart),
  { ssr: false }
);
```

### 5.3 이미지 최적화

```typescript
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-supabase-url.supabase.co',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

// 사용
import Image from 'next/image';

<Image
  src={book.coverImage}
  alt={book.title}
  width={128}
  height={192}
  placeholder="blur"
  blurDataURL={book.blurDataURL}
/>
```

---

## 6. 구현 로드맵

### Phase 1: 기반 구축

```
Week 1-2:
├── Vitest 설정
├── Testing Library 설정
├── MSW 모킹 서버 구성
└── CI 파이프라인 테스트 추가

Week 3-4:
├── Result 타입 시스템 도입
├── 에러 코드 표준화
├── Error Boundary 구현
└── 기존 코드 마이그레이션
```

### Phase 2: 테스트 작성

```
Week 5-8:
├── 핵심 액션 유닛 테스트 (books, notes, points)
├── 주요 컴포넌트 통합 테스트
├── 핵심 플로우 E2E 테스트
└── 커버리지 목표: 60%
```

### Phase 3: 캐싱 도입

```
Week 9-10:
├── React Query 설정
├── 기존 데이터 페칭 마이그레이션
├── 낙관적 업데이트 구현
└── 캐시 무효화 전략 구현
```

---

## 7. 성공 지표

| 지표 | 현재 | 목표 |
|------|------|------|
| 테스트 커버리지 | 0% | 80% |
| CI 통과율 | - | 99% |
| 평균 API 응답 시간 | - | <200ms |
| 에러율 | - | <1% |
| 번들 사이즈 | - | <200KB (초기) |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2026-01-30 | 최초 작성 |

---

*관련 문서: [메인 계획서](../MODULE_ENHANCEMENT_PLAN.md) | [접근성](./ACCESSIBILITY.md)*
