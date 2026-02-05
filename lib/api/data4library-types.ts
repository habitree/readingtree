/**
 * 도서관 정보나루(data4library) API 타입 정의
 * @see https://www.data4library.kr/apiDoc
 */

// ============================================
// 공통 타입
// ============================================

/** API 요청 기본 옵션 */
export interface Data4LibraryBaseOptions {
  /** 인증 키 (선택, 환경변수에서 자동 로드) */
  authKey?: string;
}

// ============================================
// 인기대출도서 API (도서관 정보나루 코어)
// ============================================

/** 인기대출도서 조회 옵션 */
export interface PopularBooksOptions extends Data4LibraryBaseOptions {
  /** 검색 시작일 (YYYY-MM-DD) */
  startDt?: string;
  /** 검색 종료일 (YYYY-MM-DD) */
  endDt?: string;
  /** 지역코드 (예: 11 = 서울) */
  region?: string;
  /** 세부지역코드 */
  dtl_region?: string;
  /** 대출구분 (0: 전체, 1: 대출순, 2: 주간증감순) */
  searchType?: "0" | "1" | "2";
  /** 성별 (0: 전체, 1: 남자, 2: 여자) */
  gender?: "0" | "1" | "2";
  /** 연령대 (0: 전체, 6: 유아, 8: 초등학생, 14: 중고등학생, 20: 20대, ... 60: 60대 이상) */
  age?: string;
  /** 주제분류 KDC 코드 (예: 0: 총류, 1: 철학, 8: 문학) */
  kdc?: string;
  /** 페이지 번호 (기본값: 1) */
  pageNo?: number;
  /** 페이지당 결과 수 (기본값: 10, 최대: 100) */
  pageSize?: number;
  /** 응답 형식 (xml 또는 json) */
  format?: "xml" | "json";
}

/** 인기대출도서 단일 항목 (XML 파싱 후) */
export interface PopularBookItem {
  /** 순위 */
  no: number;
  /** 도서명 */
  bookname: string;
  /** 저자 */
  authors: string;
  /** 출판사 */
  publisher: string;
  /** 출판년도 */
  publication_year: string;
  /** ISBN-13 */
  isbn13: string;
  /** 부가기호 */
  addition_symbol?: string;
  /** 표지 이미지 URL */
  bookImageURL?: string;
  /** 대출건수 */
  loan_count: number;
  /** 주제분류 코드 */
  class_no?: string;
  /** 주제분류명 */
  class_nm?: string;
  /** 도서관 코드 */
  libCode?: string;
}

/** 인기대출도서 API 응답 (XML 구조) */
export interface PopularBooksXmlResponse {
  response: {
    request: {
      startDt?: string;
      endDt?: string;
      region?: string;
      pageNo?: number;
      pageSize?: number;
    };
    resultNum: number;
    numFound: number;
    docs?: {
      doc: PopularBookItem | PopularBookItem[];
    };
  };
}

// ============================================
// 추천도서 API (ISBN 기반)
// ============================================

/** 추천도서 조회 옵션 */
export interface RecommendedBooksOptions extends Data4LibraryBaseOptions {
  /** 기준 ISBN-13 */
  isbn13: string;
  /** 추천 유형 (recommend: 추천, related: 연관) */
  type?: "recommend" | "related";
  /** 결과 개수 (기본값: 5, 최대: 10) */
  count?: number;
}

/** 추천도서 단일 항목 */
export interface RecommendedBookItem {
  /** 도서명 */
  bookname: string;
  /** 저자 */
  authors: string;
  /** 출판사 */
  publisher: string;
  /** 출판년도 */
  publication_year?: string;
  /** ISBN-13 */
  isbn13: string;
  /** 표지 이미지 URL */
  bookImageURL?: string;
  /** 추천 점수 (0~100) */
  recommendScore?: number;
}

/** 추천도서 API 응답 (XML 구조) */
export interface RecommendedBooksXmlResponse {
  response: {
    request: {
      isbn13: string;
    };
    docs?: {
      doc: RecommendedBookItem | RecommendedBookItem[];
    };
  };
}

// ============================================
// 도서 상세정보 API
// ============================================

