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
import { generateDynamicSystemPrompt } from "@/lib/ai/prompts/chat-prompts";
import { getAISettingsForChat } from "@/app/actions/ai/settings";
import { callOpenAI, parseOpenAIStream } from "@/lib/ai/providers/openai";
import { callAnthropic, parseAnthropicStream } from "@/lib/ai/providers/anthropic";
import { checkRateLimit } from "@/lib/middleware/rate-limit";
import { processRecommendedBooks } from "@/lib/ai/utils/book-registration";
import { checkFeatureAccess } from "@/app/actions/subscription";
import type { ChatContext, ChatMode } from "@/types/ai/chat";
import type { AIProvider } from "@/types/ai/settings";
import { MEMORY_EXTRACTION_PROMPT } from "@/lib/ai/prompts/memory-prompts";

export async function POST(request: NextRequest) {
  try {
    // Rate Limiting (분당 20회 - AI API 비용 보호)
    const rateLimitResult = await checkRateLimit(request, 20);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { sessionId, message, context, mode } = body as {
      sessionId: string;
      message: string;
      context?: ChatContext;
      mode?: ChatMode;
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

    // AI 채팅 사용 한도 체크
    const access = await checkFeatureAccess("ai_chat", user);
    if (!access.allowed) {
      const msg = access.canUseWithPoints
        ? `이번 달 AI 채팅 한도(${access.limit}회)에 도달했습니다. ${access.pointCost}P로 추가 사용할 수 있습니다.`
        : `이번 달 AI 채팅 한도(${access.limit}회)에 도달했습니다.`;
      return NextResponse.json(
        { error: msg },
        { status: 403 }
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

    // 시스템 프롬프트 생성 (동적, 모드 포함)
    const systemPrompt = generateDynamicSystemPrompt(
      aiSettings.systemPromptTemplate,
      context || {},
      aiSettings.contextSettings,
      mode
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

    // 클라이언트 연결 해제 시 AI API 스트림을 중단하기 위한 AbortController
    const abortController = new AbortController();

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
              // 클라이언트 연결 해제 시 스트림 반복 중단
              if (abortController.signal.aborted) break;

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
              },
              abortController.signal
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
              },
              abortController.signal
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

          // 추천 책 자동 등록 처리 ([[recommend:...]] → [[book:...]])
          let processedResponse = fullResponse;
          try {
            processedResponse = await processRecommendedBooks(fullResponse, user.id);
          } catch (error) {
            console.error("추천 책 처리 실패 (원본 저장):", error);
          }

          // AI 응답 저장 (처리된 버전)
          const { data: assistantMessage, error: assistantError } = await supabase
            .from("chat_messages")
            .insert({
              session_id: sessionId,
              role: "assistant",
              content: processedResponse,
            })
            .select()
            .single();

          if (assistantError) {
            console.error("AI 응답 저장 실패:", assistantError);
          }

          // 세션 업데이트 (메시지 수 계산: 이전 메시지 + 사용자 메시지 + AI 응답)
          const newMessageCount = (previousMessages?.length || 0) + 2;
          await supabase
            .from("chat_sessions")
            .update({
              last_message_at: new Date().toISOString(),
              message_count: newMessageCount,
            })
            .eq("id", sessionId);

          // 완료 신호 (processedContent 포함)
          sendData({
            type: "done",
            messageId: assistantMessage?.id,
            processedContent: processedResponse !== fullResponse ? processedResponse : undefined,
          });

          // 장기 기억 추출 (fire-and-forget, 응답 지연 없음)
          if (aiSettings.memorySettings.enableLongTermMemory) {
            extractAndSaveMemories(
              user.id,
              message,
              processedResponse,
              context?.memories || [],
              aiSettings
            ).catch((err) => console.error("메모리 추출 실패:", err));
          }

          controller.close();
        } catch (error) {
          // AbortError는 클라이언트 연결 해제로 인한 정상 중단이므로 무시
          if (error instanceof Error && error.name === "AbortError") {
            console.log("클라이언트 연결 해제로 AI 스트림 중단");
            controller.close();
            return;
          }

          console.error("스트리밍 오류:", error);
          sendData({
            type: "error",
            error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
          });
          controller.close();
        }
      },

      // 클라이언트 연결 해제 시 호출 (브라우저 탭 닫기 등)
      cancel() {
        abortController.abort();
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

/**
 * 장기 기억 추출 및 저장 (fire-and-forget)
 * 저렴한 모델(gemini-2.0-flash)로 대화를 분석하여 기억할 정보를 추출
 */
async function extractAndSaveMemories(
  userId: string,
  userMessage: string,
  aiResponse: string,
  existingMemories: { memory_type: string; content: string }[],
  aiSettings: { provider: AIProvider; memorySettings: { maxMemoryItems: number } }
): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const existingStr = existingMemories.length > 0
    ? existingMemories.map((m) => `- [${m.memory_type}] ${m.content}`).join("\n")
    : "(없음)";

  const conversation = `사용자: ${userMessage}\n독서친구: ${aiResponse}`;

  const prompt = MEMORY_EXTRACTION_PROMPT
    .replace("{existing_memories}", existingStr)
    .replace("{conversation}", conversation);

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // JSON 파싱 시도
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return;

  let memories: { memory_type: string; content: string; confidence: number }[];
  try {
    memories = JSON.parse(jsonMatch[0]);
  } catch {
    return; // JSON 파싱 실패 시 무시
  }

  if (!Array.isArray(memories) || memories.length === 0) return;

  // confidence 0.7 이상만 저장
  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabaseClient();

  for (const mem of memories) {
    if (mem.confidence < 0.7) continue;

    // 동일 내용 중복 체크
    const { data: existing } = await supabase
      .from("user_ai_memories")
      .select("id")
      .eq("user_id", userId)
      .eq("memory_type", mem.memory_type)
      .eq("content", mem.content)
      .limit(1);

    if (existing && existing.length > 0) continue;

    // 최대 개수 체크
    const { count } = await supabase
      .from("user_ai_memories")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (count && count >= aiSettings.memorySettings.maxMemoryItems) {
      // 가장 오래된 메모리 삭제
      const { data: oldest } = await supabase
        .from("user_ai_memories")
        .select("id")
        .eq("user_id", userId)
        .order("updated_at", { ascending: true })
        .limit(1);

      if (oldest?.[0]) {
        await supabase.from("user_ai_memories").delete().eq("id", oldest[0].id);
      }
    }

    await supabase.from("user_ai_memories").insert({
      user_id: userId,
      memory_type: mem.memory_type,
      content: mem.content,
      metadata: { confidence: mem.confidence, source: "auto_extract" },
    });
  }
}
