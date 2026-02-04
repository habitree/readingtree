# ReadTree 도서/독서 관련 외부 API 카탈로그 (2026-02)

> 목적: ReadTree(ReadingTree) v4.0.0에 **“책 검색/서지/표지/페이지 수/미리보기/리뷰·독서기록”**을 확장하기 위한 외부 API 후보를 정리한다.  
> 기준 문서(프로젝트 맥락): `doc/ReadTree-PRD.md`

---

## 요약 (바로 쓰기 좋은 결론)

- **현재 ReadTree는 “한국 도서 페이지 수”에 대해 폴백 체인(국립중앙도서관 → 알라딘 → Google Books)을 이미 구성**해 둔 상태다.
- 다음 확장 방향에서 “시스템 반영” 효과가 가장 큰 축은 아래 4개다.
  - **(A) 더 나은 표지/메타데이터 보강**: Open Library Covers/Books, Kakao Book Search
  - **(B) 미리보기/본문 검색**: Internet Archive(Books/검색inside), Open Library Read API
  - **(C) 리뷰/독서상태(굿리즈 대안)**: Hardcover GraphQL
  - **(D) 트렌드/추천(대출 빅데이터)**: 도서관 정보나루(data4library)
  - **(E) 오픈 메타데이터 보강**: Wikidata SPARQL, Crossref/OpenAlex(학술·논픽션 중심)

---

## 0) 문서 필드 정의(정리 포맷)

각 API는 아래 항목으로 정리한다.

- **무료/유료**: Free / Freemium / Paid / Contact Sales(문의) / 불명(공식 공개 없음)
- **간단 요약(1줄)**: “무엇을 해결하는 API인지”
- **상세 기능(상세)**: 어떤 데이터를 주고받는지, 엔드포인트 성격
- **페이지 정보(문서/참고 링크)**: 공식 문서/가이드 링크
- **이외 상세정보**:
  - 인증 방식(키/토큰/무인증)
  - 레이트리밋/쿼터(공식에 수치가 있으면 수치로, 없으면 “문서 확인 필요”)
  - 커버리지(한국/글로벌, 도서/학술/전자책 등)
  - ReadTree 반영 포인트(어디에 쓰면 이득인지)

---

## 1) 현행(이미 연결된) 외부 API 7개 정리

> 아래 내용은 사용자 제공 “현재 연결된 API 정보”를 기반으로 정리했다(키 등 민감정보는 문서에 기입하지 않는다).

### 1.1 Supabase Authentication (인증/세션)

- **무료/유료**: Freemium (Supabase 플랜에 따라 과금)
- **간단 요약(1줄)**: ReadTree 인증·세션의 핵심 인프라(쿠키 기반 서버 중심 세션).
- **상세 기능(상세)**:
  - OAuth(카카오/구글), 이메일/비밀번호 로그인
  - 세션 관리(SSR/쿠키), RLS 기반 권한 분리
- **페이지 정보(문서/참고 링크)**:
  - Supabase Auth 개요: `https://supabase.com/docs/guides/auth`
- **이외 상세정보**:
  - ReadTree 규칙: 세션은 서버에서만 읽기(`app/actions/auth.ts`의 `getCurrentUser()` 중심)

### 1.2 Kakao JavaScript SDK (선택: 공유 기능)

- **무료/유료**: Free(일반적으로), 단 정책/쿼터는 카카오 문서 확인
- **간단 요약(1줄)**: 카카오톡 공유(링크/카드) 기능을 위한 SDK.
- **상세 기능(상세)**:
  - 카카오톡 공유, 일부 로그인 기능(단 ReadTree는 Supabase OAuth로 대체 가능)
- **페이지 정보(문서/참고 링크)**:
  - Kakao Developers: `https://developers.kakao.com/`
- **이외 상세정보**:
  - 활성화 필요성: “카카오톡 공유”를 앱 UX 핵심으로 가져갈 때만 권장

### 1.3 Naver Book Search API (책 검색)

- **무료/유료**: Free(네이버 오픈 API 한도 내)
- **간단 요약(1줄)**: 한국어 책 검색/기본 서지정보(제목·저자·ISBN·표지 등) 수집에 최적.
- **상세 기능(상세)**:
  - 제목/저자/출판사/ISBN 기반 검색
  - 표지 이미지 URL 제공(소스 품질은 도서별 편차 존재)
