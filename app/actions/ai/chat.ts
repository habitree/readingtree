"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/app/actions/auth";
import type { Database } from "@/types/database";
import type {
  ChatSession,
  ChatMessage,
  ChatContext,
} from "@/types/ai";

type ChatSessionRow = Database["public"]["Tables"]["chat_sessions"]["Row"];
type ChatMessageRow = Database["public"]["Tables"]["chat_messages"]["Row"];

/**
 * 새 채팅 세션 생성
 */
export async function createChatSession(title?: string): Promise<ChatSession> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: user.id,
      title: title || "새 대화",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`채팅 세션 생성 실패: ${error.message}`);
  }

  return data as ChatSession;
}

/**
 * 채팅 세션 목록 조회
 */
export async function getChatSessions(): Promise<ChatSession[]> {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("last_message_at", { ascending: false });

  if (error) {
    throw new Error(`채팅 세션 목록 조회 실패: ${error.message}`);
  }

  return (data || []) as ChatSession[];
}

/**
 * 채팅 세션 상세 조회 (메시지 포함)
 */
export async function getChatSession(sessionId: string): Promise<{
  session: ChatSession;
  messages: ChatMessage[];
} | null> {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const supabase = await createServerSupabaseClient();

  // 세션 조회
  const { data: session, error: sessionError } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (sessionError || !session) {
    return null;
  }

  // 메시지 조회
  const { data: messages, error: messagesError } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (messagesError) {
    throw new Error(`메시지 조회 실패: ${messagesError.message}`);
  }

  return {
    session: session as ChatSession,
    messages: (messages || []) as ChatMessage[],
  };
}

/**
 * 채팅 세션 삭제
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`채팅 세션 삭제 실패: ${error.message}`);
  }
}

/**
 * 모든 채팅 세션 삭제
 */
export async function deleteAllChatSessions(): Promise<{ deletedCount: number }> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const supabase = await createServerSupabaseClient();

  // 먼저 세션 수 확인
  const { count } = await supabase
    .from("chat_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  // 모든 세션 삭제 (CASCADE로 메시지도 자동 삭제)
  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`채팅 기록 삭제 실패: ${error.message}`);
  }

  return { deletedCount: count || 0 };
}

/**
 * 개별 채팅 메시지 삭제
 */
export async function deleteChatMessage(messageId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const supabase = await createServerSupabaseClient();

  // 메시지가 사용자의 세션에 속하는지 확인 후 삭제
  const { data: message, error: fetchError } = await supabase
    .from("chat_messages")
    .select("session_id")
    .eq("id", messageId)
    .single();

  if (fetchError || !message) {
    throw new Error("메시지를 찾을 수 없습니다.");
  }

  // 세션이 사용자의 것인지 확인
  const { data: session, error: sessionError } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("id", message.session_id)
    .eq("user_id", user.id)
    .single();

  if (sessionError || !session) {
    throw new Error("권한이 없습니다.");
  }

  // 메시지 삭제
  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .eq("id", messageId);

  if (error) {
    throw new Error(`메시지 삭제 실패: ${error.message}`);
  }
}

/**
 * 채팅 세션 제목 업데이트
 */
export async function updateChatSessionTitle(
  sessionId: string,
  title: string
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("chat_sessions")
    .update({ title })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`채팅 세션 제목 업데이트 실패: ${error.message}`);
  }
}

/**
 * 메시지 저장
 */
export async function saveMessage(
  sessionId: string,
  role: "user" | "assistant" | "system",
  content: string,
  contextBooks?: string[],
  contextNotes?: string[]
): Promise<ChatMessage> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const supabase = await createServerSupabaseClient();

  // 메시지 저장
  const { data: message, error: messageError } = await supabase
    .from("chat_messages")
    .insert({
      session_id: sessionId,
      role,
      content,
      context_books: contextBooks || null,
      context_notes: contextNotes || null,
    })
    .select()
    .single();

  if (messageError) {
    throw new Error(`메시지 저장 실패: ${messageError.message}`);
  }

  // 세션 업데이트 (마지막 메시지 시간, 메시지 수)
  const { error: sessionError } = await supabase
    .from("chat_sessions")
    .update({
      last_message_at: new Date().toISOString(),
      message_count: supabase.rpc("increment_message_count", {
        session_id: sessionId,
      }),
    })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  // 세션 업데이트 실패해도 메시지는 저장됨
  if (sessionError) {
    console.error("세션 업데이트 실패:", sessionError);
  }

  return message as ChatMessage;
}

