# OCR 403 Forbidden 오류 해결 가이드

**작성일:** 2026년 1월 12일  
**오류:** Cloud Run OCR API 호출 시 403 Forbidden  
**원인:** 인증 토큰 생성 실패 또는 서비스 계정 권한 부족

---

## 🔍 오류 분석

### 오류 메시지
```
403 Forbidden
Your client does not have permission to get URL /extractTextFromImage from this server.
```

### 가능한 원인

1. **인증 토큰 미생성**
   - `GOOGLE_SERVICE_ACCOUNT_KEY` 환경 변수 미설정
   - 토큰 생성 실패 (JSON 파싱 오류, 네트워크 오류 등)

2. **서비스 계정 권한 부족**
   - 서비스 계정에 "Cloud Run Invoker" 역할 없음
   - Cloud Run 함수 접근 권한 문제

3. **Cloud Run 함수 URL 오류**
   - 프로젝트 변경으로 인한 URL 변경
   - 잘못된 함수 URL

---

## ✅ 해결 방법

### 1단계: Vercel 환경 변수 확인

#### 확인 사항
1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard
   - 프로젝트 선택

2. **Settings → Environment Variables 확인**
   - `GOOGLE_SERVICE_ACCOUNT_KEY` 존재 여부 확인
   - 값이 올바른 JSON 형식인지 확인

3. **환경 변수 재설정 (필요 시)**
   ```powershell
   $env:KEY_FILE="gen-lang-client-0287655743-8d38b5fa5b80.json"
   node scripts/prepare-service-account-key.js
   ```
   - 출력된 한 줄 JSON을 Vercel 환경 변수에 설정

---

### 2단계: Vercel Functions 로그 확인

#### 확인할 로그 메시지

**정상적인 경우:**
```
[Cloud Run OCR] getAuthToken 호출
[Cloud Run OCR] 서비스 계정 키 확인: { hasServiceAccountKey: true, ... }
[Cloud Run OCR] 새 토큰 생성 시작
[Cloud Run OCR] 서비스 계정 키 파싱 성공: { projectId: '...', clientEmail: '...' }
[Cloud Run OCR] GoogleAuth 클라이언트 생성 중...
[Cloud Run OCR] ID 토큰 클라이언트 생성 중, 대상 URL: ...
[Cloud Run OCR] ID 토큰 가져오기 중...
[Cloud Run OCR] ID 토큰 생성 성공, 토큰 길이: ...
[Cloud Run OCR] 인증 토큰 생성 성공, 토큰 길이: ...
[Cloud Run OCR] Authorization 헤더 추가됨
```

**문제가 있는 경우:**
```
[Cloud Run OCR] 서비스 계정 키 확인: { hasServiceAccountKey: false, ... }
[Cloud Run OCR] 인증 정보가 없습니다. 공개 함수로 가정합니다.
[Cloud Run OCR] 인증 토큰이 없습니다. 공개 함수로 시도합니다.
```

**토큰 생성 실패:**
```
[Cloud Run OCR] 동적 토큰 생성 실패: ...
```

---

### 3단계: Google Cloud Console 설정 확인

#### 서비스 계정 권한 확인

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com
   - 프로젝트: `gen-lang-client-0287655743` 선택

2. **Cloud Run 또는 Cloud Functions 이동**
   - `extractTextFromImage` 함수 선택

3. **Permissions 탭 확인**
   - 서비스 계정: `ocr-service@gen-lang-client-0287655743.iam.gserviceaccount.com`
   - 역할: `Cloud Run Invoker` 또는 `Cloud Functions Invoker` 확인

4. **역할이 없는 경우:**
   - "Add Principal" 클릭
   - 서비스 계정 이메일 입력: `ocr-service@gen-lang-client-0287655743.iam.gserviceaccount.com`
   - 역할 선택: `Cloud Run Invoker`
   - 저장

---

### 4단계: Cloud Run 함수 URL 확인

#### 현재 기본값
- `https://us-central1-habitree-f49e1.cloudfunctions.net/extractTextFromImage`