- **페이지 정보(문서/참고 링크)**:
  - 네이버 “검색 > 책” 문서: `https://developers.naver.com/docs/serviceapi/search/book/book.md`
- **이외 상세정보**:
  - **쿼터(공식)**: 검색 API 공통 **일일 25,000회/클라이언트ID** (문서 기준)
  - ReadTree 반영 포인트: “책 추가”의 기본 검색/자동입력은 네이버가 가장 실용적(한국 도서).

### 1.4 Google Cloud Run OCR (Cloud Functions 기반 OCR)

- **무료/유료**: Freemium(무료 한도 이후 유료)
- **간단 요약(1줄)**: 책 페이지 이미지에서 텍스트 추출(OCR)을 처리하는 서버리스 OCR 파이프라인.
- **상세 기능(상세)**:
  - 서비스 계정 기반 동적 토큰 발급/자동 갱신
  - 이미지 업로드 후 텍스트 추출
- **페이지 정보(문서/참고 링크)**:
  - (현재 서비스는 내부 Cloud Function URL 기반이므로, 운영 문서는 GCP/Cloud Run/Cloud Functions 기반으로 관리)
- **이외 상세정보**:
  - 현재 상태: 연결 정상(응답 237ms), 성공률/사용량 지표 존재
  - ReadTree 반영 포인트: OCR 정확도 개선/보정 UX(사용자 수정, 재시도, 전처리)로 확장 가능

### 1.5 국립중앙도서관 ISBN 서지정보 API (페이지 수 폴백 1순위)

- **무료/유료**: Free(공공 서비스 성격), 단 트래픽/정책은 기관 정책에 따름
- **간단 요약(1줄)**: 한국 도서의 공식 서지정보(페이지 수, 발행일 등) 정확도가 높음.
- **상세 기능(상세)**:
  - ISBN 기반 도서 서지 조회
  - 페이지 수 등 “정확한 서지” 확보에 유리
- **페이지 정보(문서/참고 링크)**:
  - 국립중앙도서관 서지/ISBN 안내: `https://www.nl.go.kr/seoji/`
- **이외 상세정보**:
  - 호출 제한 수치: 공개 문서에서 “기관 정책에 따라 상이”로 안내되는 경우가 많아 **운영 중 실제 한도는 별도 확인 필요**
  - ReadTree 반영 포인트: “페이지 수” 뿐 아니라 **출판일/판 정보** 보강에도 활용 여지.

### 1.6 알라딘 Open API (페이지 수 폴백 2순위 + 서점 데이터)

- **무료/유료**: Free(기본 한도) + 프리미엄(확장 한도, 조건부)
- **간단 요약(1줄)**: 국내 최대급 서점 데이터로 페이지 수/가격/평점 등을 보강.
- **상세 기능(상세)**:
  - ISBN 검색
  - 페이지 수, 가격, 평점, 판매/추천 지표(일부)
- **페이지 정보(문서/참고 링크)**:
  - 알라딘 OpenAPI 이용 안내: `https://blog.aladin.co.kr/openapi/`
- **이외 상세정보**:
  - **쿼터(공식)**: 기본 **일 5,000회** / 프리미엄 **일 100,000회(시간당 최대 10,000회)** (문서 기준)
  - ReadTree 반영 포인트: “국립중앙도서관에 없는 도서” 보완 + 가격/평점 기반 부가 정보 제공 가능.

### 1.7 Google Books API (페이지 수 폴백 3순위 + 글로벌)

- **무료/유료**: Freemium(프로젝트/쿼터 정책은 GCP 콘솔 기준으로 관리)
- **간단 요약(1줄)**: 글로벌 도서 메타데이터/페이지 수/미리보기 링크를 폭넓게 제공.
- **상세 기능(상세)**:
  - `volumes.list`(검색), `volumes.get`(상세)
  - 일부 도서에서 페이지 수, 설명, 카테고리, 표지, 미리보기 링크 제공
- **페이지 정보(문서/참고 링크)**:
  - Google Books API 개요/사용: `https://developers.google.com/books/docs/v1/using`
  - Volumes 레퍼런스: `https://developers.google.com/books/docs/v1/reference/volumes`
