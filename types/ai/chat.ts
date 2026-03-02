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
    id: string;  // user_books.id (책 상세 페이지 라우팅용)
    title: string;
    author: string | null;
    cover_image_url: string | null;
    status: string;
    started_at: string;
    completed_at: string | null;
  }[];
  recentNotes?: {
    id: string;
    type: string;
    content: string | null;
    book_title: string;
    book_id?: string;  // user_books.id (책 상세 페이지 라우팅용)
    book_cover_image_url?: string | null;
    created_at: string;
  }[];
  readingGoal?: {
    goal: number;
    completed: number;
    progress: number;
  };
  memories?: {
    memory_type: string;
    content: string;
  }[];
}

// 스트리밍 응답 타입
export interface StreamingChatResponse {
  type: "content" | "error" | "done";
  content?: string;
  error?: string;
  messageId?: string;
}

// 대화 모드 타입
export type ChatMode = "general" | "discuss" | "recommend" | "coaching" | "quiz";

// 대화 모드 정보
export const CHAT_MODE_INFO: Record<ChatMode, { label: string; description: string; icon: string }> = {
  general: { label: "자유 대화", description: "독서에 대해 자유롭게 이야기해요", icon: "MessageCircle" },
  discuss: { label: "책 토론", description: "읽은 책에 대해 깊이 토론해요", icon: "MessagesSquare" },
  recommend: { label: "책 추천", description: "맞춤 책 추천을 받아보세요", icon: "BookMarked" },
  coaching: { label: "독서 코칭", description: "독서 습관과 목표를 관리해요", icon: "Target" },
  quiz: { label: "독서 퀴즈", description: "읽은 책으로 퀴즈를 풀어봐요", icon: "BrainCircuit" },
};

// 채팅 요청 타입
export interface SendMessageRequest {
  sessionId?: string;
  message: string;
  mode?: ChatMode;
}

// 채팅 응답 타입
export interface SendMessageResponse {
  sessionId: string;
  messageId: string;
  content: string;
}
