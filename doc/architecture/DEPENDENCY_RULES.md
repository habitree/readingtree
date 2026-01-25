# Habitree Reading Hub - Dependency Rules

> **Version**: 1.0.0
> **Last Updated**: 2025-01-25

---

## 1. 개요

이 문서는 모듈 간 의존성 규칙을 정의합니다. 올바른 의존성 방향을 유지하면 코드의 유지보수성, 테스트 용이성, 재사용성이 향상됩니다.

---

## 2. 레이어별 의존성 방향

### 2.1 의존성 방향 다이어그램

```
                    ┌─────────────────┐
                    │   UI 레이어     │
                    │  home, shared   │
                    └────────┬────────┘
                             │ 사용
                             ▼
              ┌──────────────────────────────┐
              │     플랫폼/지원 모듈         │
              │  search, ai, profile, admin  │
              └──────────────┬───────────────┘
                             │ 사용
                             ▼
    ┌─────────────────────────────────────────────────┐
    │                도메인 모듈                      │
    │  identity, library, records, groups, sharing   │
    └─────────────────────────┬───────────────────────┘
                              │ 사용
                              ▼
                    ┌─────────────────┐
                    │     shared      │
                    │   (공통 기반)   │
                    └─────────────────┘
```

### 2.2 의존성 규칙 매트릭스

| From ↓ / To → | shared | identity | library | records | groups | sharing | search | ai | profile | admin | home |
|---------------|--------|----------|---------|---------|--------|---------|--------|-----|---------|-------|------|
| **shared** | - | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **identity** | ✅ | - | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **library** | ✅ | ⚠️ | - | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **records** | ✅ | ⚠️ | ✅ | - | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **groups** | ✅ | ⚠️ | ✅ | ✅ | - | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **sharing** | ✅ | ⚠️ | ✅ | ✅ | ✅ | - | ❌ | ❌ | ❌ | ❌ | ❌ |
| **search** | ✅ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | - | ❌ | ❌ | ❌ | ❌ |
| **ai** | ✅ | ⚠️ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | - | ❌ | ❌ | ❌ |
| **profile** | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ❌ | ⚠️ | - | ❌ | ❌ |
| **admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | ❌ |
| **home** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | - |

**범례**:
- ✅ 허용 (Allowed)
- ⚠️ 주의 필요 (Interface로만 접근)
- ❌ 금지 (Prohibited)

---

## 3. 상세 규칙

### 3.1 기본 원칙

#### Rule 1: 단방향 의존성
```
상위 레이어 → 하위 레이어 (허용)
하위 레이어 → 상위 레이어 (금지)
```

#### Rule 2: shared 모듈의 독립성
```typescript
// ✅ 올바른 사용: 모든 모듈에서 shared 사용
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

// ❌ 금지: shared에서 다른 모듈 import
// lib/utils/some-util.ts
import { getBooks } from '@/app/actions/books' // 금지!
```

#### Rule 3: 순환 의존성 금지
```typescript
// ❌ 금지: 순환 의존성
// library/books.ts
import { getNotes } from '@/app/actions/notes'

// records/notes.ts
import { getBooks } from '@/app/actions/books'
```

### 3.2 도메인 모듈 간 규칙

#### 3.2.1 records → library (허용)

노트는 책에 종속되므로 library 참조가 필요합니다.

```typescript
// ✅ 허용
// app/actions/notes.ts
import { getBookById } from '@/app/actions/books'

// components/notes/note-form.tsx
import { BookSelector } from '@/components/books/book-selector'
```

#### 3.2.2 groups → library, records (허용)

그룹은 책과 노트를 공유하므로 양쪽 참조가 필요합니다.

```typescript
// ✅ 허용
// app/actions/groups.ts
import { getBookById } from '@/app/actions/books'
import { getNoteById } from '@/app/actions/notes'
```

#### 3.2.3 sharing → library, records, groups (허용)

공유는 모든 공유 가능한 리소스를 참조합니다.

```typescript
// ✅ 허용
// app/actions/share.ts
import { getNoteById } from '@/app/actions/notes'
import { getBookById } from '@/app/actions/books'
```

### 3.3 플랫폼 모듈 규칙

#### 3.3.1 ai → library, records (허용)

AI는 책과 노트 컨텍스트를 활용합니다.

```typescript
// ✅ 허용
// lib/ai/prompts/chat-prompts.ts
import type { Book } from '@/types/book'
import type { Note } from '@/types/note'
```

#### 3.3.2 admin → 모든 모듈 (허용)

관리자는 전체 시스템을 관리하므로 모든 모듈에 접근 가능합니다.

