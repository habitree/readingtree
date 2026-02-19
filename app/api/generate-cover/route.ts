import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOpenAIClient } from "@/lib/ai/providers/openai";
import { checkRateLimit } from "@/lib/middleware/rate-limit";
import { DEFAULT_COVER_PROMPTS } from "@/lib/constants/default-covers";

/**
 * 관리자용 기본 표지 배치 생성 API
 * DALL-E 3로 Readtree 기록용 공용 표지 이미지를 일괄 생성합니다.
 * 생성된 이미지는 images/covers/default/ 에 저장됩니다.
 *
 * POST /api/generate-cover
 * Body: { count?: number } — 생성할 이미지 수 (기본값: 전체 프롬프트 수)
 */
export async function POST(request: NextRequest) {
  // Rate Limiting (분당 3회 - 관리자 전용, 비용 보호)
  const rateLimitResult = await checkRateLimit(request, 3);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  try {
    const supabase = await createServerSupabaseClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 관리자 확인 (admin 테이블 또는 이메일 기반)
    const { data: adminCheck } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminCheck) {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const count = Math.min(body.count || DEFAULT_COVER_PROMPTS.length, DEFAULT_COVER_PROMPTS.length);

    const openai = getOpenAIClient();
    const results: { index: number; path: string; publicUrl: string }[] = [];
    const errors: { index: number; error: string }[] = [];

    for (let i = 0; i < count; i++) {
      const { prompt, fileName } = DEFAULT_COVER_PROMPTS[i];

      try {
        // 이미 존재하는지 확인
        const filePath = `covers/default/${fileName}`;
        const { data: existing } = await supabase.storage
          .from("images")
          .list("covers/default", { search: fileName });

        if (existing && existing.length > 0) {
          const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(filePath);
          results.push({ index: i, path: filePath, publicUrl });
          console.log(`[generate-cover] 이미 존재: ${fileName}`);
          continue;
        }

        // DALL-E 3 호출
        const imageResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt,
          size: "1024x1024",
          quality: "standard",
          n: 1,
        });

        const generatedUrl = imageResponse.data?.[0]?.url;
        if (!generatedUrl) {
          errors.push({ index: i, error: "이미지 생성 실패" });
          continue;
        }

        // 이미지 다운로드
        const imageRes = await fetch(generatedUrl);
        if (!imageRes.ok) {
          errors.push({ index: i, error: "이미지 다운로드 실패" });
          continue;
        }

        const imageBuffer = await imageRes.arrayBuffer();

        // Supabase Storage 업로드
        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(filePath, new Uint8Array(imageBuffer), {
            contentType: "image/png",
            cacheControl: "31536000", // 1년 캐시
            upsert: true,
          });

        if (uploadError) {
          errors.push({ index: i, error: uploadError.message });
          continue;
        }

        const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(filePath);
        results.push({ index: i, path: filePath, publicUrl });
        console.log(`[generate-cover] 생성 완료: ${fileName}`);
      } catch (error) {
        errors.push({ index: i, error: error instanceof Error ? error.message : String(error) });
      }
    }

    return NextResponse.json({
      success: true,
      generated: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[generate-cover] API 오류:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: "표지 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
