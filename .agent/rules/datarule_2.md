---
alwaysApply: false
description: "데이터 구조 규칙 - 구현 및 코드 패턴"
globs:
  - "app/actions/**"
  - "hooks/**"
---

## [Data Model Governance]

# 프로젝트 데이터 구조 규칙 - 2. 구현 및 코드 패턴 (Implementation & Code Patterns)

**작성일:** 2025년 1월
**프로젝트:** Habitree Reading Hub v4.0.0
**버전:** 2.1 (분리 개정판)
**적용 범위:** 프론트엔드/백엔드 코드 구현, 데이터 접근 패턴

**참고:**
- 거버넌스 및 스키마 규칙은 `datarule_1.md`를 참조하세요.

---

## 목차 (구현)

1. [레이어 분리 원칙](#1-레이어-분리-원칙)
2. [Server Actions 규칙](#2-server-actions-규칙)
3. [타입 안정성](#3-타입-안정성)
4. [점진적 마이그레이션 전략](#4-점진적-마이그레이션-전략)
5. [위반 사례 및 조치](#5-위반-사례-및-조치)
6. [개발 체크리스트](#6-개발-체크리스트)

---

## 1. 레이어 분리 원칙

**핵심**: 컴포넌트(UI)는 절대 Supabase를 직접 호출하지 않습니다.

### 1.1 표준 데이터 흐름
```
컴포넌트 (View)
  ↓
Hooks (Interface & State)
  ↓
Server Actions (Data Access Layer) <--- 유일한 DB 접근 지점
  ↓
Supabase (Database)
```

### 1.2 컴포넌트 역할 제한
- ❌ **금지**: `createClient()` 직접 호출, 테이블/컬럼명 하드코딩
- ❌ **금지**: 컴포넌트 레벨에서의 복잡한 데이터 조작
- ✅ **권장**: 오직 화면 렌더링 및 사용자 이벤트 처리

### 1.3 올바른 패턴 예시
```typescript
// ❌ 나쁜 예 (직접 호출)
export function BookList() {
  const supabase = createClient();
  const { data } = await supabase.from("books").select("*");
  // ...
}

// ✅ 좋은 예 (Hooks 사용)
export function BookList() {
  const { books, isLoading } = useBooks(); // hooks가 actions를 호출
  if (isLoading) return <Skeleton />;
  // ...
}
```

### 1.4 예외 허용 경로
다음 파일들만이 Supabase 클라이언트를 직접 생성하거나 인증을 처리할 수 있습니다:
- `app/actions/**` (모든 DB 접근)
- `lib/supabase/**` (클라이언트 유틸리티)
- `contexts/auth-context.tsx` (인증 상태)
- `app/callback/route.ts` (OAuth)

---

## 2. Server Actions 규칙

**경로**: `app/actions/**`

모든 비즈니스 로직과 DB 쿼리는 이곳에 위치해야 합니다.
1.  **"use server"** 지시어 필수
2.  **타입 명시**: 반환 값에 대한 타입 명시 필수
3.  **에러 핸들링**: `try-catch` 및 일관된 에러 반환

```typescript
"use server";
import type { Database } from "@/types/database";

export async function getBooks(): Promise<Book[]> {
  const supabase = await createServerSupabaseClient();
  // ... 쿼리 로직
  return data;
}
```

---

## 3. 타입 안정성

모든 DB 쿼리는 제네릭을 사용하여 타입을 강제해야 합니다.

### 3.1 타입 정의
`types/database.ts`는 `DATA_MODEL.md`와 항상 일치해야 합니다.

### 3.2 쿼리 타입 적용
```typescript
// ✅ 타입 안전한 쿼리
const { data } = await supabase
  .from("books")
  .select("*")
  .returns<Database["public"]["Tables"]["books"]["Row"][]>();
```

---

## 4. 점진적 마이그레이션 전략

우리는 바이브코딩(빠른 개발)을 지향하지만, 데이터 안정성은 타협하지 않습니다.

- **기존 코드**: 당장 수정하지 않아도 됨(레거시 인정). 리팩토링 시 수정.
- **새로운 코드**: **무조건** 이 규칙을 준수해야 함.

---

## 5. 위반 사례 및 조치

### 사례 1: UI에서 테이블명 노출
```typescript
const tableName = "user_settings"; // ❌
```
**조치**: 해당 로직을 Server Action 내부로 이동시키고, UI는 추상화된 함수만 호출하도록 변경.

### 사례 2: RLS 우회 시도
UI에서 `if (user.id === owner_id)`로만 권한을 체크하고 DB RLS가 없는 경우.
**조치**: 즉시 DB에 RLS 정책을 추가하고, UI 체크는 사용자 경험(UX)용으로만 남겨둠.

---

## 6. 개발 체크리스트

새 기능을 개발할 때 스스로 확인하세요:

- [ ] 컴포넌트 파일에 `import ... from "@/lib/supabase/client"`가 없는가?
- [ ] Server Action 파일의 반환 타입이 명시되어 있는가?
- [ ] 새로운 테이블 접근 시 `types/database.ts`가 최신인가?
- [ ] 로직이 UI가 아닌 `app/actions`에 분리되어 있는가?

**[끝]**
스키마 정의 및 거버넌스 규칙은 `datarule_1.md`를 확인하세요.
