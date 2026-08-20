# OCR 설정 체크리스트 (새 서비스 계정 키)

**작성일:** 2026년 1월 12일  
**서비스 계정:** `ocr-service@gen-lang-client-0287655743.iam.gserviceaccount.com`

---

## ✅ 필수 설정 단계

### 1단계: Vercel 환경 변수 설정

#### 환경 변수 정보
- **Key:** `GOOGLE_SERVICE_ACCOUNT_KEY`
- **Value:** 서비스 계정 키 JSON (한 줄로 변환)

#### 설정 방법

**1. 서비스 계정 키 준비**

PowerShell에서 다음 명령어 실행:

```powershell
$env:KEY_FILE="gen-lang-client-0287655743-8d38b5fa5b80.json"
node scripts/prepare-service-account-key.js
```

**2. 출력된 한 줄 JSON 복사**

스크립트 실행 후 출력된 환경 변수 값을 복사합니다.

**3. Vercel 환경 변수 설정**

1. Vercel 대시보드 → 프로젝트 선택
2. Settings → Environment Variables
3. "Add New" 클릭
4. Key: `GOOGLE_SERVICE_ACCOUNT_KEY`
5. Value: 복사한 한 줄 JSON 전체 붙여넣기
6. Environment: Production, Preview, Development (모두 선택)
7. "Save" 클릭

---

### 2단계: Google Cloud Console 설정 확인

#### 서비스 계정 정보
- **프로젝트 ID:** `gen-lang-client-0287655743`
- **서비스 계정 이메일:** `ocr-service@gen-lang-client-0287655743.iam.gserviceaccount.com`
- **서비스 계정 이름:** `ocr_service`

#### 확인 사항
1. **Google Cloud Console 접속**
   - https://console.cloud.google.com
   - 프로젝트: `gen-lang-client-0287655743` 선택

2. **Cloud Run 또는 Cloud Functions 이동**
   - `extractTextFromImage` 함수 확인

3. **Permissions 탭 확인**
   - 서비스 계정: `ocr-service@gen-lang-client-0287655743.iam.gserviceaccount.com`
   - 역할: `Cloud Run Invoker` 또는 `Cloud Functions Invoker` 확인

4. **역할이 없는 경우:**
   - "Add Principal" 클릭
   - 서비스 계정 이메일 입력
   - 역할: `Cloud Run Invoker` 선택
   - 저장

---

### 3단계: Cloud Run 함수 URL 확인 (선택 사항)

#### 현재 기본값
- `https://us-central1-habitree-f49e1.cloudfunctions.net/extractTextFromImage`

#### 확인 필요
- ⚠️ 프로젝트가 변경되었으므로 Cloud Run 함수 URL도 변경되었을 수 있습니다
- Google Cloud Console에서 실제 함수 URL 확인
- 필요 시 `CLOUD_RUN_OCR_URL` 환경 변수 설정

---

### 4단계: 재배포 및 테스트

#### 재배포
1. Vercel 대시보드 → Deployments 탭
2. 최신 배포 선택
3. "Redeploy" 클릭

#### 테스트
1. 기록 생성
2. 이미지 업로드
3. OCR 실행
4. Vercel Functions 로그 확인

---

## 📋 체크리스트

### Vercel 설정
- [ ] `GOOGLE_SERVICE_ACCOUNT_KEY` 환경 변수 추가
- [ ] 환경 변수 값 확인 (한 줄 JSON 전체)
- [ ] Environment: Production, Preview, Development (모두 선택)
- [ ] 저장 완료

### Google Cloud Console 설정
- [ ] 프로젝트: `gen-lang-client-0287655743` 선택
- [ ] 서비스 계정 확인: `ocr-service@gen-lang-client-0287655743.iam.gserviceaccount.com`
- [ ] Cloud Run 함수 확인: `extractTextFromImage`
- [ ] 서비스 계정에 "Cloud Run Invoker" 역할 부여 확인

### Cloud Run 함수 URL (선택)
- [ ] Cloud Run 함수 URL 확인
- [ ] 필요 시 `CLOUD_RUN_OCR_URL` 환경 변수 설정

### 배포 및 테스트
- [ ] Vercel 재배포 완료
- [ ] OCR 기능 테스트
- [ ] Vercel Functions 로그 확인

---

## ⚠️ 주의 사항

### 보안
- ❌ 서비스 계정 키를 Git에 커밋하지 마세요
- ✅ Vercel 환경 변수에만 저장하세요
- ✅ `.gitignore`에 키 파일이 포함되어 있는지 확인하세요

### 프로젝트 변경
- ⚠️ 프로젝트가 `habitree-f49e1`에서 `gen-lang-client-0287655743`로 변경되었습니다
- ⚠️ Cloud Run 함수 URL도 변경되었을 수 있으므로 확인이 필요합니다

---

**이 문서는 새 서비스 계정 키를 사용한 OCR 설정 체크리스트입니다.**
