# OCR 이미지 URL 유효성 검증 개선

## 개요

OCR 배치 처리 중 발생하는 404 오류의 근본 원인을 해결하기 위해, OCR 처리 전에 이미지 URL 유효성을 검증하는 기능을 추가했습니다.

## 근본 원인 분석

### 문제 상황

```
[Cloud Run OCR] 이미지 404 오류: {
  status: 404,
  statusText: 'Not Found',
  imageUrl: 'https://api.telegram.org/file/bot.../photos/file_3.jpg...'
}
```

### 근본 원인

1. **Telegram 이미지 URL의 일시적 특성**
   - Telegram Bot API의 파일 URL은 **일시적(temporary)**이며, 일정 시간(보통 몇 시간) 후 만료됨
   - 기록이 생성된 후 시간이 지나면 이미지 URL이 만료되어 404 오류 발생

2. **OCR 배치 처리의 특성**
   - 오래된 기록도 포함하여 처리하므로 만료된 URL을 처리하려고 시도
   - OCR 처리 시도 전에 URL 유효성을 확인하지 않음

3. **불필요한 리소스 소모**
   - 만료된 URL에 대해 OCR 처리를 시도하여 시간과 리소스 낭비
   - Cloud Run OCR API 호출 비용 발생

## 개선 사항

### 1. 이미지 URL 유효성 검증 함수 추가

**파일**: `lib/utils/image-url-validation.ts`

**주요 기능**:
- HEAD 요청을 사용하여 이미지 존재 여부 확인
- URL 형식 검증
- Content-Type 확인 (이미지 파일인지 확인)
- 타임아웃 처리 (기본 10초)
- 다양한 HTTP 상태 코드 처리 (404, 403, 401 등)

**함수**:
- `validateImageUrl(imageUrl: string, timeout?: number)`: 단일 URL 검증
- `validateImageUrls(imageUrls: string[], timeout?: number)`: 여러 URL 병렬 검증

### 2. OCR 배치 처리 전 URL 검증

**파일**: `app/actions/admin.ts`

**개선 내용**:
- OCR 처리 전에 이미지 URL 유효성 검증 수행
- 만료된 URL이나 접근 불가능한 이미지는 사전에 필터링
- 검증 실패 시:
  - OCR 처리하지 않고 즉시 실패로 기록
  - Transcription 상태를 "failed"로 업데이트
  - 실패 통계 기록
  - 사용자 친화적인 오류 메시지 제공

### 3. 오류 처리 개선

**검증 실패 시 처리**:
1. **404 오류**: "이미지 파일을 찾을 수 없습니다 (404). 이미지 URL이 만료되었거나 삭제되었을 수 있습니다."
2. **403/401 오류**: "이미지 접근이 거부되었습니다. 권한이 없거나 파일이 삭제되었을 수 있습니다."
3. **타임아웃**: "이미지 다운로드 타임아웃: 이미지 서버에 연결할 수 없습니다."

## 처리 흐름

### 개선 전

```
1. OCR 배치 처리 시작
2. 이미지 URL로 직접 OCR 처리 시도
3. 404 오류 발생
4. 실패 처리 및 통계 기록
```

### 개선 후

```
1. OCR 배치 처리 시작
2. 이미지 URL 유효성 검증 (HEAD 요청)
   ├─ 유효한 경우: OCR 처리 진행
   └─ 유효하지 않은 경우: 즉시 실패 처리 (OCR 처리 생략)
3. OCR 처리 (유효한 URL만)
4. 성공/실패 처리 및 통계 기록
```

## 효과

### 1. 리소스 절약
- 만료된 URL에 대한 불필요한 OCR 처리 방지
- Cloud Run OCR API 호출 비용 절감
- 처리 시간 단축

### 2. 사용자 경험 개선
- 만료된 URL에 대한 명확한 오류 메시지 제공
- OCR 배치 처리 진행 상황에서 실패 원인을 즉시 확인 가능

### 3. 시스템 안정성 향상
- 예상 가능한 오류를 사전에 처리
- 불필요한 오류 로그 감소

## 사용 예시

### 단일 URL 검증

```typescript
import { validateImageUrl } from "@/lib/utils/image-url-validation";

const validation = await validateImageUrl(imageUrl);
if (!validation.valid) {
  console.error("이미지 URL이 유효하지 않습니다:", validation.error);
}
```

### 여러 URL 병렬 검증

```typescript
import { validateImageUrls } from "@/lib/utils/image-url-validation";

const imageUrls = ["url1", "url2", "url3"];
const results = await validateImageUrls(imageUrls);

results.forEach((validation, url) => {
  if (!validation.valid) {
    console.warn(`URL ${url}이 유효하지 않습니다:`, validation.error);
  }
});
```

## 향후 개선 사항

### 1. 이미지 URL 만료 시간 추적
- 기록 생성 시점과 현재 시점을 비교하여 만료 가능성 판단
- Telegram URL의 경우 생성 후 24시간 경과 시 만료 가능성 높음

### 2. 이미지 마이그레이션
- 만료 가능성이 있는 외부 이미지 URL을 Supabase Storage로 마이그레이션
- 영구적인 이미지 저장소 사용

### 3. 배치 검증 최적화
- 여러 URL을 병렬로 검증하여 처리 시간 단축
- 검증 결과 캐싱 (짧은 시간 동안)

## 참고 사항

- **HEAD 요청**: 이미지 전체를 다운로드하지 않고 헤더만 확인하여 빠른 검증
- **타임아웃**: 기본 10초로 설정 (환경에 따라 조정 가능)
- **에러 처리**: 검증 실패 시에도 OCR 배치 처리는 계속 진행 (다른 항목 처리)

---

**작성일**: 2026-01-16  
**버전**: 1.0