#### 확인 필요
- ⚠️ 프로젝트가 변경되었으므로 Cloud Run 함수 URL도 변경되었을 수 있습니다
- Google Cloud Console에서 실제 함수 URL 확인
- 필요 시 `CLOUD_RUN_OCR_URL` 환경 변수 설정

#### 새 프로젝트의 Cloud Run 함수 URL 확인 방법
1. Google Cloud Console → Cloud Functions 또는 Cloud Run
2. `extractTextFromImage` 함수 선택
3. "Trigger" 또는 "Details" 탭에서 URL 확인
4. Vercel 환경 변수에 `CLOUD_RUN_OCR_URL` 설정

---

## 🔧 문제별 해결 방법

### 문제 1: 환경 변수 미설정

**증상:**
```
[Cloud Run OCR] 서비스 계정 키 확인: { hasServiceAccountKey: false, ... }
```

**해결 방법:**
1. `GOOGLE_SERVICE_ACCOUNT_KEY` 환경 변수 설정
2. Vercel 재배포

---

### 문제 2: JSON 파싱 오류

**증상:**
```
[Cloud Run OCR] 서비스 계정 키 파싱 실패: ...
```

**해결 방법:**
1. 환경 변수 값이 올바른 JSON 형식인지 확인
2. 한 줄로 변환되었는지 확인
3. `scripts/prepare-service-account-key.js` 재실행

---

### 문제 3: 토큰 생성 실패

**증상:**
```
[Cloud Run OCR] 동적 토큰 생성 실패: ...
```

**해결 방법:**
1. 서비스 계정 키가 올바른지 확인
2. Google Cloud Console에서 서비스 계정 확인
3. 네트워크 연결 확인

---

### 문제 4: 서비스 계정 권한 부족

**증상:**
```
403 Forbidden
Your client does not have permission to get URL /extractTextFromImage from this server.
```

**해결 방법:**
1. Google Cloud Console → Cloud Run → `extractTextFromImage` 함수
2. Permissions 탭 확인
3. 서비스 계정에 "Cloud Run Invoker" 역할 부여

---

### 문제 5: Cloud Run 함수 URL 오류

**증상:**
```
404 Not Found
또는
403 Forbidden (잘못된 프로젝트의 함수에 접근)
```

**해결 방법:**
1. Google Cloud Console에서 실제 함수 URL 확인
2. `CLOUD_RUN_OCR_URL` 환경 변수 설정
3. Vercel 재배포

---

## 📋 체크리스트

### Vercel 설정
- [ ] `GOOGLE_SERVICE_ACCOUNT_KEY` 환경 변수 설정 확인
- [ ] 환경 변수 값이 올바른 JSON 형식인지 확인
- [ ] Vercel 재배포 완료

### Google Cloud Console 설정
- [ ] 프로젝트: `gen-lang-client-0287655743` 선택
- [ ] 서비스 계정 확인: `ocr-service@gen-lang-client-0287655743.iam.gserviceaccount.com`
- [ ] Cloud Run 함수 확인: `extractTextFromImage`
- [ ] 서비스 계정에 "Cloud Run Invoker" 역할 부여 확인

### Cloud Run 함수 URL
- [ ] Cloud Run 함수 URL 확인
- [ ] 필요 시 `CLOUD_RUN_OCR_URL` 환경 변수 설정

### 로그 확인
- [ ] Vercel Functions 로그에서 토큰 생성 로그 확인
- [ ] 오류 메시지 확인
- [ ] 문제별 해결 방법 적용

---

## 📝 요약

### 필수 확인 사항
1. **Vercel 환경 변수:** `GOOGLE_SERVICE_ACCOUNT_KEY` 설정 확인
2. **Google Cloud Console:** 서비스 계정에 "Cloud Run Invoker" 역할 부여 확인
3. **Cloud Run 함수 URL:** 새 프로젝트의 실제 함수 URL 확인
4. **Vercel 재배포:** 환경 변수 변경 후 재배포

### 로그 확인
- 토큰 생성 로그 확인
- 오류 메시지 확인
- 문제별 해결 방법 적용

---

**이 문서는 OCR 403 Forbidden 오류 해결 가이드입니다.**
