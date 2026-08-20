# 모바일 카드 복사 기능 근본 개선 프롬프트

**작성일:** 2026년 1월 11일  
**우선순위:** 최고  
**작업 범위:** 모바일 환경에서 카드 복사 기능 완전 재구현

---

## 1. 문제 정의

### 1.1 현재 증상

모바일 디바이스에서 카드 복사 기능 실행 시:
- ❌ 이미지가 생성되지 않음 (빈 이미지 또는 흰색 배경만 표시)
- ❌ 카드 복사 버튼 클릭 후 아무 반응 없음
- ❌ 일부 모바일 기기에서 메모리 부족 오류 발생
- ❌ 이미지 로딩이 완료되지 않아 캡처 실패

### 1.2 근본 원인 분석

#### 1.2.1 리소스 제한 문제

**현재 설정:**
```typescript
// simple-share-dialog.tsx (Line 163-178)
const canvas = await html2canvas(targetElement, {
  scale: 3.0,  // ⚠️ 모바일에서 메모리 부족 위험
  useCORS: true,
  allowTaint: false,
  backgroundColor: "#ffffff",
  logging: true,
  imageTimeout: 0,  // ⚠️ 타임아웃 없음
  windowWidth: 1200,  // ⚠️ 고정 너비
  scrollX: 0,
  scrollY: 0,
  foreignObjectRendering: false,
});
```

**문제점:**
1. **Scale 3.0은 모바일에서 과도함**
   - 960px 너비 × 3.0 = 2880px 너비의 캔버스
   - 메모리 사용량: 약 2880 × 1440 × 4 bytes ≈ 16.6MB (RGBA)
   - 모바일 기기 메모리 제한으로 실패 가능성 높음

2. **이미지 타임아웃 없음**
   - `imageTimeout: 0`은 무한 대기를 의미
   - 모바일 네트워크에서 이미지 로딩 실패 시 영구 대기

3. **고정 뷰포트 크기**
   - `windowWidth: 1200`은 모바일 화면 크기와 불일치
   - 모바일에서 렌더링 오차 발생 가능

#### 1.2.2 이미지 로딩 문제

**현재 이미지 로딩 로직:**
```typescript
// simple-share-dialog.tsx (Line 115-151)
const images = Array.from(targetElement.querySelectorAll("img"));
await Promise.all(
  images.map((img, index) => {
    return new Promise<void>((resolve) => {
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
1. **Next.js Image 최적화 URL 처리 미흡**
   - Next.js Image 컴포넌트는 `/_next/image?url=...` 형식의 최적화 URL 사용
   - html2canvas가 이 URL을 직접 처리하지 못할 수 있음

2. **CORS 문제**
   - 외부 이미지(네이버 쇼핑 등)는 CORS 제한으로 캡처 실패
   - `crossOrigin="anonymous"` 설정이 모든 이미지에 적용되지 않음

3. **이미지 로딩 실패 시에도 계속 진행**
   - `img.onerror`에서도 `resolve()`를 호출하여 실패한 이미지로 캡처 진행
   - 결과적으로 빈 이미지 또는 깨진 이미지가 포함됨

#### 1.2.3 모바일 환경 특수성

1. **메모리 제한**
   - iOS Safari: 약 512MB ~ 1GB (기기별 상이)
   - Android Chrome: 약 1GB ~ 2GB (기기별 상이)
   - 고해상도 캔버스 생성 시 메모리 부족 위험

2. **네트워크 지연**
   - 모바일 네트워크는 불안정할 수 있음
   - 이미지 로딩 시간이 데스크톱보다 길 수 있음

3. **브라우저 제한**
   - 일부 모바일 브라우저는 Canvas 크기 제한
   - iOS Safari는 최대 캔버스 크기 제한 있음

---

## 2. 해결 방안

### 2.1 모바일 최적화 전략

#### 전략 1: 디바이스별 Scale 조정

```typescript
// 모바일: scale 1.5, PC: scale 3.0
const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
  navigator.userAgent
);

