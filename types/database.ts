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
      access_logs: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          path: string
          referer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          path: string
          referer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          path?: string
          referer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_generated_reports: {
        Row: {
          book_author: string | null
          book_title: string
          completed_at: string | null
          cover_image_url: string | null
          created_at: string
          current_page: number | null
          generation_time_ms: number | null
          id: string
          include_notes: boolean
          is_public: boolean
          note_count: number
          note_ids: string[]
          report_markdown: string
          share_id: string
          started_at: string | null
          template_id: string | null
          token_usage: Json | null
          total_pages: number | null
          updated_at: string
          user_book_id: string
          user_id: string
          view_count: number
        }
        Insert: {
          book_author?: string | null
          book_title: string
          completed_at?: string | null
          cover_image_url?: string | null
          created_at?: string
          current_page?: number | null
          generation_time_ms?: number | null
          id?: string
          include_notes?: boolean
          is_public?: boolean
          note_count?: number
          note_ids?: string[]
          report_markdown: string
          share_id?: string
          started_at?: string | null
          template_id?: string | null
          token_usage?: Json | null
          total_pages?: number | null
          updated_at?: string
          user_book_id: string
          user_id: string
          view_count?: number
        }
        Update: {
          book_author?: string | null
          book_title?: string
          completed_at?: string | null
          cover_image_url?: string | null
          created_at?: string
          current_page?: number | null
          generation_time_ms?: number | null
          id?: string
          include_notes?: boolean
          is_public?: boolean
          note_count?: number
          note_ids?: string[]
          report_markdown?: string
          share_id?: string
          started_at?: string | null
          template_id?: string | null
          token_usage?: Json | null
          total_pages?: number | null
          updated_at?: string
          user_book_id?: string
          user_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_generated_reports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_report_settings: {
        Row: {
          created_at: string
          default_template_id: string | null
          enable_multi_reading: boolean
          id: string
          max_notes_for_analysis: number
          max_output_tokens: number
          min_notes_threshold: number
          model_id: string
          note_type_weights: Json
          provider: string
          system_prompt: string
          temperature: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_template_id?: string | null
          enable_multi_reading?: boolean
          id?: string
          max_notes_for_analysis?: number
          max_output_tokens?: number
          min_notes_threshold?: number
          model_id?: string
          note_type_weights?: Json
          provider?: string
          system_prompt?: string
          temperature?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_template_id?: string | null
          enable_multi_reading?: boolean
          id?: string
          max_notes_for_analysis?: number
          max_output_tokens?: number
          min_notes_threshold?: number
          model_id?: string
          note_type_weights?: Json
          provider?: string
          system_prompt?: string
          temperature?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_report_settings_default_template_id_fkey"
            columns: ["default_template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
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
          group_id: string | null
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
          group_id?: string | null
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
          group_id?: string | null
          id?: string
          is_main?: boolean | null
          is_public?: boolean | null
          name?: string
          order?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookshelves_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
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
      external_popular_books: {
        Row: {
          author: string | null
          category: string
          expires_at: string
          fetched_at: string | null
          id: string
          isbn13: string
          loan_count: number | null
          metadata: Json | null
          publisher: string | null
          ranking: number | null
          region_code: string | null
          source: string
          title: string
        }
        Insert: {
          author?: string | null
          category: string
          expires_at: string
          fetched_at?: string | null
          id?: string
          isbn13: string
          loan_count?: number | null
          metadata?: Json | null
          publisher?: string | null
          ranking?: number | null
          region_code?: string | null
          source?: string
          title: string
        }
        Update: {
          author?: string | null
          category?: string
          expires_at?: string
          fetched_at?: string | null
          id?: string
          isbn13?: string
          loan_count?: number | null
          metadata?: Json | null
          publisher?: string | null
          ranking?: number | null
          region_code?: string | null
          source?: string
          title?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "feature_request_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          {
            foreignKeyName: "feature_request_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_requests: {
        Row: {
          admin_response: string | null
          created_at: string | null
          description: string
          feature_area: string | null
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
          feature_area?: string | null
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
          feature_area?: string | null
          id?: string
          is_pinned?: boolean | null
          status?: Database["public"]["Enums"]["feature_request_status"] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          vote_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_requests_user_id_fkey"
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
      group_book_bundles: {
        Row: {
          created_at: string | null
          description: string | null
          group_id: string
          id: string
          links: Json | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          group_id: string
          id?: string
          links?: Json | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          group_id?: string
          id?: string
          links?: Json | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_book_bundles_group_id_fkey"
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
          bundle_id: string | null
          created_at: string | null
          description: string | null
          group_id: string
          id: string
          links: Json | null
          sort_order: number | null
          started_at: string | null
          target_completed_at: string | null
        }
        Insert: {
          book_id: string
          bundle_id?: string | null
          created_at?: string | null
          description?: string | null
          group_id: string
          id?: string
          links?: Json | null
          sort_order?: number | null
          started_at?: string | null
          target_completed_at?: string | null
        }
        Update: {
          book_id?: string
          bundle_id?: string | null
          created_at?: string | null
          description?: string | null
          group_id?: string
          id?: string
          links?: Json | null
          sort_order?: number | null
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
            foreignKeyName: "group_books_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "group_book_bundles"
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
      group_invite_tokens: {
        Row: {
          created_at: string | null
          created_by: string
          expires_at: string | null
          group_id: string
          id: string
          is_active: boolean | null
          max_uses: number | null
          token: string
          use_count: number | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          group_id: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          token?: string
          use_count?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          group_id?: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          token?: string
          use_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "group_invite_tokens_group_id_fkey"
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
          join_message: string | null
          joined_at: string | null
          role: Database["public"]["Enums"]["member_role"] | null
          status: Database["public"]["Enums"]["member_status"] | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          join_message?: string | null
          joined_at?: string | null
          role?: Database["public"]["Enums"]["member_role"] | null
          status?: Database["public"]["Enums"]["member_status"] | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          join_message?: string | null
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
      group_note_comments: {
        Row: {
          content: string
          created_at: string | null
          group_note_id: string
          id: string
          parent_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          group_note_id: string
          id?: string
          parent_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          group_note_id?: string
          id?: string
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_note_comments_group_note_id_fkey"
            columns: ["group_note_id"]
            isOneToOne: false
            referencedRelation: "group_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_note_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "group_note_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_note_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      group_note_reactions: {
        Row: {
          created_at: string | null
          group_note_id: string
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          group_note_id: string
          id?: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          group_note_id?: string
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_note_reactions_group_note_id_fkey"
            columns: ["group_note_id"]
            isOneToOne: false
            referencedRelation: "group_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_note_reactions_user_id_fkey"
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
          content: string | null
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          join_type: Database["public"]["Enums"]["join_type"]
          leader_id: string
          links: Json | null
          name: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          join_type?: Database["public"]["Enums"]["join_type"]
          leader_id: string
          links?: Json | null
          name: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          join_type?: Database["public"]["Enums"]["join_type"]
          leader_id?: string
          links?: Json | null
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
      login_logs: {
        Row: {
          created_at: string
          email: string | null
          error_message: string | null
          id: string
          ip_address: string | null
          provider: string | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          provider?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          provider?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      monthly_recaps: {
        Row: {
          ai_caption: string | null
          created_at: string
          generated_at: string
          highlights: Json
          id: string
          is_public: boolean
          month: number
          share_id: string
          share_version: number
          stats: Json
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          ai_caption?: string | null
          created_at?: string
          generated_at?: string
          highlights?: Json
          id?: string
          is_public?: boolean
          month: number
          share_id?: string
          share_version?: number
          stats?: Json
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          ai_caption?: string | null
          created_at?: string
          generated_at?: string
          highlights?: Json
          id?: string
          is_public?: boolean
          month?: number
          share_id?: string
          share_version?: number
          stats?: Json
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      notes: {
        Row: {
          book_id: string | null
          content: string | null
          created_at: string | null
          detail_kind: string | null
          id: string
          image_url: string | null
          is_public: boolean | null
          is_sample: boolean | null
          page_number: string | null
          reading_log_id: string | null
          related_user_book_ids: string[] | null
          source_label: string | null
          source_type: string | null
          status: string
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
          detail_kind?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          is_sample?: boolean | null
          page_number?: string | null
          reading_log_id?: string | null
          related_user_book_ids?: string[] | null
          source_label?: string | null
          source_type?: string | null
          status?: string
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
          detail_kind?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          is_sample?: boolean | null
          page_number?: string | null
          reading_log_id?: string | null
          related_user_book_ids?: string[] | null
          source_label?: string | null
          source_type?: string | null
          status?: string
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
            foreignKeyName: "notes_reading_log_id_fkey"
            columns: ["reading_log_id"]
            isOneToOne: false
            referencedRelation: "reading_logs"
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
      ocr_cache: {
        Row: {
          created_at: string
          extracted_text: string
          hit_count: number
          image_hash: string
        }
        Insert: {
          created_at?: string
          extracted_text: string
          hit_count?: number
          image_hash: string
        }
        Update: {
          created_at?: string
          extracted_text?: string
          hit_count?: number
          image_hash?: string
        }
        Relationships: []
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
      og_settings: {
        Row: {
          brand_icon_url: string | null
          brand_name: string
          color_background: string
          color_border: string
          color_card_background: string
          color_earth: string
          color_earth_light: string
          color_forest: string
          color_forest_light: string
          color_forest_lighter: string
          color_text_muted: string
          color_text_primary: string
          color_text_secondary: string
          description: string
          domain: string
          id: string
          is_active: boolean
          keywords: string
          tagline: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_icon_url?: string | null
          brand_name?: string
          color_background?: string
          color_border?: string
          color_card_background?: string
          color_earth?: string
          color_earth_light?: string
          color_forest?: string
          color_forest_light?: string
          color_forest_lighter?: string
          color_text_muted?: string
          color_text_primary?: string
          color_text_secondary?: string
          description?: string
          domain?: string
          id?: string
          is_active?: boolean
          keywords?: string
          tagline?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_icon_url?: string | null
          brand_name?: string
          color_background?: string
          color_border?: string
          color_card_background?: string
          color_earth?: string
          color_earth_light?: string
          color_forest?: string
          color_forest_light?: string
          color_forest_lighter?: string
          color_text_muted?: string
          color_text_primary?: string
          color_text_secondary?: string
          description?: string
          domain?: string
          id?: string
          is_active?: boolean
          keywords?: string
          tagline?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      payment_history: {
        Row: {
          created_at: string
          event_type: string
          id: string
          order_id: string
          payload: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          order_id: string
          payload?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          order_id?: string
          payload?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      payment_orders: {
        Row: {
          amount: number
          bonus_points: number
          confirmed_at: string | null
          created_at: string
          failure_code: string | null
          failure_message: string | null
          first_purchase_bonus: number
          id: string
          order_id: string
          package_id: string
          payment_key: string | null
          payment_method: string | null
          points: number
          points_charged_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          bonus_points?: number
          confirmed_at?: string | null
          created_at?: string
          failure_code?: string | null
          failure_message?: string | null
          first_purchase_bonus?: number
          id?: string
          order_id: string
          package_id: string
          payment_key?: string | null
          payment_method?: string | null
          points: number
          points_charged_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          bonus_points?: number
          confirmed_at?: string | null
          created_at?: string
          failure_code?: string | null
          failure_message?: string | null
          first_purchase_bonus?: number
          id?: string
          order_id?: string
          package_id?: string
          payment_key?: string | null
          payment_method?: string | null
          points?: number
          points_charged_at?: string | null
          status?: string
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
          title: string
        }
        Insert: {
          badge_icon?: string | null
          created_at?: string
          description?: string | null
          id?: string
          level: number
          required_points: number
          title: string
        }
        Update: {
          badge_icon?: string | null
          created_at?: string
          description?: string | null
          id?: string
          level?: number
          required_points?: number
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
      rate_limits: {
        Row: {
          count: number
          created_at: string
          reset_at: string
          token: string
        }
        Insert: {
          count?: number
          created_at?: string
          reset_at: string
          token: string
        }
        Update: {
          count?: number
          created_at?: string
          reset_at?: string
          token?: string
        }
        Relationships: []
      }
      reading_logs: {
        Row: {
          app_version: string | null
          bookmark_page: number | null
          bookmark_text: string | null
          client_session_id: string | null
          created_at: string | null
          end_page: number | null
          ended_at: string | null
          id: string
          image_url: string | null
          image_urls: Json
          is_public: boolean | null
          memo: string | null
          music_playlist_id: string | null
          music_started_at: string | null
          music_track_ids: Json | null
          pace_seconds_per_page: number | null
          page_number: number
          promoted_at: string | null
          reading_duration_seconds: number | null
          start_page: number | null
          started_at: string | null
          status: string
          target_seconds: number | null
          updated_at: string | null
          user_book_id: string
          user_id: string
        }
        Insert: {
          app_version?: string | null
          bookmark_page?: number | null
          bookmark_text?: string | null
          client_session_id?: string | null
          created_at?: string | null
          end_page?: number | null
          ended_at?: string | null
          id?: string
          image_url?: string | null
          image_urls?: Json
          is_public?: boolean | null
          memo?: string | null
          music_playlist_id?: string | null
          music_started_at?: string | null
          music_track_ids?: Json | null
          pace_seconds_per_page?: number | null
          page_number?: number
          promoted_at?: string | null
          reading_duration_seconds?: number | null
          start_page?: number | null
          started_at?: string | null
          status?: string
          target_seconds?: number | null
          updated_at?: string | null
          user_book_id: string
          user_id: string
        }
        Update: {
          app_version?: string | null
          bookmark_page?: number | null
          bookmark_text?: string | null
          client_session_id?: string | null
          created_at?: string | null
          end_page?: number | null
          ended_at?: string | null
          id?: string
          image_url?: string | null
          image_urls?: Json
          is_public?: boolean | null
          memo?: string | null
          music_playlist_id?: string | null
          music_started_at?: string | null
          music_track_ids?: Json | null
          pace_seconds_per_page?: number | null
          page_number?: number
          promoted_at?: string | null
          reading_duration_seconds?: number | null
          start_page?: number | null
          started_at?: string | null
          status?: string
          target_seconds?: number | null
          updated_at?: string | null
          user_book_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_logs_user_book_id_fkey"
            columns: ["user_book_id"]
            isOneToOne: false
            referencedRelation: "user_books"
            referencedColumns: ["id"]
          },
        ]
      }
      record_events: {
        Row: {
          created_at: string
          event: string
          id: string
          metadata: Json | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          book_milestone_granted: boolean
          completed_at: string | null
          created_at: string
          id: string
          note_milestone_granted: boolean
          referred_id: string
          referred_points_granted: boolean
          referrer_id: string
          referrer_points_granted: boolean
          source_id: string | null
          source_type: string
          status: string
        }
        Insert: {
          book_milestone_granted?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          note_milestone_granted?: boolean
          referred_id: string
          referred_points_granted?: boolean
          referrer_id: string
          referrer_points_granted?: boolean
          source_id?: string | null
          source_type?: string
          status?: string
        }
        Update: {
          book_milestone_granted?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          note_milestone_granted?: boolean
          referred_id?: string
          referred_points_granted?: boolean
          referrer_id?: string
          referrer_points_granted?: boolean
          source_id?: string | null
          source_type?: string
          status?: string
        }
        Relationships: []
      }
      report_reactions: {
        Row: {
          anonymous_id: string | null
          created_at: string
          id: string
          reaction_type: Database["public"]["Enums"]["report_reaction_type"]
          report_id: string
          user_id: string | null
        }
        Insert: {
          anonymous_id?: string | null
          created_at?: string
          id?: string
          reaction_type: Database["public"]["Enums"]["report_reaction_type"]
          report_id: string
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string | null
          created_at?: string
          id?: string
          reaction_type?: Database["public"]["Enums"]["report_reaction_type"]
          report_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_reactions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "ai_generated_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          include_stats: boolean
          is_default: boolean
          is_system: boolean
          multi_read_aware: boolean
          name: string
          sections: Json
          slug: string
          sort_order: number
          style: string
          target_length: string
          tone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          include_stats?: boolean
          is_default?: boolean
          is_system?: boolean
          multi_read_aware?: boolean
          name: string
          sections?: Json
          slug: string
          sort_order?: number
          style?: string
          target_length?: string
          tone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          include_stats?: boolean
          is_default?: boolean
          is_system?: boolean
          multi_read_aware?: boolean
          name?: string
          sections?: Json
          slug?: string
          sort_order?: number
          style?: string
          target_length?: string
          tone?: string
          updated_at?: string
        }
        Relationships: []
      }
      share_events: {
        Row: {
          channel: string
          created_at: string
          id: string
          kind: string
          metadata: Json | null
          referrer_user_id: string | null
          source_id: string
          user_id: string | null
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          kind: string
          metadata?: Json | null
          referrer_user_id?: string | null
          source_id: string
          user_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          kind?: string
          metadata?: Json | null
          referrer_user_id?: string | null
          source_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_events_referrer_user_id_fkey"
            columns: ["referrer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_tiers: {
        Row: {
          bonus_points_monthly: number | null
          created_at: string | null
          display_name: string
          features: Json
          id: string
          is_active: boolean | null
          name: string
          price_monthly: number
          price_yearly: number | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          bonus_points_monthly?: number | null
          created_at?: string | null
          display_name: string
          features?: Json
          id?: string
          is_active?: boolean | null
          name: string
          price_monthly?: number
          price_yearly?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          bonus_points_monthly?: number | null
          created_at?: string | null
          display_name?: string
          features?: Json
          id?: string
          is_active?: boolean | null
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
          reason: string | null
          source_user_book_id: string
          target_user_book_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason?: string | null
          source_user_book_id: string
          target_user_book_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string | null
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
          hidden_from_home: boolean
          id: string
          is_pinned: boolean
          pinned_at: string | null
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
          hidden_from_home?: boolean
          id?: string
          is_pinned?: boolean
          pinned_at?: string | null
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
          hidden_from_home?: boolean
          id?: string
          is_pinned?: boolean
          pinned_at?: string | null
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
      user_subscriptions: {
        Row: {
          billing_cycle: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          payment_provider: string | null
          provider_subscription_id: string | null
          started_at: string | null
          status: string
          tier_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_cycle?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          payment_provider?: string | null
          provider_subscription_id?: string | null
          started_at?: string | null
          status?: string
          tier_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_cycle?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          payment_provider?: string | null
          provider_subscription_id?: string | null
          started_at?: string | null
          status?: string
          tier_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          ai_enabled: boolean | null
          avatar_url: string | null
          bio: string | null
          consent_date: string | null
          created_at: string | null
          email: string | null
          favorite_book: string | null
          favorite_quote: string | null
          id: string
          is_admin: boolean | null
          is_profile_public: boolean
          name: string
          onboarding_checklist: Json | null
          privacy_agreed: boolean | null
          reading_goal: number | null
          reading_speed_guide: Json | null
          terms_agreed: boolean | null
          ui_style: string | null
          updated_at: string | null
        }
        Insert: {
          ai_enabled?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          consent_date?: string | null
          created_at?: string | null
          email?: string | null
          favorite_book?: string | null
          favorite_quote?: string | null
          id: string
          is_admin?: boolean | null
          is_profile_public?: boolean
          name: string
          onboarding_checklist?: Json | null
          privacy_agreed?: boolean | null
          reading_goal?: number | null
          reading_speed_guide?: Json | null
          terms_agreed?: boolean | null
          ui_style?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_enabled?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          consent_date?: string | null
          created_at?: string | null
          email?: string | null
          favorite_book?: string | null
          favorite_quote?: string | null
          id?: string
          is_admin?: boolean | null
          is_profile_public?: boolean
          name?: string
          onboarding_checklist?: Json | null
          privacy_agreed?: boolean | null
          reading_goal?: number | null
          reading_speed_guide?: Json | null
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
      add_report_reaction: {
        Args: {
          p_anonymous_id?: string
          p_reaction_type: Database["public"]["Enums"]["report_reaction_type"]
          p_report_id: string
          p_user_id?: string
        }
        Returns: boolean
      }
      charge_payment_points: {
        Args: {
          p_description: string
          p_metadata?: Json
          p_order_id: string
          p_total_points: number
          p_user_id: string
        }
        Returns: Json
      }
      cleanup_expired_popular_books: { Args: never; Returns: number }
      cleanup_old_logs: { Args: never; Returns: undefined }
      cleanup_old_ocr_cache: { Args: { p_days?: number }; Returns: number }
      delete_group_atomic: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: Json
      }
      delete_tag_from_notes: {
        Args: { p_tag: string; p_user_id: string }
        Returns: number
      }
      earn_points_atomic: {
        Args: {
          p_action_type: Database["public"]["Enums"]["point_action_type"]
          p_description?: string
          p_metadata?: Json
          p_reference_id?: string
          p_reference_type?: string
          p_user_id: string
        }
        Returns: Json
      }
      get_bookshelves_with_stats: {
        Args: { p_user_id: string }
        Returns: {
          book_count: number
          completed_count: number
          created_at: string
          description: string
          id: string
          is_main: boolean
          is_public: boolean
          name: string
          not_started_count: number
          order: number
          paused_count: number
          reading_count: number
          rereading_count: number
          updated_at: string
          user_id: string
        }[]
      }
      get_daily_point_count: {
        Args: {
          p_action_type: Database["public"]["Enums"]["point_action_type"]
          p_date?: string
          p_user_id: string
        }
        Returns: number
      }
      get_feature_request_comment_count: {
        Args: { p_feature_request_id: string }
        Returns: number
      }
      get_report_reaction_counts: {
        Args: { p_report_id: string }
        Returns: {
          count: number
          reaction_type: Database["public"]["Enums"]["report_reaction_type"]
        }[]
      }
      get_user_completed_books_count: {
        Args: { p_user_id: string; p_year?: number }
        Returns: number
      }
      get_user_notes_count_this_week: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_report_reactions: {
        Args: {
          p_anonymous_id?: string
          p_report_id: string
          p_user_id?: string
        }
        Returns: {
          reaction_type: Database["public"]["Enums"]["report_reaction_type"]
        }[]
      }
      get_user_tags: {
        Args: { p_user_id: string }
        Returns: {
          tag: string
        }[]
      }
      get_user_tags_with_count: {
        Args: { p_user_id: string }
        Returns: {
          cnt: number
          tag: string
        }[]
      }
      increment_ocr_cache_hit: {
        Args: { p_image_hash: string }
        Returns: undefined
      }
      increment_report_view_count: {
        Args: { p_share_id: string }
        Returns: undefined
      }
      is_admin_user: { Args: never; Returns: boolean }
      is_first_purchase: { Args: { p_user_id: string }; Returns: boolean }
      rate_limit_check: {
        Args: { p_limit: number; p_token: string; p_window_seconds?: number }
        Returns: Json
      }
      rate_limit_cleanup: { Args: never; Returns: number }
      refund_payment_points: {
        Args: { p_order_id: string; p_total_points: number; p_user_id: string }
        Returns: Json
      }
      remove_report_reaction: {
        Args: {
          p_anonymous_id?: string
          p_reaction_type: Database["public"]["Enums"]["report_reaction_type"]
          p_report_id: string
          p_user_id?: string
        }
        Returns: boolean
      }
      spend_points_atomic: {
        Args: {
          p_action_type: Database["public"]["Enums"]["point_action_type"]
          p_cost: number
          p_description?: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      feature_request_status:
        | "requested"
        | "under_review"
        | "planned"
        | "in_progress"
        | "completed"
        | "declined"
      join_type: "open" | "approval" | "private"
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
        | "ai_report_spend"
        | "welcome_bonus"
        | "ai_chat_spend"
        | "ocr_spend"
        | "point_refund"
        | "point_purchase"
        | "feature_request_create"
        | "feature_request_vote"
        | "feature_request_adopted"
        | "referral_success"
        | "referral_bonus"
        | "group_create_spend"
        | "group_join_spend"
        | "bookshelf_create_spend"
        | "note_create_spend"
        | "referral_book_referrer"
        | "referral_book_referred"
        | "referral_note_referred"
      reading_status:
        | "reading"
        | "completed"
        | "paused"
        | "not_started"
        | "rereading"
      report_reaction_type: "impressive" | "want_to_read" | "insightful"
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
      join_type: ["open", "approval", "private"],
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
        "ai_report_spend",
        "welcome_bonus",
        "ai_chat_spend",
        "ocr_spend",
        "point_refund",
        "point_purchase",
        "feature_request_create",
        "feature_request_vote",
        "feature_request_adopted",
        "referral_success",
        "referral_bonus",
        "group_create_spend",
        "group_join_spend",
        "bookshelf_create_spend",
        "note_create_spend",
        "referral_book_referrer",
        "referral_book_referred",
        "referral_note_referred",
      ],
      reading_status: [
        "reading",
        "completed",
        "paused",
        "not_started",
        "rereading",
      ],
      report_reaction_type: ["impressive", "want_to_read", "insightful"],
    },
  },
} as const
