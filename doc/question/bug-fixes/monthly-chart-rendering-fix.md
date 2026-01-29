# 월별 기록 통계 차트 렌더링 문제 해결

**작성일:** 2025년 1월  
**문제:** 월별 기록 통계 차트가 렌더링되지 않음 (SVG width가 0px로 설정됨)

---

## 발견된 문제

### 1. SVG width가 0px로 설정됨

**확인 결과:**
- ✅ SVG 속성은 정상 (width="654", height="300", viewBox="0 0 654 300")
- ✅ ResponsiveContainer는 정상 크기 (654x300)
- ✅ X축, Y축, 그리드는 렌더링됨
- ✅ 막대 그래프 path 요소는 6개 렌더링됨
- ❌ **`.recharts-wrapper`의 width가 0px로 설정됨** (`wrapperStyle.width: "0px"`)
- ❌ **ResponsiveContainer의 width/height가 0px로 설정됨** (`responsiveContainerStyle.width: "0px"`)
- ❌ **SVG의 CSS width가 0px로 설정됨** (`svgStyle.width: "0px"`)

**근본 원인:**
- Recharts의 SSR/hydration 문제로 인해 ResponsiveContainer가 부모 요소의 크기를 제대로 감지하지 못함
- `.recharts-wrapper`가 `position: relative`로 설정되어 있지만 width가 0px로 계산됨

### 2. 지금까지 확인하지 못한 것

**누락된 확인 사항:**
1. ❌ `.recharts-wrapper`의 width가 0px인 원인
2. ❌ ResponsiveContainer가 부모 요소의 크기를 감지하지 못하는 이유
3. ❌ SSR/hydration 문제로 인한 크기 계산 실패
4. ❌ `dynamic` import를 사용한 SSR 비활성화 필요성

---

## 수정 사항

### 1. `components/dashboard/dashboard-content.tsx` - dynamic import로 SSR 비활성화

**변경 내용:**
```typescript
import dynamic from "next/dynamic";
import { RecentNotes } from "./recent-notes";

// MonthlyChart는 클라이언트 전용 컴포넌트이므로 dynamic import로 SSR 비활성화
const MonthlyChart = dynamic(() => import("./monthly-chart").then(mod => ({ default: mod.MonthlyChart })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] flex items-center justify-center">
      <div className="text-sm text-muted-foreground">차트를 불러오는 중...</div>
    </div>
  ),
});
```

**개선 사항:**
- `dynamic` import로 SSR 완전 비활성화
- 로딩 상태 표시
- hydration mismatch 방지

### 2. `components/dashboard/monthly-chart.tsx` - SSR 체크 제거 및 레이아웃 개선

**변경 내용:**
```typescript
"use client";

// useEffect, useState 제거 (dynamic import로 SSR이 이미 비활성화됨)

export function MonthlyChart({ data }: MonthlyChartProps) {
  // 빈 데이터 체크
  if (!data || data.length === 0) {
    console.warn("[MonthlyChart] 데이터가 없습니다:", data);
    return null;
  }

  const chartData = data.map((item) => {
    try {
      const [year, month] = item.month.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return {
        month: format(date, "M월", { locale: ko }),
        count: item.count,
      };
    } catch (error) {
      console.error("[MonthlyChart] 월별 데이터 변환 오류:", item, error);
      return {
        month: item.month,
        count: item.count || 0,
      };
    }
  });

  // 모든 count가 0인 경우도 빈 데이터로 처리
  const hasData = chartData.some((item) => item.count > 0);
  if (!hasData) {
    console.warn("[MonthlyChart] 모든 count가 0입니다:", chartData);
    return null;
  }
  
  // 디버깅: 차트 데이터 로그
  console.log("[MonthlyChart] 원본 데이터:", data);
  console.log("[MonthlyChart] 변환된 차트 데이터:", chartData);
  console.log("[MonthlyChart] hasData:", hasData);

  return (
    <div 
      className="w-full h-[300px]" 
      style={{ 
        minHeight: '300px',
        width: '100%',
        position: 'relative'
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <YAxis 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
          />
          <Bar 
            dataKey="count" 
            fill="hsl(var(--primary))" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**개선 사항:**
- `useEffect`, `isMounted` 체크 제거 (dynamic import로 SSR이 이미 비활성화됨)
- 명시적인 width/height 설정
- `position: relative` 추가하여 레이아웃 안정화
- 디버깅 로그 추가

### 3. `components/dashboard/dashboard-content.tsx` - CardContent padding 명시 및 디버깅 로그 추가

**변경 내용:**
```typescript
// 데이터가 있고 실제로 count > 0인 항목이 있는지 확인
const hasValidData = monthly.some((item) => item && typeof item.count === 'number' && item.count > 0);

