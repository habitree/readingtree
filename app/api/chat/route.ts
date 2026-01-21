/**
 * AI 챗봇 API Route (스트리밍 SSE)
 *
 * 다중 AI 모델 지원:
 * - OpenAI (GPT-4o, GPT-4o-mini, GPT-4 Turbo, GPT-3.5 Turbo)
 * - Google (Gemini 1.5 Flash, Gemini 1.5 Pro, Gemini 2.0 Flash)
 * - Anthropic (Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku)
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateDynamicSystemPrompt } from "@/lib/api/chat-prompts";
import { getAISettingsForChat } from "@/app/actions/ai-settings";
import type { ChatContext } from "@/types/chat";
import type { AIProvider } from "@/types/ai-settings";

// OpenAI API 호출
async function callOpenAI(
  modelId: string,
  systemPrompt: string,
  chatHistory: { role: string; content: string }[],
  message: string,
  settings: { temperature: number; maxOutputTokens: number }
): Promise<ReadableStream> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.");
  }

  const messages = [
    { role: "system", content: systemPrompt },
    ...chatHistory.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    })),
    { role: "user", content: message },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      max_tokens: settings.maxOutputTokens,
      temperature: settings.temperature,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "OpenAI API 오류");
  }

  return response.body!;
}

// Anthropic API 호출
async function callAnthropic(
  modelId: string,
  systemPrompt: string,
  chatHistory: { role: string; content: string }[],
  message: string,
  settings: { temperature: number; maxOutputTokens: number }
): Promise<ReadableStream> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다.");
  }

  const messages = [
    ...chatHistory.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    })),
    { role: "user", content: message },
  ];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: modelId,
      system: systemPrompt,
      messages,
      max_tokens: settings.maxOutputTokens,
      temperature: settings.temperature,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Anthropic API 오류");
  }

  return response.body!;
}

// OpenAI 스트림 파서 (Promise 반환으로 수정)
async function parseOpenAIStream(
  stream: ReadableStream,
  onContent: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            onDone();
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              onContent(content);
            }
          } catch (e) {
            // 파싱 오류 무시
          }
        }
      }
    }
    onDone();
  } catch (error) {
    onError(error instanceof Error ? error.message : "스트림 오류");
  }
}

// Anthropic 스트림 파서 (Promise 반환으로 수정)
async function parseAnthropicStream(
  stream: ReadableStream,
  onContent: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "content_block_delta") {
              const text = parsed.delta?.text;
              if (text) {
                onContent(text);
              }
            } else if (parsed.type === "message_stop") {
              onDone();
            }
          } catch (e) {
            // 파싱 오류 무시
          }
        }
      }
    }
    onDone();
  } catch (error) {
    onError(error instanceof Error ? error.message : "스트림 오류");
  }
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

    // AI 설정 조회
    const aiSettings = await getAISettingsForChat();

    // 이전 메시지 조회 (컨텍스트용)
    const { data: previousMessages } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(aiSettings.contextSettings.maxHistoryMessages);

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

    // 시스템 프롬프트 생성 (동적)
    const systemPrompt = generateDynamicSystemPrompt(
      aiSettings.systemPromptTemplate,
      context || {},
      aiSettings.contextSettings
    );

    // 대화 기록 구성
    const chatHistory = (previousMessages || [])
      .reverse()
      .map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }));

    // 스트리밍 응답 생성
    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        const sendData = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          const { provider, modelId, generationSettings } = aiSettings;

          if (provider === "google") {
            // Google Gemini 처리
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
              throw new Error("GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.");
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: modelId });

            const geminiHistory = chatHistory.map((msg: any) => ({
              role: msg.role === "assistant" ? "model" : "user",
              parts: [{ text: msg.content }],
            }));

            const chat = model.startChat({
              history: geminiHistory,
              systemInstruction: {
                role: "user",
                parts: [{ text: systemPrompt }],
              },
              generationConfig: {
                maxOutputTokens: generationSettings.maxOutputTokens,
                temperature: generationSettings.temperature,
                topP: generationSettings.topP,
              },
            });

            const result = await chat.sendMessageStream(message);

            for await (const chunk of result.stream) {
              const chunkText = chunk.text();
              if (chunkText) {
                fullResponse += chunkText;
                sendData({ type: "content", content: chunkText });
              }
            }
          } else if (provider === "openai") {
            // OpenAI 처리
            const openaiStream = await callOpenAI(
              modelId,
              systemPrompt,
              chatHistory,
              message,
              {
                temperature: generationSettings.temperature,
                maxOutputTokens: generationSettings.maxOutputTokens,
              }
            );

            await parseOpenAIStream(
              openaiStream,
              (text) => {
                fullResponse += text;
                sendData({ type: "content", content: text });
              },
              () => {},
              (error) => {
                throw new Error(error);
              }
            );
          } else if (provider === "anthropic") {
            // Anthropic 처리
            const anthropicStream = await callAnthropic(
              modelId,
              systemPrompt,
              chatHistory,
              message,
              {
                temperature: generationSettings.temperature,
                maxOutputTokens: generationSettings.maxOutputTokens,
              }
            );

            await parseAnthropicStream(
              anthropicStream,
              (text) => {
                fullResponse += text;
                sendData({ type: "content", content: text });
              },
              () => {},
              (error) => {
                throw new Error(error);
              }
            );
          } else {
            throw new Error(`지원하지 않는 AI 제공자: ${provider}`);
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
          sendData({
            type: "done",
            messageId: assistantMessage?.id,
          });
          controller.close();
        } catch (error) {
          console.error("스트리밍 오류:", error);
          sendData({
            type: "error",
            error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
          });
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
