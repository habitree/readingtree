# 모바일 성능 규칙

> 모바일 환경에서의 성능 최적화 및 사용자 경험 향상을 위한 규칙

---

## 1. Core Web Vitals 기준

| 지표 | 기준값 | 설명 |
|------|--------|------|
| **LCP** | < 2.5s | Largest Contentful Paint |
| **FID** | < 100ms | First Input Delay |
| **CLS** | < 0.1 | Cumulative Layout Shift |
| **INP** | < 200ms | Interaction to Next Paint |

---

## 2. 터치 타겟 규칙

### 2.1 최소 크기 (필수)

```css
/* 터치 타겟 최소 크기: 44x44px */
button, a, [role="button"] {
  min-height: 44px;
  min-width: 44px;
}
```

### 2.2 터치 간격

- 인접한 터치 타겟 간 최소 8px 간격 유지
- 밀집된 UI에서는 12-16px 권장

---

## 3. CSS 애니메이션 규칙

### 3.1 transition-all 사용 금지

```css
/* 금지 - 불필요한 속성까지 애니메이션 */
.element {
  transition: all 0.3s ease;
}

/* 권장 - 명시적 속성 지정 */
.element {
  transition: transform 0.15s ease, opacity 0.15s ease;
}
```

### 3.2 허용된 transition 속성

| 속성 | 사용처 | duration |
|------|--------|----------|
| `transform` | 스케일, 이동, 회전 | 100-200ms |
| `opacity` | 페이드 효과 | 100-200ms |
| `box-shadow` | 호버 그림자 | 150ms |
| `background-color` | 배경색 변경 | 150ms |

### 3.3 권장 duration

- 버튼 클릭/호버: `150ms`
- 모달/Sheet 열림: `200-300ms`
- 페이지 전환: `200-300ms`
- 복잡한 애니메이션: `300-400ms`

---

## 4. Framer Motion 규칙

### 4.1 height: "auto" 사용 금지

```tsx
// 금지 - 레이아웃 계산 비용 높음
animate={{ height: "auto", opacity: 1 }}

// 권장 - 고정 높이 사용
animate={{ height: 280, opacity: 1 }}

// 또는 scaleY 사용 (성능 더 좋음)
animate={{ scaleY: 1, opacity: 1 }}
```

### 4.2 layoutId 주의사항

- 복잡한 레이아웃 애니메이션은 모바일에서 프레임 드롭 유발
- 가능하면 `transform` 기반 애니메이션 사용

---

## 5. 터치 응답성 규칙

### 5.1 touch-action 설정

```css
/* 모든 인터랙티브 요소에 적용 */
button, [role="button"], a, .touchable {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
```

### 5.2 효과

- 300ms 터치 지연 제거
- 더블탭 확대 비활성화
- 기본 하이라이트 제거

---

## 6. 이미지 최적화

### 6.1 Next.js Image 필수 사용

```tsx
// 금지
<img src="/image.png" alt="" />

// 권장
import Image from "next/image";
<Image
  src="/image.png"
  alt=""
  width={300}
  height={200}
  sizes="(max-width: 768px) 100vw, 300px"
/>
```

### 6.2 sizes 속성 필수

- 반응형 이미지는 `sizes` 속성으로 뷰포트별 크기 지정
- 불필요한 이미지 다운로드 방지

---

## 7. 스크롤 최적화

### 7.1 가상화 사용

- 100개 이상 아이템 목록: `react-virtual` 또는 `react-window` 사용
- 무한 스크롤: 화면에 보이는 아이템만 렌더링

### 7.2 scroll-behavior

```css
/* 부드러운 스크롤 (선택적) */
html {
  scroll-behavior: smooth;
}

/* 모바일에서는 성능 우선 */
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
```

---

## 8. 모바일 테스트 체크리스트

### 개발 시 확인

- [ ] Chrome DevTools Device Mode에서 테스트
- [ ] 버튼 클릭 응답성 < 100ms
- [ ] 애니메이션 60fps 유지
- [ ] 터치 타겟 44x44px 이상

### 배포 전 확인

- [ ] Lighthouse 모바일 점수 90점 이상
- [ ] 실제 모바일 기기에서 테스트
- [ ] 네트워크 throttling (3G) 테스트

---

## 9. 성능 디버깅 도구

### Chrome DevTools

1. **Performance 탭**: 프레임 드롭 확인
2. **Rendering 탭**: Paint flashing 활성화
3. **Lighthouse**: Core Web Vitals 측정

### React DevTools

1. **Profiler**: 리렌더링 확인
2. **Highlight updates**: 불필요한 렌더링 시각화

---

## 10. 예외 사항

다음 경우에는 예외 허용:

- **복잡한 차트/그래프**: 성능보다 시각적 정확도 우선
- **게임/인터랙티브 콘텐츠**: 특수 애니메이션 허용
- **접근성**: 애니메이션 감소 설정 존중 (`prefers-reduced-motion`)

---

## 변경 로그

| 날짜 | 변경 내용 |
|------|----------|
| 2025-02-06 | 최초 생성 |
