/**
 * Supabase Database 타입 정의
 * 
 * 주의: 실제 Supabase 프로젝트에서 타입을 생성하려면:
 * npx supabase gen types typescript --project-id <project-id> > types/database.ts
 * 
 * 현재는 기본 구조만 정의합니다.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          name: string;
          avatar_url: string | null;
          reading_goal: number;
          terms_agreed: boolean; // 이용약관 동의 여부
          privacy_agreed: boolean; // 개인정보처리방침 동의 여부
          consent_date: string | null; // 약관 동의 일시
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          name: string;
          avatar_url?: string | null;
          reading_goal?: number;
          terms_agreed?: boolean;
          privacy_agreed?: boolean;
          consent_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          name?: string;
          avatar_url?: string | null;
          reading_goal?: number;
          terms_agreed?: boolean;
          privacy_agreed?: boolean;
          consent_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      books: {
        Row: {
          id: string;
          isbn: string | null;
          title: string;
          author: string | null;
          publisher: string | null;
          published_date: string | null;
          cover_image_url: string | null;
          category: string | null;
          total_pages: number | null;
          summary: string | null;
          description_summary: string | null;
          external_link: string | null;
          is_sample: boolean | null;
          // AI 메타데이터 컬럼
          table_of_contents: string | null;
          full_description: string | null;
          keywords: string[] | null;
          author_info: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          isbn?: string | null;
          title: string;
          author?: string | null;
          publisher?: string | null;
          published_date?: string | null;
          cover_image_url?: string | null;
          category?: string | null;
          total_pages?: number | null;
          summary?: string | null;
          description_summary?: string | null;
          external_link?: string | null;
          is_sample?: boolean | null;
          // AI 메타데이터 컬럼
          table_of_contents?: string | null;
          full_description?: string | null;
          keywords?: string[] | null;
          author_info?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          isbn?: string | null;
          title?: string;
          author?: string | null;
          publisher?: string | null;
          published_date?: string | null;
          cover_image_url?: string | null;
          category?: string | null;
          total_pages?: number | null;
          summary?: string | null;
          description_summary?: string | null;
          external_link?: string | null;
          is_sample?: boolean | null;
          // AI 메타데이터 컬럼
          table_of_contents?: string | null;
          full_description?: string | null;
          keywords?: string[] | null;
          author_info?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_books: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          bookshelf_id: string | null;
          status: "reading" | "completed" | "paused" | "not_started" | "rereading";
          started_at: string;
          completed_at: string | null;
          completed_dates?: any; // JSONB 배열
          reading_reason: string | null;
          book_format: string | null;
          current_page: number; // 현재 읽은 페이지 (진행률 추적)
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          book_id: string;
          bookshelf_id?: string | null;
          status?: "reading" | "completed" | "paused" | "not_started" | "rereading";
          started_at?: string;
          completed_at?: string | null;
          completed_dates?: any; // JSONB 배열
          reading_reason?: string | null;
          book_format?: string | null;
          current_page?: number; // 현재 읽은 페이지 (진행률 추적)
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          book_id?: string;
          bookshelf_id?: string | null;
          status?: "reading" | "completed" | "paused" | "not_started" | "rereading";
          started_at?: string;
          completed_at?: string | null;
          completed_dates?: any; // JSONB 배열
          reading_reason?: string | null;
          book_format?: string | null;
          current_page?: number; // 현재 읽은 페이지 (진행률 추적)
          created_at?: string;
          updated_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          title: string | null;
          type: "quote" | "photo" | "memo" | "transcription";
          content: string | null;
          image_url: string | null;
          page_number: number | null;
          is_public: boolean;
          tags: string[] | null;
          related_user_book_ids: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          book_id: string;
          title?: string | null;
          type: "quote" | "photo" | "memo" | "transcription";
          content?: string | null;
          image_url?: string | null;
          page_number?: number | null;
          is_public?: boolean;
          tags?: string[] | null;
          related_user_book_ids?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          book_id?: string;
          title?: string | null;
          type?: "quote" | "photo" | "memo" | "transcription";
          content?: string | null;
          image_url?: string | null;
          page_number?: number | null;
          is_public?: boolean;
          tags?: string[] | null;
          related_user_book_ids?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          leader_id: string;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          leader_id: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          leader_id?: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: "leader" | "member";
          status: "pending" | "approved" | "rejected";
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: "leader" | "member";
          status?: "pending" | "approved" | "rejected";
          joined_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          role?: "leader" | "member";
          status?: "pending" | "approved" | "rejected";
          joined_at?: string;
        };
      };
      group_books: {
        Row: {
          id: string;
          group_id: string;
          book_id: string;
          started_at: string;
          target_completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          book_id: string;
          started_at?: string;
          target_completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          book_id?: string;
          started_at?: string;
          target_completed_at?: string | null;
          created_at?: string;
        };
      };
      ocr_usage_stats: {
        Row: {
          id: string;
          user_id: string;
          success_count: number;
          failure_count: number;
          last_processed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          success_count?: number;
          failure_count?: number;
          last_processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          success_count?: number;
          failure_count?: number;
          last_processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ocr_logs: {
        Row: {
          id: string;
          user_id: string;
          note_id: string | null;
          status: "success" | "failed";
          error_message: string | null;
          processing_duration_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          note_id?: string | null;
          status: "success" | "failed";
          error_message?: string | null;
          processing_duration_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          note_id?: string | null;
          status?: "success" | "failed";
          error_message?: string | null;
          processing_duration_ms?: number | null;
          created_at?: string;
        };
      };
      // AI 독서 도우미 테이블
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          last_message_at: string;
          message_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          last_message_at?: string;
          message_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          last_message_at?: string;
          message_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          context_books: string[] | null;
          context_notes: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          context_books?: string[] | null;
          context_notes?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          role?: "user" | "assistant" | "system";
          content?: string;
          context_books?: string[] | null;
          context_notes?: string[] | null;
          created_at?: string;
        };
      };
      user_personas: {
        Row: {
          id: string;
          user_id: string;
          reading_pace: string | null;
          note_style: string | null;
          activity_pattern: string | null;
          group_engagement: string | null;
          reading_stats: Json;
          category_preferences: Json;
          persona_summary: string | null;
          last_analyzed_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          reading_pace?: string | null;
          note_style?: string | null;
          activity_pattern?: string | null;
          group_engagement?: string | null;
          reading_stats?: Json;
          category_preferences?: Json;
          persona_summary?: string | null;
          last_analyzed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          reading_pace?: string | null;
          note_style?: string | null;
          activity_pattern?: string | null;
          group_engagement?: string | null;
          reading_stats?: Json;
          category_preferences?: Json;
          persona_summary?: string | null;
          last_analyzed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      // AI 시스템 설정 테이블
      ai_settings: {
        Row: {
          id: string;
          provider: "openai" | "google" | "anthropic";
          model_id: string;
          system_prompt_template: string;
          welcome_message: string;
          context_settings: Json;
          generation_settings: Json;
          memory_settings: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider: "openai" | "google" | "anthropic";
          model_id: string;
          system_prompt_template: string;
          welcome_message: string;
          context_settings?: Json;
          generation_settings?: Json;
          memory_settings?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider?: "openai" | "google" | "anthropic";
          model_id?: string;
          system_prompt_template?: string;
          welcome_message?: string;
          context_settings?: Json;
          generation_settings?: Json;
          memory_settings?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      // 사용자 AI 메모리 테이블
      user_ai_memories: {
        Row: {
          id: string;
          user_id: string;
          memory_type: string;
          content: string;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          memory_type: string;
          content: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          memory_type?: string;
          content?: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // 포인트 시스템 테이블
      user_points: {
        Row: {
          id: string;
          user_id: string;
          total_points: number;
          lifetime_points: number;
          current_level: number;
          streak_bonus_multiplier: number;
          last_activity_date: string | null;
          current_streak: number;
          longest_streak: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_points?: number;
          lifetime_points?: number;
          current_level?: number;
          streak_bonus_multiplier?: number;
          last_activity_date?: string | null;
          current_streak?: number;
          longest_streak?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          total_points?: number;
          lifetime_points?: number;
          current_level?: number;
          streak_bonus_multiplier?: number;
          last_activity_date?: string | null;
          current_streak?: number;
          longest_streak?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      point_transactions: {
        Row: {
          id: string;
          user_id: string;
          action_type: string;
          points: number;
          multiplier: number;
          final_points: number;
          description: string | null;
          reference_id: string | null;
          reference_type: string | null;
          balance_after: number;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action_type: string;
          points: number;
          multiplier?: number;
          final_points: number;
          description?: string | null;
          reference_id?: string | null;
          reference_type?: string | null;
          balance_after: number;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action_type?: string;
          points?: number;
          multiplier?: number;
          final_points?: number;
          description?: string | null;
          reference_id?: string | null;
          reference_type?: string | null;
          balance_after?: number;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      point_action_configs: {
        Row: {
          id: string;
          action_type: string;
          base_points: number;
          description: string;
          category: string;
          is_repeatable: boolean;
          daily_limit: number | null;
          is_active: boolean;
          icon: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          action_type: string;
          base_points: number;
          description: string;
          category: string;
          is_repeatable?: boolean;
          daily_limit?: number | null;
          is_active?: boolean;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          action_type?: string;
          base_points?: number;
          description?: string;
          category?: string;
          is_repeatable?: boolean;
          daily_limit?: number | null;
          is_active?: boolean;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      point_levels: {
        Row: {
          id: string;
          level: number;
          required_points: number;
          title: string;
          description: string | null;
          badge_icon: string | null;
          streak_bonus: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          level: number;
          required_points: number;
          title: string;
          description?: string | null;
          badge_icon?: string | null;
          streak_bonus?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          level?: number;
          required_points?: number;
          title?: string;
          description?: string | null;
          badge_icon?: string | null;
          streak_bonus?: number;
          created_at?: string;
        };
      };
      daily_missions: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          mission_type: "first_read" | "note" | "streak" | "time_goal";
          status: "pending" | "completed";
          points_earned: number;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          mission_type: "first_read" | "note" | "streak" | "time_goal";
          status?: "pending" | "completed";
          points_earned?: number;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          mission_type?: "first_read" | "note" | "streak" | "time_goal";
          status?: "pending" | "completed";
          points_earned?: number;
          completed_at?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

