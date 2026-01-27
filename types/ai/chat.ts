/**
 * AI 챗봇 관련 타입 정의
 */

import type { Database } from "../database";
import type { CategoryPreference, ReadingStats } from "./persona";

// persona에서 re-export (하위 호환성)
export type { CategoryPreference, ReadingStats } from "./persona";

// 기본 타입
export type ChatSession = Database["public"]["Tables"]["chat_sessions"]["Row"];
export type ChatSessionInsert = Database["public"]["Tables"]["chat_sessions"]["Insert"];
export type ChatSessionUpdate = Database["public"]["Tables"]["chat_sessions"]["Update"];

export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];
export type ChatMessageInsert = Database["public"]["Tables"]["chat_messages"]["Insert"];
export type ChatMessageUpdate = Database["public"]["Tables"]["chat_messages"]["Update"];

// 확장 타입
export interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[];
}

export interface ChatSessionWithLastMessage extends ChatSession {
  lastMessage?: ChatMessage;
}

// 메시지 역할
export type MessageRole = "user" | "assistant" | "system";

// 채팅 컨텍스트 (AI에게 전달할 사용자 데이터)
export interface ChatContext {
  persona?: {
    reading_pace?: string | null;
    note_style?: string | null;
    activity_pattern?: string | null;
    group_engagement?: string | null;
    persona_summary?: string | null;
    category_preferences?: CategoryPreference[];
    reading_stats?: ReadingStats;
  };
  recentBooks?: {
    id: string;
    title: string;
    author: string | null;
    status: string;
    started_at: string;
    completed_at: string | null;
  }[];
  recentNotes?: {
    id: string;
    type: string;
    content: string | null;
    book_title: string;
    book_id?: string;  // 책 페이지로 연결하기 위한 ID
    created_at: string;
  }[];
  readingGoal?: {
    goal: number;
    completed: number;
    progress: number;
  };
}

// 스트리밍 응답 타입
export interface StreamingChatResponse {
  type: "content" | "error" | "done";
  content?: string;
  error?: string;
  messageId?: string;
}

// 채팅 요청 타입
export interface SendMessageRequest {
  sessionId?: string;
  message: string;
}

// 채팅 응답 타입
export interface SendMessageResponse {
  sessionId: string;
  messageId: string;
  content: string;
}
