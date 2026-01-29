# OCR 터미널 로그 확인 가이드

## 빠른 확인 방법

### 1. 실시간 로그 모니터링

개발 서버가 실행 중인 터미널 창에서:

1. **필사 이미지 업로드**
   - 브라우저에서 필사 이미지를 업로드하고 기록 저장

2. **터미널에서 다음 로그 확인**

#### 정상 케이스:
```
[OCR] 요청 수신 시작
[OCR] Supabase 클라이언트 생성 완료
[OCR] 인증 확인: { hasUser: true, userId: '...' }
[OCR] 요청 본문 파싱 완료: { noteId: '...', hasImageUrl: true }
[OCR] 기록 소유 확인 시작: { noteId: '...', userId: '...' }
[OCR] 기록 소유 확인 결과: { hasOwnership: true }
[OCR] Transcription 초기 상태 생성 완료: noteId=...
[OCR] 처리 요청 성공: noteId=...
[OCR Process] 처리 시작: { noteId: '...', imageUrl: '...' }
[OCR Process] Vision API 호출 시작
[Vision API] API 키 방식으로 OCR 처리 시작
[Vision API] 이미지 다운로드 시작: ...
[Vision API] 이미지 다운로드 완료, 크기: ...KB
[Vision API] Base64 인코딩 완료, Vision API 호출 시작
[Vision API] Vision API 호출 성공
[Vision API] 텍스트 추출 완료, 길이: ...
[Vision API] 텍스트 정리 완료, 최종 길이: ...
[OCR Process] Vision API 호출 완료, 추출된 텍스트 길이: ...
[OCR Process] Transcription 저장 완료
[OCR Process] 처리 완료: noteId=..., 소요시간=...ms
```

#### 에러 케이스 (확인할 부분):
```
================================================================================
[OCR Process] ========== OCR 처리 오류 발생 ==========
[OCR Process] 에러 메시지: Vision API 호출 실패: 400 Bad Request - API key not valid
[OCR Process] Note ID: 356b1b66-9d6f-44a9-bf0a-e2cb045ffac1
[OCR Process] Image URL: https://...
[OCR Process] 처리 시간: 1234ms
[OCR Process] 스택 트레이스: ...
================================================================================
```

### 2. 주요 에러 메시지 패턴

#### API 키 관련:
```
[Vision API] Vision API 호출 실패: 400 Bad Request
[Vision API] 상세 에러 정보: { "error": { "message": "API key not valid. Please pass a valid API key." } }
```

#### 권한 관련:
```
[Vision API] Vision API 호출 실패: 403 Forbidden
[Vision API] 상세 에러 정보: { "error": { "message": "Cloud Vision API has not been used in project ..." } }
```

#### 할당량 관련:
```
[Vision API] Vision API 호출 실패: 429 Too Many Requests
[Vision API] 상세 에러 정보: { "error": { "message": "Quota exceeded" } }
```

#### 이미지 관련:
```
[Vision API] 이미지 다운로드 실패: 404 Not Found
```

### 3. 로그 검색 팁

터미널에서 `Ctrl+F`를 눌러 다음 키워드로 검색:
- `[Vision API]`
- `[OCR Process]`
- `실패`
- `오류`
- `error`
- `Error`

## 다음 단계

1. **브라우저에서 필사 이미지 업로드**
2. **터미널에서 에러 로그 확인**
3. **에러 메시지 전체 내용 복사**
4. **에러 메시지를 공유하면 해결 방법 제시**

## 개선된 로깅

이제 다음 정보가 더 상세하게 출력됩니다:
- Vision API 응답 본문 (원본)
- 상세 에러 정보 (JSON 형식)
- HTTP 헤더 정보
- 스택 트레이스
- 에러 원인 (cause)

이 정보를 통해 정확한 문제를 파악할 수 있습니다.

