# Home Module (홈/대시보드)

> **Module Key**: `home`
> **Layer**: C. UI 레이어
> **Last Updated**: 2025-01-25

---

## 1. 개요

메인 대시보드와 랜딩 페이지를 담당하는 UI 레이어 모듈입니다. 각 도메인 모듈의 정보를 조합하여 표시합니다.

### 1.1 주요 기능

- 로그인 사용자 대시보드
- 비로그인 랜딩 페이지
- 독서 통계 표시
- 최근 활동 표시
- 월간 독서 차트

---

## 2. 파일 구조

```
app/
├── (main)/
│   └── page.tsx (대시보드)
└── actions/
    └── stats.ts

components/
├── dashboard/
│   ├── dashboard-content.tsx
│   ├── dashboard-skeleton.tsx
│   ├── recent-notes.tsx
│   ├── monthly-chart.tsx
│   ├── monthly-stats-card.tsx
│   ├── sections/
│   │   ├── home-hero-section.tsx
│   │   └── home-hero-wrapper.tsx
│   └── login-success-toast.tsx
└── landing/
    ├── landing-page.tsx
    ├── benefits-section.tsx
    └── problem-section.tsx

hooks/
└── use-stats.ts
```

---

## 3. 페이지 분기

```typescript
// app/(main)/page.tsx
export default async function HomePage() {
  const user = await getCurrentUser()

  if (user) {
    return <DashboardContent user={user} />
  }

  return <LandingPage />
}
```

---

## 4. 대시보드 구성요소

### 4.1 통계 카드

| 항목 | 데이터 소스 |
|------|------------|
| 읽고 있는 책 | `library` 모듈 |
| 완독한 책 | `library` 모듈 |
| 작성한 노트 | `records` 모듈 |
| 이번 달 독서량 | `stats` 액션 |

### 4.2 최근 활동

```typescript
interface RecentActivity {
  notes: Note[]      // 최근 노트
  books: UserBook[]  // 최근 읽은 책
}
```

### 4.3 월간 차트

```typescript
interface MonthlyStats {
  month: string
  booksRead: number
  notesWritten: number
  pagesRead: number
}
```

---

## 5. 핵심 함수

### 5.1 Server Actions

| 함수 | 파일 | 설명 |
|------|------|------|
| `getDashboardStats()` | `app/actions/stats.ts` | 대시보드 통계 |
| `getMonthlyStats()` | `app/actions/stats.ts` | 월간 통계 |
| `getRecentActivity()` | `app/actions/stats.ts` | 최근 활동 |

### 5.2 Hooks

| Hook | 설명 |
|------|------|
| `useStats()` | 통계 데이터 상태 관리 |

---

## 6. 의존성

### 6.1 이 모듈이 사용하는 것

- `identity`: 사용자 확인
- `library`: 책 정보, 독서 통계
- `records`: 노트 정보
- `groups`: 그룹 활동 (선택적)
- `shared`: UI 컴포넌트, 유틸리티

### 6.2 이 모듈을 사용하는 것

- 없음 (최상위 UI 레이어)

---

## 7. 랜딩 페이지 구성

### 7.1 섹션

1. **Hero**: 서비스 소개, CTA 버튼
2. **Problem**: 해결하려는 문제
3. **Benefits**: 서비스 장점
4. **Features**: 주요 기능 소개
5. **CTA**: 가입 유도

### 7.2 컴포넌트

```
LandingPage
├── HeroSection
├── ProblemSection
├── BenefitsSection
├── FeaturesSection
└── CTASection
```

---

## 8. 성능 최적화

### 8.1 로딩 전략

```typescript
// Suspense를 활용한 점진적 로딩
<Suspense fallback={<DashboardSkeleton />}>
  <DashboardContent />
</Suspense>
```

### 8.2 데이터 페칭

```typescript
// 병렬 데이터 페칭
const [stats, recentNotes, recentBooks] = await Promise.all([
  getDashboardStats(userId),
  getRecentNotes(userId, 5),
  getRecentBooks(userId, 5),
])
```

---

## 9. 주의사항

> **Home은 도메인 모듈이 아닙니다**
>
> Home은 각 도메인의 정보를 **조합**하여 표시하는 UI 레이어입니다.
> - 비즈니스 로직을 포함하지 않음
> - 각 도메인 모듈의 액션을 호출하여 데이터 조합
> - 데이터 변형/저장 로직 없음

---

## 10. 참고 문서

- [08-task-timeline-stats-plan.md](../../tasks/front/08-task-timeline-stats-plan.md)
