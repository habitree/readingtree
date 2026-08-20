# OCR 배치 처리 가이드

## 개요

전체 등록된 이미지 파일의 OCR 처리를 일괄로 진행하는 방법을 안내합니다.

## 방법 1: 관리자 페이지에서 실행 (권장)

### 실행 단계

1. **관리자 계정으로 로그인**
   - 관리자 이메일(`cdhnaya@kakao.com`)로 로그인

2. **관리자 페이지 접속**
   - `/admin` 페이지로 이동

3. **OCR 배치 처리 실행**
   - 상단의 **"대기 기록 확인"** 버튼 클릭하여 처리 대기 중인 기록 수 확인
   - **"OCR 배치 처리"** 버튼 클릭
   - 확인 다이얼로그에서 **"확인 및 실행"** 클릭

4. **처리 결과 확인**
   - 처리된 기록 수가 토스트 메시지로 표시됩니다
   - 한 번에 최대 10개씩 처리됩니다

### 주의사항

- 한 번에 최대 10개씩 처리됩니다
- 처리 시간이 소요될 수 있습니다 (이미지당 약 5-10초)
- 실패한 기록은 다시 시도할 수 있습니다

---

## 방법 2: Supabase SQL Editor에서 직접 실행

### 1단계: 배치 처리 함수 생성

**Supabase 대시보드 → SQL Editor**에서 다음 마이그레이션 파일을 실행:

```
doc/database/migration-202601161500__ocr__batch_process_function.sql
```

이 마이그레이션은:
- `get_pending_ocr_count()`: OCR 대기 기록 수 조회 함수
- `get_pending_ocr_notes()`: OCR 처리가 필요한 기록 목록 조회 함수

### 2단계: 대기 기록 수 확인

```sql
-- OCR 대기 기록 수 확인
SELECT * FROM get_pending_ocr_count();
```

결과:
- `total_with_images`: 이미지가 있는 기록 수
- `needing_ocr`: OCR 처리가 필요한 기록 수
- `processing_count`: 처리 중인 기록 수
- `completed_count`: 완료된 기록 수
- `failed_count`: 실패한 기록 수

### 3단계: 처리 대기 기록 목록 확인

```sql
-- OCR 처리가 필요한 기록 목록 조회 (최대 10개)
SELECT * FROM get_pending_ocr_notes(10);
```

### 4단계: 애플리케이션에서 OCR 처리

SQL 함수로는 실제 OCR 처리를 할 수 없으므로, 애플리케이션 레벨에서 처리해야 합니다.

**방법 A: 관리자 페이지 사용 (권장)**
- 위의 "방법 1" 참고

**방법 B: API 직접 호출 (고급)**
- 각 기록에 대해 `/api/ocr` 엔드포인트를 호출
- 관리자 권한이 필요합니다

---

## OCR 처리 대상

다음 조건을 만족하는 기록이 OCR 처리 대상입니다:

1. **이미지가 있는 기록**
   - `image_url`이 NULL이 아님

2. **특정 타입의 기록**
   - `type`이 `'photo'` 또는 `'transcription'`

3. **OCR 처리가 안 된 기록**
   - `transcriptions` 테이블에 해당 기록이 없음
   - 또는 `transcriptions.status`가 `'failed'`

---

## 처리 흐름

1. **OCR 요청** (`/api/ocr`)
   - 즉시 응답 반환
   - 백그라운드에서 OCR 처리 시작

2. **OCR 처리** (`/api/ocr/process`)
   - Google Cloud Run OCR 서비스 호출
   - 텍스트 추출
   - `transcriptions` 테이블에 저장

3. **상태 업데이트**
   - `transcriptions.status`를 `'completed'` 또는 `'failed'`로 업데이트

---

## 처리 상태 확인

### 애플리케이션에서 확인

```sql
-- OCR 처리 상태별 기록 수 확인
SELECT 
    t.status,
    COUNT(*) as count
FROM transcriptions t
JOIN notes n ON t.note_id = n.id
WHERE n.image_url IS NOT NULL
  AND n.type IN ('photo', 'transcription')
GROUP BY t.status;
```

### 관리자 페이지에서 확인

- 관리자 페이지의 OCR 통계 섹션에서 확인 가능
- `getOcrTotalStats()` 함수로 전체 통계 조회

---

## 문제 해결

### 오류: "권한이 없습니다"

**원인**: 관리자 권한이 필요합니다

**해결 방법**:
- 관리자 계정(`cdhnaya@kakao.com`)으로 로그인
- 또는 관리자 권한이 있는 사용자로 실행

### 오류: "OCR 처리 실패"

**원인**: 
- 이미지 URL이 유효하지 않음
- Google Cloud Run OCR 서비스 오류
- 네트워크 오류

**해결 방법**:
- 이미지 URL 확인
- Google Cloud Run OCR 서비스 상태 확인
- 실패한 기록은 다시 시도 가능

### 처리 속도가 느림

**원인**: 
- 한 번에 하나씩 처리되므로 시간이 소요됨
- 이미지 크기가 큰 경우 더 오래 걸림

**해결 방법**:
- 배치 크기를 조정 (기본값: 10개)
- 여러 번 나눠서 실행
- 처리 시간을 고려하여 실행

---

## 주의사항

⚠️ **중요한 주의사항**

1. **처리 시간**: 이미지당 약 5-10초 소요
2. **API 비용**: Google Cloud Run OCR 사용 시 비용 발생 가능
3. **네트워크**: 안정적인 네트워크 연결 필요
4. **재시도**: 실패한 기록은 다시 시도 가능

---

## 요약

**가장 간단한 방법**: 관리자 페이지 사용

1. 관리자 계정으로 로그인
2. `/admin` 페이지 접속
3. "OCR 배치 처리" 버튼 클릭
4. 확인 및 실행

이 방법이 가장 안전하고 편리합니다.