- **이외 상세정보**:
  - **쿼터/과금**: “정확한 수치”는 문서에 고정되어 있지 않고 **GCP 콘솔의 Quotas 화면에서 프로젝트별로 확인/조정**하는 형태가 일반적
  - ReadTree 반영 포인트: 해외 도서, 그리고 최종 폴백으로 안정적.

---

## 2) 영역별 확장 후보 API 리스트(시스템 반영 중심)

> 아래는 “추가 연동 후보”이며, **무료/유료 및 제약 조건을 명확히 구분**했다.  
> (가격이 공개되지 않은 상용 데이터는 “문의 필요”로 표기)

---

### 2.1 책 검색/서지 메타데이터(대체/보강)

#### (후보) Kakao Daum Search – 책 검색 API

- **무료/유료**: Free(일반적으로) / 쿼터는 문서 확인 필요
- **간단 요약(1줄)**: 네이버와 다른 소스의 한국어 책 검색 데이터를 추가 확보(보강/대체).
- **상세 기능(상세)**:
  - REST 기반 검색(책 포함)
- **페이지 정보(문서/참고 링크)**:
  - Daum Search 개발가이드: `https://developers.kakao.com/docs/latest/en/daum-search/dev-guide`
  - Quota 안내(수치 확인용): `https://developers.kakao.com/docs/latest/en/getting-started/quota`
- **이외 상세정보**:
  - ReadTree 반영 포인트: 네이버 결과가 빈약/누락인 도서에 대한 **2차 검색 소스**로 유용.

#### (후보) Open Library – Search API / Books API

- **무료/유료**: Free
- **간단 요약(1줄)**: 글로벌 오픈 서지 데이터(ISBN/작품/판/저자) + 표지까지 묶어서 제공.
- **상세 기능(상세)**:
  - **Books API**(`/api/books`): `bibkeys=ISBN:...` 형태로 ISBN 조회, `jscmd=details`로 상세 확장 가능
  - **Search API**: 제목/저자/키워드 검색(필드 선택 가능)
- **페이지 정보(문서/참고 링크)**:
  - Books API: `https://openlibrary.org/dev/docs/api/books`
  - Search API: `https://openlibrary.org/dev/docs/api/search`
- **이외 상세정보**:
  - ReadTree 반영 포인트:
    - 해외 도서 메타데이터 보강(네이버/알라딘/국중도에서 누락되는 경우)
    - “표지”는 Covers API와 조합하면 매우 강력

#### (후보) ISBNdb (상용 ISBN/도서 데이터)

- **무료/유료**: Paid(구독형) + 7일 트라이얼(플랜 정책에 따름)
- **간단 요약(1줄)**: ISBN 기반으로 글로벌 도서 메타데이터를 안정적으로 제공하는 상용 API(명시적 쿼터/속도 제공).
- **상세 기능(상세)**:
  - ISBN/제목/저자 등으로 검색 및 상세 조회(API 2.0 권장)
- **페이지 정보(문서/참고 링크)**:
  - API 문서: `https://isbndb.com/api-documentation`
  - API 2.0 문서: `https://isbndb.com/apidocs/v2`
  - 가격/플랜: `https://isbndb.com/isbn-database`
- **이외 상세정보**:
  - 인증: `Authorization` 헤더에 API 키 전달
  - (공식 페이지 기준) 월 구독 플랜 예시:
    - Basic: $14.99/mo (일 5,000 searches, 1 call/sec)
    - Premium: $35.99/mo (일 15,000, 3 calls/sec)
    - Pro: $99.99/mo (일 50,000, 5 calls/sec)
    - Enterprise: $299.99/mo (일 200,000, 10 calls/sec)
  - ReadTree 반영 포인트: “해외 도서 정확도/일관성”이 중요해지는 단계(유료 프리미엄 기능)에서 도입 후보.

#### (후보) Crossref REST API (학술서/챕터 중심)

- **무료/유료**: Free
- **간단 요약(1줄)**: DOI 중심이지만, “도서/챕터 메타데이터”를 오픈 API로 조회 가능(학술 출판물에 강함).
- **상세 기능(상세)**:
  - 학술 출판물 메타데이터(저자, 출판사, 발행일, DOI 등)