/**
 * 메시지 수 증가 (RPC 대신 직접 업데이트)
 */
export async function incrementMessageCount(sessionId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    return;
  }

  const supabase = await createServerSupabaseClient();

  // 현재 메시지 수 조회 후 증가
  const { data: session } = await supabase
    .from("chat_sessions")
    .select("message_count")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (session) {
    await supabase
      .from("chat_sessions")
      .update({
        message_count: (session.message_count || 0) + 1,
        last_message_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .eq("user_id", user.id);
  }
}

/**
 * 채팅 컨텍스트 조회 (AI에게 전달할 사용자 데이터)
 */
export async function getChatContext(): Promise<ChatContext> {
  const user = await getCurrentUser();
  if (!user) {
    return {};
  }

  const supabase = await createServerSupabaseClient();

  // 페르소나 조회
  const { data: persona } = await supabase
    .from("user_personas")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // 최근 읽고 있는 책 조회 (최근 5권)
  const { data: recentBooks } = await supabase
    .from("user_books")
    .select(`
      id,
      status,
      started_at,
      completed_at,
      books (
        id,
        title,
        author
      )
    `)
    .eq("user_id", user.id)
    .in("status", ["reading", "completed"])
    .order("updated_at", { ascending: false })
    .limit(5);

  // 최근 기록 조회 (최근 10개)
  const { data: recentNotes } = await supabase
    .from("notes")
    .select(`
      id,
      type,
      content,
      created_at,
      books (
        title
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // 독서 목표 조회
  const { data: profile } = await supabase
    .from("users")
    .select("reading_goal")
    .eq("id", user.id)
    .single();

  // 올해 완독한 책 수
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1).toISOString();
  const { count: completedCount } = await supabase
    .from("user_books")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "completed")
    .gte("completed_at", startOfYear);

  const context: ChatContext = {};

  // 페르소나 정보
  if (persona) {
    context.persona = {
      reading_pace: persona.reading_pace,
      note_style: persona.note_style,
      activity_pattern: persona.activity_pattern,
      group_engagement: persona.group_engagement,
      persona_summary: persona.persona_summary,
      category_preferences: persona.category_preferences as any,
      reading_stats: persona.reading_stats as any,
    };
  }

  // 최근 책 정보
  if (recentBooks && recentBooks.length > 0) {
    context.recentBooks = recentBooks.map((ub: any) => ({
      id: ub.id,
      title: ub.books?.title || "알 수 없는 책",
      author: ub.books?.author || null,
      status: ub.status,
      started_at: ub.started_at,
      completed_at: ub.completed_at,
    }));
  }

  // 최근 기록 정보
  if (recentNotes && recentNotes.length > 0) {
    context.recentNotes = recentNotes.map((note: any) => ({
      id: note.id,
      type: note.type,
      content: note.content,
      book_title: note.books?.title || "알 수 없는 책",
      created_at: note.created_at,
    }));
  }

  // 독서 목표 정보
  if (profile?.reading_goal) {
    const goal = profile.reading_goal;
    const completed = completedCount || 0;
    context.readingGoal = {
      goal,
      completed,
      progress: goal > 0 ? Math.round((completed / goal) * 100) : 0,
    };
  }

  return context;
}

/**
 * 세션의 첫 메시지로 제목 자동 생성
 */
export async function generateSessionTitle(
  sessionId: string,
  firstMessage: string
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    return;
  }

  // 첫 메시지에서 제목 추출 (최대 30자)
  let title = firstMessage.trim();
  if (title.length > 30) {
    title = title.substring(0, 27) + "...";
  }

  const supabase = await createServerSupabaseClient();

  await supabase
    .from("chat_sessions")
    .update({ title })
    .eq("id", sessionId)
    .eq("user_id", user.id);
}
