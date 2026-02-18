# 링크 미리보기(OG) 및 카카오톡 공유 고도화

> 페이지 URL을 카카오톡·SNS에 공유할 때 나타나는 **미리보기 이미지, 제목, 설명**을 제어하는 방법과 ReadTree 적용 내용을 정리한 문서입니다.

---

## 1. 개념 설명 (비개발자용)

### 1.1 링크 미리보기가 뭔가요?

링크를 카카오톡, 페이스북, 트위터 등에 붙여넣으면 **썸네일 이미지 + 제목 + 한 줄 설명**이 자동으로 붙어서 보입니다.  
이걸 **링크 미리보기(Link Preview)** 라고 하고, 이걸 만드는 데 쓰는 정보를 **Open Graph(OG)** 메타 정보라고 부릅니다.

### 1.2 누가 이 정보를 쓰나요?

- **카카오톡**: 링크 공유 시 미리보기 표시
- **페이스북, LinkedIn**: 공유 시 미리보기
- **트위터(X)**: 트윗 시 카드 형태 미리보기
- **네이버/구글 검색**: 일부 검색 결과에서 미리보기 스니펫에 활용

즉, **OG를 잘 설정해 두면** “어떤 페이지를 공유해도 이미지·제목·설명이 깔끔하게” 보이게 할 수 있습니다.

### 1.3 필요한 정보 4가지

| 항목 | 역할 | 예시 |
|------|------|------|
| **제목 (og:title)** | 미리보기 맨 위에 보이는 제목 | "ReadTree - 독서 기록 및 공유 플랫폼" |
| **설명 (og:description)** | 제목 아래 한두 줄 설명 | "책 관리, 독서 노트, AI 도우미와 함께하는..." |
| **이미지 (og:image)** | 썸네일로 보이는 그림 | 1200×630 픽셀 이미지 URL |
| **주소 (og:url)** | 공유된 페이지의 정식 주소 | https://readingtree-tan.vercel.app/share/notes/xxx |

이미지는 **반드시 절대 주소(https://로 시작하는 전체 URL)** 여야 합니다.  
상대 경로(`/image.png`)만 쓰면 카카오톡 등에서는 이미지를 못 가져와서 미리보기가 깨질 수 있습니다.

---

## 2. 카카오톡/OG 이미지 권장 사양

- **권장 크기**: 1200×630 픽셀 (가로:세로 비율 약 1.91:1)
- **최소 크기**: 200×200 픽셀
- **파일 크기**: 5MB 이하 권장
- **형식**: PNG, JPG, GIF, WebP
- **URL**: **반드시 https:// 로 시작하는 절대 URL**

이미지 URL이 상대 경로이거나, 크기가 너무 작거나, HTTPS가 아니면 카카오톡에서 미리보기 이미지가 안 나올 수 있습니다.

---

## 3. 카카오톡 캐시 안내

카카오톡은 **한 번 읽은 링크 정보를 캐시**해 둡니다.  
그래서 OG 메타나 이미지를 수정해도, **바로 반영되지 않고 예전 미리보기가 계속 보일 수 있습니다.**

- **대응**: 시간이 지나면 자동으로 갱신됩니다.  
- **즉시 확인하고 싶다면**: 카카오 개발자 도구의 [캐시 초기화](https://developers.kakao.com/tool/clear/cache)를 사용할 수 있습니다 (개발자용).

---

## 4. ReadTree 적용 내용 (고도화)

### 4.1 루트(전체 사이트) 메타데이터

- **metadataBase**  
  - `https://readingtree-tan.vercel.app` 로 고정  
  - 모든 상대 경로 OG 이미지가 이 주소를 기준으로 **절대 URL**로 변환되도록 설정
- **Open Graph**
  - `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`, `og:locale` 설정
  - 이미지: `/opengraph-image` (동적 생성 1200×630) → 자동으로 절대 URL로 제공
- **Twitter Card**
  - `summary_large_image` 형태로 동일한 제목·설명·이미지 사용
  - 이미지: `/twitter-image` (동적 생성) → 절대 URL로 제공

### 4.2 공유 페이지 (`/share/notes/[id]`)

- **페이지별 메타데이터 (generateMetadata)**
  - **제목**: `{책 제목} - 독서 기록`
  - **설명**: 필사/인상 구절/메모 중 하나를 요약 (최대 100자)
  - **이미지**: **해당 링크 페이지 화면과 동일한 레이아웃**의 동적 OG 이미지 사용
    - URL: `https://readingtree-tan.vercel.app/share/notes/{id}/opengraph-image`
    - `app/share/notes/[id]/opengraph-image.tsx`에서 1200×630 이미지를 동적 생성
    - 실제 공유 페이지와 같은 구성: 상단 뱃지, 좌측 책 표지+제목/저자, 우측 인상 구절·메모, 하단 ReadTree 브랜딩
  - **og:url**: 공유 페이지의 절대 URL (`getAppUrl()` + `/share/notes/{id}`)
- 이를 통해 “기록 공유” 링크를 카카오톡에 보낼 때도 **카카오톡 미리보기 이미지가 실제 페이지와 동일한 카드 화면**으로 보이도록 했습니다.

### 4.3 기본 OG 이미지 (브랜드)

- **파일**: `app/opengraph-image.tsx`, `app/twitter-image.tsx`
- **크기**: 1200×630
- **내용**: ReadTree 로고·태그라인·기능 키워드(책 관리, 독서 노트, AI 도우미)를 넣은 공통 이미지
- **하단 문구**: 서비스 도메인(`readingtree-tan.vercel.app`) 표기로 브랜드 인지도 강화

---

## 5. 기술 스택 (개발자용)

- **Next.js 15**  
  - `app/layout.tsx`의 `metadata`, `metadataBase`  
  - `app/opengraph-image.tsx`, `app/twitter-image.tsx` (동적 OG 이미지 생성)
- **페이지별 OG**  
  - `app/share/notes/[id]/page.tsx`의 `generateMetadata()`  
  - `getAppUrl()`로 절대 URL 생성, 표지 없을 때 기본 OG 이미지 URL로 폴백

---

## 6. 체크리스트 (추가 공유 페이지가 생길 때)

- [ ] 해당 페이지에 `metadata` 또는 `generateMetadata`로 `openGraph`(title, description, images, url) 설정
- [ ] `og:image`에는 **절대 URL(https://...)** 사용
- [ ] 이미지 없을 때는 `getAppUrl() + '/opengraph-image'` 로 폴백
- [ ] 이미지 권장 크기: 1200×630

---

**문서 버전**: 1.0  
**최종 수정**: 2025-02