const canvasScale = isMobileDevice ? 1.5 : 3.0;
```

**효과:**
- 모바일 메모리 사용량 약 75% 감소 (3.0 → 1.5)
- 캔버스 크기: 2880px → 1440px
- 메모리: 16.6MB → 8.3MB

#### 전략 2: 이미지 Base64 변환 (권장)

**문제:** Next.js Image 최적화 URL과 CORS 문제 해결

**해결:** 캡처 전 모든 이미지를 Base64로 변환

```typescript
async function convertImagesToBase64(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll("img")) as HTMLImageElement[];
  
  await Promise.all(
    images.map(async (img) => {
      try {
        // 1. 원본 URL 가져오기
        const originalUrl = img.getAttribute("data-original-src") || img.src;
        
        // 2. Next.js 최적화 URL인 경우 원본 URL 추출
        const actualUrl = extractOriginalUrl(originalUrl);
        
        // 3. 이미지 로드 (CORS 처리)
        const base64 = await loadImageAsBase64(actualUrl);
        
        // 4. img src를 base64로 교체
        img.src = base64;
        img.crossOrigin = "anonymous";
      } catch (error) {
        console.error("이미지 변환 실패:", error);
        // 실패한 이미지는 placeholder로 대체
        img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
      }
    })
  );
}
```

**효과:**
- CORS 문제 완전 해결
- Next.js Image 최적화 URL 문제 해결
- 이미지 로딩 보장

#### 전략 3: 점진적 이미지 로딩 및 검증

```typescript
async function ensureAllImagesLoaded(element: HTMLElement, timeout: number = 10000): Promise<boolean> {
  const images = Array.from(element.querySelectorAll("img")) as HTMLImageElement[];
  
  const results = await Promise.allSettled(
    images.map((img, index) => {
      return new Promise<boolean>((resolve) => {
        // 이미 로드된 이미지
        if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
          console.log(`[이미지 ${index + 1}] 이미 로드됨`);
          resolve(true);
          return;
        }
        
        const timeoutId = setTimeout(() => {
          console.warn(`[이미지 ${index + 1}] 타임아웃:`, img.src);
          resolve(false); // 타임아웃 시 실패로 처리
        }, timeout);
        
        img.onload = () => {
          console.log(`[이미지 ${index + 1}] 로드 완료`);
          clearTimeout(timeoutId);
          resolve(true);
        };
        
        img.onerror = (e) => {
          console.error(`[이미지 ${index + 1}] 로드 실패:`, img.src, e);
          clearTimeout(timeoutId);
          resolve(false); // 에러 시 실패로 처리
        };
      });
    })
  );
  
  const successCount = results.filter(r => r.status === "fulfilled" && r.value === true).length;
  const totalCount = images.length;
  
  console.log(`[이미지 로딩] 성공: ${successCount}/${totalCount}`);
  
  // 모든 이미지가 로드되었는지 확인
  return successCount === totalCount;
}
```

**효과:**
- 이미지 로딩 상태 정확히 파악
- 실패한 이미지 식별 가능
- 사용자에게 명확한 피드백 제공

### 2.2 메모리 최적화

#### 최적화 1: 캔버스 크기 제한

```typescript
// 모바일에서 최대 캔버스 크기 제한
const MAX_CANVAS_SIZE = isMobileDevice ? 2048 : 4096;

