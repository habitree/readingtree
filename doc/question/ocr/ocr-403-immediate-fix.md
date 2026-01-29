# OCR 403 Forbidden 즉시 해결 가이드

**작성일:** 2026년 1월 12일  
**오류:** Cloud Run OCR API 호출 시 403 Forbidden  
**현재 상태:** 상세 로그 추가 코드가 아직 배포되지 않음

---

## 🔍 현재 상황 분석

### 로그 분석 결과

**발견된 문제:**
- ❌ `[Cloud Run OCR] getAuthToken 호출` 로그 없음 → 이전 버전 코드 실행 중
- ❌ `[Cloud Run OCR] 인증 토큰 가져오기 시작` 로그 없음 → 상세 로그 미적용
- ✅ `[Cloud Run OCR] OCR 처리 시작` 로그 있음 → 기본 로그만 작동
- ❌ `403 Forbidden` 오류 발생 → 인증 토큰 문제

**결론:**
- 아직 배포되지 않은 코드로 실행 중
- 인증 토큰이 생성되지 않았거나 전송되지 않음

---

## ✅ 즉시 해결 방법

### 방법 1: Vercel 환경 변수 확인 및 설정 (우선)

#### 1단계: 환경 변수 확인

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard
   - 프로젝트 선택

2. **Settings → Environment Variables 확인**
   - `GOOGLE_SERVICE_ACCOUNT_KEY` 존재 여부 확인
   - 값이 올바른 한 줄 JSON인지 확인

#### 2단계: 환경 변수 설정 (없는 경우)

**PowerShell에서 실행:**
```powershell
$env:KEY_FILE="gen-lang-client-0287655743-8d38b5fa5b80.json"
node scripts/prepare-service-account-key.js
```

**출력된 한 줄 JSON을 Vercel 환경 변수에 설정:**
- Key: `GOOGLE_SERVICE_ACCOUNT_KEY`
- Value: 출력된 한 줄 JSON 전체
- Environment: Production, Preview, Development (모두 선택)

#### 3단계: 재배포

1. Vercel 대시보드 → Deployments 탭
2. 최신 배포 선택
3. "Redeploy" 클릭

---

### 방법 2: Google Cloud Console 권한 확인

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

### 방법 3: Cloud Run 함수 URL 확인

#### 현재 기본값
- `https://us-central1-habitree-f49e1.cloudfunctions.net/extractTextFromImage`

#### 문제
- ⚠️ 프로젝트가 `habitree-f49e1`에서 `gen-lang-client-0287655743`로 변경됨
- ⚠️ 함수 URL도 변경되었을 가능성이 높음

#### 해결 방법

1. **Google Cloud Console에서 실제 함수 URL 확인**
   - Cloud Functions 또는 Cloud Run 이동
   - `extractTextFromImage` 함수 선택
   - "Trigger" 또는 "Details" 탭에서 URL 확인

2. **Vercel 환경 변수 설정**
   - Key: `CLOUD_RUN_OCR_URL`
   - Value: 확인한 실제 함수 URL
   - Environment: Production, Preview, Development (모두 선택)

3. **재배포**

---

## 📊 배포 후 확인 사항

### 상세 로그 확인 (배포 후)

배포가 완료되면 다음 로그를 확인할 수 있습니다:

**정상적인 경우:**
```
[Cloud Run OCR] getAuthToken 호출
[Cloud Run OCR] 서비스 계정 키 확인: { hasServiceAccountKey: true, keyLength: ..., ... }
[Cloud Run OCR] 새 토큰 생성 시작
[Cloud Run OCR] 서비스 계정 키 파싱 성공: { projectId: '...', clientEmail: '...' }
[Cloud Run OCR] GoogleAuth 클라이언트 생성 중...
[Cloud Run OCR] ID 토큰 클라이언트 생성 중, 대상 URL: ...
[Cloud Run OCR] ID 토큰 가져오기 중...
[Cloud Run OCR] ID 토큰 생성 성공, 토큰 길이: ...
[Cloud Run OCR] 인증 토큰 생성 성공, 토큰 길이: ...
[Cloud Run OCR] Authorization 헤더 추가됨
[Cloud Run OCR] API 호출 시작: { url: '...', hasAuthToken: true, ... }
```

