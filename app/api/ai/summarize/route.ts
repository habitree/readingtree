/**
 * AI Summarize API Route
 * 텍스트 요약 API 엔드포인트
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { summarizeWithGemini } from "@/lib/ai/providers/gemini";
import { summarizeWithOpenAI } from "@/lib/ai/providers/openai";
import { checkRateLimit } from "@/lib/middleware/rate-limit";

// 요약 요청 타입
interface SummarizeRequest {
  text: string;
  provider?: "gemini" | "openai" | "auto";
  maxLength?: number;
  type?: "book" | "general";
}

// 요약 응답 타입
interface SummarizeResponse {
  success: boolean;
  summary?: string;
  error?: string;
  provider?: string;
  inputLength?: number;
  outputLength?: number;
}

/**
 * POST /api/ai/summarize
 * 텍스트를 AI로 요약하는 API
 */
export async function POST(request: NextRequest): Promise<NextResponse<SummarizeResponse>> {
  try {
    // Rate Limiting (분당 30회)
    const rateLimitResult = await checkRateLimit(request, 30);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    // 인증 확인
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const body: SummarizeRequest = await request.json();

    // 입력 검증
    if (!body.text || typeof body.text !== "string") {
      return NextResponse.json(
        { success: false, error: "요약할 텍스트가 필요합니다." },
        { status: 400 }
      );
    }

    const text = body.text.trim();

    // 텍스트가 너무 짧은 경우
    if (text.length < 10) {
      return NextResponse.json({
        success: true,
        summary: text,
        provider: "none",
        inputLength: text.length,
        outputLength: text.length,
      });
    }

    // 텍스트가 이미 충분히 짧은 경우
    const maxLength = body.maxLength || 35;
    if (text.length <= maxLength) {
      return NextResponse.json({
        success: true,
        summary: text,
        provider: "none",
        inputLength: text.length,
        outputLength: text.length,
      });
    }

    // Provider 선택
    const provider = body.provider || "auto";
    let summary: string;
    let usedProvider: string;

    try {
      if (provider === "openai") {
        summary = await summarizeWithOpenAI(text);
        usedProvider = "openai";
      } else if (provider === "gemini") {
        summary = await summarizeWithGemini(text);
        usedProvider = "gemini";
      } else {
        // auto: Gemini를 먼저 시도하고, 실패하면 OpenAI로 fallback
        try {
          summary = await summarizeWithGemini(text);
          usedProvider = "gemini";
        } catch (geminiError) {
          console.warn("[Summarize API] Gemini 실패, OpenAI로 fallback:", geminiError);
          try {
            summary = await summarizeWithOpenAI(text);
            usedProvider = "openai";
          } catch (openaiError) {
            console.error("[Summarize API] OpenAI도 실패:", openaiError);
            // 모든 Provider가 실패하면 단순 잘라내기
            summary = truncateText(text, maxLength);
            usedProvider = "truncate";
          }
        }
      }
    } catch (providerError) {
      console.error("[Summarize API] Provider 오류:", providerError);
      summary = truncateText(text, maxLength);
      usedProvider = "truncate";
    }

    return NextResponse.json({
      success: true,
      summary,
      provider: usedProvider,
      inputLength: text.length,
      outputLength: summary.length,
    });
  } catch (error) {
    console.error("[Summarize API] 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "요약 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * 텍스트 단순 잘라내기 (Fallback)
 * @param text 원본 텍스트
 * @param maxLength 최대 길이
 * @returns 잘린 텍스트
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  // 마침표, 쉼표, 공백 등 자연스러운 경계에서 자르기
  const truncated = text.slice(0, maxLength);
  const lastPeriod = truncated.lastIndexOf(".");
  const lastComma = truncated.lastIndexOf(",");
  const lastSpace = truncated.lastIndexOf(" ");

  // 마침표가 있고 최대 길이의 60% 이상인 경우
  if (lastPeriod > maxLength * 0.6) {
    return truncated.slice(0, lastPeriod + 1);
  }

  // 쉼표가 있고 최대 길이의 70% 이상인 경우
  if (lastComma > maxLength * 0.7) {
    return truncated.slice(0, lastComma) + "...";
  }

  // 공백이 있고 최대 길이의 80% 이상인 경우
  if (lastSpace > maxLength * 0.8) {
    return truncated.slice(0, lastSpace) + "...";
  }

  // 그 외에는 그냥 잘라내기
  return truncated.slice(0, maxLength - 3) + "...";
}

/**
 * GET /api/ai/summarize
 * API 정보 반환
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: "/api/ai/summarize",
    method: "POST",
    description: "AI 텍스트 요약 API",
    parameters: {
      text: {
        type: "string",
        required: true,
        description: "요약할 텍스트",
      },
      provider: {
        type: "string",
        required: false,
        enum: ["gemini", "openai", "auto"],
        default: "auto",
        description: "사용할 AI Provider",
      },
      maxLength: {
        type: "number",
        required: false,
        default: 35,
        description: "요약 최대 길이",
      },
      type: {
        type: "string",
        required: false,
        enum: ["book", "general"],
        default: "general",
        description: "요약 유형",
      },
    },
    response: {
      success: "boolean",
      summary: "string",
      provider: "string",
      inputLength: "number",
      outputLength: "number",
      error: "string (on failure)",
    },
  });
}