const canvas = await html2canvas(targetElement, {
  scale: canvasScale,
  useCORS: true,
  allowTaint: false,
  backgroundColor: "#ffffff",
  logging: false,
  imageTimeout: 15000, // 15초 타임아웃
  windowWidth: isMobileDevice ? 960 : 1200, // 모바일에서 작은 뷰포트
  scrollX: 0,
  scrollY: 0,
  foreignObjectRendering: false,
  // 메모리 최적화 옵션
  removeContainer: true, // 캡처 후 컨테이너 제거
  onclone: (clonedDoc: Document) => {
    // 클론된 문서에서 불필요한 요소 제거
    const scripts = clonedDoc.querySelectorAll("script");
    scripts.forEach(script => script.remove());
    
    // 이미지 최적화
    const images = clonedDoc.querySelectorAll("img");
    images.forEach(img => {
      img.loading = "eager";
      img.decoding = "sync";
    });
  }
});
```

#### 최적화 2: Blob 압축

```typescript
// Canvas를 Blob으로 변환 시 품질 조정
const blob = await new Promise<Blob>((resolve, reject) => {
  canvas.toBlob(
    (blob: Blob | null) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("이미지 변환 실패"));
      }
    },
    "image/png",
    isMobileDevice ? 0.85 : 0.95 // 모바일에서 약간 낮은 품질
  );
});
```

### 2.3 에러 처리 및 사용자 피드백

```typescript
const handleCopyCardImage = async () => {
  try {
    setIsCapturing(true);
    toast.info("카드를 생성하는 중...");
    
    // Step 1: 이미지 Base64 변환
    toast.info("이미지를 준비하는 중...");
    await convertImagesToBase64(targetElement);
    
    // Step 2: 이미지 로딩 확인
    toast.info("이미지 로딩 확인 중...");
    const allImagesLoaded = await ensureAllImagesLoaded(targetElement, 10000);
    
    if (!allImagesLoaded) {
      toast.warning("일부 이미지 로딩에 실패했습니다. 계속 진행합니다.");
    }
    
    // Step 3: 렌더링 안정화 대기
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Step 4: html2canvas 캡처
    toast.info("카드를 생성하는 중...");
    const canvas = await html2canvas(targetElement, {
      // ... 최적화된 옵션
    });
    
    // Step 5: Blob 변환
    const blob = await canvasToBlob(canvas);
    
    // Step 6: 클립보드 복사
    await copyImageToClipboard(blob);
    
    toast.success("카드가 클립보드에 복사되었습니다!");
  } catch (error) {
    console.error("카드 복사 오류:", error);
    
    // 에러 타입별 처리
    if (error instanceof Error) {
      if (error.message.includes("메모리") || error.message.includes("memory")) {
        toast.error("메모리 부족으로 카드 생성에 실패했습니다. 다른 앱을 닫고 다시 시도해주세요.");
      } else if (error.message.includes("타임아웃") || error.message.includes("timeout")) {
        toast.error("이미지 로딩 시간이 초과되었습니다. 네트워크를 확인하고 다시 시도해주세요.");
      } else {
        toast.error("카드 복사에 실패했습니다. 다시 시도해주세요.");
      }
    } else {
      toast.error("알 수 없는 오류가 발생했습니다.");
    }
  } finally {
    setIsCapturing(false);
  }
};
```

---

## 3. 구현 계획

### 3.1 단계별 작업

#### Phase 1: 유틸리티 함수 구현

**파일:** `lib/utils/card-capture.ts` (신규 생성)

**구현 함수:**
1. `convertImagesToBase64()` - 이미지 Base64 변환
2. `ensureAllImagesLoaded()` - 이미지 로딩 확인
3. `extractOriginalUrl()` - Next.js Image URL에서 원본 URL 추출
4. `loadImageAsBase64()` - 이미지를 Base64로 로드
5. `canvasToBlob()` - Canvas를 Blob으로 변환 (디바이스별 최적화)

#### Phase 2: 디바이스 감지 및 최적화

**파일:** `lib/utils/device.ts` (기존 파일 확장)

**추가 함수:**
1. `getOptimalCanvasScale()` - 디바이스별 최적 Scale 반환
2. `getMaxCanvasSize()` - 디바이스별 최대 캔버스 크기 반환
3. `estimateMemoryUsage()` - 예상 메모리 사용량 계산

#### Phase 3: 카드 복사 로직 재구현

**파일:** `components/share/simple-share-dialog.tsx`

**변경 사항:**
1. `handleCopyCardImage()` 함수 완전 재작성
2. 모바일 최적화 옵션 적용
3. 에러 처리 강화
4. 사용자 피드백 개선

#### Phase 4: 이미지 컴포넌트 수정

**파일:** `components/share/share-note-card.tsx`

**변경 사항:**
1. 이미지에 `data-original-src` 속성 추가
2. `crossOrigin="anonymous"` 명시적 설정
3. Next.js Image 컴포넌트에 `unoptimized` 옵션 추가 (캡처 시)

### 3.2 파일 구조

```
lib/utils/
├── card-capture.ts          # 신규: 카드 캡처 유틸리티
├── device.ts                # 수정: 디바이스 감지 확장
└── image.ts                  # 수정: 이미지 URL 추출 함수 추가

components/share/
├── simple-share-dialog.tsx  # 수정: 카드 복사 로직 재구현
└── share-note-card.tsx       # 수정: 이미지 속성 추가
```

---

## 4. 기술 세부사항

### 4.1 이미지 Base64 변환 구현

```typescript
/**
 * Next.js Image 최적화 URL에서 원본 URL 추출
 */
function extractOriginalUrl(optimizedUrl: string): string {
  // Next.js Image 최적화 URL 형식: /_next/image?url=ENCODED_URL&w=640&q=75
  if (optimizedUrl.includes("/_next/image")) {
    const urlParams = new URLSearchParams(optimizedUrl.split("?")[1]);
    const originalUrl = urlParams.get("url");
    if (originalUrl) {
      return decodeURIComponent(originalUrl);
    }
  }
  return optimizedUrl;
}

/**
 * 이미지를 Base64로 로드
 */
async function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context를 생성할 수 없습니다."));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL("image/png");
        resolve(base64);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error(`이미지 로드 실패: ${url}`));
    };
    
    img.src = url;
  });
}
```

### 4.2 메모리 사용량 추정

```typescript
/**
 * 예상 메모리 사용량 계산 (MB)
 */
