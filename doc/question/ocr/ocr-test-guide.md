# OCR 기능 테스트 가이드

## 개요

Google Vision API를 사용한 OCR 기능이 정상 작동하는지 점검하는 가이드입니다.

## 사전 준비

### 1. 환경 변수 확인

`.env.local` 파일에 다음 변수가 설정되어 있는지 확인:

```env
GOOGLE_VISION_API_KEY=AIzaSy...
```

**확인 방법:**
- API 키는 "AIza"로 시작해야 합니다
- API 키 길이는 최소 30자 이상이어야 합니다

### 2. 서버 재시작

환경 변수를 변경했다면 개발 서버를 재시작하세요:

```bash
npm run dev
```

## 테스트 시나리오

### 시나리오 1: 정상 케이스 (필사 이미지 업로드)

1. **기록 작성 페이지 접속**
   - 책 선택 → "필사등록" 버튼 클릭
   - 또는 `/notes/new?bookId=<book-id>` 접속

2. **이미지 업로드**
   - 텍스트가 포함된 이미지 파일 선택
   - 권장: 명확한 텍스트가 있는 책 페이지 사진

3. **기록 저장**
   - "저장" 버튼 클릭
   - 다음 메시지가 표시되어야 합니다:
     - "필사 이미지에서 텍스트를 추출하는 중입니다..."
     - "OCR 처리가 시작되었습니다."

4. **브라우저 콘솔 확인**
   - 개발자 도구 (F12) → Console 탭
   - 다음 로그가 표시되어야 합니다:
     ```
     [OCR] Transcription 초기 상태 생성 완료: noteId=...
     [OCR] 처리 요청 성공: noteId=...
     ```

5. **서버 로그 확인**
   - 터미널에서 다음 로그를 확인:
     ```
     [Vision API] API 키 방식으로 OCR 처리 시작
     [Vision API] 이미지 다운로드 시작: ...
     [Vision API] 이미지 다운로드 완료, 크기: ...KB
     [Vision API] Base64 인코딩 완료, Vision API 호출 시작
     [Vision API] Vision API 호출 성공
     [Vision API] 텍스트 추출 완료, 길이: ...
     [Vision API] 텍스트 정리 완료, 최종 길이: ...
     [OCR Process] 처리 시작: ...
     [OCR Process] Vision API 호출 시작
     [OCR Process] Vision API 호출 완료, 추출된 텍스트 길이: ...
     [OCR Process] Transcription 저장 완료
     [OCR Process] 처리 완료: noteId=..., 소요시간=...ms
     ```

6. **데이터베이스 확인**
   - Supabase Dashboard → Table Editor → `transcriptions` 테이블
   - 다음을 확인:
     - `note_id`: 방금 생성한 기록 ID
     - `status`: "completed"
     - `extracted_text`: 추출된 텍스트
     - `quote_content`: 추출된 텍스트 (기본값)

7. **기록 상세 페이지 확인**
   - 기록 상세 페이지 (`/notes/[id]`) 접속
   - OCR 상태 배지 확인:
     - "OCR 처리 중" → "OCR 완료"로 변경
   - "인상깊은 구절" 필드에 추출된 텍스트 표시 확인

### 시나리오 2: OCR 상태 확인

1. **기록 상세 페이지 접속**
   - 필사 타입 기록의 상세 페이지로 이동

2. **OCR 상태 배지 확인**
   - "OCR 처리 중" 배지가 표시되는지 확인
   - 3초마다 상태를 확인하여 자동으로 업데이트되는지 확인

3. **OCR 완료 알림 확인**
   - OCR 처리가 완료되면 토스트 알림 표시:
     - "OCR 처리가 완료되었습니다!"
     - "인상깊은 구절에 텍스트가 자동으로 저장되었습니다."

4. **페이지 자동 새로고침 확인**
   - OCR 완료 후 1초 뒤 페이지가 자동으로 새로고침되는지 확인
   - "인상깊은 구절" 필드에 텍스트가 표시되는지 확인

### 시나리오 3: 에러 케이스

#### 3-1. API 키 없음

**증상:**
- 서버 로그에 "API 키가 없습니다. 서비스 계정 방식으로 시도합니다." 메시지
- OCR 처리 실패

**해결:**
- `.env.local`에 `GOOGLE_VISION_API_KEY` 추가
- 서버 재시작

#### 3-2. 이미지 다운로드 실패

**증상:**
- 서버 로그에 "이미지 다운로드 실패" 메시지
- Transcription 상태가 "failed"로 변경