- **페이지 정보(문서/참고 링크)**:
  - Crossref REST API 인증/접근: `https://www.crossref.org/documentation/retrieve-metadata/rest-api/access-and-authentication/`
  - Books 질의(문서): `https://crossref.org/documentation/retrieve-metadata/xml-api/querying-for-books`
  - 레이트리밋 변경 공지: `https://www.crossref.org/blog/announcing-changes-to-rest-api-rate-limits/`
- **이외 상세정보**:
  - **레이트리밋(문서 기준)**: 50 requests/second(공정 사용)
  - ReadTree 반영 포인트: “독서모임에서 학술서/레퍼런스 기반 기록”을 강화할 때 유용.

#### (후보) Wikidata SPARQL (오픈 지식 그래프)

- **무료/유료**: Free
- **간단 요약(1줄)**: ISBN 기반으로 “저자/시리즈/수상/원작/번역 관계” 같은 지식 그래프 데이터를 풍부하게 가져올 수 있음.
- **상세 기능(상세)**:
  - SPARQL로 자유롭게 질의(P212 ISBN-13, P957 ISBN-10 등)
- **페이지 정보(문서/참고 링크)**:
  - ISBN-13 속성(P212): `https://www.wikidata.org/wiki/Property:P212`
  - Query limits: `https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service/query_limits`
  - 예제 모음: `https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service/queries/examples/en`
- **이외 상세정보**:
  - **제한(문서 기준)**: 쿼리 1분 타임아웃, IP당 동시 5개 요청 제한 등(429/403 주의)
  - ReadTree 반영 포인트: “책 상세 페이지”에서 **작가/수상/시리즈/원서-번역서 연결** 같은 ‘부가 지식’ 표현에 강점.

---

### 2.2 표지(커버) / 이미지

#### (후보) Open Library Covers API (강추)

- **무료/유료**: Free
- **간단 요약(1줄)**: ISBN 등 식별자로 고품질 표지 이미지를 간단한 URL 패턴으로 제공.
- **상세 기능(상세)**:
  - URL 패턴: `https://covers.openlibrary.org/b/isbn/{ISBN}-{S|M|L}.jpg`
  - ISBN/Goodreads/LibraryThing 등 다양한 ID 지원
- **페이지 정보(문서/참고 링크)**:
  - Covers API 문서: `https://openlibrary.org/dev/docs/api/covers`
- **이외 상세정보**:
  - **레이트리밋(문서/공지 기반)**: 식별자 접근은 IP당 5분 100회 제한(커버ID 기반은 제한 없음으로 안내된 자료 존재)
  - ReadTree 반영 포인트:
    - “표지 이미지 품질/일관성” 개선(네이버/알라딘 표지 누락 시 대체)
    - 책 카드/공유 이미지 생성 품질 향상

---

### 2.3 미리보기/원문/본문 내 검색(독서 경험 확장)

#### (후보) Open Library Read API

- **무료/유료**: Free
- **간단 요약(1줄)**: ISBN 등으로 Open Library에서 “읽기/대출/미리보기 가능한 링크”를 찾아주는 API.
- **상세 기능(상세)**:
  - 식별자 → 읽기 가능한 URL 매핑(대출 프로그램 포함)
- **페이지 정보(문서/참고 링크)**:
  - Read API: `https://openlibrary.org/dev/docs/api/read`
- **이외 상세정보**:
  - ReadTree 반영 포인트:
    - “책 상세 화면”에서 **합법적 미리보기/대출 링크** 제공
    - (후속) “독서모임”에서 공용으로 접근 가능한 자료 연결

#### (후보) Internet Archive – Item Metadata API / (Experimental) Book APIs

- **무료/유료**: Free
- **간단 요약(1줄)**: 스캔본/전자자료에 대해 메타데이터·페이지 이미지·본문 검색을 제공(강력).
- **상세 기능(상세)**:
  - Item 메타데이터: `https://archive.org/metadata/{identifier}`
  - (Experimental) Books API 스타일:
    - 책 메타데이터, 페이지 이미지(JPG), **search inside(본문 검색)** 등
- **페이지 정보(문서/참고 링크)**:
  - Metadata API(읽기): `https://archive.org/developers/md-read.html`
  - Tools & APIs 목록: `https://archive.org/developers/index-apis.html`
- **이외 상세정보**:
  - ReadTree 반영 포인트:
    - “인용/구절”을 정확히 찾는 기능(본문 검색 → 페이지/좌표)으로 확장 가능
    - 공개 자료(고전/절판/오픈 접근) 중심 기능으로 적합

