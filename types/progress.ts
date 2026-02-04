/**
 * 진행 기록 관련 타입 정의
 * reading_logs 테이블과 매핑
 */

/**
 * 독서 진행 로그 기본 타입
 */
export interface ReadingLog {
  id: string;
  user_id: string;
  user_book_id: string;
  page_number: number;
  memo: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 진행 로그 생성 입력 타입
 */
export interface CreateReadingLogInput {
  user_book_id: string;
  page_number: number;
  memo?: string;
  is_public?: boolean;
}

/**
 * 진행 로그 수정 입력 타입
 */
export interface UpdateReadingLogInput {
  memo?: string | null;
  is_public?: boolean;
}

/**
 * 진행 로그 with 책 정보
 */
export interface ReadingLogWithBook extends ReadingLog {
  user_books?: {
    id: string;
    book_id: string;
    current_page: number;
    status: string;
    books?: {
      id: string;
      title: string;
      author: string | null;
      cover_image_url: string | null;
      total_pages: number | null;
    };
  };
}

/**
 * 진행 로그 목록 조회 필터
 */
export interface ReadingLogFilter {
  user_book_id?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

/**
 * 진행 로그 통계
 */
export interface ReadingLogStats {
  total_logs: number;
  pages_read_today: number;
  pages_read_this_week: number;
  pages_read_this_month: number;
  average_pages_per_day: number;
  streak_days: number;
}