**확인 사항:**
- 이미지 URL이 유효한지 확인
- Supabase Storage 접근 권한 확인

#### 3-3. Vision API 호출 실패

**증상:**
- 서버 로그에 "Vision API 호출 실패" 메시지
- Transcription 상태가 "failed"로 변경

**확인 사항:**
- API 키 유효성 확인 (Google Cloud Console)
- API 제한사항 확인 (할당량, 제한사항)
- 네트워크 연결 확인

#### 3-4. 텍스트 없는 이미지

**증상:**
- OCR 처리는 성공하지만 추출된 텍스트가 빈 문자열
- `extracted_text`와 `quote_content`가 빈 값

**정상 동작:**
- 에러가 아닌 정상 케이스입니다
- Transcription은 "completed" 상태로 저장됩니다

## 로그 확인 포인트

### 성공 케이스 로그 순서

1. `[OCR] Transcription 초기 상태 생성 완료`
2. `[OCR] 처리 요청 성공`
3. `[Vision API] API 키 방식으로 OCR 처리 시작`
4. `[Vision API] 이미지 다운로드 시작`
5. `[Vision API] 이미지 다운로드 완료`
6. `[Vision API] Base64 인코딩 완료`
7. `[Vision API] Vision API 호출 성공`
8. `[Vision API] 텍스트 추출 완료`
9. `[Vision API] 텍스트 정리 완료`
10. `[OCR Process] 처리 시작`
11. `[OCR Process] Vision API 호출 시작`
12. `[OCR Process] Vision API 호출 완료`
13. `[OCR Process] Transcription 저장 완료`
14. `[OCR Process] 처리 완료`

### 실패 케이스 로그

- `[OCR Process] 처리 오류:` - 상세 에러 정보 포함
- `[OCR Process] Transcription 상태를 'failed'로 업데이트` - 실패 상태 저장

## 데이터베이스 확인

### `transcriptions` 테이블 구조

```sql
SELECT 
  id,
  note_id,
  status,           -- 'processing' | 'completed' | 'failed'
  extracted_text,   -- OCR로 추출된 원본 텍스트
  quote_content,    -- 책 구절 (사용자 편집 가능)
  memo_content,     -- 사용자의 생각
  created_at,
  updated_at
FROM transcriptions
WHERE note_id = '<note-id>'
ORDER BY created_at DESC;
```

### 상태별 확인

- **processing**: OCR 처리 중
- **completed**: OCR 처리 완료
- **failed**: OCR 처리 실패

## 문제 해결

### 문제 1: Transcription이 생성되지 않음

**확인 사항:**
1. RLS 정책 확인 (`doc/database/schema.sql`)
2. `createTranscriptionInitial` 함수 호출 확인
3. 서버 로그에서 에러 메시지 확인

**해결:**
- Supabase Dashboard에서 RLS 정책 확인
- 서버 로그에서 상세 에러 확인

### 문제 2: OCR 상태가 업데이트되지 않음

**확인 사항:**
1. `useOCRStatus` 훅이 올바르게 폴링하는지
2. `getTranscription` 함수가 올바르게 작동하는지
3. 브라우저 콘솔에서 에러 확인

**해결:**
- 브라우저 콘솔에서 네트워크 탭 확인
- `getTranscription` 호출이 성공하는지 확인

### 문제 3: Vision API 호출 실패

**확인 사항:**
1. API 키 유효성 (Google Cloud Console)
2. API 제한사항 (할당량, 제한사항)
3. 이미지 크기 (최대 20MB)

**해결:**
- Google Cloud Console에서 API 키 확인
- API 할당량 확인
- 이미지 크기 확인

## 성능 확인

### 처리 시간

- **정상 케이스**: 2-5초 (이미지 크기에 따라 다름)
- **대용량 이미지**: 5-10초
- **타임아웃**: 30초

### 로그에서 확인

```
[OCR Process] 처리 완료: noteId=..., 소요시간=...ms
```

## 완료 기준

다음 항목이 모두 확인되면 OCR 기능이 정상 작동하는 것입니다:

- [ ] 필사 이미지 업로드 시 OCR 요청이 생성됨
- [ ] Transcription이 "processing" 상태로 생성됨
- [ ] Vision API 호출이 성공함
- [ ] 추출된 텍스트가 `transcriptions` 테이블에 저장됨
- [ ] Transcription 상태가 "completed"로 업데이트됨
- [ ] 기록 상세 페이지에 OCR 상태 배지가 표시됨
- [ ] OCR 완료 시 토스트 알림이 표시됨
- [ ] "인상깊은 구절" 필드에 추출된 텍스트가 표시됨

