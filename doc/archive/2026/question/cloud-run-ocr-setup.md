# Google Cloud Run OCR 설정 가이드

**작성일:** 2026년 1월 12일  
**프로젝트:** Habitree Reading Hub v4.0.0  
**OCR 방식:** Google Cloud Run OCR (단일 제공자)

---

## 📋 목차

1. [개요](#1-개요)
2. [환경 변수 설정](#2-환경-변수-설정)
3. [인증 토큰 설정](#3-인증-토큰-설정)
4. [테스트 방법](#4-테스트-방법)
5. [문제 해결](#5-문제-해결)

---

## 1. 개요

### OCR 처리 방식
- **단일 제공자:** Google Cloud Run OCR만 사용
- **자동 토큰 갱신:** 동적 토큰 생성으로 토큰 만료 걱정 없음
- **비용 효율적:** 매월 200만 건 무료, 매월 1,000개 이미지 무료

### 서비스 정보
- **서비스 URL:** `https://us-central1-habitree-f49e1.cloudfunctions.net/extractTextFromImage`
- **인증 방식:** Identity and Access Management (IAM)
- **서비스 계정:** `readtree-vision-api-service@habitree-f49e1.iam.gserviceaccount.com`

---

## 2. 환경 변수 설정

### 필수 환경 변수

#### `GOOGLE_SERVICE_ACCOUNT_KEY` (권장) ⭐

**설명:** 서비스 계정 키 JSON (동적 토큰 생성용)

**설정 방법:**

1. **서비스 계정 키 준비**
   ```bash
   node scripts/prepare-service-account-key.js
   ```

2. **출력된 한 줄 JSON 복사**

3. **Vercel 환경 변수 설정**
   - Key: `GOOGLE_SERVICE_ACCOUNT_KEY`
   - Value: 복사한 한 줄 JSON 전체
   - Environment: Production, Preview, Development (모두 선택)

**장점:**
- ✅ 자동 토큰 갱신 (1시간마다 자동)
- ✅ 토큰 만료 걱정 없음
- ✅ 수동 작업 불필요

---

#### `CLOUD_RUN_OCR_AUTH_TOKEN` (선택 사항)

**설명:** 정적 인증 토큰 (하위 호환성)

**설정 방법:**
- Key: `CLOUD_RUN_OCR_AUTH_TOKEN`
- Value: 생성한 인증 토큰
- Environment: Production, Preview, Development

**주의:**
- ⚠️ 토큰은 약 1시간 후 만료됨
- ⚠️ 만료 시 수동 갱신 필요
- ⚠️ `GOOGLE_SERVICE_ACCOUNT_KEY` 사용 권장

---

#### `CLOUD_RUN_OCR_URL` (선택 사항)

**설명:** Cloud Run OCR 서비스 URL

**기본값:** `https://us-central1-habitree-f49e1.cloudfunctions.net/extractTextFromImage`

**설정 필요 여부:** ❌ 기본값 사용 가능

---

## 3. 인증 토큰 설정

### 방법 1: 동적 토큰 생성 (권장) ⭐

**설정:**
1. `GOOGLE_SERVICE_ACCOUNT_KEY` 환경 변수 설정
2. 재배포

**동작:**
- OCR 호출 시마다 자동으로 토큰 생성
- 토큰 캐싱 (55분 유효)
- 만료 전 자동 갱신

---

### 방법 2: 정적 토큰 (비권장)

**설정:**
1. 인증 토큰 생성:
   ```bash
   node scripts/prepare-service-account-key.js
   # 또는
   node scripts/generate-cloud-run-token.js
   ```
2. `CLOUD_RUN_OCR_AUTH_TOKEN` 환경 변수 설정
3. 재배포

**주의:**
- 토큰 만료 시 수동 갱신 필요
- 1시간마다 재생성 필요

---

## 4. 테스트 방법

### 로컬 테스트

```bash
# .env.local 파일에 환경 변수 설정
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# 개발 서버 실행
npm run dev

# OCR 기능 테스트
```

### Vercel 배포 후 테스트

1. 환경 변수 설정 확인
2. 재배포 완료 대기
3. OCR 기능 테스트:
   - 기록 생성
   - 이미지 업로드
   - OCR 실행
4. Vercel Functions 로그 확인:
   ```
   [Cloud Run OCR] OCR 처리 시작
   [Cloud Run OCR] 동적 인증 토큰 생성 중...
   [Cloud Run OCR] OCR 처리 성공, 텍스트 길이: ...
   ```

---

## 5. 문제 해결

### 문제 1: 400 Bad Request

**증상:**
```
Cloud Run OCR API 호출 실패 (400): 요청 형식이 올바르지 않습니다.
```

**가능한 원인:**
- 요청 형식이 실제 API와 일치하지 않음
- MIME 타입 처리 방식 차이

**해결 방법:**
- Cloud Run 함수의 실제 요청 형식 확인
- 함수 개발자에게 요청 형식 확인

---

### 문제 2: 401 Unauthorized

**증상:**
```
Cloud Run OCR API 호출 실패 (401): Unauthorized
```

**가능한 원인:**
- 인증 토큰 미설정
- 토큰 만료 (정적 토큰 사용 시)
- 서비스 계정 권한 부족

**해결 방법:**
1. `GOOGLE_SERVICE_ACCOUNT_KEY` 환경 변수 확인
2. Google Cloud Console에서 서비스 계정 권한 확인
3. Cloud Run 함수에 "Cloud Run Invoker" 역할 부여 확인

---

### 문제 3: 403 Forbidden

**증상:**
```
Cloud Run OCR API 호출 실패 (403): Forbidden
```

**가능한 원인:**
- 서비스 계정에 "Cloud Run Invoker" 역할 없음
- Cloud Run 함수 접근 권한 문제

**해결 방법:**
1. Google Cloud Console → Cloud Functions → `extracttextfromimage` 함수
2. Permissions 탭 확인
3. 서비스 계정에 "Cloud Run Invoker" 역할 부여

---

### 문제 4: 토큰 생성 실패

**증상:**
```
[Cloud Run OCR] 동적 토큰 생성 실패: ...
```

**가능한 원인:**
- `GOOGLE_SERVICE_ACCOUNT_KEY` 형식 오류
- 서비스 계정 키가 잘못됨

**해결 방법:**
1. JSON 형식 확인 (한 줄로 변환되었는지)
2. 서비스 계정 키 파일 재다운로드
3. `scripts/prepare-service-account-key.js` 재실행

---

## 📊 체크리스트

### 배포 전
- [ ] `GOOGLE_SERVICE_ACCOUNT_KEY` 환경 변수 설정 (권장)
- [ ] 또는 `CLOUD_RUN_OCR_AUTH_TOKEN` 환경 변수 설정 (선택)
- [ ] 서비스 계정에 "Cloud Run Invoker" 역할 확인

### 배포 후
- [ ] Vercel 환경 변수 설정 확인
- [ ] 재배포 완료 확인
- [ ] OCR 기능 테스트
- [ ] Vercel Functions 로그 확인

---

## 📝 요약

### 필수 설정
1. **`GOOGLE_SERVICE_ACCOUNT_KEY`** 환경 변수 설정 (권장)
2. **재배포**

### 확인 사항
- ✅ Cloud Run 함수가 비공개 함수임 (인증 필요)
- ✅ 서비스 계정에 "Cloud Run Invoker" 역할 할당됨
- ✅ 동적 토큰 생성이 정상 작동함

### 장점
- ✅ 토큰 만료 걱정 없음 (자동 갱신)
- ✅ 수동 작업 불필요
- ✅ 운영 안정성 향상

---

**이 문서는 Google Cloud Run OCR 설정 가이드입니다.**
