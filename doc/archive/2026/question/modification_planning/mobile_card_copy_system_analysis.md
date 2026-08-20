# 모바일 카드 복사 시스템 구성 점검

**작성일:** 2026년 1월 11일  
**목적:** 모바일에서 카드 복사 시 이미지 생성 실패 원인 분석 및 시스템 구성 점검

---

## 1. 현재 시스템 구성

### 1.1 카드 복사 흐름도

```
사용자 클릭 "카드 복사"
  ↓
handleCopyCardImage() 실행
  ↓
Step 0: 폰트 로딩 대기 (document.fonts.ready)
  ↓
Step 1: 이미지 로딩 확인 (5초 타임아웃)
  ├─ 이미지 로드 완료 → 다음 단계
  ├─ 타임아웃 → 계속 진행 (경고 무시)
  └─ 에러 → 계속 진행 (에러 무시)
  ↓
Step 2: 렌더링 안정화 대기 (1000ms)
  ↓
Step 3: html2canvas 캡처
  ├─ scale: 3.0 (고해상도)
  ├─ windowWidth: 1200 (고정)
  ├─ imageTimeout: 0 (무한 대기)
  └─ useCORS: true
  ↓
Step 4: Canvas → Blob 변환 (품질 0.95)
  ↓
Step 5: 클립보드 복사
  ├─ 성공 → toast.success
  └─ 실패 → 다운로드로 fallback
```

### 1.2 주요 파일 구조

```
components/share/
├── simple-share-dialog.tsx    # 카드 복사 로직 (Line 93-227)
└── share-note-card.tsx         # 카드 컴포넌트 (캡처 대상)

lib/utils/
├── clipboard.ts                # 클립보드 유틸리티
├── device.ts                   # 디바이스 감지
└── image.ts                    # 이미지 URL 처리

app/actions/
└── share.ts                    # 공유 관련 Server Actions
```

---

## 2. 현재 구현 상세 분석

### 2.1 카드 복사 로직 (`simple-share-dialog.tsx`)

#### 2.1.1 이미지 로딩 확인 (Line 115-151)

```typescript
// 현재 구현
const images = Array.from(targetElement.querySelectorAll("img"));
await Promise.all(
  images.map((img, index) => {
    return new Promise<void>((resolve) => {
      // 이미 로드된 이미지
      if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve();
        return;
      }
      
      const timeout = setTimeout(() => {
        resolve(); // ⚠️ 타임아웃 시에도 resolve (실패 무시)
      }, 5000);
      
      img.onload = () => resolve();
      img.onerror = () => resolve(); // ⚠️ 에러 시에도 resolve (실패 무시)
    });
  })
);
```

**문제점:**
1. ❌ 이미지 로딩 실패 시에도 계속 진행
2. ❌ 타임아웃이 너무 짧음 (모바일 네트워크 고려 안 함)
3. ❌ Next.js Image 최적화 URL 처리 안 함
4. ❌ CORS 문제 미해결

#### 2.1.2 html2canvas 설정 (Line 163-178)

```typescript
// 현재 구현
const canvas = await html2canvas(targetElement, {
  scale: 3.0,                    // ⚠️ 모바일에서 과도함
  useCORS: true,
  allowTaint: false,
  backgroundColor: "#ffffff",
  logging: true,
  imageTimeout: 0,               // ⚠️ 무한 대기
  windowWidth: 1200,             // ⚠️ 고정 너비
  scrollX: 0,
  scrollY: 0,
  foreignObjectRendering: false,
  onclone: (clonedDoc: Document) => {
    // ⚠️ 최적화 로직 없음
    console.log("[카드 복사] 클론 생성 완료");
  }
});
```

**문제점:**
1. ❌ Scale 3.0은 모바일에서 메모리 부족 위험
   - 계산: 960px × 3.0 = 2880px 너비
   - 메모리: 2880 × 1440 × 4 bytes ≈ 16.6MB
   - 모바일 기기 메모리 제한 초과 가능

2. ❌ imageTimeout: 0은 무한 대기
   - 이미지 로딩 실패 시 영구 대기
   - 사용자 경험 저하

3. ❌ windowWidth: 1200은 모바일과 불일치
   - 모바일 화면 크기와 차이로 렌더링 오차

4. ❌ onclone에서 최적화 없음
   - 불필요한 요소 제거 안 함
   - 이미지 최적화 안 함

#### 2.1.3 클립보드 복사 (Line 200-220)

```typescript
// 현재 구현
if (navigator.clipboard && ClipboardItem) {
  await navigator.clipboard.write([
    new ClipboardItem({
      "image/png": blob,
    }),
  ]);
  toast.success("카드가 클립보드에 복사되었습니다!");
} else {
  // Fallback: 다운로드
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `habitree-card-${note.id}.png`;
  link.click();
  URL.revokeObjectURL(url);
  toast.success("카드 이미지가 다운로드되었습니다!");
}
```

