# Shared Module (공통)

> **Module Key**: `shared`
> **Layer**: 기반 레이어
> **Last Updated**: 2025-01-25

---

## 1. 개요

모든 모듈에서 공통으로 사용하는 UI 컴포넌트, 유틸리티, 타입을 제공하는 기반 모듈입니다.

### 1.1 주요 기능

- 공통 UI 컴포넌트 (shadcn/ui)
- 레이아웃 컴포넌트
- 유틸리티 함수
- 공통 타입 정의
- Supabase 클라이언트

---

## 2. 파일 구조

```
components/
├── ui/                    # shadcn/ui 컴포넌트
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── toast.tsx
│   └── ... (기타 UI 컴포넌트)
├── layout/
│   ├── header.tsx
│   ├── sidebar.tsx
│   ├── footer.tsx
│   └── mobile-nav.tsx
├── theme/
│   ├── theme-provider.tsx
│   └── theme-selector.tsx
└── error-boundary.tsx

lib/
├── supabase/
│   ├── client.ts
│   ├── server.ts
│   └── middleware.ts
├── utils/
│   ├── cn.ts
│   ├── date.ts
│   ├── validation.ts
│   ├── logger.ts
│   ├── cache.ts
│   ├── retry.ts
│   ├── image.ts
│   ├── device.ts
│   └── clipboard.ts
├── constants/
│   └── style-messages.ts
├── security/
│   └── file-validation.ts
└── middleware/
    └── rate-limit.ts

types/
└── database.ts            # Supabase 자동 생성

hooks/
└── use-style.ts
```

---

## 3. 핵심 원칙

### 3.1 독립성

> **shared 모듈은 다른 모듈에 의존하면 안 됩니다**

```typescript
// ❌ 금지: shared에서 도메인 모듈 import
// lib/utils/format.ts
import { Note } from '@/types/note'  // 금지!

// ✅ 허용: 제네릭 또는 인터페이스 사용
interface Formattable {
  content: string
  createdAt: string
}
export function formatContent<T extends Formattable>(item: T) { /* ... */ }
```

### 3.2 범용성

모든 모듈에서 사용할 수 있도록 범용적으로 설계합니다.

---

## 4. UI 컴포넌트

### 4.1 shadcn/ui 컴포넌트

| 컴포넌트 | 설명 |
|----------|------|
| `Button` | 버튼 |
| `Card` | 카드 컨테이너 |
| `Dialog` | 모달 다이얼로그 |
| `Form` | 폼 컴포넌트 (react-hook-form) |
| `Input` | 입력 필드 |
| `Select` | 선택 드롭다운 |
| `Toast` | 토스트 알림 |
| `Tabs` | 탭 컴포넌트 |
| `Sheet` | 시트 (모바일 바텀시트) |
| `Skeleton` | 로딩 스켈레톤 |

### 4.2 레이아웃 컴포넌트

| 컴포넌트 | 설명 |
|----------|------|
| `Header` | 상단 헤더 |
| `Sidebar` | 사이드바 네비게이션 |
| `Footer` | 하단 푸터 |
| `MobileNav` | 모바일 네비게이션 |

---

## 5. 유틸리티 함수

### 5.1 스타일

```typescript
// lib/utils/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 5.2 날짜

```typescript
// lib/utils/date.ts
export function formatDate(date: string | Date): string
export function formatRelativeTime(date: string | Date): string
export function isToday(date: string | Date): boolean
```

### 5.3 검증

```typescript
// lib/utils/validation.ts
export function isValidEmail(email: string): boolean
export function isValidUrl(url: string): boolean
export function sanitizeHtml(html: string): string
```

### 5.4 로깅

```typescript
// lib/utils/logger.ts
export const logger = {
  info: (message: string, meta?: object) => void
  warn: (message: string, meta?: object) => void
  error: (message: string, error?: Error) => void
}
```

### 5.5 캐싱

```typescript
// lib/utils/cache.ts
export function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T>
```

### 5.6 재시도

```typescript
// lib/utils/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: { maxRetries?: number; delay?: number }
): Promise<T>
```

---

## 6. Supabase 클라이언트

### 6.1 클라이언트 사이드

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 6.2 서버 사이드

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  // ...
}
```

---

## 7. 타입 정의

### 7.1 자동 생성 타입

```typescript
// types/database.ts
// Supabase CLI로 자동 생성
export type Database = {
  public: {
    Tables: {
      users: { /* ... */ }
      books: { /* ... */ }
      notes: { /* ... */ }
      // ...
    }
  }
}
```

### 7.2 타입 재생성

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

---

## 8. 보안 유틸리티

### 8.1 파일 검증

```typescript
// lib/security/file-validation.ts
export function validateFileType(file: File, allowedTypes: string[]): boolean
export function validateFileSize(file: File, maxSize: number): boolean
export function sanitizeFileName(name: string): string
```

### 8.2 Rate Limiting

```typescript
// lib/middleware/rate-limit.ts
export function rateLimit(options: {
  interval: number
  maxRequests: number
}): (req: Request) => Promise<boolean>
```

---

## 9. 사용 예시

```typescript
// 다른 모듈에서 shared 사용
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/date'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
```

---

## 10. 참고 문서

- [shadcn/ui 공식 문서](https://ui.shadcn.com/)
- [Supabase 공식 문서](https://supabase.com/docs)
