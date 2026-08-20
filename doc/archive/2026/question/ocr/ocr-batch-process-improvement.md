# OCR 배치 처리 개선 사항

## 개요

OCR 배치 처리 시 진행 상황을 가시적으로 표시하고, 오류 발생 시 상세 정보를 제공하며, 재시도 기능을 추가했습니다.

## 개선 사항

### 1. 진행 상황 가시화

#### 배치 처리 진행 상황 다이얼로그 (`BatchOCRProgressDialog`)

- **전체 진행률 표시**: Progress 바를 통해 전체 진행률을 시각적으로 표시
- **개별 항목 상태 표시**: 각 기록의 처리 상태를 실시간으로 확인 가능
  - 대기 (pending)
  - 처리 중 (processing)
  - 완료 (completed)
  - 실패 (failed)
- **통계 정보**: 대기/처리 중/완료/실패 개수를 실시간으로 표시

#### 주요 기능

```typescript
// 진행 상황 다이얼로그 컴포넌트
<BatchOCRProgressDialog
  open={showProgress}
  onOpenChange={setShowProgress}
  items={progressItems}
  totalCount={totalCount}
  completedCount={completedCount}
  failedCount={failedCount}
  isProcessing={isProcessing}
  onRetryFailed={handleRetryFailed}
/>
```

### 2. 오류 처리 강화

#### 상세 오류 정보 표시

- **오류 메시지 표시**: 각 실패한 항목에 대해 상세한 오류 메시지 표시
- **오류 원인 파악**: 오류 발생 시점과 원인을 명확히 표시
- **처리 시간 표시**: 각 항목의 처리 시간(duration) 표시

#### 오류 처리 흐름

1. OCR 처리 실패 시 `transcription` 상태를 `failed`로 업데이트
2. 실패 통계 기록 (`ocr_stats` 테이블)
3. 클라이언트에 상세 오류 정보 전달
4. UI에서 오류 메시지 표시

### 3. 재시도 기능

#### 실패 항목 재시도

- **재시도 버튼**: 실패한 항목만 선택적으로 재처리
- **부분 재시도**: 전체 배치를 다시 실행하지 않고 실패한 항목만 재시도
- **상태 관리**: 재시도 시 상태를 올바르게 업데이트

```typescript
const handleRetryFailed = async () => {
  // 실패한 항목만 필터링
  const failedItems = progressItems.filter(item => item.status === "failed");
  
  // 실패한 항목들만 다시 처리
  const result = await batchProcessOCR(failedItems.length);
  // ...
};
```

### 4. 실시간 상태 업데이트

#### 폴링 메커니즘

- **3초 간격 폴링**: 처리 중인 항목의 상태를 3초마다 확인
- **자동 상태 업데이트**: `transcription` 테이블의 상태 변경을 자동으로 감지
- **완료 감지**: 모든 항목이 완료되면 자동으로 폴링 중지

```typescript
useEffect(() => {
  if (!isProcessing || processingNoteIdsRef.current.size === 0) {
    return;
  }

  // 3초마다 상태 확인
  pollingIntervalRef.current = setInterval(async () => {
    const noteIds = Array.from(processingNoteIdsRef.current);
    
    // 각 noteId의 transcription 상태 확인
    const statusChecks = await Promise.allSettled(
      noteIds.map(async (noteId) => {
        const transcription = await getTranscription(noteId);
        return { noteId, transcription };
      })
    );

    // 상태 업데이트
    // ...
  }, 3000);

  return () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
  };
}, [isProcessing]);
```

## 변경된 파일

### 1. `components/admin/batch-ocr-progress-dialog.tsx` (신규)

진행 상황 다이얼로그 컴포넌트:
- Progress 바
- 개별 항목 목록
- 오류 상세 정보 표시
- 재시도 버튼

### 2. `components/admin/batch-ocr-button.tsx` (수정)

배치 처리 버튼 컴포넌트:
- 진행 상황 다이얼로그 통합
- 폴링 메커니즘 추가
- 재시도 기능 추가

### 3. `app/actions/admin.ts` (수정)

배치 처리 함수:
- 개별 항목 상세 정보 반환 (`items` 배열)
- 오류 정보 포함 (`error`, `duration`)
- 처리 결과 상세화

## 사용 방법

### 1. 배치 처리 시작

1. 관리자 페이지(`/admin`) 접속
2. "대기 기록 확인" 버튼 클릭하여 처리 대기 중인 기록 수 확인
3. "OCR 배치 처리" 버튼 클릭
4. 확인 다이얼로그에서 "확인 및 실행" 클릭

### 2. 진행 상황 확인

- 진행 상황 다이얼로그가 자동으로 열림
- 전체 진행률과 개별 항목 상태를 실시간으로 확인
- 각 항목의 처리 상태(대기/처리 중/완료/실패) 확인
- 실패한 항목의 오류 메시지 확인

### 3. 실패 항목 재시도

1. 배치 처리 완료 후 실패한 항목이 있는 경우
2. 다이얼로그 하단의 "실패 항목 재시도" 버튼 클릭
3. 실패한 항목만 선택적으로 재처리

## 오류 처리 개선 사항

### 1. 오류 정보 상세화

- **오류 메시지**: 각 실패 항목에 대해 구체적인 오류 메시지 표시
- **처리 시간**: 각 항목의 처리 시간 표시 (성능 분석에 유용)
- **오류 원인**: 초기화 실패, OCR 처리 실패, 저장 실패 등 구분

### 2. 오류 복구

- **자동 상태 업데이트**: 실패 시 `transcription` 상태를 `failed`로 자동 업데이트
- **통계 기록**: 실패 통계를 `ocr_stats` 테이블에 기록
- **재시도 가능**: 실패한 항목만 선택적으로 재시도 가능

### 3. 오류 로깅

- **서버 로그**: 모든 오류를 서버 로그에 기록
- **클라이언트 로그**: 브라우저 콘솔에 오류 정보 출력
- **사용자 피드백**: 토스트 메시지로 사용자에게 오류 알림

## 성능 고려사항

### 1. 배치 크기

- 기본 배치 크기: 10개
- 한 번에 처리할 수 있는 최대 기록 수 제한
- 대량 처리 시 여러 번 나누어 실행

### 2. 폴링 최적화

- 폴링 간격: 3초
- 처리 중인 항목만 폴링 대상에 포함
- 모든 항목 완료 시 자동으로 폴링 중지

### 3. 리소스 관리

- 폴링 인터벌 정리: 컴포넌트 언마운트 시 자동 정리
- 메모리 누수 방지: ref를 사용한 상태 관리

## 향후 개선 사항

### 1. WebSocket/SSE 지원

현재는 폴링 방식을 사용하지만, 향후 WebSocket 또는 Server-Sent Events(SSE)를 사용하여 실시간 업데이트를 개선할 수 있습니다.

### 2. 배치 처리 취소 기능

현재는 배치 처리 중 취소할 수 없지만, 향후 취소 기능을 추가할 수 있습니다.

### 3. 배치 처리 일괄 관리

여러 배치 처리를 동시에 관리하고 모니터링할 수 있는 기능을 추가할 수 있습니다.

## 참고 사항

- 배치 처리는 서버에서 동기적으로 실행되므로, 처리 시간이 오래 걸릴 수 있습니다.
- 실패한 항목은 재시도할 수 있지만, 동일한 오류가 반복될 수 있습니다.
- 오류 발생 시 서버 로그를 확인하여 근본 원인을 파악하는 것이 중요합니다.
