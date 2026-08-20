# TASK-08: 타임라인 및 통계

**작업 ID:** TASK-08  
**우선순위:** P0 (Must Have)  
**예상 소요 시간:** 2일  
**의존성:** TASK-01, TASK-02, TASK-03, TASK-05  
**다음 작업:** 없음

---

## 작업 개요

독서 타임라인 조회, 정렬, 독서 통계, 목표 진행률 기능을 구현합니다.

---

## 작업 범위

### 포함 사항
- ✅ 타임라인 조회
- ✅ 타임라인 정렬
- ✅ 독서 통계
- ✅ 목표 진행률
- ✅ 차트 시각화
- ✅ 대시보드 (홈)

### 제외 사항
- ❌ 기록 작성/수정 (TASK-05)
- ❌ 프로필 관리 (TASK-10)

---

## 상세 작업 목록

### 1. 타임라인 페이지

**파일:**
- `app/(main)/timeline/page.tsx` - 타임라인 페이지

**기능:**
- 시간순 기록 표시
- 월별 그룹화
- 정렬 옵션 (최신순, 오래된순, 책별)
- 무한 스크롤 또는 페이지네이션

### 2. 타임라인 컴포넌트

**파일:**
- `components/timeline/timeline-item.tsx` - 타임라인 아이템

**기능:**
- 기록 표시
- 날짜 표시
- 책 정보 표시

### 3. 대시보드 (홈)

**파일:**
- `app/(main)/page.tsx` - 홈/대시보드

**기능:**
- 올해 독서 목표 진행률
- 이번 주 통계
- 최근 기록
- 차트 시각화

### 4. 통계 Hooks

**파일:**
- `hooks/use-stats.ts` - 통계 관련 커스텀 훅

---

## 파일 구조

```
app/
└── (main)/
    ├── page.tsx              # 홈/대시보드
    └── timeline/
        └── page.tsx

components/
└── timeline/
    └── timeline-item.tsx

hooks/
└── use-stats.ts
```

---

## API 인터페이스

### Server Actions

```typescript
// app/actions/stats.ts
export async function getTimeline(
  sortBy: 'latest' | 'oldest' | 'book' = 'latest',
  page: number = 1
) {
  // 타임라인 조회
}

export async function getReadingStats() {
  // 독서 통계 조회
  // 반환: { thisWeek: {...}, thisYear: {...}, topBooks: [...] }
}

export async function getGoalProgress() {
  // 목표 진행률 조회
  // 반환: { goal: number, completed: number, progress: number }
}
```

---

## 사용자 스토리 매핑

- US-029: 독서 타임라인 조회
- US-030: 독서 통계 확인
- US-031: 목표 진행률 추적
- US-032: 타임라인 정렬 옵션

---

## 검증 체크리스트

- [x] 타임라인이 정상 조회됨
- [x] 타임라인 정렬이 정상 작동함
- [x] 월별 그룹화가 정상 작동함
- [x] 독서 통계가 정상 표시됨
- [x] 목표 진행률이 정상 표시됨
- [x] 차트가 정상 렌더링됨
- [x] 대시보드가 정상 작동함

---

## 개발 프롬프트

```
다음 문서들을 참고하여 타임라인 및 통계 기능을 구현해주세요.

참고 문서:
- doc/user_stories.md (US-029~US-032)
- doc/software_design.md (4.3.2 독서 통계 함수)
- doc/Habitree-Reading-Hub-PRD.md (4.1.6 타임라인 기능)

작업 내용:
1. 타임라인 페이지 구현:
   - 시간순 기록 표시
   - 월별 그룹화
   - 정렬 옵션 (최신순, 오래된순, 책별)
   - 무한 스크롤 또는 페이지네이션
2. 타임라인 컴포넌트 구현
3. 대시보드 (홈) 구현:
   - 올해 독서 목표 진행률
   - 이번 주 통계 (읽은 책, 작성 기록, 공유 횟수)
   - 최근 기록
   - 차트 시각화 (Recharts 사용)
4. 통계 Hooks 구현
5. Server Actions 구현

주의사항:
- 타임라인은 created_at 기준 정렬
- 월별 그룹화는 프론트엔드에서 처리
- 통계는 Supabase 함수 활용 (get_user_completed_books_count 등)
- 차트는 Recharts 라이브러리 사용
- 목표 진행률: (완독한 책 수 / 목표) * 100

완료 후:
- 각 함수에 JSDoc 주석 추가
- 에러 처리 로직 추가
- 로딩 상태 처리
```

---

## 참고 문서

### 필수 참고
- [user_stories.md](../../user_stories.md) - US-029~US-032
- [software_design.md](../../software_design.md) - 4.3.2 독서 통계 함수
- [Habitree-Reading-Hub-PRD.md](../../Habitree-Reading-Hub-PRD.md) - 4.1.6 타임라인 기능

### 추가 참고
- [Recharts 문서](https://recharts.org/)
- [date-fns 문서](https://date-fns.org/)

---

**문서 끝**

