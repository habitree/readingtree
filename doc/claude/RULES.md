# Habitree Reading Hub v4.0.0 - Claude Code Project Rules

> **원본 규칙**: `.agent/rules/` 폴더
> **동기화 필수**: `.agent/rules/` 변경 시 이 파일도 함께 업데이트

---

## 1. 기본 규칙

| 항목 | 규칙 |
|------|------|
| **응답 언어** | 항상 한국어로 응답 |
| **프레임워크** | Next.js 15 (App Router) + Supabase |
| **배포** | Vercel |
| **LLM API** | Gemini API |
| **설명 방식** | 비개발자도 이해하기 쉽게 친절하게 |

### 1.1 문서화 규칙

```
doc/                          # 모든 문서 위치
├── database/                 # DB 스키마, 마이그레이션
│   ├── DATA_MODEL.md         # 스키마 단일 기준 문서
│   └── migration-*.sql       # 마이그레이션 파일
├── governance/               # 거버넌스 규칙
├── question/                 # 시스템 반영 외 질문/답변
├── tasks/                    # 태스크 문서
├── design/                   # 디자인 문서
└── claude/                   # Claude Code 룰
    └── RULES.md              # 이 파일
```

---

## 2. 프로젝트 구조

```
readingtree_v4.0.0/
├── app/
│   ├── actions/              # Server Actions (DB 접근 유일 지점)
│   │   ├── auth.ts           # 인증 관련 (getCurrentUser)
│   │   ├── books.ts          # 책 관련
│   │   ├── notes.ts          # 노트 관련
│   │   ├── groups.ts         # 그룹 관련
│   │   ├── search.ts         # 검색 관련
│   │   ├── profile.ts        # 프로필 관련
│   │   └── ...
│   ├── api/                  # API Routes (DB 직접 접근 금지)
│   └── (pages)/              # 페이지 컴포넌트
├── components/               # UI 컴포넌트 (DB 직접 접근 금지)
├── hooks/                    # Custom Hooks
├── contexts/
│   └── auth-context.tsx      # 인증 상태 관리 (예외 허용)
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # 브라우저 클라이언트
│   │   ├── server.ts         # 서버 클라이언트
│   │   ├── middleware.ts     # 미들웨어 클라이언트
│   │   └── admin.ts          # Admin 클라이언트
│   ├── api/                  # 외부 API 래퍼 (naver, gemini, ocr)
│   └── utils/                # 유틸리티 함수
├── types/
│   └── database.ts           # DB 타입 정의 (DATA_MODEL.md와 동기화 필수)
├── .agent/
│   └── rules/                # 원본 Agent 룰 (이 파일의 원본)
└── doc/
    ├── database/
    │   └── DATA_MODEL.md     # 스키마 단일 기준 문서
    └── claude/
        └── RULES.md          # 이 파일
```

---

## 3. 인증/세션 관리 규칙

> 원본: `.agent/rules/auth_session_rule.md`

### 3.1 핵심 원칙: 서버 중심 (SSR/쿠키 기반)

```
✅ 세션 읽기 → app/actions/auth.ts의 getCurrentUser()
✅ 세션 갱신 → lib/supabase/middleware.ts (자동)
✅ 클라이언트 → 서버에서 받은 정보만 표시
❌ 클라이언트에서 getUser() 직접 호출 금지
❌ 서버/클라이언트 혼합 방식 금지
```

### 3.2 허용된 파일 (세션 직접 접근)

- `app/actions/auth.ts` - `getCurrentUser()` 함수
- `lib/supabase/server.ts` - `createServerSupabaseClient()`
- `lib/supabase/middleware.ts` - 세션 갱신
- `contexts/auth-context.tsx` - 인증 상태 관리

### 3.3 코드 패턴

```typescript
// ✅ 올바른 예: 서버 컴포넌트/Server Actions
import { getCurrentUser } from "@/app/actions/auth";
const user = await getCurrentUser();

// ✅ 올바른 예: 클라이언트 컴포넌트
import { useAuth } from "@/hooks/use-auth";
const { user } = useAuth();

// ❌ 금지: 클라이언트에서 직접 호출
const { data: { user } } = await supabase.auth.getUser();

// ❌ 금지: 페이지에서 직접 호출
const supabase = await createServerSupabaseClient();
const { data: { user } } = await supabase.auth.getUser();
```