// 디버깅: 월별 데이터 확인 (서버 로그)
console.log('[Dashboard] 월별 통계 데이터:', JSON.stringify(monthly, null, 2));
console.log('[Dashboard] hasValidData:', hasValidData);

if (hasValidData) {
  return <MonthlyChart data={monthly} />;
}
```

**개선 사항:**
- 서버에서 실제 반환되는 데이터 확인을 위한 로그 추가
- 데이터 유효성 검사 결과 로그

---

## 추가 확인 필요 사항

### 1. 서버 로그 확인

배포 후 Vercel 로그에서 다음을 확인:
- `[Dashboard] 월별 통계 데이터:` 로그
- `[Dashboard] hasValidData:` 로그
- 실제 반환되는 `monthly` 배열의 값

### 2. 클라이언트 콘솔 확인

브라우저 개발자 도구 콘솔에서 확인:
- `MonthlyChart: 데이터가 없습니다` 경고
- `MonthlyChart: 모든 count가 0입니다` 경고
- `MonthlyChart 렌더링:` 로그 (개발 환경)

### 3. 데이터 흐름 확인

1. `getMonthlyStats(user)` 함수가 실제로 데이터를 반환하는지
2. `monthly` 배열이 `dashboard-content.tsx`에 전달되는지
3. `MonthlyChart` 컴포넌트에 `data` prop이 전달되는지
4. `chartData` 변환이 올바르게 되는지

---

## 예상되는 문제

### 1. 데이터가 모두 0인 경우

만약 모든 월의 `count`가 0이면:
- `hasValidData`가 `false`가 됨
- 빈 상태 메시지가 표시됨
- 이는 정상 동작임

### 2. 데이터 형식 문제

만약 `monthly` 배열의 형식이 예상과 다르면:
- `item.month.split("-")`에서 오류 발생 가능
- `chartData` 변환 실패
- 차트 렌더링 실패

---

## 검증 방법

### 1. 서버 로그 확인

Vercel 대시보드 → Functions → Logs에서 확인:
```
[Dashboard] 월별 통계 데이터: [...]
[Dashboard] hasValidData: true/false
```

### 2. 브라우저 콘솔 확인

개발자 도구 → Console에서 확인:
- 월별 통계 관련 경고/로그
- Recharts 관련 오류

### 3. 네트워크 탭 확인

개발자 도구 → Network에서 확인:
- Server Actions 호출 성공 여부
- 응답 데이터 확인

---

## 완료 체크리스트

- [x] SSR/hydration 문제 해결 (`dynamic` import 사용)
- [x] 디버깅 로그 추가
- [x] Bar 컴포넌트 스타일 개선
- [x] CardContent padding 명시
- [x] ResponsiveContainer 크기 설정 개선
- [ ] 서버 로그 확인
- [ ] 클라이언트 콘솔 확인
- [ ] 실제 차트 렌더링 확인

---

## 최종 해결 방법

### 핵심 문제
- `.recharts-wrapper`의 width가 0px로 설정됨
- ResponsiveContainer가 부모 요소의 크기를 제대로 감지하지 못함
- SSR/hydration 문제로 인한 초기 렌더링 실패

### 해결책
1. **`dynamic` import로 SSR 완전 비활성화**
   - `dashboard-content.tsx`에서 `dynamic(() => import("./monthly-chart"))` 사용
   - `ssr: false` 옵션으로 클라이언트 전용 렌더링

2. **명시적인 크기 설정**
   - 부모 div에 `w-full h-[300px]` 클래스 및 인라인 스타일
   - `position: relative` 추가

3. **CardContent padding 명시**
   - `className="min-h-[300px] p-6"`로 padding 보장

---

**작성자:** AI Assistant  
**최종 수정일:** 2025년 1월