#### (후보) HathiTrust Data API (도서관·기관 지향)

- **무료/유료**: 불명(키 발급 필요, 기관/친구 계정 등 조건 존재)
- **간단 요약(1줄)**: 도서관/학술기관 맥락에서 “읽기 가능한 자료 링크” 제공에 강점이 있는 데이터 API.
- **상세 기능(상세)**:
  - signed request(키/시크릿) 기반 접근(버전 2 문서가 오래된 편)
- **페이지 정보(문서/참고 링크)**:
  - Key request: `https://babel.hathitrust.org/cgi/kgs/request`
  - Data API 안내: `https://old.www.hathitrust.org/data_api.html`
- **이외 상세정보**:
  - ReadTree 반영 포인트: 기관/도서관 대상 기능을 강화할 때 고려(일반 대중 서비스에는 진입장벽 가능).

---

### 2.4 리뷰/평점/독서기록(커뮤니티) — “굿리즈 대안”

#### (현황) Goodreads API

- **무료/유료**: 해당 없음(사실상 신규 사용 불가)
- **간단 요약(1줄)**: **2020년 이후 신규 키 발급 중단/퇴역** 이슈로 신규 연동 대상이 아님.
- **상세 기능(상세)**:
  - 과거에는 리뷰/평점/서재 기능 제공
- **페이지 정보(문서/참고 링크)**:
  - API deprecation 토론: `https://www.goodreads.com/topic/show/21788520-api-deprecation`
- **이외 상세정보**:
  - ReadTree 반영 포인트: 대체제로 Hardcover 등을 우선 검토 권장.

#### (후보) Hardcover GraphQL API (강추)

- **무료/유료**: 불명(문서에 명시적 과금표 없음 — 서비스 정책에 따름)
- **간단 요약(1줄)**: 굿리즈 대안으로, 도서 메타데이터 + 리뷰/평점 + 독서 상태(리스트)까지 API로 다루기 좋음.
- **상세 기능(상세)**:
  - GraphQL로 책/에디션/저자/리뷰/리딩 상태 등 조회
- **페이지 정보(문서/참고 링크)**:
  - Docs: `https://docs.hardcover.app/`
  - Getting Started: `https://docs.hardcover.app/api/getting-started/`
  - Books 스키마: `https://docs.hardcover.app/api/graphql/schemas/books`
- **이외 상세정보**:
  - 인증: 계정에서 API 키 발급, `https://api.hardcover.app/v1/graphql` 엔드포인트 사용
  - ReadTree 반영 포인트:
    - “독서 상태(읽는 중/완독/보류)”를 외부 서비스와 동기화하는 확장(선택)
    - 추천/리뷰 기반 탐색 UX 강화

#### (후보) LibraryThing (개발자 허브 제공)

- **무료/유료**: Free(기본)로 보이나 **사용량 제한/비용 정책은 문의 필요**
- **간단 요약(1줄)**: 도서/미디어 개발자 도구 제공(단, 데이터 라이선스 제약으로 제공 범위 제한이 있을 수 있음).
- **상세 기능(상세)**:
  - Lightweight APIs, Talpa Search API(자연어 검색) 등
- **페이지 정보(문서/참고 링크)**:
  - Developer: `https://www.librarything.com/developer`
  - API: `https://www.librarything.com/api`
- **이외 상세정보**:
  - 문서상 “Talpa Search API는 낮은 사용량 제한” 언급(대규모 사용은 문의 권장)
  - ReadTree 반영 포인트: 실험적 검색/발견 UX에 후보.

---

### 2.5 무료 전자책(퍼블릭 도메인) / 오픈 카탈로그

#### (후보) Gutendex (Project Gutenberg 메타데이터)

- **무료/유료**: Free
- **간단 요약(1줄)**: 퍼블릭 도메인 전자책 메타데이터를 JSON API로 제공(데모/콘텐츠 보강에 좋음).
- **상세 기능(상세)**:
  - `/books`, `/books/{id}`로 목록/상세
  - 검색/필터(언어, 저자 연도, 주제 등)
- **페이지 정보(문서/참고 링크)**:
  - 공식: `https://gutendex.com/`
  - GitHub: `https://github.com/garethbjohnson/gutendex`