---

## 4. 레이어 분리 규칙

> 원본: `.agent/rules/ui_datarule.md`, `.agent/rules/datarule_2.md`

### 4.1 데이터 흐름

```
컴포넌트 (components/)
    ↓
Hooks (hooks/)
    ↓
Server Actions (app/actions/)  ← 유일한 DB 접근 지점
    ↓
Supabase
```

### 4.2 레이어별 규칙

| 레이어 | 경로 | 허용 | 금지 |
|--------|------|------|------|
| **UI** | `components/`, `hooks/` | 화면 렌더링, hooks 사용 | `supabase.from()`, 테이블명 노출 |
| **Actions** | `app/actions/` | Supabase 쿼리, 타입 명시 | React hooks, 브라우저 API |
| **lib** | `lib/` | 클라이언트 생성, 유틸리티 | 쿼리 함수 작성 |
| **API** | `app/api/` | HTTP 처리, Storage | Supabase 쿼리 (actions 위임) |

### 4.3 Server Actions 표준 패턴

```typescript
// app/actions/books.ts
"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Book = Database["public"]["Tables"]["books"]["Row"];

export async function getBooks(): Promise<Book[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("books")
    .select("*")
    .returns<Book[]>();

  if (error) throw error;
  return data || [];
}
```

---

## 5. DB/RLS 관리 규칙

> 원본: `.agent/rules/db_rls_rule.md`

### 5.1 핵심 원칙

```
✅ 테이블 생성 → 즉시 RLS Enable
✅ SELECT/INSERT/UPDATE/DELETE 정책 모두 작성
✅ 소유자 판단: auth.uid() = user_id
✅ 외래 키: auth.users(id) 참조
✅ UUID 생성: gen_random_uuid()
❌ RLS 없이 테이블 생성 금지
❌ 이메일 기반 식별자 금지
```

### 5.2 테이블 생성 표준 순서

```sql
-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS table_name (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스
CREATE INDEX IF NOT EXISTS idx_table_name_user_id ON table_name(user_id);

-- 3. RLS 활성화
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- 4. 정책 (4가지 모두)
DROP POLICY IF EXISTS "select_own" ON table_name;
CREATE POLICY "select_own" ON table_name FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own" ON table_name;
CREATE POLICY "insert_own" ON table_name FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own" ON table_name;
CREATE POLICY "update_own" ON table_name FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own" ON table_name;
CREATE POLICY "delete_own" ON table_name FOR DELETE
    USING (auth.uid() = user_id);
```

### 5.3 무한 재귀 방지

```sql
-- ❌ 금지: 자기 테이블 참조
USING (EXISTS (SELECT 1 FROM group_members WHERE ...))

-- ✅ 올바름: 다른 테이블 참조
USING (EXISTS (SELECT 1 FROM groups WHERE ...))
```

---

## 6. 데이터 모델 거버넌스

> 원본: `.agent/rules/datarule_1.md`

### 6.1 단일 기준 문서

- **`doc/database/DATA_MODEL.md`** - 유일한 스키마 기준 문서
- 모든 테이블, 컬럼, 관계, RLS 정책은 이 문서에 정의

### 6.2 스키마 변경 절차

1. `doc/database/DATA_MODEL.md` 수정 (설계)
2. 마이그레이션 SQL 파일 작성 (구현)
3. `types/database.ts` 업데이트 (타입)
4. 코드 반영 (API/UI)

### 6.3 문서화 체크리스트

스키마 변경 시 **반드시 동기화**:
1. `doc/database/DATA_MODEL.md` - 설계 정의
2. `types/database.ts` - 타입 정의
3. 마이그레이션 SQL 파일 - 실제 변경

---

## 7. 마이그레이션 규칙

> 원본: `.agent/rules/migration_rule.md`

