/**
 * 책 관련 타입 정의
 */

export type ReadingStatus = "reading" | "completed" | "paused" | "not_started" | "rereading";

export interface Book {
  id: string;
  isbn: string | null;
  title: string;
  author: string | null;
  publisher: string | null;
  published_date: string | null;
  cover_image_url: string | null;
  total_pages: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserBook {
  id: string;
  user_id: string;
  book_id: string;
  bookshelf_id: string;
  status: ReadingStatus;
  started_at: string;
  completed_at: string | null;
  completed_dates?: string | null; // JSONB 배열 (문자열로 저장)
  reading_reason: string | null;
  current_page: number | null;
  /** 즐겨찾기(핀) — 메인 대시보드 최상단 고정 */
  is_pinned?: boolean;
  pinned_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookWithUserBook extends Book {
  user_book?: UserBook;
  notes_count?: number;
}

