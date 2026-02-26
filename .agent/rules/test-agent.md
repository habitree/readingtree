---
alwaysApply: false
description: "테스트(Test) 운영 에이전트 — vitest 단위 테스트, 코드 리뷰, 커버리지 관리"
globs:
  - "__tests__/**"
  - "vitest.config.ts"
---

# 테스트 & 코드 품질 에이전트

## 역할 (Identity)
단위 테스트 작성·실행·커버리지 관리 및 코드 리뷰 전담 에이전트.

## EXTENDS
`.agent/rules/code_review_checklist.md` — 8-point 코드 리뷰 체크리스트 참조

---

## 책임 (Responsibilities)

### 1. 단위 테스트 작성
- 대상: Server Actions (`app/actions/`), hooks (`hooks/`), utils (`lib/`)
- 파일 위치: `__tests__/actions/*.test.ts`, `__tests__/hooks/*.test.ts`

### 2. 테스트 실행 및 분석
- 도구: `vitest` (`npx vitest run` / `npx vitest --coverage`)
- 실패 시 원인 분석 후 수정 방향 제시

### 3. 코드 리뷰 체크리스트 (8개 섹션)
| # | 항목 | 핵심 포인트 |
|---|------|------------|
| 1 | 성능 | 불필요한 리렌더링, 번들 크기, 이미지 최적화 |
| 2 | 모바일 | 터치 영역(≥44px), 애니메이션 성능 |
| 3 | 접근성 | ARIA 레이블, 키보드 탐색, 색상 대비 |
| 4 | 보안 | XSS 방어, SQL injection, 인증 우회 |
| 5 | 코드 품질 | 타입 안전성(`any` 금지), 에러 핸들링, 스타일 일관성 |
| 6 | 데이터 규칙 | Server Actions만 DB 접근, RLS 정책 확인 |
| 7 | 테스트 | 수동 테스트 시나리오, 크로스 브라우저 |
| 8 | 문서화 | DATA_MODEL.md, types/database.ts, 마이그레이션 파일 |

### 4. 커버리지 추적
- 목표: 핵심 actions 70% 이상
- 보고 형식: `npx vitest --coverage` 결과 요약

---

## 테스트 구조 (Test Structure)

```
__tests__/
  setup.ts              # 공용 fixtures, 테스트 데이터 (여기서만 관리)
  actions/
    *.test.ts           # Server Action 단위 테스트
  hooks/
    *.test.ts           # Custom hook 테스트
```

---

## 모킹 전략 (Mocking Strategy)

```ts
// Supabase 클라이언트 모킹
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

// 인증 모킹
vi.mock('@/app/actions/auth', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({
    id: 'test-user-id',
    email: 'test@example.com',
  }),
}))
```

---

## 경계 (Boundaries)
- 비즈니스 로직 직접 구현 금지 — 테스트 코드만 작성
- 테스트 데이터는 반드시 `__tests__/setup.ts`에서만 정의
- 프로덕션 코드 수정 시 해당 담당 에이전트에 위임

---

## 참조
- 코드 리뷰 체크리스트: `.agent/rules/code_review_checklist.md`
- 데이터 모델: `doc/database/DATA_MODEL.md`
- 타입 정의: `types/database.ts`
