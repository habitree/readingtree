/**
 * 서재 관련 타입 정의
 */

export interface Bookshelf {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_main: boolean;
  order: number;
  is_public: boolean;
  group_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookshelfWithStats extends Bookshelf {
  book_count: number;
  reading_count: number;
  completed_count: number;
  paused_count: number;
  not_started_count: number;
  rereading_count: number;
  group_name?: string;
}

export interface CreateBookshelfInput {
  name: string;
  description?: string | null;
  order?: number;
  is_public?: boolean;
}

export interface UpdateBookshelfInput {
  name?: string;
  description?: string | null;
  order?: number;
  is_public?: boolean;
}