- **이외 상세정보**:
  - ReadTree 반영 포인트:
    - “샘플 데이터/튜토리얼”용 공개 도서 공급원
    - 영어권 고전 기반 독서 챌린지/모임 기능에 활용 가능

---

### 2.6 국내 도서관/대출 빅데이터(트렌드·추천·인기)

#### (후보) 도서관 정보나루(data4library) Open API (강추: “인기 대출/추천”)

- **무료/유료**: Free(승인형 키 발급)
- **간단 요약(1줄)**: 공공도서관 대출·장서 기반으로 “인기 대출 도서/추천 도서/도서관 목록”을 제공하는 국내 특화 API.
- **상세 기능(상세)**:
  - 도서관(참여기관) 목록/정보 조회
  - 도서관별 장서/대출 데이터(도서명, 저자, 출판사, ISBN, KDC 등)
  - 인기 대출 도서 랭킹
  - ISBN 기반 추천 도서(최대 200건 등)
- **페이지 정보(문서/참고 링크)**:
  - 서비스: `https://data4library.kr/`
  - API 활용 안내: `https://www.data4library.kr/apiUtilization`
- **이외 상세정보**:
  - 인증: 회원가입 후 마이페이지에서 인증키 신청(승인 절차 있음)
  - 응답 포맷: 문서상 XML 중심 안내가 많음(구현 시 파서/정규화 필요)
  - ReadTree 반영 포인트:
    - “오늘의 인기 대출 도서”, “대출 급상승”, “마니아 추천” 같은 탐색 UX
    - 독서모임에서 “다음 책 후보” 추천 근거로 사용 가능(국내 사용자 체감 큼)

---

### 2.7 도서관/기관/상용 서지 데이터(고정밀, 고비용 가능)

> 아래는 “정확도는 높지만 계약/비용/제약이 큰” 축이라, ReadTree의 현재 단계에서는 **필요 시점에 선택적으로 도입**하는 것을 권장한다.

#### (후보) OCLC WorldCat Search/Metadata API 2.0

- **무료/유료**: Paid(구독/자격 조건 필요)
- **간단 요약(1줄)**: 전 세계 도서관 카탈로그/서지 메타데이터(기관급).
- **상세 기능(상세)**:
  - 서지 검색/조회/보유 정보 등(서비스/패키지에 따라 다름)
- **페이지 정보(문서/참고 링크)**:
  - WorldCat Search API(자격 조건 안내 포함): `https://oclc.org/developer/api/oclc-apis/worldcat-search-api.en.html`
  - WorldCat Metadata API: `https://oclc.org/developer/api/oclc-apis/worldcat-metadata-api.en.html`
- **이외 상세정보**:
  - Search API 1.0은 2024/2025에 걸쳐 지원 종료/전환 이슈가 공지됨(도입 시 버전 확인 필수)
  - ReadTree 반영 포인트: B2B/도서관 협업 기능이 생길 때 검토.

#### (후보) Bowker Books In Print / Book MetaData API

- **무료/유료**: Contact Sales(가격 공개 제한)
- **간단 요약(1줄)**: 상용 고정밀 서지 데이터(특히 북미권)에 강력.
- **상세 기능(상세)**:
  - ISBN/저자/주제 기반 조회, 다양한 메타데이터 필드
- **페이지 정보(문서/참고 링크)**:
  - 제품: `https://www.bowker.com/books-in-print`
  - API/메타데이터 문서(도움말): `https://bms.bowker.com/help/`
- **이외 상세정보**:
  - ReadTree 반영 포인트: 프리미엄(유료) 데이터 상품을 만들 때 고려.

#### (후보) NielsenIQ BookData Metadata

- **무료/유료**: Contact Sales(개별 견적)
- **간단 요약(1줄)**: 출판/유통 데이터 기반의 상용 메타데이터(유럽권 등).
- **상세 기능(상세)**:
  - 메타데이터 제공(계약/패키지 별도)
- **페이지 정보(문서/참고 링크)**:
  - 제품: `https://nielseniq.com/global/en/landing-page/nielseniq-bookdata-metadata/`
- **이외 상세정보**:
  - ReadTree 반영 포인트: 글로벌 상용 데이터가 필요할 때만 검토.

---

