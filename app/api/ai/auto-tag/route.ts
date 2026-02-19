/**
 * AI Auto-Tag API Route
 * 노트 내용을 분석하여 태그를 추천하는 API
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/middleware/rate-limit";
import { generateAutoTags } from "@/lib/ai/auto-tagging";
import { getUserTags } from "@/app/actions/notes";

interface AutoTagRequest {
  noteId?: string;
  content: string;
}

interface AutoTagResponse {
  success: boolean;
  tags?: string[];
  error?: string;
  provider?: string;
  duration?: number;
}

/**
 * POST /api/ai/auto-tag
 * 노트 내용으로 태그 추천
 */
export async function POST(request: NextRequest): Promise<NextResponse<AutoTagResponse>> {
  try {
    // Rate Limiting (분당 20회)
    const rateLimitResult = await checkRateLimit(request, 20);
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
    const body: AutoTagRequest = await request.json();

    if (!body.content || typeof body.content !== "string" || body.content.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: "태그를 추천하려면 최소 10자 이상의 내용이 필요합니다." },
        { status: 400 }
      );
    }

    // 사용자의 기존 태그 조회 (일관성을 위해)
    const existingTags = await getUserTags(user);

    // AI 태그 생성
    const result = await generateAutoTags(body.content.trim(), existingTags);

    if (result.tags.length === 0) {
      return NextResponse.json({
        success: true,
        tags: [],
        provider: result.provider,
        duration: result.duration,
      });
    }

    return NextResponse.json({
      success: true,
      tags: result.tags,
      provider: result.provider,
      duration: result.duration,
    });
  } catch (error) {
    console.error("[Auto-Tag API] 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "태그 추천 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