/** 도서 상세정보 조회 옵션 */
export interface BookDetailOptions extends Data4LibraryBaseOptions {
  /** ISBN-13 */
  isbn13: string;
}

/** 도서 상세정보 */
export interface BookDetail {
  /** 도서명 */
  bookname: string;
  /** 저자 */
  authors: string;
  /** 출판사 */
  publisher: string;
  /** 출판년도 */
  publication_year: string;
  /** ISBN-13 */
  isbn13: string;
  /** 부가기호 */
  addition_symbol?: string;
  /** 권사항 */
  vol?: string;
  /** 주제분류 코드 */
  class_no?: string;
  /** 주제분류명 */
  class_nm?: string;
  /** 도서 설명 */
  description?: string;
  /** 표지 이미지 URL */
  bookImageURL?: string;
  /** 총 대출건수 */
  loan_count?: number;
}

// ============================================
// 변환된 인기도서 타입 (프론트엔드용)
// ============================================

/** 프론트엔드에서 사용할 인기도서 타입 */
export interface PopularBook {
  /** 순위 (1부터 시작) */
  ranking: number;
  /** ISBN-13 */
  isbn13: string;
  /** 도서명 */
  title: string;
  /** 저자 */
  author: string;
  /** 출판사 */
  publisher: string;
  /** 출판년도 */
  publicationYear?: string;
  /** 표지 이미지 URL */
  coverImageUrl?: string;
  /** 대출건수 */
  loanCount: number;
  /** 주제분류명 */
  category?: string;
  /** 데이터 출처 */
  source: "data4library";
}

/** 프론트엔드에서 사용할 추천도서 타입 */
export interface RecommendedBook {
  /** ISBN-13 */
  isbn13: string;
  /** 도서명 */
  title: string;
  /** 저자 */
  author: string;
  /** 출판사 */
  publisher: string;
  /** 출판년도 */
  publicationYear?: string;
  /** 표지 이미지 URL */
  coverImageUrl?: string;
  /** 추천 점수 (0~100) */
  recommendScore?: number;
  /** 데이터 출처 */
  source: "data4library";
}

// ============================================
// 캐시/DB 저장용 타입
// ============================================

/** DB 저장용 인기도서 타입 */
export interface ExternalPopularBook {
  id?: string;
  source: "data4library";
  category: "popular" | "trending" | "mania" | "recommended";
  isbn13: string;
  title: string;
  author: string | null;
  publisher: string | null;
  loan_count: number | null;
  ranking: number | null;
  region_code: string | null;
  fetched_at?: string;
  expires_at: string;
  metadata?: {
    coverImageUrl?: string;
    publicationYear?: string;
    categoryName?: string;
    [key: string]: unknown;
  };
}

// ============================================
// 지역 코드 상수
// ============================================

/** 지역 코드 맵핑 (도서관 정보나루 기준) */
export const REGION_CODES = {
  "11": "서울",
  "21": "부산",
  "22": "대구",
  "23": "인천",
  "24": "광주",
  "25": "대전",
  "26": "울산",
  "29": "세종",
  "31": "경기",
  "32": "강원",
  "33": "충북",
  "34": "충남",
  "35": "전북",
  "36": "전남",
  "37": "경북",
  "38": "경남",
  "39": "제주",
} as const;

export type RegionCode = keyof typeof REGION_CODES;

/** 연령대 코드 맵핑 */
export const AGE_CODES = {
  "0": "전체",
  "6": "유아(0~6)",
  "8": "초등학생(7~12)",
  "14": "청소년(13~18)",
  "20": "20대",
  "30": "30대",
  "40": "40대",
  "50": "50대",
  "60": "60대 이상",
} as const;

export type AgeCode = keyof typeof AGE_CODES;

/** KDC 주제분류 코드 맵핑 */
export const KDC_CODES = {
  "0": "총류",
  "1": "철학",
  "2": "종교",
  "3": "사회과학",
  "4": "자연과학",
  "5": "기술과학",
  "6": "예술",
  "7": "언어",
  "8": "문학",
  "9": "역사",
} as const;

export type KdcCode = keyof typeof KDC_CODES;
