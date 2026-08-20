# manifest.json 오류 및 렌더링 문제 검토

**작성일:** 2025년 1월  
**관련 오류:**
- `GET https://readingtree2-0.vercel.app/manifest.json 404 (Not Found)`
- `Manifest: Line: 1, column: 1, Syntax error.`

---

## 1. 발견된 오류

### 1.1 manifest.json 파일 누락 (404 오류)

**문제:**
- `app/layout.tsx`에서 `manifest: "/manifest.json"`로 설정되어 있음
- 하지만 `public/manifest.json` 파일이 존재하지 않음
- Vercel 배포 환경에서 404 오류 발생

**원인:**
- Next.js 프로젝트에서 PWA 설정을 위해 `manifest.json` 파일이 필요하지만 파일이 생성되지 않음
- `public` 폴더에 정적 파일로 배치되어야 함

**해결:**
- ✅ `public/manifest.json` 파일 생성 완료
- PWA 기본 설정 포함 (이름, 아이콘, 테마 색상 등)

### 1.2 Syntax Error (JSON 파싱 오류)

**문제:**
- `Manifest: Line: 1, column: 1, Syntax error.` 오류 발생

**원인:**
- `manifest.json` 파일이 없어서 브라우저가 404 응답을 JSON으로 파싱하려고 시도
- 404 응답은 유효한 JSON이 아니므로 Syntax Error 발생

**해결:**
- ✅ `manifest.json` 파일 생성으로 해결됨
- 유효한 JSON 형식으로 작성 완료

---

## 2. 보이지 않는 것들 (렌더링 문제)

### 2.1 차트가 렌더링되지 않는 문제

**문제:**
- 월별 기록 통계 차트가 파란색 빈 영역으로만 표시됨
- `recharts-responsive-container` 영역이 비어있음

**원인 분석:**
1. **데이터가 없는 경우:**
   - `getMonthlyStats()` 함수가 빈 배열을 반환
   - `dashboard-content.tsx`에서 `monthly.length > 0` 체크는 있지만, 차트 컴포넌트 내부에서 빈 데이터 처리 부족

2. **차트 컴포넌트 문제:**
   - `MonthlyChart` 컴포넌트가 빈 배열이나 모든 count가 0인 경우에도 `ResponsiveContainer`를 렌더링
   - Recharts가 빈 데이터로 인해 파란색 배경만 표시

**해결:**
- ✅ `MonthlyChart` 컴포넌트에 빈 데이터 체크 로직 추가
- 데이터가 없거나 모든 count가 0인 경우 `null` 반환하여 빈 상태 메시지 표시

### 2.2 월별 기록 통계 위젯이 비어있는 문제

**문제:**
- "월별 기록 통계" 카드가 비어있거나 데이터가 표시되지 않음

**원인:**
- `getMonthlyStats()` 함수가 데이터를 반환하지만, 실제 기록이 없는 경우 모든 count가 0
- 차트 컴포넌트가 빈 데이터를 처리하지 못함

**해결:**
- ✅ 차트 컴포넌트에서 빈 데이터 체크 추가
- `dashboard-content.tsx`의 빈 상태 메시지가 올바르게 표시되도록 수정

---

## 3. 수정 사항

### 3.1 생성된 파일

**`public/manifest.json`**
```json
{
  "name": "Habitree Reading Hub",
  "short_name": "Habitree",
  "description": "독서 기록 및 공유 플랫폼",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#16a34a",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/favicon.ico",
      "sizes": "48x48",
      "type": "image/x-icon"
    }
  ],
  "categories": ["books", "education", "productivity"],
  "lang": "ko",
  "dir": "ltr"
}
```

### 3.2 수정된 파일

**`components/dashboard/monthly-chart.tsx`**
- 빈 데이터 체크 로직 추가
- 모든 count가 0인 경우도 빈 데이터로 처리
- 빈 데이터일 때 `null` 반환하여 부모 컴포넌트의 빈 상태 메시지 표시