function estimateMemoryUsage(width: number, height: number, scale: number): number {
  const canvasWidth = width * scale;
  const canvasHeight = height * scale;
  const bytesPerPixel = 4; // RGBA
  const memoryBytes = canvasWidth * canvasHeight * bytesPerPixel;
  const memoryMB = memoryBytes / (1024 * 1024);
  return memoryMB;
}

/**
 * 디바이스별 최적 Scale 반환
 */
export function getOptimalCanvasScale(): number {
  const isMobileDevice = isMobile();
  
  if (isMobileDevice) {
    // 모바일: 메모리 제한 고려하여 1.5 사용
    return 1.5;
  } else {
    // PC: 고해상도 유지
    return 3.0;
  }
}
```

### 4.3 에러 타입 정의

```typescript
export class CardCaptureError extends Error {
  constructor(
    message: string,
    public type: "memory" | "timeout" | "image" | "unknown"
  ) {
    super(message);
    this.name = "CardCaptureError";
  }
}
```

---

## 5. 테스트 계획

### 5.1 기능 테스트

- [ ] 모바일 (iOS Safari)에서 카드 복사 성공
- [ ] 모바일 (Android Chrome)에서 카드 복사 성공
- [ ] PC (Chrome)에서 카드 복사 성공
- [ ] 이미지 있는 기록 복사 성공
- [ ] 이미지 없는 기록 복사 성공
- [ ] 외부 이미지(네이버 쇼핑) 포함 기록 복사 성공

### 5.2 성능 테스트

- [ ] 모바일에서 복사 시간 5초 이내
- [ ] PC에서 복사 시간 3초 이내
- [ ] 메모리 사용량 적정 수준 (모바일 50MB 이하)
- [ ] 네트워크 느린 환경에서도 정상 작동

### 5.3 에러 처리 테스트

- [ ] 메모리 부족 시 적절한 에러 메시지
- [ ] 이미지 로딩 실패 시 적절한 처리
- [ ] 네트워크 오류 시 적절한 처리
- [ ] 클립보드 권한 거부 시 다운로드로 fallback

---

## 6. 예상 효과

### 6.1 문제 해결

- ✅ 모바일에서 이미지 생성 성공률 95% 이상
- ✅ 메모리 부족 오류 제거
- ✅ 이미지 로딩 실패 문제 해결
- ✅ CORS 문제 완전 해결

### 6.2 성능 개선

- ✅ 모바일 복사 시간: 10초+ → 5초 이내
- ✅ 메모리 사용량: 16.6MB → 8.3MB (모바일)
- ✅ 이미지 로딩 성공률: 60% → 95% 이상

### 6.3 사용자 경험 개선

- ✅ 명확한 진행 상태 표시
- ✅ 에러 발생 시 구체적인 안내 메시지
- ✅ 모바일/PC 모두 안정적인 작동

---

## 7. 체크리스트

### 개발 전
- [ ] 이 문서 검토 완료
- [ ] 기술 요구사항 명확화
- [ ] 테스트 계획 수립

### 개발 중
- [ ] `lib/utils/card-capture.ts` 구현
- [ ] `lib/utils/device.ts` 확장
- [ ] `components/share/simple-share-dialog.tsx` 수정
- [ ] `components/share/share-note-card.tsx` 수정
- [ ] 에러 처리 구현
- [ ] 사용자 피드백 개선

### 개발 후
- [ ] 모바일 (iOS) 테스트
- [ ] 모바일 (Android) 테스트
- [ ] PC 테스트
- [ ] 성능 측정
- [ ] 에러 케이스 테스트
- [ ] 문서 업데이트

---

## 8. 참고 사항

### 8.1 html2canvas 제한사항

- iOS Safari에서 최대 캔버스 크기 제한 (약 4096px)
- Android Chrome에서도 메모리 제한 존재
- 외부 이미지 CORS 문제는 Base64 변환으로 해결

### 8.2 모바일 브라우저 호환성

- iOS Safari 13.1+ (ClipboardItem 지원)
- Android Chrome 76+ (ClipboardItem 지원)
- 구형 브라우저는 다운로드로 fallback

### 8.3 메모리 최적화 팁

- 불필요한 DOM 요소 제거
- 이미지 크기 최적화 (Base64 변환 시)
- 캔버스 생성 후 즉시 메모리 해제
- Blob 생성 후 Canvas 제거

---

**이 문서를 기반으로 모바일 카드 복사 기능을 근본적으로 개선합니다.**
