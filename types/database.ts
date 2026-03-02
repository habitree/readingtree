export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_settings: {
        Row: {
          context_settings: Json
          created_at: string
          generation_settings: Json
          id: string
          is_active: boolean
          memory_settings: Json
          model_id: string
          provider: string
          system_prompt_template: string
          updated_at: string
          welcome_message: string
        }
        Insert: {
          context_settings?: Json
          created_at?: string
          generation_settings?: Json
          id?: string
          is_active?: boolean
          memory_settings?: Json
          model_id: string
          provider: string
          system_prompt_template: string
          updated_at?: string
          welcome_message: string
        }
        Update: {
          context_settings?: Json
          created_at?: string
          generation_settings?: Json
          id?: string
          is_active?: boolean
          memory_settings?: Json
          model_id?: string
          provider?: string
          system_prompt_template?: string
          updated_at?: string
          welcome_message?: string
        }
        Relationships: []
      }
      book_reflections: {
        Row: {
          created_at: string | null
          favorite_quote: string | null
          id: string
          rating: number | null
          recommendation: string | null
          reflection: string | null
          updated_at: string | null
          user_book_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          favorite_quote?: string | null
          id?: string
          rating?: number | null
          recommendation?: string | null
          reflection?: string | null
          updated_at?: string | null
          user_book_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          favorite_quote?: string | null
          id?: string
          rating?: number | null
          recommendation?: string | null
          reflection?: string | null
          updated_at?: string | null
          user_book_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_reflections_user_book_id_fkey"
            columns: ["user_book_id"]
            isOneToOne: false
            referencedRelation: "user_books"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author: string | null
          category: string | null
          cover_image_url: string | null
          created_at: string | null
          description_summary: string | null
          external_link: string | null
          id: string
          is_sample: boolean | null
          isbn: string | null
          published_date: string | null
          publisher: string | null
          summary: string | null
          title: string
          total_pages: number | null
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description_summary?: string | null
          external_link?: string | null
          id?: string
          is_sample?: boolean | null
          isbn?: string | null
          published_date?: string | null
          publisher?: string | null
          summary?: string | null
          title: string
          total_pages?: number | null
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description_summary?: string | null
          external_link?: string | null
          id?: string
          is_sample?: boolean | null
          isbn?: string | null
          published_date?: string | null
          publisher?: string | null
          summary?: string | null
          title?: string
          total_pages?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bookshelves: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_main: boolean | null
          is_public: boolean | null
          name: string
          order: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_main?: boolean | null
          is_public?: boolean | null
          name: string
          order?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_main?: boolean | null
          is_public?: boolean | null
          name?: string
          order?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          context_books: string[] | null
          context_notes: string[] | null
          created_at: string
          feedback: string | null
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          context_books?: string[] | null
          context_notes?: string[] | null
          created_at?: string
          feedback?: string | null
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          context_books?: string[] | null
          context_notes?: string[] | null
          created_at?: string
          feedback?: string | null
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          message_count: number
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          message_count?: number
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          message_count?: number
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_missions: {
        Row: {
          completed_at: string | null
          created_at: string
          date: string
          id: string
          mission_type: string
          points_earned: number | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          date?: string
          id?: string
          mission_type: string
          points_earned?: number | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          date?: string
          id?: string
          mission_type?: string
          points_earned?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_missions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      group_activity_stats: {
        Row: {
          books_completed: number | null
          created_at: string | null
          group_id: string
          id: string
          notes_count: number | null
          rank: number | null
          reading_minutes: number | null
          trend: string | null
          updated_at: string | null
          user_id: string
          week_start: string
        }
        Insert: {
          books_completed?: number | null
          created_at?: string | null
          group_id: string
          id?: string
          notes_count?: number | null
          rank?: number | null
          reading_minutes?: number | null
          trend?: string | null
          updated_at?: string | null
          user_id: string
          week_start: string
        }
        Update: {
          books_completed?: number | null
          created_at?: string | null
          group_id?: string
          id?: string
          notes_count?: number | null
          rank?: number | null
          reading_minutes?: number | null
          trend?: string | null
          updated_at?: string | null
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_activity_stats_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_books: {
        Row: {
          book_id: string
          created_at: string | null
          group_id: string
          id: string
          started_at: string | null
          target_completed_at: string | null
        }
        Insert: {
          book_id: string
          created_at?: string | null
          group_id: string
          id?: string
          started_at?: string | null
          target_completed_at?: string | null
        }
        Update: {
          book_id?: string
          created_at?: string | null
          group_id?: string
          id?: string
          started_at?: string | null
          target_completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_books_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string | null
          role: Database["public"]["Enums"]["member_role"] | null
          status: Database["public"]["Enums"]["member_status"] | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["member_role"] | null
          status?: Database["public"]["Enums"]["member_status"] | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["member_role"] | null
          status?: Database["public"]["Enums"]["member_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      group_notes: {
        Row: {
          group_id: string
          id: string
          note_id: string
          shared_at: string | null
        }
        Insert: {
          group_id: string
          id?: string
          note_id: string
          shared_at?: string | null
        }
        Update: {
          group_id?: string
          id?: string
          note_id?: string
          shared_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_notes_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_notes_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      group_shared_books: {
        Row: {
          group_id: string
          id: string
          shared_at: string | null
          user_book_id: string
        }
        Insert: {
          group_id: string
          id?: string
          shared_at?: string | null
          user_book_id: string
        }
        Update: {
          group_id?: string
          id?: string
          shared_at?: string | null
          user_book_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_shared_books_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_shared_books_user_book_id_fkey"
            columns: ["user_book_id"]
            isOneToOne: false
            referencedRelation: "user_books"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          leader_id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          leader_id: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          leader_id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_request_comments: {
        Row: {
          content: string
          created_at: string | null
          feature_request_id: string
          id: string
          is_admin_comment: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          feature_request_id: string
          id?: string
          is_admin_comment?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          feature_request_id?: string
          id?: string
          is_admin_comment?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_request_comments_feature_request_id_fkey"
            columns: ["feature_request_id"]
            isOneToOne: false
            referencedRelation: "feature_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_request_votes: {
        Row: {
          created_at: string | null
          feature_request_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feature_request_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          feature_request_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_request_votes_feature_request_id_fkey"
            columns: ["feature_request_id"]
            isOneToOne: false
            referencedRelation: "feature_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_requests: {
        Row: {
          admin_response: string | null
          created_at: string | null
          description: string
          id: string
          is_pinned: boolean | null
          status: Database["public"]["Enums"]["feature_request_status"] | null
          title: string
          updated_at: string | null
          user_id: string
          vote_count: number | null
        }
        Insert: {
          admin_response?: string | null
          created_at?: string | null
          description: string
          id?: string
          is_pinned?: boolean | null
          status?: Database["public"]["Enums"]["feature_request_status"] | null
          title: string
          updated_at?: string | null
          user_id: string
          vote_count?: number | null
        }
        Update: {
          admin_response?: string | null
          created_at?: string | null
          description?: string
          id?: string
          is_pinned?: boolean | null
          status?: Database["public"]["Enums"]["feature_request_status"] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          vote_count?: number | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          book_id: string | null
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_public: boolean | null
          is_sample: boolean | null
          page_number: number | null
          related_user_book_ids: string[] | null
          source_type: string | null
          source_label: string | null

          tags: string[] | null
          title: string | null
          type: Database["public"]["Enums"]["note_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          book_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          is_sample?: boolean | null
          page_number?: number | null
          related_user_book_ids?: string[] | null
          source_type?: string | null
          source_label?: string | null

          tags?: string[] | null
          title?: string | null
          type: Database["public"]["Enums"]["note_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          book_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          is_sample?: boolean | null
          page_number?: number | null
          related_user_book_ids?: string[] | null
          source_type?: string | null
          source_label?: string | null

          tags?: string[] | null
          title?: string | null
          type?: Database["public"]["Enums"]["note_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ocr_logs: {
        Row: {
          created_at: string
          error_message: string | null
          estimated_cost_usd: number | null
          id: string
          input_tokens: number | null
          model_id: string | null
          note_id: string | null
          output_tokens: number | null
          processing_duration_ms: number | null
          provider: string | null
          status: Database["public"]["Enums"]["ocr_log_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          estimated_cost_usd?: number | null
          id?: string
          input_tokens?: number | null
          model_id?: string | null
          note_id?: string | null
          output_tokens?: number | null
          processing_duration_ms?: number | null
          provider?: string | null
          status: Database["public"]["Enums"]["ocr_log_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          estimated_cost_usd?: number | null
          id?: string
          input_tokens?: number | null
          model_id?: string | null
          note_id?: string | null
          output_tokens?: number | null
          processing_duration_ms?: number | null
          provider?: string | null
          status?: Database["public"]["Enums"]["ocr_log_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocr_logs_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      ocr_correction_settings: {
        Row: {
          created_at: string
          generation_settings: Json
          id: string
          is_active: boolean
          model_id: string
          provider: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          generation_settings?: Json
          id?: string
          is_active?: boolean
          model_id?: string
          provider?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          generation_settings?: Json
          id?: string
          is_active?: boolean
          model_id?: string
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      ocr_usage_stats: {
        Row: {
          created_at: string
          failure_count: number
          id: string
          last_processed_at: string | null
          success_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          failure_count?: number
          id?: string
          last_processed_at?: string | null
          success_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          failure_count?: number
          id?: string
          last_processed_at?: string | null
          success_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      point_action_configs: {
        Row: {
          action_type: Database["public"]["Enums"]["point_action_type"]
          base_points: number
          category: string
          created_at: string
          daily_limit: number | null
          description: string
          icon: string | null
          id: string
          is_active: boolean
          is_repeatable: boolean
          updated_at: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["point_action_type"]
          base_points: number
          category: string
          created_at?: string
          daily_limit?: number | null
          description: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_repeatable?: boolean
          updated_at?: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["point_action_type"]
          base_points?: number
          category?: string
          created_at?: string
          daily_limit?: number | null
          description?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_repeatable?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      point_levels: {
        Row: {
          badge_icon: string | null
          created_at: string
          description: string | null
          id: string
          level: number
          required_points: number
          streak_bonus: number | null
          title: string
        }
        Insert: {
          badge_icon?: string | null
          created_at?: string
          description?: string | null
          id?: string
          level: number
          required_points: number
          streak_bonus?: number | null
          title: string
        }
        Update: {
          badge_icon?: string | null
          created_at?: string
          description?: string | null
          id?: string
          level?: number
          required_points?: number
          streak_bonus?: number | null
          title?: string
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          action_type: Database["public"]["Enums"]["point_action_type"]
          balance_after: number
          created_at: string
          description: string | null
          final_points: number
          id: string
          metadata: Json | null
          multiplier: number | null
          points: number
          reference_id: string | null
          reference_type: string | null
          user_id: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["point_action_type"]
          balance_after: number
          created_at?: string
          description?: string | null
          final_points: number
          id?: string
          metadata?: Json | null
          multiplier?: number | null
          points: number
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["point_action_type"]
          balance_after?: number
          created_at?: string
          description?: string | null
          final_points?: number
          id?: string
          metadata?: Json | null
          multiplier?: number | null
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transcriptions: {
        Row: {
          created_at: string | null
          extracted_text: string
          id: string
          memo_content: string | null
          note_id: string
          quote_content: string | null
          raw_extracted_text: string | null
          status: Database["public"]["Enums"]["ocr_status"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          extracted_text: string
          id?: string
          memo_content?: string | null
          note_id: string
          quote_content?: string | null
          raw_extracted_text?: string | null
          status?: Database["public"]["Enums"]["ocr_status"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          extracted_text?: string
          id?: string
          memo_content?: string | null
          note_id?: string
          quote_content?: string | null
          raw_extracted_text?: string | null
          status?: Database["public"]["Enums"]["ocr_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transcriptions_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: true
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_type: string
          created_at: string | null
          earned_at: string | null
          id: string
          metadata: Json | null
          tier: string | null
          user_id: string
        }
        Insert: {
          achievement_type: string
          created_at?: string | null
          earned_at?: string | null
          id?: string
          metadata?: Json | null
          tier?: string | null
          user_id: string
        }
        Update: {
          achievement_type?: string
          created_at?: string | null
          earned_at?: string | null
          id?: string
          metadata?: Json | null
          tier?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_ai_memories: {
        Row: {
          content: string
          created_at: string
          id: string
          memory_type: string
          metadata: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          memory_type: string
          metadata?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          memory_type?: string
          metadata?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_book_relations: {
        Row: {
          created_at: string | null
          id: string
          source_user_book_id: string
          target_user_book_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          source_user_book_id: string
          target_user_book_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          source_user_book_id?: string
          target_user_book_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_book_relations_source_user_book_id_fkey"
            columns: ["source_user_book_id"]
            isOneToOne: false
            referencedRelation: "user_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_book_relations_target_user_book_id_fkey"
            columns: ["target_user_book_id"]
            isOneToOne: false
            referencedRelation: "user_books"
            referencedColumns: ["id"]
          },
        ]
      }
      user_books: {
        Row: {
          book_format: string | null
          book_id: string
          bookshelf_id: string | null
          completed_at: string | null
          completed_dates: Json | null
          created_at: string | null
          current_page: number | null
          id: string
          reading_reason: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["reading_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          book_format?: string | null
          book_id: string
          bookshelf_id?: string | null
          completed_at?: string | null
          completed_dates?: Json | null
          created_at?: string | null
          current_page?: number | null
          id?: string
          reading_reason?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["reading_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          book_format?: string | null
          book_id?: string
          bookshelf_id?: string | null
          completed_at?: string | null
          completed_dates?: Json | null
          created_at?: string | null
          current_page?: number | null
          id?: string
          reading_reason?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["reading_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_books_bookshelf_id_fkey"
            columns: ["bookshelf_id"]
            isOneToOne: false
            referencedRelation: "bookshelves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_books_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_personas: {
        Row: {
          activity_pattern: string | null
          category_preferences: Json | null
          created_at: string
          group_engagement: string | null
          id: string
          last_analyzed_at: string | null
          note_style: string | null
          persona_summary: string | null
          reading_pace: string | null
          reading_stats: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_pattern?: string | null
          category_preferences?: Json | null
          created_at?: string
          group_engagement?: string | null
          id?: string
          last_analyzed_at?: string | null
          note_style?: string | null
          persona_summary?: string | null
          reading_pace?: string | null
          reading_stats?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_pattern?: string | null
          category_preferences?: Json | null
          created_at?: string
          group_engagement?: string | null
          id?: string
          last_analyzed_at?: string | null
          note_style?: string | null
          persona_summary?: string | null
          reading_pace?: string | null
          reading_stats?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          created_at: string
          current_level: number
          current_streak: number
          id: string
          last_activity_date: string | null
          lifetime_points: number
          longest_streak: number
          streak_bonus_multiplier: number | null
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_level?: number
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          lifetime_points?: number
          longest_streak?: number
          streak_bonus_multiplier?: number | null
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_level?: number
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          lifetime_points?: number
          longest_streak?: number
          streak_bonus_multiplier?: number | null
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          ai_enabled: boolean | null
          avatar_url: string | null
          consent_date: string | null
          created_at: string | null
          email: string | null
          id: string
          is_admin: boolean | null
          name: string
          onboarding_checklist: Json | null
          privacy_agreed: boolean | null
          reading_goal: number | null
          terms_agreed: boolean | null
          ui_style: string | null
          updated_at: string | null
        }
        Insert: {
          ai_enabled?: boolean | null
          avatar_url?: string | null
          consent_date?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          is_admin?: boolean | null
          name: string
          onboarding_checklist?: Json | null
          privacy_agreed?: boolean | null
          reading_goal?: number | null
          terms_agreed?: boolean | null
          ui_style?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_enabled?: boolean | null
          avatar_url?: string | null
          consent_date?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_admin?: boolean | null
          name?: string
          onboarding_checklist?: Json | null
          privacy_agreed?: boolean | null
          reading_goal?: number | null
          terms_agreed?: boolean | null
          ui_style?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_daily_point_count: {
        Args: {
          p_action_type: Database["public"]["Enums"]["point_action_type"]
          p_date?: string
          p_user_id: string
        }
        Returns: number
      }
      get_user_completed_books_count: {
        Args: { p_user_id: string; p_year?: number }
        Returns: number
      }
      get_user_notes_count_this_week: {
        Args: { p_user_id: string }
        Returns: number
      }
      is_admin_user: { Args: never; Returns: boolean }
    }
    Enums: {
      feature_request_status:
        | "requested"
        | "under_review"
        | "planned"
        | "in_progress"
        | "completed"
        | "declined"
      member_role: "leader" | "moderator" | "member"
      member_status: "pending" | "approved" | "rejected"
      note_type: "quote" | "photo" | "memo" | "transcription" | "progress"
      ocr_log_status: "success" | "failed"
      ocr_status: "processing" | "completed" | "failed"
      point_action_type:
        | "note_create"
        | "note_quote"
        | "note_memo"
        | "note_photo"
        | "note_transcription"
        | "note_progress"
        | "book_add"
        | "book_complete"
        | "book_progress_update"
        | "daily_first_activity"
        | "streak_3_days"
        | "streak_7_days"
        | "streak_14_days"
        | "streak_30_days"
        | "streak_100_days"
        | "streak_365_days"
        | "mission_complete"
        | "all_missions_complete"
        | "group_join"
        | "group_create"
        | "note_share"
        | "first_book"
        | "first_note"
        | "monthly_goal_achieve"
        | "yearly_goal_achieve"
        | "point_used"
        | "point_expired"
        | "admin_adjust"
      reading_status:
        | "reading"
        | "completed"
        | "paused"
        | "not_started"
        | "rereading"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      feature_request_status: [
        "requested",
        "under_review",
        "planned",
        "in_progress",
        "completed",
        "declined",
      ],
      member_role: ["leader", "moderator", "member"],
      member_status: ["pending", "approved", "rejected"],
      note_type: ["quote", "photo", "memo", "transcription", "progress"],
      ocr_log_status: ["success", "failed"],
      ocr_status: ["processing", "completed", "failed"],
      point_action_type: [
        "note_create",
        "note_quote",
        "note_memo",
        "note_photo",
        "note_transcription",
        "note_progress",
        "book_add",
        "book_complete",
        "book_progress_update",
        "daily_first_activity",
        "streak_3_days",
        "streak_7_days",
        "streak_14_days",
        "streak_30_days",
        "streak_100_days",
        "streak_365_days",
        "mission_complete",
        "all_missions_complete",
        "group_join",
        "group_create",
        "note_share",
        "first_book",
        "first_note",
        "monthly_goal_achieve",
        "yearly_goal_achieve",
        "point_used",
        "point_expired",
        "admin_adjust",
      ],
      reading_status: [
        "reading",
        "completed",
        "paused",
        "not_started",
        "rereading",
      ],
    },
  },
} as const