**변경 내용:**
```typescript
export function MonthlyChart({ data }: MonthlyChartProps) {
  // 빈 데이터 체크
  if (!data || data.length === 0) {
    return null;
  }

  const chartData = data.map((item) => {
    // ...
  });

  // 모든 count가 0인 경우도 빈 데이터로 처리
  const hasData = chartData.some((item) => item.count > 0);
  if (!hasData) {
    return null;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      {/* ... */}
    </ResponsiveContainer>
  );
}
```

---

## 4. 검증 방법

### 4.1 manifest.json 검증

1. **로컬 개발 환경:**
   ```bash
   npm run dev
   ```
   - 브라우저에서 `http://localhost:3000/manifest.json` 접근
   - JSON 형식이 올바르게 표시되는지 확인

2. **Vercel 배포 후:**
   - `https://readingtree2-0.vercel.app/manifest.json` 접근
   - 404 오류가 사라지고 JSON이 표시되는지 확인
   - 브라우저 개발자 도구 콘솔에서 manifest 오류가 사라졌는지 확인

### 4.2 차트 렌더링 검증

1. **데이터가 있는 경우:**
   - 대시보드에서 월별 기록 통계 차트가 정상적으로 표시되는지 확인
   - 막대 그래프가 올바르게 렌더링되는지 확인

2. **데이터가 없는 경우:**
   - 기록이 없는 사용자로 로그인
   - "데이터가 없습니다" 메시지가 표시되는지 확인
   - 파란색 빈 영역이 표시되지 않는지 확인

---

## 5. 추가 확인 사항

### 5.1 아이콘 파일 확인

`manifest.json`에서 참조하는 아이콘 파일들이 존재하는지 확인:

- ✅ `/icon.png` - `app/icon.png` 존재 (Next.js가 자동으로 `/icon.png`로 제공)
- ✅ `/favicon.ico` - `public/favicon.ico` 존재
- ⚠️ `/icon.svg` - `app/layout.tsx`에서 참조하지만 파일 존재 여부 확인 필요
- ⚠️ `/apple-icon.png` - `app/layout.tsx`에서 참조하지만 파일 존재 여부 확인 필요

### 5.2 PWA 기능 테스트

1. **모바일에서 홈 화면에 추가:**
   - 모바일 브라우저에서 앱 열기
   - "홈 화면에 추가" 옵션 확인
   - 추가 후 독립 앱처럼 동작하는지 확인

2. **오프라인 지원 (향후):**
   - Service Worker 추가 고려
   - 오프라인에서도 기본 기능 동작 확인

---

## 6. 참고 사항

### 6.1 Next.js PWA 설정

- Next.js 13+ App Router에서는 `app/layout.tsx`의 `metadata`에 `manifest` 속성으로 설정
- `public` 폴더의 파일은 자동으로 루트 경로(`/`)에서 접근 가능
- `manifest.json`은 PWA(Progressive Web App) 설정을 위한 필수 파일

### 6.2 Recharts 렌더링 최적화

- `ResponsiveContainer`는 부모 요소의 크기에 맞춰 자동으로 조정
- 빈 데이터일 때는 컴포넌트를 렌더링하지 않아 성능 향상
- 부모 컴포넌트에서 빈 상태 메시지를 표시하는 것이 UX 측면에서 더 나음

---

## 7. 완료 체크리스트

- [x] `public/manifest.json` 파일 생성
- [x] `MonthlyChart` 컴포넌트에 빈 데이터 체크 추가
- [x] 오류 검토 문서 작성
- [ ] Vercel 배포 후 manifest.json 접근 확인
- [ ] 차트 렌더링 정상 동작 확인
- [ ] 아이콘 파일 존재 여부 확인 (`icon.svg`, `apple-icon.png`)

---

**작성자:** AI Assistant  
**최종 수정일:** 2025년 1월