**문제점:**
1. ⚠️ 모바일에서 ClipboardItem 지원 확인 안 함
2. ⚠️ 에러 처리 부족
3. ✅ Fallback 다운로드는 잘 구현됨

### 2.2 카드 컴포넌트 (`share-note-card.tsx`)

#### 2.2.1 이미지 렌더링 (Line 152-174, 206-213)

```typescript
// 책 표지 이미지
<Image
  src={getImageUrl(book?.cover_image_url || "/placeholder-book.png")}
  alt={book?.title || "Book"}
  fill
  className="object-cover"
  sizes="64px"
  priority={true}
/>

// 필사/사진 이미지
<Image
  src={getImageUrl(note.image_url!)}
  alt="Captured Moment"
  fill
  className="object-contain"
  sizes="(max-width: 768px) 100vw, 400px"
  priority={true}
/>
```

**문제점:**
1. ❌ `crossOrigin="anonymous"` 설정 없음
   - CORS 문제로 html2canvas 캡처 실패 가능

2. ❌ `data-original-src` 속성 없음
   - Next.js Image 최적화 URL에서 원본 URL 추출 불가

3. ❌ Next.js Image 최적화 URL 처리
   - `/_next/image?url=...` 형식은 html2canvas가 직접 처리 못함

#### 2.2.2 사용자 아바타 (Line 343-354)

```typescript
// 캡처 시
<img
  src={getProxiedImageUrl(user.avatar_url)}
  alt={user.name || "User"}
  className="h-full w-full object-cover"
  crossOrigin="anonymous"  // ✅ 설정되어 있음
/>
```

**분석:**
- ✅ `crossOrigin="anonymous"` 설정되어 있음
- ⚠️ `getProxiedImageUrl()` 사용 (Next.js Image 최적화 URL)
- ⚠️ html2canvas가 이 URL을 처리 못할 수 있음

### 2.3 이미지 유틸리티 (`lib/utils/image.ts`)

#### 2.3.1 getImageUrl() (Line 44-68)

```typescript
export function getImageUrl(
  url: string | null | undefined,
  fallback?: string
): string {
  if (!url) {
    if (fallback && (isValidImageUrl(fallback) || fallback.startsWith("/"))) {
      return fallback.startsWith("/") ? fallback : convertToHttps(fallback);
    }
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
  }

  if (isValidImageUrl(url)) {
    return convertToHttps(url);
  }

  if (url.startsWith("/")) {
    return url;
  }

  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
}
```

**분석:**
- ✅ HTTP → HTTPS 변환 처리
- ✅ Fallback 이미지 제공
- ⚠️ Next.js Image 최적화 URL 처리 안 함

#### 2.3.2 getProxiedImageUrl() (Line 115-126)

```typescript
export function getProxiedImageUrl(url: string | null | undefined): string {
  const originalUrl = getImageUrl(url);

  if (originalUrl.startsWith("data:") || originalUrl.startsWith("/")) {
    return originalUrl;
  }

  // Next.js Image Optimization API URL 구성
  return `/_next/image?url=${encodeURIComponent(originalUrl)}&w=640&q=75`;
}
```

**분석:**
- ✅ Next.js Image 최적화 URL 생성
- ❌ html2canvas가 이 URL을 직접 처리 못함
- ❌ 원본 URL 추출 함수 없음

### 2.4 디바이스 감지 (`lib/utils/device.ts`)

#### 2.4.1 isMobile() (Line 8-14)

```typescript
export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}
```

**분석:**
- ✅ 기본적인 모바일 감지
- ⚠️ 디바이스별 최적화 함수 없음
- ⚠️ 메모리 제한 확인 함수 없음

---

## 3. 모바일 리소스 문제 분석

### 3.1 메모리 사용량 계산

#### 현재 설정 (Scale 3.0)
```
카드 크기: 960px × 560px (예상)
캔버스 크기: 2880px × 1680px (Scale 3.0)
메모리 사용량: 2880 × 1680 × 4 bytes = 19.35MB
```

#### 모바일 기기 메모리 제한
- **iOS Safari**: 약 512MB ~ 1GB (기기별 상이)
- **Android Chrome**: 약 1GB ~ 2GB (기기별 상이)
- **Canvas 메모리 제한**: 기기별로 다르지만 일반적으로 50MB ~ 100MB

**결론:** Scale 3.0은 모바일에서 메모리 부족 위험 높음

### 3.2 네트워크 지연

#### 모바일 네트워크 특성
- **4G/LTE**: 평균 10-50Mbps (불안정)
- **Wi-Fi**: 평균 50-100Mbps (상대적으로 안정)
- **이미지 로딩 시간**: 데스크톱 대비 2-3배 느림

#### 현재 타임아웃 설정
- **이미지 로딩 타임아웃**: 5초
- **html2canvas imageTimeout**: 0 (무한 대기)