### 2.8 도서관 카탈로그/표준 인터페이스(무료/공개 데이터 중심)

#### (후보) 국립중앙도서관 소장자료 Open API (소장/원문 제공 여부 등)

- **무료/유료**: Free
- **간단 요약(1줄)**: 국립중앙도서관 소장자료를 외부에서 검색·활용할 수 있는 Open API(도서/고문헌/논문/신문 등).
- **상세 기능(상세)**:
  - 자료 검색(간략검색/상세정보), 원문 제공 여부/저작권 정보 등 조회
- **페이지 정보(문서/참고 링크)**:
  - 안내: `https://www.nl.go.kr/NL/contents/N31101030700.do`
  - (참고) KORCIS OpenAPI 매뉴얼: `https://www.nl.go.kr/korcis/openAPIManual/contents.do`
- **이외 상세정보**:
  - 응답 포맷: 문서/포털 기준 XML 안내
  - ReadTree 반영 포인트:
    - “소장/원문 제공 여부” 같은 **도서관 관점 부가 정보** 제공
    - 향후 “책 대여/도서관 연계” 기능을 검토할 때 기반 데이터로 유용

#### (후보) Library of Congress (LOC) – JSON/YAML API + SRU

- **무료/유료**: Free
- **간단 요약(1줄)**: 미국 LOC의 컬렉션/카탈로그 메타데이터를 JSON/YAML 또는 SRU(XML)로 조회 가능.
- **상세 기능(상세)**:
  - loc.gov JSON/YAML API로 컬렉션 검색/메타데이터 조회
  - SRU(Search/Retrieval via URL) 표준으로 카탈로그 질의(CQL)
- **페이지 정보(문서/참고 링크)**:
  - LOC APIs: `https://www.loc.gov/apis/`
  - SRU 안내: `https://www.loc.gov/apis/additional-apis/search-retrieval-via-url/`
  - SRU 표준 페이지: `https://www.loc.gov/standards/sru/`
- **이외 상세정보**:
  - 주의: LOC는 2025년 신규 카탈로그로 전환하면서 API 동기화가 “점진 복구” 안내된 바 있음(도입 시 최신 상태 확인 권장)
  - ReadTree 반영 포인트: 북미권/희귀서지 보강, 또는 연구자/학술 독자 기능 확장에 후보.

#### (후보) Deutsche Nationalbibliothek(DNB) / ZDB – SRU(ISBN 검색 가능)

- **무료/유료**: Free
- **간단 요약(1줄)**: SRU 표준(XML)로 독일권 서지/연속간행물(ZDB) 데이터를 조회(일부 인덱스에 ISBN 포함).
- **상세 기능(상세)**:
  - CQL 기반 질의, MARC21-xml 등 스키마로 응답
- **페이지 정보(문서/참고 링크)**:
  - (예시) SRU 안내(독일 ZDB): `https://zeitschriftendatenbank.de/services/schnittstellen/sru/`
- **이외 상세정보**:
  - ReadTree 반영 포인트: 독일어권 특화 기능이 필요할 때 선택적으로.

---

### 2.9 학술/논픽션 메타데이터(오픈, 대규모)

#### (후보) OpenAlex API (학술/출판 메타데이터)

- **무료/유료**: Free(기본) + Premium(확장)
- **간단 요약(1줄)**: 학술/출판 생태계의 Works 데이터를 오픈 API로 제공(논픽션/학술서·챕터·레퍼런스에 유용).
- **상세 기능(상세)**:
  - Works/Authors/Publishers 등 엔티티 조회 및 필터/검색
- **페이지 정보(문서/참고 링크)**:
  - API 개요: `https://docs.openalex.org/how-to-use-the-api/api-overview`
  - 레이트리밋/인증: `https://docs.openalex.org/how-to-use-the-api/rate-limits-and-authentication`
- **이외 상세정보**:
  - (문서 기준) 제한: **일 100,000 calls**, **초당 10 req**
  - 권장: `mailto=`로 “polite pool” 참여(응답 안정성 향상)
  - ReadTree 반영 포인트: “학술서/논픽션 독서 기록”을 강화할 때 메타데이터·인용 연결에 도움.

---

## 3) 추천 TOP 10 (ReadTree 반영 가능성 기준)

### 3.1 선정 기준

