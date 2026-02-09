# Google Analytics (GA4) 설정 가이드

> ReadTree 프로젝트에 Google Analytics 4를 연결하는 전체 과정을 안내합니다.

---

## 목차

1. [사전 준비](#1-사전-준비)
2. [Google Analytics 계정 생성](#2-google-analytics-계정-생성)
3. [속성 및 데이터 스트림 생성](#3-속성-및-데이터-스트림-생성)
4. [측정 ID 확인](#4-측정-id-확인)
5. [프로젝트에 측정 ID 등록](#5-프로젝트에-측정-id-등록)
6. [Vercel 환경변수 설정 (프로덕션)](#6-vercel-환경변수-설정-프로덕션)
7. [연결 확인](#7-연결-확인)
8. [유용한 GA4 초기 설정](#8-유용한-ga4-초기-설정)
9. [문제 해결](#9-문제-해결)

---

## 1. 사전 준비

- Google 계정 (Gmail)
- ReadTree 프로젝트 로컬 환경 또는 Vercel 배포 환경

---

## 2. Google Analytics 계정 생성

### 2-1. Google Analytics 접속

1. [https://analytics.google.com/](https://analytics.google.com/) 에 접속
2. Google 계정으로 로그인

### 2-2. 계정 만들기

1. 좌측 하단 **관리** (톱니바퀴 아이콘) 클릭
2. **+ 계정 만들기** 클릭
3. 계정 이름 입력: `ReadTree` (또는 원하는 이름)
4. 데이터 공유 설정은 기본값 유지 → **다음** 클릭

---

## 3. 속성 및 데이터 스트림 생성

### 3-1. 속성 만들기

1. 속성 이름: `ReadTree`
2. 보고 시간대: `대한민국` 선택
3. 통화: `한국 원 (₩)` 선택
4. **다음** 클릭

### 3-2. 비즈니스 정보

1. 업종 카테고리: `도서 및 문학` (또는 가장 적절한 항목)
2. 비즈니스 규모: 해당하는 항목 선택
3. **다음** 클릭

### 3-3. 비즈니스 목표

원하는 목표를 선택합니다. 추천 항목:

- [x] 사용자 행동 분석
- [x] 사용자 참여도 향상

**만들기** 클릭 → 약관 동의

### 3-4. 데이터 스트림 생성

1. 플랫폼 선택: **웹** 클릭
2. 웹사이트 URL 입력:
   - 프로덕션: `https://readtree.vercel.app`
3. 스트림 이름: `ReadTree Web`
4. **스트림 만들기** 클릭

---

## 4. 측정 ID 확인

데이터 스트림 생성 후 바로 측정 ID가 표시됩니다.

```
측정 ID: G-XXXXXXXXXX
```

> **형식**: `G-` 로 시작하는 영숫자 조합 (예: `G-ABC1234DEF`)

### 나중에 다시 확인하는 방법

1. [Google Analytics](https://analytics.google.com/) 접속
2. 좌측 하단 **관리** (톱니바퀴)
3. **데이터 수집 및 수정** → **데이터 스트림**
4. 해당 스트림 클릭 → **측정 ID** 확인

---

## 5. 프로젝트에 측정 ID 등록

### 5-1. 로컬 개발 환경

프로젝트 루트의 `.env.local` 파일에 다음을 추가합니다:

```env
# Google Analytics (GA4)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

> `G-XXXXXXXXXX` 부분을 실제 측정 ID로 교체하세요.

### 5-2. 적용 확인

환경변수를 추가한 후 개발 서버를 재시작합니다:

```bash
# 실행 중인 서버 종료 후
npm run dev
```

> `.env.local` 변경 시 반드시 서버를 재시작해야 적용됩니다.

---

## 6. Vercel 환경변수 설정 (프로덕션)

### 6-1. Vercel 대시보드에서 설정

1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. **ReadTree** 프로젝트 클릭
3. 상단 탭 **Settings** → 좌측 메뉴 **Environment Variables**
4. 다음 환경변수 추가:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` | Production, Preview |

5. **Save** 클릭

### 6-2. 재배포

환경변수 추가 후 재배포가 필요합니다:

1. Vercel 대시보드 → **Deployments** 탭
2. 최신 배포의 **...** 메뉴 → **Redeploy** 클릭

또는 새로운 커밋을 push하면 자동 배포됩니다.

---

## 7. 연결 확인

### 7-1. 실시간 보고서로 확인

1. 사이트에 접속 (프로덕션 또는 로컬)
2. [Google Analytics](https://analytics.google.com/) → **보고서** → **실시간**
3. 활성 사용자 1명 이상 표시되면 연결 성공

> 최초 데이터 반영까지 수 분 ~ 최대 48시간 소요될 수 있습니다.

### 7-2. 브라우저 개발자 도구로 확인

1. 사이트 접속 후 `F12` (개발자 도구) 열기
2. **Network** 탭에서 `gtag` 또는 `google` 필터링
3. `gtag/js?id=G-XXXXXXXXXX` 요청이 보이면 정상

### 7-3. Google Tag Assistant로 확인

1. Chrome 웹스토어에서 [Google Tag Assistant](https://tagassistant.google.com/) 설치
2. 사이트 접속 후 Tag Assistant 실행
3. GA4 태그가 정상 감지되는지 확인

---

## 8. 유용한 GA4 초기 설정

### 8-1. 향상된 측정 활성화

Google Analytics가 자동으로 추적하는 이벤트를 설정합니다.

1. **관리** → **데이터 스트림** → 스트림 클릭
2. **향상된 측정** 섹션에서 다음 항목 활성화:
   - [x] 페이지 조회수
   - [x] 스크롤
   - [x] 이탈 클릭
   - [x] 사이트 검색
   - [x] 양식 상호작용
   - [x] 파일 다운로드

### 8-2. 데이터 보관 기간 변경

기본 2개월에서 14개월로 변경하는 것을 권장합니다.

1. **관리** → **데이터 수집 및 수정** → **데이터 보관**
2. 이벤트 데이터 보관: **14개월** 선택
3. **저장**

### 8-3. 내부 트래픽 필터링

개발 중 본인 접속을 제외하려면:

1. **관리** → **데이터 수집 및 수정** → **데이터 스트림**
2. 스트림 클릭 → **태그 설정 구성** → **내부 트래픽 정의**
3. **만들기** 클릭
4. 규칙 이름: `개발 환경`
5. IP 주소 조건: 본인 IP 입력
6. **관리** → **데이터 수집 및 수정** → **데이터 필터** 에서 필터를 **활성** 으로 변경

### 8-4. Google Search Console 연결 (선택)

SEO 데이터를 GA4에서 함께 보려면:

1. **관리** → **서비스 연결** → **Search Console 연결**
2. **연결** 클릭 → Search Console 속성 선택
3. 웹 스트림 선택 → **제출**

---

## 9. 문제 해결

### GA 스크립트가 로드되지 않는 경우

**원인**: 환경변수 미설정 또는 서버 미재시작

```bash
# .env.local 에 값이 있는지 확인
# NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# 서버 재시작
npm run dev
```

### 실시간 보고서에 데이터가 안 보이는 경우

- 광고 차단 확장 프로그램 (AdBlock, uBlock 등) 비활성화 후 재시도
- 최초 연결 시 최대 48시간 소요될 수 있음
- 브라우저 시크릿 모드에서 접속하여 테스트

### CSP(Content Security Policy) 관련 오류

ReadTree 프로젝트의 `next.config.js`에는 이미 Google Analytics 도메인이 허용되어 있습니다:

```
connect-src: https://*.google-analytics.com
script-src: https://www.googletagmanager.com
```

별도 CSP 수정은 필요 없습니다.

### localhost에서 GA가 작동하지 않는 경우

로컬 환경에서도 GA는 정상 작동합니다. 단, 일부 광고 차단 확장이 localhost에서도 GA를 차단할 수 있으므로 확장을 비활성화하고 테스트하세요.

---

## 관련 파일

| 파일 | 설명 |
|------|------|
| `app/layout.tsx` | GA 스크립트 삽입 위치 |
| `.env.local` | 측정 ID 환경변수 (로컬) |
| `.env.example` | 환경변수 예시 |
| `next.config.js` | CSP 설정 (이미 GA 허용됨) |
