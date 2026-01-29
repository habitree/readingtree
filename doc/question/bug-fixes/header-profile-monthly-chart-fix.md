# 헤더 프로필 및 월별 통계 차트 표시 문제 해결

**작성일:** 2025년 1월  
**문제:** 메인 화면 상단 프로필이 보이지 않고, 월별 기록 통계가 보이지 않음

---

## 발견된 문제

### 1. 헤더 프로필 표시 문제

**확인 결과:**
- ✅ DOM에는 프로필 버튼이 존재함
- ✅ 이미지도 정상적으로 로드됨
- ⚠️ 하지만 사용자가 보이지 않는다고 함

**가능한 원인:**
- CSS 스타일링 문제 (크기, 위치, z-index)
- Avatar 컴포넌트의 렌더링 문제
- 이미지 로딩 실패로 인한 Fallback 표시 문제

**해결:**
- ✅ Avatar 컴포넌트에 명시적인 스타일 추가
- ✅ border 추가하여 시각적 구분 강화
- ✅ Fallback 배경색 및 텍스트 색상 명시

### 2. 월별 기록 통계 차트 표시 문제

**확인 결과:**
- ❌ `CardContent`를 DOM에서 찾을 수 없음
- ❌ `ResponsiveContainer`가 렌더링되지 않음
- ⚠️ 스냅샷에는 차트가 있는 것으로 보이지만 실제로는 비어있음

**가능한 원인:**
- `MonthlyChart` 컴포넌트가 `null`을 반환
- 데이터 유효성 검사 로직 문제
- 조건부 렌더링으로 인한 렌더링 실패

**해결:**
- ✅ 데이터 유효성 검사 강화
- ✅ `MonthlyChart` 컴포넌트에 명시적인 컨테이너 div 추가
- ✅ 에러 처리 및 로깅 추가

---

## 수정 사항

### 1. `components/layout/header.tsx` - 헤더 프로필 스타일 개선

**변경 내용:**
```typescript
<Button 
  variant="ghost" 
  className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full p-0"
  aria-label="프로필"
>
  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-background">
    <AvatarImage 
      src={getImageUrl(userAvatar)} 
      alt={userName}
      className="object-cover"
    />
    <AvatarFallback className="text-xs sm:text-sm bg-primary text-primary-foreground">
      {userName.charAt(0).toUpperCase()}
    </AvatarFallback>
  </Avatar>
</Button>
```

**개선 사항:**
- `p-0` 추가하여 버튼 패딩 제거
- `border-2 border-background` 추가하여 Avatar 경계선 명확화
- `object-cover` 추가하여 이미지 표시 개선
- Fallback 배경색 및 텍스트 색상 명시

### 2. `components/dashboard/monthly-chart.tsx` - 차트 렌더링 개선

**변경 내용:**
```typescript
export function MonthlyChart({ data }: MonthlyChartProps) {
  // 빈 데이터 체크
  if (!data || data.length === 0) {
    console.warn("MonthlyChart: 데이터가 없습니다", data);
    return null;
  }

  const chartData = data.map((item) => {
    const [year, month] = item.month.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return {
      month: format(date, "M월", { locale: ko }),
      count: item.count,
    };
  });

  // 모든 count가 0인 경우도 빈 데이터로 처리
  const hasData = chartData.some((item) => item.count > 0);
  if (!hasData) {
    console.warn("MonthlyChart: 모든 count가 0입니다", chartData);
    return null;
  }

  // 디버깅: 차트 데이터 로그
  if (process.env.NODE_ENV === 'development') {
    console.log("MonthlyChart 렌더링:", chartData);
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="hsl(var(--primary))" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**개선 사항:**
- 명시적인 컨테이너 div 추가 (`<div className="w-full h-[300px]">`)
- 차트 margin 추가하여 레이아웃 개선
- 디버깅 로그 추가
- 에러 처리 강화

### 3. `components/dashboard/dashboard-content.tsx` - 데이터 유효성 검사 강화

**변경 내용:**
```typescript
<CardContent className="min-h-[300px]">
  {(() => {
    // 데이터 유효성 검사 강화
    if (!monthly || !Array.isArray(monthly) || monthly.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[300px] text-center p-6 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/20">
          <div className="rounded-full bg-muted p-4 mb-4">
            <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">데이터를 불러올 수 없습니다</h3>
          <p className="text-sm text-muted-foreground max-w-[250px]">
            월별 통계 데이터를 불러오는 중 오류가 발생했습니다.
          </p>
        </div>
      );
    }

    // 데이터가 있고 실제로 count > 0인 항목이 있는지 확인
    const hasValidData = monthly.some((item) => item && typeof item.count === 'number' && item.count > 0);
    
    if (hasValidData) {
      return <MonthlyChart data={monthly} />;
    }
    
    // 빈 데이터 메시지 표시
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center p-6 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/20">
        {/* ... 빈 상태 메시지 ... */}
      </div>
    );
  })()}
</CardContent>
```

**개선 사항:**
- `min-h-[300px]` 추가하여 최소 높이 보장
- 데이터 유효성 검사 강화 (배열 체크, 타입 체크)
- 에러 상태 메시지 추가
- 타입 안전성 개선

---

## 검증 방법

### 1. 헤더 프로필 표시 확인

1. 메인 페이지 접속
2. 헤더 우측 상단 확인
3. 프로필 이미지 또는 Fallback 문자가 표시되는지 확인
4. 프로필 버튼 클릭 시 드롭다운 메뉴 표시 확인

### 2. 월별 기록 통계 차트 표시 확인

1. 메인 페이지 접속
2. "월별 기록 통계" 섹션 확인
3. 차트가 표시되는지 확인
4. 데이터가 없는 경우 빈 상태 메시지가 표시되는지 확인

---

## 완료 체크리스트

- [x] 헤더 프로필 Avatar 스타일 개선
- [x] 월별 통계 차트 컨테이너 추가
- [x] 데이터 유효성 검사 강화
- [x] 에러 처리 및 로깅 추가
- [ ] 헤더 프로필 표시 테스트
- [ ] 월별 통계 차트 표시 테스트

---

**작성자:** AI Assistant  
**최종 수정일:** 2025년 1월