```typescript
// ✅ 허용 (admin 전용 권한)
// app/actions/admin.ts
import { getAllUsers } from '@/app/actions/auth'
import { getAllBooks } from '@/app/actions/books'
import { getAllNotes } from '@/app/actions/notes'
```

### 3.4 UI 레이어 규칙

#### 3.4.1 home → 모든 도메인 모듈 (허용)

대시보드는 조합 레이어로 모든 도메인 정보를 표시합니다.

```typescript
// ✅ 허용
// components/dashboard/dashboard-content.tsx
import { getRecentBooks } from '@/app/actions/books'
import { getRecentNotes } from '@/app/actions/notes'
import { getStats } from '@/app/actions/stats'
```

---

## 4. Interface 패턴

### 4.1 같은 레이어 모듈 간 통신

같은 레이어의 모듈이 서로 참조해야 할 때는 **Interface 패턴**을 사용합니다.

```typescript
// types/interfaces/search-result.ts (shared에 위치)
export interface SearchableItem {
  id: string
  title: string
  content: string
  type: 'book' | 'note' | 'group'
}

// library 모듈
export function bookToSearchable(book: Book): SearchableItem {
  return {
    id: book.id,
    title: book.title,
    content: book.description ?? '',
    type: 'book'
  }
}

// search 모듈
import type { SearchableItem } from '@/types/interfaces/search-result'

export function searchItems(items: SearchableItem[], query: string) {
  // 검색 로직
}
```

### 4.2 Event 기반 통신 (향후)

강한 결합을 피해야 할 때는 이벤트 기반 통신을 고려합니다.

```typescript
// lib/events/index.ts (shared)
export const events = {
  emit: (event: string, data: unknown) => { /* ... */ },
  on: (event: string, handler: (data: unknown) => void) => { /* ... */ }
}

// library 모듈에서 이벤트 발생
events.emit('book:deleted', { bookId })

// records 모듈에서 이벤트 수신
events.on('book:deleted', ({ bookId }) => {
  // 관련 노트 처리
})
```

---

## 5. 검증 방법

### 5.1 수동 검증

```bash
# 특정 모듈에서의 import 확인
grep -r "from '@/app/actions/books'" app/actions/notes/
grep -r "from '@/components/books'" components/notes/
```

### 5.2 자동 검증 (향후 도입)

#### ESLint Rule 설정

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          // shared에서 다른 모듈 import 금지
          {
            target: './lib/utils',
            from: './app/actions',
            message: 'shared 모듈에서 도메인 모듈을 import할 수 없습니다.'
          },
          // 하위 레이어에서 상위 레이어 import 금지
          {
            target: './app/actions',
            from: './components/dashboard',
            message: '도메인 모듈에서 UI 레이어를 import할 수 없습니다.'
          }
        ]
      }
    ]
  }
}
```

#### dependency-cruiser 설정

```javascript
// .dependency-cruiser.js
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: '순환 의존성 금지',
      from: {},
      to: { circular: true }
    },
    {
      name: 'shared-independence',
      severity: 'error',
      comment: 'shared 모듈은 다른 모듈에 의존하면 안됨',
      from: { path: '^lib/utils' },
      to: { path: '^app/actions' }
    }
  ]
}
```

### 5.3 CI/CD 검증 (향후)

```yaml
# .github/workflows/lint.yml
- name: Check dependencies
  run: |
    npx depcruise --validate .dependency-cruiser.js app/ components/ lib/
```

---

## 6. 위반 사례 및 해결 방법

### 6.1 순환 의존성

**문제**:
```typescript
// books.ts
import { getNotesByBookId } from './notes'

// notes.ts
import { getBookById } from './books'
```

**해결**: Interface 분리
```typescript
// types/book.ts (shared)
export interface Book { id: string; title: string }

// types/note.ts (shared)
export interface Note { id: string; bookId: string; content: string }

// books.ts
export function getBookById(id: string): Book { /* ... */ }

// notes.ts
import type { Book } from '@/types/book'
export function getNotesByBookId(bookId: string): Note[] { /* ... */ }
```

### 6.2 shared에서 도메인 의존

**문제**:
```typescript
// lib/utils/format.ts
import { Note } from '@/types/note'

export function formatNote(note: Note) { /* ... */ }
```

**해결**: 제네릭 또는 인터페이스 사용
```typescript
// lib/utils/format.ts
interface Formattable {
  content: string
  createdAt: string
}

export function formatContent<T extends Formattable>(item: T) { /* ... */ }
```

---

## 7. 참고 문서

- [MODULE_MAP.md](./MODULE_MAP.md) - 모듈 전체 맵
- [Architecture Decision Records](./adr/) - 아키텍처 결정 기록 (향후)

---

## 8. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0.0 | 2025-01-25 | 최초 작성 |