**문제점:**
- 5초 타임아웃은 모바일에서 너무 짧을 수 있음
- imageTimeout: 0은 이미지 로딩 실패 시 영구 대기

### 3.3 브라우저 제한

#### iOS Safari 제한
- 최대 Canvas 크기: 약 4096px × 4096px
- 메모리 제한: 기기별 상이 (일반적으로 50MB ~ 100MB)
- ClipboardItem 지원: iOS 13.1+

#### Android Chrome 제한
- 최대 Canvas 크기: 기기별 상이 (일반적으로 8192px × 8192px)
- 메모리 제한: 기기별 상이 (일반적으로 100MB ~ 200MB)
- ClipboardItem 지원: Chrome 76+

**현재 설정 문제:**
- Scale 3.0으로 2880px 너비는 iOS Safari에서 문제 없음
- 하지만 메모리 사용량이 제한에 근접할 수 있음

---

## 4. 이미지 로딩 문제 분석

### 4.1 Next.js Image 최적화 URL

#### 문제 상황
```
원본 URL: https://example.com/image.jpg
Next.js 최적화 URL: /_next/image?url=https%3A%2F%2Fexample.com%2Fimage.jpg&w=640&q=75
```

**html2canvas 처리:**
- html2canvas는 `/_next/image?url=...` 형식을 직접 처리 못함
- Next.js 서버가 이미지를 프록시하여 제공하지만, html2canvas는 이를 인식 못함
- 결과: 이미지가 빈 이미지로 캡처됨

### 4.2 CORS 문제

#### 외부 이미지 (네이버 쇼핑 등)
```
이미지 URL: https://shopping-phinf.pstatic.net/...
CORS 정책: Access-Control-Allow-Origin 헤더 없음
```

**문제:**
- `crossOrigin="anonymous"` 설정해도 CORS 정책으로 차단
- html2canvas가 이미지를 로드하지 못함
- 결과: 이미지가 빈 이미지로 캡처됨

### 4.3 이미지 로딩 실패 처리

#### 현재 구현
```typescript
img.onerror = () => resolve(); // 에러 시에도 resolve (실패 무시)
```

**문제:**
- 이미지 로딩 실패해도 계속 진행
- 결과적으로 빈 이미지 또는 깨진 이미지가 포함됨

---

## 5. 시스템 구성 요약

### 5.1 현재 구성의 장점

1. ✅ 기본적인 카드 복사 기능 구현됨
2. ✅ PC에서는 대체로 정상 작동
3. ✅ Fallback 다운로드 기능 있음
4. ✅ 사용자 피드백 (toast) 제공

### 5.2 현재 구성의 문제점

1. ❌ 모바일 최적화 없음
   - Scale 3.0은 모바일에서 과도함
   - 메모리 부족 위험

2. ❌ 이미지 로딩 처리 미흡
   - Next.js Image 최적화 URL 처리 안 함
   - CORS 문제 미해결
   - 이미지 로딩 실패 시에도 계속 진행

3. ❌ 에러 처리 부족
   - 메모리 부족 시 명확한 에러 메시지 없음
   - 네트워크 오류 시 적절한 처리 없음

4. ❌ 사용자 피드백 개선 필요
   - 진행 상태가 불명확함
   - 에러 발생 시 구체적인 안내 없음

---

## 6. 개선 방향

### 6.1 즉시 개선 가능한 사항

1. **Scale 조정**
   - 모바일: 1.5, PC: 3.0
   - 메모리 사용량 약 75% 감소

2. **이미지 타임아웃 설정**
   - `imageTimeout: 15000` (15초)
   - 무한 대기 방지

3. **이미지 로딩 실패 처리**
   - 실패한 이미지 식별
   - 사용자에게 명확한 피드백

### 6.2 근본적 개선 사항

1. **이미지 Base64 변환**
   - 모든 이미지를 Base64로 변환
   - CORS 문제 완전 해결
   - Next.js Image 최적화 URL 문제 해결

2. **메모리 최적화**
   - 디바이스별 최적 Scale
   - 불필요한 요소 제거
   - Blob 압축

3. **에러 처리 강화**
   - 에러 타입별 처리
   - 명확한 사용자 안내

---

## 7. 체크리스트

### 현재 시스템 점검

- [x] 카드 복사 로직 분석 완료
- [x] 이미지 로딩 로직 분석 완료
- [x] html2canvas 설정 분석 완료
- [x] 모바일 리소스 문제 분석 완료
- [x] 이미지 로딩 문제 분석 완료
- [x] 시스템 구성 요약 완료

### 개선 작업

- [ ] 모바일 최적화 적용
- [ ] 이미지 Base64 변환 구현
- [ ] 에러 처리 강화
- [ ] 사용자 피드백 개선
- [ ] 테스트 및 검증

---

**이 문서는 모바일 카드 복사 시스템의 현재 상태를 점검하고 개선 방향을 제시합니다.**