**문제가 있는 경우:**
```
[Cloud Run OCR] 서비스 계정 키 확인: { hasServiceAccountKey: false, ... }
[Cloud Run OCR] 인증 정보가 없습니다. 공개 함수로 가정합니다.
[Cloud Run OCR] 인증 토큰이 없습니다. 공개 함수로 시도합니다.
[Cloud Run OCR] 환경 변수 확인: { hasStaticToken: false, hasServiceAccountKey: false, ... }
[Cloud Run OCR] Authorization 헤더 없이 요청 전송
```

**토큰 생성 실패:**
```
[Cloud Run OCR] 동적 토큰 생성 실패: { error: '...', stack: '...' }
```

---

## 🔧 문제별 해결 방법

### 문제 1: 환경 변수 미설정

**증상:**
```
[Cloud Run OCR] 서비스 계정 키 확인: { hasServiceAccountKey: false, ... }
```

**해결:**
1. `GOOGLE_SERVICE_ACCOUNT_KEY` 환경 변수 설정
2. 재배포

---

### 문제 2: JSON 파싱 오류

**증상:**
```
[Cloud Run OCR] 서비스 계정 키 파싱 실패: ...
```

**해결:**
1. 환경 변수 값이 올바른 JSON 형식인지 확인
2. 한 줄로 변환되었는지 확인
3. `scripts/prepare-service-account-key.js` 재실행

---

### 문제 3: 토큰 생성 실패

**증상:**
```
[Cloud Run OCR] 동적 토큰 생성 실패: ...
```

**해결:**
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

**해결:**
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

**해결:**
1. Google Cloud Console에서 실제 함수 URL 확인
2. `CLOUD_RUN_OCR_URL` 환경 변수 설정
3. 재배포

---

## 📋 즉시 실행 체크리스트

### 1. Vercel 환경 변수 확인
- [ ] `GOOGLE_SERVICE_ACCOUNT_KEY` 존재 여부 확인
- [ ] 값이 올바른 한 줄 JSON인지 확인
- [ ] 없으면 설정

### 2. Google Cloud Console 권한 확인
- [ ] 프로젝트: `gen-lang-client-0287655743` 선택
- [ ] 서비스 계정 확인: `ocr-service@gen-lang-client-0287655743.iam.gserviceaccount.com`
- [ ] Cloud Run 함수 확인: `extractTextFromImage`
- [ ] 서비스 계정에 "Cloud Run Invoker" 역할 부여 확인

### 3. Cloud Run 함수 URL 확인
- [ ] Google Cloud Console에서 실제 함수 URL 확인
- [ ] 필요 시 `CLOUD_RUN_OCR_URL` 환경 변수 설정

### 4. 재배포
- [ ] Vercel 재배포
- [ ] 배포 완료 대기

### 5. 로그 확인 (배포 후)
- [ ] Vercel Functions 로그에서 상세 로그 확인
- [ ] 토큰 생성 성공/실패 확인
- [ ] 문제별 해결 방법 적용

---

## 📝 요약

### 즉시 해야 할 일
1. **Vercel 환경 변수 확인:** `GOOGLE_SERVICE_ACCOUNT_KEY` 설정 확인
2. **Google Cloud Console 권한 확인:** 서비스 계정에 "Cloud Run Invoker" 역할 부여
3. **Cloud Run 함수 URL 확인:** 새 프로젝트의 실제 함수 URL 확인
4. **재배포:** 환경 변수 변경 후 재배포

### 배포 후 확인
- 상세 로그로 정확한 원인 파악 가능
- 문제별 해결 방법 적용

---

**이 문서는 OCR 403 Forbidden 오류의 즉시 해결 가이드입니다.**