- **반영 난이도**: 키 발급/요금/약관/기술 난이도가 낮을수록 가점
- **데이터 효용**: 페이지 수, 표지, ISBN 정확도, 저자/판/설명 품질
- **커버리지**: 한국 도서 + 해외 도서 균형
- **제품 가치 적합성**: PRD의 핵심 가치(기록 통합/즉시 검색/쉬운 공유)에 얼마나 직결되는지

### 3.2 TOP 10 목록(추천 순)

1. **Open Library Covers API** (Free)  
   - 표지 품질/안정성 개선 체감이 가장 큼(공유 카드뉴스/책 카드에 즉시 효과)

2. **도서관 정보나루(data4library) Open API** (Free, 승인형 키)  
   - 국내 사용자에게 바로 체감되는 “인기 대출/추천” 데이터로 탐색 UX를 크게 강화

3. **Open Library Books API / Search API** (Free)  
   - 해외 도서 메타데이터 보강 + 네이버/알라딘 누락 구간 커버

4. **Kakao Daum Search – 책 검색** (Free, 쿼터 문서 확인 필요)  
   - 한국어 책 검색 소스를 추가해 “검색 실패율”을 실질적으로 낮출 가능성

5. **Internet Archive (Metadata + Book APIs)** (Free)  
   - “본문 검색/페이지 좌표”는 ReadTree의 ‘문장 다시 찾기’ 가치와 매우 잘 맞음

6. **Open Library Read API** (Free)  
   - 합법적 미리보기/대출 링크 제공으로 ‘독서 흐름’ 연결

7. **Hardcover GraphQL API** (정책/요금 불명)  
   - 굿리즈 대안으로 리뷰/독서상태 기반의 탐색 UX 확장에 유리

8. **Wikidata SPARQL** (Free)  
   - 시리즈/수상/원작-번역 연결 등 “지식 그래프”가 필요한 순간에 강력

9. **Crossref REST API / OpenAlex API** (Free)  
   - 학술서·논픽션(레퍼런스/인용/출판 메타데이터) 축을 강화할 때 효용이 큼

10. **ISBNdb** (Paid)  
   - 해외 도서 메타데이터 품질/일관성이 “서비스 품질”로 직결되는 단계에서 유료로 해결하는 카드

---

## 4) ReadTree에 “시스템 반영”할 때의 권장 적용 포인트(간단)

> ReadTree 레이어 규칙 요약:  
> - 외부 API 호출/HTTP 처리: `app/api/**` 또는 `lib/api/**`에 래핑  
> - DB 저장/조회: `app/actions/**`에서만 수행  
> - UI는 hooks → actions(서버) 또는 API route 호출로 간접 접근

### 4.1 도서 메타데이터 확장(권장 흐름 예시)

- **책 추가/검색(사용자 입력)**  
  - 1차: Naver Book Search  
  - 2차(보강): Kakao Book Search  
  - 3차(글로벌 보강): Google Books / Open Library Search

- **표지 이미지 선택 우선순위(권장)**  
  - 1차: 신뢰도 높은 소스(네이버/알라딘 제공 URL이 “정상 이미지”면 사용)  
  - 2차: Open Library Covers(ISBN 기반)  
  - 3차: Google Books 썸네일(최종)

- **페이지 수(현행 폴백 유지 권장)**  
  - 국립중앙도서관 → 알라딘 → Google Books

### 4.2 저장 전략(불필요한 외부 호출 줄이기)

- 책 검색 결과는 “즉시 저장”보다,
  - 사용자가 실제로 “내 책장에 추가”하는 시점에만 정규화해 저장
  - 외부 원본(raw) 응답은 필요 최소만 보관(또는 해시/ETag 기반 캐시)하는 방향이 안전

---

## 5) 참고: 가격/쿼터 정보의 신뢰도 표기

- **공식 문서에 수치가 명시된 경우**: 문서 기준 수치를 적었다(예: 네이버 검색 API 일 25,000, 알라딘 일 5,000 등).
- **공식 문서가 “프로젝트별/콘솔에서 확인” 형태인 경우**: 고정 수치 대신 “콘솔에서 확인”으로 표기했다(예: Google Books).
- **상용/기관 계약형**: 가격표가 공개되지 않는 경우가 많아 “문의 필요”로 표기했다(OCLC/Bowker/Nielsen 등).

