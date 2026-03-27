/**
 * 사용자 관련 타입 정의
 */

export interface User {
  id: string;
  email: string | null;
  name: string;
  avatar_url: string | null;
  reading_goal: number;
  bio: string | null;
  favorite_book: string | null;
  favorite_quote: string | null;
  is_profile_public: boolean;
  ai_enabled: boolean | null;
  created_at: string;
  updated_at: string;
}

/** 레이아웃 컴포넌트용 경량 프로필 (Header, Sidebar에서 사용) */
export interface UserProfileSummary {
  id: string;
  name: string;
  avatar_url: string | null;
  is_admin?: boolean;
}

export interface UserProfile extends User {
  // 프로필 페이지에서 사용할 확장 정보
  total_books?: number;
  completed_books?: number;
  total_notes?: number;
}