### 7.1 파일 규칙

- **위치**: `doc/database/`
- **파일명**: `migration-YYYYMMDDHHmm__<기능명>__<변경내용>.sql`

```
예시:
migration-202501201430__notes__add_title_column.sql
migration-202501201500__users__add_rls_policy.sql
```

### 7.2 Idempotent 작성

```sql
-- ✅ 올바름: 여러 번 실행 가능
CREATE TABLE IF NOT EXISTS ...;
ALTER TABLE table ADD COLUMN IF NOT EXISTS ...;
DROP POLICY IF EXISTS "..." ON table;
CREATE POLICY "..." ...;

-- ❌ 금지: 한 번만 실행 가능
CREATE TABLE ...;
CREATE POLICY "..." ...;
```

### 7.3 마이그레이션 파일 주석 템플릿

```sql
-- ============================================
-- 마이그레이션: <기능명> - <변경내용>
-- 날짜: YYYY-MM-DD HH:mm
-- ============================================
--
-- 변경 사항:
-- 1. <변경 내용>
--
-- 영향받는 테이블:
-- - <테이블명>
-- ============================================
```

---

## 8. 개발 체크리스트

### 새 기능 개발 시

- [ ] `components/`에서 Supabase 직접 호출 안 함
- [ ] `app/actions/`에 비즈니스 로직 분리
- [ ] Server Action 반환 타입 명시
- [ ] `types/database.ts` 사용

### 새 테이블 생성 시

- [ ] `doc/database/DATA_MODEL.md` 먼저 수정
- [ ] 마이그레이션 파일 작성 (Idempotent)
- [ ] RLS Enable + 4가지 정책 작성
- [ ] `types/database.ts` 업데이트
- [ ] `auth.users(id)` 참조
- [ ] `gen_random_uuid()` 사용

### 인증 관련 작업 시

- [ ] `getCurrentUser()` 사용 (직접 getUser 금지)
- [ ] 클라이언트에서 `useAuth()` 사용
- [ ] 세션 읽기는 서버에서만

---

## 9. 예외 허용 파일

Supabase 클라이언트 직접 생성/인증 처리 허용:

```
app/actions/**              # 모든 DB 접근
lib/supabase/**             # 클라이언트 유틸리티
contexts/auth-context.tsx   # 인증 상태 관리
app/callback/route.ts       # OAuth 콜백
```

---

## 10. 원본 룰 파일 매핑

| 이 문서 섹션 | 원본 파일 (.agent/rules/) |
|-------------|--------------------------|
| 1. 기본 규칙 | `rdrule.md` |
| 3. 인증/세션 관리 | `auth_session_rule.md` |
| 4. 레이어 분리 | `ui_datarule.md`, `datarule_2.md` |
| 5. DB/RLS 관리 | `db_rls_rule.md` |
| 6. 데이터 모델 거버넌스 | `datarule_1.md` |
| 7. 마이그레이션 | `migration_rule.md` |

---

## 11. 동기화 규칙

### `.agent/rules/` 변경 시

1. 원본 파일 수정
2. **이 파일 (`doc/claude/RULES.md`) 동기화 필수**
3. 변경 내역을 아래 로그에 기록

### 변경 로그

| 날짜 | 변경 내용 | 원본 파일 |
|------|----------|----------|
| 2025-01-20 | 최초 생성 | 전체 |

---

## 12. 참고 문서

| 문서 | 경로 |
|------|------|
| 원본 Agent 룰 | `.agent/rules/` |
| 인증 규칙 상세 | `doc/governance/AUTH_SESSION_RULES.md` |
| 레이어 분리 규칙 | `doc/governance/UI_DATA_ACCESS_RULES.md` |
| 데이터 모델 | `doc/database/DATA_MODEL.md` |
| 타입 정의 | `types/database.ts` |

---

**이 규칙을 따르지 않으면:**
- 세션 불일치 (로그인/로그아웃 혼란)
- 데이터 유출 (RLS 미적용)
- 재현 불가능한 스키마 (마이그레이션 누락)
- 401 에러 (권한 문제)
