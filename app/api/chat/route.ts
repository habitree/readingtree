/**
 * AI 챗봇 API Route (스트리밍 SSE)
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateSystemPrompt } from "@/lib/api/chat-prompts";
import type { ChatContext, ChatMessage } from "@/types/chat";

// Gemini API 클라이언트
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.");
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, message, context } = body as {
      sessionId: string;
      message: string;
      context?: ChatContext;
    };

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: "sessionId와 message가 필요합니다." },
        { status: 400 }
      );
    }

    // 사용자 인증 확인
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 세션 소유자 확인
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("id, user_id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "채팅 세션을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 이전 메시지 조회 (컨텍스트용, 최근 10개)
    const { data: previousMessages } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(10);

    // 사용자 메시지 저장
    const { data: userMessage, error: userMessageError } = await supabase
      .from("chat_messages")
      .insert({
        session_id: sessionId,
        role: "user",
        content: message,
      })
      .select()
      .single();

    if (userMessageError) {
      console.error("사용자 메시지 저장 실패:", userMessageError);
    }

    // 시스템 프롬프트 생성
    const systemPrompt = generateSystemPrompt(context || {});

    // Gemini API 호출 (스트리밍)
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 대화 기록 구성
    const chatHistory = (previousMessages || [])
      .reverse()
      .map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

    // 스트리밍 응답 생성
    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const chat = model.startChat({
            history: chatHistory,
            systemInstruction: systemPrompt,
            generationConfig: {
              maxOutputTokens: 2048,
              temperature: 0.7,
            },
          });

          const result = await chat.sendMessageStream(message);

          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              fullResponse += chunkText;

              // SSE 형식으로 전송
              const data = JSON.stringify({ type: "content", content: chunkText });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // AI 응답 저장
          const { data: assistantMessage, error: assistantError } = await supabase
            .from("chat_messages")
            .insert({
              session_id: sessionId,
              role: "assistant",
              content: fullResponse,
            })
            .select()
            .single();

          if (assistantError) {
            console.error("AI 응답 저장 실패:", assistantError);
          }

          // 세션 업데이트
          await supabase
            .from("chat_sessions")
            .update({
              last_message_at: new Date().toISOString(),
            })
            .eq("id", sessionId);

          // 메시지 수 직접 조회 후 업데이트
          const { count } = await supabase
            .from("chat_messages")
            .select("*", { count: "exact", head: true })
            .eq("session_id", sessionId);

          await supabase
            .from("chat_sessions")
            .update({ message_count: count || 0 })
            .eq("id", sessionId);

          // 완료 신호
          const doneData = JSON.stringify({
            type: "done",
            messageId: assistantMessage?.id,
          });
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
          controller.close();
        } catch (error) {
          console.error("스트리밍 오류:", error);
          const errorData = JSON.stringify({
            type: "error",
            error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("채팅 API 오류:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
