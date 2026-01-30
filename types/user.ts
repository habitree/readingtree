/**
 * 사용자 관련 타입 정의
 */

export interface User {
  id: string;
  email: string | null;
  name: string;
  avatar_url: string | null;
  reading_goal: number;
  ai_enabled: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  // 프로필 페이지에서 사용할 확장 정보
  total_books?: number;
  completed_books?: number;
  total_notes?: number;
}

