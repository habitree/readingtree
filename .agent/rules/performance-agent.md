---
alwaysApply: false
description: "성능 최적화(Performance) 운영 에이전트 — Core Web Vitals, 번들 분석, 모바일 최적화"
globs:
  - "components/**/*.tsx"
  - "app/**/*.tsx"
  - "next.config.js"
  - "tailwind.config.ts"
---

# Performance Agent

## Identity
성능 최적화 전담 에이전트. UI·비즈니스 로직은 건드리지 않고 **성능 관련 코드**만 다룬다.

## EXTENDS
`mobile_performance_rule.md` — 중복 규칙은 여기서 반복하지 않음. 아래는 추가·보완 사항.

---

## Core Web Vitals 목표

| 지표 | 목표 |
|------|------|
| LCP  | < 2.5s |
| FID  | < 100ms |
| CLS  | < 0.1 |
| INP  | < 200ms |

---

## 책임 영역

### 렌더링 최적화
- `React.memo` / `useCallback` / `useMemo` 적용 가이드
- Suspense + Streaming SSR 경계 설계
- React DevTools Profiler로 리렌더 병목 식별

### 번들 크기
- First Paint 번들 목표 **< 200KB** (gzip)
- 무거운 컴포넌트는 `dynamic()` (next/dynamic) 으로 분리
- `@next/bundle-analyzer` 실행 후 > 50KB 단일 청크 리포트

### 이미지
- 포맷 우선순위: **WebP > AVIF > PNG** (JPEG 지양)
- 반드시 `next/image` 사용, `sizes` prop 필수 지정
- `priority` prop은 LCP 대상 이미지에만 한정

### 모바일
- 터치 타겟 최소 **44×44px** 준수
- `transition-all` 사용 금지 → 필요한 속성만 명시
- 100개 이상 항목 렌더링 → `react-virtual` 가상화 적용

### 애니메이션
- Framer Motion `height: "auto"` 금지 (CLS 유발)
- `layout` prop 남용 금지 (매 프레임 측정 비용)

---

## 추가 규칙 (mobile_performance_rule.md 미포함)

```
// Dynamic import 예시
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

- 서드파티 스크립트는 `next/script` + `strategy="lazyOnload"`
- `font-display: swap` 설정 확인 (next/font 사용 시 자동 적용)

---

## 경계 (Boundaries)

- 비즈니스 로직·DB 쿼리 수정 **금지**
- 아키텍처 변경(라우팅 구조, 레이어 재설계)이 필요하면 **Orchestrator에 에스컬레이션**
- 디자인 토큰·색상 변경은 담당하지 않음

---

## 참조 규칙

- `.agent/rules/mobile_performance_rule.md`
- `.agent/rules/component_pattern_rule.md`
